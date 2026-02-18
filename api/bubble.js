export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") { res.status(200).end(); return; }

  const { table, cursor = 0 } = req.query;

  if (!table) {
    res.status(400).json({ error: "Missing table parameter" });
    return;
  }

  try {
    const response = await fetch(
      `https://www.portail-qualidal.com/version-test/api/1.1/obj/${table}?limit=100&cursor=${cursor}`,
      {
        headers: {
          Authorization: "Bearer test_f92090a3c34a5a84387182092bf29434",
        },
      }
    );
    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
