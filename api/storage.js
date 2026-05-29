import { createHmac } from "crypto";

const ALLOWED_KEYS = /^rq-[a-z0-9_-]{1,60}$/;
const MAX_VALUE_BYTES = 512 * 1024; // 512 KB
// Credentials must never flow through the public storage endpoint
const READ_BLOCKED = new Set(["rq-users-v6", "rq-auth-v6"]);
// These keys are mutated only via authenticated, ownership/actor-checked routers
// that do per-child / ETag-CAS writes — /api/classroom for classes+assignments,
// /api/community for leaderboards (rq-boards-v6, rq-weekly-v1) and the social
// graph (rq-social-v6). Blocking them here closes the authorization hole where
// any signed-in user could overwrite the whole list through this generic proxy.
// Reads stay open (the lists aren't secret).
const WRITE_BLOCKED = new Set(["rq-auth-v6", "rq-classes-v1", "rq-assignments-v1", "rq-boards-v6", "rq-weekly-v1", "rq-social-v6"]);

function validateToken(token, secret) {
  if (!token || !secret) return false;
  const lastColon = token.lastIndexOf(":");
  if (lastColon === -1) return false;
  const payload = token.slice(0, lastColon);
  const sig = token.slice(lastColon + 1);
  const colonIdx = payload.indexOf(":");
  if (colonIdx === -1) return false;
  const expires = parseInt(payload.slice(colonIdx + 1));
  if (isNaN(expires) || Date.now() > expires) return false;
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  return sig.length === expected.length && sig === expected;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(204).end();

  const DB = (process.env.FIREBASE_DB_URL || "").replace(/\/$/, "");

  // health-check (no key) — also returns runtime env diagnostics (no values, just presence/lengths)
  if (!req.query.key && req.method === "GET") {
    const sec = process.env.FIREBASE_DB_SECRET || "";
    return res.status(200).json({
      status: "ok",
      db: !!DB,
      urlHost: DB ? (new URL(DB)).host : null,
      hasSecret: !!sec,
      secretLen: sec.length,
      secretHasWhitespace: /\s/.test(sec),
    });
  }

  if (!DB) {
    return res.status(503).json({ error: "FIREBASE_DB_URL not set" });
  }

  const fbAuth = process.env.FIREBASE_DB_SECRET ? `?auth=${process.env.FIREBASE_DB_SECRET}` : "";

  try {
    if (req.method === "GET") {
      const key = req.query.key;
      if (!key || !ALLOWED_KEYS.test(key) || READ_BLOCKED.has(key)) {
        return res.status(400).json({ error: "Invalid key" });
      }
      const r = await fetch(`${DB}/rq/${encodeURIComponent(key)}.json${fbAuth}`);
      const data = await r.json();
      // Firebase returns {error: "..."} on permission denial — surface it rather than caching the error string
      if (data && typeof data === "object" && !Array.isArray(data) && typeof data.error === "string") {
        return res.status(502).json({ error: `Firebase: ${data.error}` });
      }
      return res.status(200).json({ value: data !== null && data !== undefined ? JSON.stringify(data) : null });
    }

    if (req.method === "POST") {
      // Validate session token when SESSION_SECRET is configured
      const secret = process.env.SESSION_SECRET || "";
      if (secret) {
        const auth = (req.headers["authorization"] || "");
        const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
        if (!validateToken(token, secret)) {
          return res.status(401).json({ error: "Unauthorized" });
        }
      }

      const { key, value } = req.body || {};
      if (!key || !ALLOWED_KEYS.test(key) || WRITE_BLOCKED.has(key)) {
        return res.status(400).json({ error: "Invalid key" });
      }
      if (typeof value !== "string") {
        return res.status(400).json({ error: "Value must be a string" });
      }
      if (Buffer.byteLength(value, "utf8") > MAX_VALUE_BYTES) {
        return res.status(413).json({ error: "Value too large (max 512 KB)" });
      }
      const wr = await fetch(`${DB}/rq/${encodeURIComponent(key)}.json${fbAuth}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: value,
      });
      if (!wr.ok) {
        let errText = "";
        try { errText = await wr.text(); } catch (_) {}
        return res.status(502).json({ error: `Firebase write failed (${wr.status}): ${errText.slice(0, 200)}` });
      }
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
