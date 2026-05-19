// Refresh tokens for long-lived auto-login. Stateless HMAC, similar shape to
// the access tokens issued by register/auth, but:
//   - Different namespace (HMAC key includes "/refresh-v1") so an access
//     token can never be reused as a refresh token, and vice versa.
//   - 30-day expiry (vs. the 48h access token) so a user can stay logged in
//     across sessions without storing a password-equivalent in localStorage.
//   - Rotated on every refresh — a leaked token grants sessions until the
//     refresh-secret is rotated server-side, at which point every existing
//     refresh token becomes invalid.
//
// Token format: "r:<name>:<expiresAt>:<sigHex>".

import { createHmac, timingSafeEqual, createHash } from "crypto";

const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// Stable identifier for a refresh token. The signature portion is already
// unique per token, so we use a short hash of it as the blacklist key.
export function refreshTokenId(token) {
  if (typeof token !== "string" || !token.startsWith("r:")) return null;
  const rest = token.slice(2);
  const lastColon = rest.lastIndexOf(":");
  if (lastColon <= 0) return null;
  const sig = rest.slice(lastColon + 1);
  if (!sig) return null;
  return createHash("sha256").update(sig).digest("hex").slice(0, 32);
}

function refreshSecret(baseSecret) {
  return String(baseSecret || "") + "/refresh-v1";
}

export function issueRefreshToken(name, secret) {
  const expires = Date.now() + REFRESH_TTL_MS;
  const payload = `${name}:${expires}`;
  const sig = createHmac("sha256", refreshSecret(secret)).update(payload).digest("hex");
  return `r:${payload}:${sig}`;
}

export function verifyRefreshToken(token, secret) {
  if (typeof token !== "string" || !token.startsWith("r:")) {
    return { ok: false };
  }
  const rest = token.slice(2);
  const lastColon = rest.lastIndexOf(":");
  if (lastColon <= 0) return { ok: false };
  const payload = rest.slice(0, lastColon);
  const presented = rest.slice(lastColon + 1);

  const firstColon = payload.indexOf(":");
  if (firstColon <= 0) return { ok: false };
  const name = payload.slice(0, firstColon);
  const expires = parseInt(payload.slice(firstColon + 1), 10);
  if (!name || !Number.isFinite(expires) || expires <= Date.now()) {
    return { ok: false };
  }

  const expected = createHmac("sha256", refreshSecret(secret)).update(payload).digest("hex");
  // timingSafeEqual requires equal-length buffers.
  if (expected.length !== presented.length) return { ok: false };
  try {
    if (!timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(presented, "hex"))) {
      return { ok: false };
    }
  } catch (e) {
    return { ok: false };
  }
  return { ok: true, name, expiresAt: expires };
}
