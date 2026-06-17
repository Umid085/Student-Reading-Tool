// Community mutations (leaderboards + social graph + per-user vocab/favs +
// daily leaderboard + story discussion) — Netlify shape. Mirrors api/community.js.
//
// Actor identity comes ONLY from the verified session token. Every write is a
// per-child / per-key ETag compare-and-swap so concurrent writers to different
// children never collide. Direct writes to rq-boards-v6 / rq-weekly-v1 /
// rq-social-v6 / rq-vocab-v1 / rq-favs-v1 / rq-daily-lb-v1 / rq-discuss-v1 are
// blocked in storage.js, so this is the only mutation path. Reads stay on the
// open /api/storage GET. Cross-user actions do two sequential per-child CAS
// writes (not atomic, but idempotent → client retry self-heals).
// Leaderboard scope: closes clobber/impersonation, NOT self-score-inflation.

import { extractUsername } from "./_session.js";
import { checkRateLimit } from "./_rateLimit.js";

const BOARDS_KEY = "rq-boards-v6";
const WEEKLY_KEY = "rq-weekly-v1";
const SOCIAL_KEY = "rq-social-v6";
const VOCAB_KEY = "rq-vocab-v1";
const FAVS_KEY = "rq-favs-v1";
const DAILY_LB_KEY = "rq-daily-lb-v1";
const DISCUSS_KEY = "rq-discuss-v1";
const LIKES_CHILD = "!likes";
const LEVELS = new Set(["A1", "A2", "B1", "B2", "C1", "C2"]);
const NAME_RE = /^[A-Za-z0-9_]{2,30}$/;
const NAME_MAX = 60;
const RATE_LIMIT_MAX = 120;
const DAY_MS = 24 * 60 * 60 * 1000;
const VOCAB_MAX = 500;
const FAVS_MAX = 500;
const DISCUSS_TEXT_MAX = 200;
const DISCUSS_CAP = 50;
const DAILY_LB_CAP = 100;

// ── Leaderboard anti-cheat (server-authoritative) ─────────────────────
// Mirrors api/community.js — reject sub-threshold runs and clamp forged XP.
const PASS_PCT = 60;
const LEVEL_MULT = { A1: 1, A2: 1.5, B1: 2, B2: 2.5, C1: 3, C2: 4 };
const LEVEL_TIME_BONUS = { A1: 200, A2: 200, B1: 300, B2: 300, C1: 400, C2: 400 };
const QUEST_XP_HEADROOM = 2000;
const MAX_GAME_XP = 60000;

function maxGameXp(level, total) {
  const base = Math.max(0, total) * (LEVEL_MULT[level] || 1) * 100;
  const raw = base + (LEVEL_TIME_BONUS[level] || 200) + 50 + QUEST_XP_HEADROOM;
  return Math.min(MAX_GAME_XP, Math.ceil(raw * 1.5));
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json",
};

function fbAuth() {
  return process.env.FIREBASE_DB_SECRET ? `?auth=${process.env.FIREBASE_DB_SECRET}` : "";
}
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function clean(s, max) {
  if (typeof s !== "string") return "";
  return s.replace(/[\r\n\t]+/g, " ").trim().slice(0, max);
}
function name(v) {
  const s = String(v == null ? "" : v).trim();
  return NAME_RE.test(s) ? s : "";
}
function num(v) {
  return Math.max(0, Math.round(Number(v) || 0));
}
function getWeekId() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return d.getFullYear() + "-W" + (weekNo < 10 ? "0" + weekNo : weekNo);
}
function asArr(v) {
  if (Array.isArray(v)) return v;
  if (v && typeof v === "object") {
    return Object.keys(v).filter((k) => /^\d+$/.test(k)).sort((a, b) => a - b).map((k) => v[k]).filter((x) => x != null);
  }
  return [];
}

async function casChild(DB, key, childPath, mutate, maxAttempts = 5) {
  const url = `${DB}/rq/${key}/${childPath}.json${fbAuth()}`;
  for (let i = 0; i < maxAttempts; i++) {
    const r = await fetch(url, { headers: { "X-Firebase-ETag": "true" } });
    const etag = r.headers.get("etag") || "null_etag";
    const raw = await r.json();
    if (raw && typeof raw === "object" && !Array.isArray(raw) && typeof raw.error === "string") {
      throw new Error("Firebase: " + raw.error);
    }
    const out = mutate(raw);
    if (out && out.abort) return out;
    if (out && out.noop) return out;
    const w = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "if-match": etag },
      body: JSON.stringify(out.value),
    });
    if (w.ok) return { ok: true, value: out.value, result: out.result };
    if (w.status !== 412) throw new Error("Firebase write failed: " + w.status);
  }
  throw new Error("Write contention — please retry");
}

function casSetMember(DB, user, field, member, add) {
  return casChild(DB, SOCIAL_KEY, `${user}/${field}`, (raw) => {
    const arr = asArr(raw);
    const has = arr.indexOf(member) !== -1;
    if (add && has) return { noop: true, result: arr };
    if (!add && !has) return { noop: true, result: arr };
    const next = add ? arr.concat([member]) : arr.filter((x) => x !== member);
    return { value: next, result: next };
  });
}

function json(statusCode, obj) {
  return { statusCode, headers: CORS, body: JSON.stringify(obj) };
}

export const handler = async function (event) {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: CORS, body: "" };
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  const DB = (process.env.FIREBASE_DB_URL || "").replace(/\/$/, "");
  if (!DB) return json(503, { error: "FIREBASE_DB_URL not set" });

  const ip = ((event.headers && (event.headers["x-forwarded-for"] || event.headers["client-ip"])) || "").split(",")[0].trim();
  const rl = await checkRateLimit(DB, ip, { max: RATE_LIMIT_MAX, bucket: "community" });
  if (rl.limited) return { statusCode: 429, headers: { ...CORS, "Retry-After": String(rl.retryAfter) }, body: JSON.stringify({ error: "Too many requests. Slow down." }) };

  const actor = extractUsername(event);
  if (!actor) return json(401, { error: "Sign in required" });

  let body = {};
  try { body = JSON.parse(event.body || "{}"); } catch (_) { return json(400, { error: "Invalid JSON body" }); }
  const action = ((event.queryStringParameters || {}).action) || body.action || "";

  try {
    if (action === "submitScore") {
      const level = String(body.level || "").toUpperCase();
      if (!LEVELS.has(level)) return json(400, { error: "Invalid level" });
      const pct = Math.max(0, Math.min(100, num(body.pct)));
      // Anti-cheat gate: random guessing (~25% on MCQ) never reaches the board.
      if (pct < PASS_PCT) return json(200, { ok: false, err: "Score below leaderboard threshold" });
      const total = num(body.total);
      // Clamp forged XP to what's actually achievable for this level + score.
      const xp = Math.max(0, Math.min(num(body.xp), maxGameXp(level, total)));
      const entry = {
        name: actor, xp, score: num(body.score), total,
        pct, timeSecs: num(body.timeSecs),
        topic: clean(body.topic, NAME_MAX) || "", date: todayISO(),
      };
      const out = await casChild(DB, BOARDS_KEY, level, (raw) => {
        const merged = asArr(raw).filter((e) => e && e.name !== actor).concat([entry]);
        merged.sort((a, b) => (b.xp || 0) - (a.xp || 0));
        const top = merged.slice(0, 100);
        return { value: top, result: top };
      });
      return json(200, { ok: true, board: out.result });
    }

    if (action === "submitWeekly") {
      // No level context here, so clamp to the absolute per-game ceiling to stop
      // a forged weekly bump. Negative/NaN coerces to 0.
      const xp = Math.max(0, Math.min(num(body.xp), MAX_GAME_XP));
      const wk = getWeekId();
      const out = await casChild(DB, WEEKLY_KEY, wk, (raw) => {
        const arr = asArr(raw);
        const prev = arr.find((e) => e && e.name === actor);
        const entry = prev
          ? { name: actor, xp: (Number(prev.xp) || 0) + xp, games: (Number(prev.games) || 0) + 1 }
          : { name: actor, xp, games: 1 };
        const merged = arr.filter((e) => e && e.name !== actor).concat([entry]);
        merged.sort((a, b) => (b.xp || 0) - (a.xp || 0));
        const top = merged.slice(0, 30);
        return { value: top, result: top };
      });
      return json(200, { ok: true, week: out.result, weekId: wk });
    }

    if (action === "sendRequest") {
      const to = name(body.to);
      if (!to) return json(400, { error: "Invalid recipient" });
      if (to === actor) return json(400, { error: "You can't friend yourself" });
      const friends = asArr(await (await fetch(`${DB}/rq/${SOCIAL_KEY}/${to}/friends.json${fbAuth()}`)).json());
      if (friends.indexOf(actor) !== -1) return json(200, { ok: false, err: "Already friends" });
      const out = await casChild(DB, SOCIAL_KEY, `${to}/requests`, (raw) => {
        const arr = asArr(raw);
        if (arr.indexOf(actor) !== -1) return { noop: true, result: { ok: false, err: "Request already sent" } };
        return { value: arr.concat([actor]), result: { ok: true } };
      });
      return json(200, out.result);
    }

    if (action === "acceptRequest") {
      const from = name(body.from);
      if (!from) return json(400, { error: "Invalid user" });
      await casChild(DB, SOCIAL_KEY, `${actor}/requests`, (raw) => {
        const arr = asArr(raw);
        if (arr.indexOf(from) === -1) return { noop: true, result: arr };
        return { value: arr.filter((x) => x !== from), result: arr };
      });
      await casSetMember(DB, actor, "friends", from, true);
      await casSetMember(DB, from, "friends", actor, true);
      return json(200, { ok: true });
    }

    if (action === "declineRequest") {
      const from = name(body.from);
      if (!from) return json(400, { error: "Invalid user" });
      await casChild(DB, SOCIAL_KEY, `${actor}/requests`, (raw) => {
        const arr = asArr(raw);
        if (arr.indexOf(from) === -1) return { noop: true, result: arr };
        return { value: arr.filter((x) => x !== from), result: arr };
      });
      return json(200, { ok: true });
    }

    if (action === "removeFriend") {
      const friend = name(body.friend);
      if (!friend) return json(400, { error: "Invalid user" });
      await casSetMember(DB, actor, "friends", friend, false);
      await casSetMember(DB, friend, "friends", actor, false);
      return json(200, { ok: true });
    }

    if (action === "likeProfile") {
      const target = name(body.target);
      if (!target) return json(400, { error: "Invalid target" });
      if (target === actor) return json(400, { error: "You can't like yourself" });
      const guardKey = actor + "->" + target;
      const guard = await casChild(DB, SOCIAL_KEY, LIKES_CHILD, (raw) => {
        const map = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
        if (map[guardKey]) return { noop: true, result: { ok: false } };
        return { value: Object.assign({}, map, { [guardKey]: true }), result: { ok: true } };
      });
      if (!guard.result.ok) return json(200, { ok: false, err: "Already liked" });
      const inc = await casChild(DB, SOCIAL_KEY, `${target}/likes`, (raw) => {
        const n = (Number(raw) || 0) + 1;
        return { value: n, result: n };
      });
      return json(200, { ok: true, likes: inc.result });
    }

    if (action === "sendChallenge") {
      const to = name(body.to);
      if (!to) return json(400, { error: "Invalid recipient" });
      if (to === actor) return json(400, { error: "You can't challenge yourself" });
      const level = clean(body.level, 4).toUpperCase() || "B1";
      const types = Array.isArray(body.types) ? body.types.filter((t) => typeof t === "string").slice(0, 8) : [];
      const storyId = body.storyId ? clean(body.storyId, 60) : null;
      const storyTitle = body.storyTitle ? clean(body.storyTitle, NAME_MAX) : "";
      const senderPct = body.senderPct != null ? Math.max(0, Math.min(100, num(body.senderPct))) : null;
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const expiresAt = Date.now() + DAY_MS;
      const date = todayISO();
      const ch = { id, from: actor, level, types, date, status: "pending", expiresAt };
      if (storyId) { ch.storyId = storyId; ch.storyTitle = storyTitle; }
      if (senderPct != null) ch.senderPct = senderPct;
      await casChild(DB, SOCIAL_KEY, `${to}/challenges`, (raw) => {
        const arr = asArr(raw);
        return { value: arr.concat([ch]), result: arr };
      });
      const sent = { id, to, level, storyId: storyId || null, storyTitle, senderPct, date, status: "pending", expiresAt };
      await casChild(DB, SOCIAL_KEY, `${actor}/sent`, (raw) => {
        const arr = asArr(raw);
        return { value: arr.concat([sent]), result: arr };
      });
      return json(200, { ok: true, id });
    }

    if (action === "respondChallenge") {
      const id = clean(body.id, 40);
      const status = body.status === "accepted" || body.status === "declined" ? body.status : "";
      if (!id || !status) return json(400, { error: "id and status required" });
      const out = await casChild(DB, SOCIAL_KEY, `${actor}/challenges`, (raw) => {
        const arr = asArr(raw);
        const idx = arr.findIndex((c) => c && c.id === id);
        if (idx === -1) return { abort: true, status: 404, body: { error: "Challenge not found" } };
        const next = arr.slice();
        next[idx] = Object.assign({}, arr[idx], { status });
        return { value: next, result: next };
      });
      if (out.abort) return json(out.status, out.body);
      return json(200, { ok: true });
    }

    if (action === "completeChallenge") {
      const id = clean(body.id, 40);
      if (!id) return json(400, { error: "id required" });
      const r = body.result || {};
      const result = { pct: Math.max(0, Math.min(100, num(r.pct))), xp: num(r.xp), timeSecs: num(r.timeSecs) };
      let sender = "";
      let senderPct = null;
      const out = await casChild(DB, SOCIAL_KEY, `${actor}/challenges`, (raw) => {
        const arr = asArr(raw);
        const idx = arr.findIndex((c) => c && c.id === id);
        if (idx === -1) return { abort: true, status: 404, body: { error: "Challenge not found" } };
        sender = arr[idx].from || "";
        senderPct = arr[idx].senderPct != null ? arr[idx].senderPct : null;
        const next = arr.slice();
        next[idx] = Object.assign({}, arr[idx], { status: "completed", result });
        return { value: next, result: next };
      });
      if (out.abort) return json(out.status, out.body);
      if (sender && NAME_RE.test(sender)) {
        await casChild(DB, SOCIAL_KEY, `${sender}/sent`, (raw) => {
          const arr = asArr(raw);
          const si = arr.findIndex((s) => s && s.id === id);
          if (si === -1) return { noop: true, result: arr };
          const next = arr.slice();
          next[si] = Object.assign({}, arr[si], { status: "completed", result: { pct: result.pct, xp: result.xp, by: actor, senderPct } });
          return { value: next, result: next };
        });
      }
      return json(200, { ok: true });
    }

    if (action === "subscribe" || action === "unsubscribe") {
      const teacher = name(body.teacher);
      if (!teacher) return json(400, { error: "Invalid teacher" });
      if (teacher === actor) return json(400, { error: "You can't subscribe to yourself" });
      const add = action === "subscribe";
      await casSetMember(DB, actor, "subscribed", teacher, add);
      await casSetMember(DB, teacher, "subscribers", actor, add);
      return json(200, { ok: true });
    }

    // ── saveVocab (actor writes ONLY their own vocab child) ───────
    if (action === "saveVocab") {
      if (!Array.isArray(body.vocab)) return json(400, { error: "vocab must be an array" });
      const cleaned = body.vocab
        .filter((e) => e && typeof e === "object" && clean(e.word, 80))
        .map((e) => ({
          word: clean(e.word, 80),
          level: clean(e.level, 4),
          topic: clean(e.topic, 60),
          date: clean(e.date, 10),
          status: clean(e.status, 12) || "new",
          def: clean(e.def, 500),
          example: clean(e.example, 500),
          srInterval: num(e.srInterval),
          nextReview: typeof e.nextReview === "string" ? clean(e.nextReview, 10) : null,
        }))
        .slice(0, VOCAB_MAX);
      await casChild(DB, VOCAB_KEY, actor, () => ({ value: cleaned, result: cleaned }));
      return json(200, { ok: true });
    }

    // ── saveFavs (actor writes ONLY their own favourites child) ───
    if (action === "saveFavs") {
      if (!Array.isArray(body.favs)) return json(400, { error: "favs must be an array" });
      const cleaned = body.favs
        .filter((f) => f && typeof f === "object" && clean(f.id, 60))
        .map((f) => ({
          id: clean(f.id, 60),
          title: clean(f.title, NAME_MAX),
          level: clean(f.level, 4),
          date: clean(f.date, 10),
        }))
        .slice(0, FAVS_MAX);
      await casChild(DB, FAVS_KEY, actor, () => ({ value: cleaned, result: cleaned }));
      return json(200, { ok: true });
    }

    // ── submitDailyScore (daily-challenge leaderboard) ────────────
    if (action === "submitDailyScore") {
      const xp = Math.max(0, Math.min(num(body.xp), MAX_GAME_XP));
      const pct = Math.max(0, Math.min(100, num(body.pct)));
      const entry = { name: actor, xp, pct, timeSecs: num(body.timeSecs) };
      const day = todayISO();
      const out = await casChild(DB, DAILY_LB_KEY, day, (raw) => {
        const merged = asArr(raw).filter((e) => e && e.name !== actor).concat([entry]);
        merged.sort((a, b) => (b.xp || 0) - (a.xp || 0));
        const top = merged.slice(0, DAILY_LB_CAP);
        return { value: top, result: top };
      });
      return json(200, { ok: true, day, board: out.result });
    }

    // ── postDiscuss (append one post to a story thread) ───────────
    if (action === "postDiscuss") {
      const storyId = clean(body.storyId, 60);
      const text = clean(body.text, DISCUSS_TEXT_MAX);
      if (!storyId) return json(400, { error: "Invalid story" });
      if (text.length < 3) return json(400, { error: "Post too short" });
      const day = todayISO();
      const out = await casChild(DB, DISCUSS_KEY, storyId, (raw) => {
        const arr = asArr(raw);
        if (arr.some((p) => p && p.user === actor && p.date === day))
          return { abort: true, status: 200, body: { ok: false, err: "Already posted today" } };
        const post = { user: actor, text, date: day };
        const next = [post].concat(arr).slice(0, DISCUSS_CAP);
        return { value: next, result: next };
      });
      if (out.abort) return json(out.status, out.body);
      return json(200, { ok: true });
    }

    return json(400, { error: "Unknown action" });
  } catch (e) {
    return json(502, { error: e.message || "Community write failed" });
  }
};
