import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createHmac } from "crypto";

let mockSend;
vi.mock("web-push", () => {
  mockSend = vi.fn();
  return { default: { setVapidDetails: vi.fn(), sendNotification: mockSend } };
});

const { handler } = await import("../netlify/functions/push.js");

function bearer(name, secret, expiresMs) {
  const payload = `${name}:${expiresMs}`;
  const sig = createHmac("sha256", secret).update(payload).digest("hex");
  return `Bearer ${payload}:${sig}`;
}

function makeFetch(seq) {
  let i = 0;
  return vi.fn(async () => {
    const r = seq[i++] || { ok: true, json: null };
    return { ok: r.ok !== false, status: r.status || 200, json: async () => r.json };
  });
}

const validSub = {
  endpoint: "https://fcm.googleapis.com/fcm/send/abc",
  keys: { p256dh: "PUBKEY-fake", auth: "AUTH-fake" },
};

describe("netlify/functions/push.js (router)", () => {
  const OLD_ENV = process.env;
  let realFetch;

  beforeEach(() => {
    process.env = {
      ...OLD_ENV,
      SESSION_SECRET: "test-secret",
      CRON_SECRET: "cron-secret",
      VAPID_PUBLIC_KEY: "pub",
      VAPID_PRIVATE_KEY: "priv",
      VAPID_SUBJECT: "mailto:test@example.com",
      FIREBASE_DB_URL: "https://test-db.firebaseio.com",
      RATE_LIMIT_DISABLED: "1",
    };
    realFetch = global.fetch;
    if (mockSend) mockSend.mockReset();
  });
  afterEach(() => { process.env = OLD_ENV; global.fetch = realFetch; });

  it("OPTIONS → 204", async () => {
    const r = await handler({ httpMethod: "OPTIONS" });
    expect(r.statusCode).toBe(204);
  });

  it("unknown action → 400", async () => {
    const r = await handler({ httpMethod: "GET", queryStringParameters: { action: "nope" } });
    expect(r.statusCode).toBe(400);
  });

  // ── config ─────────────────────────────────────────────────────
  it("config GET → returns public key", async () => {
    const r = await handler({ httpMethod: "GET", queryStringParameters: { action: "config" } });
    expect(r.statusCode).toBe(200);
    expect(JSON.parse(r.body).publicKey).toBe("pub");
  });

  it("config GET → 503 when no VAPID public key", async () => {
    delete process.env.VAPID_PUBLIC_KEY;
    const r = await handler({ httpMethod: "GET", queryStringParameters: { action: "config" } });
    expect(r.statusCode).toBe(503);
  });

  // ── subscribe ──────────────────────────────────────────────────
  it("subscribe without bearer → 401", async () => {
    const r = await handler({ httpMethod: "POST", body: JSON.stringify({ action: "subscribe", subscription: validSub }), headers: {} });
    expect(r.statusCode).toBe(401);
  });

  it("subscribe POST stores valid subscription", async () => {
    global.fetch = makeFetch([{ ok: true, json: {} }]);
    const auth = bearer("alice", "test-secret", Date.now() + 60_000);
    const r = await handler({
      httpMethod: "POST",
      body: JSON.stringify({ action: "subscribe", subscription: validSub, examDate: "2026-12-25", locale: "uz" }),
      headers: { authorization: auth },
    });
    expect(r.statusCode).toBe(200);
    const body = JSON.parse(r.body);
    expect(body.examDate).toBe("2026-12-25");
    expect(body.locale).toBe("uz");
  });

  it("subscribe POST rejects malformed examDate", async () => {
    const auth = bearer("alice", "test-secret", Date.now() + 60_000);
    const r = await handler({
      httpMethod: "POST",
      body: JSON.stringify({ action: "subscribe", subscription: validSub, examDate: "tomorrow" }),
      headers: { authorization: auth },
    });
    expect(r.statusCode).toBe(400);
  });

  it("subscribe GET → 404 when no record", async () => {
    global.fetch = makeFetch([{ ok: true, json: null }]);
    const auth = bearer("alice", "test-secret", Date.now() + 60_000);
    const r = await handler({ httpMethod: "GET", queryStringParameters: { action: "subscribe" }, headers: { authorization: auth } });
    expect(r.statusCode).toBe(404);
  });

  it("subscribe DELETE removes record", async () => {
    global.fetch = makeFetch([{ ok: true, json: {} }]);
    const auth = bearer("alice", "test-secret", Date.now() + 60_000);
    const r = await handler({ httpMethod: "DELETE", queryStringParameters: { action: "subscribe" }, headers: { authorization: auth } });
    expect(r.statusCode).toBe(200);
  });

  // ── cron ───────────────────────────────────────────────────────
  it("cron without CRON_SECRET → 401", async () => {
    const r = await handler({ queryStringParameters: { action: "cron" }, headers: {} });
    expect(r.statusCode).toBe(401);
  });

  it("cron with wrong secret → 401", async () => {
    const r = await handler({ queryStringParameters: { action: "cron" }, headers: { authorization: "Bearer nope" } });
    expect(r.statusCode).toBe(401);
  });

  it("cron sends to every active subscription", async () => {
    const subs = {
      alice: { subscription: { endpoint: "https://a/", keys: { p256dh: "x", auth: "y" } }, locale: "en", examDate: null },
      bob:   { subscription: { endpoint: "https://b/", keys: { p256dh: "x", auth: "y" } }, locale: "uz", examDate: null },
    };
    global.fetch = makeFetch([{ ok: true, json: subs }]);
    mockSend.mockResolvedValue({ statusCode: 201 });
    const r = await handler({ queryStringParameters: { action: "cron" }, headers: { authorization: "Bearer cron-secret" } });
    expect(r.statusCode).toBe(200);
    expect(JSON.parse(r.body).sent).toBe(2);
    expect(mockSend).toHaveBeenCalledTimes(2);
  });

  it("cron removes subscription on 410 Gone", async () => {
    const subs = { stale: { subscription: { endpoint: "https://s/", keys: { p256dh: "x", auth: "y" } }, locale: "en", examDate: null } };
    global.fetch = makeFetch([{ ok: true, json: subs }, { ok: true, json: {} }]);
    const err = new Error("Gone"); err.statusCode = 410;
    mockSend.mockRejectedValue(err);
    const r = await handler({ queryStringParameters: { action: "cron" }, headers: { authorization: "Bearer cron-secret" } });
    expect(JSON.parse(r.body).removed).toBe(1);
  });

  it("cron removes subscription with past examDate", async () => {
    const subs = { past: { subscription: { endpoint: "https://p/", keys: { p256dh: "x", auth: "y" } }, locale: "en", examDate: "2000-01-01" } };
    global.fetch = makeFetch([{ ok: true, json: subs }, { ok: true, json: {} }]);
    const r = await handler({ queryStringParameters: { action: "cron" }, headers: { authorization: "Bearer cron-secret" } });
    expect(JSON.parse(r.body).removed).toBe(1);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("cron counts non-410 errors as 'failed'", async () => {
    const subs = { transient: { subscription: { endpoint: "https://t/", keys: { p256dh: "x", auth: "y" } }, locale: "en", examDate: null } };
    global.fetch = makeFetch([{ ok: true, json: subs }]);
    const err = new Error("Server"); err.statusCode = 500;
    mockSend.mockRejectedValue(err);
    const r = await handler({ queryStringParameters: { action: "cron" }, headers: { authorization: "Bearer cron-secret" } });
    expect(JSON.parse(r.body).failed).toBe(1);
  });
});
