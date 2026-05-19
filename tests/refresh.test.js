import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createHmac } from "crypto";

global.fetch = vi.fn();

async function loadHandler() {
  vi.resetModules();
  const mod = await import("../netlify/functions/refresh.js");
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

// Mirror of issueRefreshToken from _refreshToken.js — kept inline so the
// tests don't import the SUT's private secret-derivation logic.
function issueRefresh(name, secret, expiresAt) {
  const exp = expiresAt || (Date.now() + 30 * 24 * 60 * 60 * 1000);
  const payload = `${name}:${exp}`;
  const sig = createHmac("sha256", String(secret) + "/refresh-v1").update(payload).digest("hex");
  return `r:${payload}:${sig}`;
}

describe("refresh.js", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    process.env = { ...OLD_ENV, SESSION_SECRET: "test-secret-xyz", FIREBASE_DB_URL: "https://fake.firebaseio.com", RATE_LIMIT_DISABLED: "1" };
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

  it("returns 503 when SESSION_SECRET is missing", async () => {
    delete process.env.SESSION_SECRET;
    delete process.env.FIREBASE_DB_SECRET;
    const handler = await loadHandler();
    const res = await handler(makeEvent({ body: JSON.stringify({ name: "Alice", refreshToken: "r:Alice:9999999999999:x" }) }));
    expect(res.statusCode).toBe(503);
  });

  it("returns 400 when name or refreshToken is missing", async () => {
    const handler = await loadHandler();
    const r1 = await handler(makeEvent({ body: JSON.stringify({ name: "Alice" }) }));
    expect(r1.statusCode).toBe(400);
    const r2 = await handler(makeEvent({ body: JSON.stringify({ refreshToken: "r:Alice:9999999999999:x" }) }));
    expect(r2.statusCode).toBe(400);
  });

  it("returns 400 for invalid JSON", async () => {
    const handler = await loadHandler();
    const res = await handler(makeEvent({ body: "not-json" }));
    expect(res.statusCode).toBe(400);
  });

  it("returns 401 for a malformed refresh token", async () => {
    const handler = await loadHandler();
    const res = await handler(makeEvent({ body: JSON.stringify({ name: "Alice", refreshToken: "not-a-token" }) }));
    expect(res.statusCode).toBe(401);
  });

  it("returns 401 for a token signed with a different secret", async () => {
    const handler = await loadHandler();
    const wrong = issueRefresh("Alice", "different-secret");
    const res = await handler(makeEvent({ body: JSON.stringify({ name: "Alice", refreshToken: wrong }) }));
    expect(res.statusCode).toBe(401);
  });

  it("returns 401 when token name doesn't match request name", async () => {
    const handler = await loadHandler();
    const token = issueRefresh("Alice", "test-secret-xyz");
    const res = await handler(makeEvent({ body: JSON.stringify({ name: "Bob", refreshToken: token }) }));
    expect(res.statusCode).toBe(401);
  });

  it("returns 401 for an expired refresh token", async () => {
    const handler = await loadHandler();
    const expired = issueRefresh("Alice", "test-secret-xyz", Date.now() - 1000);
    const res = await handler(makeEvent({ body: JSON.stringify({ name: "Alice", refreshToken: expired }) }));
    expect(res.statusCode).toBe(401);
  });

  it("returns 200 with new access + rotated refresh tokens on success", async () => {
    const handler = await loadHandler();
    const token = issueRefresh("Alice", "test-secret-xyz");
    const res = await handler(makeEvent({ body: JSON.stringify({ name: "Alice", refreshToken: token }) }));
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(typeof body.token).toBe("string");
    expect(verifyToken(body.token, "test-secret-xyz")).toBe(true);
    expect(typeof body.refreshToken).toBe("string");
    expect(body.refreshToken).toMatch(/^r:Alice:\d+:[a-f0-9]+$/);
    // The new refresh token must differ from the one presented (rotation).
    expect(body.refreshToken).not.toBe(token);
  });

  it("is case-insensitive on the name match", async () => {
    const handler = await loadHandler();
    const token = issueRefresh("Alice", "test-secret-xyz");
    const res = await handler(makeEvent({ body: JSON.stringify({ name: "alice", refreshToken: token }) }));
    expect(res.statusCode).toBe(200);
  });
});
