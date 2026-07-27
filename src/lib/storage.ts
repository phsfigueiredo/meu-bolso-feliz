/**
 * Escolhe entre a API HTTP (backend Express local) e o storage local
 * (IndexedDB + seed.json) — usado no build estático do GitHub Pages.
 *
 * Regra:
 * - Se VITE_STORAGE === 'local' → sempre local.
 * - Se VITE_STORAGE === 'api'   → sempre HTTP.
 * - Caso contrário (default): tenta /api/health uma vez; se falhar em <1.5s,
 *   cai pro storage local.
 */
import { api, type FullState } from './api';
import { localApi } from './localStorage';
import type { Expense, Income, FamilyProfile } from '@/types/finance';

type Backend = 'api' | 'local';

async function detectBackend(): Promise<Backend> {
  const forced = import.meta.env.VITE_STORAGE as string | undefined;
  if (forced === 'local' || forced === 'api') return forced;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 1500);
  try {
    const res = await fetch(`${(import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001'}/api/health`, {
      signal: controller.signal,
    });
    clearTimeout(timer);
    return res.ok ? 'api' : 'local';
  } catch {
    clearTimeout(timer);
    return 'local';
  }
}

let backendPromise: Promise<Backend> | null = null;
function getBackend(): Promise<Backend> {
  if (!backendPromise) backendPromise = detectBackend();
  return backendPromise;
}

async function pick<T>(apiFn: () => Promise<T>, localFn: () => Promise<T>): Promise<T> {
  const b = await getBackend();
  return b === 'api' ? apiFn() : localFn();
}

export async function getCurrentBackend(): Promise<Backend> {
  return getBackend();
}

export const storage = {
  getState: (): Promise<FullState> => pick(api.getState, localApi.getState),
  markSaved: () => pick(api.markSaved, localApi.markSaved),

  createExpense: (e: Omit<Expense, 'id' | 'createdAt'>) =>
    pick(() => api.createExpense(e), () => localApi.createExpense(e)),
  updateExpense: (e: Expense) =>
    pick(() => api.updateExpense(e), () => localApi.updateExpense(e)),
  toggleExpense: (id: string) =>
    pick(() => api.toggleExpense(id), () => localApi.toggleExpense(id)),
  deleteExpense: (id: string) =>
    pick(() => api.deleteExpense(id), () => localApi.deleteExpense(id)),

  createIncome: (i: Omit<Income, 'id' | 'createdAt'>) =>
    pick(() => api.createIncome(i), () => localApi.createIncome(i)),
  updateIncome: (i: Income) =>
    pick(() => api.updateIncome(i), () => localApi.updateIncome(i)),
  deleteIncome: (id: string) =>
    pick(() => api.deleteIncome(id), () => localApi.deleteIncome(id)),

  createProfile: (p: Omit<FamilyProfile, 'id'>) =>
    pick(() => api.createProfile(p), () => localApi.createProfile(p)),
  deleteProfile: (id: string) =>
    pick(() => api.deleteProfile(id), () => localApi.deleteProfile(id)),

  addDebtGroup: (n: string) =>
    pick(() => api.addDebtGroup(n), () => localApi.addDebtGroup(n)),
  renameDebtGroup: (o: string, n: string) =>
    pick(() => api.renameDebtGroup(o, n), () => localApi.renameDebtGroup(o, n)),
  deleteDebtGroup: (n: string) =>
    pick(() => api.deleteDebtGroup(n), () => localApi.deleteDebtGroup(n)),

  copyPreviousMonth: (m: number, y: number, p: string | 'all') =>
    pick(() => api.copyPreviousMonth(m, y, p), () => localApi.copyPreviousMonth(m, y, p)),
  replicatePreviousMonth: (m: number, y: number, p: string | 'all') =>
    pick(() => api.replicatePreviousMonth(m, y, p), () => localApi.replicatePreviousMonth(m, y, p)),

  resetFromSeed: () => localApi.resetFromSeed(),
  wipe: () => localApi.wipe(),
};
