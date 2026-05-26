// Group Reading Rooms (F7) — single router endpoint covering the
// create/join/answer/state actions so the surface stays small.
//
// Storage: rq-rooms-v1/<code> in Firebase RTDB. 6-char alphanumeric
// code (no ambiguous chars). Rooms TTL after 24h — expired reads
// return 410 Gone; the entry is also pruned best-effort on next access.
//
// Room shape:
//   {
//     code, ownerName, ownerType: "teacher"|"student",
//     level, topic, passage, question,
//     participants: { <name>: { joined, answerIdx?, elapsedMs?, finishedAt? } },
//     createdAt, expiresAt, status
//   }
//
// Anonymous joins are allowed (a student opening a shared link doesn't
// need a Reading Quest account to participate) — they pick a display
// name in the join payload. Authenticated joins use their account name
// and get attributed.
//
// All actions go through this one POST endpoint with a routed `action`
// field; GET supports state-poll only.

import Anthropic from "@anthropic-ai/sdk";
import { checkRateLimit } from "./_rateLimit.js";
import { extractUsername } from "./_session.js";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const ROOM_TTL_MS = 24 * 60 * 60 * 1000;
const RATE_LIMIT_MAX_CREATE = 10; // per IP per 15 min — create is expensive
const RATE_LIMIT_MAX_OTHER = 120; // join/answer/state are cheap
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1 confusion
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

// Write a single nested child (e.g. one participant) instead of PATCHing the
// whole `participants` map. PATCHing the map is a read-modify-write on shared
// state: two players joining/answering at once each send back their own stale
// snapshot and the last write wins, silently dropping the other. Writing only
// `participants/<key>` makes each player's update independent and collision-free.
async function fbPutChild(DB, code, childPath, value) {
  try {
    const url = `${DB}/rq/rq-rooms-v1/${safeCode(code)}/${childPath}.json` + fbAuthSuffix();
    const r = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value),
    });
    return r.ok;
  } catch (_) { return false; }
}

// Firebase keys may not contain . $ # [ ] / or control chars. clean() already
// strips \r\n\t; this maps the remaining illegal chars to "_" so a participant
// (esp. an anonymous display name) can safely be used as a child key. The
// original display name is stored in the record's `name` field. The server
// echoes the resulting key back as `youKey` so the client doesn't have to
// reproduce this sanitization.
function roomKey(name) {
  return (String(name || "").replace(/[.$#/[\]\x00-\x1f\x7f]/g, "_").slice(0, NAME_MAX)) || "_";
}

async function fbDelete(DB, code) {
  try {
    await fetch(roomUrl(DB, code) + fbAuthSuffix(), { method: "DELETE" });
  } catch (_) {}
}

// Treats the room as gone if the row is missing or its expiresAt is
// in the past. Drops the stale entry best-effort.
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

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(204).end();

  const DB = (process.env.FIREBASE_DB_URL || "").replace(/\/$/, "");
  if (!DB) return res.status(503).json({ error: "FIREBASE_DB_URL not set" });
  const ip = ((req.headers["x-forwarded-for"] || req.headers["client-ip"] || "").split(",")[0]).trim();

  // ── GET ?code=XXXXXX → state poll ────────────────────────────────
  if (req.method === "GET") {
    const rl = await checkRateLimit(DB, ip, { max: RATE_LIMIT_MAX_OTHER, bucket: "room-poll" });
    if (rl.limited) {
      res.setHeader("Retry-After", String(rl.retryAfter));
      return res.status(429).json({ error: "Too many polls. Slow down." });
    }
    const code = safeCode((req.query && req.query.code) || "");
    if (!code) return res.status(400).json({ error: "Missing 'code'" });
    const room = await getActiveRoom(DB, code);
    if (!room) return res.status(410).json({ error: "Room not found or expired" });
    return res.status(200).json({ room });
  }

  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const action = (req.body && req.body.action) || "";

  // ── create ──────────────────────────────────────────────────────
  if (action === "create") {
    const rl = await checkRateLimit(DB, ip, { max: RATE_LIMIT_MAX_CREATE, bucket: "room-create" });
    if (rl.limited) {
      res.setHeader("Retry-After", String(rl.retryAfter));
      return res.status(429).json({ error: "Too many rooms created. Slow down." });
    }
    if (!process.env.ANTHROPIC_API_KEY) return res.status(503).json({ error: "ANTHROPIC_API_KEY not set" });
    const username = extractUsername(req);
    const ownerName = username || clean(req.body.ownerName, NAME_MAX) || "anonymous";
    const ownerType = req.body.ownerType === "teacher" ? "teacher" : "student";
    const level = (typeof req.body.level === "string" ? req.body.level.toUpperCase() : "B1");
    const topic = clean(req.body.topic, TOPIC_MAX);

    let card;
    try {
      card = await generateRoomCard(level, topic);
    } catch (e) {
      return res.status(502).json({ error: e.message || "Failed to generate room content" });
    }

    // Try up to 3 codes to avoid collision (vanishingly unlikely at 32^6).
    let code = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      const candidate = newCode();
      const existing = await fbGet(DB, candidate);
      if (!existing) { code = candidate; break; }
    }
    if (!code) return res.status(503).json({ error: "Couldn't allocate room code, please retry" });

    const now = Date.now();
    const ownerKey = roomKey(ownerName);
    const room = {
      code,
      ownerName,
      ownerType,
      level,
      topic: topic || null,
      passage: card.passage,
      question: card.question,
      participants: {
        [ownerKey]: { name: ownerName, joined: now, role: "owner" },
      },
      createdAt: now,
      expiresAt: now + ROOM_TTL_MS,
      status: "waiting",
    };
    const ok = await fbPut(DB, code, room);
    if (!ok) return res.status(502).json({ error: "Room write failed" });
    return res.status(200).json({ room, youKey: ownerKey });
  }

  // ── join ────────────────────────────────────────────────────────
  if (action === "join") {
    const rl = await checkRateLimit(DB, ip, { max: RATE_LIMIT_MAX_OTHER, bucket: "room-join" });
    if (rl.limited) {
      res.setHeader("Retry-After", String(rl.retryAfter));
      return res.status(429).json({ error: "Too many joins. Slow down." });
    }
    const code = safeCode(req.body.code);
    const username = extractUsername(req);
    const name = clean(username || req.body.name || "", NAME_MAX);
    if (!code) return res.status(400).json({ error: "Missing 'code'" });
    if (!name) return res.status(400).json({ error: "Missing 'name'" });
    const room = await getActiveRoom(DB, code);
    if (!room) return res.status(410).json({ error: "Room not found or expired" });
    const pkey = roomKey(name);
    const participants = room.participants || {};
    if (!participants[pkey]) {
      const rec = { name, joined: Date.now() };
      await fbPutChild(DB, code, "participants/" + pkey, rec);
      participants[pkey] = rec;
      room.participants = participants;
    }
    return res.status(200).json({ room, youKey: pkey });
  }

  // ── answer ──────────────────────────────────────────────────────
  if (action === "answer") {
    const rl = await checkRateLimit(DB, ip, { max: RATE_LIMIT_MAX_OTHER, bucket: "room-answer" });
    if (rl.limited) {
      res.setHeader("Retry-After", String(rl.retryAfter));
      return res.status(429).json({ error: "Too many answers." });
    }
    const code = safeCode(req.body.code);
    const username = extractUsername(req);
    const name = clean(username || req.body.name || "", NAME_MAX);
    const optionIdx = Number(req.body.optionIdx);
    const elapsedMs = Number(req.body.elapsedMs) || 0;
    if (!code) return res.status(400).json({ error: "Missing 'code'" });
    if (!name) return res.status(400).json({ error: "Missing 'name'" });
    if (!Number.isInteger(optionIdx) || optionIdx < 0 || optionIdx > 3) {
      return res.status(400).json({ error: "Invalid 'optionIdx'" });
    }
    const room = await getActiveRoom(DB, code);
    if (!room) return res.status(410).json({ error: "Room not found or expired" });
    const pkey = roomKey(name);
    const participants = room.participants || {};
    const me = participants[pkey] || { name, joined: Date.now() };
    // Lock the answer — no overwrites once submitted.
    if (typeof me.answerIdx === "number") {
      return res.status(409).json({ error: "Already answered", room });
    }
    me.name = me.name || name;
    me.answerIdx = optionIdx;
    me.elapsedMs = elapsedMs;
    me.finishedAt = Date.now();
    me.correct = !!room.question && optionIdx === room.question.answer;
    await fbPutChild(DB, code, "participants/" + pkey, me);
    participants[pkey] = me;
    room.participants = participants;
    return res.status(200).json({ room, youKey: pkey });
  }

  return res.status(400).json({ error: "Unknown action" });
}
