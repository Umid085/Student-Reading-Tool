import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createHmac } from "crypto";

const { handler } = await import("../netlify/functions/push-subscribe.js");

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

describe("netlify/functions/push-subscribe.js", () => {
  const OLD_ENV = process.env;
  let realFetch;

  beforeEach(() => {
    process.env = {
      ...OLD_ENV,
      SESSION_SECRET: "test-secret",
      FIREBASE_DB_URL: "https://test-db.firebaseio.com",
      RATE_LIMIT_DISABLED: "1",
    };
    realFetch = global.fetch;
  });
  afterEach(() => { process.env = OLD_ENV; global.fetch = realFetch; });

  it("OPTIONS → 204", async () => {
    const r = await handler({ httpMethod: "OPTIONS" });
    expect(r.statusCode).toBe(204);
  });

  it("503 without FIREBASE_DB_URL", async () => {
    delete process.env.FIREBASE_DB_URL;
    const r = await handler({ httpMethod: "POST", body: "{}" });
    expect(r.statusCode).toBe(503);
  });

  it("401 without Bearer token", async () => {
    const r = await handler({ httpMethod: "POST", headers: {}, body: JSON.stringify({ subscription: validSub }) });
    expect(r.statusCode).toBe(401);
  });

  it("POST with valid sub → 200, writes record", async () => {
    global.fetch = makeFetch([{ ok: true, json: {} }]);
    const auth = bearer("alice", "test-secret", Date.now() + 60_000);
    const r = await handler({
      httpMethod: "POST",
      headers: { authorization: auth },
      body: JSON.stringify({ subscription: validSub, examDate: "2026-12-25", locale: "uz" }),
    });
    expect(r.statusCode).toBe(200);
    const body = JSON.parse(r.body);
    expect(body.ok).toBe(true);
    expect(body.examDate).toBe("2026-12-25");
    expect(body.locale).toBe("uz");
    expect(body.subscription.endpoint).toBe(validSub.endpoint);
  });

  it("POST rejects invalid subscription shape", async () => {
    const auth = bearer("alice", "test-secret", Date.now() + 60_000);
    const r = await handler({
      httpMethod: "POST",
      headers: { authorization: auth },
      body: JSON.stringify({ subscription: { endpoint: "ftp://nope" } }),
    });
    expect(r.statusCode).toBe(400);
  });

  it("POST rejects malformed examDate", async () => {
    const auth = bearer("alice", "test-secret", Date.now() + 60_000);
    const r = await handler({
      httpMethod: "POST",
      headers: { authorization: auth },
      body: JSON.stringify({ subscription: validSub, examDate: "12/25/2026" }),
    });
    expect(r.statusCode).toBe(400);
  });

  it("POST defaults locale to 'en' when invalid", async () => {
    global.fetch = makeFetch([{ ok: true, json: {} }]);
    const auth = bearer("alice", "test-secret", Date.now() + 60_000);
    const r = await handler({
      httpMethod: "POST",
      headers: { authorization: auth },
      body: JSON.stringify({ subscription: validSub, locale: "klingon" }),
    });
    expect(r.statusCode).toBe(200);
    expect(JSON.parse(r.body).locale).toBe("en");
  });

  it("GET returns existing record", async () => {
    global.fetch = makeFetch([{ ok: true, json: { subscription: validSub, examDate: null, locale: "en" } }]);
    const auth = bearer("alice", "test-secret", Date.now() + 60_000);
    const r = await handler({ httpMethod: "GET", headers: { authorization: auth } });
    expect(r.statusCode).toBe(200);
    expect(JSON.parse(r.body).subscription.endpoint).toBe(validSub.endpoint);
  });

  it("GET → 404 when no record", async () => {
    global.fetch = makeFetch([{ ok: true, json: null }]);
    const auth = bearer("alice", "test-secret", Date.now() + 60_000);
    const r = await handler({ httpMethod: "GET", headers: { authorization: auth } });
    expect(r.statusCode).toBe(404);
  });

  it("DELETE removes record", async () => {
    global.fetch = makeFetch([{ ok: true, json: {} }]);
    const auth = bearer("alice", "test-secret", Date.now() + 60_000);
    const r = await handler({ httpMethod: "DELETE", headers: { authorization: auth } });
    expect(r.statusCode).toBe(200);
    expect(JSON.parse(r.body).ok).toBe(true);
  });
});
