const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

export const handler = async function (event) {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: CORS, body: "" };
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const DB = (process.env.FIREBASE_DB_URL || "").replace(/\/$/, "");
  if (!DB) return { statusCode: 503, headers: CORS, body: JSON.stringify({ error: "DB not configured" }) };

  try {
    const r = await fetch(`${DB}/rq/rq-users-v6.json`);
    const data = await r.json();
    const list = Array.isArray(data) ? data : [];
    // Strip hash field — credentials never leave the server
    const sanitized = list.map(function ({ hash, ...rest }) { return rest; });
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ users: sanitized }) };
  } catch (e) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message }) };
  }
};
