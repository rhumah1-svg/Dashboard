import React, { useState, useMemo } from "react";

// ─── THÈME ────────────────────────────────────────────────────────────────────
const T = {
  bg: "#F2F5F9", card: "#FFFFFF", cardAlt: "#F8FAFC", border: "#E3E9F2",
  borderMd: "#C8D4E3", text: "#1A2640", textMed: "#475C78", textSoft: "#8BA0B8",
  indigo: "#5B72D4", indigoL: "#EDF0FB",
  teal: "#3A9E9E",   tealL: "#E6F5F5",
  sage: "#4E9468",   sageL: "#E8F4EE",
  amber: "#C07A2E",  amberL: "#FBF0E4",
  rose: "#BF506A",   roseL: "#FAEDF1",
  sky: "#3E8EBF",    skyL: "#E5F3FA",
  violet: "#7E5BB5",
};

const fmt = n => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n || 0);
const fmtK = n => n >= 1000000 ? `${(n/1000000).toFixed(1)}M€` : n >= 1000 ? `${Math.round(n/1000)}k€` : `${Math.round(n)}€`;
const pct = (a, b) => b > 0 ? Math.min(Math.round((a / b) * 100), 100) : 0;

// ─── BADGE SANTÉ ──────────────────────────────────────────────────────────────
function HealthBadge({ label }) {
  const colors = {
    "Sain":                { c: T.sage,   bg: T.sageL  },
    "Alerte Facturation":  { c: T.rose,   bg: T.roseL  },
    "Retard Chantier":     { c: T.sky,    bg: T.skyL   },
    "Risque Tréso":        { c: T.amber,  bg: T.amberL },
  };
  const { c, bg } = colors[label] || { c: T.textSoft, bg: T.cardAlt };
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 20,
      color: c, background: bg, border: `1px solid ${c}30`, whiteSpace: "nowrap" }}>
      {label}
    </span>
  );
}

// ─── KPI CARD ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color, pct: p = 0, icon }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12,
      padding: "20px", boxShadow: "0 2px 6px rgba(0,0,0,0.05)", borderLeft: `4px solid ${color}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 10, color: T.textSoft, fontWeight: 700, textTransform: "uppercase",
            letterSpacing: "0.07em", marginBottom: 8 }}>{label}</div>
          <div style={{ fontSize: 22, fontWeight: 800, color, marginBottom: 4 }}>{value}</div>
          <div style={{ fontSize: 11, color: T.textMed }}>{sub}</div>
        </div>
        <div style={{ fontSize: 22, opacity: 0.75 }}>{icon}</div>
      </div>
      <div style={{ height: 4, background: T.border, borderRadius: 2, marginTop: 14 }}>
        <div style={{ height: 4, background: color, width: `${Math.min(p, 100)}%`, borderRadius: 2, transition: "width 0.6s" }} />
      </div>
    </div>
  );
}

// ─── EN-TÊTE DE COLONNE TRIABLE ───────────────────────────────────────────────
function ColHead({ label, sortKey, current, dir, onSort }) {
  const active = current === sortKey;
  return (
    <div onClick={() => onSort(sortKey)}
      style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
        fontSize: 11, fontWeight: 700, userSelect: "none",
        color: active ? T.indigo : T.textSoft }}>
      {label}
      <span style={{ fontSize: 9, opacity: active ? 1 : 0.3 }}>{active ? (dir === "asc" ? "▲" : "▼") : "↕"}</span>
    </div>
  );
}

// ─── BARRE DE PROGRESSION (cappée à 100%) ─────────────────────────────────────
function Bar3({ pctTime, pctProd, pctFac }) {
  const safeTime = Math.min(pctTime, 100);
  const safeProd = Math.min(pctProd, 100);
  const safeFac  = Math.min(pctFac,  100);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {[
        { label: "Tps",  val: safeTime, raw: pctTime, color: T.sky   },
        { label: "Prod", val: safeProd, raw: pctProd, color: T.amber  },
        { label: "Fac",  val: safeFac,  raw: pctFac,  color: T.sage  },
      ].map(({ label, val, raw, color }) => (
        <div key={label} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 10 }}>
          <span style={{ width: 28, color, fontWeight: 700 }}>{label}</span>
          <div style={{ flex: 1, height: 5, background: T.border, borderRadius: 3, overflow: "hidden" }}>
            {/* ← overflow:hidden + cap à 100% = barre ne dépasse jamais */}
            <div style={{ height: "100%", width: `${val}%`, background: color, borderRadius: 3 }} />
          </div>
          <span style={{ width: 32, textAlign: "right", color: raw > 100 ? T.rose : color, fontWeight: 700 }}>
            {raw}%{raw > 100 ? "!" : ""}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── TOOLTIP EXPLICATION SANTÉ ────────────────────────────────────────────────
const HEALTH_EXPLAIN = {
  "Alerte Facturation": "Prod > Fac de +20pts : production livrée non facturée",
  "Retard Chantier":    "Temps écoulé > Prod de +15pts : retard d'avancement",
  "Risque Tréso":       "Prod > Fac de +10pts : risque trésorerie",
  "Sain":               "Équilibre temps / prod / facturation",
};

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────
export default function SuiviFacturable({ projects = [] }) {
  const [search,  setSearch]  = useState("");
  const [sortBy,  setSortBy]  = useState("nonFacture");
  const [sortDir, setSortDir] = useState("desc");
  const [filterHealth, setFilterHealth] = useState([]);

  const today = useMemo(() => new Date(), []);

  const handleSort = key => {
    if (sortBy === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(key); setSortDir("desc"); }
  };

  // ── Calculs enrichis par projet ────────────────────────────────────────────
  const processedData = useMemo(() => {
    let rows = projects
      // ← filtre projets archivés / brouillons sans items
      .filter(p => !p.is_archived && (p.total_ht > 0 || p.total_prod > 0 || p.total_facture > 0))
      .map(p => {
        const start = p.date_debut ? new Date(p.date_debut) : null;
        const end   = p.date_fin   ? new Date(p.date_fin)   : null;

        const totalDur = (start && end) ? end - start : 0;
        const elapsed  = start ? today - start : 0;
        // ← pctTime cappé à 100 dans Bar3, mais on garde la vraie valeur ici
        const pctTime  = totalDur > 0
          ? Math.max(Math.round((elapsed / totalDur) * 100), 0)
          : (start ? 100 : 0);

        // ← total_ht = somme des items_devis du projet (tous)
        // ← total_prod = somme des items_devis où is_intervention=true (champ Total_HT)
        // ← total_facture = somme mois_facturable_projet.total_reel_facturable
        const totalHt      = p.total_ht      || 0;
        const totalProd    = p.total_prod     || 0;
        const totalFacture = p.total_facture  || 0;

        const pctProd    = pct(totalProd,    totalHt);
        const pctFac     = pct(totalFacture, totalHt);
        // pctTime non cappé pour détecter les retards > 100%
        const pctTimeRaw = pctTime;

        // Reste à facturer = ce qui reste du carnet de commandes
        const backlog    = Math.max(totalHt - totalFacture, 0);
        // Non facturé = prod faite mais pas encore facturée (urgence tréso)
        const nonFacture = Math.max(totalProd - totalFacture, 0);

        // ── Santé du chantier ─────────────────────────────────────────────
        let health = "Sain";
        if      (pctProd    > pctFac     + 20) health = "Alerte Facturation";
        else if (pctTimeRaw > pctProd    + 15) health = "Retard Chantier";
        else if (pctProd    > pctFac     + 10) health = "Risque Tréso";

        const clientName = p._company_attached?.name || "—";

        return {
          ...p,
          clientName,
          totalHt, totalProd, totalFacture,
          pctTime: pctTimeRaw,
          pctProd, pctFac,
          backlog, nonFacture, health,
        };
      });

    // Filtre recherche — sur nom projet ET nom client
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(p =>
        (p.name        || "").toLowerCase().includes(q) ||
        (p.clientName  || "").toLowerCase().includes(q)
      );
    }

    // Filtre santé
    if (filterHealth.length > 0) {
      rows = rows.filter(p => filterHealth.includes(p.health));
    }

    // Tri
    return rows.sort((a, b) => {
      let va = a[sortBy], vb = b[sortBy];
      if (sortBy === "name")       { va = (a.name       || "").toLowerCase(); vb = (b.name       || "").toLowerCase(); }
      if (sortBy === "clientName") { va = (a.clientName || "").toLowerCase(); vb = (b.clientName || "").toLowerCase(); }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ?  1 : -1;
      return 0;
    });
  }, [projects, search, filterHealth, today, sortBy, sortDir]);

  // ── KPIs globaux (sur tous les projets, pas juste filtrés) ─────────────────
  const allActive = useMemo(() =>
    projects.filter(p => !p.is_archived && (p.total_ht > 0 || p.total_prod > 0 || p.total_facture > 0)),
    [projects]
  );

  const totalBacklog     = allActive.reduce((s, p) => s + Math.max((p.total_ht      || 0) - (p.total_facture || 0), 0), 0);
  const totalNonFacture  = allActive.reduce((s, p) => s + Math.max((p.total_prod    || 0) - (p.total_facture || 0), 0), 0);
  const totalFactureGlob = allActive.reduce((s, p) => s + (p.total_facture || 0), 0);
  const totalHtGlob      = allActive.reduce((s, p) => s + (p.total_ht      || 0), 0);
  const tauxEncaissement = pct(totalFactureGlob, totalHtGlob);

  const HEALTH_LABELS = ["Alerte Facturation", "Retard Chantier", "Risque Tréso", "Sain"];
  const healthCounts  = Object.fromEntries(HEALTH_LABELS.map(h => [h, allActive.filter(p => {
    // recalc rapide pour les compteurs
    const tp = pct(p.total_prod || 0, p.total_ht || 0);
    const tf = pct(p.total_facture || 0, p.total_ht || 0);
    if      (tp > tf + 20) return h === "Alerte Facturation";
    else if (tp > tf + 10) return h === "Risque Tréso";
    return h === "Sain";
  }).length]));
  const alertesCount = allActive.filter(p => {
    const tp = pct(p.total_prod || 0, p.total_ht || 0);
    const tf = pct(p.total_facture || 0, p.total_ht || 0);
    return tp > tf + 10;
  }).length;

  const HEALTH_COLOR = {
    "Alerte Facturation": T.rose,
    "Retard Chantier":    T.sky,
    "Risque Tréso":       T.amber,
    "Sain":               T.sage,
  };

  return (
    <div style={{ fontFamily: "'Nunito', sans-serif", color: T.text, paddingBottom: 40 }}>

      {/* ── CARTES KPI ──────────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
        <KpiCard
          label="Reste à Facturer"
          value={fmt(totalBacklog)}
          sub={`sur ${allActive.length} chantiers actifs`}
          color={T.indigo} pct={pct(totalFactureGlob, totalHtGlob)} icon="💶"
        />
        <KpiCard
          label="Non Facturé (prod livrée)"
          value={fmt(totalNonFacture)}
          sub="Urgence trésorerie"
          color={T.amber} pct={pct(totalNonFacture, totalBacklog)} icon="⚠️"
        />
        <KpiCard
          label="Taux d'encaissement"
          value={`${tauxEncaissement}%`}
          sub={`${fmt(totalFactureGlob)} encaissé`}
          color={T.teal} pct={tauxEncaissement} icon="📈"
        />
        <KpiCard
          label="Chantiers en alerte"
          value={alertesCount}
          sub={alertesCount > 0 ? "Prod non facturée détectée" : "✓ Tout est à jour"}
          color={alertesCount > 0 ? T.rose : T.sage} pct={pct(alertesCount, allActive.length)} icon="🔔"
        />
      </div>

      {/* ── FILTRES SANTÉ ───────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: 12, color: T.textMed, fontWeight: 700 }}>Filtrer :</span>
        {HEALTH_LABELS.map(h => {
          const active = filterHealth.includes(h);
          const c = HEALTH_COLOR[h];
          return (
            <button key={h}
              onClick={() => setFilterHealth(prev => prev.includes(h) ? prev.filter(x => x !== h) : [...prev, h])}
              style={{ padding: "5px 12px", borderRadius: 20, border: `1.5px solid ${active ? c : T.border}`,
                background: active ? `${c}15` : T.card, color: active ? c : T.textMed,
                fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all 0.15s" }}>
              {h} <span style={{ fontWeight: 800 }}>{healthCounts[h] || 0}</span>
            </button>
          );
        })}
        {filterHealth.length > 0 && (
          <button onClick={() => setFilterHealth([])}
            style={{ padding: "5px 12px", borderRadius: 20, border: `1px solid ${T.rose}44`,
              background: T.roseL, color: T.rose, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
            ✕ Effacer
          </button>
        )}

        {/* Recherche */}
        <div style={{ marginLeft: "auto", position: "relative" }}>
          <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: T.textSoft }}>🔍</span>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Chantier ou client…"
            style={{ padding: "7px 10px 7px 28px", border: `1.5px solid ${T.border}`, borderRadius: 8,
              fontSize: 12, color: T.text, background: T.bg, outline: "none", width: 220 }}
          />
        </div>
        <span style={{ fontSize: 12, color: T.textSoft, fontWeight: 600 }}>
          {processedData.length} chantier{processedData.length > 1 ? "s" : ""}
        </span>
      </div>

      {/* ── LÉGENDE ─────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 16, marginBottom: 12, padding: "8px 16px",
        background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 11, color: T.textSoft, fontWeight: 700 }}>Légende barres :</span>
        {[["Tps", T.sky, "% temps écoulé (date début → fin)"],
          ["Prod", T.amber, "% items intervention livrés / total devis"],
          ["Fac",  T.sage,  "% facturé / total devis"]].map(([l, c, desc]) => (
          <span key={l} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: T.textMed }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: c, display: "inline-block" }} />
            <strong style={{ color: c }}>{l}</strong> — {desc}
          </span>
        ))}
        <span style={{ fontSize: 11, color: T.rose, marginLeft: "auto" }}>⚠ % rouge = dépasse 100%</span>
      </div>

      {/* ── TABLEAU ─────────────────────────────────────────────────────────── */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12,
        overflow: "hidden", boxShadow: "0 2px 6px rgba(0,0,0,0.04)" }}>

        {/* En-tête */}
        <div style={{ display: "grid", gridTemplateColumns: "200px 140px 1fr 130px 130px 155px",
          gap: 10, padding: "10px 20px", background: T.cardAlt, borderBottom: `2px solid ${T.border}` }}>
          <ColHead label="Chantier"           sortKey="name"        current={sortBy} dir={sortDir} onSort={handleSort} />
          <ColHead label="Client"             sortKey="clientName"  current={sortBy} dir={sortDir} onSort={handleSort} />
          <ColHead label="Avancement"         sortKey="pctProd"     current={sortBy} dir={sortDir} onSort={handleSort} />
          <ColHead label="Reste à facturer"   sortKey="backlog"     current={sortBy} dir={sortDir} onSort={handleSort} />
          <ColHead label="Non facturé"        sortKey="nonFacture"  current={sortBy} dir={sortDir} onSort={handleSort} />
          <ColHead label="Santé"              sortKey="health"      current={sortBy} dir={sortDir} onSort={handleSort} />
        </div>

        {/* Lignes */}
        <div style={{ maxHeight: 580, overflowY: "auto" }}>
          {processedData.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: T.textSoft, fontSize: 13 }}>
              Aucun chantier ne correspond.
            </div>
          ) : processedData.map((p, idx) => (
            <div key={p.id}
              style={{ display: "grid", gridTemplateColumns: "200px 140px 1fr 130px 130px 155px",
                gap: 10, padding: "14px 20px", borderBottom: `1px solid ${T.border}`,
                alignItems: "center", background: idx % 2 === 0 ? T.card : T.cardAlt,
                transition: "background 0.1s" }}
              onMouseEnter={e => e.currentTarget.style.background = T.indigoL}
              onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? T.card : T.cardAlt}>

              {/* Nom chantier */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: T.text,
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {p.name}
                </div>
                <div style={{ fontSize: 10, color: T.textSoft, marginTop: 2 }}>
                  {p.totalHt > 0 ? fmt(p.totalHt) + " HT total" : "Montant non défini"}
                </div>
              </div>

              {/* Client */}
              <div style={{ fontSize: 12, color: T.textMed, whiteSpace: "nowrap",
                overflow: "hidden", textOverflow: "ellipsis" }}>
                {p.clientName}
              </div>

              {/* 3 barres */}
              <Bar3 pctTime={p.pctTime} pctProd={p.pctProd} pctFac={p.pctFac} />

              {/* Reste à facturer */}
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>{fmt(p.backlog)}</div>
                <div style={{ fontSize: 10, color: T.textSoft }}>{100 - p.pctFac}% non facturé</div>
              </div>

              {/* Non facturé (prod livrée) */}
              <div>
                {p.nonFacture > 0 ? (
                  <>
                    <div style={{ fontSize: 13, fontWeight: 800, color: T.amber }}>+ {fmt(p.nonFacture)}</div>
                    <div style={{ fontSize: 10, color: T.textSoft }}>prod livrée non fact.</div>
                  </>
                ) : (
                  <div style={{ fontSize: 12, color: T.textSoft }}>—</div>
                )}
              </div>

              {/* Badge santé + tooltip */}
              <div title={HEALTH_EXPLAIN[p.health] || ""} style={{ cursor: "help" }}>
                <HealthBadge label={p.health} />
                {p.health !== "Sain" && (
                  <div style={{ fontSize: 9, color: T.textSoft, marginTop: 3, maxWidth: 140,
                    whiteSpace: "normal", lineHeight: 1.3 }}>
                    {HEALTH_EXPLAIN[p.health]}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Pied de tableau — totaux sur les lignes affichées */}
        <div style={{ display: "grid", gridTemplateColumns: "200px 140px 1fr 130px 130px 155px",
          gap: 10, padding: "12px 20px", borderTop: `2px solid ${T.border}`, background: T.cardAlt }}>
          <span style={{ fontSize: 12, color: T.textMed, gridColumn: "1/3", fontWeight: 600 }}>
            {processedData.length} chantier{processedData.length > 1 ? "s" : ""} affichés
          </span>
          <span />
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: T.indigo }}>
              {fmt(processedData.reduce((s, p) => s + p.backlog, 0))}
            </div>
            <div style={{ fontSize: 10, color: T.textSoft }}>reste à fact. (filtre)</div>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: T.amber }}>
              {fmt(processedData.reduce((s, p) => s + p.nonFacture, 0))}
            </div>
            <div style={{ fontSize: 10, color: T.textSoft }}>non fact. (filtre)</div>
          </div>
          <span />
        </div>
      </div>

      {/* ── NOTE EXPLICATIVE ────────────────────────────────────────────────── */}
      <div style={{ marginTop: 16, padding: "12px 16px", background: T.card,
        border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 11, color: T.textSoft, lineHeight: 1.7 }}>
        <strong style={{ color: T.textMed }}>Définitions :</strong>
        {" · "}<strong>Reste à facturer</strong> = Montant total devis − Déjà facturé
        {" · "}<strong>Non facturé</strong> = Production livrée (items intervention) − Déjà facturé
        {" · "}<strong>Taux d'encaissement</strong> = Facturé / Total devis HT
        {" · "}<strong>Alerte Facturation</strong> = Prod livrée dépasse facturation de plus de 20pts
        {" · "}<strong>Risque Tréso</strong> = Prod livrée dépasse facturation de 10 à 20pts
      </div>
    </div>
  );
}
