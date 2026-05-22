// F4b — push subscription endpoint.
//
// Auth required (Bearer SESSION token). Stores the browser's PushSubscription
// JSON keyed by safe-name in rq-push-subs-v1, alongside an optional examDate
// (ISO yyyy-mm-dd) so the daily cron can ramp reminders as the date nears,
// and the user's locale so messages match their UI language.
//
// Routes:
//   GET    → returns this user's existing record (or 404 if none)
//   POST   → upsert { subscription, examDate?, locale? }
//   DELETE → remove this user's record (user opted out)
//
// Schema: rq-push-subs-v1/<safeName>:
//   {
//     subscription: { endpoint, keys: { p256dh, auth } },
//     examDate: "YYYY-MM-DD" | null,
//     locale:   "en" | "uz" | "ru" | "tr" | "ar" | "de" | "es" | "fr",
//     updated:  "<ISO timestamp>"
//   }

import { checkRateLimit } from "./_rateLimit.js";
import { extractUsername } from "./_session.js";

const RATE_LIMIT_MAX = 30; // per IP per 15-min

function safeName(s) { return String(s || "").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 60); }

function fbAuthSuffix() {
  return process.env.FIREBASE_DB_SECRET ? `?auth=${process.env.FIREBASE_DB_SECRET}` : "";
}

function dbPath(name) {
  return `${(process.env.FIREBASE_DB_URL || "").replace(/\/$/, "")}/rq/rq-push-subs-v1/${safeName(name)}.json${fbAuthSuffix()}`;
}

async function fbGet(name) {
  try {
    const r = await fetch(dbPath(name));
    if (!r.ok) return null;
    const d = await r.json();
    if (d && typeof d === "object" && d.error) return null;
    return d;
  } catch (_) { return null; }
}

async function fbPut(name, value) {
  try {
    const r = await fetch(dbPath(name), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value),
    });
    return r.ok;
  } catch (_) { return false; }
}

async function fbDelete(name) {
  try { await fetch(dbPath(name), { method: "DELETE" }); return true; } catch (_) { return false; }
}

function validSubscription(s) {
  return !!(s && typeof s === "object"
    && typeof s.endpoint === "string" && s.endpoint.startsWith("https://")
    && s.keys && typeof s.keys.p256dh === "string" && typeof s.keys.auth === "string");
}

function validDate(s) {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function validLocale(s) {
  return typeof s === "string" && ["en", "uz", "ru", "tr", "ar", "de", "es", "fr"].indexOf(s) !== -1;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(204).end();

  const DB = (process.env.FIREBASE_DB_URL || "").replace(/\/$/, "");
  if (!DB) return res.status(503).json({ error: "FIREBASE_DB_URL not set" });

  const ip = ((req.headers["x-forwarded-for"] || req.headers["client-ip"] || "").split(",")[0]).trim();
  const rl = await checkRateLimit(DB, ip, { max: RATE_LIMIT_MAX, bucket: "push-subscribe" });
  if (rl.limited) {
    res.setHeader("Retry-After", String(rl.retryAfter));
    return res.status(429).json({ error: "Too many requests." });
  }

  const username = extractUsername(req);
  if (!username) return res.status(401).json({ error: "Unauthorized" });

  if (req.method === "GET") {
    const record = await fbGet(username);
    if (!record) return res.status(404).json({ error: "No subscription" });
    return res.status(200).json(record);
  }

  if (req.method === "POST") {
    const body = req.body || {};
    if (!validSubscription(body.subscription)) {
      return res.status(400).json({ error: "Invalid 'subscription'" });
    }
    if (body.examDate != null && body.examDate !== "" && !validDate(body.examDate)) {
      return res.status(400).json({ error: "Invalid 'examDate' (expect YYYY-MM-DD)" });
    }
    const entry = {
      subscription: {
        endpoint: body.subscription.endpoint,
        keys: { p256dh: body.subscription.keys.p256dh, auth: body.subscription.keys.auth },
      },
      examDate: body.examDate || null,
      locale: validLocale(body.locale) ? body.locale : "en",
      updated: new Date().toISOString(),
    };
    const ok = await fbPut(username, entry);
    if (!ok) return res.status(502).json({ error: "Write failed" });
    return res.status(200).json({ ok: true, ...entry });
  }

  if (req.method === "DELETE") {
    await fbDelete(username);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
