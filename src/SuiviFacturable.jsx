import React, { useState, useMemo } from "react";

// ─── THÈME ET UTILITAIRES ─────────────────────────────────────────────────────
const T = {
  bg: "#F2F5F9", card: "#FFFFFF", cardAlt: "#F8FAFC", border: "#E3E9F2",
  text: "#1A2640", textMed: "#475C78", textSoft: "#8BA0B8",
  indigo: "#5B72D4", teal: "#3A9E9E", sage: "#4E9468", 
  amber: "#C07A2E", rose: "#BF506A", sky: "#3E8EBF",
};

const fmt = n => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);

function Badge({ label }) {
  const S_COLOR = { "Sain": T.sage, "Alerte Facturation": T.rose, "Retard Chantier": T.rose, "Risque Tréso": T.amber };
  const c = S_COLOR[label] || T.textSoft;
  return <span style={{ fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 20, color: c, background: `${c}15`, border: `1px solid ${c}30`, whiteSpace: "nowrap" }}>{label}</span>;
}

function KpiCard({ label, value, sub, color, pct = 0, icon }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "20px", boxShadow: "0 2px 6px rgba(0,0,0,0.05)", borderLeft: `4px solid ${color}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 10, color: T.textSoft, fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: color, marginBottom: 4 }}>{value}</div>
          <div style={{ fontSize: 11, color: T.textMed }}>{sub}</div>
        </div>
        <div style={{ fontSize: 22, opacity: 0.8 }}>{icon}</div>
      </div>
      <div style={{ height: 4, background: T.border, borderRadius: 2, marginTop: 14 }}>
        <div style={{ height: 4, background: color, width: `${Math.min(pct, 100)}%`, borderRadius: 2 }} />
      </div>
    </div>
  );
}

function SortableHeader({ label, sortKey, current, dir, onSort }) {
  const active = current === sortKey;
  return (
    <div onClick={() => onSort(sortKey)} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: active ? T.indigo : T.textSoft, userSelect: "none" }}>
      {label}
      <span style={{ fontSize: 10, opacity: active ? 1 : 0.3 }}>{active ? (dir === "asc" ? "▲" : "▼") : "↕"}</span>
    </div>
  );
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────
export default function SuiviFacturable({ projects = [] }) {
  const [search, setSearch] = useState("");
  // Tri par défaut : on met les plus grosses "urgences" (nonFacture) en haut
  const [sortBy, setSortBy] = useState("nonFacture");
  const [sortDir, setSortDir] = useState("desc");

  const today = useMemo(() => new Date(), []);

  const handleSort = (key) => {
    if (sortBy === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(key); setSortDir("desc"); }
  };

  const processedData = useMemo(() => {
    // 1. Calculs
    let rows = projects.map(p => {
      const start = p.date_debut ? new Date(p.date_debut) : null;
      const end = p.date_fin ? new Date(p.date_fin) : null;
      
      const totalDur = (start && end) ? end - start : 0;
      const elapsed = start ? today - start : 0;
      const pctTime = totalDur > 0 ? Math.min(Math.max(Math.round((elapsed / totalDur) * 100), 0), 100) : (start ? 100 : 0);
      
      const pctFacture = p.total_ht > 0 ? Math.round((p.total_facture / p.total_ht) * 100) : 0;
      const pctProd = p.total_ht > 0 ? Math.round((p.total_prod / p.total_ht) * 100) : 0;
      
      const backlog = Math.max((p.total_ht || 0) - (p.total_facture || 0), 0);
      const nonFacture = Math.max((p.total_prod || 0) - (p.total_facture || 0), 0);

      let health = "Sain";
      if (pctProd > pctFacture + 20) health = "Alerte Facturation"; 
      else if (pctTime > pctProd + 15) health = "Retard Chantier";   
      else if (pctProd > pctFacture + 10) health = "Risque Tréso";

      return { ...p, pctTime, pctFacture, pctProd, backlog, nonFacture, health };
    });

    // 2. Recherche
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(p => (p.name || "").toLowerCase().includes(q) || (p.client_name || "").toLowerCase().includes(q));
    }

    // 3. Tri Manuel
    return rows.sort((a, b) => {
      let va = a[sortBy], vb = b[sortBy];
      if (sortBy === "name") { va = (a.name || "").toLowerCase(); vb = (b.name || "").toLowerCase(); }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [projects, search, today, sortBy, sortDir]);

  // KPIs globaux
  const totalBacklog = projects.reduce((sum, p) => sum + Math.max((p.total_ht || 0) - (p.total_facture || 0), 0), 0);
  const totalUrgent = projects.reduce((sum, p) => sum + Math.max((p.total_prod || 0) - (p.total_facture || 0), 0), 0);
  const totalFactureGlobal = projects.reduce((sum, p) => sum + (p.total_facture || 0), 0);
  const totalMontantGlobal = projects.reduce((sum, p) => sum + (p.total_ht || 0), 0);
  const tauxGlobal = totalMontantGlobal > 0 ? Math.round((totalFactureGlobal / totalMontantGlobal) * 100) : 0;
  const alertesCount = processedData.filter(p => p.health !== "Sain").length;

  return (
    <div style={{ fontFamily: "'Nunito', sans-serif", color: T.text, paddingBottom: 40 }}>
      {/* CARTES KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
        <KpiCard label="Reste à Facturer" value={fmt(totalBacklog)} sub="Sur carnet de commandes" color={T.indigo} pct={100} icon="💶"/>
        <KpiCard label="Dû (Produit non facturé)" value={fmt(totalUrgent)} sub="Urgence Trésorerie" color={T.amber} pct={80} icon="⚠️"/>
        <KpiCard label="Taux d'encaissement" value={`${tauxGlobal}%`} sub="Global facturé" color={T.teal} pct={tauxGlobal} icon="📈"/>
        <KpiCard label="Chantiers en alerte" value={alertesCount} sub="Décalage constaté" color={alertesCount > 0 ? T.rose : T.sage} pct={alertesCount * 10} icon="⏱️"/>
      </div>

      {/* TABLEAU */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 6px rgba(0,0,0,0.04)" }}>
        
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, background: T.cardAlt, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: T.textSoft }}>⌕</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Chercher un chantier..." style={{ padding: "8px 32px 8px 30px", background: T.card, border: `1.5px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 12, outline: "none", width: 280 }} />
          </div>
          <span style={{ fontSize: 11, color: T.textSoft }}>Clique sur l'en-tête d'une colonne pour trier</span>
        </div>

        {/* EN-TÊTE TRIABLE */}
        <div style={{ display: "grid", gridTemplateColumns: "220px 1fr 150px 150px 140px", gap: 10, padding: "14px 20px", background: T.cardAlt, borderBottom: `2px solid ${T.border}` }}>
          <SortableHeader label="PROJET / CLIENT" sortKey="name" current={sortBy} dir={sortDir} onSort={handleSort} />
          <span style={{ fontSize: 11, color: T.textSoft, fontWeight: 700 }}>AVANCEMENT (Tps / Prod / Fac)</span>
          <SortableHeader label="RESTE À FACTURER" sortKey="backlog" current={sortBy} dir={sortDir} onSort={handleSort} />
          <SortableHeader label="NON FACTURÉ" sortKey="nonFacture" current={sortBy} dir={sortDir} onSort={handleSort} />
          <SortableHeader label="STATUT" sortKey="health" current={sortBy} dir={sortDir} onSort={handleSort} />
        </div>

        {/* LISTE SCROLLABLE */}
        <div style={{ maxHeight: "550px", overflowY: "auto" }}>
          {processedData.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: T.textSoft, fontSize: 13 }}>Aucun chantier ne correspond.</div>
          ) : (
            processedData.map((p, idx) => (
              <div key={p.id} style={{ display: "grid", gridTemplateColumns: "220px 1fr 150px 150px 140px", gap: 10, padding: "16px 20px", borderBottom: `1px solid ${T.border}`, alignItems: "center", background: idx % 2 === 0 ? T.card : "#FAFAFA" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: T.text, marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: T.textSoft, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.client_name}</div>
                </div>

                {/* 3 BARRES */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingRight: 30 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 10 }}>
                    <span style={{ width: 35, color: T.sky, fontWeight: 700 }}>Tps</span>
                    <div style={{ flex: 1, height: 5, background: T.border, borderRadius: 3 }}><div style={{ height: "100%", width: `${p.pctTime}%`, background: T.sky, borderRadius: 3 }} /></div>
                    <span style={{ width: 26, textAlign: "right", color: T.sky, fontWeight: 700 }}>{p.pctTime}%</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 10 }}>
                    <span style={{ width: 35, color: T.amber, fontWeight: 700 }}>Prod</span>
                    <div style={{ flex: 1, height: 5, background: T.border, borderRadius: 3 }}><div style={{ height: "100%", width: `${p.pctProd}%`, background: T.amber, borderRadius: 3 }} /></div>
                    <span style={{ width: 26, textAlign: "right", color: T.amber, fontWeight: 700 }}>{p.pctProd}%</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 10 }}>
                    <span style={{ width: 35, color: T.sage, fontWeight: 700 }}>Fac</span>
                    <div style={{ flex: 1, height: 5, background: T.border, borderRadius: 3 }}><div style={{ height: "100%", width: `${p.pctFacture}%`, background: T.sage, borderRadius: 3 }} /></div>
                    <span style={{ width: 26, textAlign: "right", color: T.sage, fontWeight: 700 }}>{p.pctFacture}%</span>
                  </div>
                </div>

                <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>{fmt(p.backlog)}</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: p.nonFacture > 0 ? T.amber : T.textSoft }}>
                  {p.nonFacture > 0 ? `+ ${fmt(p.nonFacture)}` : "À jour"}
                </div>
                <Badge label={p.health} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
