/**
 * Exporta o estado atual do SQLite local para `public/seed.json`.
 * Esse JSON é servido estaticamente pelo Vite/GitHub Pages e usado
 * para popular o IndexedDB do navegador na primeira visita.
 *
 * Uso: node server/export-seed.js
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import db, { rowToExpense, rowToIncome, rowToProfile } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, '..', 'public', 'seed.json');

const state = {
  version: 1,
  exportedAt: new Date().toISOString().slice(0, 10),
  profiles: db.prepare('SELECT * FROM profiles ORDER BY name').all().map(rowToProfile),
  incomes:  db.prepare('SELECT * FROM incomes').all().map(rowToIncome),
  expenses: db.prepare('SELECT * FROM expenses ORDER BY year, month, id').all().map(rowToExpense),
  debtGroups: db.prepare('SELECT name FROM debt_groups ORDER BY name').all().map((r) => r.name),
};

fs.writeFileSync(OUT, JSON.stringify(state, null, 2));
console.log(`Exportado → ${path.relative(process.cwd(), OUT)}`);
console.log(`  ${state.profiles.length} perfis, ${state.expenses.length} despesas, ${state.incomes.length} rendas`);
