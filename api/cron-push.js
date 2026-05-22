// F4d — daily push cron.
//
// Triggered by Vercel cron (see vercel.json) once per day. Reads every
// subscription in rq-push-subs-v1, builds a per-user message based on
// (locale, days-until-exam), and sends a Web Push via the `web-push`
// library, signed with the server-side VAPID private key.
//
// Auth: requires Authorization: Bearer <CRON_SECRET>. Vercel cron
// auto-attaches this when CRON_SECRET is set in env. Other callers are
// rejected so this isn't a free messaging API.
//
// Cleanup: on 410 (Gone) or 404 from the push service, the entry is
// deleted from Firebase — subscriptions expire when users revoke
// notification permission or uninstall the PWA.

import webpush from "web-push";

function safeName(s) { return String(s || "").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 60); }

function fbAuthSuffix() {
  return process.env.FIREBASE_DB_SECRET ? `?auth=${process.env.FIREBASE_DB_SECRET}` : "";
}

async function fbGetAll() {
  try {
    const r = await fetch(`${(process.env.FIREBASE_DB_URL || "").replace(/\/$/, "")}/rq/rq-push-subs-v1.json${fbAuthSuffix()}`);
    if (!r.ok) return {};
    const d = await r.json();
    return (d && typeof d === "object" && !d.error) ? d : {};
  } catch (_) { return {}; }
}

async function fbDeleteOne(name) {
  try {
    await fetch(`${(process.env.FIREBASE_DB_URL || "").replace(/\/$/, "")}/rq/rq-push-subs-v1/${safeName(name)}.json${fbAuthSuffix()}`, { method: "DELETE" });
  } catch (_) {}
}

// Today's ISO date in UTC — matches how the client computes todayKey().
function todayKeyUtc() { return new Date().toISOString().slice(0, 10); }

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + "T00:00:00Z");
  if (isNaN(d.getTime())) return null;
  const today = new Date(todayKeyUtc() + "T00:00:00Z");
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

// Server-side strings — kept here (not in src/locales) because the cron
// runs without the front-end bundle. Eight locales × five framings.
const MSG = {
  en: {
    daily: { title: "Reading Quest", body: "Time for your daily reading challenge." },
    exam30: { title: "Exam in {n} days", body: "Stay sharp — open Reading Quest today." },
    exam7: { title: "{n} days to your exam", body: "Only {n} days left. Keep your streak going!" },
    exam1: { title: "Tomorrow is exam day", body: "One more practice session — you've got this." },
    exam0: { title: "Exam day!", body: "Go show up. Reading Quest will be here when you're done." },
  },
  uz: {
    daily: { title: "Reading Quest", body: "Kunlik o'qish chaqiruvi vaqti keldi." },
    exam30: { title: "Imtihongacha {n} kun", body: "Shaklingizni saqlang — bugun ham bitta sessiya." },
    exam7: { title: "Imtihongacha {n} kun", body: "Atigi {n} kun qoldi. Streak'ni saqlang!" },
    exam1: { title: "Ertaga imtihon", body: "Yana bitta mashq — qila olasiz." },
    exam0: { title: "Imtihon kuni!", body: "Ko'rsating o'zingizni. Reading Quest sizni kutadi." },
  },
  ru: {
    daily: { title: "Reading Quest", body: "Время ежедневного чтения." },
    exam30: { title: "До экзамена {n} дней", body: "Не теряй форму — открой Reading Quest сегодня." },
    exam7: { title: "{n} дней до экзамена", body: "Осталось всего {n} дней. Сохраняй серию!" },
    exam1: { title: "Завтра экзамен", body: "Ещё одна тренировка — у тебя получится." },
    exam0: { title: "День экзамена!", body: "Иди и покажи всё. Reading Quest подождёт." },
  },
  tr: {
    daily: { title: "Reading Quest", body: "Günlük okuma zamanı." },
    exam30: { title: "Sınava {n} gün", body: "Formunu koru — bugün bir oturum yap." },
    exam7: { title: "Sınava {n} gün", body: "Sadece {n} gün kaldı. Seriyi koru!" },
    exam1: { title: "Yarın sınav günü", body: "Bir antrenman daha — yapabilirsin." },
    exam0: { title: "Sınav günü!", body: "Göster kendini. Reading Quest seni bekliyor." },
  },
  ar: {
    daily: { title: "Reading Quest", body: "حان وقت تحدي القراءة اليومي." },
    exam30: { title: "{n} يوماً للامتحان", body: "حافظ على تركيزك — افتح Reading Quest اليوم." },
    exam7: { title: "{n} أيام للامتحان", body: "{n} أيام فقط. حافظ على سلسلتك!" },
    exam1: { title: "غداً يوم الامتحان", body: "جلسة تدريب أخرى — أنت قادر." },
    exam0: { title: "يوم الامتحان!", body: "اذهب وأظهر مهارتك. Reading Quest في انتظارك." },
  },
  de: {
    daily: { title: "Reading Quest", body: "Zeit für deine tägliche Leseaufgabe." },
    exam30: { title: "Noch {n} Tage", body: "Bleib in Form — heute eine Session." },
    exam7: { title: "{n} Tage bis zur Prüfung", body: "Nur noch {n} Tage. Halt deine Serie!" },
    exam1: { title: "Morgen ist Prüfung", body: "Eine letzte Übung — du schaffst das." },
    exam0: { title: "Prüfungstag!", body: "Zeig was du kannst. Reading Quest wartet." },
  },
  es: {
    daily: { title: "Reading Quest", body: "Hora de tu reto diario de lectura." },
    exam30: { title: "{n} días para el examen", body: "Mantente afilado — abre Reading Quest hoy." },
    exam7: { title: "{n} días para el examen", body: "Solo {n} días. ¡Mantén tu racha!" },
    exam1: { title: "Mañana es el examen", body: "Una práctica más — tú puedes." },
    exam0: { title: "¡Día del examen!", body: "Ve a demostrarlo. Reading Quest te espera." },
  },
  fr: {
    daily: { title: "Reading Quest", body: "C'est l'heure du défi de lecture quotidien." },
    exam30: { title: "{n} jours avant l'examen", body: "Reste affûté — ouvre Reading Quest aujourd'hui." },
    exam7: { title: "{n} jours avant l'examen", body: "Plus que {n} jours. Garde ta série !" },
    exam1: { title: "Examen demain", body: "Encore une session — tu vas réussir." },
    exam0: { title: "Jour de l'examen !", body: "Vas-y. Reading Quest sera là après." },
  },
};

function pickMessage(locale, examDate) {
  const lc = (MSG[locale] ? locale : "en");
  const dict = MSG[lc];
  const n = daysUntil(examDate);
  if (n === null) return dict.daily;
  if (n <= 0) return dict.exam0;
  if (n === 1) return dict.exam1;
  if (n <= 7) {
    return { title: dict.exam7.title.replace("{n}", n), body: dict.exam7.body.replace(/\{n\}/g, n) };
  }
  if (n <= 30) {
    return { title: dict.exam30.title.replace("{n}", n), body: dict.exam30.body.replace(/\{n\}/g, n) };
  }
  return dict.daily;
}

export default async function handler(req, res) {
  // Vercel cron sends Authorization: Bearer <CRON_SECRET>.
  const auth = req.headers["authorization"] || req.headers["Authorization"] || "";
  const want = process.env.CRON_SECRET || "";
  if (!want || auth !== `Bearer ${want}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!pub || !priv || !subject) {
    return res.status(503).json({ error: "VAPID keys not configured" });
  }
  webpush.setVapidDetails(subject, pub, priv);

  const all = await fbGetAll();
  const names = Object.keys(all);
  let sent = 0, removed = 0, failed = 0;

  for (const safe of names) {
    const entry = all[safe];
    if (!entry || !entry.subscription) continue;

    // Drop expired exam dates immediately — saves work and removes stale rows.
    const n = daysUntil(entry.examDate);
    if (n !== null && n < 0) {
      await fbDeleteOne(safe);
      removed++;
      continue;
    }

    const msg = pickMessage(entry.locale || "en", entry.examDate);
    const payload = JSON.stringify({ title: msg.title, body: msg.body });
    try {
      await webpush.sendNotification(entry.subscription, payload);
      sent++;
    } catch (err) {
      const sc = (err && err.statusCode) || 0;
      if (sc === 404 || sc === 410) {
        await fbDeleteOne(safe);
        removed++;
      } else {
        failed++;
      }
    }
  }

  return res.status(200).json({ ok: true, sent, removed, failed, total: names.length });
}
