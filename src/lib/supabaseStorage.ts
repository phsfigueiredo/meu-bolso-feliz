/**
 * Adapter Supabase — mesma interface de `api.ts`/`localApi.ts`.
 *
 * Todas as queries rodam contra as tabelas em `public.*`; a RLS do Supabase
 * garante que cada usuário só enxerga os próprios registros (via user_id =
 * auth.uid()). O `user_id` é preenchido pelo DEFAULT auth.uid() no insert.
 */
import { supabase } from './supabase';
import type { Expense, Income, FamilyProfile, ExpenseCategory } from '@/types/finance';
import type { FullState } from './api';

function client() {
  if (!supabase) throw new Error('Supabase não configurado — falta VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY');
  return supabase;
}

// ---- Mapeadores DB ↔ TS ---------------------------------------------------

interface ProfileRow {
  id: string;
  name: string;
  type: FamilyProfile['type'];
  avatar: string | null;
  color: string;
}
interface IncomeRow {
  id: string;
  name: string;
  type: Income['type'];
  amount: number;
  is_recurrent: boolean;
  profile_id: string;
  month: number;
  year: number;
  created_at: string;
}
interface ExpenseRow {
  id: string;
  name: string;
  type: Expense['type'];
  amount: number;
  due_day: 15 | 20 | 30;
  payment_type: Expense['paymentType'];
  payment_method: Expense['paymentMethod'] | null;
  current_installment: number | null;
  total_installments: number | null;
  end_date: string | null;
  status: Expense['status'];
  total_paid: number;
  total_remaining: number;
  profile_id: string;
  month: number;
  year: number;
  group_name: string | null;
  category: string | null;
  created_at: string;
}

const toProfile = (r: ProfileRow): FamilyProfile => ({
  id: r.id, name: r.name, type: r.type, avatar: r.avatar ?? undefined, color: r.color,
});

const toIncome = (r: IncomeRow): Income => ({
  id: r.id, name: r.name, type: r.type, amount: Number(r.amount),
  isRecurrent: r.is_recurrent, profileId: r.profile_id, month: r.month, year: r.year,
  createdAt: r.created_at,
});

const toExpense = (r: ExpenseRow): Expense => ({
  id: r.id, name: r.name, type: r.type, amount: Number(r.amount),
  dueDay: r.due_day, paymentType: r.payment_type,
  paymentMethod: r.payment_method ?? undefined,
  currentInstallment: r.current_installment ?? undefined,
  totalInstallments: r.total_installments ?? undefined,
  endDate: r.end_date ?? undefined,
  status: r.status,
  totalPaid: Number(r.total_paid),
  totalRemaining: Number(r.total_remaining),
  profileId: r.profile_id,
  month: r.month,
  year: r.year,
  groupName: r.group_name ?? undefined,
  category: r.category ?? undefined,
  createdAt: r.created_at,
});

const expenseToRow = (e: Partial<Expense>) => ({
  id: e.id,
  name: e.name,
  type: e.type,
  amount: e.amount,
  due_day: e.dueDay,
  payment_type: e.paymentType,
  payment_method: e.paymentMethod ?? null,
  current_installment: e.currentInstallment ?? null,
  total_installments: e.totalInstallments ?? null,
  end_date: e.endDate ?? null,
  status: e.status ?? 'nao_pago',
  total_paid: e.totalPaid ?? 0,
  total_remaining: e.totalRemaining ?? e.amount ?? 0,
  profile_id: e.profileId,
  month: e.month,
  year: e.year,
  group_name: e.groupName ?? null,
  category: e.category ?? null,
});

const incomeToRow = (i: Partial<Income>) => ({
  id: i.id,
  name: i.name,
  type: i.type,
  amount: i.amount,
  is_recurrent: i.isRecurrent ?? false,
  profile_id: i.profileId,
  month: i.month,
  year: i.year,
});

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function throwIfError<T>({ data, error }: { data: T; error: unknown }): T {
  if (error) throw new Error((error as { message?: string }).message ?? String(error));
  return data;
}

// ---- Storage API ----------------------------------------------------------

export const supabaseApi = {
  async health() {
    return { ok: Boolean(supabase), ts: new Date().toISOString() };
  },

  async getState(): Promise<FullState> {
    const c = client();
    const [profiles, incomes, expenses, groups, cats] = await Promise.all([
      c.from('profiles').select('*').order('name'),
      c.from('incomes').select('*'),
      c.from('expenses').select('*').order('year').order('month'),
      c.from('debt_groups').select('name').order('name'),
      c.from('expense_categories').select('name, color, icon').order('name'),
    ]);
    return {
      profiles: throwIfError(profiles as { data: ProfileRow[]; error: unknown }).map(toProfile),
      incomes:  throwIfError(incomes  as { data: IncomeRow[];  error: unknown }).map(toIncome),
      expenses: throwIfError(expenses as { data: ExpenseRow[]; error: unknown }).map(toExpense),
      debtGroups: throwIfError(groups as { data: { name: string }[]; error: unknown }).map(g => g.name),
      categories: throwIfError(cats as { data: ExpenseCategory[]; error: unknown }),
      lastSaved: null,
    };
  },

  async addCategory(cat: ExpenseCategory): Promise<ExpenseCategory> {
    const { error } = await client().from('expense_categories').insert({
      name: cat.name, color: cat.color, icon: cat.icon ?? null,
    });
    if (error) throw new Error(error.message);
    return cat;
  },

  async updateCategory(name: string, patch: Partial<ExpenseCategory>): Promise<void> {
    // Postgres não deixa update de PK direto; se muda o nome, tem que migrar
    const c = client();
    if (patch.name && patch.name !== name) {
      const { error: eIns } = await c.from('expense_categories').insert({
        name: patch.name, color: patch.color ?? 'hsl(var(--muted-foreground))', icon: patch.icon ?? null,
      });
      if (eIns && !eIns.message.includes('duplicate')) throw new Error(eIns.message);
      await c.from('expenses').update({ category: patch.name }).eq('category', name);
      const { error: eDel } = await c.from('expense_categories').delete().eq('name', name);
      if (eDel) throw new Error(eDel.message);
    } else {
      const update: Record<string, unknown> = {};
      if (patch.color !== undefined) update.color = patch.color;
      if (patch.icon !== undefined) update.icon = patch.icon;
      const { error } = await c.from('expense_categories').update(update).eq('name', name);
      if (error) throw new Error(error.message);
    }
  },

  async deleteCategory(name: string): Promise<void> {
    const c = client();
    await c.from('expenses').update({ category: null }).eq('category', name);
    const { error } = await c.from('expense_categories').delete().eq('name', name);
    if (error) throw new Error(error.message);
  },

  async markSaved() {
    return { ok: true as const, lastSaved: new Date().toISOString() };
  },

  // ---- Expenses ----
  async createExpense(e: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> {
    const row = { ...expenseToRow(e), id: newId('exp') };
    const { data, error } = await client().from('expenses').insert(row).select().single();
    if (error) throw new Error(error.message);
    return toExpense(data as ExpenseRow);
  },

  async updateExpense(e: Expense): Promise<Expense> {
    const { data, error } = await client()
      .from('expenses')
      .update(expenseToRow(e))
      .eq('id', e.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return toExpense(data as ExpenseRow);
  },

  async toggleExpense(id: string): Promise<Expense> {
    const cur = await client().from('expenses').select('*').eq('id', id).single();
    if (cur.error) throw new Error(cur.error.message);
    const row = cur.data as ExpenseRow;
    const newStatus = row.status === 'pago' ? 'nao_pago' : 'pago';
    const { data, error } = await client()
      .from('expenses')
      .update({
        status: newStatus,
        total_paid: newStatus === 'pago' ? row.amount : 0,
        total_remaining: newStatus === 'pago' ? 0 : row.amount,
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return toExpense(data as ExpenseRow);
  },

  async deleteExpense(id: string): Promise<void> {
    const { error } = await client().from('expenses').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  // ---- Incomes ----
  async createIncome(i: Omit<Income, 'id' | 'createdAt'>): Promise<Income> {
    const row = { ...incomeToRow(i), id: newId('income') };
    const { data, error } = await client().from('incomes').insert(row).select().single();
    if (error) throw new Error(error.message);
    return toIncome(data as IncomeRow);
  },

  async updateIncome(i: Income): Promise<Income> {
    const { data, error } = await client()
      .from('incomes')
      .update(incomeToRow(i))
      .eq('id', i.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return toIncome(data as IncomeRow);
  },

  async deleteIncome(id: string): Promise<void> {
    const { error } = await client().from('incomes').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  // ---- Profiles ----
  async createProfile(p: Omit<FamilyProfile, 'id'>): Promise<FamilyProfile> {
    const row = {
      id: newId('profile'),
      name: p.name,
      type: p.type,
      avatar: p.avatar ?? null,
      color: p.color,
    };
    const { data, error } = await client().from('profiles').insert(row).select().single();
    if (error) throw new Error(error.message);
    return toProfile(data as ProfileRow);
  },

  async deleteProfile(id: string): Promise<void> {
    const { error } = await client().from('profiles').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  // ---- Debt groups ----
  async addDebtGroup(name: string) {
    const { error } = await client().from('debt_groups').upsert({ name });
    if (error) throw new Error(error.message);
    return { name };
  },

  async renameDebtGroup(oldName: string, newName: string) {
    // Sem UPDATE em coluna PK — apaga + insere e atualiza fk manualmente
    const c = client();
    const { error: e1 } = await c.from('debt_groups').insert({ name: newName });
    if (e1 && !e1.message.includes('duplicate')) throw new Error(e1.message);
    const { error: e2 } = await c.from('expenses').update({ group_name: newName }).eq('group_name', oldName);
    if (e2) throw new Error(e2.message);
    const { error: e3 } = await c.from('debt_groups').delete().eq('name', oldName);
    if (e3) throw new Error(e3.message);
    return { name: newName };
  },

  async deleteDebtGroup(name: string) {
    const c = client();
    await c.from('expenses').update({ group_name: null }).eq('group_name', name);
    const { error } = await c.from('debt_groups').delete().eq('name', name);
    if (error) throw new Error(error.message);
  },

  // ---- Bulk operations ----
  async copyPreviousMonth(month: number, year: number, profileId: string | 'all') {
    const c = client();
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;

    let expensesQ = c.from('expenses').select('*')
      .eq('month', prevMonth).eq('year', prevYear).eq('payment_type', 'recorrente');
    let incomesQ = c.from('incomes').select('*').eq('month', prevMonth).eq('year', prevYear);
    if (profileId && profileId !== 'all') {
      expensesQ = expensesQ.eq('profile_id', profileId);
      incomesQ = incomesQ.eq('profile_id', profileId);
    }
    const [{ data: expensesPrev }, { data: incomesPrev }] = await Promise.all([expensesQ, incomesQ]);

    const now = new Date().toISOString();
    const newExpenses = (expensesPrev ?? []).map((e: ExpenseRow) => ({
      ...e,
      id: newId('exp'),
      month, year,
      status: 'nao_pago' as const,
      total_paid: 0,
      total_remaining: e.amount,
      created_at: now,
      user_id: undefined,
    }));
    const newIncomes = (incomesPrev ?? []).map((i: IncomeRow) => ({
      ...i,
      id: newId('income'),
      month, year,
      created_at: now,
      user_id: undefined,
    }));

    if (newExpenses.length) {
      const { error } = await c.from('expenses').insert(newExpenses);
      if (error) throw new Error(error.message);
    }
    if (newIncomes.length) {
      const { error } = await c.from('incomes').insert(newIncomes);
      if (error) throw new Error(error.message);
    }

    return { copiedExpenses: newExpenses.length, copiedIncomes: newIncomes.length };
  },

  async replicatePreviousMonth(month: number, year: number, profileId: string | 'all') {
    const c = client();
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;

    let q = c.from('expenses').select('*').eq('month', prevMonth).eq('year', prevYear);
    if (profileId && profileId !== 'all') q = q.eq('profile_id', profileId);
    const { data: source, error } = await q;
    if (error) throw new Error(error.message);

    const now = new Date().toISOString();
    let inserted = 0;
    let skipped = 0;
    const rows: Partial<ExpenseRow>[] = [];

    for (const e of source ?? []) {
      const row = e as ExpenseRow;
      let current = row.current_installment;
      if (row.payment_type === 'parcelado' && current != null && row.total_installments != null) {
        if (current >= row.total_installments) { skipped++; continue; }
        current = current + 1;
      }
      rows.push({
        ...row,
        id: newId('exp'),
        month, year,
        status: 'nao_pago',
        total_paid: 0,
        total_remaining: row.amount,
        created_at: now,
        current_installment: current,
        // não copia user_id — RLS/DEFAULT preenche
        // @ts-expect-error - user_id não faz parte da nossa row modelada
        user_id: undefined,
      });
      inserted++;
    }

    if (rows.length) {
      const { error: insErr } = await c.from('expenses').insert(rows);
      if (insErr) throw new Error(insErr.message);
    }
    return { inserted, skipped, source: { month: prevMonth, year: prevYear } };
  },

  /**
   * Popula as tabelas do usuário atual a partir do JSON descriptografado
   * do seed. Só roda se as tabelas estiverem vazias — evita sobrescrever
   * dados de outra sessão.
   */
  async importFromSeed(data: unknown): Promise<{ imported: boolean; profiles: number; expenses: number; incomes: number }> {
    const c = client();
    const seed = data as { profiles?: unknown[]; expenses?: unknown[]; incomes?: unknown[]; debtGroups?: string[] };

    const existing = await c.from('profiles').select('id', { count: 'exact', head: true });
    if ((existing.count ?? 0) > 0) return { imported: false, profiles: 0, expenses: 0, incomes: 0 };

    const profilesArr = (seed.profiles ?? []) as FamilyProfile[];
    const expensesArr = (seed.expenses ?? []) as Expense[];
    const incomesArr  = (seed.incomes  ?? []) as Income[];
    const groupsArr   = (seed.debtGroups ?? []) as string[];

    if (profilesArr.length) {
      const rows = profilesArr.map((p) => ({
        id: p.id, name: p.name, type: p.type, avatar: p.avatar ?? null, color: p.color,
      }));
      const { error } = await c.from('profiles').insert(rows);
      if (error) throw new Error(`profiles: ${error.message}`);
    }

    if (groupsArr.length) {
      const { error } = await c.from('debt_groups').insert(groupsArr.map((name) => ({ name })));
      if (error && !error.message.includes('duplicate')) throw new Error(`debt_groups: ${error.message}`);
    }

    if (incomesArr.length) {
      const rows = incomesArr.map((i) => ({ ...incomeToRow(i), id: i.id }));
      const { error } = await c.from('incomes').insert(rows);
      if (error) throw new Error(`incomes: ${error.message}`);
    }

    if (expensesArr.length) {
      // Insere em batches de 500 pra evitar limite de payload
      const batchSize = 500;
      for (let i = 0; i < expensesArr.length; i += batchSize) {
        const rows = expensesArr.slice(i, i + batchSize)
          .map((e) => ({ ...expenseToRow(e), id: e.id }));
        const { error } = await c.from('expenses').insert(rows);
        if (error) throw new Error(`expenses[${i}]: ${error.message}`);
      }
    }

    return {
      imported: true,
      profiles: profilesArr.length,
      expenses: expensesArr.length,
      incomes: incomesArr.length,
    };
  },

  async wipe(): Promise<void> {
    const c = client();
    // Ordem importa por causa das FKs
    await c.from('expenses').delete().neq('id', '');
    await c.from('incomes').delete().neq('id', '');
    await c.from('debt_groups').delete().neq('name', '');
    await c.from('profiles').delete().neq('id', '');
  },
};

export type SupabaseApi = typeof supabaseApi;
