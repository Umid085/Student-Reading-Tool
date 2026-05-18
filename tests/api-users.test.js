import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { runHandler } from "./_vercelMock.js";

global.fetch = vi.fn();

async function loadHandler() {
  vi.resetModules();
  const mod = await import("../api/users.js");
  return mod.default;
}

describe("api/users.js", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    process.env = { ...OLD_ENV, FIREBASE_DB_URL: "https://fake.firebaseio.com" };
    fetch.mockReset();
  });

  afterEach(() => { process.env = OLD_ENV; });

  it("OPTIONS returns 204", async () => {
    const handler = await loadHandler();
    const r = await runHandler(handler, { method: "OPTIONS" });
    expect(r.statusCode).toBe(204);
  });

  it("POST returns 405", async () => {
    const handler = await loadHandler();
    const r = await runHandler(handler, { method: "POST" });
    expect(r.statusCode).toBe(405);
  });

  it("returns 503 when FIREBASE_DB_URL is not set", async () => {
    delete process.env.FIREBASE_DB_URL;
    const handler = await loadHandler();
    const r = await runHandler(handler);
    expect(r.statusCode).toBe(503);
  });

  it("returns users list with hash stripped", async () => {
    const users = [
      { name: "Alice", hash: "secret1", games: [], joined: "1/1/2025" },
      { name: "Bob", hash: "secret2", games: [], joined: "2/1/2025" },
    ];
    fetch.mockResolvedValue({ json: async () => users });
    const handler = await loadHandler();
    const r = await runHandler(handler);
    expect(r.statusCode).toBe(200);
    const body = JSON.parse(r.body);
    expect(Array.isArray(body.users)).toBe(true);
    expect(body.users[0].name).toBe("Alice");
    expect(body.users[0].hash).toBeUndefined();
    expect(body.users[1].name).toBe("Bob");
    expect(body.users[1].hash).toBeUndefined();
  });

  it("returns empty array when Firebase has no data", async () => {
    fetch.mockResolvedValue({ json: async () => null });
    const handler = await loadHandler();
    const r = await runHandler(handler);
    expect(r.statusCode).toBe(200);
    expect(JSON.parse(r.body).users).toEqual([]);
  });

  it("reads from the correct Firebase path", async () => {
    fetch.mockResolvedValue({ json: async () => [] });
    const handler = await loadHandler();
    await runHandler(handler);
    expect(fetch).toHaveBeenCalledWith("https://fake.firebaseio.com/rq/rq-users-v6.json");
  });

  it("returns 500 when Firebase fetch throws", async () => {
    fetch.mockRejectedValue(new Error("network error"));
    const handler = await loadHandler();
    const r = await runHandler(handler);
    expect(r.statusCode).toBe(500);
    expect(JSON.parse(r.body).error).toBe("network error");
  });
});
