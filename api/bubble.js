export default async function handler(req, res) {
  // --- 1. SÉCURITÉ : LISTE BLANCHE (VERROU 1) ---
  // Liste EXHAUSTIVE des tables que ton dashboard a le droit de lire.
  // Modifie cette liste avec les vrais noms de tes tables Bubble (en minuscules souvent).
  const ALLOWED_TABLES = ['Companies', 'Items_devis', 'Contacts' 'Offers_history_documents', 'Projects', 'Interventions', 'Users']; 

  // --- 2. SÉCURITÉ : CORS (VERROU 2) ---
  // Remplace '*' par l'URL exacte de ton frontend pour empêcher les autres sites de t'utiliser.
  const ALLOWED_ORIGIN = "https://dashboard-eta-liard-55.vercel.app";

  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  
  // Gestion de la requête "Preflight" (Le navigateur demande la permission)
  if (req.method === "OPTIONS") { 
    res.status(200).end(); 
    return; 
  }

  const { table, cursor = 0 } = req.query;

  // --- VÉRIFICATION DU PARAMÈTRE TABLE ---
  if (!table) {
    res.status(400).json({ error: "Missing table parameter" });
    return;
  }

  // --- APPLICATION DU VERROU 1 ---
  // Si la table demandée n'est pas dans la liste, on rejette l'appel.
  if (!ALLOWED_TABLES.includes(table)) {
    console.warn(`Tentative d'accès bloquée à la table : ${table}`);
    res.status(403).json({ error: "Accès interdit : Table non autorisée." });
    return;
  }

  try {
    // Note : J'ai remplacé la clé en dur par process.env.BUBBLE_API_KEY
    // Tu dois ajouter BUBBLE_API_KEY dans tes réglages Vercel.
    const bubbleApiKey = process.env.BUBBLE_API_KEY; 

    if (!bubbleApiKey) {
        throw new Error("La clé API n'est pas configurée dans Vercel");
    }

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
    res.status(200).json(data);
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
