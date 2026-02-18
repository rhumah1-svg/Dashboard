import { useState, useEffect, useMemo, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const USE_MOCK = false;

// ─── MOCK DATA (IDENTIQUE À TON CODE) ─────────────────────────────────────────
const MOCK_COMPANIES = [
  { id: "c1", name: "IDEC" }, { id: "c2", name: "COGESTRA" },
  { id: "c3", name: "ACME Construction" }, { id: "c4", name: "VINCI Construction" },
  { id: "c5", name: "EIFFAGE" }, { id: "c6", name: "SOGEA" },
];
const MOCK_PROJECTS = [
  { id: "p1", name: "AREFIM - REIMS (51)",       _company_attached: "c1", OS_prestations_type: "Dallage",           OS_devis_status: "Devis signé",         premiere_interv: "2025-01-15", derniere_interv: "2025-03-20" },
  { id: "p2", name: "LOZENNES (59)",              _company_attached: "c2", OS_prestations_type: "Réparation béton", OS_devis_status: "Devis envoyé",         premiere_interv: "2024-11-01", derniere_interv: "2025-02-28" },
  { id: "p3", name: "Chantier Paris 15",          _company_attached: "c3", OS_prestations_type: "Dallage",           OS_devis_status: "A relancer",            premiere_interv: "2025-02-01", derniere_interv: "2025-04-15" },
  { id: "p4", name: "Parking Rouen",              _company_attached: "c4", OS_prestations_type: "Marquage sol",      OS_devis_status: "Saisie d'information", premiere_interv: "2025-01-10", derniere_interv: "2025-02-10" },
  { id: "p5", name: "Zone artisanale Creil",      _company_attached: "c5", OS_prestations_type: "Dallage",           OS_devis_status: "Devis signé",          premiere_interv: "2025-01-20", derniere_interv: "2025-05-30" },
  { id: "p6", name: "ZI Amiens Nord",             _company_attached: "c2", OS_prestations_type: "Réparation béton", OS_devis_status: "Relance envoyée",       premiere_interv: "2024-12-01", derniere_interv: "2025-03-01" },
  { id: "p7", name: "Plateforme Marne-la-Vallée", _company_attached: "c6", OS_prestations_type: "Dallage",           OS_devis_status: "Chiffrage en cours",   premiere_interv: "2025-02-10", derniere_interv: "2025-06-30" },
];
const MOCK_OFFERS = [
  { id: "o1",  offer_number: "devis_de00001898", os_devis_statut: "Devis envoyé",         date_offre: "2025-01-10", date_validite: "2025-06-20", _project_attached: "p1", montant_ht: 48200,  is_active: true  },
  { id: "o2",  offer_number: "devis_de00001901", os_devis_statut: "Devis signé",          date_offre: "2025-01-05", date_validite: "2025-07-28", _project_attached: "p2", montant_ht: 127500, is_active: true  },
  { id: "o3",  offer_number: "devis_de00001905", os_devis_statut: "Devis envoyé",         date_offre: "2025-03-20", date_validite: "2025-06-19", _project_attached: "p3", montant_ht: 33750,  is_active: true  },
  { id: "o4",  offer_number: "devis_de00001910", os_devis_statut: "A relancer",           date_offre: "2024-12-15", date_validite: "2025-06-21", _project_attached: "p4", montant_ht: 89000,  is_active: true  },
  { id: "o5",  offer_number: "devis_de00001912", os_devis_statut: "Classé sans suite",    date_offre: "2024-12-01", date_validite: "2025-01-15", _project_attached: "p1", montant_ht: 22000,  is_active: false },
  { id: "o6",  offer_number: "devis_de00001915", os_devis_statut: "Devis signé",          date_offre: "2025-02-12", date_validite: "2025-08-15", _project_attached: "p6", montant_ht: 215000, is_active: true  },
  { id: "o7",  offer_number: "devis_de00001918", os_devis_statut: "Devis envoyé",         date_offre: "2025-01-25", date_validite: "2025-06-25", _project_attached: "p3", montant_ht: 67300,  is_active: true  },
  { id: "o8",  offer_number: "devis_de00001920", os_devis_statut: "Relance envoyée",       date_offre: "2025-01-08", date_validite: "2025-06-22", _project_attached: "p4", montant_ht: 156000, is_active: true  },
  { id: "o9",  offer_number: "devis_de00001922", os_devis_statut: "Saisie d'information", date_offre: "2025-02-01", date_validite: "2025-07-20", _project_attached: "p7", montant_ht: 98500,  is_active: true  },
  { id: "o10", offer_number: "devis_de00001925", os_devis_statut: "Devis signé",          date_offre: "2025-02-18", date_validite: "2025-08-01", _project_attached: "p5", montant_ht: 310000, is_active: true  },
];
const MOCK_INTERVENTIONS = [
  { id: "i1",  name: "Reprise fissures dalle",      _project_attached: "p1", date: "2025-01-15", OS_prestations_type: "Réparation béton", intervention_status: "Terminé",  address: { city: "Reims"  } },
  { id: "i2",  name: "Coulage dalle hangar",        _project_attached: "p2", date: "2024-11-20", OS_prestations_type: "Dallage",          intervention_status: "Terminé",  address: { city: "Lille"  } },
  { id: "i3",  name: "Marquage parking",            _project_attached: "p4", date: "2025-01-12", OS_prestations_type: "Marquage sol",      intervention_status: "Terminé",  address: { city: "Rouen"  } },
  { id: "i4",  name: "Traitement sol industriel",   _project_attached: "p5", date: "2025-01-22", OS_prestations_type: "Dallage",           intervention_status: "En cours", address: { city: "Creil"  } },
  { id: "i5",  name: "Injection résine fissures",   _project_attached: "p6", date: "2024-12-10", OS_prestations_type: "Réparation béton", intervention_status: "Terminé",  address: { city: "Amiens" } },
  { id: "i6",  name: "Ponçage + durcisseur",        _project_attached: "p2", date: "2025-01-05", OS_prestations_type: "Dallage",           intervention_status: "Terminé",  address: { city: "Lille"  } },
  { id: "i7",  name: "Reprise joint de dilatation", _project_attached: "p1", date: "2025-03-03", OS_prestations_type: "Réparation béton", intervention_status: "Planifié", address: { city: "Reims"  } },
  { id: "i8",  name: "Coulage dallage neuf",        _project_attached: "p7", date: "2025-02-12", OS_prestations_type: "Dallage",           intervention_status: "Planifié", address: { city: "Marne"  } },
  { id: "i9",  name: "Traitement anti-poussière",   _project_attached: "p3", date: "2025-02-05", OS_prestations_type: "Dallage",           intervention_status: "En cours", address: { city: "Paris"  } },
  { id: "i10", name: "Ragréage surface",            _project_attached: "p6", date: "2025-01-28", OS_prestations_type: "Réparation béton", intervention_status: "Terminé",  address: { city: "Amiens" } },
  { id: "i11", name: "Joints souples",              _project_attached: "p5", date: "2025-02-01", OS_prestations_type: "Réparation béton", intervention_status: "En cours", address: { city: "Creil"  } },
  { id: "i12", name: "Marquage allées",             _project_attached: "p2", date: "2025-03-15", OS_prestations_type: "Marquage sol",      intervention_status: "Planifié", address: { city: "Lille"  } },
];

// ─── FETCH (LOGIQUE EXACTEMENT PAREILLE) ──────────────────────────────────────
// ─── CONFIGURATION SÉCURITÉ ───────────────────────────────────────────────────
// ⚠️ Doit être identique à la variable "MY_INTERNAL_SECRET" dans Vercel
const API_SECRET = 'SuperSecu_Dash_2024!Prod'; 

// ─── FETCH (LOGIQUE EXACTEMENT PAREILLE + SÉCURITÉ AJOUTÉE) ───────────────────
async function fetchAllPages(endpoint) {
  let results = [], cursor = 0;
  while (true) {
    // 👇 MODIFICATION ICI : Ajout des headers pour le mot de passe
    const res = await fetch(`/api/bubble?table=${endpoint}&cursor=${cursor}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-secret-token': API_SECRET // <--- La clé du coffre-fort
      }
    });

    // Petite sécurité anti-crash si le serveur rejette (401/403)
    if (!res.ok) {
        console.error(`Erreur API (${res.status}) sur la table : ${endpoint}`);
        break; 
    }

    const data = await res.json();
    const page = data.response?.results || [];
    results = results.concat(page);
    
    // Si plus rien à charger, on sort
    if ((data.response?.remaining ?? 0) === 0) break;
    
    cursor += page.length;
  }
  return results;
}

function extractCity(addressObj) {
  if (!addressObj?.address) return null;
  const parts = addressObj.address.split(",");
  return parts[0].trim().replace(/^\d{4,5}\s*/, "") || parts[1]?.trim() || null;
}

async function fetchAll() {
  if (typeof USE_MOCK !== 'undefined' && USE_MOCK) {
    const cm = Object.fromEntries(MOCK_COMPANIES.map(c => [c.id, c]));
    const pm = Object.fromEntries(MOCK_PROJECTS.map(p => [p.id, { ...p, _company_attached: cm[p._company_attached] }]));
    // Avancement mock : p1=67%, p2=45%, p5=100%, autres=0
    const avancement = { p1: 0.67, p2: 0.45, p5: 1.0, p6: 0.22 };
    Object.values(pm).forEach(p => { p.avancement = avancement[p.id] || 0; });
    return {
      offers: MOCK_OFFERS.map(o => ({ ...o, _project_attached: pm[o._project_attached] })),
      interventions: MOCK_INTERVENTIONS.map(i => ({ ...i, _project_attached: pm[i._project_attached] })),
      projects: Object.values(pm),
    };
  }

  const [rawOffers, rawProjects, rawInterventions, rawCompanies, rawItems] = await Promise.all([
    fetchAllPages("offers_history_documents"),
    fetchAllPages("projects"),
    fetchAllPages("interventions"),
    fetchAllPages("companies"),
    fetchAllPages("items_devis"),
  ]);

  const companiesMap = Object.fromEntries(rawCompanies.map(c => [c._id, c]));

  const numByProject    = {};
  const denomByProject = {};
  const montantByOffer = {};

  rawItems.forEach(item => {
    const pid     = item._project_attached;
    const offerId = item.offer_document_item;
    const totalHT = item["Total HT"] || item.Total_HT || item.total_ht || 0;
    const prixInterv = item.prix_intervention || item["prix intervention"] || 0;
    const isInterv   = item["intervention?"] === true || item.intervention === true || item.is_intervention === true;

    if (offerId) montantByOffer[offerId] = (montantByOffer[offerId] || 0) + totalHT;
    if (pid) {
      denomByProject[pid] = (denomByProject[pid] || 0) + totalHT;
      if (isInterv) numByProject[pid] = (numByProject[pid] || 0) + prixInterv;
    }
  });

  const projectsMap = Object.fromEntries(rawProjects.map(p => {
    const company = companiesMap[p._company_attached] || null;
    const city    = extractCity(p.chantier_address);
    const num     = numByProject[p._id]   || 0;
    const denom   = denomByProject[p._id] || 0;
    const avancement = denom > 0 ? Math.min(num / denom, 1) : 0;
    return [p._id, {
      id: p._id, name: p.name || "",
      project_code: p.project_code || p._id,
      _company_attached: company ? { id: company._id, name: company.name } : { id: p._company_attached, name: "—" },
      chantier_address: { city, state: city },
      OS_prestations_type: p.OS_prestations_type || "",
      OS_devis_status: p.OS_devis_status || "",
      premiere_interv: p.premiere_interv || null,
      derniere_interv: p.derniere_interv || null,
      avancement,
    }];
  }));

  const offers = rawOffers.filter(o => o._project_attached).map(o => {
    const project = projectsMap[o._project_attached] || null;
    return {
      id: o._id,
      offer_number: o.devis_number || o._id,
      os_devis_statut: project?.OS_devis_status || "Saisie d'information",
      date_offre: o.date_offre ? o.date_offre.slice(0, 10) : o["Created Date"]?.slice(0, 10),
      date_validite: o.date_validite ? o.date_validite.slice(0, 10) : null,
      _project_attached: project,
      montant_ht: montantByOffer[o._id] || 0,
      is_active: o.is_active !== false,
      file_url: o.file || null,
    };
  });

  const interventions = rawInterventions.map(i => {
    const project = projectsMap[i._project_attached] || null;
    return {
      id: i._id, name: i.name || "Sans nom",
      _project_attached: project,
      date: i.date ? i.date.slice(0, 10) : i["Created Date"]?.slice(0, 10),
      OS_prestations_type: i.OS_prestations_type || "",
      intervention_status: i.intervention_status || i.OS_project_intervention_status || "—",
      address: { city: extractCity(i.address) || project?.chantier_address?.city || "—" },
    };
  });

  return { offers, interventions, projects: Object.values(projectsMap) };
}

// ─── CONSTANTES ───────────────────────────────────────────────────────────────
const STATUT_DEVIS = ["Saisie d'information","Chiffrage en cours","Validé par l'administration","Devis envoyé","Devis signé","Projet terminé","A relancer","Relance envoyée","Classé sans suite","Non formalisé"];
const STATUT_INTERV = ["Planifié","En cours","Terminé","Annulé"];
const STATUTS_SIGNES    = ["Devis signé","Projet terminé"];
const STATUTS_PIPELINE = ["Chiffrage en cours","Validé par l'administration","Devis envoyé","A relancer","Relance envoyée"];

// MAPPING COULEURS POUR FOND CLAIR
// On garde les mêmes logiques mais on adapte les hexas pour que ça ressorte sur du blanc
const S_COLOR = {
  "Saisie d'information":"#475569","Chiffrage en cours":"#0891b2","Validé par l'administration":"#7c3aed",
  "Devis envoyé":"#2563eb","Devis signé":"#16a34a","Projet terminé":"#059669",
  "A relancer":"#d97706","Relance envoyée":"#ea580c","Classé sans suite":"#dc2626","Non formalisé":"#4b5563",
  "Planifié":"#8b5cf6","En cours":"#2563eb","Terminé":"#16a34a","Annulé":"#dc2626",
};
const PRESTATION_COLORS = ["#3b82f6","#22c55e","#f59e0b","#a78bfa","#ef4444","#06b6d4","#f97316","#10b981","#8b5cf6"];

const fmt       = n => new Intl.NumberFormat("fr-FR", { style:"currency", currency:"EUR", maximumFractionDigits:0 }).format(n||0);
const fmtK      = n => n >= 1000 ? `${(n/1000).toFixed(0)}k€` : `${n}€`;
const fmtDate  = d => d ? new Date(d).toLocaleDateString("fr-FR") : "—";
const mLabel    = d => new Date(d).toLocaleDateString("fr-FR", { month:"short", year:"2-digit" });
const diffDays = d => d ? Math.ceil((new Date(d)-new Date())/86400000) : null;
const inRange  = (dateStr, from, to) => {
  if (!dateStr) return true;
  if (from && dateStr < from) return false;
  if (to   && dateStr > to)   return false;
  return true;
};

// ─── COMPOSANTS UI (Modifiés seulement pour le Style) ────────────────────────
function Badge({ label }) {
  const c = S_COLOR[label] || "#64748b";
  // Modif: Background plus transparent et padding légèrement ajusté
  return <span style={{ fontSize:9, fontWeight:700, letterSpacing:"0.05em", textTransform:"uppercase", padding:"3px 8px", borderRadius:4, color:c, background:`${c}15`, border:`1px solid ${c}30`, whiteSpace:"nowrap", display:"inline-block", maxWidth:"100%", overflow:"hidden", textOverflow:"ellipsis" }}>{label}</span>;
}

function KpiCard({ label, value, sub, accent, pct=0 }) {
  // Modif: Fond blanc, ombres légères, bordures grises
  return (
    <div style={{ background:"white", border:"1px solid #e2e8f0", borderRadius:8, padding:"20px 24px", boxShadow:"0 1px 2px rgba(0,0,0,0.02)" }}>
      <div style={{ fontSize:10, color:"#64748b", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:10, fontWeight:600 }}>{label}</div>
      <div style={{ fontSize:28, fontWeight:700, color:accent, lineHeight:1, letterSpacing:"-0.03em" }}>{value}</div>
      <div style={{ fontSize:11, color:"#64748b", marginTop:8 }}>{sub}</div>
      <div style={{ marginTop:12, height:3, background:"#f1f5f9", borderRadius:2 }}>
        <div style={{ height:3, background:accent, width:`${Math.min(pct,100)}%`, borderRadius:2, opacity:0.8 }} />
      </div>
    </div>
  );
}

function MultiSelect({ label, options, selected, onChange, colorMap }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const toggle = v => onChange(selected.includes(v) ? selected.filter(x=>x!==v) : [...selected,v]);
  const active = selected.length > 0;
  // Modif: Style bouton blanc/gris
  return (
    <div ref={ref} style={{ position:"relative" }}>
      <button onClick={() => setOpen(o=>!o)} style={{ cursor:"pointer", display:"flex", alignItems:"center", gap:6, padding:"6px 12px", borderRadius:6, border:`1px solid ${active?"#2563eb44":"#cbd5e1"}`, background:active?"#eff6ff":"white", color:active?"#2563eb":"#475569", fontSize:11, fontWeight:600, letterSpacing:"0.02em", textTransform:"uppercase", boxShadow:"0 1px 2px rgba(0,0,0,0.02)" }}>
        {label}{active?` (${selected.length})`:""} <span style={{ fontSize:8, opacity:0.6 }}>{open?"▲":"▼"}</span>
      </button>
      {open && (
        <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, zIndex:200, background:"white", border:"1px solid #e2e8f0", borderRadius:6, padding:6, minWidth:220, maxHeight:280, overflowY:"auto", boxShadow:"0 4px 12px rgba(0,0,0,0.08)" }}>
          {selected.length>0 && <div onClick={()=>onChange([])} style={{ cursor:"pointer", fontSize:10, color:"#64748b", padding:"6px 10px", marginBottom:4, fontWeight:500 }}>✕ Tout effacer</div>}
          {options.map(opt => {
            const c = colorMap?.[opt]||"#64748b"; const sel = selected.includes(opt);
            return (
              <div key={opt} onClick={()=>toggle(opt)} style={{ cursor:"pointer", display:"flex", alignItems:"center", gap:8, padding:"8px 10px", borderRadius:4, background:sel?`${c}12`:"transparent" }}>
                <div style={{ width:14, height:14, borderRadius:4, border:`1px solid ${sel?c:"#cbd5e1"}`, background:sel?c:"white", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {sel && <span style={{ fontSize:9, color:"white", fontWeight:900 }}>✓</span>}
                </div>
                <span style={{ fontSize:12, color:sel?c:"#475569", fontWeight:sel?600:400 }}>{opt}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SearchInput({ value, onChange, placeholder }) {
  // Modif: Style input blanc
  return (
    <div style={{ position:"relative", display:"flex", alignItems:"center" }}>
      <span style={{ position:"absolute", left:10, fontSize:13, color:"#94a3b8", pointerEvents:"none" }}>⌕</span>
      <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder||"Rechercher…"}
        style={{ padding:"8px 32px 8px 30px", background:"white", border:"1px solid #cbd5e1", borderRadius:6, color:"#334155", fontSize:12, fontFamily:"inherit", outline:"none", width:240, boxShadow:"0 1px 2px rgba(0,0,0,0.02)" }}
        onFocus={e=>e.target.style.borderColor="#2563eb"} onBlur={e=>e.target.style.borderColor="#cbd5e1"} />
      {value && <span onClick={()=>onChange("")} style={{ position:"absolute", right:10, cursor:"pointer", fontSize:12, color:"#94a3b8" }}>✕</span>}
    </div>
  );
}

function DateRange({ dateFrom, dateTo, onChange, label }) {
  const active = dateFrom || dateTo;
  const inp = { background:"transparent", border:"none", color:"#475569", fontSize:11, fontFamily:"inherit", outline:"none", padding:"0", width:85, cursor:"pointer" };
  // Modif: Style container blanc
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 12px", borderRadius:6, border:`1px solid ${active?"#2563eb44":"#cbd5e1"}`, background:active?"#eff6ff":"white", boxShadow:"0 1px 2px rgba(0,0,0,0.02)" }}>
      {label && <span style={{ fontSize:10, color:active?"#2563eb":"#64748b", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.05em", marginRight:4 }}>{label}</span>}
      <div style={{ display:"flex", alignItems:"center", gap:4 }}>
        <input type="date" value={dateFrom||""} onChange={e=>onChange(e.target.value,dateTo)} style={inp} />
        <span style={{ fontSize:10, color:"#94a3b8" }}>→</span>
        <input type="date" value={dateTo||""} onChange={e=>onChange(dateFrom,e.target.value)} min={dateFrom||undefined} style={inp} />
      </div>
      {active && <span onClick={()=>onChange("","")} style={{ cursor:"pointer", fontSize:14, color:"#64748b", paddingLeft:4 }}>×</span>}
    </div>
  );
}

function ColHeader({ label, sortKey, sortBy, sortDir, onSort }) {
  const active = sortBy===sortKey;
  // Modif: Couleur texte
  return (
    <span onClick={()=>onSort(sortKey)} style={{ cursor:"pointer", display:"flex", alignItems:"center", gap:4, userSelect:"none", color:active?"#334155":"#64748b", fontWeight:600 }}>
      {label}<span style={{ fontSize:8, opacity:active?1:0.4 }}>{active&&sortDir==="asc"?"▲":"▼"}</span>
    </span>
  );
}

function ProgressBar({ value }) {
  const pct = Math.round((value||0)*100);
  const color = pct >= 80 ? "#16a34a" : pct >= 50 ? "#f59e0b" : pct >= 20 ? "#3b82f6" : "#64748b";
  // Modif: Fond barre gris clair
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
      <div style={{ flex:1, height:5, background:"#f1f5f9", borderRadius:3 }}>
        <div style={{ height:5, background:color, width:`${pct}%`, borderRadius:3, transition:"width 0.3s" }} />
      </div>
      <span style={{ fontSize:10, color:color, fontWeight:700, width:32, textAlign:"right", flexShrink:0 }}>{pct}%</span>
    </div>
  );
}

// ─── ONGLET DEVIS (LOGIQUE IDENTIQUE) ─────────────────────────────────────────
function TabDevis({ offers, selectedCompany, onSelectCompany }) {
  const [periodFrom, setPeriodFrom] = useState("");
  const [periodTo,   setPeriodTo]   = useState("");
  const [search, setSearch]                = useState("");
  const [filterStatuts, setFilterStatuts] = useState([]);
  const [dateFrom, setDateFrom]           = useState("");
  const [dateTo, setDateTo]               = useState("");
  const [sortBy, setSortBy]               = useState("date_offre");
  const [sortDir, setSortDir]             = useState("desc");

  const handleSort = k => { if (sortBy===k) setSortDir(d=>d==="asc"?"desc":"asc"); else { setSortBy(k); setSortDir("desc"); } };

  const offersInPeriod = useMemo(() => offers.filter(o => inRange(o.date_offre, periodFrom, periodTo)), [offers, periodFrom, periodTo]);

  const filtered = useMemo(() => {
    let rows = offers;
    if (search.trim()) { const q=search.toLowerCase(); rows=rows.filter(o=>o._project_attached?.name?.toLowerCase().includes(q)||o._project_attached?._company_attached?.name?.toLowerCase().includes(q)||o.offer_number?.toLowerCase().includes(q)); }
    if (filterStatuts.length) rows=rows.filter(o=>filterStatuts.includes(o.os_devis_statut));
    if (dateFrom) rows=rows.filter(o=>o.date_offre&&o.date_offre>=dateFrom);
    if (dateTo)   rows=rows.filter(o=>o.date_offre&&o.date_offre<=dateTo);
    if (selectedCompany) rows=rows.filter(o=>o._project_attached?._company_attached?.id===selectedCompany);
    return [...rows].sort((a,b)=>{
      let va,vb;
      if (sortBy==="montant_ht")      { va=a.montant_ht||0;  vb=b.montant_ht||0; }
      else if (sortBy==="client")     { va=a._project_attached?._company_attached?.name||""; vb=b._project_attached?._company_attached?.name||""; }
      else if (sortBy==="projet")     { va=a._project_attached?.name||""; vb=b._project_attached?.name||""; }
      else if (sortBy==="expiration") { va=new Date(a.date_validite||0); vb=new Date(b.date_validite||0); }
      else if (sortBy==="avancement") { va=a._project_attached?.avancement||0; vb=b._project_attached?.avancement||0; }
      else                            { va=new Date(a.date_offre||0);    vb=new Date(b.date_offre||0); }
      if (va<vb) return sortDir==="asc"?-1:1;
      if (va>vb) return sortDir==="asc"?1:-1;
      return 0;
    });
  }, [offers, search, filterStatuts, dateFrom, dateTo, selectedCompany, sortBy, sortDir]);

  const active     = offersInPeriod.filter(o=>o.is_active);
  const signe      = active.filter(o=>STATUTS_SIGNES.includes(o.os_devis_statut));
  const pipeline   = active.filter(o=>STATUTS_PIPELINE.includes(o.os_devis_statut));
  const caSigne    = signe.reduce((s,o)=>s+(o.montant_ht||0),0);
  const caPipeline = pipeline.reduce((s,o)=>s+(o.montant_ht||0),0);
  const tauxConv   = active.length ? Math.round((signe.length/active.length)*100) : 0;
  const expirent   = active.filter(o=>STATUTS_PIPELINE.includes(o.os_devis_statut))
    .map(o=>({...o,daysLeft:diffDays(o.date_validite)}))
    .filter(o=>o.daysLeft!==null&&o.daysLeft<=7).sort((a,b)=>a.daysLeft-b.daysLeft);
  const totalFiltre = filtered.reduce((s,o)=>s+(o.montant_ht||0),0);

  const byClient={};
  active.forEach(o=>{
    const c=o._project_attached?._company_attached; if(!c) return;
    if(!byClient[c.id]) byClient[c.id]={id:c.id,name:c.name,montant:0,count:0};
    byClient[c.id].montant+=o.montant_ht||0; byClient[c.id].count++;
  });
  const topClients=Object.values(byClient).sort((a,b)=>b.montant-a.montant).slice(0,6);
  const maxClient=topClients[0]?.montant||1;

  const byStatut=STATUT_DEVIS.map(s=>({
    s:s.length>12?s.slice(0,12)+"…":s, full:s,
    count:offersInPeriod.filter(o=>o.os_devis_statut===s).length,
    montant:offersInPeriod.filter(o=>o.os_devis_statut===s).reduce((sum,o)=>sum+(o.montant_ht||0),0),
  })).filter(d=>d.count>0);

  const hasPeriod  = periodFrom||periodTo;
  const hasFilters = search||filterStatuts.length||dateFrom||dateTo||selectedCompany;

  return (
    <div>
      {/* Filtre Période KPI - Modif Style */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20, padding:"12px 16px", background:"white", border:"1px solid #e2e8f0", borderRadius:8, boxShadow:"0 1px 2px rgba(0,0,0,0.02)" }}>
        <span style={{ fontSize:11, color:"#334155", letterSpacing:"0.05em", textTransform:"uppercase", fontWeight:700 }}>Période KPIs</span>
        <DateRange dateFrom={periodFrom} dateTo={periodTo} onChange={(f,t)=>{setPeriodFrom(f);setPeriodTo(t);}} />
        {hasPeriod && <span style={{ fontSize:11, color:"#64748b", fontWeight:500 }}>{offersInPeriod.length} devis</span>}
        {!hasPeriod && <span style={{ fontSize:11, color:"#94a3b8" }}>Toutes les périodes</span>}
      </div>

      {/* KPI Cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 }}>
        <KpiCard label="CA Signé"       value={fmt(caSigne)}    sub={`${signe.length} devis signés`}    accent="#16a34a" pct={(caSigne/(caSigne+caPipeline+1))*100} />
        <KpiCard label="CA Pipeline"     value={fmt(caPipeline)} sub={`${pipeline.length} en cours`}      accent="#2563eb" pct={(caPipeline/(caSigne+caPipeline+1))*100} />
        <KpiCard label="Taux conversion" value={`${tauxConv}%`}  sub={`sur ${active.length} actifs`}      accent="#8b5cf6" pct={tauxConv} />
        <KpiCard label="Expirent ≤7j"    value={expirent.length} sub={expirent.length>0?"⚠ action requise":"✓ tout est ok"} accent={expirent.length>0?"#ef4444":"#16a34a"} />
      </div>

      {/* Charts - Modif Style fond blanc */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 360px", gap:16, marginBottom:24 }}>
        <div style={{ background:"white", border:"1px solid #e2e8f0", borderRadius:8, padding:24, boxShadow:"0 1px 2px rgba(0,0,0,0.02)" }}>
          <div style={{ fontSize:12, color:"#334155", letterSpacing:"0.05em", textTransform:"uppercase", marginBottom:20, fontWeight:600 }}>
            Répartition CA par statut {hasPeriod&&<span style={{ color:"#2563eb", fontSize:10 }}>· période filtrée</span>}
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={byStatut} margin={{ top:4, right:4, left:0, bottom:20 }}>
              <XAxis dataKey="s" tick={{ fontSize:10, fill:"#64748b", fontFamily:"inherit" }} axisLine={{ stroke:"#e2e8f0" }} tickLine={false} angle={-25} textAnchor="end" />
              <YAxis tickFormatter={fmtK} tick={{ fontSize:10, fill:"#64748b", fontFamily:"inherit" }} axisLine={false} tickLine={false} width={44} />
              <Tooltip contentStyle={{ background:"white", border:"1px solid #e2e8f0", borderRadius:6, fontSize:12, boxShadow:"0 4px 12px rgba(0,0,0,0.08)", color:"#1e293b" }} formatter={(v,_,p)=>[fmt(v),`${p.payload.count} devis`]} labelFormatter={(_,p)=>p[0]?.payload?.full||""} cursor={{fill:"#f1f5f9"}} />
              <Bar dataKey="montant" radius={[4,4,0,0]}>{byStatut.map(e=><Cell key={e.full} fill={S_COLOR[e.full]||"#94a3b8"} opacity={0.9} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background:"white", border:"1px solid #e2e8f0", borderRadius:8, padding:24, boxShadow:"0 1px 2px rgba(0,0,0,0.02)" }}>
          <div style={{ fontSize:12, color:"#334155", letterSpacing:"0.05em", textTransform:"uppercase", marginBottom:20, fontWeight:600 }}>
            Top clients {hasPeriod&&<span style={{ color:"#2563eb", fontSize:10 }}>· période filtrée</span>}
          </div>
          {topClients.map((c,i)=>(
            <div key={c.id} style={{ marginBottom:12, cursor:"pointer" }} onClick={()=>onSelectCompany(selectedCompany===c.id?null:c.id)}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, marginBottom:4 }}>
                <span style={{ color:selectedCompany===c.id?"#2563eb":"#334155", fontWeight:selectedCompany===c.id?700:500 }}>{c.name}</span>
                <span style={{ color:"#64748b" }}>{fmtK(c.montant)} · {c.count}</span>
              </div>
              <div style={{ height:4, background:"#f1f5f9", borderRadius:2 }}>
                <div style={{ height:4, background:selectedCompany===c.id?"#2563eb":i===0?"#475569":"#94a3b8", width:`${(c.montant/maxClient)*100}%`, borderRadius:2, transition:"all 0.4s" }} />
              </div>
            </div>
          ))}
          {expirent.length>0 && (
            <div style={{ marginTop:20, paddingTop:16, borderTop:"1px solid #f1f5f9" }}>
              <div style={{ fontSize:11, color:"#ef4444", letterSpacing:"0.05em", textTransform:"uppercase", marginBottom:10, fontWeight:700 }}>Expirations urgentes</div>
              {expirent.slice(0,4).map(o=>{
                const d=o.daysLeft; const c=d<=0?"#ef4444":d<=2?"#f97316":"#eab308";
                return (
                  <div key={o.id} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:"1px solid #f8fafc" }}>
                    <div style={{ fontSize:11, color:"#475569", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:170 }}>{o._project_attached?._company_attached?.name} — {o._project_attached?.name}</div>
                    <div style={{ fontSize:11, fontWeight:700, color:c, flexShrink:0 }}>{d<=0?"Expiré":`J-${d}`}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Table Section - Modif Style */}
      <div style={{ background:"white", border:"1px solid #e2e8f0", borderRadius:8, padding:20, boxShadow:"0 1px 2px rgba(0,0,0,0.02)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16, flexWrap:"wrap" }}>
          <SearchInput value={search} onChange={setSearch} placeholder="Projet, entreprise, référence…" />
          <MultiSelect label="Statut" options={STATUT_DEVIS} selected={filterStatuts} onChange={setFilterStatuts} colorMap={S_COLOR} />
          <DateRange dateFrom={dateFrom} dateTo={dateTo} onChange={(f,t)=>{setDateFrom(f);setDateTo(t);}} />
          {hasFilters && <button onClick={()=>{setSearch("");setFilterStatuts([]);setDateFrom("");setDateTo("");onSelectCompany(null);}} style={{ cursor:"pointer", padding:"6px 12px", background:"#f1f5f9", border:"1px solid #cbd5e1", borderRadius:6, color:"#475569", fontSize:11, fontWeight:600, textTransform:"uppercase" }}>Réinitialiser</button>}
          <span style={{ marginLeft:"auto", fontSize:11, color:"#64748b" }}>{filtered.length} résultat{filtered.length>1?"s":""}</span>
        </div>

        {/* Header Tableau: Gris clair */}
        <div style={{ display:"grid", gridTemplateColumns:"160px 1fr 140px 150px 110px 140px 80px", gap:12, padding:"10px 12px", borderBottom:"1px solid #e2e8f0", background:"#f8f9fa", borderRadius:"6px 6px 0 0", fontSize:10, letterSpacing:"0.05em", textTransform:"uppercase", color:"#64748b", fontWeight:700 }}>
          <ColHeader label="Client"      sortKey="client"      sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
          <ColHeader label="Projet"      sortKey="projet"      sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
          <ColHeader label="Référence"   sortKey="offer"       sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
          <ColHeader label="Statut"      sortKey="statut"      sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
          <ColHeader label="Montant HT"  sortKey="montant_ht" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
          <ColHeader label="Avancement"  sortKey="avancement" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
          <ColHeader label="Expir."      sortKey="expiration" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
        </div>

        <div style={{ maxHeight:520, overflowY:"auto" }}>
          {filtered.length===0
            ? <div style={{ padding:"32px 10px", textAlign:"center", color:"#94a3b8", fontSize:13 }}>Aucun résultat pour ces filtres</div>
            : filtered.map((o, i)=>{
              const d=diffDays(o.date_validite);
              const ec=d===null?"#94a3b8":d<=0?"#ef4444":d<=3?"#f97316":d<=7?"#eab308":"#64748b";
              return (
                <div key={o.id} style={{ display:"grid", gridTemplateColumns:"160px 1fr 140px 150px 110px 140px 80px", gap:12, padding:"12px 12px", borderBottom:i===filtered.length-1?"none":"1px solid #f1f5f9", alignItems:"center", fontSize:12, transition:"background 0.15s" }}
                  onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <span style={{ color:"#334155", fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{o._project_attached?._company_attached?.name}</span>
                  <span style={{ color:"#475569", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{o._project_attached?.name}</span>
                  <span style={{ color:"#64748b", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace", fontSize:11 }}>{o.offer_number}</span>
                  <div><Badge label={o.os_devis_statut} /></div>
                  <span style={{ fontWeight:600, color:"#1e293b", textAlign:"right" }}>{fmt(o.montant_ht)}</span>
                  <ProgressBar value={o._project_attached?.avancement||0} />
                  <span style={{ fontSize:11, color:ec, textAlign:"right", fontWeight:500 }}>{d===null?"—":d<=0?"Expiré":`J-${d}`}</span>
                </div>
              );
            })
          }
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"160px 1fr 140px 150px 110px 140px 80px", gap:12, padding:"16px 12px 4px", borderTop:"1px solid #e2e8f0", marginTop:4 }}>
          <span style={{ gridColumn:"1/4", fontSize:11, color:"#64748b" }}>{hasFilters?`Filtré · ${filtered.length} devis`:""}</span>
          <span style={{ fontSize:11, color:"#334155", letterSpacing:"0.05em", textTransform:"uppercase", fontWeight:700, textAlign:"right" }}>TOTAL HT</span>
          <span style={{ fontSize:14, fontWeight:700, color:"#2563eb", textAlign:"right", lineHeight:1 }}>{fmt(totalFiltre)}</span>
          <span /><span />
        </div>
      </div>
    </div>
  );
}

// ─── ONGLET INTERVENTIONS (LOGIQUE IDENTIQUE) ─────────────────────────────────
function TabInterventions({ interventions, projects, selectedCompany, onSelectCompany }) {
  const [periodFrom, setPeriodFrom] = useState("");
  const [periodTo,   setPeriodTo]   = useState("");
  const [search, setSearch]                = useState("");
  const [filterStatuts, setFilterStatuts] = useState([]);
  const [filterTypes, setFilterTypes]     = useState([]);
  const [dateFrom, setDateFrom]           = useState("");
  const [dateTo, setDateTo]               = useState("");
  const [sortBy, setSortBy]               = useState("date");
  const [sortDir, setSortDir]             = useState("desc");

  const handleSort = k => { if (sortBy===k) setSortDir(d=>d==="asc"?"desc":"asc"); else { setSortBy(k); setSortDir("desc"); } };
  const allTypes = useMemo(()=>[...new Set(interventions.map(i=>i.OS_prestations_type).filter(Boolean))],[interventions]);

  const intervInPeriod = useMemo(()=>interventions.filter(i=>inRange(i.date,periodFrom,periodTo)),[interventions,periodFrom,periodTo]);

  const filtered = useMemo(()=>{
    let rows=interventions;
    if (search.trim()) { const q=search.toLowerCase(); rows=rows.filter(i=>i.name?.toLowerCase().includes(q)||i._project_attached?.name?.toLowerCase().includes(q)||i._project_attached?._company_attached?.name?.toLowerCase().includes(q)); }
    if (filterStatuts.length) rows=rows.filter(i=>filterStatuts.includes(i.intervention_status));
    if (filterTypes.length)   rows=rows.filter(i=>filterTypes.includes(i.OS_prestations_type));
    if (dateFrom) rows=rows.filter(i=>i.date&&i.date>=dateFrom);
    if (dateTo)   rows=rows.filter(i=>i.date&&i.date<=dateTo);
    if (selectedCompany) rows=rows.filter(i=>i._project_attached?._company_attached?.id===selectedCompany);
    return [...rows].sort((a,b)=>{
      let va,vb;
      if (sortBy==="client")      { va=a._project_attached?._company_attached?.name||""; vb=b._project_attached?._company_attached?.name||""; }
      else if (sortBy==="projet") { va=a._project_attached?.name||""; vb=b._project_attached?.name||""; }
      else if (sortBy==="type")   { va=a.OS_prestations_type||""; vb=b.OS_prestations_type||""; }
      else                        { va=new Date(a.date||0); vb=new Date(b.date||0); }
      if (va<vb) return sortDir==="asc"?-1:1;
      if (va>vb) return sortDir==="asc"?1:-1;
      return 0;
    });
  },[interventions,search,filterStatuts,filterTypes,dateFrom,dateTo,selectedCompany,sortBy,sortDir]);

  const terminees  = intervInPeriod.filter(i=>i.intervention_status==="Terminé");
  const enCours    = intervInPeriod.filter(i=>i.intervention_status==="En cours");
  const planifiees = intervInPeriod.filter(i=>i.intervention_status==="Planifié");

  const byType={};
  intervInPeriod.forEach(i=>{ const t=i.OS_prestations_type||"Autre"; byType[t]=(byType[t]||0)+1; });
  const typeData=Object.entries(byType).sort((a,b)=>b[1]-a[1]).map(([name,value])=>({name,value}));

  const byRegion={};
  intervInPeriod.forEach(i=>{ const r=i.address?.city||"—"; byRegion[r]=(byRegion[r]||0)+1; });
  const regionData=Object.entries(byRegion).sort((a,b)=>b[1]-a[1]).slice(0,12);
  const maxRegion=regionData[0]?.[1]||1;

  const byMonth={};
  intervInPeriod.forEach(i=>{ if(i.date){ const m=i.date.slice(0,7); byMonth[m]=(byMonth[m]||0)+1; } });
  const monthData=Object.entries(byMonth).sort().slice(-6).map(([m,count])=>({mois:mLabel(m+"-01"),count}));

  const byClientI={};
  intervInPeriod.forEach(i=>{
    const c=i._project_attached?._company_attached; if(!c) return;
    if(!byClientI[c.id]) byClientI[c.id]={id:c.id,name:c.name,count:0};
    byClientI[c.id].count++;
  });
  const topClientsI=Object.values(byClientI).sort((a,b)=>b.count-a.count).slice(0,5);
  const maxClientI=topClientsI[0]?.count||1;

  const hasPeriod  = periodFrom||periodTo;
  const hasFilters = search||filterStatuts.length||filterTypes.length||dateFrom||dateTo||selectedCompany;

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20, padding:"12px 16px", background:"white", border:"1px solid #e2e8f0", borderRadius:8, boxShadow:"0 1px 2px rgba(0,0,0,0.02)" }}>
        <span style={{ fontSize:11, color:"#334155", letterSpacing:"0.05em", textTransform:"uppercase", fontWeight:700 }}>Période KPIs</span>
        <DateRange dateFrom={periodFrom} dateTo={periodTo} onChange={(f,t)=>{setPeriodFrom(f);setPeriodTo(t);}} />
        {hasPeriod && <span style={{ fontSize:11, color:"#64748b", fontWeight:500 }}>{intervInPeriod.length} interventions</span>}
        {!hasPeriod && <span style={{ fontSize:11, color:"#94a3b8" }}>Toutes les périodes</span>}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 }}>
        <KpiCard label="Total"     value={intervInPeriod.length} sub={`sur ${projects.length} projets`} accent="#2563eb" pct={100} />
        <KpiCard label="Terminées"  value={terminees.length}  sub={`${intervInPeriod.length?Math.round((terminees.length/intervInPeriod.length)*100):0}% du total`} accent="#16a34a" pct={intervInPeriod.length?(terminees.length/intervInPeriod.length)*100:0} />
        <KpiCard label="En cours"   value={enCours.length}    sub="actives"  accent="#f59e0b" pct={intervInPeriod.length?(enCours.length/intervInPeriod.length)*100:0} />
        <KpiCard label="Planifiées" value={planifiees.length} sub="à venir"  accent="#8b5cf6" pct={intervInPeriod.length?(planifiees.length/intervInPeriod.length)*100:0} />
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 300px", gap:16, marginBottom:24 }}>
        <div style={{ background:"white", border:"1px solid #e2e8f0", borderRadius:8, padding:24, boxShadow:"0 1px 2px rgba(0,0,0,0.02)" }}>
          <div style={{ fontSize:12, color:"#334155", letterSpacing:"0.05em", textTransform:"uppercase", marginBottom:20, fontWeight:600 }}>
            Types de prestations {hasPeriod&&<span style={{ color:"#2563eb", fontSize:10 }}>· période filtrée</span>}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:20 }}>
            <ResponsiveContainer width={130} height={130}>
              <PieChart><Pie data={typeData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={4}>
                {typeData.map((_,i)=><Cell key={i} fill={PRESTATION_COLORS[i%PRESTATION_COLORS.length]} stroke="none" />)}
              </Pie><Tooltip contentStyle={{ background:"white", border:"1px solid #e2e8f0", fontSize:11, color:"#1e293b", boxShadow:"0 4px 12px rgba(0,0,0,0.08)" }} /></PieChart>
            </ResponsiveContainer>
            <div style={{ flex:1 }}>
              {typeData.map((t,i)=>(
                <div key={t.name} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8, cursor:"pointer" }}
                  onClick={()=>setFilterTypes(filterTypes.includes(t.name)?filterTypes.filter(x=>x!==t.name):[...filterTypes,t.name])}>
                  <div style={{ width:10, height:10, borderRadius:3, background:PRESTATION_COLORS[i%PRESTATION_COLORS.length], flexShrink:0 }} />
                  <span style={{ fontSize:11, color:filterTypes.includes(t.name)?"#1e293b":"#64748b", flex:1, fontWeight:filterTypes.includes(t.name)?600:400 }}>{t.name}</span>
                  <span style={{ fontSize:11, fontWeight:700, color:PRESTATION_COLORS[i%PRESTATION_COLORS.length] }}>{t.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ background:"white", border:"1px solid #e2e8f0", borderRadius:8, padding:24, boxShadow:"0 1px 2px rgba(0,0,0,0.02)" }}>
          <div style={{ fontSize:12, color:"#334155", letterSpacing:"0.05em", textTransform:"uppercase", marginBottom:20, fontWeight:600 }}>
            Activité mensuelle {hasPeriod&&<span style={{ color:"#2563eb", fontSize:10 }}>· période filtrée</span>}
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={monthData} margin={{ top:4, right:4, left:0, bottom:4 }}>
              <XAxis dataKey="mois" tick={{ fontSize:10, fill:"#64748b", fontFamily:"inherit" }} axisLine={{ stroke:"#e2e8f0" }} tickLine={false} />
              <YAxis tick={{ fontSize:10, fill:"#64748b", fontFamily:"inherit" }} axisLine={false} tickLine={false} width={24} allowDecimals={false} />
              <Tooltip contentStyle={{ background:"white", border:"1px solid #e2e8f0", fontSize:12, boxShadow:"0 4px 12px rgba(0,0,0,0.08)" }} cursor={{fill:"#f1f5f9"}} />
              <Bar dataKey="count" name="Interventions" fill="#3b82f6" radius={[4,4,0,0]} opacity={0.9} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background:"white", border:"1px solid #e2e8f0", borderRadius:8, padding:24, overflowY:"auto", maxHeight:300, boxShadow:"0 1px 2px rgba(0,0,0,0.02)" }}>
          <div style={{ fontSize:12, color:"#334155", letterSpacing:"0.05em", textTransform:"uppercase", marginBottom:16, fontWeight:600 }}>Zones d'activité</div>
          {regionData.map(([r,v],i)=>(
            <div key={r} style={{ marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, marginBottom:4 }}>
                <span style={{ color:"#334155", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:160, fontWeight:500 }}>{r}</span>
                <span style={{ color:"#64748b", flexShrink:0, marginLeft:8 }}>{v}</span>
              </div>
              <div style={{ height:4, background:"#f1f5f9", borderRadius:2 }}>
                <div style={{ height:4, background:i===0?"#2563eb":"#94a3b8", width:`${(v/maxRegion)*100}%`, borderRadius:2 }} />
              </div>
            </div>
          ))}
          <div style={{ marginTop:20, paddingTop:16, borderTop:"1px solid #f1f5f9" }}>
            <div style={{ fontSize:12, color:"#334155", letterSpacing:"0.05em", textTransform:"uppercase", marginBottom:16, fontWeight:600 }}>Top clients</div>
            {topClientsI.map((c,i)=>(
              <div key={c.id} style={{ marginBottom:10, cursor:"pointer" }} onClick={()=>onSelectCompany(selectedCompany===c.id?null:c.id)}>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, marginBottom:4 }}>
                  <span style={{ color:selectedCompany===c.id?"#2563eb":"#334155", fontWeight:selectedCompany===c.id?700:500 }}>{c.name}</span>
                  <span style={{ color:"#64748b" }}>{c.count}</span>
                </div>
                <div style={{ height:4, background:"#f1f5f9", borderRadius:2 }}>
                  <div style={{ height:4, background:selectedCompany===c.id?"#2563eb":"#64748b", width:`${(c.count/maxClientI)*100}%`, borderRadius:2 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background:"white", border:"1px solid #e2e8f0", borderRadius:8, padding:20, boxShadow:"0 1px 2px rgba(0,0,0,0.02)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16, flexWrap:"wrap" }}>
          <SearchInput value={search} onChange={setSearch} placeholder="Intervention, projet, entreprise…" />
          <MultiSelect label="Statut" options={STATUT_INTERV} selected={filterStatuts} onChange={setFilterStatuts} colorMap={S_COLOR} />
          <MultiSelect label="Type"   options={allTypes}       selected={filterTypes}    onChange={setFilterTypes} />
          <DateRange dateFrom={dateFrom} dateTo={dateTo} onChange={(f,t)=>{setDateFrom(f);setDateTo(t);}} />
          {hasFilters && <button onClick={()=>{setSearch("");setFilterStatuts([]);setFilterTypes([]);setDateFrom("");setDateTo("");onSelectCompany(null);}} style={{ cursor:"pointer", padding:"6px 12px", background:"#f1f5f9", border:"1px solid #cbd5e1", borderRadius:6, color:"#475569", fontSize:11, fontWeight:600, textTransform:"uppercase" }}>Réinitialiser</button>}
          <span style={{ marginLeft:"auto", fontSize:11, color:"#64748b" }}>{filtered.length} résultat{filtered.length>1?"s":""}</span>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"160px 180px 1fr 140px 90px 110px", gap:12, padding:"10px 12px", borderBottom:"1px solid #e2e8f0", background:"#f8f9fa", borderRadius:"6px 6px 0 0", fontSize:10, letterSpacing:"0.05em", textTransform:"uppercase", color:"#64748b", fontWeight:700 }}>
          <ColHeader label="Client"       sortKey="client" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
          <ColHeader label="Projet"       sortKey="projet" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
          <ColHeader label="Intervention" sortKey="name"   sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
          <ColHeader label="Type"         sortKey="type"   sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
          <ColHeader label="Date"         sortKey="date"   sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
          <span style={{ color:"#64748b" }}>Statut</span>
        </div>

        <div style={{ maxHeight:520, overflowY:"auto" }}>
          {filtered.length===0
            ? <div style={{ padding:"32px 10px", textAlign:"center", color:"#94a3b8", fontSize:13 }}>Aucun résultat pour ces filtres</div>
            : filtered.map((i, idx)=>(
              <div key={i.id} style={{ display:"grid", gridTemplateColumns:"160px 180px 1fr 140px 90px 110px", gap:12, padding:"12px 12px", borderBottom:idx===filtered.length-1?"none":"1px solid #f1f5f9", alignItems:"center", fontSize:12, transition:"background 0.15s" }}
                onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <span style={{ color:"#334155", fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{i._project_attached?._company_attached?.name}</span>
                <span style={{ color:"#475569", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{i._project_attached?.name}</span>
                <span style={{ color:"#1e293b", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontWeight:500 }}>{i.name}</span>
                <span style={{ color:"#64748b", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{i.OS_prestations_type}</span>
                <span style={{ color:"#475569", fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace", fontSize:11 }}>{fmtDate(i.date)}</span>
                <div><Badge label={i.intervention_status||"—"} /></div>
              </div>
            ))
          }
        </div>
        <div style={{ padding:"10px 12px", fontSize:11, color:"#64748b", borderTop:"1px solid #e2e8f0", marginTop:4 }}>
          {filtered.length} intervention{filtered.length>1?"s":""} affichée{filtered.length>1?"s":""}
        </div>
      </div>
    </div>
  );
}

// ─── APP PRINCIPALE ──────────────────────────────────────────────────────────
export default function QualidaDashboard() {
  const [tab, setTab]                         = useState("devis");
  const [data, setData]                       = useState(null);
  const [loading, setLoading]                 = useState(true);
  const [selectedCompany, setSelectedCompany] = useState(null);

  useEffect(()=>{ fetchAll().then(d=>{ setData(d); setLoading(false); }); },[]);

  const selectedName = useMemo(()=>{
    if (!selectedCompany||!data) return null;
    return [...data.offers.map(o=>o._project_attached?._company_attached),...data.interventions.map(i=>i._project_attached?._company_attached)]
      .find(c=>c?.id===selectedCompany)?.name;
  },[selectedCompany,data]);

  // Loading Screen: Modifié pour fond clair
  if (loading) return (
    <div style={{ background:"#f8f9fa", minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <div style={{ textAlign:"center", color:"#2563eb" }}>
        <div style={{ fontSize:10, letterSpacing:"0.2em", opacity:0.6, marginBottom:10, color:"#64748b", fontWeight:600 }}>CHARGEMENT</div>
        <div style={{ fontSize:22, fontWeight:700, color:"#1e293b" }}>QUALIDAL CRM</div>
      </div>
    </div>
  );

  return (
    <div style={{ background:"#f8f9fa", minHeight:"100vh", fontFamily:"'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", color:"#334155" }}>
      
      {/* Header - Modif: Fond Blanc + Bordure légère + Police clean */}
      <div style={{ borderBottom:"1px solid #e2e8f0", padding:"0 32px", height:64, display:"flex", alignItems:"center", justifyContent:"space-between", background:"white", position:"sticky", top:0, zIndex:100, boxShadow:"0 1px 3px rgba(0,0,0,0.02)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:32 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:8, height:8, background:"#2563eb", borderRadius:"2px" }} />
            <span style={{ fontSize:14, fontWeight:700, letterSpacing:"-0.02em", color:"#1e293b" }}>QUALIDAL</span>
          </div>
          <div style={{ display:"flex", gap:4 }}>
            {[["devis","Devis"],["interventions","Interventions"]].map(([key,label])=>(
              <button key={key} onClick={()=>setTab(key)} style={{ cursor:"pointer", padding:"6px 16px", borderRadius:6, fontSize:13, fontWeight:600, border:"none", background:tab===key?"#eff6ff":"transparent", color:tab===key?"#2563eb":"#64748b", transition:"all 0.15s" }}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          {selectedName && (
            <div style={{ display:"flex", alignItems:"center", gap:8, padding:"4px 12px", background:"#eff6ff", border:"1px solid #dbeafe", borderRadius:20 }}>
              <span style={{ fontSize:11, color:"#1e40af", fontWeight:600 }}>Client : {selectedName}</span>
              <button onClick={()=>setSelectedCompany(null)} style={{ cursor:"pointer", background:"none", border:"none", color:"#2563eb", fontSize:14, lineHeight:1, padding:0, fontWeight:700 }}>×</button>
            </div>
          )}
          {USE_MOCK && <span style={{ fontSize:10, fontWeight:600, color:"#b45309", padding:"2px 8px", background:"#fffbeb", border:"1px solid #fef3c7", borderRadius:4 }}>MOCK</span>}
          <span style={{ fontSize:11, fontWeight:500, color:"#94a3b8" }}>{new Date().toLocaleDateString("fr-FR",{day:"2-digit",month:"short",year:"numeric"}).toUpperCase()}</span>
        </div>
      </div>

      <div style={{ padding:"32px", maxWidth:1440, margin:"0 auto" }}>
        {tab==="devis"
          ? <TabDevis offers={data.offers} selectedCompany={selectedCompany} onSelectCompany={setSelectedCompany} />
          : <TabInterventions interventions={data.interventions} projects={data.projects} selectedCompany={selectedCompany} onSelectCompany={setSelectedCompany} />
        }
      </div>

      <div style={{ padding:"0 32px 32px", fontSize:10, color:"#94a3b8", textAlign:"center", letterSpacing:"0.05em", fontWeight:500 }}>
        QUALIDAL · DASHBOARD COMMERCIAL & OPÉRATIONNEL · {USE_MOCK?"DONNÉES DE DÉMONSTRATION":"BUBBLE LIVE"}
      </div>
    </div>
  );
}
