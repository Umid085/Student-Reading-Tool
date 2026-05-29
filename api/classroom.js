// Classroom mutations (classes + assignments) — single authenticated router.
//
// WHY THIS EXISTS: class/assignment mutations used to go through the generic
// `/api/storage` proxy as whole-array PUTs from the client. That meant (a) any
// authenticated user could overwrite `rq-classes-v1` / `rq-assignments-v1`
// (the proxy authenticates but does not authorize), and (b) two concurrent
// writers clobbered each other (lost-update race). This endpoint fixes both:
// the actor is taken from the SESSION TOKEN (never the request body),
// ownership is enforced server-side, array writes use an ETag compare-and-swap,
// and assignment completions are written to their own child path so two
// students finishing at once can't drop each other. Direct writes to the two
// keys are blocked in `storage.js`, so this is the only mutation path.
//
// Lives as one routed file (?action=…) to respect Vercel Hobby's 12-function
// cap. Reads stay on the open `/api/storage` GET — class/assignment lists
// aren't secret; only writes need protecting.

import { extractUsername } from "./_session.js";
import { checkRateLimit } from "./_rateLimit.js";

const CLASSES_KEY = "rq-classes-v1";
const ASSIGNMENTS_KEY = "rq-assignments-v1";
const NAME_MAX = 60;
const TEXT_MAX = 500;
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1
const RATE_LIMIT_MAX = 60; // per IP per 15 min
const MAX_PAYLOAD = 400 * 1024; // assignment passage+questions guard

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
function newCode() {
  let s = "";
  for (let i = 0; i < 6; i++) s += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  return s;
}
// Firebase serializes arrays as objects with numeric keys when entries are
// deleted; normalize either shape back to a clean array.
function asArr(v) {
  if (Array.isArray(v)) return v;
  if (v && typeof v === "object") {
    return Object.keys(v).filter((k) => /^\d+$/.test(k)).sort((a, b) => a - b).map((k) => v[k]).filter((x) => x != null);
  }
  return [];
}

// ETag compare-and-swap over a top-level array key. `mutate(arr)` returns one of:
//   { value, result }  → conditionally PUT `value`, return `result`
//   { abort, status, body } → return an HTTP error without writing
//   { noop, result }   → return `result` without writing (idempotent)
// Retries on 412 (a concurrent write moved the ETag). Throws on other failures.
async function casArray(DB, key, mutate, maxAttempts = 5) {
  const url = `${DB}/rq/${key}.json${fbAuth()}`;
  for (let i = 0; i < maxAttempts; i++) {
    const r = await fetch(url, { headers: { "X-Firebase-ETag": "true" } });
    const etag = r.headers.get("etag") || "null_etag";
    const raw = await r.json();
    if (raw && typeof raw === "object" && !Array.isArray(raw) && typeof raw.error === "string") {
      throw new Error("Firebase: " + raw.error);
    }
    const arr = asArr(raw);
    const out = mutate(arr);
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

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const DB = (process.env.FIREBASE_DB_URL || "").replace(/\/$/, "");
  if (!DB) return res.status(503).json({ error: "FIREBASE_DB_URL not set" });

  const ip = ((req.headers["x-forwarded-for"] || req.headers["client-ip"] || "").split(",")[0]).trim();
  const rl = await checkRateLimit(DB, ip, { max: RATE_LIMIT_MAX, bucket: "classroom" });
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
    // ── createClass ───────────────────────────────────────────────
    if (action === "createClass") {
      const name = clean(body.name, NAME_MAX);
      if (!name) return res.status(400).json({ error: "Class name required" });
      const targetLevel = typeof body.targetLevel === "string" ? body.targetLevel.toUpperCase() : "B1";
      let created = null;
      const out = await casArray(DB, CLASSES_KEY, (arr) => {
        let code = newCode();
        for (let t = 0; t < 5 && arr.some((c) => c && c.id === code); t++) code = newCode();
        created = { id: code, name, teacherName: actor, students: [], created: todayISO(), targetLevel, announcement: null };
        return { value: arr.concat([created]), result: created };
      });
      return res.status(200).json({ ok: true, class: out.result, classes: out.value });
    }

    // ── joinClass ─────────────────────────────────────────────────
    if (action === "joinClass") {
      const code = clean(body.code, 12).toUpperCase();
      if (!code) return res.status(400).json({ error: "Class code required" });
      const out = await casArray(DB, CLASSES_KEY, (arr) => {
        const idx = arr.findIndex((c) => c && c.id === code);
        if (idx === -1) return { abort: true, status: 404, body: { error: "Class not found" } };
        const students = Array.isArray(arr[idx].students) ? arr[idx].students : [];
        if (students.indexOf(actor) !== -1) return { noop: true, result: arr }; // already joined
        const next = arr.slice();
        next[idx] = Object.assign({}, arr[idx], { students: students.concat([actor]) });
        return { value: next, result: next };
      });
      if (out.abort) return res.status(out.status).json(out.body);
      return res.status(200).json({ ok: true, classes: out.result || out.value });
    }

    // ── announce / clearAnnounce (class owner only) ───────────────
    if (action === "announce" || action === "clearAnnounce") {
      const classId = clean(body.classId, 12).toUpperCase();
      const text = action === "announce" ? clean(body.text, TEXT_MAX) : "";
      if (!classId) return res.status(400).json({ error: "classId required" });
      if (action === "announce" && !text) return res.status(400).json({ error: "Announcement text required" });
      const out = await casArray(DB, CLASSES_KEY, (arr) => {
        const idx = arr.findIndex((c) => c && c.id === classId);
        if (idx === -1) return { abort: true, status: 404, body: { error: "Class not found" } };
        if (arr[idx].teacherName !== actor) return { abort: true, status: 403, body: { error: "Only the class teacher can do that" } };
        const next = arr.slice();
        const ann = action === "announce" ? { text, date: todayISO(), teacherName: actor } : null;
        next[idx] = Object.assign({}, arr[idx], { announcement: ann });
        return { value: next, result: next };
      });
      if (out.abort) return res.status(out.status).json(out.body);
      return res.status(200).json({ ok: true, classes: out.value });
    }

    // ── createAssignment (must own the target class) ──────────────
    if (action === "createAssignment") {
      const classId = clean(body.classId, 12).toUpperCase();
      if (!classId) return res.status(400).json({ error: "classId required" });
      // Verify ownership against the live classes list.
      const cr = await fetch(`${DB}/rq/${CLASSES_KEY}.json${fbAuth()}`);
      const classes = asArr(await cr.json());
      const cls = classes.find((c) => c && c.id === classId);
      if (!cls) return res.status(404).json({ error: "Class not found" });
      if (cls.teacherName !== actor) return res.status(403).json({ error: "Only the class teacher can create assignments" });

      const type = ["library", "ai_topic", "custom_text"].indexOf(body.type) !== -1 ? body.type : "library";
      const asgn = {
        id: "asgn-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
        classId, teacherName: actor, type,
        dueDate: body.dueDate ? clean(body.dueDate, 20) : null,
        createdAt: new Date().toISOString(), completions: {},
        storyId: body.storyId ? clean(body.storyId, 60) : null,
        topic: clean(body.topic, NAME_MAX) || "Assignment",
        level: typeof body.level === "string" ? body.level.toUpperCase() : "B1",
        passage: typeof body.passage === "string" ? body.passage.slice(0, 20000) : null,
        questions: Array.isArray(body.questions) ? body.questions.slice(0, 20) : null,
      };
      if (JSON.stringify(asgn).length > MAX_PAYLOAD) return res.status(413).json({ error: "Assignment too large" });
      const out = await casArray(DB, ASSIGNMENTS_KEY, (arr) => ({ value: arr.concat([asgn]), result: asgn }));
      return res.status(200).json({ ok: true, assignment: out.result, assignments: out.value });
    }

    // ── completeAssignment (student records their OWN result) ─────
    if (action === "completeAssignment") {
      const assignmentId = clean(body.assignmentId, 60);
      if (!assignmentId) return res.status(400).json({ error: "assignmentId required" });
      const pct = Math.max(0, Math.min(100, Math.round(Number(body.pct) || 0)));
      const xp = Math.max(0, Math.round(Number(body.xp) || 0));
      const timeSecs = Math.max(0, Math.round(Number(body.timeSecs) || 0));
      const ar = await fetch(`${DB}/rq/${ASSIGNMENTS_KEY}.json${fbAuth()}`);
      const arr = asArr(await ar.json());
      const idx = arr.findIndex((a) => a && a.id === assignmentId);
      if (idx === -1) return res.status(404).json({ error: "Assignment not found" });
      const rec = { pct, xp, timeSecs, completedAt: new Date().toISOString() };
      // Per-child write: only THIS student's completion node. Usernames are
      // /^[a-zA-Z0-9_]{2,30}$/ so they're always valid Firebase keys. Two
      // students finishing at once touch different children — no clobber.
      const w = await fetch(`${DB}/rq/${ASSIGNMENTS_KEY}/${idx}/completions/${encodeURIComponent(actor)}.json${fbAuth()}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(rec),
      });
      if (!w.ok) return res.status(502).json({ error: "Completion write failed" });
      const comps = Object.assign({}, arr[idx].completions || {}, { [actor]: rec });
      arr[idx] = Object.assign({}, arr[idx], { completions: comps });
      return res.status(200).json({ ok: true, assignments: arr });
    }

    return res.status(400).json({ error: "Unknown action" });
  } catch (e) {
    return res.status(502).json({ error: e.message || "Classroom write failed" });
  }
}
