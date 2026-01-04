import { useState, useMemo } from 'react';
import { Expense, UserProfile, ExpenseType } from '@/types/finance';
import { mockExpenses, mockUserProfile } from '@/data/mockData';

export function useFinances() {
  const [expenses, setExpenses] = useState<Expense[]>(mockExpenses);
  const [userProfile, setUserProfile] = useState<UserProfile>(mockUserProfile);

  const totalIncome = useMemo(() => {
    return userProfile.salary + userProfile.benefits;
  }, [userProfile]);

  const totalExpenses = useMemo(() => {
    return expenses.reduce((sum, exp) => sum + exp.amount, 0);
  }, [expenses]);

  const totalPaid = useMemo(() => {
    return expenses
      .filter((exp) => exp.status === 'pago')
      .reduce((sum, exp) => sum + exp.amount, 0);
  }, [expenses]);

  const totalPending = useMemo(() => {
    return expenses
      .filter((exp) => exp.status === 'nao_pago')
      .reduce((sum, exp) => sum + exp.amount, 0);
  }, [expenses]);

  const salaryCommitment = useMemo(() => {
    return totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;
  }, [totalExpenses, totalIncome]);

  const balance = useMemo(() => {
    return totalIncome - totalExpenses;
  }, [totalIncome, totalExpenses]);

  const expensesByDueDay = useMemo(() => {
    const grouped = {
      10: expenses.filter((exp) => exp.dueDay === 10),
      15: expenses.filter((exp) => exp.dueDay === 15),
      30: expenses.filter((exp) => exp.dueDay === 30),
    };
    return grouped;
  }, [expenses]);

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

    expenses.forEach((exp) => {
      grouped[exp.type] += exp.amount;
    });

    return grouped;
  }, [expenses]);

  const toggleExpenseStatus = (id: string) => {
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
  };

  const addExpense = (expense: Omit<Expense, 'id' | 'createdAt'>) => {
    const newExpense: Expense = {
      ...expense,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setExpenses((prev) => [...prev, newExpense]);
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((exp) => exp.id !== id));
  };

  const updateUserProfile = (profile: Partial<UserProfile>) => {
    setUserProfile((prev) => ({ ...prev, ...profile }));
  };

  return {
    expenses,
    userProfile,
    totalIncome,
    totalExpenses,
    totalPaid,
    totalPending,
    salaryCommitment,
    balance,
    expensesByDueDay,
    totalByDueDay,
    expensesByType,
    toggleExpenseStatus,
    addExpense,
    deleteExpense,
    updateUserProfile,
  };
}
