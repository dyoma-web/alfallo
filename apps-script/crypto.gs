/**
 * crypto.gs — Hashing, salts, UUIDs, tokens.
 *
 * Limitación conocida de Apps Script: no hay bcrypt/argon2 nativo.
 * Usamos SHA-256 con salt único por usuario + pepper global en Script Properties.
 *
 * Documento de respaldo: docs/01-arquitectura.md §3.2
 */

// ──────────────────────────────────────────────────────────────────────────
// Pepper — string aleatorio fijo, se setea una sola vez en Script Properties
// ──────────────────────────────────────────────────────────────────────────

function crypto_getPepper_() {
  const pepper = PropertiesService.getScriptProperties().getProperty('PEPPER');
  if (!pepper) {
    throw new Error('PEPPER no está configurado en Script Properties. Ejecuta bootstrap() primero.');
  }
  return pepper;
}

function crypto_generatePepper_() {
  // 32 bytes (256 bits) → 64 chars hex
  return cryptoRandomHex(32);
}

// ──────────────────────────────────────────────────────────────────────────
// Hashing de passwords — SHA-256(pepper + salt + password)
// ──────────────────────────────────────────────────────────────────────────

/**
 * Genera un nuevo par {salt, hash} para una contraseña.
 * @param {string} password
 * @return {{salt: string, hash: string, algoritmo: string}}
 */
function cryptoHashPassword(password) {
  const salt = cryptoRandomHex(16); // 16 bytes → 32 chars hex
  const hash = crypto_computeHash_(password, salt);
  return { salt: salt, hash: hash, algoritmo: 'sha256-v1' };
}

/**
 * Verifica una contraseña contra un par {salt, hash}.
 * @param {string} password
 * @param {string} salt
 * @param {string} hash
 * @return {boolean}
 */
function cryptoVerifyPassword(password, salt, hash) {
  const candidate = crypto_computeHash_(password, salt);
  return crypto_constantTimeEq_(candidate, hash);
}

function crypto_computeHash_(password, salt) {
  const pepper = crypto_getPepper_();
  const input = pepper + ':' + salt + ':' + password;
  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    input,
    Utilities.Charset.UTF_8
  );
  return crypto_bytesToHex_(digest);
}

// ──────────────────────────────────────────────────────────────────────────
// UUIDs y tokens
// ──────────────────────────────────────────────────────────────────────────

/**
 * UUID v4 estándar (formato 8-4-4-4-12). Usa el Utilities.getUuid() nativo.
 */
function cryptoUuid() {
  return Utilities.getUuid();
}

/**
 * Token aleatorio en hex. N bytes → 2N caracteres.
 * Usado para session tokens, activation tokens, reset tokens.
 */
function cryptoRandomHex(bytes) {
  const arr = [];
  for (let i = 0; i < bytes; i++) {
    arr.push(Math.floor(Math.random() * 256));
  }
  return crypto_bytesToHex_(arr);
}

// ──────────────────────────────────────────────────────────────────────────
// Helpers internos
// ──────────────────────────────────────────────────────────────────────────

function crypto_bytesToHex_(bytes) {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    let byte = bytes[i];
    if (byte < 0) byte += 256;
    hex += (byte < 16 ? '0' : '') + byte.toString(16);
  }
  return hex;
}

/**
 * Comparación en tiempo constante para evitar timing attacks en verificación
 * de hashes. Misma duración independiente de cuántos chars coincidan.
 */
function crypto_constantTimeEq_(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
