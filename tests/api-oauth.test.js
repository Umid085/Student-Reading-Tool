import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createHmac } from "crypto";
import { runHandler } from "./_vercelMock.js";

global.fetch = vi.fn();

vi.mock("../api/_oauth.js", () => ({
  verifyProviderCredential: vi.fn(),
}));

async function loadOAuth() {
  vi.resetModules();
  const oauthMod = await import("../api/_oauth.js");
  const authMod = await import("../api/auth.js");
  return { handler: authMod.default, verify: oauthMod.verifyProviderCredential };
}

function verifyToken(token, secret) {
  const lastColon = token.lastIndexOf(":");
  return token.slice(lastColon + 1) === createHmac("sha256", secret).update(token.slice(0, lastColon)).digest("hex");
}

const FB_ID = { ok: true, provider: "google.com", firebaseUid: "fb-uid-123", email: "alice@example.com", emailVerified: true, name: "Alice" };

describe("api/auth.js — oauth action", () => {
  const OLD_ENV = process.env;
  beforeEach(() => {
    process.env = { ...OLD_ENV, SESSION_SECRET: "test-secret-abc", FIREBASE_DB_URL: "https://fake.firebaseio.com", FIREBASE_DB_SECRET: "test-db-secret", RATE_LIMIT_DISABLED: "1" };
    fetch.mockReset();
  });
  afterEach(() => { process.env = OLD_ENV; });

  it("rejects an unverifiable credential with 401", async () => {
    const { handler, verify } = await loadOAuth();
    verify.mockResolvedValue({ ok: false, error: "Invalid Firebase credential" });
    const r = await runHandler(handler, { method: "POST", query: { action: "oauth" }, body: { credential: "bad" } });
    expect(r.statusCode).toBe(401);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("asks for a username for a verified new user", async () => {
    const { handler, verify } = await loadOAuth();
    verify.mockResolvedValue(FB_ID);
    fetch.mockResolvedValueOnce({ json: async () => [] });
    const r = await runHandler(handler, { method: "POST", query: { action: "oauth" }, body: { credential: "good" } });
    expect(r.statusCode).toBe(200);
    expect(JSON.parse(r.body).needsUsername).toBe(true);
  });

  it("creates the account and mints tokens with a username", async () => {
    const { handler, verify } = await loadOAuth();
    verify.mockResolvedValue(FB_ID);
    fetch
      .mockResolvedValueOnce({ json: async () => [] })
      .mockResolvedValueOnce({ json: async () => [] })
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: true });
    const r = await runHandler(handler, { method: "POST", query: { action: "oauth" }, body: { credential: "good", username: "alice_g" } });
    expect(r.statusCode).toBe(200);
    const body = JSON.parse(r.body);
    expect(body.name).toBe("alice_g");
    expect(verifyToken(body.token, "test-secret-abc")).toBe(true);
  });

  it("logs a returning user in by firebase uid", async () => {
    const { handler, verify } = await loadOAuth();
    verify.mockResolvedValue(FB_ID);
    fetch.mockResolvedValueOnce({ json: async () => [{ name: "Bob", email: "alice@example.com", firebaseUid: "fb-uid-123" }] });
    const r = await runHandler(handler, { method: "POST", query: { action: "oauth" }, body: { credential: "good" } });
    expect(r.statusCode).toBe(200);
    expect(JSON.parse(r.body).name).toBe("Bob");
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
