import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { runHandler } from "./_vercelMock.js";

global.fetch = vi.fn();

async function loadHandler() {
  vi.resetModules();
  const mod = await import("../api/storage.js");
  return mod.default;
}

describe("api/storage.js", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    process.env = { ...OLD_ENV, FIREBASE_DB_URL: "https://fake.firebaseio.com" };
    fetch.mockReset();
  });

  afterEach(() => { process.env = OLD_ENV; });

  it("health-check: GET with no key returns ok", async () => {
    const handler = await loadHandler();
    const r = await runHandler(handler);
    expect(r.statusCode).toBe(200);
    const body = JSON.parse(r.body);
    expect(body.status).toBe("ok");
    expect(body.db).toBe(true);
  });

  it("health-check reports db:false when FIREBASE_DB_URL is missing", async () => {
    delete process.env.FIREBASE_DB_URL;
    const handler = await loadHandler();
    const r = await runHandler(handler);
    expect(r.statusCode).toBe(200);
    expect(JSON.parse(r.body).db).toBe(false);
  });

  it("GET with key returns 503 when FIREBASE_DB_URL is missing", async () => {
    delete process.env.FIREBASE_DB_URL;
    const handler = await loadHandler();
    const r = await runHandler(handler, { method: "GET", query: { key: "rq-boards-v6" } });
    expect(r.statusCode).toBe(503);
  });

  it("GET with key fetches from Firebase and returns value", async () => {
    const fakeData = [{ name: "Alice", score: 100 }];
    fetch.mockResolvedValue({ json: async () => fakeData });
    const handler = await loadHandler();
    const r = await runHandler(handler, { method: "GET", query: { key: "rq-boards-v6" } });
    expect(r.statusCode).toBe(200);
    const body = JSON.parse(r.body);
    expect(JSON.parse(body.value)).toEqual(fakeData);
    expect(fetch).toHaveBeenCalledWith(
      "https://fake.firebaseio.com/rq/rq-boards-v6.json"
    );
  });

  it("GET with key returns null value when Firebase has no data", async () => {
    fetch.mockResolvedValue({ json: async () => null });
    const handler = await loadHandler();
    const r = await runHandler(handler, { method: "GET", query: { key: "rq-boards-v6" } });
    expect(r.statusCode).toBe(200);
    expect(JSON.parse(r.body).value).toBeNull();
  });

  it("POST saves data to Firebase and returns ok", async () => {
    fetch.mockResolvedValue({ ok: true });
    const handler = await loadHandler();
    const payload = JSON.stringify([{ name: "Bob" }]);
    const r = await runHandler(handler, {
      method: "POST",
      body: { key: "rq-favs-v1", value: payload },
    });
    expect(r.statusCode).toBe(200);
    expect(JSON.parse(r.body).ok).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      "https://fake.firebaseio.com/rq/rq-favs-v1.json",
      expect.objectContaining({ method: "PUT", body: payload })
    );
  });

  it("POST returns 400 when key is missing", async () => {
    const handler = await loadHandler();
    const r = await runHandler(handler, {
      method: "POST",
      body: { value: "x" },
    });
    expect(r.statusCode).toBe(400);
    expect(JSON.parse(r.body).error).toMatch(/Invalid key|Missing key/);
  });

  // ── B19: parity assertions for READ_BLOCKED / WRITE_BLOCKED ────────────────
  it("GET rq-users-v6 returns 400 (blocked to protect credentials)", async () => {
    const handler = await loadHandler();
    const r = await runHandler(handler, { method: "GET", query: { key: "rq-users-v6" } });
    expect(r.statusCode).toBe(400);
  });

  it("GET rq-auth-v6 returns 400 (blocked to protect credentials)", async () => {
    const handler = await loadHandler();
    const r = await runHandler(handler, { method: "GET", query: { key: "rq-auth-v6" } });
    expect(r.statusCode).toBe(400);
  });

  it("POST rq-auth-v6 returns 400 (write-blocked)", async () => {
    const handler = await loadHandler();
    const r = await runHandler(handler, {
      method: "POST",
      body: { key: "rq-auth-v6", value: "[]" },
    });
    expect(r.statusCode).toBe(400);
  });

  it("returns 405 for unsupported methods", async () => {
    const handler = await loadHandler();
    const r = await runHandler(handler, { method: "DELETE" });
    expect(r.statusCode).toBe(405);
  });

  it("returns 500 when fetch throws", async () => {
    fetch.mockRejectedValue(new Error("network error"));
    const handler = await loadHandler();
    const r = await runHandler(handler, { method: "GET", query: { key: "rq-boards-v6" } });
    expect(r.statusCode).toBe(500);
    expect(JSON.parse(r.body).error).toBe("network error");
  });

  it("returns 401 when SESSION_SECRET is set and no Bearer token provided", async () => {
    process.env.SESSION_SECRET = "test-secret-abc";
    const handler = await loadHandler();
    const r = await runHandler(handler, {
      method: "POST",
      body: { key: "rq-boards-v6", value: "[]" },
    });
    expect(r.statusCode).toBe(401);
  });
});
