import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createHmac } from "crypto";

global.fetch = vi.fn();

async function loadHandler() {
  vi.resetModules();
  const mod = await import("../netlify/functions/auth.js");
  return mod.handler;
}

function makeEvent(overrides = {}) {
  return {
    httpMethod: "POST",
    headers: {},
    body: null,
    ...overrides,
  };
}

function verifyToken(token, secret) {
  const lastColon = token.lastIndexOf(":");
  const payload = token.slice(0, lastColon);
  const sig = token.slice(lastColon + 1);
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  return sig === expected;
}

describe("auth.js", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    process.env = {
      ...OLD_ENV,
      SESSION_SECRET: "test-secret-abc",
      FIREBASE_DB_URL: "https://fake.firebaseio.com",
    };
    fetch.mockReset();
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it("OPTIONS returns 204", async () => {
    const handler = await loadHandler();
    const res = await handler(makeEvent({ httpMethod: "OPTIONS" }));
    expect(res.statusCode).toBe(204);
  });

  it("GET returns 405", async () => {
    const handler = await loadHandler();
    const res = await handler(makeEvent({ httpMethod: "GET" }));
    expect(res.statusCode).toBe(405);
  });

  it("returns 503 when SESSION_SECRET is not set", async () => {
    delete process.env.SESSION_SECRET;
    const handler = await loadHandler();
    const res = await handler(makeEvent({ body: JSON.stringify({ name: "Alice", hash: "abc" }) }));
    expect(res.statusCode).toBe(503);
    expect(JSON.parse(res.body).error).toMatch(/not configured/i);
  });

  it("returns 503 when FIREBASE_DB_URL is not set", async () => {
    delete process.env.FIREBASE_DB_URL;
    const handler = await loadHandler();
    const res = await handler(makeEvent({ body: JSON.stringify({ name: "Alice", hash: "abc" }) }));
    expect(res.statusCode).toBe(503);
    expect(JSON.parse(res.body).error).toMatch(/not configured/i);
  });

  it("returns 400 for invalid JSON body", async () => {
    const handler = await loadHandler();
    const res = await handler(makeEvent({ body: "not-json" }));
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error).toMatch(/Invalid JSON/i);
  });

  it("returns 400 when name is missing", async () => {
    const handler = await loadHandler();
    const res = await handler(makeEvent({ body: JSON.stringify({ hash: "abc" }) }));
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error).toMatch(/Missing credentials/i);
  });

  it("returns 400 when hash is missing", async () => {
    const handler = await loadHandler();
    const res = await handler(makeEvent({ body: JSON.stringify({ name: "Alice" }) }));
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error).toMatch(/Missing credentials/i);
  });

  it("returns 401 when Firebase users is not an array", async () => {
    fetch.mockResolvedValue({ json: async () => null });
    const handler = await loadHandler();
    const res = await handler(makeEvent({ body: JSON.stringify({ name: "Alice", hash: "abc" }) }));
    expect(res.statusCode).toBe(401);
  });

  it("returns 401 when user is not found", async () => {
    fetch.mockResolvedValue({ json: async () => [{ name: "Bob", hash: "xyz" }] });
    const handler = await loadHandler();
    const res = await handler(makeEvent({ body: JSON.stringify({ name: "Alice", hash: "abc" }) }));
    expect(res.statusCode).toBe(401);
  });

  it("returns 401 when hash does not match", async () => {
    fetch.mockResolvedValue({ json: async () => [{ name: "Alice", hash: "correct-hash" }] });
    const handler = await loadHandler();
    const res = await handler(makeEvent({ body: JSON.stringify({ name: "Alice", hash: "wrong-hash" }) }));
    expect(res.statusCode).toBe(401);
  });

  it("returns 401 for case-insensitive name match with wrong hash", async () => {
    fetch.mockResolvedValue({ json: async () => [{ name: "Alice", hash: "correct" }] });
    const handler = await loadHandler();
    const res = await handler(makeEvent({ body: JSON.stringify({ name: "ALICE", hash: "wrong" }) }));
    expect(res.statusCode).toBe(401);
  });

  it("returns 200 with a valid signed token on correct credentials", async () => {
    const users = [{ name: "Alice", hash: "myhash123" }];
    fetch.mockResolvedValue({ json: async () => users });
    const handler = await loadHandler();
    const res = await handler(makeEvent({ body: JSON.stringify({ name: "Alice", hash: "myhash123" }) }));
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(typeof body.token).toBe("string");
    expect(verifyToken(body.token, "test-secret-abc")).toBe(true);
  });

  it("token payload encodes the original username (case-preserved) and a future expiry", async () => {
    const users = [{ name: "Alice", hash: "myhash123" }];
    fetch.mockResolvedValue({ json: async () => users });
    const before = Date.now();
    const handler = await loadHandler();
    const res = await handler(makeEvent({ body: JSON.stringify({ name: "alice", hash: "myhash123" }) }));
    const token = JSON.parse(res.body).token;
    const lastColon = token.lastIndexOf(":");
    const payload = token.slice(0, lastColon);
    const [name, expiresStr] = payload.split(":");
    expect(name).toBe("Alice"); // original casing from DB
    const expires = parseInt(expiresStr);
    expect(expires).toBeGreaterThan(before + 47 * 60 * 60 * 1000); // at least 47h from now
  });

  it("reads users from the correct Firebase path", async () => {
    fetch.mockResolvedValue({ json: async () => [] });
    const handler = await loadHandler();
    await handler(makeEvent({ body: JSON.stringify({ name: "Alice", hash: "abc" }) }));
    expect(fetch).toHaveBeenCalledWith(
      "https://fake.firebaseio.com/rq/rq-users-v6.json"
    );
  });

  it("returns 500 when Firebase fetch throws", async () => {
    fetch.mockRejectedValue(new Error("network error"));
    const handler = await loadHandler();
    const res = await handler(makeEvent({ body: JSON.stringify({ name: "Alice", hash: "abc" }) }));
    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res.body).error).toBe("network error");
  });
});
