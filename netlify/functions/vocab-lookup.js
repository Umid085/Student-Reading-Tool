// Vocab lookup with level-tiered dispatch and shared global cache.
// A1/A2 → translate into the user's UI language via Claude.
// B1+   → dictionaryapi.dev for phonetic/audio/def, Claude for situational example.
// Shared cache at rq/rq-vocab-cache-v1/<key>.json in Firebase RTDB.
import Anthropic from "@anthropic-ai/sdk";
import { checkRateLimit } from "./_rateLimit.js";
import { consumeUserQuota } from "./_userQuota.js";
import { extractUsername } from "./_session.js";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const RATE_LIMIT_MAX = 200; // per IP per 15-min window — vocab lookups are frequent
const VOCAB_QUOTA = 80;

const LOW_TIER = new Set(["A1", "A2"]);
const SUPPORTED_LANGS = new Set(["uz", "ru", "tr", "ar", "de", "es", "fr"]);
const LANG_NAMES = {
  uz: "Uzbek", ru: "Russian", tr: "Turkish", ar: "Arabic",
  de: "German", es: "Spanish", fr: "French",
};

function normalizeWord(w) {
  if (typeof w !== "string") return "";
  return w.toLowerCase().replace(/[^a-z'-]/g, "").slice(0, 40);
}

async function cacheGet(cacheKey) {
  const DB = (process.env.FIREBASE_DB_URL || "").replace(/\/$/, "");
  if (!DB) return null;
  const fbAuth = process.env.FIREBASE_DB_SECRET ? `?auth=${process.env.FIREBASE_DB_SECRET}` : "";
  try {
    const r = await fetch(`${DB}/rq/rq-vocab-cache-v1/${encodeURIComponent(cacheKey)}.json${fbAuth}`);
    if (!r.ok) return null;
    const data = await r.json();
    if (!data || typeof data !== "object" || data.error) return null;
    return data;
  } catch (_) { return null; }
}

async function cachePut(cacheKey, entry) {
  const DB = (process.env.FIREBASE_DB_URL || "").replace(/\/$/, "");
  if (!DB) return;
  const fbAuth = process.env.FIREBASE_DB_SECRET ? `?auth=${process.env.FIREBASE_DB_SECRET}` : "";
  try {
    await fetch(`${DB}/rq/rq-vocab-cache-v1/${encodeURIComponent(cacheKey)}.json${fbAuth}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...entry, ts: Date.now() }),
    });
  } catch (_) { /* swallow */ }
}

async function dictionaryLookup(word) {
  try {
    const ctl = new AbortController();
    const tid = setTimeout(() => ctl.abort(), 6000);
    const r = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`, { signal: ctl.signal });
    clearTimeout(tid);
    if (!r.ok) return null;
    const data = await r.json();
    const entry = data[0];
    if (!entry) return null;
    const phonetic = entry.phonetic || (entry.phonetics && entry.phonetics[0] && entry.phonetics[0].text) || "";
    const audio = ((entry.phonetics || []).find((p) => p.audio) || {}).audio || "";
    const meaning = entry.meanings && entry.meanings[0] && entry.meanings[0].definitions && entry.meanings[0].definitions[0];
    return {
      phonetic,
      audio,
      def: meaning ? meaning.definition : "",
    };
  } catch (_) { return null; }
}

async function claudeTranslate(word, lang) {
  const langName = LANG_NAMES[lang];
  if (!langName) return null;
  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 80,
    messages: [{
      role: "user",
      content: `Translate the English word "${word}" into ${langName}. Reply with ONLY a JSON object: {"translation": "<single best translation>"}. No extra prose, no explanation, no script other than ${langName}'s native script.`,
    }],
  });
  const raw = msg.content?.[0]?.text?.trim() || "";
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    const obj = JSON.parse(m[0]);
    if (typeof obj.translation === "string") return obj.translation.trim().slice(0, 100);
  } catch (_) {}
  return null;
}

async function claudeSituationalExample(word, def) {
  const ctxHint = def ? `Definition: "${def}". ` : "";
  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 160,
    messages: [{
      role: "user",
      content: `${ctxHint}Write ONE short situational example sentence (12-20 words) showing the word "${word}" used naturally in a realistic context that makes its meaning unambiguous. Avoid abstract or dictionary-style phrasing — picture a real scene. Reply with ONLY a JSON object: {"example": "<one sentence>"}.`,
    }],
  });
  const raw = msg.content?.[0]?.text?.trim() || "";
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    const obj = JSON.parse(m[0]);
    if (typeof obj.example === "string") return obj.example.trim().slice(0, 240);
  } catch (_) {}
  return null;
}

export const handler = async function (event) {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: {}, body: "" };
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }
  // IP rate limit before any Claude path. Anonymous callers bypass the
  // per-user quota, so without this the Netlify deploy is an unauthenticated
  // Anthropic-spend vector. Mirrors api/vocab-lookup.js.
  const DB = (process.env.FIREBASE_DB_URL || "").replace(/\/$/, "");
  const ip = ((event.headers && (event.headers["x-forwarded-for"] || event.headers["client-ip"])) || "").split(",")[0].trim();
  const rl = await checkRateLimit(DB, ip, { max: RATE_LIMIT_MAX, bucket: "vocab" });
  if (rl.limited) {
    return { statusCode: 429, headers: { "Retry-After": String(rl.retryAfter) }, body: JSON.stringify({ error: "Too many vocab lookups. Slow down." }) };
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return { statusCode: 503, body: JSON.stringify({ error: "ANTHROPIC_API_KEY not set" }) };
  }

  let body = {};
  try { body = JSON.parse(event.body || "{}"); } catch (_) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON body" }) };
  }
  const word = normalizeWord(body.word);
  const lang = typeof body.lang === "string" ? body.lang.toLowerCase() : "";
  const level = typeof body.level === "string" ? body.level.toUpperCase() : "B1";
  if (!word) return { statusCode: 400, body: JSON.stringify({ error: "Missing or invalid 'word'" }) };

  const tier = LOW_TIER.has(level) ? "L" : "H";
  const useTranslate = tier === "L" && SUPPORTED_LANGS.has(lang);
  const cacheKey = useTranslate ? `t-${lang}-${word}` : `e-${word}`;

  try {
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...cached, source: "cache" }) };
    }

    // Cache miss → consume quota before any Claude call.
    const vocabDB = (process.env.FIREBASE_DB_URL || "").replace(/\/$/, "");
    const vocabUsername = extractUsername(event);
    const vocabQuota = await consumeUserQuota(vocabDB, vocabUsername, "vocab", { max: VOCAB_QUOTA });
    if (vocabQuota.exceeded) {
      return {
        statusCode: 429,
        headers: { "Retry-After": String(Math.max(1, Math.ceil((vocabQuota.resetAt - Date.now()) / 1000))) },
        body: JSON.stringify({ error: `Daily vocab lookup limit reached (${vocabQuota.used}/${vocabQuota.max}). Resets at UTC midnight.` }),
      };
    }

    if (useTranslate) {
      const translation = await claudeTranslate(word, lang);
      if (!translation) {
        return { statusCode: 502, body: JSON.stringify({ error: "Translation unavailable" }) };
      }
      const entry = { translation, mode: "translate", lang };
      await cachePut(cacheKey, entry);
      return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...entry, source: "claude" }) };
    }

    const dict = await dictionaryLookup(word);
    const example = await claudeSituationalExample(word, dict ? dict.def : "");
    if (!dict && !example) {
      return { statusCode: 404, body: JSON.stringify({ error: "Word not found and no example could be generated" }) };
    }
    const entry = {
      phonetic: (dict && dict.phonetic) || "",
      audio: (dict && dict.audio) || "",
      def: (dict && dict.def) || "",
      example: example || (dict && dict.example) || "",
      mode: "enriched",
    };
    await cachePut(cacheKey, entry);
    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...entry, source: dict ? "dict+claude" : "claude" }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message || String(e) }) };
  }
};
