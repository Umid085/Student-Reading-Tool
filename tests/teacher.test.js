import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createHmac } from "crypto";

const { handler } = await import("../netlify/functions/teacher.js");

function bearer(name, secret, expiresMs) {
  const payload = `${name}:${expiresMs}`;
  const sig = createHmac("sha256", secret).update(payload).digest("hex");
  return `Bearer ${payload}:${sig}`;
}

function makeFetch(seq) {
  let i = 0;
  return vi.fn(async () => {
    const r = seq[i++] || { ok: true, json: null };
    return { ok: r.ok !== false, status: r.status || 200, json: async () => r.json };
  });
}

describe("netlify/functions/teacher.js (router)", () => {
  const OLD_ENV = process.env;
  let realFetch;

  beforeEach(() => {
    process.env = { ...OLD_ENV, SESSION_SECRET: "test-secret", FIREBASE_DB_URL: "https://test-db.firebaseio.com", RATE_LIMIT_DISABLED: "1" };
    realFetch = global.fetch;
  });
  afterEach(() => { process.env = OLD_ENV; global.fetch = realFetch; });

  it("OPTIONS → 204", async () => {
    const r = await handler({ httpMethod: "OPTIONS" });
    expect(r.statusCode).toBe(204);
  });

  it("unknown action → 400", async () => {
    const r = await handler({ httpMethod: "GET", queryStringParameters: { action: "nope" } });
    expect(r.statusCode).toBe(400);
  });

  // ── bio ────────────────────────────────────────────────────────
  it("bio GET without name → 400", async () => {
    const r = await handler({ httpMethod: "GET", queryStringParameters: { action: "bio" } });
    expect(r.statusCode).toBe(400);
  });

  it("bio GET returns public profile + counts", async () => {
    global.fetch = makeFetch([
      { ok: true, json: { displayName: "Ms Smith", bio: "I teach IELTS.", languages: ["en"], subjects: ["IELTS"], public: true } },
      { ok: true, json: [{ id: "c1", teacherName: "alice", students: ["bob", "carl"] }] },
    ]);
    const r = await handler({ httpMethod: "GET", queryStringParameters: { action: "bio", name: "alice" } });
    expect(r.statusCode).toBe(200);
    const body = JSON.parse(r.body);
    expect(body.classCount).toBe(1);
    expect(body.studentCount).toBe(2);
    expect(body.displayName).toBe("Ms Smith");
  });

  it("bio GET → 404 when profile is private (public:false)", async () => {
    global.fetch = makeFetch([{ ok: true, json: { displayName: "Ms Smith", public: false } }]);
    const r = await handler({ httpMethod: "GET", queryStringParameters: { action: "bio", name: "alice" } });
    expect(r.statusCode).toBe(404);
  });

  it("bio POST without auth → 401", async () => {
    const r = await handler({ httpMethod: "POST", body: JSON.stringify({ action: "bio" }), headers: {} });
    expect(r.statusCode).toBe(401);
  });

  it("bio POST → 403 when user owns no classes", async () => {
    global.fetch = makeFetch([{ ok: true, json: [{ id: "c1", teacherName: "other-person", students: [] }] }]);
    const auth = bearer("alice", "test-secret", Date.now() + 60_000);
    const r = await handler({ httpMethod: "POST", body: JSON.stringify({ action: "bio", bio: "hi" }), headers: { authorization: auth } });
    expect(r.statusCode).toBe(403);
  });

  it("bio POST upserts a profile for a class-owning teacher", async () => {
    global.fetch = makeFetch([
      { ok: true, json: [{ id: "c1", teacherName: "alice", students: [] }] }, // class lookup
      { ok: true, json: {} },                                                   // PUT
    ]);
    const auth = bearer("alice", "test-secret", Date.now() + 60_000);
    const r = await handler({ httpMethod: "POST", body: JSON.stringify({ action: "bio", bio: "I teach IELTS.", displayName: "Ms Smith", languages: ["en", "uz"], subjects: ["IELTS"], public: true }), headers: { authorization: auth } });
    expect(r.statusCode).toBe(200);
    expect(JSON.parse(r.body).bio).toBe("I teach IELTS.");
  });

  // ── search ─────────────────────────────────────────────────────
  it("search GET returns matching public profiles", async () => {
    global.fetch = makeFetch([
      { ok: true, json: {
        alice: { displayName: "Ms Smith", bio: "IELTS specialist", public: true, subjects: ["IELTS"], languages: ["en"], updated: "2026-05-22T00:00:00Z" },
        bob:   { displayName: "Mr Doe", bio: "TOEFL coach", public: true, subjects: ["TOEFL"], languages: ["en"], updated: "2026-05-21T00:00:00Z" },
        carl:  { displayName: "Private", bio: "x", public: false, subjects: [], languages: [], updated: "2026-05-22T00:00:00Z" },
      } },
    ]);
    const r = await handler({ httpMethod: "GET", queryStringParameters: { action: "search", q: "ielts" } });
    expect(r.statusCode).toBe(200);
    const body = JSON.parse(r.body);
    expect(body.results.length).toBe(1);
    expect(body.results[0].name).toBe("alice");
  });

  it("search GET excludes private profiles", async () => {
    global.fetch = makeFetch([
      { ok: true, json: { carl: { displayName: "Private", bio: "x", public: false } } },
    ]);
    const r = await handler({ httpMethod: "GET", queryStringParameters: { action: "search", q: "x" } });
    expect(r.statusCode).toBe(200);
    expect(JSON.parse(r.body).results).toHaveLength(0);
  });

  it("search empty query returns all public profiles", async () => {
    global.fetch = makeFetch([
      { ok: true, json: {
        alice: { displayName: "A", public: true, updated: "2026-05-22T00:00:00Z" },
        bob:   { displayName: "B", public: true, updated: "2026-05-21T00:00:00Z" },
      } },
    ]);
    const r = await handler({ httpMethod: "GET", queryStringParameters: { action: "search" } });
    expect(r.statusCode).toBe(200);
    expect(JSON.parse(r.body).results).toHaveLength(2);
  });
});
