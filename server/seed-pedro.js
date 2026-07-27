/**
 * Reset completo do banco: apaga todos os perfis/dados e recria apenas
 * "Pedro" (titular), populando com a massa fornecida pelo usuário.
 *
 * Uso: node server/seed-pedro.js
 *
 * Regras adotadas:
 * - Parcela "Recorrente"/"recorrente" → paymentType='recorrente'
 * - Parcela "N/NN" → paymentType='parcelado' com currentInstallment/totalInstallments
 * - Parcela "YYYY-MM-DD…" → paymentType='parcelado' com endDate
 * - Parcela "-" → paymentType='recorrente' (default seguro)
 *
 * O schema atual só permite dueDay em {10,15,30}. Escolho:
 * - Recorrente + cartão / aluguel → 10
 * - Recorrente + conta_fixa       → 15
 * - Recorrente + outros/escola/emprestimo → 30
 * - Se veio data (endDate), uso: dia<=10 → 10; dia<=15 → 15; senão 30.
 */
import db, { tx } from './db.js';

const YEAR = 2026;
const PROFILE_ID = 'pedro';

// -----------------------------------------------------------------------
// Massa de dados (name | amount | parcela | status | month)
// -----------------------------------------------------------------------
const raw = [
  // ---- Janeiro (1) ----
  ['Cartao Santander',            1700, 'Recorrente',            'PAGO',       1],
  ['Emprestimo Santander',        1160, '14/25',                 'PAGO',       1],
  ['Mylena',                       300, '2025-10-05',            'PAGO',       1],
  ['Emprestimo Mercado Pago',      350, '2025-10-08',            'PAGO',       1],
  ['Riachuello',                   188, '2025-08-08',            'PAGO',       1],
  ['Carro',                       1600, '3/36',                  'PAGO',       1],
  ['Aluguel',                     1250, '-',                     'PAGO',       1],
  ['Água e Luz',                   400, '-',                     'PAGO',       1],
  ['Riachuelo e Pernambucanas',     85, '2025-10-06',            'PAGO',       1],
  ['Cartão de Crédito ML',        1600, 'Recorrente',            'PAGO',       1],
  ['Cartão de Crédito Nubank',     450, 'Recorrente',            'PAGO',       1],
  ['Lote',                        1000, '26/35',                 'PAGO',       1],
  ['Cartão Will',                  500, 'Recorrente',            'PAGO',       1],
  ['Pai Empréstimo',              1200, '62/72',                 'PAGO',       1],
  ['Darlene',                      440, 'recorrente',            'PAGO',       1],
  ['Resquício',                    200, 'Recorrente',            'PAGO',       1],
  ['Myylena',                     1150, '2025-01-01',            'PAGO',       1],
  ['99 Empréstimo',                375, '2025-03-01',            'PAGO',       1],
  ['Escola Líder',                1500, 'Recorrente',            'PAGO',       1],
  ['Viera',                        145, '2026-01-01',            'PAGO',       1],
  ['Tablet Mãe',                   180, '2025-02-01',            'PAGO',       1],

  // ---- Fevereiro (2) ----
  ['Cartao Santander',            2200, 'Recorrente',            'PAGO',       2],
  ['Emprestimo Santander',        1160, '15/25',                 'PAGO',       2],
  ['Mylena',                       300, '2026-10-07',            'PAGO',       2],
  ['Emprestimo Mercado Pago',      350, '2026-10-09',            'PAGO',       2],
  ['Riachuello',                   188, '2026-04-02',            'PAGO',       2],
  ['Carro',                       1600, '7/36',                  'PAGO',       2],
  ['Aluguel',                     1250, '8/36',                  'PAGO',       2],
  ['Luz',                          370, 'Recorrente',            'NÃO PAGO',   2],
  ['Água',                         400, '-',                     'NÃO PAGO',   2],
  ['Riachuelo Mãe',                423, '2026-05-02',            'PAGO',       2],
  ['Pernambucanas Mãe',            190, '2026-10-07',            'PAGO',       2],
  ['Cartão de Crédito ML',         600, 'Recorrente',            'PAGO',       2],
  ['Cartão de Crédito Nubank',     750, 'Recorrente',            'PAGO',       2],
  ['Lote',                        1000, '26/35',                 'NÃO PAGO',   2],
  ['Cartão Will',                  300, '2026-03-02',            'PAGO',       2],
  ['Pai Empréstimo',              1200, '62/80',                 'PAGO',       2],
  ['Darlene',                      440, 'recorrente',            'PAGO',       2],
  ['Resquício',                    200, 'Recorrente',            'PAGO',       2],
  ['Myylena',                     2000, '2025-01-01',            'PAGO',       2],
  ['99 Empréstimo',                375, '2026-03-02',            'PAGO',       2],
  ['Escola Líder',                1480, 'Recorrente',            'PAGO',       2],
  ['Jeito',                        500, '2026-01-01',            'PAGO',       2],
  ['Condomínio Saquarema',         400, 'Recorrente',            'PAGO',       2],
  ['Livros da Escola dos Meninos',2505, '-',                     'PAGO',       2],
  ['Tablet Mãe',                   180, '2026-02-02',            'PAGO',       2],

  // ---- Março (3) ----
  ['Cartao Santander',            2000, 'Recorrente',            'PAGO',       3],
  ['Emprestimo Santander',        1160, '16/25',                 'PAGO',       3],
  ['Mylena',                       787, '2026-10-07',            'PAGO',       3],
  ['Emprestimo Mercado Pago',      350, '2026-10-10',            'PAGO',       3],
  ['Riachuello',                   188, '2026-04-03',            'PAGO',       3],
  ['Carro',                       1600, '8/36',                  'PAGO',       3],
  ['Aluguel',                     1250, '-',                     'PAGO',       3],
  ['Luz',                          370, 'Recorrente',            'PAGO',       3],
  ['Água',                         400, '-',                     'PAGO',       3],
  ['Riachuelo Mãe',                423, '2026-05-03',            'PAGO',       3],
  ['Pernambucanas Mãe',            190, '2026-10-08',            'PAGO',       3],
  ['Cartão de Crédito ML',         500, 'Recorrente',            'PAGO',       3],
  ['Cartão de Crédito Nubank',     300, 'Recorrente',            'PAGO',       3],
  ['Lote',                        1000, '28/35',                 'PAGO',       3],
  ['Cartão Will',                  300, '2026-03-03',            'NÃO PAGO',   3],
  ['Pai Empréstimo',              1200, '63/80',                 'PAGO',       3],
  ['Darlene',                      440, 'recorrente',            'PAGO',       3],
  ['Resquício',                    200, 'Recorrente',            'PAGO',       3],
  ['99 Empréstimo',                375, '2026-03-03',            'PAGO',       3],
  ['Escola Líder',                1480, 'Recorrente',            'PAGO',       3],
  ['Jeito',                        650, '2026-01-01',            'NÃO PAGO',   3],
  ['Obra Seu Sebastião',          2500, '2026-07-03',            'PAGO',       3],
  ['Obra Seu Sebastião',          2500, '2026-07-04',            'PAGO',       3],
  ['Condomínio Saquarema',         100, 'Recorrente',            'PAGO',       3],

  // ---- Abril (4) ----
  ['Mãe Massagem',                  60, '2026-12-02',            'PAGO',       4],
  ['Pernambucanas Mãe',            190, '2026-10-09',            'PAGO',       4],
  ['Café da Manhã Viagem',         100, '2026-06-02',            'PAGO',       4],
  ['Riachuelo Mãe',                423, '2026-05-04',            'PAGO',       4],
  ['Condomínio Saquarema',         160, 'Recorrente',            'PAGO',       4],
  ['Resquício',                    200, 'Recorrente',            'PAGO',       4],
  ['Luz',                          370, 'Recorrente',            'PAGO',       4],
  ['Água',                         400, '-',                     'PAGO',       4],
  ['Darlene',                      440, 'recorrente',            'NÃO PAGO',   4],
  ['Carro',                       1600, '9/36',                  'PAGO',       4],
  ['Mylena',                      1630, '2026-10-08',            'PAGO',       4],
  ['Riachuello',                   188, '2026-04-04',            'PAGO',       4],
  ['Cartão Will',                  300, '2026-03-03',            'NÃO PAGO',   4],
  ['Cartão de Crédito ML',         600, 'Recorrente',            'PAGO',       4],
  ['Cartão de Crédito Nubank',     700, 'Recorrente',            'PAGO',       4],
  ['Jeito',                        650, '2026-01-01',            'NÃO PAGO',   4],
  ['Pai Empréstimo',              1200, '64/80',                 'PAGO',       4],
  ['Aluguel',                     2500, '2026-12-09',            'PAGO',       4],
  ['99Pay',                       1000, '2026-03-01',            'NÃO PAGO',   4],
  ['Lote',                        1000, '29/35',                 'PAGO',       4],
  ['Emprestimo Santander',        1116, '17/25',                 'PAGO',       4],
  ['Escola Líder',                1480, 'Recorrente',            'PAGO',       4],
  ['Cartao Santander',            2000, 'Recorrente',            'PAGO',       4],
  ['Obra Seu Sebastião',          1000, '2026-07-06',            'PAGO',       4],
  ['Obra Seu Sebastião',          2000, '2026-07-05',            'PAGO',       4],

  // ---- Maio (5) ----
  ['Mãe Massagem',                  60, '2026-12-03',            'PAGO',       5],
  ['Pernambucanas Mãe',            190, '2026-10-10',            'PAGO',       5],
  ['Café da Manhã Viagem',         100, '2026-06-03',            'PAGO',       5],
  ['Riachuelo Mãe',                423, '2026-05-05',            'PAGO',       5],
  ['Mãe Empréstimo',               710, '2026-03-01',            'PAGO',       5],
  ['Condomínio Saquarema',         160, 'Recorrente',            'PAGO',       5],
  ['Resquício',                    200, 'Recorrente',            'NÃO PAGO',   5],
  ['Luz',                          250, 'Recorrente',            'NÃO PAGO',   5],
  ['Água',                         250, '-',                     'PAGO',       5],
  ['Darlene',                      440, 'recorrente',            'PAGO',       5],
  ['Carro',                       1600, '10/36',                 'PAGO',       5],
  ['Mylena',                      1630, '2026-10-09',            'PAGO',       5],
  ['Cartão Will',                  300, '2026-03-03',            'NÃO PAGO',   5],
  ['Cartão de Crédito ML',         600, 'Recorrente',            'PAGO',       5],
  ['Cartão de Crédito Nubank',     700, 'Recorrente',            'PAGO',       5],
  ['Jeito',                        650, '2026-01-01',            'NÃO PAGO',   5],
  ['Pai Empréstimo',              1200, '65/80',                 'PAGO',       5],
  ['Aluguel',                     2500, '2026-12-10',            'PAGO',       5],
  ['99Pay',                       1000, '2026-03-01',            'NÃO PAGO',   5],
  ['Lote',                        1000, '30/35',                 'NÃO PAGO',   5],
  ['Emprestimo Santander',        1116, '18/25',                 'PAGO',       5],
  ['Escola Líder',                1480, 'Recorrente',            'PAGO',       5],
  ['Cartao Santander',            2000, 'Recorrente',            'PAGO',       5],
  ['Empréstimo Consignado Santander', 1219, '-',                 'NÃO PAGO',   5],
  ['Obra Seu Sebastião',          1000, '2026-07-06',            'PAGO',       5],
  ['Cartão PJ NU - Yasmim',        245, 'Recorrente',            'PAGO',       5],
  ['Cartão PF NU - Yasmim',        400, 'Recorrente',            'PAGO',       5],
  ['MP Cartão - Yasmim',           500, 'Recorrente',            'PAGO',       5],
  ['MP Empréstimo - Yasmim',       265, '2026-12-05',            'PAGO',       5],
  ['MP Empréstimo - Yasmim',        97, '2026-12-06',            'PAGO',       5],
  ['Faculdade - Yasmim',           332, 'Recorrente',            'PAGO',       5],
  ['Internet - Yasmim',            130, 'Recorrente',            'PAGO',       5],
  ['NU Empréstimo - Yasmim',       180, '2026-04-02',            'PAGO',       5],
  ['Claro Flex - Yasmim',           40, 'Recorrente',            'PAGO',       5],
  ['Netflix - Yasmim',              45, 'Recorrente',            'PAGO',       5],
  ['Parcela SuperSim - Yasmim',    750, '2026-12-07',            'NÃO PAGO',   5],
  ['Shopee - Yasmim',              100, '2026-03-01',            'PAGO',       5],
  ['Shopee - Yasmim',               85, '2026-03-01',            'PAGO',       5],
  ['Shopee - Yasmim',               80, '2026-03-01',            'PAGO',       5],

  // ---- Junho (6) ----
  ['Mãe Massagem',                  60, '2026-12-04',            'PAGO',       6],
  ['Café da Manhã Viagem',         100, '2026-06-04',            'PAGO',       6],
  ['Mãe Empréstimo',               710, '2026-03-02',            'PAGO',       6],
  ['Condomínio Saquarema',         160, 'Recorrente',            'PAGO',       6],
  ['Luz',                          300, 'Recorrente',            'PAGO',       6],
  ['Água',                         250, '-',                     'PAGO',       6],
  ['Darlene',                      440, 'recorrente',            'PAGO',       6],
  ['Carro',                       1600, '11/36',                 'PAGO',       6],
  ['Mylena Cartão',                710, '2026-03-02',            'PAGO',       6],
  ['Mylena',                       790, '2026-10-10',            'PAGO',       6],
  ['Cartão Will',                  300, '2026-03-03',            'NÃO PAGO',   6],
  ['Cartão de Crédito ML',         600, 'Recorrente',            'PAGO',       6],
  ['Cartão de Crédito Nubank',     700, 'Recorrente',            'PAGO',       6],
  ['Jeito',                        650, '2026-01-01',            'NÃO PAGO',   6],
  ['Pai Empréstimo',              1200, '66/80',                 'NÃO PAGO',   6],
  ['Aluguel',                     2500, '2026-12-12',            'NÃO PAGO',   6],
  ['99Pay',                       1000, '2026-03-01',            'NÃO PAGO',   6],
  ['Lote',                        1000, '31/35',                 'NÃO PAGO',   6],
  ['Emprestimo Santander',        1116, '19/25',                 'NÃO PAGO',   6],
  ['Escola Líder',                1480, 'Recorrente',            'NÃO PAGO',   6],
  ['Cartao Santander',            4000, 'Recorrente',            'PAGO',       6],
  ['Elza',                         750, '-',                     'PAGO',       6],
  ['Bitoneira Aluguel',            300, '-',                     'PAGO',       6],
  ['Internet do Lote',             120, '-',                     'PAGO',       6],

  // ---- Julho (7) ----
  ['Mãe Massagem',                  60, '2026-12-05',            'PAGO',       7],
  ['Café da Manhã Viagem',         100, '2026-06-05',            'PAGO',       7],
  ['Mãe Empréstimo',               710, '2026-03-03',            'PAGO',       7],
  ['Condomínio Saquarema',         160, 'Recorrente',            'PAGO',       7],
  ['Luz',                          300, 'Recorrente',            'NÃO PAGO',   7],
  ['Água',                         250, '-',                     'NÃO PAGO',   7],
  ['Darlene',                      440, 'recorrente',            'NÃO PAGO',   7],
  ['Carro',                       1600, '11/36',                 'NÃO PAGO',   7],
  ['Mylena Cartão',                710, '2026-03-03',            'PAGO',       7],
  ['Cartão Will',                  300, '2026-03-03',            'NÃO PAGO',   7],
  ['Cartão de Crédito ML',         600, 'Recorrente',            'PAGO',       7],
  ['Cartão de Crédito Nubank',     400, 'Recorrente',            'PAGO',       7],
  ['Jeito',                        650, '2026-01-01',            'NÃO PAGO',   7],
  ['Pai Empréstimo',              1200, '67/80',                 'NÃO PAGO',   7],
  ['Aluguel',                     2500, '2026-12-12',            'PAGO',       7],
  ['99Pay',                       1000, '2026-03-01',            'NÃO PAGO',   7],
  ['Lote',                        1000, '31/35',                 'PAGO',       7],
  ['Emprestimo Santander',        1116, '20/25',                 'PAGO',       7],
  ['Emprestimo Santander 2',      1116, '3/15',                  'PAGO',       7],
  ['Escola Líder',                1480, 'Recorrente',            'PAGO',       7],
  ['Cartao Santander',            4000, 'Recorrente',            'NÃO PAGO',   7],
  ['Elza',                         400, '-',                     'NÃO PAGO',   7],
  ['Bitoneira Aluguel',            300, '-',                     'PAGO',       7],
  ['Internet do Lote',             120, '-',                     'NÃO PAGO',   7],

  // ---- Agosto (8) ----
  ['Mãe Massagem',                  60, '2026-12-06',            'NÃO PAGO',   8],
  ['Café da Manhã Viagem',         100, '2026-06-06',            'NÃO PAGO',   8],
  ['Condomínio Saquarema',         160, 'Recorrente',            'NÃO PAGO',   8],
  ['Luz',                          300, 'Recorrente',            'NÃO PAGO',   8],
  ['Água',                         250, '-',                     'NÃO PAGO',   8],
  ['Darlene',                      440, 'recorrente',            'NÃO PAGO',   8],
  ['Carro',                       1600, '12/36',                 'NÃO PAGO',   8],
  ['Mylena Cartão',                750, '2026-09-01',            'NÃO PAGO',   8],
  ['Cartão Will',                  300, '2026-03-03',            'NÃO PAGO',   8],
  ['Cartão de Crédito ML',         600, 'Recorrente',            'NÃO PAGO',   8],
  ['Cartão de Crédito Nubank',     700, 'Recorrente',            'NÃO PAGO',   8],
  ['Jeito',                        650, '2026-01-01',            'NÃO PAGO',   8],
  ['Pai Empréstimo',              1200, '68/80',                 'NÃO PAGO',   8],
  ['Aluguel',                     2500, '2026-12-12',            'PAGO',       8],
  ['99Pay',                       1000, '2026-03-01',            'NÃO PAGO',   8],
  ['Lote',                        1000, '31/35',                 'NÃO PAGO',   8],
  ['Emprestimo Santander',        1116, '21/25',                 'PAGO',       8],
  ['Emprestimo Santander 2',      1116, '5/15',                  'PAGO',       8],
  ['Escola Líder',                1480, 'Recorrente',            'PAGO',       8],
  ['Cartao Santander',            4000, 'Recorrente',            'NÃO PAGO',   8],
  ['Elza',                         400, '-',                     'NÃO PAGO',   8],
  ['Bitoneira Aluguel',            300, '-',                     'NÃO PAGO',   8],
  ['Internet do Lote',             120, '-',                     'NÃO PAGO',   8],
];

// -----------------------------------------------------------------------
// Classificadores
// -----------------------------------------------------------------------
function classifyType(name) {
  const s = name.toLowerCase();
  if (s.includes('cartão') || s.includes('cartao')) return 'cartao_credito';
  if (s.includes('emprést') || s.includes('emprest') || s.includes('99pay') ||
      s.includes('99 empr') || s.includes('supersim') || s.includes('nu empr')) return 'emprestimo';
  if (s === 'carro') return 'emprestimo';
  if (s.includes('aluguel') || s === 'bitoneira aluguel') return 'aluguel';
  if (s.includes('escola') || s.includes('faculdade') || s.includes('livros')) return 'escola';
  if (s.includes('luz') || s.includes('água') || s.includes('agua') ||
      s.includes('internet') || s.includes('condomínio') || s.includes('condominio') ||
      s.includes('claro flex')) return 'conta_fixa';
  return 'outros';
}

function parseParcela(str) {
  const s = String(str).trim();
  if (/^recorrente$/i.test(s)) return { paymentType: 'recorrente' };
  if (s === '-') return { paymentType: 'recorrente' };

  const inst = s.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (inst) {
    return {
      paymentType: 'parcelado',
      currentInstallment: Number(inst[1]),
      totalInstallments: Number(inst[2]),
    };
  }

  const iso = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (iso) return { paymentType: 'parcelado', endDate: iso[1] };

  return { paymentType: 'recorrente' }; // fallback seguro
}

function dueDayFor(type, parcelaInfo) {
  if (parcelaInfo.endDate) {
    const day = Number(parcelaInfo.endDate.slice(8, 10));
    if (day <= 10) return 10;
    if (day <= 15) return 15;
    return 30;
  }
  if (type === 'conta_fixa') return 15;
  if (type === 'cartao_credito' || type === 'aluguel') return 10;
  return 30;
}

function normalizeStatus(s) {
  return /não\s*pago|nao\s*pago/i.test(s) ? 'nao_pago' : 'pago';
}

// -----------------------------------------------------------------------
// Reset + insert
// -----------------------------------------------------------------------
tx(() => {
  db.exec('DELETE FROM expenses');
  db.exec('DELETE FROM incomes');
  db.exec('DELETE FROM debt_groups');
  db.exec('DELETE FROM profiles');
  db.exec("DELETE FROM meta WHERE key='last_save'");

  db.prepare('INSERT INTO profiles (id,name,type,avatar,color) VALUES (?,?,?,?,?)')
    .run(PROFILE_ID, 'Pedro', 'titular', null, 'hsl(var(--chart-1))');

  const stmt = db.prepare(`
    INSERT INTO expenses (
      id, name, type, amount, due_day, payment_type, payment_method,
      current_installment, total_installments, end_date, status,
      total_paid, total_remaining, created_at, profile_id, month, year, group_name
    ) VALUES (
      @id, @name, @type, @amount, @due_day, @payment_type, @payment_method,
      @current_installment, @total_installments, @end_date, @status,
      @total_paid, @total_remaining, @created_at, @profile_id, @month, @year, @group_name
    )
  `);

  const now = new Date().toISOString();
  raw.forEach(([name, amount, parcela, status, month], idx) => {
    const parcelaInfo = parseParcela(parcela);
    const type = classifyType(name);
    const due_day = dueDayFor(type, parcelaInfo);
    const st = normalizeStatus(status);
    const paid = st === 'pago' ? amount : 0;
    const remaining = st === 'pago' ? 0 : amount;

    stmt.run({
      id: `pedro-${String(idx + 1).padStart(4, '0')}`,
      name,
      type,
      amount,
      due_day,
      payment_type: parcelaInfo.paymentType,
      payment_method: null,
      current_installment: parcelaInfo.currentInstallment ?? null,
      total_installments: parcelaInfo.totalInstallments ?? null,
      end_date: parcelaInfo.endDate ?? null,
      status: st,
      total_paid: paid,
      total_remaining: remaining,
      created_at: now,
      profile_id: PROFILE_ID,
      month,
      year: YEAR,
      group_name: null,
    });
  });
});

const counts = {
  perfis: db.prepare('SELECT COUNT(*) c FROM profiles').get().c,
  despesas: db.prepare('SELECT COUNT(*) c FROM expenses').get().c,
  rendas: db.prepare('SELECT COUNT(*) c FROM incomes').get().c,
};
const porMes = db.prepare(`
  SELECT month, COUNT(*) qtd, ROUND(SUM(amount), 2) total
  FROM expenses GROUP BY month ORDER BY month
`).all();

console.log('Reset concluído.');
console.log(counts);
console.log('Por mês:');
for (const r of porMes) console.log(`  ${String(r.month).padStart(2, '0')} → ${r.qtd} itens | R$ ${r.total}`);
