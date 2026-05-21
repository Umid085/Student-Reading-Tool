// Per-authenticated-user daily quotas for Netlify-shape handlers.
// Mirrors api/_userQuota.js exactly.
//
// Storage: rq/rq-quota-v1/<safeUsername>/<endpoint>/<yyyy-mm-dd>.json
// Anonymous callers bypass quotas; caller still has IP rate-limit.

function safe(s) { return String(s || "").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 60); }

function todayUTC() {
  const d = new Date();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return d.getUTCFullYear() + "-" + m + "-" + day;
}

function nextMidnightUTC() {
  const d = new Date();
  d.setUTCHours(24, 0, 0, 0);
  return d.getTime();
}

function fbUrl(DB, username, endpoint) {
  return `${DB}/rq/rq-quota-v1/${safe(username)}/${safe(endpoint)}/${todayUTC()}.json`;
}

function fbAuthSuffix() {
  return process.env.FIREBASE_DB_SECRET ? `?auth=${process.env.FIREBASE_DB_SECRET}` : "";
}

export async function getUserQuota(DB, username, endpoint, opts) {
  const max = (opts && typeof opts.max === "number") ? opts.max : 0;
  if (process.env.RATE_LIMIT_DISABLED) return { used: 0, max, resetAt: nextMidnightUTC(), anonymous: !username };
  if (!DB || !username) return { used: 0, max, resetAt: nextMidnightUTC(), anonymous: true };
  try {
    const r = await fetch(fbUrl(DB, username, endpoint) + fbAuthSuffix());
    const data = await r.json();
    const used = data && typeof data.n === "number" ? data.n : 0;
    return { used, max, resetAt: nextMidnightUTC() };
  } catch (_) {
    return { used: 0, max, resetAt: nextMidnightUTC(), failedRead: true };
  }
}

export async function consumeUserQuota(DB, username, endpoint, opts) {
  const max = (opts && typeof opts.max === "number") ? opts.max : 10;
  if (process.env.RATE_LIMIT_DISABLED) return { exceeded: false, used: 0, max };
  if (!DB || !username) return { exceeded: false, used: 0, max, anonymous: true };
  try {
    const r = await fetch(fbUrl(DB, username, endpoint) + fbAuthSuffix());
    const data = await r.json();
    const used = data && typeof data.n === "number" ? data.n : 0;
    if (used >= max) {
      return { exceeded: true, used, max, resetAt: nextMidnightUTC() };
    }
    fetch(fbUrl(DB, username, endpoint) + fbAuthSuffix(), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ n: used + 1, ts: Date.now() }),
    }).catch(function () {});
    return { exceeded: false, used: used + 1, max, resetAt: nextMidnightUTC() };
  } catch (_) {
    return { exceeded: false, used: 0, max, failedRead: true };
  }
}
