import { useState } from "react";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
// Pour changer le mot de passe :
// 1. Va sur https://emn178.github.io/online-tools/sha256.html
// 2. Entre ton nouveau mot de passe
// 3. Remplace le hash ci-dessous
// Mot de passe actuel : qualidal2025
const PASSWORD_HASH = "ef74f84b878e32b49c631409f20c6007fc5cf9d586b56260b30e6b012ad47a72";
// ↑ REMPLACE CE HASH par le vrai (celui-ci est un placeholder)

const T = {
  bg:"#F2F5F9", card:"#FFFFFF",
  border:"#E3E9F2", borderMd:"#C8D4E3",
  text:"#1A2640", textMed:"#475C78", textSoft:"#8BA0B8",
  indigo:"#5B72D4", indigoL:"#EDF0FB",
  teal:"#3A9E9E",
  rose:"#BF506A", roseL:"#FAEDF1",
};

async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

export default function Login({ onLogin }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!password.trim()) return;
    setLoading(true);
    setError(false);
    const hash = await sha256(password.trim());
    if (hash === PASSWORD_HASH) {
      sessionStorage.setItem("qd_auth", "1");
      onLogin();
    } else {
      setError(true);
      setPassword("");
    }
    setLoading(false);
  };

  return (
    <div style={{
      background: T.bg, minHeight: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Nunito','Segoe UI',sans-serif"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
      `}</style>

      <div style={{
        background: T.card, border: `1px solid ${T.border}`,
        borderRadius: 16, padding: "40px 36px", width: 360,
        boxShadow: "0 8px 32px rgba(0,0,0,0.08)"
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 52, height: 52,
            background: `linear-gradient(135deg,${T.indigo},${T.teal})`,
            borderRadius: 14, display: "flex", alignItems: "center",
            justifyContent: "center", margin: "0 auto 12px",
            boxShadow: `0 6px 20px ${T.indigo}44`
          }}>
            <span style={{ fontSize: 24, fontWeight: 900, color: "#fff" }}>Q</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: T.text }}>QUALIDAL</div>
          <div style={{ fontSize: 11, color: T.textSoft, letterSpacing: "0.1em", fontWeight: 600, marginTop: 2 }}>
            CRM — ACCÈS RESTREINT
          </div>
        </div>

        {/* Champ mot de passe */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: T.textMed, fontWeight: 700, marginBottom: 8 }}>
            Mot de passe
          </div>
          <input
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(false); }}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            placeholder="••••••••"
            autoFocus
            style={{
              width: "100%", padding: "11px 14px",
              border: `1.5px solid ${error ? T.rose : T.border}`,
              borderRadius: 9, fontSize: 14, color: T.text,
              background: error ? T.roseL : T.bg,
              outline: "none", fontFamily: "inherit",
              transition: "border-color 0.15s, background 0.15s"
            }}
          />
          {error && (
            <div style={{ fontSize: 12, color: T.rose, marginTop: 6, fontWeight: 600 }}>
              Mot de passe incorrect
            </div>
          )}
        </div>

        {/* Bouton */}
        <button
          onClick={handleSubmit}
          disabled={loading || !password.trim()}
          style={{
            width: "100%", padding: "12px",
            background: `linear-gradient(135deg,${T.indigo},${T.teal})`,
            border: "none", borderRadius: 9, color: "#fff",
            fontSize: 14, fontWeight: 700, cursor: loading ? "wait" : "pointer",
            opacity: !password.trim() ? 0.5 : 1,
            transition: "opacity 0.15s",
            boxShadow: `0 4px 14px ${T.indigo}44`
          }}
        >
          {loading ? "Vérification…" : "Se connecter"}
        </button>

        <div style={{ fontSize: 11, color: T.textSoft, textAlign: "center", marginTop: 20 }}>
          Accès réservé à l'équipe Qualidal
        </div>
      </div>
    </div>
  );
}
