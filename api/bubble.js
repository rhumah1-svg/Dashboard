export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") { res.status(200).end(); return; }

  // Vérification token secret — bloque toute requête sans le bon secret
  const secret = req.query.secret;
  if (!secret || secret !== process.env.DASHBOARD_SECRET) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { table, cursor = 0 } = req.query;
  if (!table) { res.status(400).json({ error: "Missing table" }); return; }

  // Token Bubble lu depuis variable d'environnement — jamais exposé au client
  const token = process.env.BUBBLE_API_KEY;
  if (!token) { res.status(500).json({ error: "API key not configured" }); return; }

  try {
    const response = await fetch(
      `https://www.portail-qualidal.com/version-test/api/1.1/obj/${table}?limit=100&cursor=${cursor}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
