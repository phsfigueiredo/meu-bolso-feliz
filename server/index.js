import express from 'express';
import cors from 'cors';
import db, { rowToExpense, rowToIncome, rowToProfile, tx } from './db.js';
import { runSeed } from './seed.js';

const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

const empty = db.prepare('SELECT COUNT(*) c FROM profiles').get().c === 0;
if (empty) {
  runSeed();
  console.log('[seed] Banco vazio → dados iniciais carregados.');
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

app.get('/api/state', (_req, res) => {
  const profiles = db.prepare('SELECT * FROM profiles ORDER BY name').all().map(rowToProfile);
  const incomes  = db.prepare('SELECT * FROM incomes').all().map(rowToIncome);
  const expenses = db.prepare('SELECT * FROM expenses').all().map(rowToExpense);
  const debtGroups = db.prepare('SELECT name FROM debt_groups ORDER BY name').all().map(r => r.name);
  const lastSaveRow = db.prepare("SELECT value FROM meta WHERE key='last_save'").get();
  res.json({
    profiles, incomes, expenses, debtGroups,
    lastSaved: lastSaveRow?.value ?? null,
  });
});

app.post('/api/state/save', (_req, res) => {
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO meta(key,value) VALUES('last_save', ?)
    ON CONFLICT(key) DO UPDATE SET value=excluded.value
  `).run(now);
  res.json({ ok: true, lastSaved: now });
});

app.get('/api/profiles', (_req, res) => {
  const rows = db.prepare('SELECT * FROM profiles ORDER BY name').all().map(rowToProfile);
  res.json(rows);
});

app.post('/api/profiles', (req, res) => {
  const { name, type, avatar, color } = req.body || {};
  if (!name || !type || !color) return res.status(400).json({ error: 'name, type, color required' });
  const id = `profile-${Date.now()}`;
  db.prepare(`INSERT INTO profiles (id,name,type,avatar,color) VALUES (?,?,?,?,?)`)
    .run(id, name, type, avatar ?? null, color);
  res.status(201).json(rowToProfile(db.prepare('SELECT * FROM profiles WHERE id=?').get(id)));
});

app.delete('/api/profiles/:id', (req, res) => {
  const info = db.prepare('DELETE FROM profiles WHERE id=?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'not found' });
  res.status(204).end();
});

app.get('/api/incomes', (req, res) => {
  const { month, year, profileId } = req.query;
  let sql = 'SELECT * FROM incomes WHERE 1=1';
  const params = [];
  if (month)     { sql += ' AND month=?';      params.push(Number(month)); }
  if (year)      { sql += ' AND year=?';       params.push(Number(year));  }
  if (profileId && profileId !== 'all') { sql += ' AND profile_id=?'; params.push(profileId); }
  res.json(db.prepare(sql).all(...params).map(rowToIncome));
});

app.post('/api/incomes', (req, res) => {
  const b = req.body || {};
  const required = ['name', 'type', 'amount', 'profileId', 'month', 'year'];
  for (const k of required) if (b[k] === undefined || b[k] === null) {
    return res.status(400).json({ error: `Missing field: ${k}` });
  }
  const id = b.id ?? `income-${Date.now()}`;
  const createdAt = b.createdAt ?? new Date().toISOString();
  db.prepare(`
    INSERT INTO incomes (id,name,type,amount,is_recurrent,profile_id,month,year,created_at)
    VALUES (?,?,?,?,?,?,?,?,?)
  `).run(id, b.name, b.type, Number(b.amount), b.isRecurrent ? 1 : 0,
         b.profileId, Number(b.month), Number(b.year), createdAt);
  res.status(201).json(rowToIncome(db.prepare('SELECT * FROM incomes WHERE id=?').get(id)));
});

app.put('/api/incomes/:id', (req, res) => {
  const b = req.body || {};
  const info = db.prepare(`
    UPDATE incomes SET
      name=@name, type=@type, amount=@amount, is_recurrent=@is_recurrent,
      profile_id=@profile_id, month=@month, year=@year
    WHERE id=@id
  `).run({
    id: req.params.id,
    name: b.name, type: b.type, amount: Number(b.amount),
    is_recurrent: b.isRecurrent ? 1 : 0,
    profile_id: b.profileId, month: Number(b.month), year: Number(b.year),
  });
  if (info.changes === 0) return res.status(404).json({ error: 'not found' });
  res.json(rowToIncome(db.prepare('SELECT * FROM incomes WHERE id=?').get(req.params.id)));
});

app.delete('/api/incomes/:id', (req, res) => {
  const info = db.prepare('DELETE FROM incomes WHERE id=?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'not found' });
  res.status(204).end();
});

app.get('/api/expenses', (req, res) => {
  const { month, year, profileId, status } = req.query;
  let sql = 'SELECT * FROM expenses WHERE 1=1';
  const params = [];
  if (month)     { sql += ' AND month=?'; params.push(Number(month)); }
  if (year)      { sql += ' AND year=?';  params.push(Number(year));  }
  if (profileId && profileId !== 'all') { sql += ' AND profile_id=?'; params.push(profileId); }
  if (status)    { sql += ' AND status=?'; params.push(String(status)); }
  res.json(db.prepare(sql).all(...params).map(rowToExpense));
});

function upsertExpense(id, b, createdAt) {
  db.prepare(`
    INSERT INTO expenses (
      id, name, type, amount, due_day, payment_type, payment_method,
      current_installment, total_installments, end_date, status,
      total_paid, total_remaining, created_at, profile_id, month, year, group_name
    ) VALUES (
      @id, @name, @type, @amount, @due_day, @payment_type, @payment_method,
      @current_installment, @total_installments, @end_date, @status,
      @total_paid, @total_remaining, @created_at, @profile_id, @month, @year, @group_name
    )
  `).run({
    id, name: b.name, type: b.type, amount: Number(b.amount), due_day: Number(b.dueDay),
    payment_type: b.paymentType, payment_method: b.paymentMethod ?? null,
    current_installment: b.currentInstallment ?? null,
    total_installments: b.totalInstallments ?? null,
    end_date: b.endDate ?? null,
    status: b.status ?? 'nao_pago',
    total_paid: Number(b.totalPaid ?? 0),
    total_remaining: Number(b.totalRemaining ?? b.amount ?? 0),
    created_at: createdAt,
    profile_id: b.profileId, month: Number(b.month), year: Number(b.year),
    group_name: b.groupName ?? null,
  });
}

app.post('/api/expenses', (req, res) => {
  const b = req.body || {};
  const required = ['name', 'type', 'amount', 'dueDay', 'paymentType', 'profileId', 'month', 'year'];
  for (const k of required) if (b[k] === undefined || b[k] === null) {
    return res.status(400).json({ error: `Missing field: ${k}` });
  }
  const id = b.id ?? `exp-${Date.now()}`;
  const createdAt = b.createdAt ?? new Date().toISOString();
  upsertExpense(id, b, createdAt);
  res.status(201).json(rowToExpense(db.prepare('SELECT * FROM expenses WHERE id=?').get(id)));
});

app.put('/api/expenses/:id', (req, res) => {
  const b = req.body || {};
  const existing = db.prepare('SELECT * FROM expenses WHERE id=?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'not found' });
  db.prepare(`
    UPDATE expenses SET
      name=@name, type=@type, amount=@amount, due_day=@due_day,
      payment_type=@payment_type, payment_method=@payment_method,
      current_installment=@current_installment, total_installments=@total_installments,
      end_date=@end_date, status=@status, total_paid=@total_paid,
      total_remaining=@total_remaining, profile_id=@profile_id,
      month=@month, year=@year, group_name=@group_name
    WHERE id=@id
  `).run({
    id: req.params.id,
    name: b.name, type: b.type, amount: Number(b.amount), due_day: Number(b.dueDay),
    payment_type: b.paymentType, payment_method: b.paymentMethod ?? null,
    current_installment: b.currentInstallment ?? null,
    total_installments: b.totalInstallments ?? null,
    end_date: b.endDate ?? null,
    status: b.status ?? 'nao_pago',
    total_paid: Number(b.totalPaid ?? 0),
    total_remaining: Number(b.totalRemaining ?? 0),
    profile_id: b.profileId, month: Number(b.month), year: Number(b.year),
    group_name: b.groupName ?? null,
  });
  res.json(rowToExpense(db.prepare('SELECT * FROM expenses WHERE id=?').get(req.params.id)));
});

app.patch('/api/expenses/:id/toggle', (req, res) => {
  const row = db.prepare('SELECT * FROM expenses WHERE id=?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'not found' });
  const newStatus = row.status === 'pago' ? 'nao_pago' : 'pago';
  const totalPaid      = newStatus === 'pago' ? row.amount : 0;
  const totalRemaining = newStatus === 'pago' ? 0 : row.amount;
  db.prepare(`UPDATE expenses SET status=?, total_paid=?, total_remaining=? WHERE id=?`)
    .run(newStatus, totalPaid, totalRemaining, req.params.id);
  res.json(rowToExpense(db.prepare('SELECT * FROM expenses WHERE id=?').get(req.params.id)));
});

app.delete('/api/expenses/:id', (req, res) => {
  const info = db.prepare('DELETE FROM expenses WHERE id=?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'not found' });
  res.status(204).end();
});

app.get('/api/debt-groups', (_req, res) => {
  const rows = db.prepare('SELECT name FROM debt_groups ORDER BY name').all().map(r => r.name);
  res.json(rows);
});

app.post('/api/debt-groups', (req, res) => {
  const { name } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name required' });
  db.prepare('INSERT INTO debt_groups(name) VALUES (?) ON CONFLICT(name) DO NOTHING').run(name);
  res.status(201).json({ name });
});

app.put('/api/debt-groups/:name', (req, res) => {
  const oldName = req.params.name;
  const newName = req.body?.name;
  if (!newName) return res.status(400).json({ error: 'new name required' });
  tx(() => {
    db.prepare('UPDATE debt_groups SET name=? WHERE name=?').run(newName, oldName);
    db.prepare('UPDATE expenses SET group_name=? WHERE group_name=?').run(newName, oldName);
  });
  res.json({ name: newName });
});

app.delete('/api/debt-groups/:name', (req, res) => {
  tx(() => {
    db.prepare('UPDATE expenses SET group_name=NULL WHERE group_name=?').run(req.params.name);
    db.prepare('DELETE FROM debt_groups WHERE name=?').run(req.params.name);
  });
  res.status(204).end();
});

/**
 * Replica TUDO do mês anterior para o mês/ano atual.
 * - Força status 'nao_pago' (zera total_paid, total_remaining = amount)
 * - Para parceladas: incrementa current_installment em +1
 * - Pula parcelamentos já quitados (current_installment >= total_installments)
 */
app.post('/api/replicate-previous-month', (req, res) => {
  const { month, year, profileId } = req.body || {};
  if (!month || !year) return res.status(400).json({ error: 'month, year required' });
  const prevMonth = Number(month) === 1 ? 12 : Number(month) - 1;
  const prevYear = Number(month) === 1 ? Number(year) - 1 : Number(year);

  let sql = 'SELECT * FROM expenses WHERE month=? AND year=?';
  const args = [prevMonth, prevYear];
  if (profileId && profileId !== 'all') { sql += ' AND profile_id=?'; args.push(profileId); }
  const prev = db.prepare(sql).all(...args);

  const now = new Date().toISOString();
  const insE = db.prepare(`
    INSERT INTO expenses (
      id, name, type, amount, due_day, payment_type, payment_method,
      current_installment, total_installments, end_date, status,
      total_paid, total_remaining, created_at, profile_id, month, year, group_name
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `);

  let inserted = 0;
  let skipped = 0;
  tx(() => {
    for (const e of prev) {
      let current = e.current_installment;
      if (e.payment_type === 'parcelado' && current != null && e.total_installments != null) {
        if (current >= e.total_installments) { skipped++; continue; }
        current = current + 1;
      }
      insE.run(
        `exp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        e.name, e.type, e.amount, e.due_day, e.payment_type, e.payment_method,
        current, e.total_installments, e.end_date,
        'nao_pago', 0, e.amount, now,
        e.profile_id, Number(month), Number(year), e.group_name,
      );
      inserted++;
    }
  });
  res.json({ inserted, skipped, source: { month: prevMonth, year: prevYear } });
});

app.post('/api/copy-previous-month', (req, res) => {
  const { month, year, profileId } = req.body || {};
  if (!month || !year) return res.status(400).json({ error: 'month, year required' });
  const prevMonth = Number(month) === 1 ? 12 : Number(month) - 1;
  const prevYear  = Number(month) === 1 ? Number(year) - 1 : Number(year);

  let expenseSql = `SELECT * FROM expenses WHERE month=? AND year=? AND payment_type='recorrente'`;
  let incomeSql  = `SELECT * FROM incomes  WHERE month=? AND year=?`;
  const eArgs = [prevMonth, prevYear];
  const iArgs = [prevMonth, prevYear];
  if (profileId && profileId !== 'all') {
    expenseSql += ' AND profile_id=?'; eArgs.push(profileId);
    incomeSql  += ' AND profile_id=?'; iArgs.push(profileId);
  }
  const expensesPrev = db.prepare(expenseSql).all(...eArgs);
  const incomesPrev  = db.prepare(incomeSql).all(...iArgs);

  const now = new Date().toISOString();
  const insE = db.prepare(`
    INSERT INTO expenses (
      id, name, type, amount, due_day, payment_type, payment_method,
      current_installment, total_installments, end_date, status,
      total_paid, total_remaining, created_at, profile_id, month, year, group_name
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `);
  const insI = db.prepare(`
    INSERT INTO incomes (id,name,type,amount,is_recurrent,profile_id,month,year,created_at)
    VALUES (?,?,?,?,?,?,?,?,?)
  `);
  tx(() => {
    for (const e of expensesPrev) {
      insE.run(
        `exp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        e.name, e.type, e.amount, e.due_day, e.payment_type, e.payment_method,
        e.current_installment, e.total_installments, e.end_date, 'nao_pago',
        0, e.amount, now, e.profile_id, Number(month), Number(year), e.group_name,
      );
    }
    for (const i of incomesPrev) {
      insI.run(
        `income-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        i.name, i.type, i.amount, i.is_recurrent, i.profile_id,
        Number(month), Number(year), now,
      );
    }
  });
  res.json({ copiedExpenses: expensesPrev.length, copiedIncomes: incomesPrev.length });
});

app.get('/api/summary', (req, res) => {
  const month = Number(req.query.month);
  const year  = Number(req.query.year);
  const profileId = req.query.profileId;
  if (!month || !year) return res.status(400).json({ error: 'month, year required' });

  const filter = (t) => {
    let sql = `SELECT * FROM ${t} WHERE month=? AND year=?`;
    const p = [month, year];
    if (profileId && profileId !== 'all') { sql += ' AND profile_id=?'; p.push(profileId); }
    return db.prepare(sql).all(...p);
  };

  const expenses = filter('expenses');
  const incomes  = filter('incomes');
  const totalIncome   = incomes.reduce((s, r) => s + r.amount, 0);
  const totalExpenses = expenses.reduce((s, r) => s + r.amount, 0);
  const totalPaid     = expenses.filter(e => e.status === 'pago').reduce((s, r) => s + r.amount, 0);
  const totalPending  = expenses.filter(e => e.status === 'nao_pago').reduce((s, r) => s + r.amount, 0);
  const salaryCommitment = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;
  const balance = totalIncome - totalExpenses;

  const byType = {};
  for (const e of expenses) byType[e.type] = (byType[e.type] ?? 0) + e.amount;

  const byDueDay = { 10: 0, 15: 0, 30: 0 };
  for (const e of expenses) byDueDay[e.due_day] = (byDueDay[e.due_day] ?? 0) + e.amount;

  res.json({
    month, year, profileId: profileId ?? 'all',
    totals: { totalIncome, totalExpenses, totalPaid, totalPending, salaryCommitment, balance },
    byType, byDueDay,
    counts: { expenses: expenses.length, incomes: incomes.length },
  });
});

app.use((err, _req, res, _next) => {
  console.error('[api-error]', err);
  res.status(500).json({ error: err.message ?? 'internal error' });
});

app.listen(PORT, () => {
  console.log(`[api] Meu Bolso Feliz API online → http://localhost:${PORT}`);
});
