// Helpers for testing Vercel-style api/*.js handlers that use (req, res).
// Mirrors the surface used by api/*.js: req.method, .query, .headers, .body
// and res.status().json() / res.setHeader() / res.end().

export function makeReq(overrides = {}) {
  return {
    method: "GET",
    query: {},
    headers: {},
    body: undefined,
    ...overrides,
  };
}

export function makeRes() {
  const captured = { statusCode: 200, headers: {}, body: null, ended: false };
  const res = {
    setHeader(k, v) { captured.headers[k] = v; return res; },
    getHeader(k) { return captured.headers[k]; },
    status(code) { captured.statusCode = code; return res; },
    json(obj) { captured.body = JSON.stringify(obj); captured.ended = true; return res; },
    send(payload) { captured.body = payload == null ? null : String(payload); captured.ended = true; return res; },
    end() { captured.ended = true; return res; },
  };
  res.captured = captured;
  return res;
}

// Convenience: run a handler with the given req and return the captured response.
export async function runHandler(handler, reqOverrides = {}) {
  const req = makeReq(reqOverrides);
  const res = makeRes();
  await handler(req, res);
  return res.captured;
}
