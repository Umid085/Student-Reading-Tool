import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createHmac } from "crypto";

global.fetch = vi.fn();

async function loadHandler() {
  vi.resetModules();
  const mod = await import("../netlify/functions/auth.js");
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

// Helpers for the two-phase lookup:
// auth.js first checks rq-auth-v6, then falls back to rq-users-v6 (migration).
function mockAuthList(list) {
  return { json: async () => list };
}
function mockProfileList(list) {
  return { json: async () => list };
}

describe("auth.js", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    process.env = { ...OLD_ENV, SESSION_SECRET: "test-secret-abc", FIREBASE_DB_URL: "https://fake.firebaseio.com", FIREBASE_DB_SECRET: "test-db-secret", RATE_LIMIT_DISABLED: "1" };
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
    delete process.env.FIREBASE_DB_SECRET;
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

  it("returns 401 when both auth list and profile list are empty", async () => {
    fetch
      .mockResolvedValueOnce(mockAuthList([]))      // rq-auth-v6: empty
      .mockResolvedValueOnce(mockProfileList([]));  // rq-users-v6: empty
    const handler = await loadHandler();
    const res = await handler(makeEvent({ body: JSON.stringify({ name: "Alice", hash: "abc" }) }));
    expect(res.statusCode).toBe(401);
  });

  it("returns 401 when profile list is not an array", async () => {
    fetch
      .mockResolvedValueOnce(mockAuthList(null))    // rq-auth-v6: null
      .mockResolvedValueOnce(mockProfileList(null)); // rq-users-v6: null
    const handler = await loadHandler();
    const res = await handler(makeEvent({ body: JSON.stringify({ name: "Alice", hash: "abc" }) }));
    expect(res.statusCode).toBe(401);
  });

  it("returns 401 when user is not found in either list", async () => {
    fetch
      .mockResolvedValueOnce(mockAuthList([{ name: "Bob", hash: "xyz" }]))
      .mockResolvedValueOnce(mockProfileList([{ name: "Bob", hash: "xyz" }]));
    const handler = await loadHandler();
    const res = await handler(makeEvent({ body: JSON.stringify({ name: "Alice", hash: "abc" }) }));
    expect(res.statusCode).toBe(401);
  });

  it("returns 401 when hash does not match in profile fallback", async () => {
    fetch
      .mockResolvedValueOnce(mockAuthList([]))
      .mockResolvedValueOnce(mockProfileList([{ name: "Alice", hash: "correct-hash" }]));
    const handler = await loadHandler();
    const res = await handler(makeEvent({ body: JSON.stringify({ name: "Alice", hash: "wrong-hash" }) }));
    expect(res.statusCode).toBe(401);
  });

  it("returns 200 and rehashes when auth list still holds a legacy plain hash", async () => {
    // Legacy stored value: plain SHA-256 hex (pre-scrypt). The verify path
    // accepts it via constant-time string compare and triggers a PUT to
    // upgrade the stored credential to scrypt format.
    fetch
      .mockResolvedValueOnce(mockAuthList([{ name: "Alice", hash: "myhash123" }]))
      .mockResolvedValueOnce({}); // PUT rehash
    const handler = await loadHandler();
    const res = await handler(makeEvent({ body: JSON.stringify({ name: "Alice", hash: "myhash123" }) }));
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(typeof body.token).toBe("string");
    expect(verifyToken(body.token, "test-secret-abc")).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(2);
    const rehashWrite = fetch.mock.calls[1];
    expect(rehashWrite[1].method).toBe("PUT");
    const writtenList = JSON.parse(rehashWrite[1].body);
    expect(writtenList[0].name).toBe("Alice");
    expect(writtenList[0].hash).toMatch(/^s\$\d+\$\d+\$\d+\$[^$]+\$[^$]+$/);
  });

  it("returns 200 with valid token via profile fallback and migrates to auth list", async () => {
    fetch
      .mockResolvedValueOnce(mockAuthList([]))                                          // rq-auth-v6: not there yet
      .mockResolvedValueOnce(mockProfileList([{ name: "Alice", hash: "myhash123" }])) // rq-users-v6: found
      .mockResolvedValueOnce({});                                                       // PUT migration write
    const handler = await loadHandler();
    const res = await handler(makeEvent({ body: JSON.stringify({ name: "Alice", hash: "myhash123" }) }));
    expect(res.statusCode).toBe(200);
    expect(verifyToken(JSON.parse(res.body).token, "test-secret-abc")).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(3);
    const migrationWrite = fetch.mock.calls[2];
    expect(migrationWrite[1].method).toBe("PUT");
    const authListWritten = JSON.parse(migrationWrite[1].body);
    expect(authListWritten[0].name).toBe("Alice");
    // Migrated entry is scrypt-formatted, not the raw client hash.
    expect(authListWritten[0].hash).toMatch(/^s\$\d+\$\d+\$\d+\$[^$]+\$[^$]+$/);
    expect(authListWritten[0].hash).not.toBe("myhash123");
  });

  it("accepts legacy btoa hash via profile fallback and stores scrypt-format on migrate", async () => {
    const btoa_hash = "YWJj"; // btoa("abc")
    fetch
      .mockResolvedValueOnce(mockAuthList([]))
      .mockResolvedValueOnce(mockProfileList([{ name: "Alice", hash: btoa_hash }]))
      .mockResolvedValueOnce({});
    const handler = await loadHandler();
    const res = await handler(makeEvent({
      body: JSON.stringify({ name: "Alice", hash: "sha256_of_abc", legacy: btoa_hash }),
    }));
    expect(res.statusCode).toBe(200);
    const authListWritten = JSON.parse(fetch.mock.calls[2][1].body);
    expect(authListWritten[0].name).toBe("Alice");
    expect(authListWritten[0].hash).toMatch(/^s\$\d+\$\d+\$\d+\$[^$]+\$[^$]+$/);
  });

  it("accepts a scrypt-hashed stored value and does NOT rewrite the auth list", async () => {
    // Pre-hash a known input so the test reflects the steady-state flow.
    const { hashPassword } = await import("../netlify/functions/_passwordHash.js");
    const stored = hashPassword("client-sent-hash");
    fetch.mockResolvedValueOnce(mockAuthList([{ name: "Alice", hash: stored }]));
    const handler = await loadHandler();
    const res = await handler(makeEvent({ body: JSON.stringify({ name: "Alice", hash: "client-sent-hash" }) }));
    expect(res.statusCode).toBe(200);
    expect(verifyToken(JSON.parse(res.body).token, "test-secret-abc")).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(1); // no migration write
  });

  it("token payload encodes original username (case-preserved) and a future expiry", async () => {
    fetch.mockResolvedValueOnce(mockAuthList([{ name: "Alice", hash: "myhash123" }]));
    const before = Date.now();
    const handler = await loadHandler();
    const res = await handler(makeEvent({ body: JSON.stringify({ name: "alice", hash: "myhash123" }) }));
    const token = JSON.parse(res.body).token;
    const lastColon = token.lastIndexOf(":");
    const payload = token.slice(0, lastColon);
    const [name, expiresStr] = payload.split(":");
    expect(name).toBe("Alice"); // original casing from DB
    expect(parseInt(expiresStr)).toBeGreaterThan(before + 47 * 60 * 60 * 1000);
  });

  it("checks rq-auth-v6 before rq-users-v6", async () => {
    fetch.mockResolvedValueOnce(mockAuthList([{ name: "Alice", hash: "myhash123" }]));
    const handler = await loadHandler();
    await handler(makeEvent({ body: JSON.stringify({ name: "Alice", hash: "myhash123" }) }));
    expect(fetch.mock.calls[0][0]).toContain("rq-auth-v6");
  });

  it("appends ?auth= to rq-auth-v6 calls when FIREBASE_DB_SECRET is set", async () => {
    fetch.mockResolvedValueOnce(mockAuthList([{ name: "Alice", hash: "myhash123" }]));
    const handler = await loadHandler();
    await handler(makeEvent({ body: JSON.stringify({ name: "Alice", hash: "myhash123" }) }));
    expect(fetch.mock.calls[0][0]).toContain("?auth=test-db-secret");
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
    expect(res.headers["Retry-After"]).toBeDefined();
  });

  it("returns 500 when Firebase fetch throws", async () => {
    fetch.mockRejectedValue(new Error("network error"));
    const handler = await loadHandler();
    const res = await handler(makeEvent({ body: JSON.stringify({ name: "Alice", hash: "abc" }) }));
    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res.body).error).toBe("network error");
  });
});
