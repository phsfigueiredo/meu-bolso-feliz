import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Expense, Income, FamilyProfile, ExpenseType, ExpenseCategory, FinancialHealth } from '@/types/finance';
import { storage as api } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export function useFinances() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [profiles, setProfiles] = useState<FamilyProfile[]>([]);
  const [debtGroups, setDebtGroups] = useState<string[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);

  const [selectedProfileId, setSelectedProfileId] = useState<string | 'all'>('all');
  // Padrão: mês/ano corrente (a UI arranca já no período atual)
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const loadedOnceRef = useRef(false);

  const reloadAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const s = await api.getState();
      setProfiles(s.profiles);
      setIncomes(s.incomes);
      setExpenses(s.expenses);
      setDebtGroups(s.debtGroups);
      setCategories(s.categories ?? []);
      setLastSaved(s.lastSaved ? new Date(s.lastSaved) : null);
      setApiError(null);
      loadedOnceRef.current = true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setApiError(msg);
      // Só faz toast se já tinha carregado antes — evita ruído na primeira
      // tentativa (que pode falhar por race com JWT ainda não propagado)
      if (loadedOnceRef.current) {
        toast.error('Falha ao carregar dados', { description: msg });
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Recarrega no mount E toda vez que a sessão Supabase muda (sign-in,
  // token refresh, sign-out → sign-in). Consertar o "tela em branco no
  // primeiro login" — antes o fetch podia acontecer antes do JWT estar
  // pronto e falhar silenciosamente.
  useEffect(() => {
    void reloadAll();
    if (!supabase) return;
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) return;
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        void reloadAll();
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [reloadAll]);

  const withErrorToast = useCallback(async <T,>(op: () => Promise<T>, label: string): Promise<T | null> => {
    try {
      return await op();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[${label}]`, err);
      toast.error(`Falha ao ${label}`, { description: msg });
      return null;
    }
  }, []);

  // Filters ---------------------------------------------------------------
  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      const matchMonth = exp.month === selectedMonth && exp.year === selectedYear;
      const matchProfile = selectedProfileId === 'all' || exp.profileId === selectedProfileId;
      return matchMonth && matchProfile;
    });
  }, [expenses, selectedMonth, selectedYear, selectedProfileId]);

  const filteredIncomes = useMemo(() => {
    return incomes.filter((inc) => {
      const matchMonth = inc.month === selectedMonth && inc.year === selectedYear;
      const matchProfile = selectedProfileId === 'all' || inc.profileId === selectedProfileId;
      return matchMonth && matchProfile;
    });
  }, [incomes, selectedMonth, selectedYear, selectedProfileId]);

  // Aggregates ------------------------------------------------------------
  const totalIncome = useMemo(
    () => filteredIncomes.reduce((sum, inc) => sum + inc.amount, 0),
    [filteredIncomes],
  );
  const totalExpenses = useMemo(
    () => filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0),
    [filteredExpenses],
  );
  const totalPaid = useMemo(
    () => filteredExpenses.filter((e) => e.status === 'pago').reduce((s, e) => s + e.amount, 0),
    [filteredExpenses],
  );
  const totalPending = useMemo(
    () => filteredExpenses.filter((e) => e.status === 'nao_pago').reduce((s, e) => s + e.amount, 0),
    [filteredExpenses],
  );
  const salaryCommitment = useMemo(
    () => (totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0),
    [totalExpenses, totalIncome],
  );
  const balance = useMemo(() => totalIncome - totalExpenses, [totalIncome, totalExpenses]);

  const expensesByDueDay = useMemo(() => ({
    15: filteredExpenses.filter((e) => e.dueDay === 15),
    20: filteredExpenses.filter((e) => e.dueDay === 20),
    30: filteredExpenses.filter((e) => e.dueDay === 30),
  }), [filteredExpenses]);

  const expensesByDueDateStatus = useMemo(() => {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    const isCurrentPeriod = selectedMonth === currentMonth && selectedYear === currentYear;
    const endOfWeekDay = currentDay + 7;

    const todayExpenses = filteredExpenses.filter((exp) => {
      if (!isCurrentPeriod) return false;
      return exp.dueDay === currentDay && exp.status === 'nao_pago';
    });
    const thisWeekExpenses = filteredExpenses.filter((exp) => {
      if (exp.status === 'pago') return false;
      if (!isCurrentPeriod) return false;
      return exp.dueDay >= currentDay && exp.dueDay <= endOfWeekDay;
    });
    const upcomingExpenses = filteredExpenses.filter((exp) => {
      if (exp.status === 'pago') return false;
      if (!isCurrentPeriod) {
        if (selectedYear > currentYear) return true;
        if (selectedYear === currentYear && selectedMonth > currentMonth) return true;
        return false;
      }
      return exp.dueDay > currentDay;
    });
    const overdueExpenses = filteredExpenses.filter((exp) => {
      if (exp.status === 'pago') return false;
      if (!isCurrentPeriod) {
        if (selectedYear < currentYear) return true;
        if (selectedYear === currentYear && selectedMonth < currentMonth) return true;
        return false;
      }
      return exp.dueDay < currentDay;
    });

    return {
      all: filteredExpenses,
      today: todayExpenses,
      thisWeek: thisWeekExpenses,
      upcoming: upcomingExpenses,
      overdue: overdueExpenses,
    };
  }, [filteredExpenses, selectedMonth, selectedYear]);

  const totalByDueDay = useMemo(() => ({
    15: expensesByDueDay[15].reduce((s, e) => s + e.amount, 0),
    20: expensesByDueDay[20].reduce((s, e) => s + e.amount, 0),
    30: expensesByDueDay[30].reduce((s, e) => s + e.amount, 0),
  }), [expensesByDueDay]);

  const expensesByType = useMemo(() => {
    const grouped: Record<ExpenseType, number> = {
      cartao_credito: 0, emprestimo: 0, conta_fixa: 0,
      aluguel: 0, escola: 0, outros: 0,
    };
    filteredExpenses.forEach((e) => { grouped[e.type] += e.amount; });
    return grouped;
  }, [filteredExpenses]);

  const upcomingDebtEndings = useMemo(() => {
    return expenses
      .filter((e) => e.paymentType === 'parcelado' && e.endDate)
      .sort((a, b) => new Date(a.endDate!).getTime() - new Date(b.endDate!).getTime())
      .slice(0, 5);
  }, [expenses]);

  const financialHealth = useMemo((): FinancialHealth => {
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
    const debtToIncomeRatio = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 100;
    const emergencyFundMonths = balance > 0 ? balance / (totalExpenses || 1) : 0;
    let score = 50;
    if (savingsRate >= 20) score += 30;
    else if (savingsRate >= 10) score += 20;
    else if (savingsRate >= 5) score += 10;
    else if (savingsRate < 0) score -= 20;
    if (debtToIncomeRatio <= 50) score += 20;
    else if (debtToIncomeRatio <= 70) score += 10;
    else if (debtToIncomeRatio > 100) score -= 30;
    score = Math.max(0, Math.min(100, score));
    let status: FinancialHealth['status'];
    if (score >= 80) status = 'excelente';
    else if (score >= 60) status = 'bom';
    else if (score >= 40) status = 'regular';
    else if (score >= 20) status = 'ruim';
    else status = 'critico';
    return { score, status, savingsRate, debtToIncomeRatio, emergencyFundMonths };
  }, [totalIncome, totalExpenses, balance]);

  // Mutations -------------------------------------------------------------
  const toggleExpenseStatus = useCallback(async (id: string) => {
    const updated = await withErrorToast(() => api.toggleExpense(id), 'alternar status');
    if (updated) {
      setExpenses((prev) => prev.map((e) => (e.id === id ? updated : e)));
      setHasUnsavedChanges(true);
    }
  }, [withErrorToast]);

  const addExpense = useCallback(async (expense: Omit<Expense, 'id' | 'createdAt'>) => {
    const created = await withErrorToast(() => api.createExpense(expense), 'criar despesa');
    if (created) {
      setExpenses((prev) => [...prev, created]);
      setHasUnsavedChanges(true);
    }
  }, [withErrorToast]);

  const deleteExpense = useCallback(async (id: string) => {
    const snapshot = expenses.find((e) => e.id === id);
    const ok = await withErrorToast(async () => { await api.deleteExpense(id); return true; }, 'remover despesa');
    if (ok) {
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      setHasUnsavedChanges(true);
      if (snapshot) {
        toast('Despesa removida', {
          description: snapshot.name,
          duration: 5000,
          action: {
            label: 'Desfazer',
            onClick: async () => {
              const restored = await withErrorToast(
                () => api.createExpense({ ...snapshot, id: undefined as unknown as string }),
                'restaurar despesa',
              );
              if (restored) setExpenses((prev) => [...prev, restored]);
            },
          },
        });
      }
    }
  }, [expenses, withErrorToast]);

  const updateExpense = useCallback(async (expense: Expense) => {
    const updated = await withErrorToast(() => api.updateExpense(expense), 'atualizar despesa');
    if (updated) {
      setExpenses((prev) => prev.map((e) => (e.id === expense.id ? updated : e)));
      setHasUnsavedChanges(true);
    }
  }, [withErrorToast]);

  const addIncome = useCallback(async (income: Omit<Income, 'id' | 'createdAt'>) => {
    const created = await withErrorToast(() => api.createIncome(income), 'criar renda');
    if (created) {
      setIncomes((prev) => [...prev, created]);
      setHasUnsavedChanges(true);
    }
  }, [withErrorToast]);

  const deleteIncome = useCallback(async (id: string) => {
    const snapshot = incomes.find((i) => i.id === id);
    const ok = await withErrorToast(async () => { await api.deleteIncome(id); return true; }, 'remover renda');
    if (ok) {
      setIncomes((prev) => prev.filter((i) => i.id !== id));
      setHasUnsavedChanges(true);
      if (snapshot) {
        toast('Renda removida', {
          description: snapshot.name,
          duration: 5000,
          action: {
            label: 'Desfazer',
            onClick: async () => {
              const restored = await withErrorToast(
                () => api.createIncome({ ...snapshot, id: undefined as unknown as string }),
                'restaurar renda',
              );
              if (restored) setIncomes((prev) => [...prev, restored]);
            },
          },
        });
      }
    }
  }, [incomes, withErrorToast]);

  const updateIncome = useCallback(async (income: Income) => {
    const updated = await withErrorToast(() => api.updateIncome(income), 'atualizar renda');
    if (updated) {
      setIncomes((prev) => prev.map((i) => (i.id === income.id ? updated : i)));
      setHasUnsavedChanges(true);
    }
  }, [withErrorToast]);

  const addProfile = useCallback(async (profile: Omit<FamilyProfile, 'id'>) => {
    const created = await withErrorToast(() => api.createProfile(profile), 'criar perfil');
    if (created) {
      setProfiles((prev) => [...prev, created]);
      setHasUnsavedChanges(true);
    }
  }, [withErrorToast]);

  const deleteProfile = useCallback(async (id: string) => {
    const ok = await withErrorToast(async () => { await api.deleteProfile(id); return true; }, 'remover perfil');
    if (ok) {
      setProfiles((prev) => prev.filter((p) => p.id !== id));
      setExpenses((prev) => prev.filter((e) => e.profileId !== id));
      setIncomes((prev) => prev.filter((i) => i.profileId !== id));
      setHasUnsavedChanges(true);
    }
  }, [withErrorToast]);

  const getProfileById = useCallback(
    (id: string) => profiles.find((p) => p.id === id),
    [profiles],
  );

  const addDebtGroup = useCallback(async (name: string) => {
    if (debtGroups.includes(name)) return;
    const ok = await withErrorToast(async () => { await api.addDebtGroup(name); return true; }, 'criar grupo de dívida');
    if (ok) setDebtGroups((prev) => (prev.includes(name) ? prev : [...prev, name]));
  }, [debtGroups, withErrorToast]);

  const editDebtGroup = useCallback(async (oldName: string, newName: string) => {
    const ok = await withErrorToast(async () => { await api.renameDebtGroup(oldName, newName); return true; }, 'renomear grupo');
    if (ok) {
      setDebtGroups((prev) => prev.map((g) => (g === oldName ? newName : g)));
      setExpenses((prev) => prev.map((e) => (e.groupName === oldName ? { ...e, groupName: newName } : e)));
    }
  }, [withErrorToast]);

  const deleteDebtGroup = useCallback(async (name: string) => {
    const ok = await withErrorToast(async () => { await api.deleteDebtGroup(name); return true; }, 'remover grupo');
    if (ok) {
      setDebtGroups((prev) => prev.filter((g) => g !== name));
      setExpenses((prev) => prev.map((e) => (e.groupName === name ? { ...e, groupName: undefined } : e)));
    }
  }, [withErrorToast]);

  const addCategory = useCallback(async (cat: ExpenseCategory) => {
    const ok = await withErrorToast(async () => { await api.addCategory(cat); return true; }, 'criar categoria');
    if (ok) setCategories((prev) => (prev.some((c) => c.name === cat.name) ? prev : [...prev, cat]));
  }, [withErrorToast]);

  const updateCategory = useCallback(async (name: string, patch: Partial<ExpenseCategory>) => {
    const ok = await withErrorToast(async () => { await api.updateCategory(name, patch); return true; }, 'atualizar categoria');
    if (ok) {
      const newName = patch.name ?? name;
      setCategories((prev) => prev.map((c) => (c.name === name ? { ...c, ...patch, name: newName } : c)));
      if (newName !== name) {
        setExpenses((prev) => prev.map((e) => (e.category === name ? { ...e, category: newName } : e)));
      }
    }
  }, [withErrorToast]);

  const deleteCategory = useCallback(async (name: string) => {
    const ok = await withErrorToast(async () => { await api.deleteCategory(name); return true; }, 'remover categoria');
    if (ok) {
      setCategories((prev) => prev.filter((c) => c.name !== name));
      setExpenses((prev) => prev.map((e) => (e.category === name ? { ...e, category: undefined } : e)));
    }
  }, [withErrorToast]);

  const expenseCountByGroup = useMemo(() => {
    const counts: Record<string, number> = {};
    expenses.forEach((e) => {
      if (e.groupName) counts[e.groupName] = (counts[e.groupName] || 0) + 1;
    });
    return counts;
  }, [expenses]);

  // Contagem total (todos os meses/anos) por perfil — usado no diálogo de
  // exclusão pra avisar quantos registros vão em cascata
  const countsByProfile = useMemo(() => {
    const out: Record<string, { expenses: number; incomes: number }> = {};
    for (const p of profiles) out[p.id] = { expenses: 0, incomes: 0 };
    for (const e of expenses) if (out[e.profileId]) out[e.profileId].expenses++;
    for (const i of incomes) if (out[i.profileId]) out[i.profileId].incomes++;
    return out;
  }, [profiles, expenses, incomes]);

  const hasDataInCurrentMonth = useMemo(
    () => filteredExpenses.length > 0 || filteredIncomes.length > 0,
    [filteredExpenses, filteredIncomes],
  );

  const previousMonthData = useMemo(() => {
    const prevMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
    const prevYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;
    const prevExpenses = expenses.filter((e) => {
      const matchMonth = e.month === prevMonth && e.year === prevYear;
      const matchProfile = selectedProfileId === 'all' || e.profileId === selectedProfileId;
      return matchMonth && matchProfile;
    });
    const prevIncomes = incomes.filter((i) => {
      const matchMonth = i.month === prevMonth && i.year === prevYear;
      const matchProfile = selectedProfileId === 'all' || i.profileId === selectedProfileId;
      return matchMonth && matchProfile;
    });
    return { expenses: prevExpenses, incomes: prevIncomes, hasData: prevExpenses.length > 0 || prevIncomes.length > 0 };
  }, [expenses, incomes, selectedMonth, selectedYear, selectedProfileId]);

  const copyFromPreviousMonth = useCallback(async () => {
    const result = await withErrorToast(
      () => api.copyPreviousMonth(selectedMonth, selectedYear, selectedProfileId),
      'copiar mês anterior',
    );
    if (result) {
      await reloadAll();
      toast.success(`Copiado: ${result.copiedExpenses} despesas, ${result.copiedIncomes} rendas`);
    }
  }, [selectedMonth, selectedYear, selectedProfileId, reloadAll, withErrorToast]);

  const replicateFromPreviousMonth = useCallback(async () => {
    const result = await withErrorToast(
      () => api.replicatePreviousMonth(selectedMonth, selectedYear, selectedProfileId),
      'replicar mês anterior',
    );
    if (result) {
      await reloadAll();
      const parts = [`${result.inserted} despesa(s) replicada(s)`];
      if (result.skipped > 0) parts.push(`${result.skipped} parcelamento(s) já quitado(s) ignorado(s)`);
      toast.success('Mês replicado', { description: parts.join(' · ') });
    }
  }, [selectedMonth, selectedYear, selectedProfileId, reloadAll, withErrorToast]);

  const saveData = useCallback(() => {
    setIsSaving(true);
    api.markSaved()
      .then((r) => { setLastSaved(new Date(r.lastSaved)); setHasUnsavedChanges(false); })
      .catch((err) => toast.error('Não foi possível marcar o save', { description: String(err) }))
      .finally(() => setIsSaving(false));
    return true;
  }, []);

  return {
    // Data
    expenses: filteredExpenses,
    allExpenses: expenses,
    incomes: filteredIncomes,
    allIncomes: incomes,
    profiles,

    // Selection
    selectedProfileId,
    setSelectedProfileId,
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear,

    // Calculations
    totalIncome,
    totalExpenses,
    totalPaid,
    totalPending,
    salaryCommitment,
    balance,
    expensesByDueDay,
    expensesByDueDateStatus,
    totalByDueDay,
    expensesByType,
    upcomingDebtEndings,
    financialHealth,

    // Actions
    toggleExpenseStatus,
    addExpense,
    deleteExpense,
    updateExpense,
    addIncome,
    deleteIncome,
    updateIncome,
    addProfile,
    deleteProfile,
    getProfileById,

    // Debt groups
    debtGroups,
    addDebtGroup,
    editDebtGroup,
    deleteDebtGroup,
    expenseCountByGroup,

    // Profile counts (for delete-safety UI)
    countsByProfile,

    // Categories (custom)
    categories,
    addCategory,
    updateCategory,
    deleteCategory,

    // Copy
    hasDataInCurrentMonth,
    hasPreviousMonthData: previousMonthData.hasData,
    copyFromPreviousMonth,
    replicateFromPreviousMonth,

    // Save
    saveData,
    isSaving,
    lastSaved,
    hasUnsavedChanges,

    // API state
    isLoading,
    apiError,
    reloadAll,
  };
}
