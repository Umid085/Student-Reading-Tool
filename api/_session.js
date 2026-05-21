// Shared session-token validator. Mirrors the inline implementation in
// api/storage.js so the same Bearer-token shape unlocks every endpoint
// that needs the authenticated username (not just the IP).
//
// Token format: "<name>:<expiresAt>:<hexSignature>"
//   - signature = HMAC-SHA256(SESSION_SECRET, "<name>:<expiresAt>")
//   - expiresAt is a Unix ms timestamp; tokens past expiry are rejected.
// If SESSION_SECRET is not set, this returns null so callers fall back
// to anonymous/IP-only rate limiting (useful in tests + local dev).

import { createHmac } from "crypto";

export function extractUsername(req) {
  const secret = process.env.SESSION_SECRET || "";
  if (!secret) return null;
  const auth = (req && req.headers && (req.headers["authorization"] || req.headers["Authorization"])) || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return null;
  const lastColon = token.lastIndexOf(":");
  if (lastColon === -1) return null;
  const payload = token.slice(0, lastColon);
  const sig = token.slice(lastColon + 1);
  const colonIdx = payload.indexOf(":");
  if (colonIdx === -1) return null;
  const name = payload.slice(0, colonIdx);
  const expiresStr = payload.slice(colonIdx + 1);
  const expires = parseInt(expiresStr, 10);
  if (!name || isNaN(expires) || Date.now() > expires) return null;
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  if (sig.length !== expected.length || sig !== expected) return null;
  return name;
}
