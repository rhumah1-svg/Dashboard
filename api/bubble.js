export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");
  
  const { table, cursor = 0 } = req.query;
  
  const response = await fetch(
    `https://www.portail-qualidal.com/version-test/api/1.1/obj/${table}?limit=100&cursor=${cursor}`,
    { headers: { Authorization: "Bearer test_f92090a3c34a5a84387182092bf29434" } }
  );
  
  const data = await response.json();
  res.json(data);
}
