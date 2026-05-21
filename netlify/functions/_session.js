// Shared session-token validator for Netlify-shape handlers.
// Mirrors api/_session.js exactly. Tokens are HMAC-signed by
// "<name>:<expiresAt>" with SESSION_SECRET as the key.

import { createHmac } from "crypto";

export function extractUsername(event) {
  const secret = process.env.SESSION_SECRET || "";
  if (!secret) return null;
  const headers = (event && event.headers) || {};
  const auth = headers.authorization || headers.Authorization || "";
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
