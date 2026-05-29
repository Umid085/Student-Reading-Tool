// Classroom mutations (classes + assignments) — Netlify shape. Mirrors api/classroom.js.
//
// Actor identity comes ONLY from the verified session token. Ownership is
// enforced server-side; array writes use an ETag compare-and-swap and
// assignment completions are written per-child so concurrent students can't
// clobber each other. Direct writes to rq-classes-v1 / rq-assignments-v1 are
// blocked in storage.js, so this is the only mutation path.

import { extractUsername } from "./_session.js";
import { checkRateLimit } from "./_rateLimit.js";

const CLASSES_KEY = "rq-classes-v1";
const ASSIGNMENTS_KEY = "rq-assignments-v1";
const NAME_MAX = 60;
const TEXT_MAX = 500;
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const RATE_LIMIT_MAX = 60;
const MAX_PAYLOAD = 400 * 1024;

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
function newCode() {
  let s = "";
  for (let i = 0; i < 6; i++) s += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  return s;
}
function asArr(v) {
  if (Array.isArray(v)) return v;
  if (v && typeof v === "object") {
    return Object.keys(v).filter((k) => /^\d+$/.test(k)).sort((a, b) => a - b).map((k) => v[k]).filter((x) => x != null);
  }
  return [];
}

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
  }
  throw new Error("Write contention — please retry");
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
  const rl = await checkRateLimit(DB, ip, { max: RATE_LIMIT_MAX, bucket: "classroom" });
  if (rl.limited) return { statusCode: 429, headers: { ...CORS, "Retry-After": String(rl.retryAfter) }, body: JSON.stringify({ error: "Too many requests. Slow down." }) };

  const actor = extractUsername(event);
  if (!actor) return json(401, { error: "Sign in required" });

  let body = {};
  try { body = JSON.parse(event.body || "{}"); } catch (_) { return json(400, { error: "Invalid JSON body" }); }
  const action = ((event.queryStringParameters || {}).action) || body.action || "";

  try {
    if (action === "createClass") {
      const name = clean(body.name, NAME_MAX);
      if (!name) return json(400, { error: "Class name required" });
      const targetLevel = typeof body.targetLevel === "string" ? body.targetLevel.toUpperCase() : "B1";
      const out = await casArray(DB, CLASSES_KEY, (arr) => {
        let code = newCode();
        for (let t = 0; t < 5 && arr.some((c) => c && c.id === code); t++) code = newCode();
        const created = { id: code, name, teacherName: actor, students: [], created: todayISO(), targetLevel, announcement: null };
        return { value: arr.concat([created]), result: created };
      });
      return json(200, { ok: true, class: out.result, classes: out.value });
    }

    if (action === "joinClass") {
      const code = clean(body.code, 12).toUpperCase();
      if (!code) return json(400, { error: "Class code required" });
      const out = await casArray(DB, CLASSES_KEY, (arr) => {
        const idx = arr.findIndex((c) => c && c.id === code);
        if (idx === -1) return { abort: true, status: 404, body: { error: "Class not found" } };
        const students = Array.isArray(arr[idx].students) ? arr[idx].students : [];
        if (students.indexOf(actor) !== -1) return { noop: true, result: arr };
        const next = arr.slice();
        next[idx] = Object.assign({}, arr[idx], { students: students.concat([actor]) });
        return { value: next, result: next };
      });
      if (out.abort) return json(out.status, out.body);
      return json(200, { ok: true, classes: out.result || out.value });
    }

    if (action === "announce" || action === "clearAnnounce") {
      const classId = clean(body.classId, 12).toUpperCase();
      const text = action === "announce" ? clean(body.text, TEXT_MAX) : "";
      if (!classId) return json(400, { error: "classId required" });
      if (action === "announce" && !text) return json(400, { error: "Announcement text required" });
      const out = await casArray(DB, CLASSES_KEY, (arr) => {
        const idx = arr.findIndex((c) => c && c.id === classId);
        if (idx === -1) return { abort: true, status: 404, body: { error: "Class not found" } };
        if (arr[idx].teacherName !== actor) return { abort: true, status: 403, body: { error: "Only the class teacher can do that" } };
        const next = arr.slice();
        const ann = action === "announce" ? { text, date: todayISO(), teacherName: actor } : null;
        next[idx] = Object.assign({}, arr[idx], { announcement: ann });
        return { value: next, result: next };
      });
      if (out.abort) return json(out.status, out.body);
      return json(200, { ok: true, classes: out.value });
    }

    if (action === "createAssignment") {
      const classId = clean(body.classId, 12).toUpperCase();
      if (!classId) return json(400, { error: "classId required" });
      const cr = await fetch(`${DB}/rq/${CLASSES_KEY}.json${fbAuth()}`);
      const classes = asArr(await cr.json());
      const cls = classes.find((c) => c && c.id === classId);
      if (!cls) return json(404, { error: "Class not found" });
      if (cls.teacherName !== actor) return json(403, { error: "Only the class teacher can create assignments" });

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
      if (JSON.stringify(asgn).length > MAX_PAYLOAD) return json(413, { error: "Assignment too large" });
      const out = await casArray(DB, ASSIGNMENTS_KEY, (arr) => ({ value: arr.concat([asgn]), result: asgn }));
      return json(200, { ok: true, assignment: out.result, assignments: out.value });
    }

    if (action === "completeAssignment") {
      const assignmentId = clean(body.assignmentId, 60);
      if (!assignmentId) return json(400, { error: "assignmentId required" });
      const pct = Math.max(0, Math.min(100, Math.round(Number(body.pct) || 0)));
      const xp = Math.max(0, Math.round(Number(body.xp) || 0));
      const timeSecs = Math.max(0, Math.round(Number(body.timeSecs) || 0));
      const ar = await fetch(`${DB}/rq/${ASSIGNMENTS_KEY}.json${fbAuth()}`);
      const arr = asArr(await ar.json());
      const idx = arr.findIndex((a) => a && a.id === assignmentId);
      if (idx === -1) return json(404, { error: "Assignment not found" });
      const rec = { pct, xp, timeSecs, completedAt: new Date().toISOString() };
      const w = await fetch(`${DB}/rq/${ASSIGNMENTS_KEY}/${idx}/completions/${encodeURIComponent(actor)}.json${fbAuth()}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(rec),
      });
      if (!w.ok) return json(502, { error: "Completion write failed" });
      const comps = Object.assign({}, arr[idx].completions || {}, { [actor]: rec });
      arr[idx] = Object.assign({}, arr[idx], { completions: comps });
      return json(200, { ok: true, assignments: arr });
    }

    return json(400, { error: "Unknown action" });
  } catch (e) {
    return json(502, { error: e.message || "Classroom write failed" });
  }
};
