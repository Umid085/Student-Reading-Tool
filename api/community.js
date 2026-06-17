// Community mutations (leaderboards + social graph + per-user vocab/favs +
// daily leaderboard + story discussion) — single authenticated router.
//
// WHY THIS EXISTS: scores, weekly XP, and the social graph used to be written
// through the generic `/api/storage` proxy as whole-structure PUTs from the
// client. That meant (a) any authenticated user could overwrite the ENTIRE
// `rq-boards-v6` / `rq-weekly-v1` / `rq-social-v6` blob (the proxy authenticates
// but does not authorize) — wiping leaderboards or spamming requests/challenges/
// likes into anyone's node — and (b) concurrent writers clobbered each other.
// This endpoint fixes both: the actor is taken from the SESSION TOKEN (never the
// request body), and every write is a per-child / per-key ETag compare-and-swap
// so two writers touching different children never collide and same-child
// contention resolves on retry. Direct writes to these keys are blocked in
// `storage.js`, so this is the only mutation path. Reads stay on the open
// `/api/storage` GET — these lists aren't secret.
//
// The same per-child fix covers four more keys that were also whole-object
// PUTs through the proxy: rq-vocab-v1 / rq-favs-v1 (per-user children, so you
// can only write your own), rq-daily-lb-v1 (daily leaderboard, name forced +
// xp clamped like submitWeekly), and rq-discuss-v1 (posts authored as the
// token user, 1/day enforced server-side).
//
// SCOPE LIMIT (leaderboards): forcing the actor's name from the token closes the
// clobber + impersonation hole (you can't overwrite the board or post as someone
// else). It does NOT stop a user self-reporting an inflated OWN score — there is
// no server-side quiz state to validate against. That is a separate, larger
// project (server-issued/graded quizzes) and is intentionally out of scope here.
//
// CROSS-USER ATOMICITY: actions that touch two users' nodes (acceptRequest,
// removeFriend, sendChallenge, completeChallenge, subscribe/unsubscribe) do two
// sequential per-child CAS writes — not atomic across the pair. All mutations are
// idempotent (set-membership / by-id guards), so a client retry self-heals a
// half-applied write. This is a strict improvement over the old whole-doc PUT.
//
// Lives as one routed file (?action=…) to respect Vercel Hobby's 12-function cap.

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
const RATE_LIMIT_MAX = 120; // per IP per 15 min (social actions are frequent)
const DAY_MS = 24 * 60 * 60 * 1000;
const VOCAB_MAX = 500;        // vocab entries kept per user
const FAVS_MAX = 500;         // favourited stories kept per user
const DISCUSS_TEXT_MAX = 200; // matches the client textarea cap
const DISCUSS_CAP = 50;       // newest-first posts kept per story
const DAILY_LB_CAP = 100;     // daily-challenge leaderboard size

// ── Leaderboard anti-cheat (server-authoritative) ─────────────────────
// The client computes XP, but a direct API caller could forge it. We reject
// runs that didn't pass (PASS_PCT) and clamp the submitted XP to the theoretical
// max for the level so a forged `xp: 9999999` can't take first place. These
// mirror LEVELS/Q_XP/PASS_PCT in src/student-reading-quest.jsx — keep in sync.
const PASS_PCT = 60;
const LEVEL_MULT = { A1: 1, A2: 1.5, B1: 2, B2: 2.5, C1: 3, C2: 4 };
const LEVEL_TIME_BONUS = { A1: 200, A2: 200, B1: 300, B2: 300, C1: 400, C2: 400 };
const QUEST_XP_HEADROOM = 2000; // generous allowance for daily-quest bonuses
const MAX_GAME_XP = 60000;      // absolute per-game ceiling (weekly has no level context)

// Theoretical max XP for one game at a level given its total point pool.
function maxGameXp(level, total) {
  const base = Math.max(0, total) * (LEVEL_MULT[level] || 1) * 100;
  const raw = base + (LEVEL_TIME_BONUS[level] || 200) + 50 + QUEST_XP_HEADROOM;
  return Math.min(MAX_GAME_XP, Math.ceil(raw * 1.5)); // ×1.5 = challenge mode
}

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
// ISO 8601 week id (Monday-anchored, year from the week's Thursday) — must match
// getWeekId() in src/student-reading-quest.jsx so the client reads what we write.
function getWeekId() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return d.getFullYear() + "-W" + (weekNo < 10 ? "0" + weekNo : weekNo);
}
// Firebase serializes arrays with deleted entries as objects with numeric keys;
// normalize either shape back to a clean array.
function asArr(v) {
  if (Array.isArray(v)) return v;
  if (v && typeof v === "object") {
    return Object.keys(v).filter((k) => /^\d+$/.test(k)).sort((a, b) => a - b).map((k) => v[k]).filter((x) => x != null);
  }
  return [];
}

// ETag compare-and-swap over an arbitrary child path under a top-level key.
// `mutate(raw)` receives the raw value at the path and returns one of:
//   { value, result }      → conditionally PUT `value`, return `result`
//   { abort, status, body } → return an HTTP error without writing
//   { noop, result }        → return `result` without writing (idempotent)
// Retries on 412 (a concurrent write moved the ETag). Throws on other failures.
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
    // 412 → re-read and retry.
  }
  throw new Error("Write contention — please retry");
}

// Add/remove a string from a user's array child (friends/subscribed/etc).
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

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const DB = (process.env.FIREBASE_DB_URL || "").replace(/\/$/, "");
  if (!DB) return res.status(503).json({ error: "FIREBASE_DB_URL not set" });

  const ip = ((req.headers["x-forwarded-for"] || req.headers["client-ip"] || "").split(",")[0]).trim();
  const rl = await checkRateLimit(DB, ip, { max: RATE_LIMIT_MAX, bucket: "community" });
  if (rl.limited) {
    res.setHeader("Retry-After", String(rl.retryAfter));
    return res.status(429).json({ error: "Too many requests. Slow down." });
  }

  // Actor identity comes ONLY from the verified session token — never the body.
  const actor = extractUsername(req);
  if (!actor) return res.status(401).json({ error: "Sign in required" });

  const body = req.body || {};
  const action = (req.query && req.query.action) || body.action || "";

  try {
    // ── submitScore (per-level leaderboard) ───────────────────────
    if (action === "submitScore") {
      const level = String(body.level || "").toUpperCase();
      if (!LEVELS.has(level)) return res.status(400).json({ error: "Invalid level" });
      const pct = Math.max(0, Math.min(100, num(body.pct)));
      // Anti-cheat gate: random guessing (~25% on MCQ) never reaches the board.
      if (pct < PASS_PCT) return res.status(200).json({ ok: false, err: "Score below leaderboard threshold" });
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
      return res.status(200).json({ ok: true, board: out.result });
    }

    // ── submitWeekly (per-ISO-week XP board) ──────────────────────
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
      return res.status(200).json({ ok: true, week: out.result, weekId: wk });
    }

    // ── sendRequest (writes into the RECIPIENT's requests) ────────
    if (action === "sendRequest") {
      const to = name(body.to);
      if (!to) return res.status(400).json({ error: "Invalid recipient" });
      if (to === actor) return res.status(400).json({ error: "You can't friend yourself" });
      const friends = asArr(await (await fetch(`${DB}/rq/${SOCIAL_KEY}/${to}/friends.json${fbAuth()}`)).json());
      if (friends.indexOf(actor) !== -1) return res.status(200).json({ ok: false, err: "Already friends" });
      const out = await casChild(DB, SOCIAL_KEY, `${to}/requests`, (raw) => {
        const arr = asArr(raw);
        if (arr.indexOf(actor) !== -1) return { noop: true, result: { ok: false, err: "Request already sent" } };
        return { value: arr.concat([actor]), result: { ok: true } };
      });
      return res.status(200).json(out.result);
    }

    // ── acceptRequest (mutates BOTH users) ────────────────────────
    if (action === "acceptRequest") {
      const from = name(body.from);
      if (!from) return res.status(400).json({ error: "Invalid user" });
      await casChild(DB, SOCIAL_KEY, `${actor}/requests`, (raw) => {
        const arr = asArr(raw);
        if (arr.indexOf(from) === -1) return { noop: true, result: arr };
        return { value: arr.filter((x) => x !== from), result: arr };
      });
      await casSetMember(DB, actor, "friends", from, true);
      await casSetMember(DB, from, "friends", actor, true);
      return res.status(200).json({ ok: true });
    }

    // ── declineRequest (self only) ────────────────────────────────
    if (action === "declineRequest") {
      const from = name(body.from);
      if (!from) return res.status(400).json({ error: "Invalid user" });
      await casChild(DB, SOCIAL_KEY, `${actor}/requests`, (raw) => {
        const arr = asArr(raw);
        if (arr.indexOf(from) === -1) return { noop: true, result: arr };
        return { value: arr.filter((x) => x !== from), result: arr };
      });
      return res.status(200).json({ ok: true });
    }

    // ── removeFriend (mutates BOTH users) ─────────────────────────
    if (action === "removeFriend") {
      const friend = name(body.friend);
      if (!friend) return res.status(400).json({ error: "Invalid user" });
      await casSetMember(DB, actor, "friends", friend, false);
      await casSetMember(DB, friend, "friends", actor, false);
      return res.status(200).json({ ok: true });
    }

    // ── likeProfile (guard child gates the increment) ─────────────
    if (action === "likeProfile") {
      const target = name(body.target);
      if (!target) return res.status(400).json({ error: "Invalid target" });
      if (target === actor) return res.status(400).json({ error: "You can't like yourself" });
      const guardKey = actor + "->" + target;
      const guard = await casChild(DB, SOCIAL_KEY, LIKES_CHILD, (raw) => {
        const map = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
        if (map[guardKey]) return { noop: true, result: { ok: false } };
        return { value: Object.assign({}, map, { [guardKey]: true }), result: { ok: true } };
      });
      if (!guard.result.ok) return res.status(200).json({ ok: false, err: "Already liked" });
      const inc = await casChild(DB, SOCIAL_KEY, `${target}/likes`, (raw) => {
        const n = (Number(raw) || 0) + 1;
        return { value: n, result: n };
      });
      return res.status(200).json({ ok: true, likes: inc.result });
    }

    // ── sendChallenge (opponent's challenges + actor's sent) ──────
    if (action === "sendChallenge") {
      const to = name(body.to);
      if (!to) return res.status(400).json({ error: "Invalid recipient" });
      if (to === actor) return res.status(400).json({ error: "You can't challenge yourself" });
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
      return res.status(200).json({ ok: true, id });
    }

    // ── respondChallenge (self; resolve by id) ────────────────────
    if (action === "respondChallenge") {
      const id = clean(body.id, 40);
      const status = body.status === "accepted" || body.status === "declined" ? body.status : "";
      if (!id || !status) return res.status(400).json({ error: "id and status required" });
      const out = await casChild(DB, SOCIAL_KEY, `${actor}/challenges`, (raw) => {
        const arr = asArr(raw);
        const idx = arr.findIndex((c) => c && c.id === id);
        if (idx === -1) return { abort: true, status: 404, body: { error: "Challenge not found" } };
        const next = arr.slice();
        next[idx] = Object.assign({}, arr[idx], { status });
        return { value: next, result: next };
      });
      if (out.abort) return res.status(out.status).json(out.body);
      return res.status(200).json({ ok: true });
    }

    // ── completeChallenge (recipient's challenge + sender's sent) ──
    if (action === "completeChallenge") {
      const id = clean(body.id, 40);
      if (!id) return res.status(400).json({ error: "id required" });
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
      if (out.abort) return res.status(out.status).json(out.body);
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
      return res.status(200).json({ ok: true });
    }

    // ── subscribe / unsubscribe (actor + teacher reverse index) ───
    if (action === "subscribe" || action === "unsubscribe") {
      const teacher = name(body.teacher);
      if (!teacher) return res.status(400).json({ error: "Invalid teacher" });
      if (teacher === actor) return res.status(400).json({ error: "You can't subscribe to yourself" });
      const add = action === "subscribe";
      await casSetMember(DB, actor, "subscribed", teacher, add);
      await casSetMember(DB, teacher, "subscribers", actor, add);
      return res.status(200).json({ ok: true });
    }

    // ── saveVocab (actor writes ONLY their own vocab child) ───────
    // rq-vocab-v1 is {[user]: [entries]}. The client used to PUT the whole
    // object through /api/storage; now it sends just its own array and we
    // write the per-user child, so no one can overwrite another user's vocab.
    // Last-write-wins per actor (the client always sends its full array).
    if (action === "saveVocab") {
      if (!Array.isArray(body.vocab)) return res.status(400).json({ error: "vocab must be an array" });
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
      return res.status(200).json({ ok: true });
    }

    // ── saveFavs (actor writes ONLY their own favourites child) ───
    // rq-favs-v1 is {[user]: [{id,title,level,date}]}. Same per-child fix.
    if (action === "saveFavs") {
      if (!Array.isArray(body.favs)) return res.status(400).json({ error: "favs must be an array" });
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
      return res.status(200).json({ ok: true });
    }

    // ── submitDailyScore (daily-challenge leaderboard) ────────────
    // rq-daily-lb-v1 is {[dateISO]: [entries]}. Mirrors submitWeekly: the
    // name is forced from the token and xp is clamped, so a direct caller
    // can't forge another user's entry or take first with a bogus score.
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
      return res.status(200).json({ ok: true, day, board: out.result });
    }

    // ── postDiscuss (append one post to a story thread) ───────────
    // rq-discuss-v1 is {[storyId]: [{user,text,date}]}. The author is forced
    // from the token (no impersonation) and the 1-post-per-day cap is enforced
    // server-side; newest-first, capped at DISCUSS_CAP.
    if (action === "postDiscuss") {
      const storyId = clean(body.storyId, 60);
      const text = clean(body.text, DISCUSS_TEXT_MAX);
      if (!storyId) return res.status(400).json({ error: "Invalid story" });
      if (text.length < 3) return res.status(400).json({ error: "Post too short" });
      const day = todayISO();
      const out = await casChild(DB, DISCUSS_KEY, storyId, (raw) => {
        const arr = asArr(raw);
        if (arr.some((p) => p && p.user === actor && p.date === day))
          return { abort: true, status: 200, body: { ok: false, err: "Already posted today" } };
        const post = { user: actor, text, date: day };
        const next = [post].concat(arr).slice(0, DISCUSS_CAP);
        return { value: next, result: next };
      });
      if (out.abort) return res.status(out.status).json(out.body);
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: "Unknown action" });
  } catch (e) {
    return res.status(502).json({ error: e.message || "Community write failed" });
  }
}
