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
  const url = fbUrl(DB, username, endpoint) + fbAuthSuffix();
  // Atomic compare-and-swap via Firebase ETags. The old fire-and-forget
  // read-then-write let N concurrent requests from one user all read the same
  // `n`, all pass the cap check, and all write `n+1` — advancing the counter
  // by 1 total and blowing past the daily cap. Instead: GET the value + its
  // ETag, then PUT `n+1` only if the ETag still matches. A 412 means a
  // concurrent write landed first, so re-read and retry. Fail OPEN on any
  // error so a Firebase hiccup never locks a paying user out.
  let used = 0;
  try {
    for (let attempt = 0; attempt < 5; attempt++) {
      const r = await fetch(url, { headers: { "X-Firebase-ETag": "true" } });
      const etag = r.headers.get("etag") || "null_etag";
      const data = await r.json();
      used = data && typeof data.n === "number" ? data.n : 0;
      if (used >= max) {
        return { exceeded: true, used, max, resetAt: nextMidnightUTC() };
      }
      const w = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "if-match": etag },
        body: JSON.stringify({ n: used + 1, ts: Date.now() }),
      });
      if (w.ok) return { exceeded: false, used: used + 1, max, resetAt: nextMidnightUTC() };
      if (w.status !== 412) return { exceeded: false, used: used + 1, max, failedWrite: true };
      // 412 Precondition Failed: the ETag moved under us — loop to re-read.
    }
    // Lost the CAS race 5× (pathological contention) — fail open.
    return { exceeded: false, used, max, failedWrite: true };
  } catch (_) {
    return { exceeded: false, used: 0, max, failedRead: true };
  }
}
