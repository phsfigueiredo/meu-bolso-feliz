/**
 * Descriptografia do seed encriptado via WebCrypto (AES-256-GCM + PBKDF2).
 * Espelha o formato produzido por `server/encrypt-seed.js`.
 */

interface EncryptedPayload {
  v: number;
  algo: 'AES-256-GCM';
  kdf: 'PBKDF2-SHA256';
  iterations: number;
  salt: string;      // base64
  iv: string;        // base64
  tag: string;       // base64
  ciphertext: string;// base64
}

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function deriveKey(password: string, salt: Uint8Array, iterations: number): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt'],
  );
}

/**
 * Baixa e descriptografa `seed.enc.json` usando a senha fornecida.
 * Lança Error('wrong-password') em caso de falha de autenticação.
 */
export async function fetchAndDecryptSeed(password: string): Promise<unknown> {
  const url = `${import.meta.env.BASE_URL}seed.enc.json`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Falha ao buscar seed: HTTP ${res.status}`);
  const payload = (await res.json()) as EncryptedPayload;

  const salt = b64ToBytes(payload.salt);
  const iv = b64ToBytes(payload.iv);
  const tag = b64ToBytes(payload.tag);
  const ciphertext = b64ToBytes(payload.ciphertext);

  const key = await deriveKey(password, salt, payload.iterations);

  const combined = new Uint8Array(ciphertext.length + tag.length);
  combined.set(ciphertext);
  combined.set(tag, ciphertext.length);

  try {
    const plaintextBuf = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      combined,
    );
    return JSON.parse(new TextDecoder().decode(plaintextBuf));
  } catch {
    throw new Error('wrong-password');
  }
}
