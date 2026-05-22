import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createHmac } from "crypto";
import { runHandler } from "./_vercelMock.js";

function bearer(name, secret, expiresMs) {
  const payload = `${name}:${expiresMs}`;
  const sig = createHmac("sha256", secret).update(payload).digest("hex");
  return `Bearer ${payload}:${sig}`;
}

function makeFetch(seq) {
  let i = 0;
  return vi.fn(async () => {
    const r = seq[i++] || { ok: true, json: null };
    return { ok: r.ok !== false, status: r.status || 200, json: async () => r.json, text: async () => "" };
  });
}

async function loadHandler() {
  vi.resetModules();
  const mod = await import("../api/push-subscribe.js");
  return mod.default;
}

const validSub = {
  endpoint: "https://fcm.googleapis.com/fcm/send/abc",
  keys: { p256dh: "PUBKEY-fake", auth: "AUTH-fake" },
};

describe("api/push-subscribe.js", () => {
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
    const handler = await loadHandler();
    const r = await runHandler(handler, { method: "OPTIONS" });
    expect(r.statusCode).toBe(204);
  });

  it("401 without bearer", async () => {
    const handler = await loadHandler();
    const r = await runHandler(handler, { method: "POST", body: { subscription: validSub } });
    expect(r.statusCode).toBe(401);
  });

  it("POST stores valid sub", async () => {
    global.fetch = makeFetch([{ ok: true, json: {} }]);
    const handler = await loadHandler();
    const auth = bearer("alice", "test-secret", Date.now() + 60_000);
    const r = await runHandler(handler, {
      method: "POST",
      headers: { authorization: auth },
      body: { subscription: validSub, examDate: "2026-12-25" },
    });
    expect(r.statusCode).toBe(200);
    expect(JSON.parse(r.body).examDate).toBe("2026-12-25");
  });

  it("POST 400 on malformed examDate", async () => {
    const handler = await loadHandler();
    const auth = bearer("alice", "test-secret", Date.now() + 60_000);
    const r = await runHandler(handler, {
      method: "POST",
      headers: { authorization: auth },
      body: { subscription: validSub, examDate: "tomorrow" },
    });
    expect(r.statusCode).toBe(400);
  });

  it("DELETE removes record", async () => {
    global.fetch = makeFetch([{ ok: true, json: {} }]);
    const handler = await loadHandler();
    const auth = bearer("alice", "test-secret", Date.now() + 60_000);
    const r = await runHandler(handler, { method: "DELETE", headers: { authorization: auth } });
    expect(r.statusCode).toBe(200);
  });
});
