import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createHmac } from "crypto";
import { runHandler } from "./_vercelMock.js";

async function loadHandler() {
  vi.resetModules();
  const mod = await import("../api/teacher-bio.js");
  return mod.default;
}

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

describe("api/teacher-bio.js", () => {
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

  it("OPTIONS returns 204", async () => {
    const handler = await loadHandler();
    const r = await runHandler(handler, { method: "OPTIONS" });
    expect(r.statusCode).toBe(204);
  });

  it("returns 405 for unknown methods", async () => {
    const handler = await loadHandler();
    const r = await runHandler(handler, { method: "PUT" });
    expect(r.statusCode).toBe(405);
  });

  describe("GET", () => {
    it("returns 400 when name is missing", async () => {
      const handler = await loadHandler();
      const r = await runHandler(handler, { method: "GET", query: {} });
      expect(r.statusCode).toBe(400);
    });

    it("returns 404 when the teacher has no record", async () => {
      global.fetch = makeFetch([{ ok: true, json: null }]);
      const handler = await loadHandler();
      const r = await runHandler(handler, { method: "GET", query: { name: "alice" } });
      expect(r.statusCode).toBe(404);
    });

    it("returns 404 when the teacher exists but is private (public=false)", async () => {
      global.fetch = makeFetch([
        { ok: true, json: { bio: "hi", displayName: "Alice", public: false } },
      ]);
      const handler = await loadHandler();
      const r = await runHandler(handler, { method: "GET", query: { name: "alice" } });
      expect(r.statusCode).toBe(404);
    });

    it("returns the public profile with joined class/student counts", async () => {
      global.fetch = makeFetch([
        // 1. bio read
        { ok: true, json: { bio: "Cambridge-certified.", displayName: "Ms. Alice", languages: ["en", "ru"], subjects: ["IELTS"], public: true, updated: "2026-05-20T00:00:00Z" } },
        // 2. classes read (for class/student counts)
        { ok: true, json: [
          { id: "c1", teacherName: "alice", students: ["bob", "carol"] },
          { id: "c2", teacherName: "alice", students: ["bob", "dave"] },
          { id: "c3", teacherName: "other", students: ["x"] },
        ] },
      ]);
      const handler = await loadHandler();
      const r = await runHandler(handler, { method: "GET", query: { name: "alice" } });
      expect(r.statusCode).toBe(200);
      const body = JSON.parse(r.body);
      expect(body.name).toBe("alice");
      expect(body.displayName).toBe("Ms. Alice");
      expect(body.bio).toBe("Cambridge-certified.");
      expect(body.classCount).toBe(2);
      expect(body.studentCount).toBe(3); // bob, carol, dave (deduped)
    });

    it("tolerates the legacy nested-array classes wrapper", async () => {
      global.fetch = makeFetch([
        { ok: true, json: { bio: "ok", displayName: "T", public: true } },
        { ok: true, json: [[{ id: "c1", teacherName: "alice", students: ["bob"] }]] }, // nested
      ]);
      const handler = await loadHandler();
      const r = await runHandler(handler, { method: "GET", query: { name: "alice" } });
      expect(r.statusCode).toBe(200);
      const body = JSON.parse(r.body);
      expect(body.classCount).toBe(1);
      expect(body.studentCount).toBe(1);
    });
  });

  describe("POST", () => {
    it("returns 401 without a valid Bearer token", async () => {
      const handler = await loadHandler();
      const r = await runHandler(handler, { method: "POST", body: { bio: "x" } });
      expect(r.statusCode).toBe(401);
    });

    it("returns 403 when authenticated user owns zero classes", async () => {
      global.fetch = makeFetch([
        // findTeacherClasses → no matching class
        { ok: true, json: [{ id: "c1", teacherName: "someone-else", students: [] }] },
      ]);
      const handler = await loadHandler();
      const r = await runHandler(handler, {
        method: "POST",
        headers: { authorization: bearer("alice", "test-secret", Date.now() + 60_000) },
        body: { bio: "x" },
      });
      expect(r.statusCode).toBe(403);
    });

    it("upserts the bio when the authed user owns a class", async () => {
      global.fetch = makeFetch([
        // findTeacherClasses → match
        { ok: true, json: [{ id: "c1", teacherName: "alice", students: ["bob"] }] },
        // fbPut → ok
        { ok: true, json: {} },
      ]);
      const handler = await loadHandler();
      const r = await runHandler(handler, {
        method: "POST",
        headers: { authorization: bearer("alice", "test-secret", Date.now() + 60_000) },
        body: { bio: "Hi students!", displayName: "Ms. Alice", languages: ["en", "ru"], subjects: ["IELTS"], public: true },
      });
      expect(r.statusCode).toBe(200);
      const body = JSON.parse(r.body);
      expect(body.ok).toBe(true);
      expect(body.bio).toBe("Hi students!");
      expect(body.public).toBe(true);
    });

    it("trims/sanitizes inputs (strips newlines, caps lengths)", async () => {
      global.fetch = makeFetch([
        { ok: true, json: [{ id: "c1", teacherName: "alice" }] },
        { ok: true, json: {} },
      ]);
      const handler = await loadHandler();
      const longBio = "a".repeat(800);
      const r = await runHandler(handler, {
        method: "POST",
        headers: { authorization: bearer("alice", "test-secret", Date.now() + 60_000) },
        body: { bio: "hello\n\nworld", displayName: longBio, public: true, languages: ["en", "ru", "tr", "ar", "de", "es", "fr"] },
      });
      expect(r.statusCode).toBe(200);
      const body = JSON.parse(r.body);
      expect(body.bio).toBe("hello world"); // newlines collapsed to single space
      expect(body.displayName.length).toBeLessThanOrEqual(60);
      expect(body.languages).toHaveLength(5); // capped at 5
    });

    it("public flag defaults to false when omitted", async () => {
      global.fetch = makeFetch([
        { ok: true, json: [{ id: "c1", teacherName: "alice" }] },
        { ok: true, json: {} },
      ]);
      const handler = await loadHandler();
      const r = await runHandler(handler, {
        method: "POST",
        headers: { authorization: bearer("alice", "test-secret", Date.now() + 60_000) },
        body: { bio: "hi" },
      });
      expect(r.statusCode).toBe(200);
      const body = JSON.parse(r.body);
      expect(body.public).toBe(false);
    });
  });
});
