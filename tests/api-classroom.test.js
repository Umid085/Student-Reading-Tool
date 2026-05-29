import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createHmac } from "crypto";
import { runHandler } from "./_vercelMock.js";

// Builds a valid session token for `name` (mirrors _session.js token shape).
function makeBearer(name, secret, expiresMs) {
  const payload = `${name}:${expiresMs}`;
  const sig = createHmac("sha256", secret).update(payload).digest("hex");
  return `Bearer ${payload}:${sig}`;
}

// fetch mock: each call consumes the next entry in `seq`. Every response carries
// a headers.get("etag") so casArray's conditional-PUT path works.
function makeFetch(seq) {
  let i = 0;
  return vi.fn(async () => {
    const r = seq[i++] || { ok: true, json: null };
    return {
      ok: r.ok !== false,
      status: r.status || 200,
      headers: { get: () => r.etag || "etag-0" },
      json: async () => r.json,
      text: async () => "",
    };
  });
}

async function loadHandler() {
  vi.resetModules();
  const mod = await import("../api/classroom.js");
  return mod.default;
}

const SECRET = "test-secret";
const auth = (name, expired) => makeBearer(name, SECRET, Date.now() + (expired ? -1 : 60_000));

describe("api/classroom.js", () => {
  const OLD_ENV = process.env;
  let realFetch;

  beforeEach(() => {
    process.env = {
      ...OLD_ENV,
      SESSION_SECRET: SECRET,
      FIREBASE_DB_URL: "https://test-db.firebaseio.com",
      RATE_LIMIT_DISABLED: "1",
    };
    realFetch = global.fetch;
  });
  afterEach(() => { process.env = OLD_ENV; global.fetch = realFetch; });

  // ── guards ──────────────────────────────────────────────────
  it("OPTIONS → 204", async () => {
    const h = await loadHandler();
    const r = await runHandler(h, { method: "OPTIONS" });
    expect(r.statusCode).toBe(204);
  });

  it("405 for GET", async () => {
    const h = await loadHandler();
    const r = await runHandler(h, { method: "GET" });
    expect(r.statusCode).toBe(405);
  });

  it("503 without FIREBASE_DB_URL", async () => {
    delete process.env.FIREBASE_DB_URL;
    const h = await loadHandler();
    const r = await runHandler(h, { method: "POST", body: { action: "createClass" } });
    expect(r.statusCode).toBe(503);
  });

  it("401 without a Bearer token", async () => {
    const h = await loadHandler();
    const r = await runHandler(h, { method: "POST", body: { action: "createClass", name: "X" } });
    expect(r.statusCode).toBe(401);
  });

  it("401 with an expired token", async () => {
    const h = await loadHandler();
    const r = await runHandler(h, { method: "POST", headers: { authorization: auth("alice", true) }, body: { action: "createClass", name: "X" } });
    expect(r.statusCode).toBe(401);
  });

  it("400 for unknown action", async () => {
    const h = await loadHandler();
    const r = await runHandler(h, { method: "POST", headers: { authorization: auth("alice") }, body: { action: "nope" } });
    expect(r.statusCode).toBe(400);
  });

  // ── createClass ─────────────────────────────────────────────
  describe("createClass", () => {
    it("400 without a name", async () => {
      const h = await loadHandler();
      const r = await runHandler(h, { method: "POST", headers: { authorization: auth("ms-smith") }, body: { action: "createClass" } });
      expect(r.statusCode).toBe(400);
    });

    it("mints a code, sets teacherName from the token, returns class + classes", async () => {
      global.fetch = makeFetch([{ ok: true, json: null }, { ok: true, json: {} }]);
      const h = await loadHandler();
      const r = await runHandler(h, { method: "POST", headers: { authorization: auth("ms-smith") }, body: { action: "createClass", name: "  Grade 7  ", targetLevel: "a2" } });
      expect(r.statusCode).toBe(200);
      const b = JSON.parse(r.body);
      expect(b.class.id).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
      expect(b.class.name).toBe("Grade 7"); // trimmed
      expect(b.class.teacherName).toBe("ms-smith"); // from token, not body
      expect(b.class.targetLevel).toBe("A2"); // uppercased
      expect(b.class.students).toEqual([]);
      expect(b.classes).toHaveLength(1);
    });

    it("ignores a teacherName supplied in the body (actor wins)", async () => {
      global.fetch = makeFetch([{ ok: true, json: [] }, { ok: true, json: {} }]);
      const h = await loadHandler();
      const r = await runHandler(h, { method: "POST", headers: { authorization: auth("real-teacher") }, body: { action: "createClass", name: "C", teacherName: "impostor" } });
      expect(JSON.parse(r.body).class.teacherName).toBe("real-teacher");
    });

    it("retries on a 412 (concurrent write) and succeeds", async () => {
      global.fetch = makeFetch([
        { ok: true, json: [] },          // 1st CAS read
        { ok: false, status: 412 },      // 1st PUT → contention
        { ok: true, json: [] },          // re-read
        { ok: true, json: {} },          // 2nd PUT ok
      ]);
      const h = await loadHandler();
      const r = await runHandler(h, { method: "POST", headers: { authorization: auth("t") }, body: { action: "createClass", name: "C" } });
      expect(r.statusCode).toBe(200);
    });
  });

  // ── joinClass ───────────────────────────────────────────────
  describe("joinClass", () => {
    it("400 without a code", async () => {
      const h = await loadHandler();
      const r = await runHandler(h, { method: "POST", headers: { authorization: auth("bob") }, body: { action: "joinClass" } });
      expect(r.statusCode).toBe(400);
    });

    it("404 when the class does not exist", async () => {
      global.fetch = makeFetch([{ ok: true, json: [{ id: "OTHER1", students: [] }] }]);
      const h = await loadHandler();
      const r = await runHandler(h, { method: "POST", headers: { authorization: auth("bob") }, body: { action: "joinClass", code: "ABC123" } });
      expect(r.statusCode).toBe(404);
    });

    it("adds the actor to the class roster", async () => {
      global.fetch = makeFetch([{ ok: true, json: [{ id: "ABC123", students: ["alice"] }] }, { ok: true, json: {} }]);
      const h = await loadHandler();
      const r = await runHandler(h, { method: "POST", headers: { authorization: auth("bob") }, body: { action: "joinClass", code: "abc123" } });
      expect(r.statusCode).toBe(200);
      const cls = JSON.parse(r.body).classes.find((c) => c.id === "ABC123");
      expect(cls.students).toContain("bob");
      expect(cls.students).toContain("alice");
    });

    it("is idempotent — already-joined returns 200 without a write", async () => {
      const fetchMock = makeFetch([{ ok: true, json: [{ id: "ABC123", students: ["bob"] }] }]);
      global.fetch = fetchMock;
      const h = await loadHandler();
      const r = await runHandler(h, { method: "POST", headers: { authorization: auth("bob") }, body: { action: "joinClass", code: "ABC123" } });
      expect(r.statusCode).toBe(200);
      expect(fetchMock).toHaveBeenCalledTimes(1); // read only, no PUT
    });
  });

  // ── announce / clearAnnounce (authorization) ────────────────
  describe("announce", () => {
    it("403 when the actor is not the class teacher", async () => {
      global.fetch = makeFetch([{ ok: true, json: [{ id: "ABC123", teacherName: "ms-smith" }] }]);
      const h = await loadHandler();
      const r = await runHandler(h, { method: "POST", headers: { authorization: auth("random-student") }, body: { action: "announce", classId: "ABC123", text: "hi" } });
      expect(r.statusCode).toBe(403);
    });

    it("404 when the class is missing", async () => {
      global.fetch = makeFetch([{ ok: true, json: [] }]);
      const h = await loadHandler();
      const r = await runHandler(h, { method: "POST", headers: { authorization: auth("ms-smith") }, body: { action: "announce", classId: "ABC123", text: "hi" } });
      expect(r.statusCode).toBe(404);
    });

    it("400 with empty text", async () => {
      const h = await loadHandler();
      const r = await runHandler(h, { method: "POST", headers: { authorization: auth("ms-smith") }, body: { action: "announce", classId: "ABC123", text: "   " } });
      expect(r.statusCode).toBe(400);
    });

    it("owner posts an announcement", async () => {
      global.fetch = makeFetch([{ ok: true, json: [{ id: "ABC123", teacherName: "ms-smith" }] }, { ok: true, json: {} }]);
      const h = await loadHandler();
      const r = await runHandler(h, { method: "POST", headers: { authorization: auth("ms-smith") }, body: { action: "announce", classId: "ABC123", text: "Exam Friday" } });
      expect(r.statusCode).toBe(200);
      const cls = JSON.parse(r.body).classes.find((c) => c.id === "ABC123");
      expect(cls.announcement.text).toBe("Exam Friday");
      expect(cls.announcement.teacherName).toBe("ms-smith");
    });

    it("clearAnnounce nulls the announcement (owner only)", async () => {
      global.fetch = makeFetch([{ ok: true, json: [{ id: "ABC123", teacherName: "ms-smith", announcement: { text: "old" } }] }, { ok: true, json: {} }]);
      const h = await loadHandler();
      const r = await runHandler(h, { method: "POST", headers: { authorization: auth("ms-smith") }, body: { action: "clearAnnounce", classId: "ABC123" } });
      expect(r.statusCode).toBe(200);
      const cls = JSON.parse(r.body).classes.find((c) => c.id === "ABC123");
      expect(cls.announcement).toBeNull();
    });
  });

  // ── createAssignment (must own the class) ───────────────────
  describe("createAssignment", () => {
    it("404 when the class is missing", async () => {
      global.fetch = makeFetch([{ ok: true, json: [] }]);
      const h = await loadHandler();
      const r = await runHandler(h, { method: "POST", headers: { authorization: auth("ms-smith") }, body: { action: "createAssignment", classId: "ABC123" } });
      expect(r.statusCode).toBe(404);
    });

    it("403 when the actor does not own the class", async () => {
      global.fetch = makeFetch([{ ok: true, json: [{ id: "ABC123", teacherName: "ms-smith" }] }]);
      const h = await loadHandler();
      const r = await runHandler(h, { method: "POST", headers: { authorization: auth("other-teacher") }, body: { action: "createAssignment", classId: "ABC123", type: "library" } });
      expect(r.statusCode).toBe(403);
    });

    it("owner creates an assignment with server-set id/teacherName/completions", async () => {
      global.fetch = makeFetch([
        { ok: true, json: [{ id: "ABC123", teacherName: "ms-smith" }] }, // ownership read
        { ok: true, json: [] },  // CAS read
        { ok: true, json: {} },  // CAS PUT
      ]);
      const h = await loadHandler();
      const r = await runHandler(h, { method: "POST", headers: { authorization: auth("ms-smith") }, body: { action: "createAssignment", classId: "ABC123", type: "ai_topic", topic: "Volcanoes", level: "b1" } });
      expect(r.statusCode).toBe(200);
      const a = JSON.parse(r.body).assignment;
      expect(a.id).toMatch(/^asgn-/);
      expect(a.teacherName).toBe("ms-smith");
      expect(a.classId).toBe("ABC123");
      expect(a.type).toBe("ai_topic");
      expect(a.level).toBe("B1");
      expect(a.completions).toEqual({});
    });
  });

  // ── completeAssignment (per-child write) ────────────────────
  describe("completeAssignment", () => {
    it("400 without an assignmentId", async () => {
      const h = await loadHandler();
      const r = await runHandler(h, { method: "POST", headers: { authorization: auth("bob") }, body: { action: "completeAssignment" } });
      expect(r.statusCode).toBe(400);
    });

    it("404 when the assignment is missing", async () => {
      global.fetch = makeFetch([{ ok: true, json: [] }]);
      const h = await loadHandler();
      const r = await runHandler(h, { method: "POST", headers: { authorization: auth("bob") }, body: { action: "completeAssignment", assignmentId: "asgn-x" } });
      expect(r.statusCode).toBe(404);
    });

    it("writes only the actor's completion child and clamps pct/xp", async () => {
      const fetchMock = makeFetch([
        { ok: true, json: [{ id: "asgn-1", completions: { alice: { pct: 90 } } }] }, // list read
        { ok: true, json: {} }, // per-child PUT
      ]);
      global.fetch = fetchMock;
      const h = await loadHandler();
      const r = await runHandler(h, { method: "POST", headers: { authorization: auth("bob") }, body: { action: "completeAssignment", assignmentId: "asgn-1", pct: 150, xp: -5, timeSecs: 42 } });
      expect(r.statusCode).toBe(200);
      // Per-child PUT path targets THIS actor's node, not the whole array.
      const putUrl = fetchMock.mock.calls[1][0];
      expect(putUrl).toContain("/completions/bob.json");
      const rec = JSON.parse(r.body).assignments[0].completions.bob;
      expect(rec.pct).toBe(100);   // clamped to 100
      expect(rec.xp).toBe(0);      // clamped to ≥0
      expect(rec.timeSecs).toBe(42);
      // alice's prior completion is preserved
      expect(JSON.parse(r.body).assignments[0].completions.alice).toBeDefined();
    });

    it("502 when the completion write fails", async () => {
      global.fetch = makeFetch([
        { ok: true, json: [{ id: "asgn-1", completions: {} }] },
        { ok: false, status: 500 },
      ]);
      const h = await loadHandler();
      const r = await runHandler(h, { method: "POST", headers: { authorization: auth("bob") }, body: { action: "completeAssignment", assignmentId: "asgn-1", pct: 80, xp: 100 } });
      expect(r.statusCode).toBe(502);
    });
  });
});
