import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createHmac } from "crypto";

const { handler } = await import("../netlify/functions/community.js");

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
function putUrls(fm) {
  return fm.mock.calls.filter((c) => c[1] && c[1].method === "PUT").map((c) => c[0]);
}

const SECRET = "test-secret";
const auth = (name) => makeBearer(name, SECRET, Date.now() + 60_000);
function evt(action, body, name = "bob") {
  return {
    httpMethod: "POST",
    headers: name ? { authorization: auth(name) } : {},
    queryStringParameters: { action },
    body: JSON.stringify(body || {}),
  };
}

describe("netlify/functions/community.js", () => {
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
  it("401 without a token", async () => {
    const r = await handler({ httpMethod: "POST", headers: {}, queryStringParameters: { action: "submitWeekly" }, body: "{}" });
    expect(r.statusCode).toBe(401);
  });
  it("400 on invalid JSON body", async () => {
    const r = await handler({ httpMethod: "POST", headers: { authorization: auth("bob") }, queryStringParameters: { action: "submitWeekly" }, body: "{nope" });
    expect(r.statusCode).toBe(400);
  });
  it("400 for unknown action", async () => {
    expect((await handler(evt("nope", {}))).statusCode).toBe(400);
  });

  it("submitScore forces name from token and writes the level child", async () => {
    const fm = makeFetch([{ json: [] }, { json: {} }]);
    global.fetch = fm;
    const r = await handler(evt("submitScore", { level: "B1", name: "impostor", xp: 40, pct: 90 }));
    expect(r.statusCode).toBe(200);
    expect(putUrls(fm)[0]).toContain("/rq-boards-v6/B1.json");
    const board = JSON.parse(r.body).board;
    expect(board[0].name).toBe("bob");
  });

  it("submitWeekly accumulates onto the actor's week entry", async () => {
    global.fetch = makeFetch([{ json: [{ name: "bob", xp: 100, games: 1 }] }, { json: {} }]);
    const r = await handler(evt("submitWeekly", { xp: 25 }));
    expect(JSON.parse(r.body).week.find((e) => e.name === "bob").xp).toBe(125);
  });

  it("sendRequest 400 on self; appends otherwise", async () => {
    expect((await handler(evt("sendRequest", { to: "bob" }))).statusCode).toBe(400);
    const fm = makeFetch([{ json: [] }, { json: [] }, { json: {} }]);
    global.fetch = fm;
    const r = await handler(evt("sendRequest", { to: "alice" }));
    expect(JSON.parse(r.body).ok).toBe(true);
    expect(putUrls(fm)[0]).toContain("/rq-social-v6/alice/requests.json");
  });

  it("likeProfile double-like rejected without increment", async () => {
    const fm = makeFetch([{ json: { "bob->alice": true } }]);
    global.fetch = fm;
    const r = await handler(evt("likeProfile", { target: "alice" }));
    expect(JSON.parse(r.body)).toMatchObject({ ok: false, err: "Already liked" });
    expect(putUrls(fm)).toHaveLength(0);
  });

  it("completeChallenge 404 when the id is missing", async () => {
    global.fetch = makeFetch([{ json: [] }]);
    const r = await handler(evt("completeChallenge", { id: "nope", result: {} }));
    expect(r.statusCode).toBe(404);
  });

  it("subscribe writes both the actor and teacher reverse index", async () => {
    const fm = makeFetch([{ json: [] }, { json: {} }, { json: [] }, { json: {} }]);
    global.fetch = fm;
    const r = await handler(evt("subscribe", { teacher: "ms_smith" }));
    expect(r.statusCode).toBe(200);
    const urls = putUrls(fm);
    expect(urls[0]).toContain("/rq-social-v6/bob/subscribed.json");
    expect(urls[1]).toContain("/rq-social-v6/ms_smith/subscribers.json");
  });
});
