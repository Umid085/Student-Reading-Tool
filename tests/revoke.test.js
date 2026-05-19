import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createHmac } from "crypto";

global.fetch = vi.fn();

async function loadHandler() {
  vi.resetModules();
  const mod = await import("../netlify/functions/revoke.js");
  return mod.handler;
}

function makeEvent(overrides = {}) {
  return { httpMethod: "POST", headers: {}, body: null, ...overrides };
}

function issueRefresh(name, secret, expiresAt) {
  const exp = expiresAt || (Date.now() + 30 * 24 * 60 * 60 * 1000);
  const payload = `${name}:${exp}`;
  const sig = createHmac("sha256", String(secret) + "/refresh-v1").update(payload).digest("hex");
  return `r:${payload}:${sig}`;
}

describe("revoke.js", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    process.env = { ...OLD_ENV, SESSION_SECRET: "secret", FIREBASE_DB_URL: "https://fake.firebaseio.com", RATE_LIMIT_DISABLED: "1" };
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

  it("rejects missing credentials", async () => {
    const handler = await loadHandler();
    expect((await handler(makeEvent({ body: JSON.stringify({}) }))).statusCode).toBe(400);
  });

  it("rejects an invalid token", async () => {
    const handler = await loadHandler();
    const res = await handler(makeEvent({ body: JSON.stringify({ name: "Alice", refreshToken: "garbage" }) }));
    expect(res.statusCode).toBe(401);
  });

  it("rejects a name mismatch", async () => {
    const handler = await loadHandler();
    const token = issueRefresh("Alice", "secret");
    const res = await handler(makeEvent({ body: JSON.stringify({ name: "Bob", refreshToken: token }) }));
    expect(res.statusCode).toBe(401);
  });

  it("adds the token id to the blacklist and prunes stale entries", async () => {
    fetch
      .mockResolvedValueOnce({ json: async () => ({
        // Two stale entries that should be pruned (much older than 31 days):
        "stale-1": Date.now() - 60 * 24 * 60 * 60 * 1000,
        "stale-2": Date.now() - 90 * 24 * 60 * 60 * 1000,
        // A current entry that should survive:
        "still-valid": Date.now() + 5 * 24 * 60 * 60 * 1000,
      }) })
      .mockResolvedValueOnce({});
    const handler = await loadHandler();
    const token = issueRefresh("Alice", "secret");
    const res = await handler(makeEvent({ body: JSON.stringify({ name: "Alice", refreshToken: token }) }));
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).ok).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch.mock.calls[1][1].method).toBe("PUT");
    const written = JSON.parse(fetch.mock.calls[1][1].body);
    expect(written["stale-1"]).toBeUndefined();
    expect(written["stale-2"]).toBeUndefined();
    expect(written["still-valid"]).toBeDefined();
    // New token id present
    expect(Object.keys(written).filter(k => k !== "still-valid")).toHaveLength(1);
  });
});

describe("refresh.js — revocation check", () => {
  const OLD_ENV = process.env;

  async function loadRefreshHandler() {
    vi.resetModules();
    const mod = await import("../netlify/functions/refresh.js");
    return mod.handler;
  }

  beforeEach(() => {
    process.env = { ...OLD_ENV, SESSION_SECRET: "secret", FIREBASE_DB_URL: "https://fake.firebaseio.com", RATE_LIMIT_DISABLED: "1" };
    fetch.mockReset();
  });

  afterEach(() => { process.env = OLD_ENV; });

  it("returns 401 when token id is on the blacklist", async () => {
    // We need the tokenId of the issued token to mark it as revoked.
    const { refreshTokenId } = await import("../netlify/functions/_refreshToken.js");
    const token = issueRefresh("Alice", "secret");
    const id = refreshTokenId(token);
    fetch.mockResolvedValueOnce({ json: async () => ({ [id]: Date.now() + 24 * 60 * 60 * 1000 }) });
    const handler = await loadRefreshHandler();
    const res = await handler(makeEvent({ body: JSON.stringify({ name: "Alice", refreshToken: token }) }));
    expect(res.statusCode).toBe(401);
    expect(JSON.parse(res.body).error).toMatch(/revoked/i);
  });

  it("issues a fresh token when blacklist lookup fails (fail-open)", async () => {
    // Network error on the blacklist read — we don't lock the user out.
    fetch.mockRejectedValueOnce(new Error("offline"));
    const handler = await loadRefreshHandler();
    const token = issueRefresh("Alice", "secret");
    const res = await handler(makeEvent({ body: JSON.stringify({ name: "Alice", refreshToken: token }) }));
    expect(res.statusCode).toBe(200);
  });
});
