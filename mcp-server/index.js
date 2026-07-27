#!/usr/bin/env node
/**
 * MCP server para o app "Meu Bolso Feliz".
 * Compartilha o mesmo SQLite do backend Express, expõe tools para:
 *   - Consultar/agregar dados (rendas, despesas, resumo, saúde financeira)
 *   - Adicionar/editar/remover registros
 *   - Rodar uma suíte de testes ponta-a-ponta que valida o schema, os
 *     invariantes e (opcionalmente) o servidor Express se ele estiver de pé.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Reutiliza o mesmo módulo de DB do backend para garantir schema idêntico
const dbModule = await import(pathToFileURL(path.resolve(__dirname, '..', 'server', 'db.js')).href);
const typesModule = await import('@modelcontextprotocol/sdk/types.js');
const db = dbModule.default;
const { rowToExpense, rowToIncome, rowToProfile, tx, DB_PATH } = dbModule;
const { ListResourcesRequestSchema, ReadResourceRequestSchema } = typesModule;

const API_BASE = process.env.API_URL ?? 'http://localhost:3001';

const ok = (obj) => ({ content: [{ type: 'text', text: JSON.stringify(obj, null, 2) }] });
const fail = (msg) => ({ isError: true, content: [{ type: 'text', text: `Erro: ${msg}` }] });

const server = new McpServer(
  { name: 'meu-bolso-feliz-mcp', version: '1.0.0' },
  { capabilities: { tools: {}, resources: {} } },
);

// -----------------------------------------------------------------------
// Recursos
// -----------------------------------------------------------------------
server.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    { uri: 'finance://schema', name: 'Schema do banco', mimeType: 'text/plain' },
    { uri: 'finance://db-path', name: 'Caminho do arquivo SQLite', mimeType: 'text/plain' },
  ],
}));
server.server.setRequestHandler(ReadResourceRequestSchema, async (req) => {
    if (req.params.uri === 'finance://schema') {
      const rows = db
        .prepare("SELECT name, sql FROM sqlite_master WHERE type IN ('table','index') AND name NOT LIKE 'sqlite_%' ORDER BY type, name")
        .all();
      const text = rows.map((r) => `-- ${r.name}\n${r.sql};`).join('\n\n');
      return { contents: [{ uri: req.params.uri, mimeType: 'text/plain', text }] };
    }
    if (req.params.uri === 'finance://db-path') {
      return { contents: [{ uri: req.params.uri, mimeType: 'text/plain', text: DB_PATH }] };
    }
  throw new Error(`Recurso desconhecido: ${req.params.uri}`);
});

// -----------------------------------------------------------------------
// Tools de consulta
// -----------------------------------------------------------------------
server.registerTool(
  'list_profiles',
  {
    title: 'Listar perfis',
    description: 'Retorna todos os perfis familiares cadastrados.',
    inputSchema: {},
  },
  async () => {
    const rows = db.prepare('SELECT * FROM profiles ORDER BY name').all().map(rowToProfile);
    return ok(rows);
  },
);

server.registerTool(
  'list_incomes',
  {
    title: 'Listar rendas',
    description: 'Retorna rendas, opcionalmente filtradas por mês/ano/perfil.',
    inputSchema: {
      month: z.number().int().min(1).max(12).optional(),
      year: z.number().int().optional(),
      profileId: z.string().optional(),
    },
  },
  async ({ month, year, profileId }) => {
    let sql = 'SELECT * FROM incomes WHERE 1=1';
    const args = [];
    if (month !== undefined) { sql += ' AND month=?'; args.push(month); }
    if (year !== undefined) { sql += ' AND year=?'; args.push(year); }
    if (profileId && profileId !== 'all') { sql += ' AND profile_id=?'; args.push(profileId); }
    sql += ' ORDER BY year DESC, month DESC, name';
    return ok(db.prepare(sql).all(...args).map(rowToIncome));
  },
);

server.registerTool(
  'list_expenses',
  {
    title: 'Listar despesas',
    description: 'Retorna despesas, opcionalmente filtradas.',
    inputSchema: {
      month: z.number().int().min(1).max(12).optional(),
      year: z.number().int().optional(),
      profileId: z.string().optional(),
      status: z.enum(['pago', 'nao_pago']).optional(),
      type: z.enum(['cartao_credito', 'emprestimo', 'conta_fixa', 'aluguel', 'escola', 'outros']).optional(),
    },
  },
  async ({ month, year, profileId, status, type }) => {
    let sql = 'SELECT * FROM expenses WHERE 1=1';
    const args = [];
    if (month !== undefined) { sql += ' AND month=?'; args.push(month); }
    if (year !== undefined) { sql += ' AND year=?'; args.push(year); }
    if (profileId && profileId !== 'all') { sql += ' AND profile_id=?'; args.push(profileId); }
    if (status) { sql += ' AND status=?'; args.push(status); }
    if (type) { sql += ' AND type=?'; args.push(type); }
    sql += ' ORDER BY year DESC, month DESC, due_day, name';
    return ok(db.prepare(sql).all(...args).map(rowToExpense));
  },
);

server.registerTool(
  'get_summary',
  {
    title: 'Resumo financeiro',
    description: 'Totais, comprometimento salarial, gastos por tipo e por dia de vencimento.',
    inputSchema: {
      month: z.number().int().min(1).max(12),
      year: z.number().int(),
      profileId: z.string().optional(),
    },
  },
  async ({ month, year, profileId }) => {
    const filter = (t) => {
      let sql = `SELECT * FROM ${t} WHERE month=? AND year=?`;
      const p = [month, year];
      if (profileId && profileId !== 'all') { sql += ' AND profile_id=?'; p.push(profileId); }
      return db.prepare(sql).all(...p);
    };
    const expenses = filter('expenses');
    const incomes = filter('incomes');
    const totalIncome = incomes.reduce((s, r) => s + r.amount, 0);
    const totalExpenses = expenses.reduce((s, r) => s + r.amount, 0);
    const totalPaid = expenses.filter((e) => e.status === 'pago').reduce((s, r) => s + r.amount, 0);
    const totalPending = expenses.filter((e) => e.status === 'nao_pago').reduce((s, r) => s + r.amount, 0);
    const byType = {};
    for (const e of expenses) byType[e.type] = (byType[e.type] ?? 0) + e.amount;
    const byDueDay = { 10: 0, 15: 0, 30: 0 };
    for (const e of expenses) byDueDay[e.due_day] = (byDueDay[e.due_day] ?? 0) + e.amount;
    return ok({
      month, year, profileId: profileId ?? 'all',
      totals: {
        totalIncome, totalExpenses, totalPaid, totalPending,
        balance: totalIncome - totalExpenses,
        salaryCommitment: totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0,
      },
      byType, byDueDay,
      counts: { expenses: expenses.length, incomes: incomes.length },
    });
  },
);

server.registerTool(
  'financial_health',
  {
    title: 'Score de saúde financeira',
    description: 'Calcula o score 0–100 baseado em savings rate + debt-to-income.',
    inputSchema: {
      month: z.number().int().min(1).max(12),
      year: z.number().int(),
      profileId: z.string().optional(),
    },
  },
  async ({ month, year, profileId }) => {
    const filter = (t) => {
      let sql = `SELECT * FROM ${t} WHERE month=? AND year=?`;
      const p = [month, year];
      if (profileId && profileId !== 'all') { sql += ' AND profile_id=?'; p.push(profileId); }
      return db.prepare(sql).all(...p);
    };
    const totalIncome = filter('incomes').reduce((s, r) => s + r.amount, 0);
    const totalExpenses = filter('expenses').reduce((s, r) => s + r.amount, 0);
    const balance = totalIncome - totalExpenses;
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
    let status;
    if (score >= 80) status = 'excelente';
    else if (score >= 60) status = 'bom';
    else if (score >= 40) status = 'regular';
    else if (score >= 20) status = 'ruim';
    else status = 'critico';
    return ok({ score, status, savingsRate, debtToIncomeRatio, emergencyFundMonths });
  },
);

// -----------------------------------------------------------------------
// Tools de mutação
// -----------------------------------------------------------------------
const incomeInput = {
  name: z.string().min(1),
  type: z.enum(['salario', 'beneficio', 'freelance', 'investimento', 'outros']),
  amount: z.number().nonnegative(),
  isRecurrent: z.boolean().default(false),
  profileId: z.string().min(1),
  month: z.number().int().min(1).max(12),
  year: z.number().int(),
};

server.registerTool(
  'add_income',
  { title: 'Adicionar renda', description: 'Insere uma nova entrada de renda.', inputSchema: incomeInput },
  async (input) => {
    const id = `income-${Date.now()}`;
    const createdAt = new Date().toISOString();
    db.prepare(`
      INSERT INTO incomes (id,name,type,amount,is_recurrent,profile_id,month,year,created_at)
      VALUES (?,?,?,?,?,?,?,?,?)
    `).run(id, input.name, input.type, input.amount, input.isRecurrent ? 1 : 0,
           input.profileId, input.month, input.year, createdAt);
    return ok(rowToIncome(db.prepare('SELECT * FROM incomes WHERE id=?').get(id)));
  },
);

const expenseInput = {
  name: z.string().min(1),
  type: z.enum(['cartao_credito', 'emprestimo', 'conta_fixa', 'aluguel', 'escola', 'outros']),
  amount: z.number().nonnegative(),
  dueDay: z.union([z.literal(10), z.literal(15), z.literal(30)]),
  paymentType: z.enum(['recorrente', 'parcelado']),
  paymentMethod: z.enum(['pix', 'boleto', 'debito_automatico', 'cartao', 'dinheiro', 'transferencia']).optional(),
  currentInstallment: z.number().int().optional(),
  totalInstallments: z.number().int().optional(),
  endDate: z.string().optional(),
  status: z.enum(['pago', 'nao_pago']).default('nao_pago'),
  profileId: z.string().min(1),
  month: z.number().int().min(1).max(12),
  year: z.number().int(),
  groupName: z.string().optional(),
};

server.registerTool(
  'add_expense',
  { title: 'Adicionar despesa', description: 'Insere uma nova despesa.', inputSchema: expenseInput },
  async (b) => {
    const id = `exp-${Date.now()}`;
    const createdAt = new Date().toISOString();
    const totalPaid = b.status === 'pago' ? b.amount : 0;
    const totalRemaining = b.status === 'pago' ? 0 : b.amount;
    db.prepare(`
      INSERT INTO expenses (
        id, name, type, amount, due_day, payment_type, payment_method,
        current_installment, total_installments, end_date, status,
        total_paid, total_remaining, created_at, profile_id, month, year, group_name
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(
      id, b.name, b.type, b.amount, b.dueDay, b.paymentType, b.paymentMethod ?? null,
      b.currentInstallment ?? null, b.totalInstallments ?? null, b.endDate ?? null,
      b.status, totalPaid, totalRemaining, createdAt,
      b.profileId, b.month, b.year, b.groupName ?? null,
    );
    return ok(rowToExpense(db.prepare('SELECT * FROM expenses WHERE id=?').get(id)));
  },
);

server.registerTool(
  'toggle_expense_status',
  {
    title: 'Alternar pago/não pago',
    description: 'Inverte o status de pagamento de uma despesa.',
    inputSchema: { id: z.string().min(1) },
  },
  async ({ id }) => {
    const row = db.prepare('SELECT * FROM expenses WHERE id=?').get(id);
    if (!row) return fail(`Despesa "${id}" não encontrada`);
    const newStatus = row.status === 'pago' ? 'nao_pago' : 'pago';
    db.prepare('UPDATE expenses SET status=?, total_paid=?, total_remaining=? WHERE id=?')
      .run(newStatus, newStatus === 'pago' ? row.amount : 0,
           newStatus === 'pago' ? 0 : row.amount, id);
    return ok(rowToExpense(db.prepare('SELECT * FROM expenses WHERE id=?').get(id)));
  },
);

server.registerTool(
  'delete_expense',
  { title: 'Remover despesa', description: 'Remove permanentemente uma despesa pelo ID.', inputSchema: { id: z.string() } },
  async ({ id }) => {
    const info = db.prepare('DELETE FROM expenses WHERE id=?').run(id);
    return info.changes === 0 ? fail('Despesa não encontrada') : ok({ deleted: id });
  },
);

server.registerTool(
  'delete_income',
  { title: 'Remover renda', description: 'Remove permanentemente uma renda pelo ID.', inputSchema: { id: z.string() } },
  async ({ id }) => {
    const info = db.prepare('DELETE FROM incomes WHERE id=?').run(id);
    return info.changes === 0 ? fail('Renda não encontrada') : ok({ deleted: id });
  },
);

server.registerTool(
  'add_profile',
  {
    title: 'Adicionar perfil',
    description: 'Cria um novo perfil familiar (titular, cônjuge, filho ou outro).',
    inputSchema: {
      name: z.string().min(1),
      type: z.enum(['titular', 'conjuge', 'filho', 'outro']),
      color: z.string().min(1),
      avatar: z.string().optional(),
    },
  },
  async ({ name, type, color, avatar }) => {
    const id = `profile-${Date.now()}`;
    db.prepare('INSERT INTO profiles (id,name,type,avatar,color) VALUES (?,?,?,?,?)')
      .run(id, name, type, avatar ?? null, color);
    return ok(rowToProfile(db.prepare('SELECT * FROM profiles WHERE id=?').get(id)));
  },
);

// -----------------------------------------------------------------------
// Suíte de testes
// -----------------------------------------------------------------------
async function checkApi(pathname) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 1500);
  try {
    const res = await fetch(`${API_BASE}${pathname}`, { signal: controller.signal });
    clearTimeout(timer);
    return { ok: res.ok, status: res.status };
  } catch (e) {
    clearTimeout(timer);
    return { ok: false, status: 0, error: e instanceof Error ? e.message : String(e) };
  }
}

async function runTestSuite() {
  const results = [];
  const t = (name, fn) => {
    try {
      const out = fn();
      results.push({ name, passed: true, detail: out ?? null });
    } catch (e) {
      results.push({ name, passed: false, error: e instanceof Error ? e.message : String(e) });
    }
  };

  // --- Testes de schema/dados ---
  t('DB acessível', () => {
    const c = db.prepare('SELECT COUNT(*) c FROM profiles').get().c;
    if (typeof c !== 'number') throw new Error('Contagem de perfis não retornou número');
    return { profileCount: c };
  });
  t('Há pelo menos 1 perfil', () => {
    const c = db.prepare('SELECT COUNT(*) c FROM profiles').get().c;
    if (c < 1) throw new Error('Nenhum perfil cadastrado');
    return { count: c };
  });
  t('Todas as despesas apontam para perfis existentes', () => {
    const orphans = db.prepare(`
      SELECT e.id FROM expenses e
      LEFT JOIN profiles p ON p.id = e.profile_id
      WHERE p.id IS NULL
    `).all();
    if (orphans.length) throw new Error(`Despesas órfãs: ${orphans.map((o) => o.id).join(', ')}`);
    return { orphans: 0 };
  });
  t('Todas as rendas apontam para perfis existentes', () => {
    const orphans = db.prepare(`
      SELECT i.id FROM incomes i
      LEFT JOIN profiles p ON p.id = i.profile_id
      WHERE p.id IS NULL
    `).all();
    if (orphans.length) throw new Error(`Rendas órfãs: ${orphans.map((o) => o.id).join(', ')}`);
    return { orphans: 0 };
  });
  t('Despesas recorrentes pagas têm total_remaining = 0', () => {
    const bad = db.prepare(`
      SELECT id, name, total_remaining FROM expenses
      WHERE payment_type='recorrente' AND status='pago' AND total_remaining > 0
    `).all();
    if (bad.length) throw new Error(`${bad.length} inconsistência(s): ${bad.slice(0, 3).map((b) => b.id).join(', ')}`);
    return { inconsistent: 0 };
  });
  t('Despesas recorrentes não pagas têm total_paid = 0', () => {
    const bad = db.prepare(`
      SELECT id FROM expenses
      WHERE payment_type='recorrente' AND status='nao_pago' AND total_paid > 0
    `).all();
    if (bad.length) throw new Error(`${bad.length} inconsistência(s): ${bad.slice(0, 3).map((b) => b.id).join(', ')}`);
    return { inconsistent: 0 };
  });
  t('Despesas parceladas têm parcela ou data-fim', () => {
    // Parcelado precisa OU ter (current+total válidos) OU endDate. E se
    // vier current/total, current não pode ser > total.
    const bad = db.prepare(`
      SELECT id FROM expenses
      WHERE payment_type='parcelado'
        AND (
          (current_installment IS NULL AND total_installments IS NULL AND end_date IS NULL)
          OR (current_installment IS NOT NULL AND total_installments IS NOT NULL
              AND current_installment > total_installments)
        )
    `).all();
    if (bad.length) throw new Error(`${bad.length} parcelamento(s) sem parcela nem data-fim`);
    return { inconsistent: 0 };
  });
  t('due_day sempre em {10,15,30}', () => {
    const bad = db.prepare(`SELECT id, due_day FROM expenses WHERE due_day NOT IN (10,15,30)`).all();
    if (bad.length) throw new Error(`due_day inválido: ${bad.length} despesa(s)`);
    return { bad: 0 };
  });
  t('Toggle de status é reversível', () => {
    const row = db.prepare('SELECT * FROM expenses LIMIT 1').get();
    if (!row) return { skipped: true };
    const before = row.status;
    db.prepare('UPDATE expenses SET status=? WHERE id=?').run(before === 'pago' ? 'nao_pago' : 'pago', row.id);
    db.prepare('UPDATE expenses SET status=? WHERE id=?').run(before, row.id);
    const after = db.prepare('SELECT status FROM expenses WHERE id=?').get(row.id).status;
    if (after !== before) throw new Error('Status não voltou ao original');
    return { probe: row.id };
  });
  t('CRUD atômico de renda funciona', () => {
    const profile = db.prepare('SELECT id FROM profiles LIMIT 1').get();
    if (!profile) throw new Error('Sem perfil para o teste');
    const testId = `mcp-test-${Date.now()}`;
    tx(() => {
      db.prepare(`INSERT INTO incomes (id,name,type,amount,is_recurrent,profile_id,month,year,created_at)
                  VALUES (?,?,?,?,?,?,?,?,?)`)
        .run(testId, 'MCP Test', 'outros', 100, 0, profile.id, 1, 2099, new Date().toISOString());
      db.prepare('DELETE FROM incomes WHERE id=?').run(testId);
    });
    const stillThere = db.prepare('SELECT 1 FROM incomes WHERE id=?').get(testId);
    if (stillThere) throw new Error('Renda de teste não foi limpa');
    return { probe: testId };
  });

  // --- Teste opcional da API HTTP ---
  const health = await checkApi('/api/health');
  if (health.ok) {
    const state = await checkApi('/api/state');
    results.push({ name: 'API /health responde', passed: true, detail: { status: health.status } });
    results.push({ name: 'API /state responde', passed: state.ok, detail: { status: state.status } });
  } else {
    results.push({
      name: 'API HTTP (opcional)',
      passed: true,
      detail: { skipped: true, note: `Servidor Express não está de pé em ${API_BASE} — rode "npm run server" para testar as rotas HTTP.` },
    });
  }

  const passed = results.filter((r) => r.passed).length;
  const failed = results.length - passed;
  return { passed, failed, total: results.length, results };
}

server.registerTool(
  'run_test_suite',
  {
    title: 'Rodar testes',
    description: 'Executa toda a suíte de validação: schema, integridade referencial, invariantes e API HTTP (se estiver de pé).',
    inputSchema: {},
  },
  async () => {
    const report = await runTestSuite();
    return {
      isError: report.failed > 0,
      content: [{
        type: 'text',
        text: `${report.passed}/${report.total} testes passaram — ${report.failed} falha(s).\n\n${JSON.stringify(report.results, null, 2)}`,
      }],
    };
  },
);

server.registerTool(
  'api_health',
  {
    title: 'Health-check da API',
    description: `Faz GET em ${API_BASE}/api/health.`,
    inputSchema: {},
  },
  async () => {
    const r = await checkApi('/api/health');
    return ok({ ...r, endpoint: `${API_BASE}/api/health` });
  },
);

// -----------------------------------------------------------------------
// Startup
// -----------------------------------------------------------------------
const transport = new StdioServerTransport();
await server.connect(transport);
process.stderr.write(`[mcp] meu-bolso-feliz-mcp online — DB=${DB_PATH}\n`);
