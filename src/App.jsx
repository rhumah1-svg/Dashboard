import { useState, useEffect, useMemo, useRef } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useParams, Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const USE_MOCK = true; // passer à false pour Bubble live
const DASH_SECRET = "qd_x9k2m7p4nz3";

// ─── THÈME ────────────────────────────────────────────────────────────────────
const T = {
  bg:"#F2F5F9", card:"#FFFFFF", cardAlt:"#F8FAFC",
  border:"#E3E9F2", borderMd:"#C8D4E3",
  text:"#1A2640", textMed:"#475C78", textSoft:"#8BA0B8",
  indigo:"#5B72D4", indigoL:"#EDF0FB",
  teal:"#3A9E9E",   tealL:"#E6F5F5",
  sage:"#4E9468",   sageL:"#E8F4EE",
  amber:"#C07A2E",  amberL:"#FBF0E4",
  rose:"#BF506A",   roseL:"#FAEDF1",
  violet:"#7E5BB5", violetL:"#F2EDF9",
  sky:"#3E8EBF",    skyL:"#E5F3FA",
  coral:"#C9614A",  coralL:"#FAEAE6",
};

const S_COLOR = {
  "Saisie d'information":T.textSoft,"Chiffrage en cours":T.sky,
  "Validé par l'administration":T.violet,"Devis envoyé":T.indigo,
  "Devis signé":T.sage,"Projet terminé":"#2E7A4E",
  "A relancer":T.amber,"Relance envoyée":T.coral,
  "Classé sans suite":T.rose,"Non formalisé":T.textSoft,
  "Planifié":T.violet,"En cours":T.amber,"Terminé":T.sage,"Annulé":T.rose,
};

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const MOCK_COMPANIES = [
  { _id:"c1", name:"IDEC Construction",    address:"14 rue de la République, 75001 Paris",       phone:"+33 1 42 86 54 00", email:"contact@idec.fr",     siret:"412 345 678 00021", "Created Date":"2021-03-15" },
  { _id:"c2", name:"COGESTRA",             address:"ZI des Bruyères, 59000 Lille",               phone:"+33 3 20 11 22 33", email:"info@cogestra.fr",    siret:"512 678 901 00034", "Created Date":"2020-07-10" },
  { _id:"c3", name:"ACME Construction",    address:"15 avenue Haussmann, 75008 Paris",            phone:"+33 1 56 78 90 12", email:"contact@acme.fr",     siret:"312 456 789 00012", "Created Date":"2022-01-20" },
  { _id:"c4", name:"VINCI Construction",   address:"1 cours Ferdinand de Lesseps, 92500 Rueil",  phone:"+33 1 47 16 35 00", email:"vinci@vinci.fr",      siret:"552 037 806 00201", "Created Date":"2019-05-15" },
  { _id:"c5", name:"EIFFAGE",              address:"3-7 Place de l'Europe, 78140 Vélizy",        phone:"+33 1 34 65 89 89", email:"eiffage@eiffage.fr",  siret:"709 802 094 00022", "Created Date":"2020-11-08" },
  { _id:"c6", name:"SOGEA",               address:"Tour Pacific, 11-13 Cours Valmy, 92800 Puteaux",phone:"+33 1 47 16 45 00",email:"sogea@vinci.fr",    siret:"542 105 447 00089", "Created Date":"2021-08-30" },
];

const MOCK_PROJECTS = [
  { _id:"p1", name:"AREFIM - REIMS (51)",       _company_attached:"c1", OS_devis_status:"Devis signé",         OS_prestations_type:"Dallage",          derniere_interv:"2025-03-10" },
  { _id:"p2", name:"LOGISTIQUE SENLIS (60)",     _company_attached:"c1", OS_devis_status:"Chiffrage en cours",  OS_prestations_type:"Réparation béton", derniere_interv:"2025-02-01" },
  { _id:"p3", name:"ENTREPÔT ROISSY (95)",       _company_attached:"c1", OS_devis_status:"Devis envoyé",        OS_prestations_type:"Marquage sol",     derniere_interv:null         },
  { _id:"p4", name:"LOZENNES (59)",              _company_attached:"c2", OS_devis_status:"Devis envoyé",        OS_prestations_type:"Réparation béton", derniere_interv:"2025-01-28" },
  { _id:"p5", name:"ZI AMIENS NORD",             _company_attached:"c2", OS_devis_status:"Relance envoyée",     OS_prestations_type:"Dallage",          derniere_interv:"2025-02-15" },
  { _id:"p6", name:"Chantier Paris 15",          _company_attached:"c3", OS_devis_status:"A relancer",          OS_prestations_type:"Dallage",          derniere_interv:"2025-01-05" },
  { _id:"p7", name:"Parking Rouen",              _company_attached:"c4", OS_devis_status:"Saisie d'information",OS_prestations_type:"Marquage sol",     derniere_interv:null         },
  { _id:"p8", name:"Zone artisanale Creil",      _company_attached:"c5", OS_devis_status:"Devis signé",         OS_prestations_type:"Dallage",          derniere_interv:"2025-02-20" },
  { _id:"p9", name:"Plateforme Marne-la-Vallée", _company_attached:"c6", OS_devis_status:"Chiffrage en cours",  OS_prestations_type:"Dallage",          derniere_interv:"2025-02-12" },
];

const MOCK_OFFERS = [
  { _id:"o1",  _project_attached:"p1", montant_ht:48200,  is_active:true  },
  { _id:"o2",  _project_attached:"p1", montant_ht:137200, is_active:true  },
  { _id:"o3",  _project_attached:"p2", montant_ht:67200,  is_active:true  },
  { _id:"o4",  _project_attached:"p3", montant_ht:42800,  is_active:true  },
  { _id:"o5",  _project_attached:"p4", montant_ht:127500, is_active:true  },
  { _id:"o6",  _project_attached:"p5", montant_ht:215000, is_active:true  },
  { _id:"o7",  _project_attached:"p6", montant_ht:67300,  is_active:true  },
  { _id:"o8",  _project_attached:"p7", montant_ht:89000,  is_active:true  },
  { _id:"o9",  _project_attached:"p8", montant_ht:310000, is_active:true  },
  { _id:"o10", _project_attached:"p9", montant_ht:98500,  is_active:true  },
];

const MOCK_CONTACTS = {
  c1: [
    { _id:"ct1", name:"Jean-Eudes Gohard", type_contact:"Principal",     email:"je.gohard@idec.fr",   phone:"+33 6 12 34 56 78" },
    { _id:"ct2", name:"Marie Fontaine",    type_contact:"Mise en copie", email:"m.fontaine@idec.fr",  phone:"+33 6 98 76 54 32" },
    { _id:"ct3", name:"Thomas Beaumont",   type_contact:"Comptabilité",  email:"compta@idec.fr",      phone:"+33 1 42 86 54 01" },
  ],
  c2: [
    { _id:"ct4", name:"Paul Henrard",      type_contact:"Principal",     email:"p.henrard@cogestra.fr",phone:"+33 6 11 22 33 44" },
    { _id:"ct5", name:"Claire Dubois",     type_contact:"Secondaire",    email:"c.dubois@cogestra.fr", phone:"+33 6 55 66 77 88" },
  ],
  c3: [{ _id:"ct6", name:"Alex Martin",   type_contact:"Principal",     email:"a.martin@acme.fr",    phone:"+33 6 33 44 55 66" }],
  c4: [{ _id:"ct7", name:"Sophie Blanc",  type_contact:"Principal",     email:"s.blanc@vinci.fr",    phone:"+33 6 77 88 99 00" }],
  c5: [{ _id:"ct8", name:"Luc Petit",     type_contact:"Principal",     email:"l.petit@eiffage.fr",  phone:"+33 6 44 55 66 77" }],
  c6: [{ _id:"ct9", name:"Emma Roux",     type_contact:"Principal",     email:"e.roux@sogea.fr",     phone:"+33 6 22 33 44 55" }],
};

const MOCK_INTERVENTIONS = [
  { _id:"i1", name:"Reprise fissures dalle",    _project_attached:"p1", status:"Terminé",  date:"2025-01-15", agents:["Pierre Martin","Lucas Bernard"], rapport:"Sophie Durand" },
  { _id:"i2", name:"Traitement surface",         _project_attached:"p1", status:"En cours", date:"2025-03-10", agents:["Lucas Bernard"],                  rapport:"Sophie Durand" },
  { _id:"i3", name:"Reprise joint dilatation",   _project_attached:"p1", status:"Planifié", date:"2025-04-22", agents:["Pierre Martin","Ali Benali"],     rapport:"Marc Dupont"   },
  { _id:"i4", name:"Diagnostic structure",       _project_attached:"p2", status:"Terminé",  date:"2025-02-01", agents:["Ali Benali"],                     rapport:"Marc Dupont"   },
  { _id:"i5", name:"Injection résine",           _project_attached:"p2", status:"Planifié", date:"2025-05-10", agents:["Pierre Martin"],                  rapport:"Sophie Durand" },
  { _id:"i6", name:"Marquage parking",           _project_attached:"p7", status:"Terminé",  date:"2025-01-12", agents:["Lucas Bernard"],                  rapport:"Marc Dupont"   },
  { _id:"i7", name:"Traitement sol industriel",  _project_attached:"p8", status:"En cours", date:"2025-01-22", agents:["Ali Benali","Pierre Martin"],     rapport:"Sophie Durand" },
  { _id:"i8", name:"Ponçage + durcisseur",       _project_attached:"p4", status:"Terminé",  date:"2025-01-28", agents:["Lucas Bernard"],                  rapport:"Marc Dupont"   },
  { _id:"i9", name:"Coulage dallage neuf",       _project_attached:"p9", status:"Planifié", date:"2025-04-15", agents:["Pierre Martin"],                  rapport:"Marc Dupont"   },
];

const MOCK_HISTORIQUE = {
  c1: [
    { _id:"h1", date:"2025-02-14", type:"Appel",   auteur:"ST",  note:"Relance devis AREFIM — client confirme signature prochaine semaine." },
    { _id:"h2", date:"2025-01-28", type:"Email",   auteur:"AM",  note:"Envoi devis actualisé suite demande modification quantités." },
    { _id:"h3", date:"2025-01-10", type:"Réunion", auteur:"ST",  note:"Réunion de chantier Reims. Points : planning T1, accès zone sud." },
  ],
  c2: [
    { _id:"h4", date:"2025-01-20", type:"Appel",   auteur:"MEM", note:"Suivi devis LOZENNES. Client demande délai supplémentaire." },
  ],
};

// ─── FETCH ────────────────────────────────────────────────────────────────────
async function bubbleFetch(table, cursor=0) {
  const res = await fetch(`/api/bubble?table=${table}&cursor=${cursor}&secret=${DASH_SECRET}`);
  return res.json();
}
async function fetchAllPages(table) {
  let results=[], cursor=0;
  while (true) {
    const data = await bubbleFetch(table, cursor);
    const page = data.response?.results||[];
    results = results.concat(page);
    if ((data.response?.remaining??0)===0) break;
    cursor += page.length;
  }
  return results;
}

// ─── UTILS ────────────────────────────────────────────────────────────────────
const fmt     = n => new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(n||0);
const fmtDate = d => d ? new Date(d).toLocaleDateString("fr-FR") : "—";
const diffDays= d => d ? Math.ceil((new Date(d)-new Date())/86400000) : null;

// ─── COMPOSANTS PARTAGÉS ──────────────────────────────────────────────────────
function Badge({ label, color }) {
  const c = color || S_COLOR[label] || T.textSoft;
  return <span style={{ fontSize:11, fontWeight:600, padding:"3px 9px", borderRadius:20, color:c, background:`${c}18`, border:`1px solid ${c}30`, whiteSpace:"nowrap", display:"inline-block" }}>{label}</span>;
}

function ProgressBar({ value }) {
  const pct   = Math.round((value||0)*100);
  const color = pct>=80?T.sage:pct>=50?T.teal:pct>=20?T.indigo:T.textSoft;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
      <div style={{ flex:1, height:6, background:T.border, borderRadius:3 }}>
        <div style={{ height:6, background:`linear-gradient(90deg,${color}88,${color})`, width:`${pct}%`, borderRadius:3 }}/>
      </div>
      <span style={{ fontSize:11, color, fontWeight:700, width:34, textAlign:"right" }}>{pct}%</span>
    </div>
  );
}

function SearchInput({ value, onChange, placeholder, autoFocus }) {
  return (
    <div style={{ position:"relative" }}>
      <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", fontSize:15, color:T.textSoft, pointerEvents:"none" }}>⌕</span>
      <input autoFocus={autoFocus} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder||"Rechercher…"}
        style={{ padding:"10px 36px 10px 34px", background:T.card, border:`1.5px solid ${T.border}`, borderRadius:10, color:T.text, fontSize:13, fontFamily:"inherit", outline:"none", width:"100%", transition:"border-color 0.15s", boxShadow:"0 1px 4px rgba(0,0,0,0.04)" }}
        onFocus={e=>e.target.style.borderColor=T.indigo} onBlur={e=>e.target.style.borderColor=T.border}/>
      {value && <span onClick={()=>onChange("")} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", cursor:"pointer", fontSize:14, color:T.textSoft }}>✕</span>}
    </div>
  );
}

function Card({ title, children, action, accent }) {
  return (
    <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, overflow:"hidden", boxShadow:"0 2px 6px rgba(0,0,0,0.04)" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 20px", borderBottom:`1px solid ${T.border}`, background:T.cardAlt, borderLeft:accent?`4px solid ${accent}`:"none" }}>
        <span style={{ fontSize:11, fontWeight:700, color:T.textMed, letterSpacing:"0.07em", textTransform:"uppercase" }}>{title}</span>
        {action}
      </div>
      <div style={{ padding:20 }}>{children}</div>
    </div>
  );
}

// ─── NAVBAR ───────────────────────────────────────────────────────────────────
function Navbar({ current }) {
  const navigate = useNavigate();
  const tabs = [["dashboard","📋 Devis & Dashboard"],["clients","🏢 Clients"]];
  return (
    <div style={{ background:T.card, borderBottom:`1px solid ${T.border}`, padding:"12px 28px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:100, boxShadow:"0 2px 8px rgba(0,0,0,0.05)" }}>
      <div style={{ display:"flex", alignItems:"center", gap:20 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer" }} onClick={()=>navigate("/")}>
          <div style={{ width:34, height:34, background:`linear-gradient(135deg,${T.indigo},${T.teal})`, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 4px 10px ${T.indigo}44` }}>
            <span style={{ fontSize:16, fontWeight:900, color:"#fff" }}>Q</span>
          </div>
          <div>
            <div style={{ fontSize:15, fontWeight:800, color:T.text, lineHeight:1.1 }}>QUALIDAL</div>
            <div style={{ fontSize:9, color:T.textSoft, letterSpacing:"0.1em", fontWeight:600 }}>DASHBOARD</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:3, background:T.bg, border:`1px solid ${T.border}`, borderRadius:10, padding:4 }}>
          {tabs.map(([key,label])=>(
            <button key={key} onClick={()=>navigate(key==="dashboard"?"/":"/clients")}
              style={{ cursor:"pointer", padding:"7px 18px", borderRadius:7, fontSize:12, fontWeight:700, border:"none", background:current===key?T.card:"transparent", color:current===key?T.indigo:T.textMed, boxShadow:current===key?"0 1px 4px rgba(0,0,0,0.08)":"none", transition:"all 0.15s" }}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <span style={{ fontSize:12, color:T.textSoft }}>{new Date().toLocaleDateString("fr-FR",{weekday:"short",day:"2-digit",month:"short",year:"numeric"})}</span>
    </div>
  );
}

// ─── PAGE LISTE CLIENTS ───────────────────────────────────────────────────────
function PageClients() {
  const navigate  = useNavigate();
  const [search, setSearch]   = useState("");
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (USE_MOCK) {
      // Calculer CA et stats par client
      const companies = MOCK_COMPANIES.map(c => {
        const projets   = MOCK_PROJECTS.filter(p=>p._company_attached===c._id);
        const projetIds = projets.map(p=>p._id);
        const offers    = MOCK_OFFERS.filter(o=>projetIds.includes(o._project_attached)&&o.is_active);
        const ca        = offers.reduce((s,o)=>s+(o.montant_ht||0),0);
        const intervs   = MOCK_INTERVENTIONS.filter(i=>projetIds.includes(i._project_attached));
        const lastInterv= intervs.filter(i=>i.status==="Terminé").sort((a,b)=>new Date(b.date)-new Date(a.date))[0];
        const activeStatut = projets.find(p=>["Devis signé","En cours","Chiffrage en cours","Devis envoyé"].includes(p.OS_devis_status))?.OS_devis_status;
        return { ...c, nb_projets:projets.length, ca_total:ca, derniere_interv:lastInterv?.date||null, statut_actif:activeStatut||null };
      });
      setData(companies);
      setLoading(false);
    } else {
      Promise.all([fetchAllPages("companies"),fetchAllPages("projects"),fetchAllPages("offers_history_documents"),fetchAllPages("interventions")])
        .then(([rawC,rawP,rawO,rawI])=>{
          const companies = rawC.map(c=>{
            const projets   = rawP.filter(p=>p._company_attached===c._id);
            const projetIds = projets.map(p=>p._id);
            const offers    = rawO.filter(o=>projetIds.includes(o._project_attached)&&o.is_active!==false);
            const ca        = offers.reduce((s,o)=>s+(o.montant_ht||0),0);
            const intervs   = rawI.filter(i=>projetIds.includes(i._project_attached));
            const lastInterv= intervs.filter(i=>(i.intervention_status||"")===("Terminé")).sort((a,b)=>new Date(b.date)-new Date(a.date))[0];
            const activeStatut = projets.find(p=>p.OS_devis_status)?.OS_devis_status;
            return { ...c, id:c._id, nb_projets:projets.length, ca_total:ca, derniere_interv:lastInterv?.date||null, statut_actif:activeStatut||null };
          });
          setData(companies);
          setLoading(false);
        });
    }
  },[]);

  const filtered = useMemo(()=>{
    if (!data) return [];
    const q=search.toLowerCase();
    return data.filter(c=>!q||c.name?.toLowerCase().includes(q)||c.address?.toLowerCase().includes(q));
  },[data,search]);

  return (
    <div style={{ background:T.bg, minHeight:"100vh" }}>
      <Navbar current="clients"/>
      <div style={{ padding:"24px 28px", maxWidth:1400, margin:"0 auto" }}>

        {/* Header + search */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
          <div>
            <div style={{ fontSize:22, fontWeight:800, color:T.text }}>Clients</div>
            <div style={{ fontSize:13, color:T.textSoft, marginTop:3 }}>{data?.length||0} entreprises</div>
          </div>
        </div>

        <div style={{ marginBottom:16 }}>
          <SearchInput value={search} onChange={setSearch} placeholder="Rechercher un client, une adresse…" autoFocus/>
        </div>

        {loading
          ? <div style={{ textAlign:"center", padding:60, color:T.textSoft, fontSize:14 }}>Chargement…</div>
          : (
          <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, overflow:"hidden", boxShadow:"0 2px 6px rgba(0,0,0,0.04)" }}>
            {/* Header tableau */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 110px 130px 130px 160px 36px", gap:12, padding:"11px 20px", background:T.cardAlt, borderBottom:`2px solid ${T.border}` }}>
              {["Entreprise","Projets","CA Total","Dernière interv.","Statut actif",""].map((h,i)=>(
                <span key={i} style={{ fontSize:11, fontWeight:700, color:T.textSoft, letterSpacing:"0.06em", textTransform:"uppercase" }}>{h}</span>
              ))}
            </div>

            {filtered.length===0
              ? <div style={{ padding:"40px 20px", textAlign:"center", color:T.textSoft }}>Aucun client trouvé</div>
              : filtered.map((c,idx)=>(
                <div key={c._id} onClick={()=>navigate(`/client/${c._id}`)}
                  style={{ display:"grid", gridTemplateColumns:"1fr 110px 130px 130px 160px 36px", gap:12, padding:"13px 20px", borderBottom:idx<filtered.length-1?`1px solid ${T.border}`:"none", alignItems:"center", cursor:"pointer", background:idx%2===0?T.card:T.cardAlt, transition:"background 0.1s" }}
                  onMouseEnter={e=>e.currentTarget.style.background=T.indigoL}
                  onMouseLeave={e=>e.currentTarget.style.background=idx%2===0?T.card:T.cardAlt}>
                  {/* Nom + adresse */}
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:36, height:36, borderRadius:9, background:`${T.indigo}18`, border:`1px solid ${T.indigo}25`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <span style={{ fontSize:15, fontWeight:800, color:T.indigo }}>{c.name?.charAt(0)}</span>
                    </div>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color:T.text }}>{c.name}</div>
                      <div style={{ fontSize:11, color:T.textSoft, marginTop:1 }}>{c.address}</div>
                    </div>
                  </div>
                  {/* Nb projets */}
                  <span style={{ fontSize:13, fontWeight:700, color:T.teal, textAlign:"center" }}>{c.nb_projets}</span>
                  {/* CA */}
                  <span style={{ fontSize:13, fontWeight:700, color:T.indigo }}>{fmt(c.ca_total)}</span>
                  {/* Dernière interv */}
                  <span style={{ fontSize:12, color:T.textMed }}>{fmtDate(c.derniere_interv)}</span>
                  {/* Statut */}
                  <div>{c.statut_actif ? <Badge label={c.statut_actif}/> : <span style={{ color:T.textSoft, fontSize:12 }}>—</span>}</div>
                  {/* Flèche */}
                  <span style={{ color:T.textSoft, fontSize:16, textAlign:"right" }}>›</span>
                </div>
              ))
            }
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PAGE FICHE CLIENT ────────────────────────────────────────────────────────
const TYPE_CONTACT_COLOR = { "Principal":T.indigo,"Secondaire":T.teal,"Mise en copie":T.amber,"Comptabilité":T.violet };
const HISTORIQUE_COLOR   = { "Appel":T.sage,"Email":T.indigo,"Réunion":T.violet,"Note":T.amber };

function ProjetAccordeon({ projet, interventions }) {
  const [open,setOpen] = useState(false);
  const projInterv = interventions.filter(i=>i._project_attached===projet._id);
  return (
    <div style={{ border:`1px solid ${T.border}`, borderRadius:10, overflow:"hidden", marginBottom:10 }}>
      <div onClick={()=>setOpen(o=>!o)} style={{ display:"grid", gridTemplateColumns:"1fr 165px 105px 32px", gap:12, padding:"13px 16px", alignItems:"center", cursor:"pointer", background:open?T.indigoL:T.card, transition:"background 0.15s" }}
        onMouseEnter={e=>{if(!open)e.currentTarget.style.background=T.cardAlt;}}
        onMouseLeave={e=>{if(!open)e.currentTarget.style.background=T.card;}}>
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:T.text, marginBottom:2 }}>{projet.name}</div>
          <div style={{ fontSize:11, color:T.textSoft }}>{projet.OS_prestations_type}</div>
        </div>
        <Badge label={projet.OS_devis_status}/>
        <span style={{ fontSize:11, color:T.textSoft }}>{projInterv.length} intervention{projInterv.length>1?"s":""}</span>
        <span style={{ color:T.textSoft, fontSize:13 }}>{open?"▲":"▼"}</span>
      </div>
      {open && (
        <div style={{ background:T.bg, borderTop:`1px solid ${T.border}` }}>
          {projInterv.length===0
            ? <div style={{ padding:"16px 20px", fontSize:12, color:T.textSoft, textAlign:"center" }}>Aucune intervention</div>
            : projInterv.map((interv,idx)=>{
              const d=diffDays(interv.date);
              const dc=interv.status==="Planifié"?(d<=7?T.rose:T.violet):T.textSoft;
              return (
                <div key={interv._id} style={{ display:"grid", gridTemplateColumns:"10px 1fr 110px 120px 1fr 1fr", gap:10, padding:"11px 16px", borderBottom:idx<projInterv.length-1?`1px solid ${T.border}`:"none", alignItems:"center", background:idx%2===0?T.card:T.cardAlt }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:S_COLOR[interv.status]||T.textSoft }}/>
                  <span style={{ fontSize:12, fontWeight:600, color:T.text }}>{interv.name}</span>
                  <Badge label={interv.status}/>
                  <span style={{ fontSize:11, color:dc, fontWeight:interv.status==="Planifié"?700:400 }}>
                    {fmtDate(interv.date)}{interv.status==="Planifié"&&d!==null?` (J-${d})`:""}</span>
                  <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                    {(interv.agents||[]).map(a=><span key={a} style={{ fontSize:10, padding:"2px 7px", borderRadius:20, background:T.tealL, color:T.teal, fontWeight:600 }}>{a}</span>)}
                  </div>
                  <span style={{ fontSize:11, color:T.textMed }}><span style={{ color:T.textSoft }}>Rapport : </span>{interv.rapport}</span>
                </div>
              );
            })
          }
        </div>
      )}
    </div>
  );
}

function ModalContact({ onClose, onSave }) {
  const [form,setForm] = useState({ date:new Date().toISOString().slice(0,10), type:"Appel", auteur:"", note:"" });
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const inp={ width:"100%", padding:"8px 12px", border:`1.5px solid ${T.border}`, borderRadius:8, color:T.text, fontSize:13, fontFamily:"inherit", outline:"none", background:T.bg };
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(26,38,64,0.45)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center" }} onClick={onClose}>
      <div style={{ background:T.card, borderRadius:14, padding:28, width:480, boxShadow:"0 24px 48px rgba(0,0,0,0.15)" }} onClick={e=>e.stopPropagation()}>
        <div style={{ fontSize:15, fontWeight:800, color:T.text, marginBottom:20 }}>Nouveau contact client</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
          <div>
            <label style={{ fontSize:11, color:T.textSoft, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:6 }}>Date</label>
            <input type="date" value={form.date} onChange={e=>set("date",e.target.value)} style={inp}/>
          </div>
          <div>
            <label style={{ fontSize:11, color:T.textSoft, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:6 }}>Type</label>
            <select value={form.type} onChange={e=>set("type",e.target.value)} style={inp}>
              {["Appel","Email","Réunion","Note"].map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:11, color:T.textSoft, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:6 }}>Auteur</label>
          <input value={form.auteur} onChange={e=>set("auteur",e.target.value)} placeholder="Initiales ou nom…" style={inp}/>
        </div>
        <div style={{ marginBottom:20 }}>
          <label style={{ fontSize:11, color:T.textSoft, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:6 }}>Note</label>
          <textarea value={form.note} onChange={e=>set("note",e.target.value)} placeholder="Résumé de l'échange…" rows={4} style={{...inp,resize:"vertical",lineHeight:1.5}}/>
        </div>
        <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
          <button onClick={onClose} style={{ padding:"8px 18px", borderRadius:8, border:`1px solid ${T.border}`, background:T.card, color:T.textMed, fontSize:13, fontWeight:600, cursor:"pointer" }}>Annuler</button>
          <button onClick={()=>{onSave(form);onClose();}} style={{ padding:"8px 18px", borderRadius:8, border:"none", background:`linear-gradient(135deg,${T.indigo},${T.teal})`, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}>Enregistrer</button>
        </div>
      </div>
    </div>
  );
}

function PageFicheClient() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const [client,     setClient]     = useState(null);
  const [contacts,   setContacts]   = useState([]);
  const [projets,    setProjets]    = useState([]);
  const [interventions,setInterventions] = useState([]);
  const [historique, setHistorique] = useState([]);
  const [caTotal,    setCaTotal]    = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [activeTab,  setActiveTab]  = useState("projets");
  const [showModal,  setShowModal]  = useState(false);

  useEffect(()=>{
    if (USE_MOCK) {
      const c   = MOCK_COMPANIES.find(c=>c._id===id)||MOCK_COMPANIES[0];
      const p   = MOCK_PROJECTS.filter(p=>p._company_attached===c._id);
      const pIds= p.map(x=>x._id);
      const o   = MOCK_OFFERS.filter(o=>pIds.includes(o._project_attached)&&o.is_active);
      const ca  = o.reduce((s,o)=>s+(o.montant_ht||0),0);
      const i   = MOCK_INTERVENTIONS.filter(i=>pIds.includes(i._project_attached));
      const h   = MOCK_HISTORIQUE[id]||[];
      setClient(c); setProjets(p); setInterventions(i); setCaTotal(ca);
      setContacts(MOCK_CONTACTS[id]||[]); setHistorique(h); setLoading(false);
    } else {
      // TODO: fetch Bubble avec id
      setLoading(false);
    }
  },[id]);

  if (loading) return <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", fontFamily:"Nunito,sans-serif", color:T.textSoft }}>Chargement…</div>;
  if (!client) return <div style={{ padding:40, fontFamily:"Nunito,sans-serif" }}>Client introuvable</div>;

  const nbPlanifiees = interventions.filter(i=>i.status==="Planifié").length;

  return (
    <div style={{ background:T.bg, minHeight:"100vh", fontFamily:"'Nunito','Segoe UI',sans-serif", color:T.text }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap');*{box-sizing:border-box;margin:0;padding:0;}::-webkit-scrollbar{width:5px;}::-webkit-scrollbar-thumb{background:${T.borderMd};border-radius:3px;}`}</style>

      {/* NAVBAR avec breadcrumb */}
      <div style={{ background:T.card, borderBottom:`1px solid ${T.border}`, padding:"12px 28px", display:"flex", alignItems:"center", gap:12, position:"sticky", top:0, zIndex:100, boxShadow:"0 2px 8px rgba(0,0,0,0.05)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer" }} onClick={()=>navigate("/")}>
          <div style={{ width:34, height:34, background:`linear-gradient(135deg,${T.indigo},${T.teal})`, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span style={{ fontSize:16, fontWeight:900, color:"#fff" }}>Q</span>
          </div>
          <div><div style={{ fontSize:15, fontWeight:800, color:T.text, lineHeight:1.1 }}>QUALIDAL</div></div>
        </div>
        <span style={{ color:T.border, fontSize:18 }}>›</span>
        <span onClick={()=>navigate("/clients")} style={{ fontSize:13, color:T.textSoft, cursor:"pointer", fontWeight:600 }}>Clients</span>
        <span style={{ color:T.border, fontSize:18 }}>›</span>
        <span style={{ fontSize:13, fontWeight:700, color:T.text }}>{client.name}</span>
        <div style={{ marginLeft:"auto" }}>
          <span style={{ fontSize:12, color:T.textSoft }}>{new Date().toLocaleDateString("fr-FR",{weekday:"short",day:"2-digit",month:"short",year:"numeric"})}</span>
        </div>
      </div>

      <div style={{ padding:"24px 28px", maxWidth:1400, margin:"0 auto" }}>

        {/* HERO */}
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:"22px 26px", marginBottom:20, boxShadow:"0 2px 8px rgba(0,0,0,0.05)", borderLeft:`5px solid ${T.indigo}` }}>
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:16 }}>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
                <div style={{ width:48, height:48, background:`${T.indigo}18`, border:`2px solid ${T.indigo}30`, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <span style={{ fontSize:20, fontWeight:900, color:T.indigo }}>{client.name?.charAt(0)}</span>
                </div>
                <div>
                  <div style={{ fontSize:22, fontWeight:800, color:T.text }}>{client.name}</div>
                  <div style={{ fontSize:12, color:T.textSoft, marginTop:2 }}>Client depuis {fmtDate(client["Created Date"]||client.created)}</div>
                </div>
              </div>
              <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
                {client.address && <span style={{ fontSize:12, color:T.textMed }}>📍 {client.address}</span>}
                {client.phone   && <span style={{ fontSize:12, color:T.textMed }}>📞 {client.phone}</span>}
                {client.email   && <span style={{ fontSize:12, color:T.textMed }}>✉️ {client.email}</span>}
              </div>
            </div>
            {/* Stats */}
            <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
              {[["CA Total",fmt(caTotal),T.indigo],["Projets",projets.length,T.teal],["Interventions",interventions.length,T.sage],["Planifiées",nbPlanifiees,T.violet]].map(([l,v,c])=>(
                <div key={l} style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"12px 18px", background:`${c}12`, borderRadius:10, border:`1px solid ${c}25`, minWidth:110 }}>
                  <span style={{ fontSize:20, fontWeight:800, color:c }}>{v}</span>
                  <span style={{ fontSize:10, color:T.textSoft, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em", marginTop:4 }}>{l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* GRILLE */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 300px", gap:20 }}>
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

            {/* ONGLETS */}
            <div style={{ display:"flex", gap:3, background:T.card, border:`1px solid ${T.border}`, borderRadius:10, padding:4, width:"fit-content", boxShadow:"0 1px 4px rgba(0,0,0,0.04)" }}>
              {[["projets","📁 Projets"],["contacts","👥 Contacts"],["historique","📋 Historique"]].map(([key,label])=>(
                <button key={key} onClick={()=>setActiveTab(key)} style={{ cursor:"pointer", padding:"7px 16px", borderRadius:7, fontSize:12, fontWeight:700, border:"none", background:activeTab===key?T.card:"transparent", color:activeTab===key?T.indigo:T.textMed, boxShadow:activeTab===key?"0 1px 4px rgba(0,0,0,0.08)":"none", transition:"all 0.15s" }}>
                  {label}
                </button>
              ))}
            </div>

            {activeTab==="projets" && projets.map(p=><ProjetAccordeon key={p._id} projet={p} interventions={interventions}/>)}

            {activeTab==="contacts" && (
              <Card title="Contacts de l'entreprise" accent={T.teal}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                  {contacts.length===0 ? <span style={{ color:T.textSoft, fontSize:13 }}>Aucun contact enregistré</span>
                    : contacts.map(ct=>{
                    const c=TYPE_CONTACT_COLOR[ct.type_contact]||T.textSoft;
                    return (
                      <div key={ct._id} style={{ padding:"14px 16px", borderRadius:10, border:`1px solid ${c}25`, background:`${c}08` }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                          <div style={{ width:34, height:34, borderRadius:10, background:`${c}18`, border:`1px solid ${c}30`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                            <span style={{ fontSize:14, fontWeight:800, color:c }}>{ct.name?.charAt(0)}</span>
                          </div>
                          <Badge label={ct.type_contact} color={c}/>
                        </div>
                        <div style={{ fontSize:13, fontWeight:700, color:T.text, marginBottom:4 }}>{ct.name}</div>
                        {ct.email && <div style={{ fontSize:11, color:T.textSoft, marginBottom:2 }}>✉️ {ct.email}</div>}
                        {ct.phone && <div style={{ fontSize:11, color:T.textSoft }}>📞 {ct.phone}</div>}
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {activeTab==="historique" && (
              <Card title="Historique des contacts" accent={T.violet}
                action={<button onClick={()=>setShowModal(true)} style={{ cursor:"pointer", padding:"6px 14px", borderRadius:8, border:"none", background:`linear-gradient(135deg,${T.indigo},${T.teal})`, color:"#fff", fontSize:12, fontWeight:700 }}>+ Ajouter</button>}>
                <div style={{ position:"relative", paddingLeft:8 }}>
                  <div style={{ position:"absolute", left:16, top:0, bottom:0, width:2, background:T.border, borderRadius:1 }}/>
                  {historique.length===0 && <div style={{ padding:"20px 0", color:T.textSoft, fontSize:13 }}>Aucun historique</div>}
                  {historique.map((h,idx)=>{
                    const c=HISTORIQUE_COLOR[h.type]||T.textSoft;
                    return (
                      <div key={h._id||idx} style={{ display:"flex", gap:16, marginBottom:idx<historique.length-1?20:0, position:"relative" }}>
                        <div style={{ width:32, height:32, borderRadius:"50%", background:`${c}15`, border:`2px solid ${c}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, zIndex:1 }}>
                          <span style={{ fontSize:12 }}>{h.type==="Appel"?"📞":h.type==="Email"?"✉️":h.type==="Réunion"?"🤝":"📝"}</span>
                        </div>
                        <div style={{ flex:1, paddingTop:2 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                              <Badge label={h.type} color={c}/>
                              <span style={{ fontSize:11, color:T.textSoft, fontWeight:600 }}>{h.auteur}</span>
                            </div>
                            <span style={{ fontSize:11, color:T.textSoft }}>{fmtDate(h.date)}</span>
                          </div>
                          <div style={{ fontSize:13, color:T.textMed, lineHeight:1.5, padding:"10px 14px", background:T.cardAlt, borderRadius:8, border:`1px solid ${T.border}` }}>{h.note}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>

          {/* SIDEBAR */}
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {/* CA graphe */}
            <Card title="CA par projet" accent={T.sage}>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={projets.map(p=>({ name:p.name.split(" ")[0], ca:MOCK_OFFERS.filter(o=>o._project_attached===p._id).reduce((s,o)=>s+(o.montant_ht||0),0) }))} margin={{top:4,right:4,left:0,bottom:4}}>
                  <XAxis dataKey="name" tick={{fontSize:10,fill:T.textSoft,fontFamily:"inherit"}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fontSize:10,fill:T.textSoft,fontFamily:"inherit"}} axisLine={false} tickLine={false} width={40} tickFormatter={n=>n>=1000?`${(n/1000).toFixed(0)}k`:n}/>
                  <Tooltip contentStyle={{background:T.card,border:`1px solid ${T.border}`,borderRadius:8,fontSize:12}} formatter={v=>[fmt(v),"CA"]}/>
                  <Bar dataKey="ca" radius={[5,5,0,0]}>{projets.map((_,i)=><Cell key={i} fill={[T.indigo,T.teal,T.sage,T.amber,T.violet][i%5]} opacity={0.85}/>)}</Bar>
                </BarChart>
              </ResponsiveContainer>
              <div style={{ marginTop:10, paddingTop:10, borderTop:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between" }}>
                <span style={{ fontSize:11, color:T.textSoft, fontWeight:700, textTransform:"uppercase" }}>Total</span>
                <span style={{ fontSize:15, fontWeight:800, color:T.indigo }}>{fmt(caTotal)}</span>
              </div>
            </Card>

            {/* Prochaines interventions */}
            <Card title="Prochaines interventions" accent={T.violet}>
              {interventions.filter(i=>i.status==="Planifié").sort((a,b)=>new Date(a.date)-new Date(b.date)).length===0
                ? <div style={{ fontSize:12, color:T.textSoft, textAlign:"center", padding:"12px 0" }}>Aucune planifiée</div>
                : interventions.filter(i=>i.status==="Planifié").sort((a,b)=>new Date(a.date)-new Date(b.date)).map((i,idx,arr)=>{
                  const d=diffDays(i.date);
                  const dc=d<=3?T.rose:d<=7?T.amber:T.violet;
                  return (
                    <div key={i._id} style={{ paddingBottom:10, marginBottom:idx<arr.length-1?10:0, borderBottom:idx<arr.length-1?`1px solid ${T.border}`:"none" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                        <span style={{ fontSize:12, fontWeight:700, color:T.text }}>{i.name}</span>
                        <span style={{ fontSize:11, fontWeight:700, color:dc }}>J-{d}</span>
                      </div>
                      <div style={{ fontSize:11, color:T.textSoft, marginBottom:4 }}>{fmtDate(i.date)}</div>
                      <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                        {(i.agents||[]).map(a=><span key={a} style={{ fontSize:10, padding:"2px 7px", borderRadius:20, background:T.tealL, color:T.teal, fontWeight:600 }}>{a}</span>)}
                      </div>
                    </div>
                  );
                })
              }
            </Card>

            {/* Contacts principaux */}
            <Card title="Contacts" accent={T.teal}>
              {contacts.filter(c=>["Principal","Secondaire"].includes(c.type_contact)).map(ct=>{
                const c=TYPE_CONTACT_COLOR[ct.type_contact]||T.textSoft;
                return (
                  <div key={ct._id} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                    <div style={{ width:32, height:32, borderRadius:8, background:`${c}18`, border:`1px solid ${c}25`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <span style={{ fontSize:13, fontWeight:800, color:c }}>{ct.name?.charAt(0)}</span>
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:T.text }}>{ct.name}</div>
                      <div style={{ fontSize:11, color:T.textSoft }}>{ct.email}</div>
                    </div>
                    <Badge label={ct.type_contact} color={c}/>
                  </div>
                );
              })}
            </Card>
          </div>
        </div>
      </div>

      <div style={{ padding:"14px 28px", fontSize:11, color:T.textSoft, textAlign:"center", borderTop:`1px solid ${T.border}`, background:T.card, marginTop:24 }}>
        Qualidal · Fiche Client · {USE_MOCK?"Données de démonstration":"Bubble Live"}
      </div>
      {showModal && <ModalContact onClose={()=>setShowModal(false)} onSave={entry=>setHistorique(h=>[{_id:`h${Date.now()}`,...entry},...h])}/>}
    </div>
  );
}

// ─── DASHBOARD (placeholder — remplace par ton vrai Dashboard v7) ──────────────
function PageDashboard() {
  const navigate = useNavigate();
  return (
    <div style={{ background:T.bg, minHeight:"100vh" }}>
      <Navbar current="dashboard"/>
      <div style={{ padding:"40px 28px", maxWidth:1400, margin:"0 auto", textAlign:"center", color:T.textSoft, fontFamily:"Nunito,sans-serif" }}>
        <div style={{ fontSize:16, fontWeight:700, color:T.text, marginBottom:8 }}>Dashboard</div>
        <p style={{ fontSize:13, marginBottom:20 }}>Intègre ici ton Dashboard v7 (qualidal-dashboard-v7.jsx)</p>
        <button onClick={()=>navigate("/clients")} style={{ padding:"10px 24px", borderRadius:10, border:"none", background:`linear-gradient(135deg,${T.indigo},${T.teal})`, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}>
          Voir les clients →
        </button>
      </div>
    </div>
  );
}

// ─── ROUTER PRINCIPAL ─────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap');*{box-sizing:border-box;margin:0;padding:0;}input::placeholder{color:${T.textSoft};}`}</style>
      <Routes>
        <Route path="/"           element={<PageDashboard/>}/>
        <Route path="/clients"    element={<PageClients/>}/>
        <Route path="/client/:id" element={<PageFicheClient/>}/>
      </Routes>
    </BrowserRouter>
  );
}
