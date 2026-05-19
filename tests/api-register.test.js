import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createHmac } from "crypto";
import { runHandler } from "./_vercelMock.js";

global.fetch = vi.fn();

async function loadHandler() {
  vi.resetModules();
  const mod = await import("../api/register.js");
  return mod.default;
}

function verifyToken(token, secret) {
  const lastColon = token.lastIndexOf(":");
  const payload = token.slice(0, lastColon);
  const sig = token.slice(lastColon + 1);
  return sig === createHmac("sha256", secret).update(payload).digest("hex");
}

describe("api/register.js", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    process.env = { ...OLD_ENV, SESSION_SECRET: "test-secret", FIREBASE_DB_URL: "https://fake.firebaseio.com", FIREBASE_DB_SECRET: "test-db-secret", RATE_LIMIT_DISABLED: "1" };
    fetch.mockReset();
  });

  afterEach(() => { process.env = OLD_ENV; });

  it("OPTIONS returns 204", async () => {
    const handler = await loadHandler();
    const r = await runHandler(handler, { method: "OPTIONS" });
    expect(r.statusCode).toBe(204);
  });

  it("GET returns 405", async () => {
    const handler = await loadHandler();
    const r = await runHandler(handler, { method: "GET" });
    expect(r.statusCode).toBe(405);
  });

  it("returns 503 when SESSION_SECRET is not set", async () => {
    delete process.env.SESSION_SECRET;
    delete process.env.FIREBASE_DB_SECRET;
    const handler = await loadHandler();
    const r = await runHandler(handler, { method: "POST", body: { name: "Alice", hash: "abc" } });
    expect(r.statusCode).toBe(503);
  });

  it("returns 503 when FIREBASE_DB_URL is not set", async () => {
    delete process.env.FIREBASE_DB_URL;
    const handler = await loadHandler();
    const r = await runHandler(handler, { method: "POST", body: { name: "Alice", hash: "abc" } });
    expect(r.statusCode).toBe(503);
  });

  it("returns 400 when name is missing", async () => {
    const handler = await loadHandler();
    const r = await runHandler(handler, { method: "POST", body: { hash: "abc" } });
    expect(r.statusCode).toBe(400);
    expect(JSON.parse(r.body).error).toMatch(/Missing/);
  });

  it("returns 400 when hash is missing", async () => {
    const handler = await loadHandler();
    const r = await runHandler(handler, { method: "POST", body: { name: "Alice" } });
    expect(r.statusCode).toBe(400);
  });

  it("returns 400 for invalid username format", async () => {
    const handler = await loadHandler();
    fetch.mockResolvedValue({ json: async () => [] });
    const r = await runHandler(handler, { method: "POST", body: { name: "bad name!", hash: "abc" } });
    expect(r.statusCode).toBe(400);
    expect(JSON.parse(r.body).error).toMatch(/Invalid username/);
  });

  it("returns 409 when username is already taken (case-insensitive)", async () => {
    fetch.mockResolvedValue({ json: async () => [{ name: "Alice", games: [], joined: "1/1/2025" }] });
    const handler = await loadHandler();
    const r = await runHandler(handler, { method: "POST", body: { name: "alice", hash: "abc" } });
    expect(r.statusCode).toBe(409);
    expect(JSON.parse(r.body).error).toBe("Username taken");
  });

  it("registers a new user and returns a valid signed token", async () => {
    fetch
      .mockResolvedValueOnce({ json: async () => [] })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ json: async () => [] })
      .mockResolvedValueOnce({});

    const handler = await loadHandler();
    const r = await runHandler(handler, { method: "POST", body: { name: "Alice", hash: "sha256hash" } });
    expect(r.statusCode).toBe(200);
    const body = JSON.parse(r.body);
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
    await runHandler(handler, { method: "POST", body: { name: "Bob", hash: "myhash" } });

    const profilePut = JSON.parse(fetch.mock.calls[1][1].body);
    expect(profilePut[0].hash).toBeUndefined();
    expect(profilePut[0].name).toBe("Bob");

    const authPut = JSON.parse(fetch.mock.calls[3][1].body);
    expect(authPut[0].name).toBe("Bob");
    // Stored credential is scrypt-hashed, not the raw client input.
    expect(authPut[0].hash).toMatch(/^s\$\d+\$\d+\$\d+\$[^$]+\$[^$]+$/);
    expect(authPut[0].hash).not.toBe("myhash");
  });

  it("returns 429 when rate limit is exceeded", async () => {
    delete process.env.RATE_LIMIT_DISABLED;
    fetch.mockResolvedValueOnce({ json: async () => ({ count: 10, resetAt: Date.now() + 60000 }) });
    const handler = await loadHandler();
    const r = await runHandler(handler, {
      method: "POST",
      headers: { "x-forwarded-for": "1.2.3.4" },
      body: { name: "Alice", hash: "abc" },
    });
    expect(r.statusCode).toBe(429);
    expect(JSON.parse(r.body).error).toMatch(/Too many/i);
  });

  it("returns 500 when Firebase fetch throws", async () => {
    fetch.mockRejectedValue(new Error("network error"));
    const handler = await loadHandler();
    const r = await runHandler(handler, { method: "POST", body: { name: "Alice", hash: "abc" } });
    expect(r.statusCode).toBe(500);
  });
});
