/**
 * Criptografa `public/seed.json` (plaintext) → `public/seed.enc.json`.
 *
 * AES-256-GCM com chave derivada por PBKDF2-SHA256 (200k iterações).
 * A senha vem de:
 *   - variável de ambiente SEED_PASSWORD; ou
 *   - primeiro argumento na linha de comando; ou
 *   - fallback 'PedroeYasmim' (a senha atual do PasswordGate).
 *
 * O plaintext (`seed.json`) fica no gitignore — apenas o encriptado vai
 * pro repositório e é servido pelo GitHub Pages.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLAIN = path.resolve(__dirname, '..', 'public', 'seed.json');
const OUT = path.resolve(__dirname, '..', 'public', 'seed.enc.json');

const password = process.env.SEED_PASSWORD || process.argv[2] || 'PedroeYasmim';

if (!fs.existsSync(PLAIN)) {
  console.error(`Arquivo não encontrado: ${PLAIN}`);
  console.error(`Rode "npm run seed:export" primeiro para gerar o plaintext.`);
  process.exit(1);
}

const salt = crypto.randomBytes(16);
const iv = crypto.randomBytes(12);
const iterations = 200_000;
const key = crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256');

const plaintext = fs.readFileSync(PLAIN);
const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
const tag = cipher.getAuthTag();

fs.writeFileSync(
  OUT,
  JSON.stringify({
    v: 1,
    algo: 'AES-256-GCM',
    kdf: 'PBKDF2-SHA256',
    iterations,
    salt: salt.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    ciphertext: ciphertext.toString('base64'),
  }),
);

fs.unlinkSync(PLAIN);

console.log(`Encriptado → ${path.relative(process.cwd(), OUT)}`);
console.log(`  Senha usada: ${password === 'PedroeYasmim' ? '(padrão do PasswordGate)' : '(custom)'}`);
console.log(`  Plaintext apagado. Só quem tiver a senha consegue descriptografar.`);
