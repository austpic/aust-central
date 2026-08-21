import {
  createHash,
  createHmac,
  randomBytes,
  randomInt,
  randomUUID,
  timingSafeEqual,
} from 'node:crypto';

import argon2 from 'argon2';

import { env } from '../config/env.js';

/**
 * Password hashing and opaque-token helpers.
 *
 * Two distinct secret shapes live here:
 *
 *  - Passwords are hashed with argon2id (slow, salted, memory-hard) because
 *    they are user-chosen and low-entropy.
 *  - Refresh/reset/verification tokens are 256-bit random values, so they need
 *    no stretching — a single SHA-256 is enough to make a database dump
 *    useless, and it keeps lookup fast enough to index.
 */

/**
 * OWASP-recommended argon2id parameters. Raising these later is safe: the
 * cost lives in the encoded hash, so old hashes keep verifying and can be
 * rehashed on next successful login.
 */
const ARGON2_OPTIONS = Object.freeze({
  type: argon2.argon2id,
  memoryCost: 65536, // 64 MiB
  timeCost: 3,
  parallelism: 1,
});

/**
 * The pepper is appended before hashing. It lives in the environment, never in
 * the database, so an attacker with only a table dump cannot verify guesses.
 * @param {string} password
 */
function pepper(password) {
  return `${password}${env.PASSWORD_PEPPER}`;
}

/**
 * @param {string} password
 * @returns {Promise<string>} Encoded argon2id hash (includes salt + params).
 */
export async function hashPassword(password) {
  return argon2.hash(pepper(password), ARGON2_OPTIONS);
}

/**
 * Verify a password, never throwing on malformed stored hashes.
 * @param {string} hash
 * @param {string} password
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(hash, password) {
  try {
    return await argon2.verify(hash, pepper(password));
  } catch {
    return false;
  }
}

/**
 * True when a stored hash was made with weaker parameters than we now use, so
 * the caller can transparently upgrade it during login.
 * @param {string} hash
 */
export function needsRehash(hash) {
  try {
    return argon2.needsRehash(hash, ARGON2_OPTIONS);
  } catch {
    return true;
  }
}

/**
 * Burn CPU equivalent to a real verification.
 *
 * Called when login is attempted against an address with no account. Without
 * it, "unknown email" returns markedly faster than "wrong password", which
 * leaks account existence through timing alone.
 */
export async function fakeVerifyDelay() {
  await argon2.hash(pepper('timing-equalisation-placeholder'), ARGON2_OPTIONS);
}

/**
 * A URL-safe 256-bit token plus its storage hash.
 *
 * The plaintext half is handed to the client exactly once; only `hash` is
 * persisted, so leaked rows cannot be replayed.
 *
 * @returns {{ token: string, hash: string }}
 */
export function generateOpaqueToken() {
  const token = randomBytes(32).toString('base64url');
  return { token, hash: hashToken(token) };
}

/**
 * A 6-digit numeric one-time code plus its storage hash.
 *
 * Unlike the opaque tokens above, a 6-digit code has only ~10^6 possible
 * values, so a bare SHA-256 would let someone with a table dump brute-force
 * the whole keyspace offline. It is therefore hashed with HMAC-SHA256 keyed by
 * `PASSWORD_PEPPER` — the same secret that already protects password hashes —
 * so verification of a dumped database still requires the pepper.
 *
 * @returns {{ code: string, hash: string }}
 */
export function generateOtp() {
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  return { code, hash: hashOtp(code) };
}

/**
 * @param {string} code
 * @returns {string} Hex HMAC-SHA256 keyed with the pepper.
 */
export function hashOtp(code) {
  return createHmac('sha256', env.PASSWORD_PEPPER).update(code).digest('hex');
}

/**
 * @param {string} token
 * @returns {string} Hex SHA-256, safe to index and compare in SQL.
 */
export function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Constant-time string comparison that tolerates differing lengths.
 * @param {string} a
 * @param {string} b
 */
export function safeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  if (left.length !== right.length) {
    // Still compare, to keep the timing profile flat for unequal lengths.
    timingSafeEqual(left, left);
    return false;
  }
  return timingSafeEqual(left, right);
}

/** Groups every refresh token descended from one login, for reuse detection. */
export function newTokenFamilyId() {
  return randomUUID();
}

/**
 * @param {Buffer} buffer
 * @returns {string} Hex SHA-256 of file contents, for dedupe and integrity.
 */
export function sha256Buffer(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}
