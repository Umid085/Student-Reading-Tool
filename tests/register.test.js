import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createHmac } from "crypto";

global.fetch = vi.fn();

async function loadHandler() {
  vi.resetModules();
  const mod = await import("../netlify/functions/register.js");
  return mod.handler;
}

function makeEvent(overrides = {}) {
  return { httpMethod: "POST", headers: {}, body: null, ...overrides };
}

function verifyToken(token, secret) {
  const lastColon = token.lastIndexOf(":");
  const payload = token.slice(0, lastColon);
  const sig = token.slice(lastColon + 1);
  return sig === createHmac("sha256", secret).update(payload).digest("hex");
}

describe("register.js", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    process.env = { ...OLD_ENV, SESSION_SECRET: "test-secret", FIREBASE_DB_URL: "https://fake.firebaseio.com", RATE_LIMIT_DISABLED: "1" };
    fetch.mockReset();
  });

  afterEach(() => { process.env = OLD_ENV; });

  it("OPTIONS returns 204", async () => {
    const handler = await loadHandler();
    expect((await handler(makeEvent({ httpMethod: "OPTIONS" }))).statusCode).toBe(204);
  });

  it("GET returns 405", async () => {
    const handler = await loadHandler();
    expect((await handler(makeEvent({ httpMethod: "GET" }))).statusCode).toBe(405);
  });

  it("returns 503 when SESSION_SECRET is not set", async () => {
    delete process.env.SESSION_SECRET;
    const handler = await loadHandler();
    const res = await handler(makeEvent({ body: JSON.stringify({ name: "Alice", hash: "abc" }) }));
    expect(res.statusCode).toBe(503);
  });

  it("returns 503 when FIREBASE_DB_URL is not set", async () => {
    delete process.env.FIREBASE_DB_URL;
    const handler = await loadHandler();
    const res = await handler(makeEvent({ body: JSON.stringify({ name: "Alice", hash: "abc" }) }));
    expect(res.statusCode).toBe(503);
  });

  it("returns 400 for invalid JSON", async () => {
    const handler = await loadHandler();
    expect((await handler(makeEvent({ body: "bad" }))).statusCode).toBe(400);
  });

  it("returns 400 when name is missing", async () => {
    const handler = await loadHandler();
    const res = await handler(makeEvent({ body: JSON.stringify({ hash: "abc" }) }));
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error).toMatch(/Missing/);
  });

  it("returns 400 when hash is missing", async () => {
    const handler = await loadHandler();
    const res = await handler(makeEvent({ body: JSON.stringify({ name: "Alice" }) }));
    expect(res.statusCode).toBe(400);
  });

  it("returns 400 for invalid username format", async () => {
    const handler = await loadHandler();
    // Provides fetch for profile read (not needed but mock must exist for non-rejected path)
    fetch.mockResolvedValue({ json: async () => [] });
    const res = await handler(makeEvent({ body: JSON.stringify({ name: "bad name!", hash: "abc" }) }));
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error).toMatch(/Invalid username/);
  });

  it("returns 409 when username is already taken (case-insensitive)", async () => {
    fetch.mockResolvedValue({ json: async () => [{ name: "Alice", games: [], joined: "1/1/2025" }] });
    const handler = await loadHandler();
    const res = await handler(makeEvent({ body: JSON.stringify({ name: "alice", hash: "abc" }) }));
    expect(res.statusCode).toBe(409);
    expect(JSON.parse(res.body).error).toBe("Username taken");
  });

  it("registers a new user and returns a valid signed token", async () => {
    // First fetch: read profiles (empty), Second: PUT profiles, Third: read auth list, Fourth: PUT auth list
    fetch
      .mockResolvedValueOnce({ json: async () => [] })   // GET profiles
      .mockResolvedValueOnce({})                          // PUT profiles
      .mockResolvedValueOnce({ json: async () => [] })   // GET auth list
      .mockResolvedValueOnce({});                         // PUT auth list

    const handler = await loadHandler();
    const res = await handler(makeEvent({ body: JSON.stringify({ name: "Alice", hash: "sha256hash" }) }));
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(typeof body.token).toBe("string");
    expect(verifyToken(body.token, "test-secret")).toBe(true);
  });

  it("writes profile without hash and credentials to auth list", async () => {
    fetch
      .mockResolvedValueOnce({ json: async () => [] })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ json: async () => [] })
      .mockResolvedValueOnce({});

    const handler = await loadHandler();
    await handler(makeEvent({ body: JSON.stringify({ name: "Bob", hash: "myhash" }) }));

    // PUT profiles call (2nd fetch) should not include hash
    const profilePut = JSON.parse(fetch.mock.calls[1][1].body);
    expect(profilePut[0].hash).toBeUndefined();
    expect(profilePut[0].name).toBe("Bob");

    // PUT auth list (4th fetch) should include hash
    const authPut = JSON.parse(fetch.mock.calls[3][1].body);
    expect(authPut[0].name).toBe("Bob");
    expect(authPut[0].hash).toBe("myhash");
  });

  it("returns 429 when rate limit is exceeded", async () => {
    delete process.env.RATE_LIMIT_DISABLED;
    fetch.mockResolvedValueOnce({ json: async () => ({ count: 10, resetAt: Date.now() + 60000 }) });
    const handler = await loadHandler();
    const res = await handler(makeEvent({
      headers: { "x-forwarded-for": "1.2.3.4" },
      body: JSON.stringify({ name: "Alice", hash: "abc" }),
    }));
    expect(res.statusCode).toBe(429);
    expect(JSON.parse(res.body).error).toMatch(/Too many/i);
  });

  it("returns 500 when Firebase fetch throws", async () => {
    fetch.mockRejectedValue(new Error("network error"));
    const handler = await loadHandler();
    const res = await handler(makeEvent({ body: JSON.stringify({ name: "Alice", hash: "abc" }) }));
    expect(res.statusCode).toBe(500);
  });
});
