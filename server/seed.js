import db, { tx } from './db.js';

const profiles = [
  { id: 'profile-1', name: 'João',  type: 'titular', color: 'hsl(var(--chart-1))' },
  { id: 'profile-2', name: 'Maria', type: 'conjuge', color: 'hsl(var(--chart-2))' },
];

const incomes = [
  { id: 'income-1', name: 'Salário João',     type: 'salario',   amount: 8500, isRecurrent: true, profileId: 'profile-1', month: 1, year: 2026, createdAt: '2026-01-01' },
  { id: 'income-2', name: 'Vale Alimentação', type: 'beneficio', amount: 800,  isRecurrent: true, profileId: 'profile-1', month: 1, year: 2026, createdAt: '2026-01-01' },
  { id: 'income-3', name: 'Salário Maria',    type: 'salario',   amount: 6500, isRecurrent: true, profileId: 'profile-2', month: 1, year: 2026, createdAt: '2026-01-01' },
];

const expenses = [
  { id: '1',  name: 'Nubank',                type: 'cartao_credito', amount: 1250.00, dueDay: 10, paymentType: 'recorrente', paymentMethod: 'debito_automatico', status: 'nao_pago', totalPaid: 0,       totalRemaining: 1250.00,  createdAt: '2026-01-01', profileId: 'profile-1', month: 1, year: 2026 },
  { id: '2',  name: 'Itaú Personnalité',     type: 'cartao_credito', amount: 890.50,  dueDay: 15, paymentType: 'recorrente', paymentMethod: 'debito_automatico', status: 'pago',     totalPaid: 890.50,  totalRemaining: 0,        createdAt: '2026-01-01', profileId: 'profile-1', month: 1, year: 2026 },
  { id: '3',  name: 'Financiamento Carro',   type: 'emprestimo',     amount: 1800.00, dueDay: 10, paymentType: 'parcelado',  paymentMethod: 'boleto',            currentInstallment: 14, totalInstallments: 48, endDate: '2027-06-10', status: 'nao_pago', totalPaid: 25200.00, totalRemaining: 61200.00, createdAt: '2023-06-01', profileId: 'profile-1', month: 1, year: 2026 },
  { id: '4',  name: 'Empréstimo Pessoal',    type: 'emprestimo',     amount: 650.00,  dueDay: 30, paymentType: 'parcelado',  paymentMethod: 'pix',               currentInstallment: 8,  totalInstallments: 24, endDate: '2026-08-30', status: 'nao_pago', totalPaid: 5200.00,  totalRemaining: 10400.00, createdAt: '2024-04-01', profileId: 'profile-1', month: 1, year: 2026 },
  { id: '5',  name: 'Aluguel Apartamento',   type: 'aluguel',        amount: 2200.00, dueDay: 10, paymentType: 'recorrente', paymentMethod: 'pix',               status: 'pago',     totalPaid: 2200.00, totalRemaining: 0,        createdAt: '2026-01-01', profileId: 'profile-1', month: 1, year: 2026 },
  { id: '6',  name: 'Energia Elétrica',      type: 'conta_fixa',     amount: 280.00,  dueDay: 15, paymentType: 'recorrente', paymentMethod: 'debito_automatico', status: 'nao_pago', totalPaid: 0,       totalRemaining: 280.00,   createdAt: '2026-01-01', profileId: 'profile-1', month: 1, year: 2026 },
  { id: '7',  name: 'Internet Fibra',        type: 'conta_fixa',     amount: 150.00,  dueDay: 30, paymentType: 'recorrente', paymentMethod: 'debito_automatico', status: 'pago',     totalPaid: 150.00,  totalRemaining: 0,        createdAt: '2026-01-01', profileId: 'profile-1', month: 1, year: 2026 },
  { id: '8',  name: 'Escola Filho',          type: 'escola',         amount: 1450.00, dueDay: 10, paymentType: 'recorrente', paymentMethod: 'boleto',            status: 'nao_pago', totalPaid: 0,       totalRemaining: 1450.00,  createdAt: '2026-01-01', profileId: 'profile-1', month: 1, year: 2026 },
  { id: '9',  name: 'Academia Smart Fit',    type: 'outros',         amount: 99.90,   dueDay: 15, paymentType: 'recorrente', paymentMethod: 'cartao',            status: 'pago',     totalPaid: 99.90,   totalRemaining: 0,        createdAt: '2026-01-01', profileId: 'profile-1', month: 1, year: 2026 },
  { id: '10', name: 'Netflix + Spotify',     type: 'outros',         amount: 75.80,   dueDay: 30, paymentType: 'recorrente', paymentMethod: 'cartao',            status: 'nao_pago', totalPaid: 0,       totalRemaining: 75.80,    createdAt: '2026-01-01', profileId: 'profile-1', month: 1, year: 2026 },
  { id: '11', name: 'Cartão C6',             type: 'cartao_credito', amount: 650.00,  dueDay: 10, paymentType: 'recorrente', paymentMethod: 'debito_automatico', status: 'nao_pago', totalPaid: 0,       totalRemaining: 650.00,   createdAt: '2026-01-01', profileId: 'profile-2', month: 1, year: 2026 },
];

const insertProfile = db.prepare(`
  INSERT INTO profiles (id, name, type, avatar, color)
  VALUES (@id, @name, @type, @avatar, @color)
  ON CONFLICT(id) DO NOTHING
`);

const insertIncome = db.prepare(`
  INSERT INTO incomes (id, name, type, amount, is_recurrent, profile_id, month, year, created_at)
  VALUES (@id, @name, @type, @amount, @is_recurrent, @profile_id, @month, @year, @created_at)
  ON CONFLICT(id) DO NOTHING
`);

const insertExpense = db.prepare(`
  INSERT INTO expenses (
    id, name, type, amount, due_day, payment_type, payment_method,
    current_installment, total_installments, end_date, status,
    total_paid, total_remaining, created_at, profile_id, month, year, group_name
  ) VALUES (
    @id, @name, @type, @amount, @due_day, @payment_type, @payment_method,
    @current_installment, @total_installments, @end_date, @status,
    @total_paid, @total_remaining, @created_at, @profile_id, @month, @year, @group_name
  )
  ON CONFLICT(id) DO NOTHING
`);

function runSeed() {
  tx(() => {
    for (const p of profiles) {
      insertProfile.run({ ...p, avatar: p.avatar ?? null });
    }
    for (const i of incomes) {
      insertIncome.run({
        id: i.id, name: i.name, type: i.type, amount: i.amount,
        is_recurrent: i.isRecurrent ? 1 : 0,
        profile_id: i.profileId, month: i.month, year: i.year, created_at: i.createdAt,
      });
    }
    for (const e of expenses) {
      insertExpense.run({
        id: e.id, name: e.name, type: e.type, amount: e.amount, due_day: e.dueDay,
        payment_type: e.paymentType, payment_method: e.paymentMethod ?? null,
        current_installment: e.currentInstallment ?? null,
        total_installments: e.totalInstallments ?? null,
        end_date: e.endDate ?? null, status: e.status,
        total_paid: e.totalPaid, total_remaining: e.totalRemaining,
        created_at: e.createdAt, profile_id: e.profileId, month: e.month, year: e.year,
        group_name: e.groupName ?? null,
      });
    }
  });
}

const isMain = import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}` ||
               import.meta.url.endsWith(process.argv[1].split(/[\\/]/).pop());

if (isMain) {
  runSeed();
  const p = db.prepare('SELECT COUNT(*) c FROM profiles').get().c;
  const i = db.prepare('SELECT COUNT(*) c FROM incomes').get().c;
  const e = db.prepare('SELECT COUNT(*) c FROM expenses').get().c;
  console.log(`Seed pronto: ${p} perfis, ${i} rendas, ${e} despesas.`);
}

export { runSeed };
