const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

export const handler = async function (event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS, body: "" };
  }

  const DB = (process.env.FIREBASE_DB_URL || "").replace(/\/$/, "");

  // health-check
  if (!((event.queryStringParameters || {}).key) && event.httpMethod === "GET") {
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ status: "ok", db: !!DB }) };
  }

  if (!DB) {
    return { statusCode: 503, headers: CORS, body: JSON.stringify({ error: "FIREBASE_DB_URL not set" }) };
  }

  try {
    if (event.httpMethod === "GET") {
      const key = (event.queryStringParameters || {}).key;
      const r = await fetch(`${DB}/rq/${encodeURIComponent(key)}.json`);
      const data = await r.json();
      return {
        statusCode: 200,
        headers: CORS,
        body: JSON.stringify({ value: data !== null && data !== undefined ? JSON.stringify(data) : null }),
      };
    }

    if (event.httpMethod === "POST") {
      const { key, value } = JSON.parse(event.body || "{}");
      if (!key) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Missing key" }) };
      await fetch(`${DB}/rq/${encodeURIComponent(key)}.json`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: value,
      });
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true }) };
    }

    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: "Method not allowed" }) };
  } catch (e) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message }) };
  }
};
