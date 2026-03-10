import { useState, useEffect, useMemo, useRef, Component } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import FicheClient from './FicheClient';
import Login from './Login';
import TableContacts from './TableContacts';
import SuiviFacturable from './SuiviFacturable';
import TabDevis from './TabDevis';
import TabInterventions from './TabInterventions';

// ─── ERROR BOUNDARY ───────────────────────────────────────────────────────────
class ErrorBoundary extends Component {
  constructor(props){ super(props); this.state={error:null}; }
  static getDerivedStateFromError(e){ return {error:e}; }
  componentDidCatch(e,info){ console.error("FicheClient crash:", e, info); }
  render(){
    if(this.state.error){
      return (
        <div style={{padding:40,maxWidth:800,margin:"40px auto",fontFamily:"monospace"}}>
          <div style={{background:"#FAEDF1",border:"1px solid #BF506A",borderRadius:12,padding:24}}>
            <div style={{fontSize:16,fontWeight:800,color:"#BF506A",marginBottom:12}}>
              💥 Erreur React — copie ce message et envoie-le en chat
            </div>
            <pre style={{fontSize:12,color:"#1A2640",whiteSpace:"pre-wrap",wordBreak:"break-all",background:"#fff",padding:16,borderRadius:8,border:"1px solid #E3E9F2"}}>
              {this.state.error?.message}{"\n\n"}{this.state.error?.stack?.slice(0,600)}
            </pre>
            <button onClick={()=>this.setState({error:null})}
              style={{marginTop:16,padding:"8px 16px",background:"#BF506A",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:700}}>
              Réessayer
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const USE_MOCK = false;

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const MOCK_COMPANIES = [
  { id:"c1", name:"IDEC" },{ id:"c2", name:"COGESTRA" },
  { id:"c3", name:"ACME Construction" },{ id:"c4", name:"VINCI Construction" },
  { id:"c5", name:"EIFFAGE" },{ id:"c6", name:"SOGEA" },
];
const MOCK_PROJECTS = [
  { id:"p1", name:"AREFIM - REIMS (51)", _company_attached:"c1", OS_prestations_type:"Dallage", OS_devis_status:"Devis signé", avancement:0.67, total_ht:48200, total_prod:32294, total_facture:15000, date_debut:"2025-01-01", date_fin:"2025-06-01" },
  { id:"p2", name:"LOZENNES (59)", _company_attached:"c2", OS_prestations_type:"Réparation béton", OS_devis_status:"Devis envoyé", avancement:0.32, total_ht:127500, total_prod:40800, total_facture:35000, date_debut:"2024-11-15", date_fin:"2025-08-12" },
  { id:"p3", name:"Chantier Paris 15", _company_attached:"c3", OS_prestations_type:"Dallage", OS_devis_status:"A relancer", avancement:0.10, total_ht:33750, total_prod:3375, total_facture:0, date_debut:"2025-03-01", date_fin:"2025-04-15" },
  { id:"p4", name:"Parking Rouen", _company_attached:"c4", OS_prestations_type:"Marquage sol", OS_devis_status:"Saisie d'information", avancement:0, total_ht:89000, total_prod:0, total_facture:0, date_debut:"2024-12-01", date_fin:"2025-02-28" },
  { id:"p5", name:"Zone artisanale Creil", _company_attached:"c5", OS_prestations_type:"Dallage", OS_devis_status:"Devis signé", avancement:1.0, total_ht:310000, total_prod:310000, total_facture:280000, date_debut:"2025-01-10", date_fin:"2025-03-30" },
  { id:"p6", name:"ZI Amiens Nord", _company_attached:"c2", OS_prestations_type:"Réparation béton", OS_devis_status:"Relance envoyée", avancement:0.48, total_ht:215000, total_prod:103200, total_facture:45000, date_debut:"2024-12-15", date_fin:"2025-05-20" },
  { id:"p7", name:"Plateforme Marne-la-Vallée", _company_attached:"c6", OS_prestations_type:"Dallage", OS_devis_status:"Chiffrage en cours", avancement:0, total_ht:98500, total_prod:0, total_facture:0, date_debut:"2025-02-01", date_fin:"2025-07-30" },
];
const MOCK_OFFERS = [
  { id:"o1",  offer_number:"devis_de00001898", os_devis_statut:"Devis envoyé",         date_offre:"2025-01-10", date_validite:"2025-06-20", _project_attached:"p1", montant_ht:48200,  is_active:true,  is_archived:false },
  { id:"o2",  offer_number:"devis_de00001901", os_devis_statut:"Devis signé",           date_offre:"2025-01-05", date_validite:"2025-07-28", _project_attached:"p2", montant_ht:127500, is_active:true,  is_archived:false },
  { id:"o3",  offer_number:"devis_de00001905", os_devis_statut:"Devis envoyé",          date_offre:"2025-03-20", date_validite:"2025-06-19", _project_attached:"p3", montant_ht:33750,  is_active:true,  is_archived:false },
  { id:"o4",  offer_number:"devis_de00001910", os_devis_statut:"A relancer",            date_offre:"2024-12-15", date_validite:"2025-06-21", _project_attached:"p4", montant_ht:89000,  is_active:true,  is_archived:false },
  { id:"o5",  offer_number:"devis_de00001912", os_devis_statut:"Classé sans suite",     date_offre:"2024-12-01", date_validite:"2025-01-15", _project_attached:"p1", montant_ht:22000,  is_active:false, is_archived:true  },
  { id:"o6",  offer_number:"devis_de00001915", os_devis_statut:"Devis signé",           date_offre:"2025-02-12", date_validite:"2025-08-15", _project_attached:"p6", montant_ht:215000, is_active:true,  is_archived:false },
  { id:"o7",  offer_number:"devis_de00001918", os_devis_statut:"Devis envoyé",          date_offre:"2025-01-25", date_validite:"2025-06-25", _project_attached:"p3", montant_ht:67300,  is_active:true,  is_archived:false },
  { id:"o8",  offer_number:"devis_de00001920", os_devis_statut:"Relance envoyée",       date_offre:"2025-01-08", date_validite:"2025-06-22", _project_attached:"p4", montant_ht:156000, is_active:true,  is_archived:false },
  { id:"o9",  offer_number:"devis_de00001922", os_devis_statut:"Saisie d'information",  date_offre:"2025-02-01", date_validite:"2025-07-20", _project_attached:"p7", montant_ht:98500,  is_active:true,  is_archived:false },
  { id:"o10", offer_number:"devis_de00001925", os_devis_statut:"Devis signé",           date_offre:"2025-02-18", date_validite:"2025-08-01", _project_attached:"p5", montant_ht:310000, is_active:true,  is_archived:false },
];
const MOCK_INTERVENTIONS = [
  { id:"i1",  name:"Reprise fissures dalle",     _project_attached:"p1", date:"2025-01-15", OS_prestations_type:"Réparation béton", intervention_status:"Terminé",  address:{ city:"Reims"  } },
  { id:"i2",  name:"Coulage dalle hangar",        _project_attached:"p2", date:"2024-11-20", OS_prestations_type:"Dallage",          intervention_status:"Terminé",  address:{ city:"Lille"  } },
  { id:"i3",  name:"Marquage parking",            _project_attached:"p4", date:"2025-01-12", OS_prestations_type:"Marquage sol",     intervention_status:"Terminé",  address:{ city:"Rouen"  } },
  { id:"i4",  name:"Traitement sol industriel",   _project_attached:"p5", date:"2025-01-22", OS_prestations_type:"Dallage",          intervention_status:"En cours", address:{ city:"Creil"  } },
  { id:"i5",  name:"Injection résine fissures",   _project_attached:"p6", date:"2024-12-10", OS_prestations_type:"Réparation béton", intervention_status:"Terminé",  address:{ city:"Amiens" } },
  { id:"i6",  name:"Ponçage + durcisseur",        _project_attached:"p2", date:"2025-01-05", OS_prestations_type:"Dallage",          intervention_status:"Terminé",  address:{ city:"Lille"  } },
  { id:"i7",  name:"Reprise joint",               _project_attached:"p1", date:"2025-03-03", OS_prestations_type:"Réparation béton", intervention_status:"Planifié", address:{ city:"Reims"  } },
  { id:"i8",  name:"Coulage dallage neuf",        _project_attached:"p7", date:"2025-02-12", OS_prestations_type:"Dallage",          intervention_status:"Planifié", address:{ city:"Marne"  } },
  { id:"i9",  name:"Traitement anti-poussière",   _project_attached:"p3", date:"2025-02-05", OS_prestations_type:"Dallage",          intervention_status:"En cours", address:{ city:"Paris"  } },
  { id:"i10", name:"Ragréage surface",            _project_attached:"p6", date:"2025-01-28", OS_prestations_type:"Réparation béton", intervention_status:"Terminé",  address:{ city:"Amiens" } },
  { id:"i11", name:"Joints souples",              _project_attached:"p5", date:"2025-02-01", OS_prestations_type:"Réparation béton", intervention_status:"En cours", address:{ city:"Creil"  } },
  { id:"i12", name:"Marquage allées",             _project_attached:"p2", date:"2025-03-15", OS_prestations_type:"Marquage sol",     intervention_status:"Planifié", address:{ city:"Lille"  } },
];

// ─── FETCH ────────────────────────────────────────────────────────────────────
async function fetchAllPages(endpoint) {
  let results = [], cursor = 0;
  const token = sessionStorage.getItem("qd_token");
  while (true) {
    const res = await fetch(`/api/bubble?table=${endpoint}&cursor=${cursor}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    const page = data.response?.results || [];
    results = results.concat(page);
    if ((data.response?.remaining ?? 0) === 0) break;
    cursor += page.length;
  }
  return results;
}

function extractCity(a) {
  if (!a?.address) return null;
  const p = a.address.split(",");
  return p[0].trim().replace(/^\d{4,5}\s*/, "") || p[1]?.trim() || null;
}

async function fetchAll() {
  if (USE_MOCK) {
    const cm = Object.fromEntries(MOCK_COMPANIES.map(c => [c.id, c]));
    const pm = Object.fromEntries(MOCK_PROJECTS.map(p => [p.id, { ...p, _company_attached: cm[p._company_attached] }]));
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

  const numByProject = {}, denomByProject = {};
  rawItems.forEach(item => {
    const pid         = item._project_attached;
    const ht          = item["Total HT"] || item.Total_HT || item.total_ht || 0;
    const prix_interv = item.prix_intervention || item["prix intervention"] || 0;
    if (pid) {
      denomByProject[pid] = (denomByProject[pid] || 0) + ht;
      numByProject[pid]   = (numByProject[pid]   || 0) + prix_interv;
    }
  });

  const projectsMap = Object.fromEntries(rawProjects.map(p => {
    const company     = companiesMap[p._company_attached] || null;
    const city        = extractCity(p.chantier_address);
    const num         = numByProject[p._id]   || 0;
    const denom       = denomByProject[p._id] || 0;
    const is_archived = p["archived?"] === true;
    return [p._id, {
      id:               p._id,
      name:             p.name || "",
      project_code:     p.project_code || p._id,
      _company_attached: company
        ? { id: company._id, name: company.name }
        : { id: p._company_attached, name: "—" },
      chantier_address: { city, state: city },
      OS_prestations_type: p.OS_prestations_type || "",
      OS_devis_status:     p.OS_devis_status || "",
      avancement:    denom > 0 ? Math.min(num / denom, 1) : 0,
      total_ht:      denom,
      total_prod:    num,
      total_facture: p.total_facture || p["montant_facture"] || 0,
      date_debut:    p.date_chantier || null,
      date_fin:      p.date_fin_flexible || null,
      is_archived,
    }];
  }));

  const DATE_MIN = "2025-02-24";
  const offers = rawOffers
    .filter(o => o._project_attached)
    .map(o => {
      const project    = projectsMap[o._project_attached] || null;
      const date_offre = o.date_offre
        ? o.date_offre.slice(0, 10)
        : o["Created Date"]?.slice(0, 10);
      return {
        id:                o._id,
        offer_number:      o.devis_number || o.offer_number || o._id,
        os_devis_statut:   project?.OS_devis_status || "Saisie d'information",
        date_offre,
        date_validite:     o.date_validite ? o.date_validite.slice(0, 10) : null,
        _project_attached: project,
        montant_ht:        denomByProject[o._project_attached] || 0,
        is_active:         o.is_active !== false,
        is_archived:       project?.is_archived || false,
      };
    })
    .filter(o =>
      !o.is_archived &&
      (!o.date_offre || o.date_offre >= DATE_MIN)
    );

  const interventions = rawInterventions.map(i => {
    const project = projectsMap[i._project_attached] || null;
    return {
      id:                  i._id,
      name:                i.name || "Sans nom",
      _project_attached:   project,
      date:                i.date ? i.date.slice(0, 10) : i["Created Date"]?.slice(0, 10),
      OS_prestations_type: i.OS_prestations_type || "",
      intervention_status: i.intervention_status || i.OS_project_intervention_status || "—",
      address: { city: extractCity(i.address) || project?.chantier_address?.city || "—" },
    };
  });

  return { offers, interventions, projects: Object.values(projectsMap) };
}

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

// ─── AUTOCOMPLETE SEARCH ──────────────────────────────────────────────────────
function CompanySearch({companies,onSelect}){
  const [q,setQ]=useState("");
  const [open,setOpen]=useState(false);
  const ref=useRef();
  useEffect(()=>{
    const h=e=>{if(ref.current&&!ref.current.contains(e.target)){setOpen(false);}};
    document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);
  },[]);
  const results=q.trim().length>0?companies.filter(c=>c.name.toLowerCase().includes(q.toLowerCase())).slice(0,8):[];
  return (
    <div ref={ref} style={{position:"relative",width:260}}>
      <input value={q} onChange={e=>{setQ(e.target.value);setOpen(true);}} onFocus={()=>q&&setOpen(true)}
        placeholder="🔍 Rechercher un client…"
        style={{width:"100%",padding:"7px 12px",border:`1.5px solid ${T.border}`,borderRadius:8,fontSize:12,color:T.text,background:T.bg,outline:"none",boxSizing:"border-box"}}/>
      {open&&results.length>0&&(
        <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,zIndex:300,background:T.card,border:`1px solid ${T.border}`,borderRadius:10,boxShadow:"0 8px 24px rgba(0,0,0,0.12)",width:"100%",overflow:"hidden"}}>
          {results.map(c=>(
            <div key={c.id} onClick={()=>{onSelect(c);setQ("");setOpen(false);}}
              style={{padding:"8px 14px",cursor:"pointer",fontSize:12,borderBottom:`1px solid ${T.border}`,background:T.card,transition:"background 0.1s"}}
              onMouseEnter={e=>e.currentTarget.style.background=T.indigoL}
              onMouseLeave={e=>e.currentTarget.style.background=T.card}>
              <span style={{fontWeight:700}}>{c.name}</span>
            </div>
          ))}
          <div style={{padding:"6px 14px",fontSize:10,color:T.textSoft,background:T.cardAlt,borderTop:`1px solid ${T.border}`}}>
            {results.length} résultat{results.length>1?"s":""} · Tapez pour affiner
          </div>
        </div>
      )}
    </div>
  );
}

// ─── HEADER ───────────────────────────────────────────────────────────────────
function AppHeader({tab,setTab,selectedName,onClearCompany,onLogout,companies,onSelectClient}){
  const navigate=useNavigate();
  const location=useLocation();
  const isClients=location.pathname==="/ficheclient";
  const isContacts=location.pathname==="/contacts";

  const handleNavClick=key=>{
    if(key==="clients"){navigate("/ficheclient");}
    else if(key==="contacts"){navigate("/contacts");}
    else{if(isClients||isContacts)navigate("/");setTab(key);}
  };

  const handleSelectClient=company=>{
    onSelectClient(company);
    navigate("/ficheclient");
  };

  return (
    <div style={{borderBottom:`1px solid ${T.border}`,padding:"12px 28px",display:"flex",alignItems:"center",justifyContent:"space-between",background:T.card,position:"sticky",top:0,zIndex:100,boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}}>
      <div style={{display:"flex",alignItems:"center",gap:20}}>
        <div style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}} onClick={()=>{navigate("/");setTab("devis");}}>
          <div style={{width:34,height:34,background:`linear-gradient(135deg,${T.indigo},${T.teal})`,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 4px 12px ${T.indigo}44`}}>
            <span style={{fontSize:16,fontWeight:900,color:"#fff"}}>Q</span>
          </div>
          <div>
            <div style={{fontSize:15,fontWeight:800,color:T.text,lineHeight:1.1}}>QUALIDAL</div>
            <div style={{fontSize:9,color:T.textSoft,letterSpacing:"0.1em",fontWeight:600}}>CRM</div>
          </div>
        </div>

        <div style={{display:"flex",gap:3,background:T.bg,border:`1px solid ${T.border}`,borderRadius:10,padding:4}}>
          {[
            ["devis","📋 Devis"],
            ["facturation","💶 Facturation"],
            ["interventions","🔧 Interventions"],
            ["clients","🏢 Clients"],
            ["contacts","📇 Contacts"],
          ].map(([key,label])=>{
            const active=key==="clients"?isClients:key==="contacts"?isContacts:!isClients&&!isContacts&&tab===key;
            return (
              <button key={key} onClick={()=>handleNavClick(key)}
                style={{cursor:"pointer",padding:"7px 14px",borderRadius:7,fontSize:12,fontWeight:700,border:"none",
                  background:active?T.card:"transparent",color:active?T.indigo:T.textMed,
                  boxShadow:active?"0 1px 4px rgba(0,0,0,0.08)":"none",transition:"all 0.15s"}}>
                {label}
              </button>
            );
          })}
        </div>

        {selectedName&&(
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"6px 12px",background:T.indigoL,border:`1px solid ${T.indigo}33`,borderRadius:8}}>
            <span style={{fontSize:12,color:T.indigo,fontWeight:700}}>🏢 {selectedName}</span>
            <span onClick={onClearCompany} style={{cursor:"pointer",fontSize:14,color:T.indigo,opacity:0.6}}>×</span>
          </div>
        )}
      </div>

      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <CompanySearch companies={companies} onSelect={handleSelectClient}/>
        <button onClick={onLogout}
          style={{padding:"7px 14px",border:`1px solid ${T.border}`,borderRadius:8,background:"transparent",color:T.textMed,fontSize:12,fontWeight:600,cursor:"pointer",transition:"all 0.15s"}}
          onMouseEnter={e=>{e.target.style.borderColor=T.rose;e.target.style.color=T.rose;}}
          onMouseLeave={e=>{e.target.style.borderColor=T.border;e.target.style.color=T.textMed;}}>
          Déconnexion
        </button>
      </div>
    </div>
  );
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────
export default function QualidaDashboard(){
  const [auth,setAuth]=useState(()=>sessionStorage.getItem("qd_auth")==="1");
  const [tab,setTab]=useState("devis");
  const [data,setData]=useState(null);
  const [loading,setLoading]=useState(true);
  const [selectedCompany,setSelectedCompany]=useState(null);
  const [activeClient,setActiveClient]=useState(null);

  const handleLogout=()=>{sessionStorage.removeItem("qd_auth");setAuth(false);};

  useEffect(()=>{
    if(auth) fetchAll().then(d=>{setData(d);setLoading(false);});
  },[auth]);

  const allCompanies=useMemo(()=>{
    if(!data) return [];
    const seen=new Set();
    const list=[];
    [...data.offers,...data.interventions].forEach(item=>{
      const c=item._project_attached?._company_attached;
      if(c?.id&&!seen.has(c.id)){seen.add(c.id);list.push(c);}
    });
    return list.sort((a,b)=>a.name.localeCompare(b.name));
  },[data]);

  const selectedName=useMemo(()=>{
    if(!selectedCompany||!data) return null;
    return allCompanies.find(c=>c?.id===selectedCompany)?.name;
  },[selectedCompany,allCompanies,data]);

  if(!auth) return <Login onLogin={()=>setAuth(true)}/>;

  if(loading) return (
    <div style={{background:T.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Nunito','Segoe UI',sans-serif"}}>
      <div style={{textAlign:"center"}}>
        <div style={{width:48,height:48,background:`linear-gradient(135deg,${T.indigo},${T.teal})`,borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",boxShadow:`0 8px 24px ${T.indigo}44`}}>
          <span style={{fontSize:22,fontWeight:900,color:"#fff"}}>Q</span>
        </div>
        <div style={{fontSize:20,fontWeight:800,color:T.text,marginBottom:6}}>QUALIDAL</div>
        <div style={{fontSize:13,color:T.textSoft}}>Chargement des données…</div>
        <div style={{marginTop:16,width:160,height:4,background:T.border,borderRadius:2,margin:"16px auto 0"}}>
          <div style={{height:4,background:`linear-gradient(90deg,${T.indigo},${T.teal})`,borderRadius:2,width:"70%"}}/>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{background:T.bg,minHeight:"100vh",fontFamily:"'Nunito','Segoe UI',sans-serif",color:T.text}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:5px;height:5px;}
        ::-webkit-scrollbar-track{background:${T.bg};}
        ::-webkit-scrollbar-thumb{background:${T.borderMd};border-radius:3px;}
        input[type="date"]::-webkit-calendar-picker-indicator{opacity:0.5;cursor:pointer;}
        input::placeholder{color:${T.textSoft};}
      `}</style>

      <AppHeader
        tab={tab} setTab={setTab}
        selectedName={selectedName} onClearCompany={()=>setSelectedCompany(null)}
        onLogout={handleLogout}
        companies={allCompanies}
        onSelectClient={c=>setActiveClient(c)}
      />

      <Routes>
        <Route path="/" element={
          <div style={{padding:"24px 28px",maxWidth:1440,margin:"0 auto"}}>
            {tab==="facturation"
              ? <SuiviFacturable projects={data.projects}/>
              : tab==="devis"
                ? <TabDevis offers={data.offers} selectedCompany={selectedCompany} onSelectCompany={setSelectedCompany}/>
                : <TabInterventions interventions={data.interventions} projects={data.projects} selectedCompany={selectedCompany} onSelectCompany={setSelectedCompany}/>
            }
          </div>
        }/>
        <Route path="/ficheclient" element={
          <ErrorBoundary>
            <FicheClient key={activeClient?.name||"no-client"} clientId={activeClient?.name} clientName={activeClient?.name}/>
          </ErrorBoundary>
        }/>
        <Route path="/contacts" element={<TableContacts/>}/>
      </Routes>

      <div style={{padding:"14px 28px",fontSize:11,color:T.textSoft,textAlign:"center",borderTop:`1px solid ${T.border}`,background:T.card,fontWeight:500}}>
        Qualidal · CRM · {USE_MOCK?"Données de démonstration":"Bubble Live"}
      </div>
    </div>
  );
}
