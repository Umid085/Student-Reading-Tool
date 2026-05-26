// Group Reading Rooms (F7) — Netlify shape. Mirrors api/room.js.

import Anthropic from "@anthropic-ai/sdk";
import { checkRateLimit } from "./_rateLimit.js";
import { extractUsername } from "./_session.js";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const ROOM_TTL_MS = 24 * 60 * 60 * 1000;
const RATE_LIMIT_MAX_CREATE = 10; // per IP per 15 min — create is expensive
const RATE_LIMIT_MAX_OTHER = 120; // join/answer/state are cheap
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const NAME_MAX = 40;
const TOPIC_MAX = 80;

function fbAuthSuffix() {
  return process.env.FIREBASE_DB_SECRET ? `?auth=${process.env.FIREBASE_DB_SECRET}` : "";
}

function clean(s, maxLen) {
  if (typeof s !== "string") return "";
  return s.replace(/[\r\n\t]+/g, " ").trim().slice(0, maxLen);
}

function newCode() {
  let s = "";
  for (let i = 0; i < 6; i++) s += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  return s;
}

function safeCode(c) {
  return String(c || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
}

function roomUrl(DB, code) {
  return `${DB}/rq/rq-rooms-v1/${safeCode(code)}.json`;
}

async function fbGet(DB, code) {
  try {
    const r = await fetch(roomUrl(DB, code) + fbAuthSuffix());
    if (!r.ok) return null;
    const d = await r.json();
    if (d && typeof d === "object" && d.error) return null;
    return d;
  } catch (_) { return null; }
}

async function fbPut(DB, code, value) {
  try {
    const r = await fetch(roomUrl(DB, code) + fbAuthSuffix(), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value),
    });
    return r.ok;
  } catch (_) { return false; }
}

async function fbPatch(DB, code, partial) {
  try {
    const r = await fetch(roomUrl(DB, code) + fbAuthSuffix(), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(partial),
    });
    return r.ok;
  } catch (_) { return false; }
}

async function fbDelete(DB, code) {
  try { await fetch(roomUrl(DB, code) + fbAuthSuffix(), { method: "DELETE" }); } catch (_) {}
}

async function getActiveRoom(DB, code) {
  const room = await fbGet(DB, code);
  if (!room || typeof room !== "object") return null;
  if (room.expiresAt && Date.now() > room.expiresAt) {
    fbDelete(DB, code);
    return null;
  }
  return room;
}

async function generateRoomCard(level, topic) {
  const sLevel = (typeof level === "string" ? level.toUpperCase() : "B1");
  const safeTopic = clean(topic || "", TOPIC_MAX) || "a surprising everyday fact";
  const wordRange = sLevel === "A1" ? "55-75" : sLevel === "A2" ? "65-90" : sLevel === "B1" ? "80-110" : sLevel === "B2" ? "95-130" : sLevel === "C1" ? "110-150" : "130-170";
  const prompt = `Write ONE self-contained passage at CEFR level ${sLevel} about: ${safeTopic}. Exactly ${wordRange} words, one paragraph, vocabulary and grammar strictly matching ${sLevel}. End with a small payoff. Then ONE 4-option MCQ testing a load-bearing detail.

Reply with ONLY a JSON object: {"passage":"<paragraph>","question":{"type":"mcq","q":"<question>","options":["A","B","C","D"],"answer":<0|1|2|3>,"explanation":"<one sentence>"}}`;
  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 700,
    messages: [{ role: "user", content: prompt }],
  });
  const raw = msg.content?.[0]?.text?.trim() || "";
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) throw new Error("Empty model response");
  const parsed = JSON.parse(m[0]);
  if (!parsed.passage || !parsed.question || parsed.question.type !== "mcq" ||
      !Array.isArray(parsed.question.options) || parsed.question.options.length !== 4 ||
      typeof parsed.question.answer !== "number") {
    throw new Error("Invalid micro response shape");
  }
  return { passage: parsed.passage, question: parsed.question };
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json",
};

export const handler = async function (event) {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: CORS, body: "" };
  const DB = (process.env.FIREBASE_DB_URL || "").replace(/\/$/, "");
  if (!DB) return { statusCode: 503, headers: CORS, body: JSON.stringify({ error: "FIREBASE_DB_URL not set" }) };
  const ip = ((event.headers && (event.headers["x-forwarded-for"] || event.headers["client-ip"])) || "").split(",")[0].trim();

  if (event.httpMethod === "GET") {
    const rl = await checkRateLimit(DB, ip, { max: RATE_LIMIT_MAX_OTHER, bucket: "room-poll" });
    if (rl.limited) {
      return { statusCode: 429, headers: { ...CORS, "Retry-After": String(rl.retryAfter) }, body: JSON.stringify({ error: "Too many polls. Slow down." }) };
    }
    const code = safeCode(((event.queryStringParameters || {}).code) || "");
    if (!code) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Missing 'code'" }) };
    const room = await getActiveRoom(DB, code);
    if (!room) return { statusCode: 410, headers: CORS, body: JSON.stringify({ error: "Room not found or expired" }) };
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ room }) };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  let body = {};
  try { body = JSON.parse(event.body || "{}"); } catch (_) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Invalid JSON body" }) };
  }
  const action = body.action || "";

  if (action === "create") {
    const rl = await checkRateLimit(DB, ip, { max: RATE_LIMIT_MAX_CREATE, bucket: "room-create" });
    if (rl.limited) {
      return { statusCode: 429, headers: { ...CORS, "Retry-After": String(rl.retryAfter) }, body: JSON.stringify({ error: "Too many rooms created. Slow down." }) };
    }
    if (!process.env.ANTHROPIC_API_KEY) return { statusCode: 503, headers: CORS, body: JSON.stringify({ error: "ANTHROPIC_API_KEY not set" }) };
    const username = extractUsername(event);
    const ownerName = username || clean(body.ownerName, NAME_MAX) || "anonymous";
    const ownerType = body.ownerType === "teacher" ? "teacher" : "student";
    const level = (typeof body.level === "string" ? body.level.toUpperCase() : "B1");
    const topic = clean(body.topic, TOPIC_MAX);

    let card;
    try { card = await generateRoomCard(level, topic); }
    catch (e) { return { statusCode: 502, headers: CORS, body: JSON.stringify({ error: e.message || "Failed to generate room content" }) }; }

    let code = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      const candidate = newCode();
      const existing = await fbGet(DB, candidate);
      if (!existing) { code = candidate; break; }
    }
    if (!code) return { statusCode: 503, headers: CORS, body: JSON.stringify({ error: "Couldn't allocate room code, please retry" }) };

    const now = Date.now();
    const room = {
      code,
      ownerName,
      ownerType,
      level,
      topic: topic || null,
      passage: card.passage,
      question: card.question,
      participants: { [ownerName]: { joined: now, role: "owner" } },
      createdAt: now,
      expiresAt: now + ROOM_TTL_MS,
      status: "waiting",
    };
    const ok = await fbPut(DB, code, room);
    if (!ok) return { statusCode: 502, headers: CORS, body: JSON.stringify({ error: "Room write failed" }) };
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ room }) };
  }

  if (action === "join") {
    const rl = await checkRateLimit(DB, ip, { max: RATE_LIMIT_MAX_OTHER, bucket: "room-join" });
    if (rl.limited) {
      return { statusCode: 429, headers: { ...CORS, "Retry-After": String(rl.retryAfter) }, body: JSON.stringify({ error: "Too many joins. Slow down." }) };
    }
    const code = safeCode(body.code);
    const username = extractUsername(event);
    const name = clean(username || body.name || "", NAME_MAX);
    if (!code) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Missing 'code'" }) };
    if (!name) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Missing 'name'" }) };
    const room = await getActiveRoom(DB, code);
    if (!room) return { statusCode: 410, headers: CORS, body: JSON.stringify({ error: "Room not found or expired" }) };
    const participants = room.participants || {};
    if (!participants[name]) {
      participants[name] = { joined: Date.now() };
      await fbPatch(DB, code, { participants });
      room.participants = participants;
    }
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ room }) };
  }

  if (action === "answer") {
    const rl = await checkRateLimit(DB, ip, { max: RATE_LIMIT_MAX_OTHER, bucket: "room-answer" });
    if (rl.limited) {
      return { statusCode: 429, headers: { ...CORS, "Retry-After": String(rl.retryAfter) }, body: JSON.stringify({ error: "Too many answers." }) };
    }
    const code = safeCode(body.code);
    const username = extractUsername(event);
    const name = clean(username || body.name || "", NAME_MAX);
    const optionIdx = Number(body.optionIdx);
    const elapsedMs = Number(body.elapsedMs) || 0;
    if (!code) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Missing 'code'" }) };
    if (!name) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Missing 'name'" }) };
    if (!Number.isInteger(optionIdx) || optionIdx < 0 || optionIdx > 3) {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Invalid 'optionIdx'" }) };
    }
    const room = await getActiveRoom(DB, code);
    if (!room) return { statusCode: 410, headers: CORS, body: JSON.stringify({ error: "Room not found or expired" }) };
    const participants = room.participants || {};
    const me = participants[name] || { joined: Date.now() };
    if (typeof me.answerIdx === "number") {
      return { statusCode: 409, headers: CORS, body: JSON.stringify({ error: "Already answered", room }) };
    }
    me.answerIdx = optionIdx;
    me.elapsedMs = elapsedMs;
    me.finishedAt = Date.now();
    me.correct = !!room.question && optionIdx === room.question.answer;
    participants[name] = me;
    await fbPatch(DB, code, { participants });
    room.participants = participants;
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ room }) };
  }

  return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Unknown action" }) };
};
