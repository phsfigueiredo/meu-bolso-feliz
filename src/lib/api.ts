import type { Expense, Income, FamilyProfile, ExpenseCategory } from '@/types/finance';

const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001';

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${res.status} ${res.statusText}: ${text}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  return json<T>(res);
}

export interface FullState {
  profiles: FamilyProfile[];
  incomes: Income[];
  expenses: Expense[];
  debtGroups: string[];
  categories?: ExpenseCategory[];
  lastSaved: string | null;
}

export const api = {
  health: () => req<{ ok: boolean; ts: string }>('/api/health'),
  getState: () => req<FullState>('/api/state'),
  markSaved: () => req<{ ok: true; lastSaved: string }>('/api/state/save', { method: 'POST' }),

  // Expenses
  createExpense: (e: Omit<Expense, 'id' | 'createdAt'>) =>
    req<Expense>('/api/expenses', { method: 'POST', body: JSON.stringify(e) }),
  updateExpense: (e: Expense) =>
    req<Expense>(`/api/expenses/${encodeURIComponent(e.id)}`, {
      method: 'PUT', body: JSON.stringify(e),
    }),
  toggleExpense: (id: string) =>
    req<Expense>(`/api/expenses/${encodeURIComponent(id)}/toggle`, { method: 'PATCH' }),
  deleteExpense: (id: string) =>
    req<void>(`/api/expenses/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  // Incomes
  createIncome: (i: Omit<Income, 'id' | 'createdAt'>) =>
    req<Income>('/api/incomes', { method: 'POST', body: JSON.stringify(i) }),
  updateIncome: (i: Income) =>
    req<Income>(`/api/incomes/${encodeURIComponent(i.id)}`, {
      method: 'PUT', body: JSON.stringify(i),
    }),
  deleteIncome: (id: string) =>
    req<void>(`/api/incomes/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  // Profiles
  createProfile: (p: Omit<FamilyProfile, 'id'>) =>
    req<FamilyProfile>('/api/profiles', { method: 'POST', body: JSON.stringify(p) }),
  deleteProfile: (id: string) =>
    req<void>(`/api/profiles/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  // Debt groups
  addDebtGroup: (name: string) =>
    req<{ name: string }>('/api/debt-groups', {
      method: 'POST', body: JSON.stringify({ name }),
    }),
  renameDebtGroup: (oldName: string, newName: string) =>
    req<{ name: string }>(`/api/debt-groups/${encodeURIComponent(oldName)}`, {
      method: 'PUT', body: JSON.stringify({ name: newName }),
    }),
  deleteDebtGroup: (name: string) =>
    req<void>(`/api/debt-groups/${encodeURIComponent(name)}`, { method: 'DELETE' }),

  copyPreviousMonth: (month: number, year: number, profileId: string | 'all') =>
    req<{ copiedExpenses: number; copiedIncomes: number }>('/api/copy-previous-month', {
      method: 'POST', body: JSON.stringify({ month, year, profileId }),
    }),

  addCategory: (cat: ExpenseCategory) =>
    req<ExpenseCategory>('/api/categories', { method: 'POST', body: JSON.stringify(cat) }),
  updateCategory: (name: string, patch: Partial<ExpenseCategory>) =>
    req<void>(`/api/categories/${encodeURIComponent(name)}`, {
      method: 'PUT', body: JSON.stringify(patch),
    }),
  deleteCategory: (name: string) =>
    req<void>(`/api/categories/${encodeURIComponent(name)}`, { method: 'DELETE' }),

  replicatePreviousMonth: (month: number, year: number, profileId: string | 'all') =>
    req<{ inserted: number; skipped: number; source: { month: number; year: number } }>(
      '/api/replicate-previous-month',
      { method: 'POST', body: JSON.stringify({ month, year, profileId }) },
    ),
};

export const isApiOnline = async (): Promise<boolean> => {
  try {
    await api.health();
    return true;
  } catch {
    return false;
  }
};
