import { useState, useEffect, useMemo, useRef } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const USE_MOCK = false; // ← false pour brancher Bubble
const BUBBLE_BASE = "https://portail-qualidal.com/version-test/api/1.1";
const BUBBLE_TOKEN = "Bearer test_f92090a3c34a5a84387182092bf29434";

// ─── MOCK DATA ── éditer ces tableaux pour changer les données de test ────────
const MOCK_COMPANIES = [
  { id: "c1", name: "IDEC" },
  { id: "c2", name: "COGESTRA" },
  { id: "c3", name: "ACME Construction" },
  { id: "c4", name: "VINCI Construction" },
  { id: "c5", name: "EIFFAGE" },
  { id: "c6", name: "SOGEA" },
];
const MOCK_PROJECTS = [
  {
    id: "p1",
    name: "AREFIM - REIMS (51)",
    _company_attached: "c1",
    chantier_address: { city: "Reims", state: "Grand Est" },
    OS_prestations_type: "Dallage",
    premiere_interv: "2025-01-15",
    derniere_interv: "2025-03-20",
  },
  {
    id: "p2",
    name: "LOZENNES (59)",
    _company_attached: "c2",
    chantier_address: { city: "Lille", state: "Hauts-de-France" },
    OS_prestations_type: "Réparation béton",
    premiere_interv: "2024-11-01",
    derniere_interv: "2025-02-28",
  },
  {
    id: "p3",
    name: "Chantier Paris 15",
    _company_attached: "c3",
    chantier_address: { city: "Paris", state: "Île-de-France" },
    OS_prestations_type: "Dallage",
    premiere_interv: "2025-02-01",
    derniere_interv: "2025-04-15",
  },
  {
    id: "p4",
    name: "Parking Rouen",
    _company_attached: "c4",
    chantier_address: { city: "Rouen", state: "Normandie" },
    OS_prestations_type: "Marquage sol",
    premiere_interv: "2025-01-10",
    derniere_interv: "2025-02-10",
  },
  {
    id: "p5",
    name: "Zone artisanale Creil",
    _company_attached: "c5",
    chantier_address: { city: "Creil", state: "Hauts-de-France" },
    OS_prestations_type: "Dallage",
    premiere_interv: "2025-01-20",
    derniere_interv: "2025-05-30",
  },
  {
    id: "p6",
    name: "ZI Amiens Nord",
    _company_attached: "c2",
    chantier_address: { city: "Amiens", state: "Hauts-de-France" },
    OS_prestations_type: "Réparation béton",
    premiere_interv: "2024-12-01",
    derniere_interv: "2025-03-01",
  },
  {
    id: "p7",
    name: "Plateforme Marne-la-Vallée",
    _company_attached: "c6",
    chantier_address: { city: "Marne-la-Vallée", state: "Île-de-France" },
    OS_prestations_type: "Dallage",
    premiere_interv: "2025-02-10",
    derniere_interv: "2025-06-30",
  },
];
const MOCK_OFFERS = [
  {
    id: "o1",
    offer_number: "devis_de00001898",
    os_devis_statut: "Envoyé",
    date_offre: "2025-01-10",
    date_validite: "2025-02-20",
    _project_attached: "p1",
    montant_ht: 48200,
    is_active: true,
  },
  {
    id: "o2",
    offer_number: "devis_de00001901",
    os_devis_statut: "Signé",
    date_offre: "2025-01-05",
    date_validite: "2025-02-28",
    _project_attached: "p2",
    montant_ht: 127500,
    is_active: true,
  },
  {
    id: "o3",
    offer_number: "devis_de00001905",
    os_devis_statut: "Envoyé",
    date_offre: "2025-01-20",
    date_validite: "2025-02-19",
    _project_attached: "p3",
    montant_ht: 33750,
    is_active: true,
  },
  {
    id: "o4",
    offer_number: "devis_de00001910",
    os_devis_statut: "Relancé",
    date_offre: "2024-12-15",
    date_validite: "2025-02-21",
    _project_attached: "p4",
    montant_ht: 89000,
    is_active: true,
  },
  {
    id: "o5",
    offer_number: "devis_de00001912",
    os_devis_statut: "Refusé",
    date_offre: "2024-12-01",
    date_validite: "2025-01-15",
    _project_attached: "p1",
    montant_ht: 22000,
    is_active: false,
  },
  {
    id: "o6",
    offer_number: "devis_de00001915",
    os_devis_statut: "Signé",
    date_offre: "2025-01-12",
    date_validite: "2025-03-15",
    _project_attached: "p6",
    montant_ht: 215000,
    is_active: true,
  },
  {
    id: "o7",
    offer_number: "devis_de00001918",
    os_devis_statut: "Envoyé",
    date_offre: "2025-01-25",
    date_validite: "2025-02-25",
    _project_attached: "p3",
    montant_ht: 67300,
    is_active: true,
  },
  {
    id: "o8",
    offer_number: "devis_de00001920",
    os_devis_statut: "Relancé",
    date_offre: "2025-01-08",
    date_validite: "2025-02-22",
    _project_attached: "p4",
    montant_ht: 156000,
    is_active: true,
  },
  {
    id: "o9",
    offer_number: "devis_de00001922",
    os_devis_statut: "Saisie d'information",
    date_offre: "2025-02-01",
    date_validite: "2025-03-20",
    _project_attached: "p7",
    montant_ht: 98500,
    is_active: true,
  },
  {
    id: "o10",
    offer_number: "devis_de00001925",
    os_devis_statut: "Signé",
    date_offre: "2025-01-18",
    date_validite: "2025-03-01",
    _project_attached: "p5",
    montant_ht: 310000,
    is_active: true,
  },
];
const MOCK_INTERVENTIONS = [
  {
    id: "i1",
    name: "Reprise fissures dalle",
    _project_attached: "p1",
    date: "2025-01-15",
    OS_prestations_type: "Réparation béton",
    intervention_status: "Terminée",
    address: { city: "Reims" },
  },
  {
    id: "i2",
    name: "Coulage dalle hangar",
    _project_attached: "p2",
    date: "2024-11-20",
    OS_prestations_type: "Dallage",
    intervention_status: "Terminée",
    address: { city: "Lille" },
  },
  {
    id: "i3",
    name: "Marquage parking",
    _project_attached: "p4",
    date: "2025-01-12",
    OS_prestations_type: "Marquage sol",
    intervention_status: "Terminée",
    address: { city: "Rouen" },
  },
  {
    id: "i4",
    name: "Traitement sol industriel",
    _project_attached: "p5",
    date: "2025-01-22",
    OS_prestations_type: "Dallage",
    intervention_status: "En cours",
    address: { city: "Creil" },
  },
  {
    id: "i5",
    name: "Injection résine fissures",
    _project_attached: "p6",
    date: "2024-12-10",
    OS_prestations_type: "Réparation béton",
    intervention_status: "Terminée",
    address: { city: "Amiens" },
  },
  {
    id: "i6",
    name: "Ponçage + durcisseur",
    _project_attached: "p2",
    date: "2025-01-05",
    OS_prestations_type: "Dallage",
    intervention_status: "Terminée",
    address: { city: "Lille" },
  },
  {
    id: "i7",
    name: "Reprise joint de dilatation",
    _project_attached: "p1",
    date: "2025-02-03",
    OS_prestations_type: "Réparation béton",
    intervention_status: "Planifiée",
    address: { city: "Reims" },
  },
  {
    id: "i8",
    name: "Coulage dallage neuf",
    _project_attached: "p7",
    date: "2025-02-12",
    OS_prestations_type: "Dallage",
    intervention_status: "Planifiée",
    address: { city: "Marne-la-Vallée" },
  },
  {
    id: "i9",
    name: "Traitement anti-poussière",
    _project_attached: "p3",
    date: "2025-02-05",
    OS_prestations_type: "Dallage",
    intervention_status: "En cours",
    address: { city: "Paris" },
  },
  {
    id: "i10",
    name: "Ragréage surface",
    _project_attached: "p6",
    date: "2025-01-28",
    OS_prestations_type: "Réparation béton",
    intervention_status: "Terminée",
    address: { city: "Amiens" },
  },
  {
    id: "i11",
    name: "Joints souples",
    _project_attached: "p5",
    date: "2025-02-01",
    OS_prestations_type: "Réparation béton",
    intervention_status: "En cours",
    address: { city: "Creil" },
  },
  {
    id: "i12",
    name: "Marquage allées",
    _project_attached: "p2",
    date: "2025-02-15",
    OS_prestations_type: "Marquage sol",
    intervention_status: "Planifiée",
    address: { city: "Lille" },
  },
];

// ─── FETCH ────────────────────────────────────────────────────────────────────
// Récupère toutes les pages d'une table Bubble (limite 100/appel)
async function fetchAllPages(endpoint, headers) {
  let results = [];
  let cursor = 0;
  while (true) {
    const res = await fetch(
      `${BUBBLE_BASE}/obj/${endpoint}?limit=100&cursor=${cursor}`,
      { headers }
    );
    const data = await res.json();
    const page = data.response?.results || [];
    results = results.concat(page);
    const remaining = data.response?.remaining ?? 0;
    if (remaining === 0) break;
    cursor += page.length;
  }
  return results;
}

// Extrait la ville depuis une adresse Bubble geographic : "75018 Paris, France" → "Paris"
function extractCity(addressObj) {
  if (!addressObj?.address) return null;
  const parts = addressObj.address.split(",");
  if (parts.length >= 2) {
    // "75018 Paris" → "Paris" ou "Paris" directement
    const city = parts[0].trim().replace(/^\d{4,5}\s*/, "");
    return city || parts[1]?.trim() || null;
  }
  return parts[0]?.trim() || null;
}

async function fetchAll() {
  if (USE_MOCK) {
    const cm = Object.fromEntries(MOCK_COMPANIES.map((c) => [c.id, c]));
    const pm = Object.fromEntries(
      MOCK_PROJECTS.map((p) => [
        p.id,
        { ...p, _company_attached: cm[p._company_attached] },
      ])
    );
    return {
      offers: MOCK_OFFERS.map((o) => ({
        ...o,
        _project_attached: pm[o._project_attached],
      })),
      interventions: MOCK_INTERVENTIONS.map((i) => ({
        ...i,
        _project_attached: pm[i._project_attached],
      })),
      projects: Object.values(pm),
    };
  }

  const h = { Authorization: BUBBLE_TOKEN };

  // 1. Fetch toutes les tables en parallèle (avec pagination)
  const [rawOffers, rawProjects, rawInterventions, rawCompanies] =
    await Promise.all([
      fetchAllPages("offers_history_documents", h),
      fetchAllPages("projects", h),
      fetchAllPages("interventions", h),
      fetchAllPages("companies", h),
    ]);

  // 2. Index par _id pour les jointures O(1)
  const companiesMap = Object.fromEntries(rawCompanies.map((c) => [c._id, c]));

  // 3. Normaliser Projects — mapper les vrais champs Bubble
  const projectsMap = Object.fromEntries(
    rawProjects.map((p) => {
      const company = companiesMap[p._company_attached] || null;
      const city = extractCity(p.chantier_address);
      return [
        p._id,
        {
          id: p._id,
          name: p.name || "",
          project_code: p.project_code || p._id,
          _company_attached: company
            ? { id: company._id, name: company.name }
            : { id: p._company_attached, name: "—" },
          chantier_address: { city, state: city }, // Bubble n'expose pas la région, on utilise la ville
          OS_prestations_type: p.OS_prestations_type || "",
          OS_devis_status: p.OS_devis_status || "",
          premiere_interv: p.premiere_interv || null,
          derniere_interv: p.derniere_interv || null,
        },
      ];
    })
  );

  // 4. Normaliser Offers — mapper les vrais champs Bubble
  const offers = rawOffers
    .filter((o) => o._project_attached) // ignorer les anciens sans projet
    .map((o) => {
      const project = projectsMap[o._project_attached] || null;
      return {
        id: o._id,
        offer_number: o.devis_number || o._id, // Bubble : devis_number
        os_devis_statut: project?.OS_devis_status || "Saisie d'information",
        date_offre: o.date_offre
          ? o.date_offre.slice(0, 10)
          : o["Created Date"]?.slice(0, 10),
        date_validite: o.date_validite ? o.date_validite.slice(0, 10) : null,
        _project_attached: project,
        montant_ht: o.montant_ht || 0, // sera calculé depuis items_devis plus tard
        is_active: o.is_active !== false,
        file_url: o.file || null,
      };
    });

  // 5. Normaliser Interventions — mapper les vrais champs Bubble
  const interventions = rawInterventions.map((i) => {
    const project = projectsMap[i._project_attached] || null;
    return {
      id: i._id,
      name: i.name || "Sans nom",
      _project_attached: project,
      date: i.date ? i.date.slice(0, 10) : i["Created Date"]?.slice(0, 10),
      OS_prestations_type: i.OS_prestations_type || "",
      intervention_status:
        i.intervention_status || i.OS_project_intervention_status || "—",
      address: {
        city: extractCity(i.address) || project?.chantier_address?.city || "—",
      },
    };
  });

  return { offers, interventions, projects: Object.values(projectsMap) };
}

// ─── CONSTANTES VISUELLES ─────────────────────────────────────────────────────
const STATUT_DEVIS = [
  "Saisie d'information",
  "Envoyé",
  "Relancé",
  "Signé",
  "Refusé",
];
const STATUT_INTERV = ["Planifiée", "En cours", "Terminée", "Annulée"];
const S_COLOR = {
  "Saisie d'information": "#64748b",
  Envoyé: "#3b82f6",
  Relancé: "#f59e0b",
  Signé: "#22c55e",
  Refusé: "#ef4444",
  Expiré: "#6b7280",
  Planifiée: "#a78bfa",
  "En cours": "#3b82f6",
  Terminée: "#22c55e",
  Annulée: "#ef4444",
};
const PRESTATION_COLORS = [
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#a78bfa",
  "#ef4444",
  "#06b6d4",
];
const fmt = (n) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n || 0);
const fmtK = (n) => (n >= 1000 ? `${(n / 1000).toFixed(0)}k€` : `${n}€`);
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("fr-FR") : "—");
const monthLabel = (d) =>
  new Date(d).toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
const diffDays = (d) => Math.ceil((new Date(d) - new Date()) / 86400000);

// ─── COMPOSANT : BADGE STATUT ─────────────────────────────────────────────────
function Badge({ label }) {
  const c = S_COLOR[label] || "#64748b";
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        padding: "3px 7px",
        borderRadius: 3,
        color: c,
        background: `${c}1a`,
        border: `1px solid ${c}44`,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

// ─── COMPOSANT : KPI CARD ─────────────────────────────────────────────────────
function KpiCard({ label, value, sub, accent, pct = 0 }) {
  return (
    <div
      style={{
        background: "#0f1722",
        border: "1px solid #1e293b",
        borderRadius: 6,
        padding: "18px 20px",
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: "#475569",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          marginBottom: 10,
        }}
      >
        {label}
      </div>
      <div
        style={{ fontSize: 26, fontWeight: 700, color: accent, lineHeight: 1 }}
      >
        {value}
      </div>
      <div style={{ fontSize: 10, color: "#64748b", marginTop: 8 }}>{sub}</div>
      <div
        style={{
          marginTop: 10,
          height: 2,
          background: "#1e293b",
          borderRadius: 1,
        }}
      >
        <div
          style={{
            height: 2,
            background: accent,
            width: `${Math.min(pct, 100)}%`,
            borderRadius: 1,
            opacity: 0.6,
          }}
        />
      </div>
    </div>
  );
}

// ─── COMPOSANT : DROPDOWN MULTI-SELECT ───────────────────────────────────────
// Utilisé pour les filtres par colonne (statut, type, mois…)
function MultiSelect({ label, options, selected, onChange, colorMap }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (v) =>
    onChange(
      selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]
    );
  const active = selected.length > 0;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 5,
          padding: "5px 9px",
          borderRadius: 4,
          border: `1px solid ${active ? "#3b82f644" : "#1e293b"}`,
          background: active ? "rgba(59,130,246,0.08)" : "#0a0e14",
          color: active ? "#3b82f6" : "#475569",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.07em",
          textTransform: "uppercase",
          transition: "all 0.15s",
        }}
      >
        {label}
        {active ? ` (${selected.length})` : ""}
        <span style={{ fontSize: 8, opacity: 0.6 }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            zIndex: 200,
            background: "#0f1722",
            border: "1px solid #1e293b",
            borderRadius: 6,
            padding: 6,
            minWidth: 180,
            boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
          }}
        >
          {selected.length > 0 && (
            <div
              onClick={() => onChange([])}
              style={{
                cursor: "pointer",
                fontSize: 9,
                color: "#475569",
                padding: "4px 8px",
                marginBottom: 4,
                letterSpacing: "0.1em",
              }}
            >
              ✕ Tout effacer
            </div>
          )}
          {options.map((opt) => {
            const c = colorMap?.[opt] || "#94a3b8";
            const sel = selected.includes(opt);
            return (
              <div
                key={opt}
                onClick={() => toggle(opt)}
                style={{
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "7px 8px",
                  borderRadius: 4,
                  background: sel ? `${c}12` : "transparent",
                  transition: "background 0.1s",
                }}
              >
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 3,
                    border: `1px solid ${sel ? c : "#334155"}`,
                    background: sel ? c : "transparent",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {sel && (
                    <span
                      style={{ fontSize: 8, color: "#000", fontWeight: 900 }}
                    >
                      ✓
                    </span>
                  )}
                </div>
                <span style={{ fontSize: 11, color: sel ? c : "#94a3b8" }}>
                  {opt}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── COMPOSANT : RECHERCHE TEXTE ──────────────────────────────────────────────
function SearchInput({ value, onChange, placeholder }) {
  return (
    <div
      style={{ position: "relative", display: "flex", alignItems: "center" }}
    >
      <span
        style={{
          position: "absolute",
          left: 9,
          fontSize: 11,
          color: "#334155",
          pointerEvents: "none",
        }}
      >
        ⌕
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "Rechercher…"}
        style={{
          padding: "6px 10px 6px 26px",
          background: "#0a0e14",
          border: "1px solid #1e293b",
          borderRadius: 4,
          color: "#94a3b8",
          fontSize: 11,
          fontFamily: "inherit",
          outline: "none",
          width: 220,
          transition: "border-color 0.15s",
        }}
        onFocus={(e) => (e.target.style.borderColor = "#334155")}
        onBlur={(e) => (e.target.style.borderColor = "#1e293b")}
      />
      {value && (
        <span
          onClick={() => onChange("")}
          style={{
            position: "absolute",
            right: 8,
            cursor: "pointer",
            fontSize: 12,
            color: "#475569",
          }}
        >
          ✕
        </span>
      )}
    </div>
  );
}

// ─── COMPOSANT : DATE RANGE PICKER ────────────────────────────────────────────
function DateRange({ dateFrom, dateTo, onChange }) {
  const active = dateFrom || dateTo;
  const inputStyle = {
    background: "#0a0e14",
    border: "1px solid #1e293b",
    borderRadius: 4,
    color: "#94a3b8",
    fontSize: 11,
    fontFamily: "inherit",
    outline: "none",
    padding: "5px 8px",
    width: 116,
    cursor: "pointer",
    transition: "border-color 0.15s",
    colorScheme: "dark",
  };
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        padding: "4px 8px",
        borderRadius: 4,
        border: `1px solid ${active ? "#3b82f644" : "#1e293b"}`,
        background: active ? "rgba(59,130,246,0.06)" : "transparent",
      }}
    >
      <span
        style={{
          fontSize: 10,
          color: active ? "#3b82f6" : "#475569",
          letterSpacing: "0.07em",
          textTransform: "uppercase",
          fontWeight: 700,
          whiteSpace: "nowrap",
        }}
      >
        Du
      </span>
      <input
        type="date"
        value={dateFrom || ""}
        onChange={(e) => onChange(e.target.value, dateTo)}
        style={inputStyle}
        onFocus={(e) => (e.target.style.borderColor = "#334155")}
        onBlur={(e) => (e.target.style.borderColor = "#1e293b")}
      />
      <span
        style={{
          fontSize: 10,
          color: active ? "#3b82f6" : "#475569",
          letterSpacing: "0.07em",
          textTransform: "uppercase",
          fontWeight: 700,
        }}
      >
        au
      </span>
      <input
        type="date"
        value={dateTo || ""}
        onChange={(e) => onChange(dateFrom, e.target.value)}
        min={dateFrom || undefined}
        style={inputStyle}
        onFocus={(e) => (e.target.style.borderColor = "#334155")}
        onBlur={(e) => (e.target.style.borderColor = "#1e293b")}
      />
      {active && (
        <span
          onClick={() => onChange("", "")}
          style={{
            cursor: "pointer",
            fontSize: 13,
            color: "#475569",
            lineHeight: 1,
            paddingLeft: 2,
          }}
        >
          ×
        </span>
      )}
    </div>
  );
}

// ─── COMPOSANT : EN-TÊTE COLONNE TRIABLE ──────────────────────────────────────
function ColHeader({ label, sortKey, sortBy, sortDir, onSort }) {
  const active = sortBy === sortKey;
  return (
    <span
      onClick={() => onSort(sortKey)}
      style={{
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 3,
        userSelect: "none",
        color: active ? "#94a3b8" : "#334155",
        transition: "color 0.15s",
      }}
    >
      {label}
      <span style={{ fontSize: 7, opacity: active ? 1 : 0.3 }}>
        {active && sortDir === "asc" ? "▲" : "▼"}
      </span>
    </span>
  );
}

// ─── ONGLET DEVIS ─────────────────────────────────────────────────────────────
function TabDevis({ offers, selectedCompany, onSelectCompany }) {
  const [search, setSearch] = useState("");
  const [filterStatuts, setFilterStatuts] = useState([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState("date_offre");
  const [sortDir, setSortDir] = useState("desc");

  const handleSort = (key) => {
    if (sortBy === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(key);
      setSortDir("desc");
    }
  };

  const filtered = useMemo(() => {
    let rows = offers;
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (o) =>
          o._project_attached?.name?.toLowerCase().includes(q) ||
          o._project_attached?._company_attached?.name
            ?.toLowerCase()
            .includes(q) ||
          o.offer_number?.toLowerCase().includes(q)
      );
    }
    if (filterStatuts.length)
      rows = rows.filter((o) => filterStatuts.includes(o.os_devis_statut));
    if (dateFrom)
      rows = rows.filter((o) => o.date_offre && o.date_offre >= dateFrom);
    if (dateTo)
      rows = rows.filter((o) => o.date_offre && o.date_offre <= dateTo);
    if (selectedCompany)
      rows = rows.filter(
        (o) => o._project_attached?._company_attached?.id === selectedCompany
      );
    // Tri
    rows = [...rows].sort((a, b) => {
      let va, vb;
      if (sortBy === "montant_ht") {
        va = a.montant_ht || 0;
        vb = b.montant_ht || 0;
      } else if (sortBy === "client") {
        va = a._project_attached?._company_attached?.name || "";
        vb = b._project_attached?._company_attached?.name || "";
      } else if (sortBy === "projet") {
        va = a._project_attached?.name || "";
        vb = b._project_attached?.name || "";
      } else if (sortBy === "expiration") {
        va = new Date(a.date_validite);
        vb = new Date(b.date_validite);
      } else {
        va = new Date(a.date_offre);
        vb = new Date(b.date_offre);
      }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return rows;
  }, [
    offers,
    search,
    filterStatuts,
    dateFrom,
    dateTo,
    selectedCompany,
    sortBy,
    sortDir,
  ]);

  // KPIs (toujours sur toutes les offres actives, pas sur les filtrées)
  const active = offers.filter((o) => o.is_active);
  const signe = active.filter((o) => o.os_devis_statut === "Signé");
  const pipeline = active.filter(
    (o) => !["Signé", "Refusé", "Expiré"].includes(o.os_devis_statut)
  );
  const caSigne = signe.reduce((s, o) => s + (o.montant_ht || 0), 0);
  const caPipeline = pipeline.reduce((s, o) => s + (o.montant_ht || 0), 0);
  const tauxConv = active.length
    ? Math.round((signe.length / active.length) * 100)
    : 0;
  const expirent = active
    .filter((o) => !["Signé", "Refusé", "Expiré"].includes(o.os_devis_statut))
    .map((o) => ({ ...o, daysLeft: diffDays(o.date_validite) }))
    .filter((o) => o.daysLeft <= 7)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  // Total filtré
  const totalFiltre = filtered.reduce((s, o) => s + (o.montant_ht || 0), 0);

  // Top clients (toutes les offres)
  const byClient = {};
  active.forEach((o) => {
    const c = o._project_attached?._company_attached;
    if (!c) return;
    if (!byClient[c.id])
      byClient[c.id] = { id: c.id, name: c.name, montant: 0, count: 0 };
    byClient[c.id].montant += o.montant_ht || 0;
    byClient[c.id].count++;
  });
  const topClients = Object.values(byClient)
    .sort((a, b) => b.montant - a.montant)
    .slice(0, 6);
  const maxClient = topClients[0]?.montant || 1;

  // Graphique
  const byStatut = STATUT_DEVIS.map((s) => ({
    s,
    count: offers.filter((o) => o.os_devis_statut === s).length,
    montant: offers
      .filter((o) => o.os_devis_statut === s)
      .reduce((sum, o) => sum + (o.montant_ht || 0), 0),
  })).filter((d) => d.count > 0);

  const hasFilters =
    search || filterStatuts.length || dateFrom || dateTo || selectedCompany;

  return (
    <div>
      {/* KPIs */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <KpiCard
          label="CA Signé"
          value={fmt(caSigne)}
          sub={`${signe.length} devis signés`}
          accent="#22c55e"
          pct={(caSigne / (caSigne + caPipeline + 1)) * 100}
        />
        <KpiCard
          label="CA Pipeline"
          value={fmt(caPipeline)}
          sub={`${pipeline.length} en cours`}
          accent="#3b82f6"
          pct={(caPipeline / (caSigne + caPipeline + 1)) * 100}
        />
        <KpiCard
          label="Taux conversion"
          value={`${tauxConv}%`}
          sub={`sur ${active.length} actifs`}
          accent="#a78bfa"
          pct={tauxConv}
        />
        <KpiCard
          label="Expirent ≤7j"
          value={expirent.length}
          sub={expirent.length > 0 ? "⚠ action requise" : "✓ tout est ok"}
          accent={expirent.length > 0 ? "#ef4444" : "#22c55e"}
        />
      </div>

      {/* Charts */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 340px",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            background: "#0f1722",
            border: "1px solid #1e293b",
            borderRadius: 6,
            padding: 20,
          }}
        >
          <div
            style={{
              fontSize: 10,
              color: "#475569",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: 14,
            }}
          >
            Répartition CA par statut
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              data={byStatut}
              margin={{ top: 4, right: 4, left: 0, bottom: 4 }}
            >
              <XAxis
                dataKey="s"
                tick={{ fontSize: 9, fill: "#475569", fontFamily: "inherit" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={fmtK}
                tick={{ fontSize: 9, fill: "#475569", fontFamily: "inherit" }}
                axisLine={false}
                tickLine={false}
                width={44}
              />
              <Tooltip
                contentStyle={{
                  background: "#0f1722",
                  border: "1px solid #1e293b",
                  borderRadius: 4,
                  fontSize: 11,
                }}
                formatter={(v, _, p) => [fmt(v), `${p.payload.count} devis`]}
              />
              <Bar dataKey="montant" radius={[3, 3, 0, 0]}>
                {byStatut.map((e) => (
                  <Cell
                    key={e.s}
                    fill={S_COLOR[e.s] || "#64748b"}
                    opacity={0.85}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div
          style={{
            background: "#0f1722",
            border: "1px solid #1e293b",
            borderRadius: 6,
            padding: 20,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              fontSize: 10,
              color: "#475569",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: 14,
            }}
          >
            Top clients
          </div>
          {topClients.map((c, i) => (
            <div
              key={c.id}
              style={{ marginBottom: 9, cursor: "pointer" }}
              onClick={() =>
                onSelectCompany(selectedCompany === c.id ? null : c.id)
              }
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 10,
                  marginBottom: 3,
                }}
              >
                <span
                  style={{
                    color: selectedCompany === c.id ? "#3b82f6" : "#94a3b8",
                    fontWeight: selectedCompany === c.id ? 700 : 400,
                  }}
                >
                  {c.name}
                </span>
                <span style={{ color: "#64748b" }}>
                  {fmtK(c.montant)} · {c.count}
                </span>
              </div>
              <div
                style={{ height: 3, background: "#1e293b", borderRadius: 2 }}
              >
                <div
                  style={{
                    height: 3,
                    background:
                      selectedCompany === c.id
                        ? "#3b82f6"
                        : i === 0
                        ? "#334155"
                        : "#1e293b",
                    border: `1px solid ${
                      selectedCompany === c.id ? "#3b82f688" : "#334155"
                    }`,
                    width: `${(c.montant / maxClient) * 100}%`,
                    borderRadius: 2,
                    transition: "all 0.4s",
                  }}
                />
              </div>
            </div>
          ))}

          {/* Expirations urgentes */}
          {expirent.length > 0 && (
            <div
              style={{
                marginTop: 16,
                paddingTop: 14,
                borderTop: "1px solid #1e293b",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: "#475569",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  marginBottom: 10,
                }}
              >
                Expirations urgentes
              </div>
              {expirent.slice(0, 3).map((o) => {
                const d = o.daysLeft;
                const c = d <= 0 ? "#ef4444" : d <= 2 ? "#f59e0b" : "#eab308";
                return (
                  <div
                    key={o.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "6px 0",
                      borderBottom: "1px solid #0f1a2a",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        color: "#64748b",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: 160,
                      }}
                    >
                      {o._project_attached?._company_attached?.name}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: c,
                        flexShrink: 0,
                      }}
                    >
                      {d <= 0 ? "Expiré" : `J-${d}`}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Table avec filtres par colonne */}
      <div
        style={{
          background: "#0f1722",
          border: "1px solid #1e293b",
          borderRadius: 6,
          padding: 20,
        }}
      >
        {/* Barre de filtres */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 16,
            flexWrap: "wrap",
          }}
        >
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Projet, entreprise, référence…"
          />
          <MultiSelect
            label="Statut"
            options={STATUT_DEVIS}
            selected={filterStatuts}
            onChange={setFilterStatuts}
            colorMap={S_COLOR}
          />
          <DateRange
            dateFrom={dateFrom}
            dateTo={dateTo}
            onChange={(f, t) => {
              setDateFrom(f);
              setDateTo(t);
            }}
          />
          {hasFilters && (
            <button
              onClick={() => {
                setSearch("");
                setFilterStatuts([]);
                setDateFrom("");
                setDateTo("");
                onSelectCompany(null);
              }}
              style={{
                cursor: "pointer",
                padding: "5px 10px",
                background: "none",
                border: "1px solid #1e293b",
                borderRadius: 4,
                color: "#475569",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.07em",
                textTransform: "uppercase",
              }}
            >
              Réinitialiser
            </button>
          )}
          <span style={{ marginLeft: "auto", fontSize: 10, color: "#334155" }}>
            {filtered.length} résultat{filtered.length > 1 ? "s" : ""}
          </span>
        </div>

        {/* En-têtes colonnes */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "170px 1fr 160px 110px 110px 80px",
            gap: 8,
            padding: "7px 10px",
            borderBottom: "1px solid #1e293b",
            fontSize: 9,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          <ColHeader
            label="Client"
            sortKey="client"
            sortBy={sortBy}
            sortDir={sortDir}
            onSort={handleSort}
          />
          <ColHeader
            label="Projet"
            sortKey="projet"
            sortBy={sortBy}
            sortDir={sortDir}
            onSort={handleSort}
          />
          <ColHeader
            label="Référence"
            sortKey="offer"
            sortBy={sortBy}
            sortDir={sortDir}
            onSort={handleSort}
          />
          <ColHeader
            label="Statut"
            sortKey="statut"
            sortBy={sortBy}
            sortDir={sortDir}
            onSort={handleSort}
          />
          <ColHeader
            label="Montant HT"
            sortKey="montant_ht"
            sortBy={sortBy}
            sortDir={sortDir}
            onSort={handleSort}
          />
          <ColHeader
            label="Expiration"
            sortKey="expiration"
            sortBy={sortBy}
            sortDir={sortDir}
            onSort={handleSort}
          />
        </div>

        {/* Lignes */}
        {filtered.length === 0 ? (
          <div
            style={{
              padding: "32px 10px",
              textAlign: "center",
              color: "#334155",
              fontSize: 11,
            }}
          >
            Aucun résultat pour ces filtres
          </div>
        ) : (
          filtered.map((o) => {
            const d = diffDays(o.date_validite);
            const ec =
              d <= 0
                ? "#ef4444"
                : d <= 3
                ? "#f59e0b"
                : d <= 7
                ? "#eab308"
                : "#334155";
            return (
              <div
                key={o.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "170px 1fr 160px 110px 110px 80px",
                  gap: 8,
                  padding: "9px 10px",
                  borderBottom: "1px solid #0a1120",
                  alignItems: "center",
                  transition: "background 0.1s",
                  cursor: "default",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(59,130,246,0.03)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <span
                  style={{
                    fontSize: 11,
                    color: "#94a3b8",
                    fontWeight: 600,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {o._project_attached?._company_attached?.name}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    color: "#64748b",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {o._project_attached?.name}
                </span>
                <span style={{ fontSize: 10, color: "#475569" }}>
                  {o.offer_number}
                </span>
                <Badge label={o.os_devis_statut} />
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#e2e8f0",
                    textAlign: "right",
                  }}
                >
                  {fmt(o.montant_ht)}
                </span>
                <span style={{ fontSize: 10, color: ec, textAlign: "right" }}>
                  {d <= 0 ? "Expiré" : `J-${d}`}
                </span>
              </div>
            );
          })
        )}

        {/* Footer total dynamique */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "170px 1fr 160px 110px 110px 80px",
            gap: 8,
            padding: "12px 10px 4px",
            borderTop: "1px solid #1e293b",
            marginTop: 4,
          }}
        >
          <span style={{ fontSize: 10, color: "#334155", gridColumn: "1/4" }}>
            {hasFilters && (
              <span style={{ color: "#475569" }}>
                Filtré · {filtered.length} devis
              </span>
            )}
          </span>
          <span
            style={{
              fontSize: 10,
              color: "#334155",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            TOTAL HT
          </span>
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "#3b82f6",
              textAlign: "right",
            }}
          >
            {fmt(totalFiltre)}
          </span>
          <span />
        </div>
      </div>
    </div>
  );
}

// ─── ONGLET INTERVENTIONS ─────────────────────────────────────────────────────
function TabInterventions({
  interventions,
  projects,
  selectedCompany,
  onSelectCompany,
}) {
  const [search, setSearch] = useState("");
  const [filterStatuts, setFilterStatuts] = useState([]);
  const [filterTypes, setFilterTypes] = useState([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortDir, setSortDir] = useState("desc");

  const handleSort = (key) => {
    if (sortBy === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(key);
      setSortDir("desc");
    }
  };

  const allTypes = useMemo(
    () => [
      ...new Set(
        interventions.map((i) => i.OS_prestations_type).filter(Boolean)
      ),
    ],
    [interventions]
  );

  const filtered = useMemo(() => {
    let rows = interventions;
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (i) =>
          i.name?.toLowerCase().includes(q) ||
          i._project_attached?.name?.toLowerCase().includes(q) ||
          i._project_attached?._company_attached?.name
            ?.toLowerCase()
            .includes(q)
      );
    }
    if (filterStatuts.length)
      rows = rows.filter((i) => filterStatuts.includes(i.intervention_status));
    if (filterTypes.length)
      rows = rows.filter((i) => filterTypes.includes(i.OS_prestations_type));
    if (dateFrom) rows = rows.filter((i) => i.date && i.date >= dateFrom);
    if (dateTo) rows = rows.filter((i) => i.date && i.date <= dateTo);
    if (selectedCompany)
      rows = rows.filter(
        (i) => i._project_attached?._company_attached?.id === selectedCompany
      );
    return [...rows].sort((a, b) => {
      let va, vb;
      if (sortBy === "client") {
        va = a._project_attached?._company_attached?.name || "";
        vb = b._project_attached?._company_attached?.name || "";
      } else if (sortBy === "projet") {
        va = a._project_attached?.name || "";
        vb = b._project_attached?.name || "";
      } else if (sortBy === "type") {
        va = a.OS_prestations_type || "";
        vb = b.OS_prestations_type || "";
      } else {
        va = new Date(a.date);
        vb = new Date(b.date);
      }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [
    interventions,
    search,
    filterStatuts,
    filterTypes,
    dateFrom,
    dateTo,
    selectedCompany,
    sortBy,
    sortDir,
  ]);

  const terminees = interventions.filter(
    (i) => i.intervention_status === "Terminée"
  );
  const enCours = interventions.filter(
    (i) => i.intervention_status === "En cours"
  );
  const planifiees = interventions.filter(
    (i) => i.intervention_status === "Planifiée"
  );

  // Donut types
  const byType = {};
  interventions.forEach((i) => {
    const t = i.OS_prestations_type || "Autre";
    byType[t] = (byType[t] || 0) + 1;
  });
  const typeData = Object.entries(byType)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));

  // Régions
  const byRegion = {};
  interventions.forEach((i) => {
    const r =
      i._project_attached?.chantier_address?.state || i.address?.city || "?";
    byRegion[r] = (byRegion[r] || 0) + 1;
  });
  const regionData = Object.entries(byRegion).sort((a, b) => b[1] - a[1]);
  const maxRegion = regionData[0]?.[1] || 1;

  // Activité mensuelle
  const byMonth = {};
  interventions.forEach((i) => {
    if (i.date) {
      const m = i.date.slice(0, 7);
      byMonth[m] = (byMonth[m] || 0) + 1;
    }
  });
  const monthData = Object.entries(byMonth)
    .sort()
    .slice(-6)
    .map(([m, count]) => ({ mois: monthLabel(m + "-01"), count }));

  // Top clients
  const byClientI = {};
  interventions.forEach((i) => {
    const c = i._project_attached?._company_attached;
    if (!c) return;
    if (!byClientI[c.id])
      byClientI[c.id] = { id: c.id, name: c.name, count: 0 };
    byClientI[c.id].count++;
  });
  const topClientsI = Object.values(byClientI)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  const maxClientI = topClientsI[0]?.count || 1;

  const hasFilters =
    search ||
    filterStatuts.length ||
    filterTypes.length ||
    dateFrom ||
    dateTo ||
    selectedCompany;

  return (
    <div>
      {/* KPIs */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <KpiCard
          label="Total"
          value={interventions.length}
          sub={`sur ${projects.length} projets`}
          accent="#3b82f6"
          pct={100}
        />
        <KpiCard
          label="Terminées"
          value={terminees.length}
          sub={`${Math.round(
            (terminees.length / interventions.length) * 100
          )}% du total`}
          accent="#22c55e"
          pct={(terminees.length / interventions.length) * 100}
        />
        <KpiCard
          label="En cours"
          value={enCours.length}
          sub="actives"
          accent="#f59e0b"
          pct={(enCours.length / interventions.length) * 100}
        />
        <KpiCard
          label="Planifiées"
          value={planifiees.length}
          sub="à venir"
          accent="#a78bfa"
          pct={(planifiees.length / interventions.length) * 100}
        />
      </div>

      {/* Charts */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 280px",
          gap: 12,
          marginBottom: 20,
        }}
      >
        {/* Donut types */}
        <div
          style={{
            background: "#0f1722",
            border: "1px solid #1e293b",
            borderRadius: 6,
            padding: 20,
          }}
        >
          <div
            style={{
              fontSize: 10,
              color: "#475569",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: 14,
            }}
          >
            Types de prestations
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <ResponsiveContainer width={130} height={130}>
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={36}
                  outerRadius={62}
                  dataKey="value"
                  paddingAngle={3}
                >
                  {typeData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={PRESTATION_COLORS[i % PRESTATION_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#0f1722",
                    border: "1px solid #1e293b",
                    fontSize: 10,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1 }}>
              {typeData.map((t, i) => (
                <div
                  key={t.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 8,
                    cursor: "pointer",
                  }}
                  onClick={() =>
                    setFilterTypes(
                      filterTypes.includes(t.name)
                        ? filterTypes.filter((x) => x !== t.name)
                        : [...filterTypes, t.name]
                    )
                  }
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 2,
                      background:
                        PRESTATION_COLORS[i % PRESTATION_COLORS.length],
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 10,
                      color: filterTypes.includes(t.name)
                        ? "#e2e8f0"
                        : "#94a3b8",
                      flex: 1,
                    }}
                  >
                    {t.name}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: PRESTATION_COLORS[i % PRESTATION_COLORS.length],
                    }}
                  >
                    {t.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Activité mensuelle */}
        <div
          style={{
            background: "#0f1722",
            border: "1px solid #1e293b",
            borderRadius: 6,
            padding: 20,
          }}
        >
          <div
            style={{
              fontSize: 10,
              color: "#475569",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: 14,
            }}
          >
            Activité mensuelle
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart
              data={monthData}
              margin={{ top: 4, right: 4, left: 0, bottom: 4 }}
            >
              <XAxis
                dataKey="mois"
                tick={{ fontSize: 9, fill: "#475569", fontFamily: "inherit" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 9, fill: "#475569", fontFamily: "inherit" }}
                axisLine={false}
                tickLine={false}
                width={20}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  background: "#0f1722",
                  border: "1px solid #1e293b",
                  fontSize: 11,
                }}
              />
              <Bar
                dataKey="count"
                name="Interventions"
                fill="#3b82f6"
                radius={[3, 3, 0, 0]}
                opacity={0.8}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Régions + Top clients */}
        <div
          style={{
            background: "#0f1722",
            border: "1px solid #1e293b",
            borderRadius: 6,
            padding: 20,
          }}
        >
          <div
            style={{
              fontSize: 10,
              color: "#475569",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            Zones d'activité
          </div>
          {regionData.map(([r, v], i) => (
            <div key={r} style={{ marginBottom: 8 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 10,
                  marginBottom: 3,
                }}
              >
                <span style={{ color: "#94a3b8" }}>{r}</span>
                <span style={{ color: "#64748b" }}>{v}</span>
              </div>
              <div
                style={{ height: 3, background: "#1e293b", borderRadius: 2 }}
              >
                <div
                  style={{
                    height: 3,
                    background: i === 0 ? "#3b82f6" : "#334155",
                    width: `${(v / maxRegion) * 100}%`,
                    borderRadius: 2,
                  }}
                />
              </div>
            </div>
          ))}
          <div
            style={{
              marginTop: 14,
              paddingTop: 12,
              borderTop: "1px solid #1e293b",
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: "#475569",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              Top clients
            </div>
            {topClientsI.map((c, i) => (
              <div
                key={c.id}
                style={{ marginBottom: 7, cursor: "pointer" }}
                onClick={() =>
                  onSelectCompany(selectedCompany === c.id ? null : c.id)
                }
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 10,
                    marginBottom: 3,
                  }}
                >
                  <span
                    style={{
                      color: selectedCompany === c.id ? "#3b82f6" : "#94a3b8",
                      fontWeight: selectedCompany === c.id ? 700 : 400,
                    }}
                  >
                    {c.name}
                  </span>
                  <span style={{ color: "#64748b" }}>{c.count}</span>
                </div>
                <div
                  style={{ height: 3, background: "#1e293b", borderRadius: 2 }}
                >
                  <div
                    style={{
                      height: 3,
                      background:
                        selectedCompany === c.id ? "#3b82f6" : "#334155",
                      width: `${(c.count / maxClientI) * 100}%`,
                      borderRadius: 2,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Table interventions */}
      <div
        style={{
          background: "#0f1722",
          border: "1px solid #1e293b",
          borderRadius: 6,
          padding: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 16,
            flexWrap: "wrap",
          }}
        >
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Intervention, projet, entreprise…"
          />
          <MultiSelect
            label="Statut"
            options={STATUT_INTERV}
            selected={filterStatuts}
            onChange={setFilterStatuts}
            colorMap={S_COLOR}
          />
          <MultiSelect
            label="Type"
            options={allTypes}
            selected={filterTypes}
            onChange={setFilterTypes}
          />
          <DateRange
            dateFrom={dateFrom}
            dateTo={dateTo}
            onChange={(f, t) => {
              setDateFrom(f);
              setDateTo(t);
            }}
          />
          {hasFilters && (
            <button
              onClick={() => {
                setSearch("");
                setFilterStatuts([]);
                setFilterTypes([]);
                setDateFrom("");
                setDateTo("");
                onSelectCompany(null);
              }}
              style={{
                cursor: "pointer",
                padding: "5px 10px",
                background: "none",
                border: "1px solid #1e293b",
                borderRadius: 4,
                color: "#475569",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.07em",
                textTransform: "uppercase",
              }}
            >
              Réinitialiser
            </button>
          )}
          <span style={{ marginLeft: "auto", fontSize: 10, color: "#334155" }}>
            {filtered.length} résultat{filtered.length > 1 ? "s" : ""}
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "150px 180px 1fr 140px 90px 100px",
            gap: 8,
            padding: "7px 10px",
            borderBottom: "1px solid #1e293b",
            fontSize: 9,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          <ColHeader
            label="Client"
            sortKey="client"
            sortBy={sortBy}
            sortDir={sortDir}
            onSort={handleSort}
          />
          <ColHeader
            label="Projet"
            sortKey="projet"
            sortBy={sortBy}
            sortDir={sortDir}
            onSort={handleSort}
          />
          <ColHeader
            label="Intervention"
            sortKey="name"
            sortBy={sortBy}
            sortDir={sortDir}
            onSort={handleSort}
          />
          <ColHeader
            label="Type"
            sortKey="type"
            sortBy={sortBy}
            sortDir={sortDir}
            onSort={handleSort}
          />
          <ColHeader
            label="Date"
            sortKey="date"
            sortBy={sortBy}
            sortDir={sortDir}
            onSort={handleSort}
          />
          <span style={{ color: "#334155" }}>Statut</span>
        </div>

        {filtered.length === 0 ? (
          <div
            style={{
              padding: "32px 10px",
              textAlign: "center",
              color: "#334155",
              fontSize: 11,
            }}
          >
            Aucun résultat pour ces filtres
          </div>
        ) : (
          filtered.map((i) => (
            <div
              key={i.id}
              style={{
                display: "grid",
                gridTemplateColumns: "150px 180px 1fr 140px 90px 100px",
                gap: 8,
                padding: "9px 10px",
                borderBottom: "1px solid #0a1120",
                alignItems: "center",
                transition: "background 0.1s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(59,130,246,0.03)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <span
                style={{
                  fontSize: 11,
                  color: "#94a3b8",
                  fontWeight: 600,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {i._project_attached?._company_attached?.name}
              </span>
              <span
                style={{
                  fontSize: 10,
                  color: "#64748b",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {i._project_attached?.name}
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: "#e2e8f0",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {i.name}
              </span>
              <span
                style={{
                  fontSize: 10,
                  color: "#64748b",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {i.OS_prestations_type}
              </span>
              <span style={{ fontSize: 10, color: "#475569" }}>
                {fmtDate(i.date)}
              </span>
              <Badge label={i.intervention_status || "—"} />
            </div>
          ))
        )}
        <div
          style={{
            padding: "8px 10px",
            fontSize: 10,
            color: "#334155",
            borderTop: "1px solid #1e293b",
            marginTop: 4,
          }}
        >
          {filtered.length} intervention{filtered.length > 1 ? "s" : ""}{" "}
          affichée{filtered.length > 1 ? "s" : ""}
        </div>
      </div>
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function QualidaDashboard() {
  const [tab, setTab] = useState("devis");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState(null);

  useEffect(() => {
    fetchAll().then((d) => {
      setData(d);
      setLoading(false);
    });
  }, []);

  const selectedName = useMemo(() => {
    if (!selectedCompany || !data) return null;
    return [
      ...data.offers.map((o) => o._project_attached?._company_attached),
      ...data.interventions.map((i) => i._project_attached?._company_attached),
    ].find((c) => c?.id === selectedCompany)?.name;
  }, [selectedCompany, data]);

  if (loading)
    return (
      <div
        style={{
          background: "#0a0e14",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'IBM Plex Mono', monospace",
        }}
      >
        <div style={{ textAlign: "center", color: "#3b82f6" }}>
          <div
            style={{
              fontSize: 10,
              letterSpacing: "0.2em",
              opacity: 0.5,
              marginBottom: 8,
            }}
          >
            CHARGEMENT
          </div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>QUALIDAL CRM</div>
        </div>
      </div>
    );

  return (
    <div
      style={{
        background: "#0a0e14",
        minHeight: "100vh",
        fontFamily: "'IBM Plex Mono', monospace",
        color: "#e2e8f0",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: #0a0e14; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 2px; }
        input::placeholder { color: #334155; }
      `}</style>

      {/* HEADER */}
      <div
        style={{
          borderBottom: "1px solid #1e293b",
          padding: "13px 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#0a0e14",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 7,
                height: 7,
                background: "#3b82f6",
                borderRadius: "50%",
                boxShadow: "0 0 7px #3b82f6",
              }}
            />
            <span
              style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.15em" }}
            >
              QUALIDAL
            </span>
          </div>
          <div
            style={{
              display: "flex",
              gap: 2,
              background: "#0f1722",
              border: "1px solid #1e293b",
              borderRadius: 5,
              padding: 3,
            }}
          >
            {[
              ["devis", "Devis"],
              ["interventions", "Interventions"],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                style={{
                  cursor: "pointer",
                  padding: "5px 16px",
                  borderRadius: 3,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  border: "none",
                  background: tab === key ? "#1e293b" : "transparent",
                  color: tab === key ? "#e2e8f0" : "#475569",
                  transition: "all 0.15s",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {selectedName && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 10px",
                background: "rgba(59,130,246,0.08)",
                border: "1px solid #3b82f633",
                borderRadius: 4,
              }}
            >
              <span style={{ fontSize: 10, color: "#3b82f6" }}>
                Client : {selectedName}
              </span>
              <button
                onClick={() => setSelectedCompany(null)}
                style={{
                  cursor: "pointer",
                  background: "none",
                  border: "none",
                  color: "#3b82f6",
                  fontSize: 13,
                  lineHeight: 1,
                  padding: 0,
                }}
              >
                ×
              </button>
            </div>
          )}
          {USE_MOCK && (
            <span
              style={{
                fontSize: 9,
                color: "#f59e0b",
                padding: "3px 7px",
                border: "1px solid #f59e0b33",
                borderRadius: 3,
              }}
            >
              MOCK
            </span>
          )}
          <span style={{ fontSize: 9, color: "#334155" }}>
            {new Date()
              .toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
              .toUpperCase()}
          </span>
        </div>
      </div>

      <div style={{ padding: "22px 28px", maxWidth: 1400, margin: "0 auto" }}>
        {tab === "devis" ? (
          <TabDevis
            offers={data.offers}
            selectedCompany={selectedCompany}
            onSelectCompany={setSelectedCompany}
          />
        ) : (
          <TabInterventions
            interventions={data.interventions}
            projects={data.projects}
            selectedCompany={selectedCompany}
            onSelectCompany={setSelectedCompany}
          />
        )}
      </div>

      <div
        style={{
          padding: "14px 28px",
          fontSize: 9,
          color: "#1e293b",
          textAlign: "center",
          letterSpacing: "0.1em",
        }}
      >
        QUALIDAL · DASHBOARD COMMERCIAL & OPÉRATIONNEL ·{" "}
        {USE_MOCK ? "DONNÉES DE DÉMONSTRATION" : "BUBBLE LIVE"}
      </div>
    </div>
  );
}
