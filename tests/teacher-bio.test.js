import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createHmac } from "crypto";

const { handler } = await import("../netlify/functions/teacher-bio.js");

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

describe("netlify/functions/teacher-bio.js", () => {
  const OLD_ENV = process.env;
  let realFetch;

  beforeEach(() => {
    process.env = {
      ...OLD_ENV,
      SESSION_SECRET: "test-secret",
      FIREBASE_DB_URL: "https://test-db.firebaseio.com",
    };
    realFetch = global.fetch;
  });
  afterEach(() => { process.env = OLD_ENV; global.fetch = realFetch; });

  it("OPTIONS → 204", async () => {
    const r = await handler({ httpMethod: "OPTIONS" });
    expect(r.statusCode).toBe(204);
  });

  it("GET without name → 400", async () => {
    const r = await handler({ httpMethod: "GET", queryStringParameters: {} });
    expect(r.statusCode).toBe(400);
  });

  it("GET → 404 when private", async () => {
    global.fetch = makeFetch([{ ok: true, json: { public: false } }]);
    const r = await handler({ httpMethod: "GET", queryStringParameters: { name: "alice" } });
    expect(r.statusCode).toBe(404);
  });

  it("GET → 200 with joined counts when public", async () => {
    global.fetch = makeFetch([
      { ok: true, json: { bio: "hi", displayName: "Alice", public: true, languages: ["en"], subjects: ["TOEFL"] } },
      { ok: true, json: [{ id: "c1", teacherName: "alice", students: ["bob"] }] },
    ]);
    const r = await handler({ httpMethod: "GET", queryStringParameters: { name: "alice" } });
    expect(r.statusCode).toBe(200);
    const body = JSON.parse(r.body);
    expect(body.classCount).toBe(1);
    expect(body.studentCount).toBe(1);
  });

  it("POST → 401 without token", async () => {
    const r = await handler({ httpMethod: "POST", body: JSON.stringify({ bio: "x" }) });
    expect(r.statusCode).toBe(401);
  });

  it("POST → 403 when authed user owns no classes", async () => {
    global.fetch = makeFetch([{ ok: true, json: [{ id: "c1", teacherName: "other" }] }]);
    const r = await handler({
      httpMethod: "POST",
      headers: { authorization: bearer("alice", "test-secret", Date.now() + 60_000) },
      body: JSON.stringify({ bio: "x" }),
    });
    expect(r.statusCode).toBe(403);
  });

  it("POST → 200 upsert when authed teacher owns a class", async () => {
    global.fetch = makeFetch([
      { ok: true, json: [{ id: "c1", teacherName: "alice", students: ["bob"] }] },
      { ok: true, json: {} },
    ]);
    const r = await handler({
      httpMethod: "POST",
      headers: { authorization: bearer("alice", "test-secret", Date.now() + 60_000) },
      body: JSON.stringify({ bio: "hello", public: true }),
    });
    expect(r.statusCode).toBe(200);
    const body = JSON.parse(r.body);
    expect(body.bio).toBe("hello");
    expect(body.public).toBe(true);
  });

  it("POST → 400 on invalid JSON", async () => {
    const r = await handler({
      httpMethod: "POST",
      headers: { authorization: bearer("alice", "test-secret", Date.now() + 60_000) },
      body: "{not-json",
    });
    expect(r.statusCode).toBe(400);
  });
});
