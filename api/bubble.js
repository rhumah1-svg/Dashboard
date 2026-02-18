// On utilise la syntaxe compatible Node.js standard
module.exports = async (req, res) => {

  // --- 1. SÉCURITÉ : LISTE BLANCHE ---
  const ALLOWED_TABLES = ['Companies', 'Items_devis', 'Contacts' 'Offers_history_documents', 'Projects', 'Interventions', 'Users']; 

  // --- 2. SÉCURITÉ : CORS ---
  // Remplace par ton URL exacte
  const ALLOWED_ORIGIN = "https://dashboard-eta-liard-55.vercel.app";

  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-secret-token");

  // Gestion de la requête "Preflight"
  if (req.method === "OPTIONS") { 
    res.status(200).end(); 
    return; 
  }

  const { table, cursor = 0 } = req.query;

  // --- VÉRIFICATION DU PARAMÈTRE TABLE ---
  if (!table) {
    return res.status(400).json({ error: "Missing table parameter" });
  }

  // --- APPLICATION DU VERROU 1 (Whitelist) ---
  if (!ALLOWED_TABLES.includes(table)) {
    console.warn(`Tentative d'accès bloquée à la table : ${table}`);
    return res.status(403).json({ error: "Accès interdit : Table non autorisée." });
  }

  // --- APPLICATION DU VERROU 2 (Secret Token) ---
  // On vérifie que le header contient le bon mot de passe
  const clientToken = req.headers['x-secret-token'];
  const serverSecret = process.env.MY_INTERNAL_SECRET;

  if (clientToken !== serverSecret) {
     console.warn("Tentative d'accès sans le bon token secret");
     return res.status(401).json({ error: "Non autorisé (Token invalide)" });
  }

  try {
    // Récupération de la clé API Bubble depuis Vercel
    const bubbleApiKey = process.env.BUBBLE_API_KEY; 

    if (!bubbleApiKey) {
        throw new Error("La clé API Bubble n'est pas configurée dans Vercel");
    }

    // Appel vers Bubble
    const response = await fetch(
      `https://www.portail-qualidal.com/version-test/api/1.1/obj/${table}?limit=100&cursor=${cursor}`,
      {
        headers: {
          Authorization: `Bearer ${bubbleApiKey}`,
        },
      }
    );
    
    if (!response.ok) {
        throw new Error(`Erreur Bubble: ${response.statusText}`);
    }

    const data = await response.json();
    return res.status(200).json(data);
    
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
