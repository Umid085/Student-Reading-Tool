// Server-side password hashing using scrypt (Node built-in, no extra deps).
//
// Storage format: "s$N$r$p$saltB64$keyB64"
//   - N, r, p are scrypt cost parameters
//   - 16-byte random salt per user
//   - 32-byte derived key
//
// Migration: any stored hash that does NOT match the "s$" prefix is treated
// as a legacy plain string (SHA-256 hex from the client). Legacy entries
// match via constant-time string compare; on success we return
// needsRehash=true so the caller can write back a fresh scrypt hash.
//
// Note: the "password" we hash is whatever the client sent in the `hash`
// field — currently SHA-256(plaintext) from enc() in the front-end. The
// scrypt layer adds memory-hard cost on top of that so a DB leak doesn't
// trivially become a password leak via GPU brute force.

import { scryptSync, randomBytes, timingSafeEqual } from "crypto";

const SCRYPT_N = 16384; // ~16 MB peak memory per hash
const SCRYPT_r = 8;
const SCRYPT_p = 1;
const KEY_LEN = 32;
const SALT_LEN = 16;
const PREFIX = "s";

function b64(buf) { return Buffer.from(buf).toString("base64"); }
function fromB64(s) { return Buffer.from(s, "base64"); }

export function hashPassword(clientHash) {
  const salt = randomBytes(SALT_LEN);
  const derived = scryptSync(String(clientHash || ""), salt, KEY_LEN, {
    N: SCRYPT_N, r: SCRYPT_r, p: SCRYPT_p, maxmem: 64 * 1024 * 1024,
  });
  return [PREFIX, SCRYPT_N, SCRYPT_r, SCRYPT_p, b64(salt), b64(derived)].join("$");
}

export function verifyPassword(clientHash, stored) {
  if (typeof stored !== "string" || !stored) {
    return { ok: false, needsRehash: false };
  }
  if (stored.startsWith(PREFIX + "$")) {
    const parts = stored.split("$");
    if (parts.length !== 6) return { ok: false, needsRehash: false };
    const N = parseInt(parts[1], 10);
    const r = parseInt(parts[2], 10);
    const p = parseInt(parts[3], 10);
    if (!N || !r || !p) return { ok: false, needsRehash: false };
    let derived;
    try {
      const salt = fromB64(parts[4]);
      const expected = fromB64(parts[5]);
      derived = scryptSync(String(clientHash || ""), salt, expected.length, {
        N, r, p, maxmem: 256 * 1024 * 1024,
      });
      if (derived.length !== expected.length) return { ok: false, needsRehash: false };
      return { ok: timingSafeEqual(derived, expected), needsRehash: false };
    } catch (e) {
      return { ok: false, needsRehash: false };
    }
  }
  // Legacy: constant-time string compare (treat bytes as UTF-8).
  try {
    const a = Buffer.from(String(clientHash || ""), "utf8");
    const b = Buffer.from(stored, "utf8");
    if (a.length !== b.length) return { ok: false, needsRehash: false };
    const ok = timingSafeEqual(a, b);
    return { ok, needsRehash: ok };
  } catch (e) {
    return { ok: false, needsRehash: false };
  }
}

export function isScryptHash(stored) {
  return typeof stored === "string" && stored.startsWith(PREFIX + "$");
}
