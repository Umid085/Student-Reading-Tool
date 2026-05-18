import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createHmac } from "crypto";
import { runHandler } from "./_vercelMock.js";

global.fetch = vi.fn();

async function loadHandler() {
  vi.resetModules();
  const mod = await import("../api/auth.js");
  return mod.default;
}

function verifyToken(token, secret) {
  const lastColon = token.lastIndexOf(":");
  const payload = token.slice(0, lastColon);
  const sig = token.slice(lastColon + 1);
  return sig === createHmac("sha256", secret).update(payload).digest("hex");
}

function mockAuthList(list) { return { json: async () => list }; }
function mockProfileList(list) { return { json: async () => list }; }

describe("api/auth.js", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    process.env = { ...OLD_ENV, SESSION_SECRET: "test-secret-abc", FIREBASE_DB_URL: "https://fake.firebaseio.com", FIREBASE_DB_SECRET: "test-db-secret", RATE_LIMIT_DISABLED: "1" };
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
    delete process.env.SESSIONS_SECRET;
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
    expect(JSON.parse(r.body).error).toMatch(/Missing credentials/i);
  });

  it("returns 400 when hash is missing", async () => {
    const handler = await loadHandler();
    const r = await runHandler(handler, { method: "POST", body: { name: "Alice" } });
    expect(r.statusCode).toBe(400);
  });

  it("returns 401 when both auth list and profile list are empty", async () => {
    fetch
      .mockResolvedValueOnce(mockAuthList([]))
      .mockResolvedValueOnce(mockProfileList([]));
    const handler = await loadHandler();
    const r = await runHandler(handler, { method: "POST", body: { name: "Alice", hash: "abc" } });
    expect(r.statusCode).toBe(401);
  });

  it("returns 200 with valid token when user found in auth list (fast path)", async () => {
    fetch.mockResolvedValueOnce(mockAuthList([{ name: "Alice", hash: "myhash123" }]));
    const handler = await loadHandler();
    const r = await runHandler(handler, { method: "POST", body: { name: "Alice", hash: "myhash123" } });
    expect(r.statusCode).toBe(200);
    const body = JSON.parse(r.body);
    expect(typeof body.token).toBe("string");
    expect(verifyToken(body.token, "test-secret-abc")).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("returns 200 with valid token via profile fallback and migrates to auth list", async () => {
    fetch
      .mockResolvedValueOnce(mockAuthList([]))
      .mockResolvedValueOnce(mockProfileList([{ name: "Alice", hash: "myhash123" }]))
      .mockResolvedValueOnce({});
    const handler = await loadHandler();
    const r = await runHandler(handler, { method: "POST", body: { name: "Alice", hash: "myhash123" } });
    expect(r.statusCode).toBe(200);
    expect(verifyToken(JSON.parse(r.body).token, "test-secret-abc")).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(3);
    const migrationWrite = fetch.mock.calls[2];
    expect(migrationWrite[1].method).toBe("PUT");
  });

  it("accepts legacy btoa hash via profile fallback and upgrades to SHA-256", async () => {
    const btoa_hash = "YWJj";
    fetch
      .mockResolvedValueOnce(mockAuthList([]))
      .mockResolvedValueOnce(mockProfileList([{ name: "Alice", hash: btoa_hash }]))
      .mockResolvedValueOnce({});
    const handler = await loadHandler();
    const r = await runHandler(handler, {
      method: "POST",
      body: { name: "Alice", hash: "sha256_of_abc", legacy: btoa_hash },
    });
    expect(r.statusCode).toBe(200);
    const authListWritten = JSON.parse(fetch.mock.calls[2][1].body);
    expect(authListWritten[0].hash).toBe("sha256_of_abc");
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
