import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

export const DB_PATH = path.join(DATA_DIR, 'finance.db');

const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

db.exec(`
  CREATE TABLE IF NOT EXISTS profiles (
    id       TEXT PRIMARY KEY,
    name     TEXT NOT NULL,
    type     TEXT NOT NULL CHECK (type IN ('titular','conjuge','filho','outro')),
    avatar   TEXT,
    color    TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS incomes (
    id           TEXT PRIMARY KEY,
    name         TEXT NOT NULL,
    type         TEXT NOT NULL CHECK (type IN ('salario','beneficio','freelance','investimento','outros')),
    amount       REAL NOT NULL CHECK (amount >= 0),
    is_recurrent INTEGER NOT NULL DEFAULT 0,
    profile_id   TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    month        INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year         INTEGER NOT NULL,
    created_at   TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_incomes_period ON incomes(year, month, profile_id);

  CREATE TABLE IF NOT EXISTS expenses (
    id                   TEXT PRIMARY KEY,
    name                 TEXT NOT NULL,
    type                 TEXT NOT NULL CHECK (type IN ('cartao_credito','emprestimo','conta_fixa','aluguel','escola','outros')),
    amount               REAL NOT NULL CHECK (amount >= 0),
    due_day              INTEGER NOT NULL CHECK (due_day IN (10,15,30)),
    payment_type         TEXT NOT NULL CHECK (payment_type IN ('recorrente','parcelado')),
    payment_method       TEXT CHECK (payment_method IN ('pix','boleto','debito_automatico','cartao','dinheiro','transferencia')),
    current_installment  INTEGER,
    total_installments   INTEGER,
    end_date             TEXT,
    status               TEXT NOT NULL DEFAULT 'nao_pago' CHECK (status IN ('pago','nao_pago')),
    total_paid           REAL NOT NULL DEFAULT 0,
    total_remaining      REAL NOT NULL DEFAULT 0,
    created_at           TEXT NOT NULL,
    profile_id           TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    month                INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year                 INTEGER NOT NULL,
    group_name           TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_expenses_period ON expenses(year, month, profile_id);
  CREATE INDEX IF NOT EXISTS idx_expenses_group  ON expenses(group_name);

  CREATE TABLE IF NOT EXISTS debt_groups (
    name TEXT PRIMARY KEY
  );

  CREATE TABLE IF NOT EXISTS meta (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

// Helpers -------------------------------------------------------------------

export function all(sql, ...args) {
  return db.prepare(sql).all(...args);
}
export function get(sql, ...args) {
  return db.prepare(sql).get(...args);
}
export function run(sql, ...args) {
  return db.prepare(sql).run(...args);
}
export function tx(fn) {
  db.exec('BEGIN');
  try {
    const out = fn();
    db.exec('COMMIT');
    return out;
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

export function rowToExpense(r) {
  if (!r) return null;
  return {
    id: r.id,
    name: r.name,
    type: r.type,
    amount: r.amount,
    dueDay: r.due_day,
    paymentType: r.payment_type,
    paymentMethod: r.payment_method ?? undefined,
    currentInstallment: r.current_installment ?? undefined,
    totalInstallments: r.total_installments ?? undefined,
    endDate: r.end_date ?? undefined,
    status: r.status,
    totalPaid: r.total_paid,
    totalRemaining: r.total_remaining,
    createdAt: r.created_at,
    profileId: r.profile_id,
    month: r.month,
    year: r.year,
    groupName: r.group_name ?? undefined,
  };
}

export function rowToIncome(r) {
  if (!r) return null;
  return {
    id: r.id,
    name: r.name,
    type: r.type,
    amount: r.amount,
    isRecurrent: !!r.is_recurrent,
    profileId: r.profile_id,
    month: r.month,
    year: r.year,
    createdAt: r.created_at,
  };
}

export function rowToProfile(r) {
  if (!r) return null;
  return {
    id: r.id,
    name: r.name,
    type: r.type,
    avatar: r.avatar ?? undefined,
    color: r.color,
  };
}

export default db;
