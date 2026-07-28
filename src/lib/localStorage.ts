/**
 * Camada de persistência local (IndexedDB) usada quando o backend Express
 * não está disponível — típico do GitHub Pages e do build estático.
 *
 * Interface espelha `api.ts` para que `useFinances` possa alternar entre
 * elas sem se preocupar com o transporte.
 */
import { get, set } from 'idb-keyval';
import type { Expense, Income, FamilyProfile, ExpenseCategory } from '@/types/finance';
import type { FullState } from './api';

const KEY = 'meu-bolso-feliz:state';

interface StateShape extends FullState {
  version: number;
  categories: ExpenseCategory[];
}

const empty = (): StateShape => ({
  version: 1,
  profiles: [],
  incomes: [],
  expenses: [],
  debtGroups: [],
  categories: [],
  lastSaved: null,
});

let cache: StateShape | null = null;

async function load(): Promise<StateShape> {
  if (cache) return cache;
  const stored = await get<StateShape>(KEY);
  if (stored && Array.isArray(stored.profiles)) {
    cache = stored;
    return cache;
  }
  cache = empty();
  return cache;
}

/**
 * Popula o IndexedDB a partir de dados já descriptografados (chamado pelo
 * PasswordGate após o unlock). Só grava se o IndexedDB estiver vazio —
 * assim as edições posteriores do usuário não são sobrescritas.
 */
export async function initFromDecryptedSeed(data: unknown): Promise<'seeded' | 'kept-existing'> {
  const existing = await get<StateShape>(KEY);
  if (existing && Array.isArray(existing.expenses) && existing.expenses.length > 0) {
    cache = existing;
    return 'kept-existing';
  }
  const raw = data as Partial<StateShape>;
  const state: StateShape = {
    version: 1,
    profiles: raw.profiles ?? [],
    incomes:  raw.incomes  ?? [],
    expenses: raw.expenses ?? [],
    debtGroups: raw.debtGroups ?? [],
    lastSaved: null,
  };
  await commit(state);
  return 'seeded';
}

async function commit(state: StateShape): Promise<StateShape> {
  cache = state;
  await set(KEY, state);
  return state;
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// --- API espelhada ---------------------------------------------------------

export const localApi = {
  async health() {
    return { ok: true, ts: new Date().toISOString() };
  },

  async getState(): Promise<FullState> {
    const s = await load();
    return {
      profiles: s.profiles,
      incomes: s.incomes,
      expenses: s.expenses,
      debtGroups: s.debtGroups,
      categories: s.categories ?? [],
      lastSaved: s.lastSaved,
    };
  },

  async addCategory(cat: ExpenseCategory): Promise<ExpenseCategory> {
    const s = await load();
    const cats = s.categories ?? [];
    if (cats.some((c) => c.name === cat.name)) return cat;
    await commit({ ...s, categories: [...cats, cat] });
    return cat;
  },

  async updateCategory(name: string, patch: Partial<ExpenseCategory>): Promise<void> {
    const s = await load();
    const cats = s.categories ?? [];
    const newName = patch.name ?? name;
    const nextCats = cats.map((c) => (c.name === name ? { ...c, ...patch, name: newName } : c));
    const nextExpenses = newName !== name
      ? s.expenses.map((e) => (e.category === name ? { ...e, category: newName } : e))
      : s.expenses;
    await commit({ ...s, categories: nextCats, expenses: nextExpenses });
  },

  async deleteCategory(name: string): Promise<void> {
    const s = await load();
    const cats = (s.categories ?? []).filter((c) => c.name !== name);
    const expenses = s.expenses.map((e) => (e.category === name ? { ...e, category: undefined } : e));
    await commit({ ...s, categories: cats, expenses });
  },

  async markSaved() {
    const s = await load();
    const lastSaved = new Date().toISOString();
    await commit({ ...s, lastSaved });
    return { ok: true as const, lastSaved };
  },

  // ---- Expenses ----
  async createExpense(e: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> {
    const s = await load();
    const now = new Date().toISOString();
    const created: Expense = {
      ...e,
      id: newId('exp'),
      createdAt: now,
      totalPaid: e.status === 'pago' ? e.amount : 0,
      totalRemaining: e.status === 'pago' ? 0 : e.amount,
    };
    await commit({ ...s, expenses: [...s.expenses, created] });
    return created;
  },

  async updateExpense(e: Expense): Promise<Expense> {
    const s = await load();
    await commit({
      ...s,
      expenses: s.expenses.map((x) => (x.id === e.id ? e : x)),
    });
    return e;
  },

  async toggleExpense(id: string): Promise<Expense> {
    const s = await load();
    const target = s.expenses.find((x) => x.id === id);
    if (!target) throw new Error(`Despesa ${id} não encontrada`);
    const newStatus = target.status === 'pago' ? 'nao_pago' : 'pago';
    const updated: Expense = {
      ...target,
      status: newStatus,
      totalPaid: newStatus === 'pago' ? target.amount : 0,
      totalRemaining: newStatus === 'pago' ? 0 : target.amount,
    };
    await commit({
      ...s,
      expenses: s.expenses.map((x) => (x.id === id ? updated : x)),
    });
    return updated;
  },

  async deleteExpense(id: string): Promise<void> {
    const s = await load();
    await commit({ ...s, expenses: s.expenses.filter((x) => x.id !== id) });
  },

  // ---- Incomes ----
  async createIncome(i: Omit<Income, 'id' | 'createdAt'>): Promise<Income> {
    const s = await load();
    const created: Income = { ...i, id: newId('income'), createdAt: new Date().toISOString() };
    await commit({ ...s, incomes: [...s.incomes, created] });
    return created;
  },

  async updateIncome(i: Income): Promise<Income> {
    const s = await load();
    await commit({ ...s, incomes: s.incomes.map((x) => (x.id === i.id ? i : x)) });
    return i;
  },

  async deleteIncome(id: string): Promise<void> {
    const s = await load();
    await commit({ ...s, incomes: s.incomes.filter((x) => x.id !== id) });
  },

  // ---- Profiles ----
  async createProfile(p: Omit<FamilyProfile, 'id'>): Promise<FamilyProfile> {
    const s = await load();
    const created: FamilyProfile = { ...p, id: newId('profile') };
    await commit({ ...s, profiles: [...s.profiles, created] });
    return created;
  },

  async deleteProfile(id: string): Promise<void> {
    const s = await load();
    await commit({
      ...s,
      profiles: s.profiles.filter((p) => p.id !== id),
      expenses: s.expenses.filter((e) => e.profileId !== id),
      incomes: s.incomes.filter((i) => i.profileId !== id),
    });
  },

  // ---- Debt groups ----
  async addDebtGroup(name: string) {
    const s = await load();
    if (!s.debtGroups.includes(name)) {
      await commit({ ...s, debtGroups: [...s.debtGroups, name] });
    }
    return { name };
  },

  async renameDebtGroup(oldName: string, newName: string) {
    const s = await load();
    await commit({
      ...s,
      debtGroups: s.debtGroups.map((g) => (g === oldName ? newName : g)),
      expenses: s.expenses.map((e) =>
        e.groupName === oldName ? { ...e, groupName: newName } : e,
      ),
    });
    return { name: newName };
  },

  async deleteDebtGroup(name: string) {
    const s = await load();
    await commit({
      ...s,
      debtGroups: s.debtGroups.filter((g) => g !== name),
      expenses: s.expenses.map((e) =>
        e.groupName === name ? { ...e, groupName: undefined } : e,
      ),
    });
  },

  // ---- Bulk ----
  async copyPreviousMonth(month: number, year: number, profileId: string | 'all') {
    const s = await load();
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;

    const matchProfile = <T extends { profileId: string }>(x: T) =>
      profileId === 'all' || x.profileId === profileId;

    const expensesToCopy = s.expenses.filter(
      (e) =>
        e.month === prevMonth &&
        e.year === prevYear &&
        e.paymentType === 'recorrente' &&
        matchProfile(e),
    );
    const incomesToCopy = s.incomes.filter(
      (i) => i.month === prevMonth && i.year === prevYear && matchProfile(i),
    );

    const now = new Date().toISOString();
    const newExpenses: Expense[] = expensesToCopy.map((e) => ({
      ...e,
      id: newId('exp'),
      month,
      year,
      status: 'nao_pago',
      totalPaid: 0,
      totalRemaining: e.amount,
      createdAt: now,
    }));
    const newIncomes: Income[] = incomesToCopy.map((i) => ({
      ...i,
      id: newId('income'),
      month,
      year,
      createdAt: now,
    }));

    await commit({
      ...s,
      expenses: [...s.expenses, ...newExpenses],
      incomes: [...s.incomes, ...newIncomes],
    });

    return { copiedExpenses: newExpenses.length, copiedIncomes: newIncomes.length };
  },

  async replicatePreviousMonth(month: number, year: number, profileId: string | 'all') {
    const s = await load();
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const matchProfile = <T extends { profileId: string }>(x: T) =>
      profileId === 'all' || x.profileId === profileId;

    const source = s.expenses.filter(
      (e) => e.month === prevMonth && e.year === prevYear && matchProfile(e),
    );

    const now = new Date().toISOString();
    let inserted = 0;
    let skipped = 0;
    const additions: Expense[] = [];

    for (const e of source) {
      let current = e.currentInstallment;
      if (
        e.paymentType === 'parcelado' &&
        current != null &&
        e.totalInstallments != null
      ) {
        if (current >= e.totalInstallments) {
          skipped++;
          continue;
        }
        current = current + 1;
      }
      additions.push({
        ...e,
        id: newId('exp'),
        month,
        year,
        status: 'nao_pago',
        totalPaid: 0,
        totalRemaining: e.amount,
        createdAt: now,
        currentInstallment: current,
      });
      inserted++;
    }

    await commit({ ...s, expenses: [...s.expenses, ...additions] });
    return { inserted, skipped, source: { month: prevMonth, year: prevYear } };
  },

  // ---- Utilitários ----
  async resetFromSeed(): Promise<void> {
    cache = null;
    const seed = await fetchSeed();
    await commit(seed);
  },

  async wipe(): Promise<void> {
    cache = null;
    await commit(empty());
  },
};

export type LocalApi = typeof localApi;
