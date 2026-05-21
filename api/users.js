export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const DB = (process.env.FIREBASE_DB_URL || "").replace(/\/$/, "");
  if (!DB) return res.status(503).json({ error: "DB not configured" });

  const fbAuth = process.env.FIREBASE_DB_SECRET ? `?auth=${process.env.FIREBASE_DB_SECRET}` : "";

  try {
    const r = await fetch(`${DB}/rq/rq-users-v6.json${fbAuth}`);
    const data = await r.json();
    if (data && typeof data === "object" && !Array.isArray(data) && typeof data.error === "string") {
      return res.status(502).json({ error: `Firebase: ${data.error}` });
    }
    const list = Array.isArray(data) ? data : [];
    // Strip hash field — credentials never leave the server
    const sanitized = list.map(function ({ hash, ...rest }) { return rest; });
    return res.status(200).json({ users: sanitized });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
