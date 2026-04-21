import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

global.fetch = vi.fn();

async function loadHandler() {
  vi.resetModules();
  const mod = await import("../netlify/functions/storage.js");
  return mod.handler;
}

function makeEvent(overrides = {}) {
  return {
    httpMethod: "GET",
    queryStringParameters: {},
    body: null,
    ...overrides,
  };
}

describe("storage.js", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    process.env = { ...OLD_ENV, FIREBASE_DB_URL: "https://fake.firebaseio.com" };
    fetch.mockReset();
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it("health-check: GET with no key returns ok", async () => {
    const handler = await loadHandler();
    const res = await handler(makeEvent());
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.status).toBe("ok");
    expect(body.db).toBe(true);
  });

  it("health-check reports db:false when FIREBASE_DB_URL is missing", async () => {
    delete process.env.FIREBASE_DB_URL;
    const handler = await loadHandler();
    const res = await handler(makeEvent());
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).db).toBe(false);
  });

  it("GET with key returns 503 when FIREBASE_DB_URL is missing", async () => {
    delete process.env.FIREBASE_DB_URL;
    const handler = await loadHandler();
    const res = await handler(makeEvent({ queryStringParameters: { key: "rq-users-v6" } }));
    expect(res.statusCode).toBe(503);
  });

  it("GET with key fetches from Firebase and returns value", async () => {
    const fakeData = [{ name: "Alice" }];
    fetch.mockResolvedValue({ json: async () => fakeData });
    const handler = await loadHandler();
    const res = await handler(makeEvent({ queryStringParameters: { key: "rq-users-v6" } }));
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(JSON.parse(body.value)).toEqual(fakeData);
    expect(fetch).toHaveBeenCalledWith(
      "https://fake.firebaseio.com/rq/rq-users-v6.json"
    );
  });

  it("GET with key returns null value when Firebase has no data", async () => {
    fetch.mockResolvedValue({ json: async () => null });
    const handler = await loadHandler();
    const res = await handler(makeEvent({ queryStringParameters: { key: "rq-users-v6" } }));
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).value).toBeNull();
  });

  it("POST saves data to Firebase and returns ok", async () => {
    fetch.mockResolvedValue({});
    const handler = await loadHandler();
    const payload = JSON.stringify([{ name: "Bob" }]);
    const res = await handler(
      makeEvent({
        httpMethod: "POST",
        body: JSON.stringify({ key: "rq-users-v6", value: payload }),
      })
    );
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).ok).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      "https://fake.firebaseio.com/rq/rq-users-v6.json",
      expect.objectContaining({ method: "PUT", body: payload })
    );
  });

  it("POST returns 400 when key is missing", async () => {
    const handler = await loadHandler();
    const res = await handler(
      makeEvent({ httpMethod: "POST", body: JSON.stringify({ value: "x" }) })
    );
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error).toMatch(/Missing key/);
  });

  it("returns 405 for unsupported methods", async () => {
    const handler = await loadHandler();
    const res = await handler(makeEvent({ httpMethod: "DELETE" }));
    expect(res.statusCode).toBe(405);
  });

  it("returns 500 when fetch throws", async () => {
    fetch.mockRejectedValue(new Error("network error"));
    const handler = await loadHandler();
    const res = await handler(makeEvent({ queryStringParameters: { key: "rq-users-v6" } }));
    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res.body).error).toBe("network error");
  });
});
