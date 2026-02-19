import crypto from "crypto";

// ═══════════════════════════════════════════════════════════════════════════════
// /api/auth.js — Authentification Bubble → Token signé
// ═══════════════════════════════════════════════════════════════════════════════
//
// ENV VARIABLES REQUISES (Vercel → Settings → Environment Variables) :
//   BUBBLE_API_KEY      → Bearer token Bubble (Data API)
//   DASHBOARD_SECRET    → Clé de signature des tokens (min 20 chars)
//   BUBBLE_BASE_URL     → (optionnel) défaut: https://www.portail-qualidal.com/version-test
//
// PRÉREQUIS BUBBLE :
//   Créer un Backend Workflow exposé en API nommé "dashboard_login" :
//     - Paramètres : email (text), password (text)
//     - Action 1 : "Log the user in" avec email + password
//     - Action 2 : Return data from API →
//         success: "yes"
//         user_email: Current User's email
//         user_name:  Current User's first_last_name (ou champ nom)
//     - Si le login échoue, Bubble renvoie une erreur 401 automatiquement
//
//   ⚠️ Dans Settings → API → cocher "Enable Workflow API"
//   ⚠️ Le workflow doit être "Exposed as a public API workflow" = NON
//       (il sera appelé avec le Bearer token)
// ═══════════════════════════════════════════════════════════════════════════════

const BUBBLE_BASE = process.env.BUBBLE_BASE_URL || "https://www.portail-qualidal.com/version-test";
const TOKEN_DURATION_MS = 24 * 60 * 60 * 1000; // 24 heures

function createSignedToken(payload, secret) {
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(payloadB64).digest("base64url");
  return `${payloadB64}.${sig}`;
}

export default async function handler(req, res) {
  // ── CORS ────────────────────────────────────────────────────────────────
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST uniquement" });

  // ── Validation entrée ───────────────────────────────────────────────────
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email et mot de passe requis" });
  }

  const BUBBLE_API_KEY    = process.env.BUBBLE_API_KEY;
  const DASHBOARD_SECRET  = process.env.DASHBOARD_SECRET;

  if (!BUBBLE_API_KEY || !DASHBOARD_SECRET) {
    console.error("[auth] Variables d'environnement manquantes");
    return res.status(500).json({ error: "Configuration serveur incomplète" });
  }

  try {
    // ── Méthode 1 : Appel du workflow Bubble "dashboard_login" ──────────
    // C'est la méthode recommandée car elle valide le vrai mot de passe Bubble
    const wfRes = await fetch(`${BUBBLE_BASE}/api/1.1/wf/dashboard_login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${BUBBLE_API_KEY}`,
      },
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    });

    if (wfRes.ok) {
      const wfData = await wfRes.json();

      // Le workflow a réussi → l'utilisateur est un User Bubble valide
      const userEmail = wfData.user_email || email.trim().toLowerCase();
      const userName  = wfData.user_name  || userEmail.split("@")[0];

      const token = createSignedToken(
        { email: userEmail, name: userName, exp: Date.now() + TOKEN_DURATION_MS },
        DASHBOARD_SECRET
      );

      return res.status(200).json({
        token,
        user: { email: userEmail, name: userName },
      });
    }

    // ── Méthode 2 (fallback) : Vérifier que l'user existe dans Bubble ───
    // Si le workflow n'existe pas encore (404) ou que Bubble renvoie une erreur,
    // on tente de vérifier via la Data API que l'email est dans la table User.
    // ⚠️ MOINS SÉCURISÉ : ne valide pas le mot de passe Bubble.
    //     À utiliser UNIQUEMENT en attendant de créer le workflow dashboard_login.
    if (wfRes.status === 404 || wfRes.status === 400) {
      console.warn("[auth] Workflow dashboard_login introuvable — fallback Data API");

      const searchRes = await fetch(
        `${BUBBLE_BASE}/api/1.1/obj/user?constraints=${encodeURIComponent(
          JSON.stringify([{ key: "email", constraint_type: "equals", value: email.trim().toLowerCase() }])
        )}`,
        { headers: { Authorization: `Bearer ${BUBBLE_API_KEY}` } }
      );

      if (!searchRes.ok) {
        console.error("[auth] Erreur recherche User:", searchRes.status);
        return res.status(401).json({ error: "Identifiants invalides" });
      }

      const searchData = await searchRes.json();
      const users = searchData.response?.results || [];

      if (users.length === 0) {
        return res.status(401).json({ error: "Aucun compte trouvé avec cet email" });
      }

      // L'user existe dans Bubble → on l'accepte (mode dégradé)
      const user = users[0];
      const userEmail = user.email || email.trim().toLowerCase();
      const userName  = user.first_last_name || user.name || userEmail.split("@")[0];

      const token = createSignedToken(
        {
          email: userEmail,
          name: userName,
          exp: Date.now() + TOKEN_DURATION_MS,
          fallback: true, // indique que le password n'a PAS été validé
        },
        DASHBOARD_SECRET
      );

      return res.status(200).json({
        token,
        user: { email: userEmail, name: userName },
        warning: "Mode dégradé : créez le workflow Bubble 'dashboard_login' pour valider les mots de passe",
      });
    }

    // Bubble a renvoyé 401/403 → mauvais identifiants
    return res.status(401).json({ error: "Email ou mot de passe incorrect" });
  } catch (err) {
    console.error("[auth] Erreur:", err.message);
    return res.status(500).json({ error: "Erreur serveur lors de l'authentification" });
  }
}
