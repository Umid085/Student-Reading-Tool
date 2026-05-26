import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createHmac } from "crypto";

global.fetch = vi.fn();

// The real verifier validates a Firebase ID token against Google's X.509 certs
// over the network; stub it so we can drive the auth-router branches with
// canned (trusted) identities offline.
vi.mock("../netlify/functions/_oauth.js", () => ({
  verifyProviderCredential: vi.fn(),
}));

async function loadOAuth() {
  vi.resetModules();
  // Re-import both after reset so the mock fn we configure is the exact
  // instance auth.js holds (shared module registry).
  const oauthMod = await import("../netlify/functions/_oauth.js");
  const authMod = await import("../netlify/functions/auth.js");
  return { handler: authMod.handler, verify: oauthMod.verifyProviderCredential };
}

function makeEvent(body, action = "oauth") {
  return { httpMethod: "POST", headers: {}, queryStringParameters: { action }, body: JSON.stringify(body) };
}

function verifyToken(token, secret) {
  const lastColon = token.lastIndexOf(":");
  return token.slice(lastColon + 1) === createHmac("sha256", secret).update(token.slice(0, lastColon)).digest("hex");
}

// What a verified Firebase ID token resolves to.
const FB_ID = { ok: true, provider: "google.com", firebaseUid: "fb-uid-123", email: "alice@example.com", emailVerified: true, name: "Alice" };

describe("auth.js — oauth action", () => {
  const OLD_ENV = process.env;
  beforeEach(() => {
    process.env = { ...OLD_ENV, SESSION_SECRET: "test-secret-abc", FIREBASE_DB_URL: "https://fake.firebaseio.com", FIREBASE_DB_SECRET: "test-db-secret", RATE_LIMIT_DISABLED: "1" };
    fetch.mockReset();
  });
  afterEach(() => { process.env = OLD_ENV; });

  it("rejects an unverifiable credential with 401 (no DB access)", async () => {
    const { handler, verify } = await loadOAuth();
    verify.mockResolvedValue({ ok: false, error: "Invalid Firebase credential" });
    const res = await handler(makeEvent({ credential: "bad" }));
    expect(res.statusCode).toBe(401);
    expect(JSON.parse(res.body).error).toMatch(/Invalid Firebase credential/);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("asks for a username when a verified user has no account yet", async () => {
    const { handler, verify } = await loadOAuth();
    verify.mockResolvedValue(FB_ID);
    fetch.mockResolvedValueOnce({ json: async () => [] }); // rq-auth-v6: empty
    const res = await handler(makeEvent({ credential: "good" }));
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.needsUsername).toBe(true);
    expect(body.email).toBe("alice@example.com");
    expect(body.suggestedName).toBe("Alice");
    expect(body.token).toBeUndefined();
  });

  it("creates the account + profile and mints tokens once a username is supplied", async () => {
    const { handler, verify } = await loadOAuth();
    verify.mockResolvedValue(FB_ID);
    fetch
      .mockResolvedValueOnce({ json: async () => [] })  // rq-auth-v6 read
      .mockResolvedValueOnce({ json: async () => [] })  // rq-users-v6 read
      .mockResolvedValueOnce({ ok: true })              // PUT rq-users-v6
      .mockResolvedValueOnce({ ok: true });             // PUT rq-auth-v6
    const res = await handler(makeEvent({ credential: "good", username: "alice_g" }));
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.name).toBe("alice_g");
    expect(verifyToken(body.token, "test-secret-abc")).toBe(true);
    expect(typeof body.refreshToken).toBe("string");
    // auth list write carries the firebase uid + email, never a hash.
    const authWrite = JSON.parse(fetch.mock.calls[3][1].body);
    const created = authWrite.find((u) => u.name === "alice_g");
    expect(created.firebaseUid).toBe("fb-uid-123");
    expect(created.email).toBe("alice@example.com");
    expect(created.hash).toBeUndefined();
  });

  it("returns 409 when the requested username is already taken", async () => {
    const { handler, verify } = await loadOAuth();
    verify.mockResolvedValue(FB_ID);
    fetch.mockResolvedValueOnce({ json: async () => [{ name: "alice_g", hash: "x" }] });
    const res = await handler(makeEvent({ credential: "good", username: "alice_g" }));
    expect(res.statusCode).toBe(409);
    expect(JSON.parse(res.body).code).toBe("username_taken");
  });

  it("rejects a malformed username with 400", async () => {
    const { handler, verify } = await loadOAuth();
    verify.mockResolvedValue(FB_ID);
    fetch.mockResolvedValueOnce({ json: async () => [] });
    const res = await handler(makeEvent({ credential: "good", username: "a" }));
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).code).toBe("invalid_username");
  });

  it("logs a returning user in by firebase uid without rewriting the auth list", async () => {
    const { handler, verify } = await loadOAuth();
    verify.mockResolvedValue(FB_ID);
    fetch.mockResolvedValueOnce({ json: async () => [{ name: "Bob", email: "alice@example.com", firebaseUid: "fb-uid-123" }] });
    const res = await handler(makeEvent({ credential: "good" }));
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).name).toBe("Bob");
    expect(fetch).toHaveBeenCalledTimes(1); // read only, no backfill PUT
  });

  it("matches a returning user by verified email and backfills the firebase uid", async () => {
    const { handler, verify } = await loadOAuth();
    verify.mockResolvedValue(FB_ID);
    fetch
      .mockResolvedValueOnce({ json: async () => [{ name: "Carol", email: "alice@example.com" }] }) // read
      .mockResolvedValueOnce({ ok: true }); // backfill PUT
    const res = await handler(makeEvent({ credential: "good" }));
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).name).toBe("Carol");
    const write = JSON.parse(fetch.mock.calls[1][1].body);
    expect(write.find((u) => u.name === "Carol").firebaseUid).toBe("fb-uid-123");
  });

  it("never silently claims an existing password-only account (no email on file)", async () => {
    const { handler, verify } = await loadOAuth();
    verify.mockResolvedValue(FB_ID);
    fetch.mockResolvedValueOnce({ json: async () => [{ name: "Dave", hash: "scrypt$..." }] });
    const res = await handler(makeEvent({ credential: "good" }));
    // No uid match, no email to match on → treated as a brand-new user.
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).needsUsername).toBe(true);
  });
});
