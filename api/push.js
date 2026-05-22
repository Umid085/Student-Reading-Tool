// F4 — push router. Consolidates config / subscribe / cron into one
// Serverless Function to stay under Vercel's Hobby-plan 12-function cap.
//
// Dispatch:
//   GET  /api/push?action=config                → returns { publicKey }
//   GET  /api/push?action=subscribe             → auth-required, returns this user's record
//   POST /api/push?action=subscribe             → auth-required, upsert subscription
//   DEL  /api/push?action=subscribe             → auth-required, remove subscription
//   POST /api/push?action=cron                  → CRON_SECRET-auth fan-out
//
// Storage: rq-push-subs-v1/<safeName> (unchanged).

import webpush from "web-push";
import { checkRateLimit } from "./_rateLimit.js";
import { extractUsername } from "./_session.js";

const RATE_LIMIT_MAX = 30;

function safeName(s) { return String(s || "").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 60); }

function fbAuthSuffix() {
  return process.env.FIREBASE_DB_SECRET ? `?auth=${process.env.FIREBASE_DB_SECRET}` : "";
}

function userPath(name) {
  return `${(process.env.FIREBASE_DB_URL || "").replace(/\/$/, "")}/rq/rq-push-subs-v1/${safeName(name)}.json${fbAuthSuffix()}`;
}

function listPath() {
  return `${(process.env.FIREBASE_DB_URL || "").replace(/\/$/, "")}/rq/rq-push-subs-v1.json${fbAuthSuffix()}`;
}

async function fbGet(name) {
  try {
    const r = await fetch(userPath(name));
    if (!r.ok) return null;
    const d = await r.json();
    if (d && typeof d === "object" && d.error) return null;
    return d;
  } catch (_) { return null; }
}

async function fbPut(name, value) {
  try {
    const r = await fetch(userPath(name), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value),
    });
    return r.ok;
  } catch (_) { return false; }
}

async function fbDelete(name) {
  try { await fetch(userPath(name), { method: "DELETE" }); return true; } catch (_) { return false; }
}

async function fbGetAll() {
  try {
    const r = await fetch(listPath());
    if (!r.ok) return {};
    const d = await r.json();
    return (d && typeof d === "object" && !d.error) ? d : {};
  } catch (_) { return {}; }
}

function validSubscription(s) {
  return !!(s && typeof s === "object"
    && typeof s.endpoint === "string" && s.endpoint.startsWith("https://")
    && s.keys && typeof s.keys.p256dh === "string" && typeof s.keys.auth === "string");
}

function validDate(s) { return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s); }
function validLocale(s) { return typeof s === "string" && ["en", "uz", "ru", "tr", "ar", "de", "es", "fr"].indexOf(s) !== -1; }

function todayKeyUtc() { return new Date().toISOString().slice(0, 10); }
function daysUntil(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + "T00:00:00Z");
  if (isNaN(d.getTime())) return null;
  const today = new Date(todayKeyUtc() + "T00:00:00Z");
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

// Server-side strings — eight locales × five framings. Kept inline so the
// cron has no dependency on the front-end bundle.
const MSG = {
  en: { daily: { title: "Reading Quest", body: "Time for your daily reading challenge." }, exam30: { title: "Exam in {n} days", body: "Stay sharp — open Reading Quest today." }, exam7: { title: "{n} days to your exam", body: "Only {n} days left. Keep your streak going!" }, exam1: { title: "Tomorrow is exam day", body: "One more practice session — you've got this." }, exam0: { title: "Exam day!", body: "Go show up. Reading Quest will be here when you're done." } },
  uz: { daily: { title: "Reading Quest", body: "Kunlik o'qish chaqiruvi vaqti keldi." }, exam30: { title: "Imtihongacha {n} kun", body: "Shaklingizni saqlang — bugun ham bitta sessiya." }, exam7: { title: "Imtihongacha {n} kun", body: "Atigi {n} kun qoldi. Streak'ni saqlang!" }, exam1: { title: "Ertaga imtihon", body: "Yana bitta mashq — qila olasiz." }, exam0: { title: "Imtihon kuni!", body: "Ko'rsating o'zingizni. Reading Quest sizni kutadi." } },
  ru: { daily: { title: "Reading Quest", body: "Время ежедневного чтения." }, exam30: { title: "До экзамена {n} дней", body: "Не теряй форму — открой Reading Quest сегодня." }, exam7: { title: "{n} дней до экзамена", body: "Осталось всего {n} дней. Сохраняй серию!" }, exam1: { title: "Завтра экзамен", body: "Ещё одна тренировка — у тебя получится." }, exam0: { title: "День экзамена!", body: "Иди и покажи всё. Reading Quest подождёт." } },
  tr: { daily: { title: "Reading Quest", body: "Günlük okuma zamanı." }, exam30: { title: "Sınava {n} gün", body: "Formunu koru — bugün bir oturum yap." }, exam7: { title: "Sınava {n} gün", body: "Sadece {n} gün kaldı. Seriyi koru!" }, exam1: { title: "Yarın sınav günü", body: "Bir antrenman daha — yapabilirsin." }, exam0: { title: "Sınav günü!", body: "Göster kendini. Reading Quest seni bekliyor." } },
  ar: { daily: { title: "Reading Quest", body: "حان وقت تحدي القراءة اليومي." }, exam30: { title: "{n} يوماً للامتحان", body: "حافظ على تركيزك — افتح Reading Quest اليوم." }, exam7: { title: "{n} أيام للامتحان", body: "{n} أيام فقط. حافظ على سلسلتك!" }, exam1: { title: "غداً يوم الامتحان", body: "جلسة تدريب أخرى — أنت قادر." }, exam0: { title: "يوم الامتحان!", body: "اذهب وأظهر مهارتك. Reading Quest في انتظارك." } },
  de: { daily: { title: "Reading Quest", body: "Zeit für deine tägliche Leseaufgabe." }, exam30: { title: "Noch {n} Tage", body: "Bleib in Form — heute eine Session." }, exam7: { title: "{n} Tage bis zur Prüfung", body: "Nur noch {n} Tage. Halt deine Serie!" }, exam1: { title: "Morgen ist Prüfung", body: "Eine letzte Übung — du schaffst das." }, exam0: { title: "Prüfungstag!", body: "Zeig was du kannst. Reading Quest wartet." } },
  es: { daily: { title: "Reading Quest", body: "Hora de tu reto diario de lectura." }, exam30: { title: "{n} días para el examen", body: "Mantente afilado — abre Reading Quest hoy." }, exam7: { title: "{n} días para el examen", body: "Solo {n} días. ¡Mantén tu racha!" }, exam1: { title: "Mañana es el examen", body: "Una práctica más — tú puedes." }, exam0: { title: "¡Día del examen!", body: "Ve a demostrarlo. Reading Quest te espera." } },
  fr: { daily: { title: "Reading Quest", body: "C'est l'heure du défi de lecture quotidien." }, exam30: { title: "{n} jours avant l'examen", body: "Reste affûté — ouvre Reading Quest aujourd'hui." }, exam7: { title: "{n} jours avant l'examen", body: "Plus que {n} jours. Garde ta série !" }, exam1: { title: "Examen demain", body: "Encore une session — tu vas réussir." }, exam0: { title: "Jour de l'examen !", body: "Vas-y. Reading Quest sera là après." } },
};

function pickMessage(locale, examDate) {
  const lc = MSG[locale] ? locale : "en";
  const dict = MSG[lc];
  const n = daysUntil(examDate);
  if (n === null) return dict.daily;
  if (n <= 0) return dict.exam0;
  if (n === 1) return dict.exam1;
  if (n <= 7) return { title: dict.exam7.title.replace("{n}", n), body: dict.exam7.body.replace(/\{n\}/g, n) };
  if (n <= 30) return { title: dict.exam30.title.replace("{n}", n), body: dict.exam30.body.replace(/\{n\}/g, n) };
  return dict.daily;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(204).end();

  const action = String((req.query && req.query.action) || (req.body && req.body.action) || "").toLowerCase();

  // ── config (public) ─────────────────────────────────────────────
  if (action === "config") {
    if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
    const publicKey = process.env.VAPID_PUBLIC_KEY || "";
    if (!publicKey) return res.status(503).json({ error: "Push notifications not configured" });
    return res.status(200).json({ publicKey });
  }

  // ── cron (CRON_SECRET-auth fan-out) ─────────────────────────────
  if (action === "cron") {
    const auth = req.headers["authorization"] || req.headers["Authorization"] || "";
    const want = process.env.CRON_SECRET || "";
    if (!want || auth !== `Bearer ${want}`) return res.status(401).json({ error: "Unauthorized" });
    const pub = process.env.VAPID_PUBLIC_KEY;
    const priv = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT;
    if (!pub || !priv || !subject) return res.status(503).json({ error: "VAPID keys not configured" });
    webpush.setVapidDetails(subject, pub, priv);

    const all = await fbGetAll();
    const names = Object.keys(all);
    let sent = 0, removed = 0, failed = 0;
    for (const safe of names) {
      const entry = all[safe];
      if (!entry || !entry.subscription) continue;
      const n = daysUntil(entry.examDate);
      if (n !== null && n < 0) { await fbDelete(safe); removed++; continue; }
      const msg = pickMessage(entry.locale || "en", entry.examDate);
      const payload = JSON.stringify({ title: msg.title, body: msg.body });
      try {
        await webpush.sendNotification(entry.subscription, payload);
        sent++;
      } catch (err) {
        const sc = (err && err.statusCode) || 0;
        if (sc === 404 || sc === 410) { await fbDelete(safe); removed++; }
        else { failed++; }
      }
    }
    return res.status(200).json({ ok: true, sent, removed, failed, total: names.length });
  }

  // ── subscribe (auth-required GET/POST/DELETE) ──────────────────
  if (action === "subscribe") {
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

  return res.status(400).json({ error: "Unknown 'action' (expected config|subscribe|cron)" });
}
