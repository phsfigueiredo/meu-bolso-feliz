import { useState, useMemo, useCallback } from 'react';
import { Expense, Income, FamilyProfile, ExpenseType, FinancialHealth } from '@/types/finance';
import { mockExpenses, mockIncomes, mockProfiles } from '@/data/mockData';

export function useFinances() {
  const [expenses, setExpenses] = useState<Expense[]>(mockExpenses);
  const [incomes, setIncomes] = useState<Income[]>(mockIncomes);
  const [profiles, setProfiles] = useState<FamilyProfile[]>(mockProfiles);
  const [selectedProfileId, setSelectedProfileId] = useState<string | 'all'>('all');
  const [selectedMonth, setSelectedMonth] = useState(1);
  const [selectedYear, setSelectedYear] = useState(2026);

  // Filter by month, year and profile
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

  const totalIncome = useMemo(() => {
    return filteredIncomes.reduce((sum, inc) => sum + inc.amount, 0);
  }, [filteredIncomes]);

  const totalExpenses = useMemo(() => {
    return filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  }, [filteredExpenses]);

  const totalPaid = useMemo(() => {
    return filteredExpenses
      .filter((exp) => exp.status === 'pago')
      .reduce((sum, exp) => sum + exp.amount, 0);
  }, [filteredExpenses]);

  const totalPending = useMemo(() => {
    return filteredExpenses
      .filter((exp) => exp.status === 'nao_pago')
      .reduce((sum, exp) => sum + exp.amount, 0);
  }, [filteredExpenses]);

  const salaryCommitment = useMemo(() => {
    return totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;
  }, [totalExpenses, totalIncome]);

  const balance = useMemo(() => {
    return totalIncome - totalExpenses;
  }, [totalIncome, totalExpenses]);

  const expensesByDueDay = useMemo(() => {
    const grouped = {
      10: filteredExpenses.filter((exp) => exp.dueDay === 10),
      15: filteredExpenses.filter((exp) => exp.dueDay === 15),
      30: filteredExpenses.filter((exp) => exp.dueDay === 30),
    };
    return grouped;
  }, [filteredExpenses]);

  const totalByDueDay = useMemo(() => {
    return {
      10: expensesByDueDay[10].reduce((sum, exp) => sum + exp.amount, 0),
      15: expensesByDueDay[15].reduce((sum, exp) => sum + exp.amount, 0),
      30: expensesByDueDay[30].reduce((sum, exp) => sum + exp.amount, 0),
    };
  }, [expensesByDueDay]);

  const expensesByType = useMemo(() => {
    const grouped: Record<ExpenseType, number> = {
      cartao_credito: 0,
      emprestimo: 0,
      conta_fixa: 0,
      aluguel: 0,
      escola: 0,
      outros: 0,
    };

    filteredExpenses.forEach((exp) => {
      grouped[exp.type] += exp.amount;
    });

    return grouped;
  }, [filteredExpenses]);

  // Debts ending soon (non-recurrent with end date)
  const upcomingDebtEndings = useMemo(() => {
    return expenses
      .filter((exp) => exp.paymentType === 'parcelado' && exp.endDate)
      .sort((a, b) => new Date(a.endDate!).getTime() - new Date(b.endDate!).getTime())
      .slice(0, 5);
  }, [expenses]);

  // Financial Health calculation
  const financialHealth = useMemo((): FinancialHealth => {
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
    const debtToIncomeRatio = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 100;
    const emergencyFundMonths = balance > 0 ? balance / (totalExpenses || 1) : 0;

    let score = 50;
    
    // Savings rate impact (max 30 points)
    if (savingsRate >= 20) score += 30;
    else if (savingsRate >= 10) score += 20;
    else if (savingsRate >= 5) score += 10;
    else if (savingsRate < 0) score -= 20;

    // Debt ratio impact (max 20 points)
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

    return {
      score,
      status,
      savingsRate,
      debtToIncomeRatio,
      emergencyFundMonths,
    };
  }, [totalIncome, totalExpenses, balance]);

  const toggleExpenseStatus = useCallback((id: string) => {
    setExpenses((prev) =>
      prev.map((exp) => {
        if (exp.id === id) {
          const newStatus = exp.status === 'pago' ? 'nao_pago' : 'pago';
          return {
            ...exp,
            status: newStatus,
            totalPaid: newStatus === 'pago' ? exp.amount : 0,
            totalRemaining: newStatus === 'pago' ? 0 : exp.amount,
          };
        }
        return exp;
      })
    );
  }, []);

  const addExpense = useCallback((expense: Omit<Expense, 'id' | 'createdAt'>) => {
    const newExpense: Expense = {
      ...expense,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setExpenses((prev) => [...prev, newExpense]);
  }, []);

  const deleteExpense = useCallback((id: string) => {
    setExpenses((prev) => prev.filter((exp) => exp.id !== id));
  }, []);

  const addIncome = useCallback((income: Omit<Income, 'id' | 'createdAt'>) => {
    const newIncome: Income = {
      ...income,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setIncomes((prev) => [...prev, newIncome]);
  }, []);

  const deleteIncome = useCallback((id: string) => {
    setIncomes((prev) => prev.filter((inc) => inc.id !== id));
  }, []);

  const addProfile = useCallback((profile: Omit<FamilyProfile, 'id'>) => {
    const newProfile: FamilyProfile = {
      ...profile,
      id: `profile-${Date.now()}`,
    };
    setProfiles((prev) => [...prev, newProfile]);
  }, []);

  const deleteProfile = useCallback((id: string) => {
    setProfiles((prev) => prev.filter((p) => p.id !== id));
    // Also delete associated expenses and incomes
    setExpenses((prev) => prev.filter((exp) => exp.profileId !== id));
    setIncomes((prev) => prev.filter((inc) => inc.profileId !== id));
  }, []);

  const getProfileById = useCallback((id: string) => {
    return profiles.find((p) => p.id === id);
  }, [profiles]);

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
    totalByDueDay,
    expensesByType,
    upcomingDebtEndings,
    financialHealth,
    
    // Actions
    toggleExpenseStatus,
    addExpense,
    deleteExpense,
    addIncome,
    deleteIncome,
    addProfile,
    deleteProfile,
    getProfileById,
  };
}
