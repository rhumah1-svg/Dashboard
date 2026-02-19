import { useState } from "react";
import { login } from "./api";

// ─── THÈME ────────────────────────────────────────────────────────────────────
const T = {
  bg: "#F2F5F9", card: "#FFFFFF",
  border: "#E3E9F2", borderMd: "#C8D4E3",
  text: "#1A2640", textMed: "#475C78", textSoft: "#8BA0B8",
  indigo: "#5B72D4", indigoL: "#EDF0FB",
  teal: "#3A9E9E",
  rose: "#BF506A", roseL: "#FAEDF1",
};

export default function Login({ onLogin }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [warning, setWarning]   = useState("");
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) return;

    setLoading(true);
    setError("");
    setWarning("");

    try {
      const result = await login(email, password);
      if (result.warning) setWarning(result.warning);
      onLogin(result.user);
    } catch (err) {
      setError(err.message || "Identifiants invalides");
      setPassword("");
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = email.trim() && password.trim() && !loading;

  return (
    <div style={{
      background: T.bg, minHeight: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Nunito','Segoe UI',sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        input{font-family:'Nunito','Segoe UI',sans-serif;}
      `}</style>

      <div style={{
        background: T.card, border: `1px solid ${T.border}`,
        borderRadius: 16, padding: "40px 36px", width: 380,
        boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 52, height: 52,
            background: `linear-gradient(135deg,${T.indigo},${T.teal})`,
            borderRadius: 14, display: "flex", alignItems: "center",
            justifyContent: "center", margin: "0 auto 12px",
            boxShadow: `0 6px 20px ${T.indigo}44`,
          }}>
            <span style={{ fontSize: 24, fontWeight: 900, color: "#fff" }}>Q</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: T.text }}>QUALIDAL</div>
          <div style={{
            fontSize: 11, color: T.textSoft, letterSpacing: "0.1em",
            fontWeight: 600, marginTop: 2,
          }}>
            CRM — ACCÈS SÉCURISÉ
          </div>
        </div>

        {/* Champ email */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: T.textMed, fontWeight: 700, marginBottom: 8 }}>
            Email
          </div>
          <input
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && canSubmit && handleSubmit()}
            placeholder="votre.email@entreprise.fr"
            autoFocus
            autoComplete="email"
            style={{
              width: "100%", padding: "11px 14px",
              border: `1.5px solid ${error ? T.rose : T.border}`,
              borderRadius: 9, fontSize: 14, color: T.text,
              background: T.bg, outline: "none", fontFamily: "inherit",
              transition: "border-color 0.15s",
            }}
          />
        </div>

        {/* Champ mot de passe */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: T.textMed, fontWeight: 700, marginBottom: 8 }}>
            Mot de passe
          </div>
          <input
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && canSubmit && handleSubmit()}
            placeholder="••••••••"
            autoComplete="current-password"
            style={{
              width: "100%", padding: "11px 14px",
              border: `1.5px solid ${error ? T.rose : T.border}`,
              borderRadius: 9, fontSize: 14, color: T.text,
              background: error ? T.roseL : T.bg,
              outline: "none", fontFamily: "inherit",
              transition: "border-color 0.15s, background 0.15s",
            }}
          />
          {error && (
            <div style={{ fontSize: 12, color: T.rose, marginTop: 8, fontWeight: 600 }}>
              {error}
            </div>
          )}
          {warning && (
            <div style={{
              fontSize: 11, color: T.textSoft, marginTop: 8, padding: "8px 10px",
              background: "#FFF8E1", border: "1px solid #FFE082", borderRadius: 6,
            }}>
              ⚠️ {warning}
            </div>
          )}
        </div>

        {/* Bouton */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={{
            width: "100%", padding: "12px",
            background: `linear-gradient(135deg,${T.indigo},${T.teal})`,
            border: "none", borderRadius: 9, color: "#fff",
            fontSize: 14, fontWeight: 700,
            cursor: loading ? "wait" : canSubmit ? "pointer" : "default",
            opacity: canSubmit ? 1 : 0.5,
            transition: "opacity 0.15s",
            boxShadow: `0 4px 14px ${T.indigo}44`,
          }}
        >
          {loading ? "Connexion en cours…" : "Se connecter"}
        </button>

        <div style={{ fontSize: 11, color: T.textSoft, textAlign: "center", marginTop: 20 }}>
          Connectez-vous avec votre compte Qualidal
        </div>
      </div>
    </div>
  );
}
