import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Mock web-push so tests don't touch the real push services.
let mockSend;
vi.mock("web-push", () => {
  mockSend = vi.fn();
  return {
    default: {
      setVapidDetails: vi.fn(),
      sendNotification: mockSend,
    },
  };
});

const { handler } = await import("../netlify/functions/cron-push.js");

function makeFetch(seq) {
  let i = 0;
  return vi.fn(async () => {
    const r = seq[i++] || { ok: true, json: null };
    return { ok: r.ok !== false, status: r.status || 200, json: async () => r.json };
  });
}

describe("netlify/functions/cron-push.js", () => {
  const OLD_ENV = process.env;
  let realFetch;

  beforeEach(() => {
    process.env = {
      ...OLD_ENV,
      CRON_SECRET: "test-secret",
      VAPID_PUBLIC_KEY: "pub",
      VAPID_PRIVATE_KEY: "priv",
      VAPID_SUBJECT: "mailto:test@example.com",
      FIREBASE_DB_URL: "https://test-db.firebaseio.com",
    };
    realFetch = global.fetch;
    if (mockSend) mockSend.mockReset();
  });
  afterEach(() => { process.env = OLD_ENV; global.fetch = realFetch; });

  it("401 without bearer", async () => {
    const r = await handler({ headers: {} });
    expect(r.statusCode).toBe(401);
  });

  it("401 with wrong secret", async () => {
    const r = await handler({ headers: { authorization: "Bearer nope" } });
    expect(r.statusCode).toBe(401);
  });

  it("503 without VAPID keys", async () => {
    delete process.env.VAPID_PUBLIC_KEY;
    const r = await handler({ headers: { authorization: "Bearer test-secret" } });
    expect(r.statusCode).toBe(503);
  });

  it("sends to every active subscription", async () => {
    const subs = {
      alice: { subscription: { endpoint: "https://a/", keys: { p256dh: "x", auth: "y" } }, locale: "en", examDate: null },
      bob:   { subscription: { endpoint: "https://b/", keys: { p256dh: "x", auth: "y" } }, locale: "uz", examDate: null },
    };
    global.fetch = makeFetch([{ ok: true, json: subs }]);
    mockSend.mockResolvedValue({ statusCode: 201 });
    const r = await handler({ headers: { authorization: "Bearer test-secret" } });
    expect(r.statusCode).toBe(200);
    const body = JSON.parse(r.body);
    expect(body.sent).toBe(2);
    expect(body.removed).toBe(0);
    expect(mockSend).toHaveBeenCalledTimes(2);
    // Verify message localization picks the right table
    const enPayload = JSON.parse(mockSend.mock.calls[0][1]);
    const uzPayload = JSON.parse(mockSend.mock.calls[1][1]);
    expect(enPayload.title).toMatch(/Reading Quest/);
    expect(uzPayload.body).toMatch(/o'qish|vaqti/i);
  });

  it("removes subscription on 410 Gone", async () => {
    const subs = {
      stale: { subscription: { endpoint: "https://s/", keys: { p256dh: "x", auth: "y" } }, locale: "en", examDate: null },
    };
    global.fetch = makeFetch([
      { ok: true, json: subs },          // initial GET
      { ok: true, json: {} },             // DELETE
    ]);
    const err = new Error("Gone"); err.statusCode = 410;
    mockSend.mockRejectedValue(err);
    const r = await handler({ headers: { authorization: "Bearer test-secret" } });
    expect(r.statusCode).toBe(200);
    expect(JSON.parse(r.body).removed).toBe(1);
  });

  it("removes subscription when exam date is in the past", async () => {
    const subs = {
      past: { subscription: { endpoint: "https://p/", keys: { p256dh: "x", auth: "y" } }, locale: "en", examDate: "2000-01-01" },
    };
    global.fetch = makeFetch([
      { ok: true, json: subs },
      { ok: true, json: {} },
    ]);
    const r = await handler({ headers: { authorization: "Bearer test-secret" } });
    expect(r.statusCode).toBe(200);
    expect(JSON.parse(r.body).removed).toBe(1);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("counts non-410 errors as 'failed' (subscription kept)", async () => {
    const subs = {
      transient: { subscription: { endpoint: "https://t/", keys: { p256dh: "x", auth: "y" } }, locale: "en", examDate: null },
    };
    global.fetch = makeFetch([{ ok: true, json: subs }]);
    const err = new Error("Server error"); err.statusCode = 500;
    mockSend.mockRejectedValue(err);
    const r = await handler({ headers: { authorization: "Bearer test-secret" } });
    const body = JSON.parse(r.body);
    expect(body.failed).toBe(1);
    expect(body.removed).toBe(0);
  });
});
