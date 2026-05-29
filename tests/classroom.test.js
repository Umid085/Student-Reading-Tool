import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createHmac } from "crypto";

const { handler } = await import("../netlify/functions/classroom.js");

function makeBearer(name, secret, expiresMs) {
  const payload = `${name}:${expiresMs}`;
  const sig = createHmac("sha256", secret).update(payload).digest("hex");
  return `Bearer ${payload}:${sig}`;
}

function makeFetch(seq) {
  let i = 0;
  return vi.fn(async () => {
    const r = seq[i++] || { ok: true, json: null };
    return {
      ok: r.ok !== false,
      status: r.status || 200,
      headers: { get: () => r.etag || "etag-0" },
      json: async () => r.json,
    };
  });
}

const SECRET = "test-secret";
const auth = (name) => makeBearer(name, SECRET, Date.now() + 60_000);

// Builds a Netlify event. action goes via the body (the client uses a query
// param; the handler accepts either — body is simplest to drive in tests).
function evt(action, body, headers) {
  return {
    httpMethod: "POST",
    headers: headers || {},
    queryStringParameters: {},
    body: JSON.stringify({ action, ...(body || {}) }),
  };
}

describe("netlify/functions/classroom.js", () => {
  const OLD_ENV = process.env;
  let realFetch;

  beforeEach(() => {
    process.env = { ...OLD_ENV, SESSION_SECRET: SECRET, FIREBASE_DB_URL: "https://test-db.firebaseio.com", RATE_LIMIT_DISABLED: "1" };
    realFetch = global.fetch;
  });
  afterEach(() => { process.env = OLD_ENV; global.fetch = realFetch; });

  it("OPTIONS → 204", async () => {
    expect((await handler({ httpMethod: "OPTIONS" })).statusCode).toBe(204);
  });

  it("405 for GET", async () => {
    expect((await handler({ httpMethod: "GET" })).statusCode).toBe(405);
  });

  it("401 without a Bearer token", async () => {
    const r = await handler(evt("createClass", { name: "X" }));
    expect(r.statusCode).toBe(401);
  });

  it("400 on invalid JSON body", async () => {
    const r = await handler({ httpMethod: "POST", headers: { authorization: auth("a") }, body: "{not json" });
    expect(r.statusCode).toBe(400);
  });

  it("400 for unknown action", async () => {
    const r = await handler(evt("nope", {}, { authorization: auth("a") }));
    expect(r.statusCode).toBe(400);
  });

  it("createClass sets teacherName from the token and returns the class", async () => {
    global.fetch = makeFetch([{ ok: true, json: [] }, { ok: true, json: {} }]);
    const r = await handler(evt("createClass", { name: "Grade 7", teacherName: "impostor" }, { authorization: auth("ms-smith") }));
    expect(r.statusCode).toBe(200);
    expect(JSON.parse(r.body).class.teacherName).toBe("ms-smith");
  });

  it("joinClass 404 when the class is missing", async () => {
    global.fetch = makeFetch([{ ok: true, json: [] }]);
    const r = await handler(evt("joinClass", { code: "ABC123" }, { authorization: auth("bob") }));
    expect(r.statusCode).toBe(404);
  });

  it("joinClass adds the actor to the roster", async () => {
    global.fetch = makeFetch([{ ok: true, json: [{ id: "ABC123", students: [] }] }, { ok: true, json: {} }]);
    const r = await handler(evt("joinClass", { code: "ABC123" }, { authorization: auth("bob") }));
    expect(r.statusCode).toBe(200);
    expect(JSON.parse(r.body).classes[0].students).toContain("bob");
  });

  it("announce 403 when the actor is not the class teacher", async () => {
    global.fetch = makeFetch([{ ok: true, json: [{ id: "ABC123", teacherName: "ms-smith" }] }]);
    const r = await handler(evt("announce", { classId: "ABC123", text: "hi" }, { authorization: auth("student") }));
    expect(r.statusCode).toBe(403);
  });

  it("createAssignment 403 when the actor does not own the class", async () => {
    global.fetch = makeFetch([{ ok: true, json: [{ id: "ABC123", teacherName: "ms-smith" }] }]);
    const r = await handler(evt("createAssignment", { classId: "ABC123", type: "library" }, { authorization: auth("other") }));
    expect(r.statusCode).toBe(403);
  });

  it("completeAssignment writes the actor's own completion child", async () => {
    const fetchMock = makeFetch([{ ok: true, json: [{ id: "asgn-1", completions: {} }] }, { ok: true, json: {} }]);
    global.fetch = fetchMock;
    const r = await handler(evt("completeAssignment", { assignmentId: "asgn-1", pct: 150, xp: 50, timeSecs: 30 }, { authorization: auth("bob") }));
    expect(r.statusCode).toBe(200);
    expect(fetchMock.mock.calls[1][0]).toContain("/completions/bob.json");
    expect(JSON.parse(r.body).assignments[0].completions.bob.pct).toBe(100); // clamped
  });
});
