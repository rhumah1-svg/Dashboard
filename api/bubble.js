import crypto from "crypto";

// ═══════════════════════════════════════════════════════════════════════════════
// /api/bubble.js — Proxy sécurisé vers Bubble Data API
// ═══════════════════════════════════════════════════════════════════════════════
//
// AVANT (❌ INSÉCURISÉ) :
//   GET /api/bubble?table=companies&secret=qd_x9k2m7p4nz3
//   → Le secret était en dur dans le code frontend, visible par tous
//
// APRÈS (✅ SÉCURISÉ) :
//   GET /api/bubble?table=companies&cursor=0
//   Authorization: Bearer <token signé par /api/auth>
//   → Le token est signé avec DASHBOARD_SECRET côté serveur
//   → BUBBLE_API_KEY n'est JAMAIS exposé au frontend
// ═══════════════════════════════════════════════════════════════════════════════

const BUBBLE_BASE = process.env.BUBBLE_BASE_URL || "https://www.portail-qualidal.com/version-test";

const ALLOWED_TABLES = [
  "companies",
  "projects",
  "interventions",
  "offers_history_documents",
  "items_devis",
  "contacts",
  "contact_projet",
  "user",
];

function validateToken(token, secret) {
  if (!token || typeof token !== "string") return null;
  const dotIndex = token.indexOf(".");
  if (dotIndex === -1) return null;

  const payloadB64 = token.slice(0, dotIndex);
  const sig = token.slice(dotIndex + 1);

  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(payloadB64)
    .digest("base64url");

  // Comparaison timing-safe pour éviter les timing attacks
  if (sig.length !== expectedSig.length) return null;
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (!crypto.timingSafeEqual(sigBuf, expBuf)) return null;

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString());
    if (!payload.exp || payload.exp < Date.now()) return null; // expiré
    if (!payload.email) return null; // token malformé
    return payload;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  // ── CORS ────────────────────────────────────────────────────────────────
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  // ── Authentification par token signé ────────────────────────────────────
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const DASHBOARD_SECRET = process.env.DASHBOARD_SECRET;

  if (!DASHBOARD_SECRET) {
    console.error("[bubble] DASHBOARD_SECRET non configuré");
    return res.status(500).json({ error: "Configuration serveur incomplète" });
  }

  const user = validateToken(token, DASHBOARD_SECRET);
  if (!user) {
    return res.status(401).json({ error: "Non authentifié — token invalide ou expiré" });
  }

  // ── Validation de la requête ────────────────────────────────────────────
  const { table, cursor = 0, constraints } = req.query;

  if (!table) {
    return res.status(400).json({ error: "Paramètre 'table' manquant" });
  }
  if (!ALLOWED_TABLES.includes(table)) {
    return res.status(403).json({ error: `Table "${table}" non autorisée` });
  }

  const BUBBLE_API_KEY = process.env.BUBBLE_API_KEY;
  if (!BUBBLE_API_KEY) {
    console.error("[bubble] BUBBLE_API_KEY non configuré");
    return res.status(500).json({ error: "Clé API non configurée" });
  }

  // ── Proxy vers Bubble ───────────────────────────────────────────────────
  try {
    let url = `${BUBBLE_BASE}/api/1.1/obj/${table}?limit=100&cursor=${cursor}`;
    if (constraints) url += `&constraints=${encodeURIComponent(constraints)}`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${BUBBLE_API_KEY}` },
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    console.error("[bubble] Erreur proxy:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
