/**
 * Escolhe entre 3 backends para o app:
 *
 *   supabase → Postgres + RLS na nuvem (usado quando VITE_SUPABASE_URL está setado)
 *   api      → backend Express local (dev)
 *   local    → IndexedDB do navegador (fallback estático)
 *
 * Ordem de precedência:
 *   1) VITE_STORAGE explícito ('supabase' | 'api' | 'local')
 *   2) Supabase configurado → 'supabase'
 *   3) /api/health respondendo → 'api'
 *   4) fallback → 'local'
 */
import { api, type FullState } from './api';
import { localApi } from './localStorage';
import { supabaseApi } from './supabaseStorage';
import { isSupabaseConfigured } from './supabase';
import type { Expense, Income, FamilyProfile } from '@/types/finance';

type Backend = 'supabase' | 'api' | 'local';

async function detectBackend(): Promise<Backend> {
  const forced = import.meta.env.VITE_STORAGE as string | undefined;
  if (forced === 'supabase' || forced === 'api' || forced === 'local') return forced;
  if (isSupabaseConfigured) return 'supabase';

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 1500);
  try {
    const res = await fetch(
      `${(import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001'}/api/health`,
      { signal: controller.signal },
    );
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

async function pick<T>(
  supabaseFn: () => Promise<T>,
  apiFn: () => Promise<T>,
  localFn: () => Promise<T>,
): Promise<T> {
  const b = await getBackend();
  if (b === 'supabase') return supabaseFn();
  if (b === 'api') return apiFn();
  return localFn();
}

export async function getCurrentBackend(): Promise<Backend> {
  return getBackend();
}

export const storage = {
  getState: (): Promise<FullState> => pick(supabaseApi.getState, api.getState, localApi.getState),
  markSaved: () => pick(supabaseApi.markSaved, api.markSaved, localApi.markSaved),

  createExpense: (e: Omit<Expense, 'id' | 'createdAt'>) =>
    pick(() => supabaseApi.createExpense(e), () => api.createExpense(e), () => localApi.createExpense(e)),
  updateExpense: (e: Expense) =>
    pick(() => supabaseApi.updateExpense(e), () => api.updateExpense(e), () => localApi.updateExpense(e)),
  toggleExpense: (id: string) =>
    pick(() => supabaseApi.toggleExpense(id), () => api.toggleExpense(id), () => localApi.toggleExpense(id)),
  deleteExpense: (id: string) =>
    pick(() => supabaseApi.deleteExpense(id), () => api.deleteExpense(id), () => localApi.deleteExpense(id)),

  createIncome: (i: Omit<Income, 'id' | 'createdAt'>) =>
    pick(() => supabaseApi.createIncome(i), () => api.createIncome(i), () => localApi.createIncome(i)),
  updateIncome: (i: Income) =>
    pick(() => supabaseApi.updateIncome(i), () => api.updateIncome(i), () => localApi.updateIncome(i)),
  deleteIncome: (id: string) =>
    pick(() => supabaseApi.deleteIncome(id), () => api.deleteIncome(id), () => localApi.deleteIncome(id)),

  createProfile: (p: Omit<FamilyProfile, 'id'>) =>
    pick(() => supabaseApi.createProfile(p), () => api.createProfile(p), () => localApi.createProfile(p)),
  deleteProfile: (id: string) =>
    pick(() => supabaseApi.deleteProfile(id), () => api.deleteProfile(id), () => localApi.deleteProfile(id)),

  addDebtGroup: (n: string) =>
    pick(() => supabaseApi.addDebtGroup(n), () => api.addDebtGroup(n), () => localApi.addDebtGroup(n)),
  renameDebtGroup: (o: string, n: string) =>
    pick(() => supabaseApi.renameDebtGroup(o, n), () => api.renameDebtGroup(o, n), () => localApi.renameDebtGroup(o, n)),
  deleteDebtGroup: (n: string) =>
    pick(() => supabaseApi.deleteDebtGroup(n), () => api.deleteDebtGroup(n), () => localApi.deleteDebtGroup(n)),

  copyPreviousMonth: (m: number, y: number, p: string | 'all') =>
    pick(
      () => supabaseApi.copyPreviousMonth(m, y, p),
      () => api.copyPreviousMonth(m, y, p),
      () => localApi.copyPreviousMonth(m, y, p),
    ),
  replicatePreviousMonth: (m: number, y: number, p: string | 'all') =>
    pick(
      () => supabaseApi.replicatePreviousMonth(m, y, p),
      () => api.replicatePreviousMonth(m, y, p),
      () => localApi.replicatePreviousMonth(m, y, p),
    ),

  // Só disponíveis no modo local (fallback estático)
  resetFromSeed: () => localApi.wipe(),
  wipe: () => localApi.wipe(),

  // Import inicial no Supabase (usa seed criptografado + senha)
  importFromSeed: (data: unknown) => supabaseApi.importFromSeed(data),
};
