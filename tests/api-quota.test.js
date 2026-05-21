import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createHmac } from "crypto";
import { runHandler } from "./_vercelMock.js";

async function loadHandler() {
  vi.resetModules();
  const mod = await import("../api/quota.js");
  return mod.default;
}

function makeBearer(name, secret, expiresMs) {
  const payload = `${name}:${expiresMs}`;
  const sig = createHmac("sha256", secret).update(payload).digest("hex");
  return `Bearer ${payload}:${sig}`;
}

function makeFetch(seq) {
  let i = 0;
  return vi.fn(async () => {
    const r = seq[i++] || { ok: true, json: null };
    return { ok: r.ok !== false, json: async () => r.json };
  });
}

describe("api/quota.js", () => {
  const OLD_ENV = process.env;
  let realFetch;

  beforeEach(() => {
    process.env = {
      ...OLD_ENV,
      SESSION_SECRET: "test-secret",
      FIREBASE_DB_URL: "https://test-db.firebaseio.com",
    };
    realFetch = global.fetch;
  });

  afterEach(() => {
    process.env = OLD_ENV;
    global.fetch = realFetch;
  });

  it("OPTIONS returns 204", async () => {
    const handler = await loadHandler();
    const r = await runHandler(handler, { method: "OPTIONS" });
    expect(r.statusCode).toBe(204);
  });

  it("returns 405 for non-GET", async () => {
    const handler = await loadHandler();
    const r = await runHandler(handler, { method: "POST" });
    expect(r.statusCode).toBe(405);
  });

  it("returns 401 without a Bearer token", async () => {
    const handler = await loadHandler();
    const r = await runHandler(handler, { method: "GET" });
    expect(r.statusCode).toBe(401);
  });

  it("returns 401 for a forged token (wrong signature)", async () => {
    const handler = await loadHandler();
    const r = await runHandler(handler, {
      method: "GET",
      headers: { authorization: "Bearer alice:" + (Date.now() + 60_000) + ":deadbeef" },
    });
    expect(r.statusCode).toBe(401);
  });

  it("returns 401 for an expired token", async () => {
    const handler = await loadHandler();
    const r = await runHandler(handler, {
      method: "GET",
      headers: { authorization: makeBearer("alice", "test-secret", Date.now() - 1) },
    });
    expect(r.statusCode).toBe(401);
  });

  it("returns 200 with per-endpoint quota for a valid token", async () => {
    // 4 endpoints × 1 read each — return varying usage
    global.fetch = makeFetch([
      { ok: true, json: { n: 3 } }, // ai
      { ok: true, json: { n: 0 } }, // quiz_from_text
      { ok: true, json: { n: 17 } }, // vocab
      { ok: true, json: null },     // slider (no record yet)
    ]);
    const handler = await loadHandler();
    const r = await runHandler(handler, {
      method: "GET",
      headers: { authorization: makeBearer("alice", "test-secret", Date.now() + 60_000) },
    });
    expect(r.statusCode).toBe(200);
    const body = JSON.parse(r.body);
    expect(body.user).toBe("alice");
    expect(body.quotas.ai.used).toBe(3);
    expect(body.quotas.ai.maxLow).toBe(10);
    expect(body.quotas.ai.maxHigh).toBe(6);
    expect(body.quotas.quiz_from_text.used).toBe(0);
    expect(body.quotas.quiz_from_text.max).toBe(15);
    expect(body.quotas.vocab.used).toBe(17);
    expect(body.quotas.vocab.max).toBe(80);
    expect(body.quotas.slider.used).toBe(0);
    expect(body.quotas.slider.max).toBe(30);
  });
});
