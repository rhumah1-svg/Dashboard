import { useState, useEffect, useMemo, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const USE_MOCK = false;
const DASH_SECRET = "qd_x9k2m7p4nz3";

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const MOCK_COMPANIES = [
  { id:"c1", name:"IDEC" },{ id:"c2", name:"COGESTRA" },
  { id:"c3", name:"ACME Construction" },{ id:"c4", name:"VINCI Construction" },
  { id:"c5", name:"EIFFAGE" },{ id:"c6", name:"SOGEA" },
];
const MOCK_PROJECTS = [
  { id:"p1", name:"AREFIM - REIMS (51)",       _company_attached:"c1", OS_prestations_type:"Dallage",          OS_devis_status:"Devis signé",         avancement:0.67 },
  { id:"p2", name:"LOZENNES (59)",              _company_attached:"c2", OS_prestations_type:"Réparation béton", OS_devis_status:"Devis envoyé",         avancement:0.32 },
  { id:"p3", name:"Chantier Paris 15",          _company_attached:"c3", OS_prestations_type:"Dallage",          OS_devis_status:"A relancer",           avancement:0.10 },
  { id:"p4", name:"Parking Rouen",              _company_attached:"c4", OS_prestations_type:"Marquage sol",     OS_devis_status:"Saisie d'information", avancement:0    },
  { id:"p5", name:"Zone artisanale Creil",      _company_attached:"c5", OS_prestations_type:"Dallage",          OS_devis_status:"Devis signé",          avancement:1.0  },
  { id:"p6", name:"ZI Amiens Nord",             _company_attached:"c2", OS_prestations_type:"Réparation béton", OS_devis_status:"Relance envoyée",      avancement:0.48 },
  { id:"p7", name:"Plateforme Marne-la-Vallée", _company_attached:"c6", OS_prestations_type:"Dallage",          OS_devis_status:"Chiffrage en cours",   avancement:0    },
];
const MOCK_OFFERS = [
  { id:"o1",  offer_number:"devis_de00001898", os_devis_statut:"Devis envoyé",        date_offre:"2025-01-10", date_validite:"2025-06-20", _project_attached:"p1", montant_ht:48200,  is_active:true  },
  { id:"o2",  offer_number:"devis_de00001901", os_devis_statut:"Devis signé",          date_offre:"2025-01-05", date_validite:"2025-07-28", _project_attached:"p2", montant_ht:127500, is_active:true  },
  { id:"o3",  offer_number:"devis_de00001905", os_devis_statut:"Devis envoyé",         date_offre:"2025-03-20", date_validite:"2025-06-19", _project_attached:"p3", montant_ht:33750,  is_active:true  },
  { id:"o4",  offer_number:"devis_de00001910", os_devis_statut:"A relancer",           date_offre:"2024-12-15", date_validite:"2025-06-21", _project_attached:"p4", montant_ht:89000,  is_active:true  },
  { id:"o5",  offer_number:"devis_de00001912", os_devis_statut:"Classé sans suite",    date_offre:"2024-12-01", date_validite:"2025-01-15", _project_attached:"p1", montant_ht:22000,  is_active:false },
  { id:"o6",  offer_number:"devis_de00001915", os_devis_statut:"Devis signé",          date_offre:"2025-02-12", date_validite:"2025-08-15", _project_attached:"p6", montant_ht:215000, is_active:true  },
  { id:"o7",  offer_number:"devis_de00001918", os_devis_statut:"Devis envoyé",         date_offre:"2025-01-25", date_validite:"2025-06-25", _project_attached:"p3", montant_ht:67300,  is_active:true  },
  { id:"o8",  offer_number:"devis_de00001920", os_devis_statut:"Relance envoyée",      date_offre:"2025-01-08", date_validite:"2025-06-22", _project_attached:"p4", montant_ht:156000, is_active:true  },
  { id:"o9",  offer_number:"devis_de00001922", os_devis_statut:"Saisie d'information", date_offre:"2025-02-01", date_validite:"2025-07-20", _project_attached:"p7", montant_ht:98500,  is_active:true  },
  { id:"o10", offer_number:"devis_de00001925", os_devis_statut:"Devis signé",          date_offre:"2025-02-18", date_validite:"2025-08-01", _project_attached:"p5", montant_ht:310000, is_active:true  },
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
  let results=[], cursor=0;
  while (true) {
    const res  = await fetch(`/api/bubble?table=${endpoint}&cursor=${cursor}&secret=${DASH_SECRET}`);
    const data = await res.json();
    const page = data.response?.results||[];
    results = results.concat(page);
    if ((data.response?.remaining??0)===0) break;
    cursor += page.length;
  }
  return results;
}

function extractCity(a) {
  if (!a?.address) return null;
  const p=a.address.split(",");
  return p[0].trim().replace(/^\d{4,5}\s*/,"")||p[1]?.trim()||null;
}

async function fetchAll() {
  if (USE_MOCK) {
    const cm=Object.fromEntries(MOCK_COMPANIES.map(c=>[c.id,c]));
    const pm=Object.fromEntries(MOCK_PROJECTS.map(p=>[p.id,{...p,_company_attached:cm[p._company_attached]}]));
    return {
      offers: MOCK_OFFERS.map(o=>({...o,_project_attached:pm[o._project_attached]})),
      interventions: MOCK_INTERVENTIONS.map(i=>({...i,_project_attached:pm[i._project_attached]})),
      projects: Object.values(pm),
    };
  }
  const [rawOffers,rawProjects,rawInterventions,rawCompanies,rawItems] = await Promise.all([
    fetchAllPages("offers_history_documents"),
    fetchAllPages("projects"),
    fetchAllPages("interventions"),
    fetchAllPages("companies"),
    fetchAllPages("items_devis"),
  ]);
  const companiesMap=Object.fromEntries(rawCompanies.map(c=>[c._id,c]));
  const numByProject={}, denomByProject={}, montantByOffer={};
  rawItems.forEach(item=>{
    const pid=item._project_attached, oid=item.offer_document_item;
    const ht=item["Total HT"]||item.Total_HT||item.total_ht||0;
    const pi=item.prix_intervention||item["prix intervention"]||0;
    const isI=item["intervention?"]===true||item.intervention===true||item.is_intervention===true;
    if (oid) montantByOffer[oid]=(montantByOffer[oid]||0)+ht;
    if (pid) { denomByProject[pid]=(denomByProject[pid]||0)+ht; if(isI) numByProject[pid]=(numByProject[pid]||0)+pi; }
  });
  const projectsMap=Object.fromEntries(rawProjects.map(p=>{
    const company=companiesMap[p._company_attached]||null;
    const city=extractCity(p.chantier_address);
    const num=numByProject[p._id]||0, denom=denomByProject[p._id]||0;
    return [p._id,{
      id:p._id, name:p.name||"", project_code:p.project_code||p._id,
      _company_attached:company?{id:company._id,name:company.name}:{id:p._company_attached,name:"—"},
      chantier_address:{city,state:city},
      OS_prestations_type:p.OS_prestations_type||"",
      OS_devis_status:p.OS_devis_status||"",
      avancement:denom>0?Math.min(num/denom,1):0,
    }];
  }));
  const offers=rawOffers.filter(o=>o._project_attached).map(o=>{
    const project=projectsMap[o._project_attached]||null;
    return {
      id:o._id, offer_number:o.devis_number||o._id,
      os_devis_statut:project?.OS_devis_status||"Saisie d'information",
      date_offre:o.date_offre?o.date_offre.slice(0,10):o["Created Date"]?.slice(0,10),
      date_validite:o.date_validite?o.date_validite.slice(0,10):null,
      _project_attached:project,
      montant_ht:montantByOffer[o._id]||0,
      is_active:o.is_active!==false,
    };
  });
  const interventions=rawInterventions.map(i=>{
    const project=projectsMap[i._project_attached]||null;
    return {
      id:i._id, name:i.name||"Sans nom", _project_attached:project,
      date:i.date?i.date.slice(0,10):i["Created Date"]?.slice(0,10),
      OS_prestations_type:i.OS_prestations_type||"",
      intervention_status:i.intervention_status||i.OS_project_intervention_status||"—",
      address:{city:extractCity(i.address)||project?.chantier_address?.city||"—"},
    };
  });
  return {offers, interventions, projects:Object.values(projectsMap)};
}

// ─── THÈME PASTEL ─────────────────────────────────────────────────────────────
const T = {
  bg:"#F2F5F9", card:"#FFFFFF", cardAlt:"#F8FAFC",
  border:"#E3E9F2", borderMd:"#C8D4E3",
  text:"#1A2640", textMed:"#475C78", textSoft:"#8BA0B8",
  // Pastels colorés
  indigo:"#5B72D4", indigoL:"#EDF0FB",
  teal:"#3A9E9E",   tealL:"#E6F5F5",
  sage:"#4E9468",   sageL:"#E8F4EE",
  amber:"#C07A2E",  amberL:"#FBF0E4",
  rose:"#BF506A",   roseL:"#FAEDF1",
  violet:"#7E5BB5", violetL:"#F2EDF9",
  sky:"#3E8EBF",    skyL:"#E5F3FA",
  coral:"#C9614A",  coralL:"#FAEAE6",
};

const STATUT_DEVIS=["Saisie d'information","Chiffrage en cours","Validé par l'administration","Devis envoyé","Devis signé","Projet terminé","A relancer","Relance envoyée","Classé sans suite","Non formalisé"];
const STATUT_INTERV=["Planifié","En cours","Terminé","Annulé"];
const STATUTS_SIGNES=["Devis signé","Projet terminé"];
const STATUTS_PIPELINE=["Chiffrage en cours","Validé par l'administration","Devis envoyé","A relancer","Relance envoyée"];
const S_COLOR={
  "Saisie d'information":T.textSoft,"Chiffrage en cours":T.sky,"Validé par l'administration":T.violet,
  "Devis envoyé":T.indigo,"Devis signé":T.sage,"Projet terminé":"#2E7A4E",
  "A relancer":T.amber,"Relance envoyée":T.coral,"Classé sans suite":T.rose,"Non formalisé":T.textSoft,
  "Planifié":T.violet,"En cours":T.amber,"Terminé":T.sage,"Annulé":T.rose,
};
const CHART_COLORS=[T.indigo,T.teal,T.sage,T.amber,T.rose,T.violet,T.sky,T.coral,"#7BAA4E"];
const fmt     =n=>new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(n||0);
const fmtK    =n=>n>=1000?`${(n/1000).toFixed(0)}k€`:`${n}€`;
const fmtDate =d=>d?new Date(d).toLocaleDateString("fr-FR"):"—";
const mLabel  =d=>new Date(d).toLocaleDateString("fr-FR",{month:"short",year:"2-digit"});
const diffDays=d=>d?Math.ceil((new Date(d)-new Date())/86400000):null;
const inRange =(ds,f,t)=>{if(!ds)return true;if(f&&ds<f)return false;if(t&&ds>t)return false;return true;};

// ─── UI ───────────────────────────────────────────────────────────────────────
function Badge({label}){
  const c=S_COLOR[label]||T.textSoft;
  return <span style={{fontSize:11,fontWeight:600,padding:"3px 9px",borderRadius:20,color:c,background:`${c}18`,border:`1px solid ${c}30`,whiteSpace:"nowrap",display:"inline-block",maxWidth:"100%",overflow:"hidden",textOverflow:"ellipsis"}}>{label}</span>;
}

function KpiCard({label,value,sub,color,pct=0}){
  return (
    <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"20px 22px",boxShadow:"0 2px 6px rgba(0,0,0,0.05)",borderLeft:`4px solid ${color}`}}>
      <div style={{fontSize:10,color:T.textSoft,fontWeight:700,letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:10}}>{label}</div>
      <div style={{fontSize:28,fontWeight:800,color:color,lineHeight:1,marginBottom:6}}>{value}</div>
      <div style={{fontSize:12,color:T.textMed,marginBottom:10}}>{sub}</div>
      <div style={{height:4,background:T.border,borderRadius:2}}>
        <div style={{height:4,background:`linear-gradient(90deg,${color}66,${color})`,width:`${Math.min(pct,100)}%`,borderRadius:2}}/>
      </div>
    </div>
  );
}

function ProgressBar({value}){
  const pct=Math.round((value||0)*100);
  const color=pct>=80?T.sage:pct>=50?T.teal:pct>=20?T.indigo:T.textSoft;
  return (
    <div style={{display:"flex",alignItems:"center",gap:7}}>
      <div style={{flex:1,height:6,background:T.border,borderRadius:3}}>
        <div style={{height:6,background:`linear-gradient(90deg,${color}88,${color})`,width:`${pct}%`,borderRadius:3,transition:"width 0.3s"}}/>
      </div>
      <span style={{fontSize:11,color:color,fontWeight:700,width:34,textAlign:"right",flexShrink:0}}>{pct}%</span>
    </div>
  );
}

function MultiSelect({label,options,selected,onChange,colorMap}){
  const [open,setOpen]=useState(false);const ref=useRef();
  useEffect(()=>{const h=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);},[]);
  const toggle=v=>onChange(selected.includes(v)?selected.filter(x=>x!==v):[...selected,v]);
  const active=selected.length>0;
  return (
    <div ref={ref} style={{position:"relative"}}>
      <button onClick={()=>setOpen(o=>!o)} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:6,padding:"7px 13px",borderRadius:8,border:`1.5px solid ${active?T.indigo:T.border}`,background:active?T.indigoL:T.card,color:active?T.indigo:T.textMed,fontSize:12,fontWeight:600,transition:"all 0.15s"}}>
        {label}{active?` · ${selected.length}`:""} <span style={{fontSize:9}}>{open?"▲":"▼"}</span>
      </button>
      {open&&(
        <div style={{position:"absolute",top:"calc(100% + 6px)",left:0,zIndex:300,background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:8,minWidth:220,maxHeight:300,overflowY:"auto",boxShadow:"0 12px 32px rgba(0,0,0,0.10)"}}>
          {selected.length>0&&<div onClick={()=>onChange([])} style={{cursor:"pointer",fontSize:11,color:T.textSoft,padding:"4px 8px",marginBottom:4}}>✕ Tout effacer</div>}
          {options.map(opt=>{
            const c=colorMap?.[opt]||T.textMed;const sel=selected.includes(opt);
            return (
              <div key={opt} onClick={()=>toggle(opt)} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:9,padding:"8px 10px",borderRadius:6,background:sel?`${c}12`:"transparent",marginBottom:2}}>
                <div style={{width:14,height:14,borderRadius:4,border:`2px solid ${sel?c:T.borderMd}`,background:sel?c:"transparent",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                  {sel&&<span style={{fontSize:9,color:"#fff",fontWeight:900}}>✓</span>}
                </div>
                <span style={{fontSize:12,color:sel?T.text:T.textMed,fontWeight:sel?600:400}}>{opt}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SearchInput({value,onChange,placeholder}){
  return (
    <div style={{position:"relative"}}>
      <span style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",fontSize:14,color:T.textSoft,pointerEvents:"none"}}>⌕</span>
      <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        style={{padding:"8px 32px 8px 30px",background:T.card,border:`1.5px solid ${T.border}`,borderRadius:8,color:T.text,fontSize:12,fontFamily:"inherit",outline:"none",width:250,transition:"border-color 0.15s"}}
        onFocus={e=>e.target.style.borderColor=T.indigo} onBlur={e=>e.target.style.borderColor=T.border}/>
      {value&&<span onClick={()=>onChange("")} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",cursor:"pointer",fontSize:13,color:T.textSoft}}>✕</span>}
    </div>
  );
}

function DateRange({dateFrom,dateTo,onChange}){
  const active=dateFrom||dateTo;
  const inp={background:T.card,border:`1.5px solid ${active?T.indigo:T.border}`,borderRadius:7,color:T.text,fontSize:12,fontFamily:"inherit",outline:"none",padding:"6px 8px",width:122};
  return (
    <div style={{display:"flex",alignItems:"center",gap:7,padding:"5px 11px",borderRadius:8,border:`1.5px solid ${active?T.indigo:T.border}`,background:active?T.indigoL:T.card}}>
      <span style={{fontSize:11,color:active?T.indigo:T.textSoft,fontWeight:600}}>Du</span>
      <input type="date" value={dateFrom||""} onChange={e=>onChange(e.target.value,dateTo)} style={inp}/>
      <span style={{fontSize:11,color:active?T.indigo:T.textSoft,fontWeight:600}}>au</span>
      <input type="date" value={dateTo||""} onChange={e=>onChange(dateFrom,e.target.value)} min={dateFrom||undefined} style={inp}/>
      {active&&<span onClick={()=>onChange("","")} style={{cursor:"pointer",fontSize:15,color:T.textSoft}}>×</span>}
    </div>
  );
}

function ColHeader({label,sortKey,sortBy,sortDir,onSort}){
  const active=sortBy===sortKey;
  return (
    <span onClick={()=>onSort(sortKey)} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:3,userSelect:"none",color:active?T.indigo:T.textSoft,fontWeight:active?700:600,fontSize:11}}>
      {label}<span style={{fontSize:8,opacity:active?1:0.4}}>{active&&sortDir==="asc"?"▲":"▼"}</span>
    </span>
  );
}

function Card({title,children,badge}){
  return (
    <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:20,boxShadow:"0 2px 6px rgba(0,0,0,0.04)"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div style={{fontSize:11,color:T.textMed,fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase"}}>{title}</div>
        {badge}
      </div>
      {children}
    </div>
  );
}

function PeriodTag({on}){
  if(!on) return null;
  return <span style={{fontSize:10,color:T.indigo,background:T.indigoL,border:`1px solid ${T.indigo}30`,borderRadius:20,padding:"2px 8px",fontWeight:600}}>période filtrée</span>;
}

// ─── ONGLET DEVIS ─────────────────────────────────────────────────────────────
function TabDevis({offers,selectedCompany,onSelectCompany}){
  const [periodFrom,setPeriodFrom]=useState("");
  const [periodTo,setPeriodTo]=useState("");
  const [search,setSearch]=useState("");
  const [filterStatuts,setFilterStatuts]=useState([]);
  const [dateFrom,setDateFrom]=useState("");
  const [dateTo,setDateTo]=useState("");
  const [sortBy,setSortBy]=useState("date_offre");
  const [sortDir,setSortDir]=useState("desc");
  const handleSort=k=>{if(sortBy===k)setSortDir(d=>d==="asc"?"desc":"asc");else{setSortBy(k);setSortDir("desc");}};

  const offersInPeriod=useMemo(()=>offers.filter(o=>inRange(o.date_offre,periodFrom,periodTo)),[offers,periodFrom,periodTo]);

  const filtered=useMemo(()=>{
    let rows=offers;
    if(search.trim()){const q=search.toLowerCase();rows=rows.filter(o=>o._project_attached?.name?.toLowerCase().includes(q)||o._project_attached?._company_attached?.name?.toLowerCase().includes(q)||o.offer_number?.toLowerCase().includes(q));}
    if(filterStatuts.length)rows=rows.filter(o=>filterStatuts.includes(o.os_devis_statut));
    if(dateFrom)rows=rows.filter(o=>o.date_offre&&o.date_offre>=dateFrom);
    if(dateTo)rows=rows.filter(o=>o.date_offre&&o.date_offre<=dateTo);
    if(selectedCompany)rows=rows.filter(o=>o._project_attached?._company_attached?.id===selectedCompany);
    return [...rows].sort((a,b)=>{
      let va,vb;
      if(sortBy==="montant_ht"){va=a.montant_ht||0;vb=b.montant_ht||0;}
      else if(sortBy==="client"){va=a._project_attached?._company_attached?.name||"";vb=b._project_attached?._company_attached?.name||"";}
      else if(sortBy==="projet"){va=a._project_attached?.name||"";vb=b._project_attached?.name||"";}
      else if(sortBy==="expiration"){va=new Date(a.date_validite||0);vb=new Date(b.date_validite||0);}
      else if(sortBy==="avancement"){va=a._project_attached?.avancement||0;vb=b._project_attached?.avancement||0;}
      else{va=new Date(a.date_offre||0);vb=new Date(b.date_offre||0);}
      if(va<vb)return sortDir==="asc"?-1:1;if(va>vb)return sortDir==="asc"?1:-1;return 0;
    });
  },[offers,search,filterStatuts,dateFrom,dateTo,selectedCompany,sortBy,sortDir]);

  const active=offersInPeriod.filter(o=>o.is_active);
  const signe=active.filter(o=>STATUTS_SIGNES.includes(o.os_devis_statut));
  const pipeline=active.filter(o=>STATUTS_PIPELINE.includes(o.os_devis_statut));
  const caSigne=signe.reduce((s,o)=>s+(o.montant_ht||0),0);
  const caPipeline=pipeline.reduce((s,o)=>s+(o.montant_ht||0),0);
  const tauxConv=active.length?Math.round((signe.length/active.length)*100):0;
  const expirent=active.filter(o=>STATUTS_PIPELINE.includes(o.os_devis_statut))
    .map(o=>({...o,daysLeft:diffDays(o.date_validite)}))
    .filter(o=>o.daysLeft!==null&&o.daysLeft<=7).sort((a,b)=>a.daysLeft-b.daysLeft);
  const totalFiltre=filtered.reduce((s,o)=>s+(o.montant_ht||0),0);

  const byClient={};
  active.forEach(o=>{const c=o._project_attached?._company_attached;if(!c)return;if(!byClient[c.id])byClient[c.id]={id:c.id,name:c.name,montant:0,count:0};byClient[c.id].montant+=o.montant_ht||0;byClient[c.id].count++;});
  const topClients=Object.values(byClient).sort((a,b)=>b.montant-a.montant).slice(0,6);
  const maxClient=topClients[0]?.montant||1;

  const byStatut=STATUT_DEVIS.map(s=>({
    s:s.length>13?s.slice(0,13)+"…":s,full:s,
    count:offersInPeriod.filter(o=>o.os_devis_statut===s).length,
    montant:offersInPeriod.filter(o=>o.os_devis_statut===s).reduce((sum,o)=>sum+(o.montant_ht||0),0),
  })).filter(d=>d.count>0);

  const hasPeriod=periodFrom||periodTo;
  const hasFilters=search||filterStatuts.length||dateFrom||dateTo||selectedCompany;

  return (
    <div>
      {/* Barre période */}
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18,padding:"10px 16px",background:T.card,border:`1px solid ${T.border}`,borderRadius:10,boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
        <span style={{fontSize:12,color:T.textMed,fontWeight:700}}>📅 Période KPIs</span>
        <DateRange dateFrom={periodFrom} dateTo={periodTo} onChange={(f,t)=>{setPeriodFrom(f);setPeriodTo(t);}}/>
        <span style={{fontSize:12,color:hasPeriod?T.indigo:T.textSoft}}>{hasPeriod?`${offersInPeriod.length} devis dans la période`:"Toutes les périodes"}</span>
      </div>

      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:20}}>
        <KpiCard label="CA Signé"        value={fmt(caSigne)}    sub={`${signe.length} devis signés`}    color={T.sage}   pct={(caSigne/(caSigne+caPipeline+1))*100}/>
        <KpiCard label="CA Pipeline"     value={fmt(caPipeline)} sub={`${pipeline.length} en cours`}     color={T.indigo} pct={(caPipeline/(caSigne+caPipeline+1))*100}/>
        <KpiCard label="Taux conversion" value={`${tauxConv}%`}  sub={`sur ${active.length} actifs`}     color={T.violet} pct={tauxConv}/>
        <KpiCard label="Expirent ≤7j"    value={expirent.length} sub={expirent.length>0?"⚠ Action requise":"✓ Tout est ok"} color={expirent.length>0?T.rose:T.sage}/>
      </div>

      {/* Charts */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 340px",gap:14,marginBottom:20}}>
        <Card title="Répartition CA par statut" badge={<PeriodTag on={hasPeriod}/>}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byStatut} margin={{top:4,right:4,left:0,bottom:24}}>
              <XAxis dataKey="s" tick={{fontSize:9,fill:T.textSoft,fontFamily:"inherit"}} axisLine={false} tickLine={false} angle={-20} textAnchor="end"/>
              <YAxis tickFormatter={fmtK} tick={{fontSize:10,fill:T.textSoft,fontFamily:"inherit"}} axisLine={false} tickLine={false} width={46}/>
              <Tooltip contentStyle={{background:T.card,border:`1px solid ${T.border}`,borderRadius:8,fontSize:12,color:T.text}} formatter={(v,_,p)=>[fmt(v),`${p.payload.count} devis`]} labelFormatter={(_,p)=>p[0]?.payload?.full||""}/>
              <Bar dataKey="montant" radius={[5,5,0,0]}>{byStatut.map(e=><Cell key={e.full} fill={S_COLOR[e.full]||T.textSoft} opacity={0.85}/>)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Top clients" badge={<PeriodTag on={hasPeriod}/>}>
          {topClients.map((c,i)=>(
            <div key={c.id} style={{marginBottom:10,cursor:"pointer"}} onClick={()=>onSelectCompany(selectedCompany===c.id?null:c.id)}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}>
                <span style={{color:selectedCompany===c.id?T.indigo:T.text,fontWeight:selectedCompany===c.id?700:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:170}}>{c.name}</span>
                <span style={{color:T.textSoft,flexShrink:0,marginLeft:6}}>{fmtK(c.montant)} · {c.count}</span>
              </div>
              <div style={{height:5,background:T.border,borderRadius:3}}>
                <div style={{height:5,background:selectedCompany===c.id?T.indigo:i===0?T.teal:T.border,width:`${(c.montant/maxClient)*100}%`,borderRadius:3,transition:"all 0.4s"}}/>
              </div>
            </div>
          ))}
          {expirent.length>0&&(
            <div style={{marginTop:14,paddingTop:12,borderTop:`1px solid ${T.border}`}}>
              <div style={{fontSize:11,color:T.rose,fontWeight:700,textTransform:"uppercase",marginBottom:8}}>⚠ Expirations urgentes</div>
              {expirent.slice(0,4).map(o=>{
                const d=o.daysLeft;const col=d<=0?T.rose:d<=2?T.amber:T.amber;
                return (
                  <div key={o.id} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:`1px solid ${T.border}`}}>
                    <div style={{fontSize:11,color:T.textMed,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:180}}>{o._project_attached?._company_attached?.name} — {o._project_attached?.name}</div>
                    <div style={{fontSize:12,fontWeight:700,color:col,flexShrink:0}}>{d<=0?"Expiré":`J-${d}`}</div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Table */}
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden",boxShadow:"0 2px 6px rgba(0,0,0,0.04)"}}>
        <div style={{padding:"16px 20px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",background:T.cardAlt}}>
          <SearchInput value={search} onChange={setSearch} placeholder="Projet, entreprise, référence…"/>
          <MultiSelect label="Statut" options={STATUT_DEVIS} selected={filterStatuts} onChange={setFilterStatuts} colorMap={S_COLOR}/>
          <DateRange dateFrom={dateFrom} dateTo={dateTo} onChange={(f,t)=>{setDateFrom(f);setDateTo(t);}}/>
          {hasFilters&&<button onClick={()=>{setSearch("");setFilterStatuts([]);setDateFrom("");setDateTo("");onSelectCompany(null);}} style={{cursor:"pointer",padding:"7px 13px",background:T.indigoL,border:`1px solid ${T.indigo}44`,borderRadius:8,color:T.indigo,fontSize:12,fontWeight:600}}>Réinitialiser</button>}
          <span style={{marginLeft:"auto",fontSize:12,color:T.textSoft,fontWeight:600}}>{filtered.length} résultat{filtered.length>1?"s":""}</span>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"150px 1fr 150px 165px 105px 130px 72px",gap:8,padding:"10px 20px",background:T.cardAlt,borderBottom:`2px solid ${T.border}`}}>
          <ColHeader label="Client"     sortKey="client"     sortBy={sortBy} sortDir={sortDir} onSort={handleSort}/>
          <ColHeader label="Projet"     sortKey="projet"     sortBy={sortBy} sortDir={sortDir} onSort={handleSort}/>
          <ColHeader label="Référence"  sortKey="offer"      sortBy={sortBy} sortDir={sortDir} onSort={handleSort}/>
          <ColHeader label="Statut"     sortKey="statut"     sortBy={sortBy} sortDir={sortDir} onSort={handleSort}/>
          <ColHeader label="Montant HT" sortKey="montant_ht" sortBy={sortBy} sortDir={sortDir} onSort={handleSort}/>
          <ColHeader label="Avancement" sortKey="avancement" sortBy={sortBy} sortDir={sortDir} onSort={handleSort}/>
          <ColHeader label="Expir."     sortKey="expiration" sortBy={sortBy} sortDir={sortDir} onSort={handleSort}/>
        </div>

        <div style={{maxHeight:520,overflowY:"auto"}}>
          {filtered.length===0
            ?<div style={{padding:"40px 20px",textAlign:"center",color:T.textSoft,fontSize:13}}>Aucun résultat pour ces filtres</div>
            :filtered.map((o,idx)=>{
              const d=diffDays(o.date_validite);
              const ec=d===null?T.textSoft:d<=0?T.rose:d<=3?T.amber:d<=7?T.amber:T.textSoft;
              return (
                <div key={o.id} style={{display:"grid",gridTemplateColumns:"150px 1fr 150px 165px 105px 130px 72px",gap:8,padding:"11px 20px",borderBottom:`1px solid ${T.border}`,alignItems:"center",background:idx%2===0?T.card:T.cardAlt,transition:"background 0.1s"}}
                  onMouseEnter={e=>e.currentTarget.style.background=T.indigoL}
                  onMouseLeave={e=>e.currentTarget.style.background=idx%2===0?T.card:T.cardAlt}>
                  <span style={{fontSize:12,color:T.text,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o._project_attached?._company_attached?.name}</span>
                  <span style={{fontSize:12,color:T.textMed,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o._project_attached?.name}</span>
                  <span style={{fontSize:11,color:T.textSoft,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.offer_number}</span>
                  <Badge label={o.os_devis_statut}/>
                  <span style={{fontSize:13,fontWeight:700,color:T.text,textAlign:"right"}}>{fmt(o.montant_ht)}</span>
                  <ProgressBar value={o._project_attached?.avancement||0}/>
                  <span style={{fontSize:11,color:ec,textAlign:"right",fontWeight:600}}>{d===null?"—":d<=0?"Expiré":`J-${d}`}</span>
                </div>
              );
            })
          }
        </div>

        <div style={{display:"grid",gridTemplateColumns:"150px 1fr 150px 165px 105px 130px 72px",gap:8,padding:"12px 20px",borderTop:`2px solid ${T.border}`,background:T.cardAlt}}>
          <span style={{gridColumn:"1/4",fontSize:12,color:T.textMed}}>{hasFilters?`Filtré · ${filtered.length} devis`:""}</span>
          <span style={{fontSize:11,color:T.textSoft,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.05em"}}>Total HT</span>
          <span style={{fontSize:15,fontWeight:800,color:T.indigo,textAlign:"right"}}>{fmt(totalFiltre)}</span>
          <span/><span/>
        </div>
      </div>
    </div>
  );
}

// ─── ONGLET INTERVENTIONS ─────────────────────────────────────────────────────
function TabInterventions({interventions,projects,selectedCompany,onSelectCompany}){
  const [periodFrom,setPeriodFrom]=useState("");
  const [periodTo,setPeriodTo]=useState("");
  const [search,setSearch]=useState("");
  const [filterStatuts,setFilterStatuts]=useState([]);
  const [filterTypes,setFilterTypes]=useState([]);
  const [dateFrom,setDateFrom]=useState("");
  const [dateTo,setDateTo]=useState("");
  const [sortBy,setSortBy]=useState("date");
  const [sortDir,setSortDir]=useState("desc");
  const handleSort=k=>{if(sortBy===k)setSortDir(d=>d==="asc"?"desc":"asc");else{setSortBy(k);setSortDir("desc");}};
  const allTypes=useMemo(()=>[...new Set(interventions.map(i=>i.OS_prestations_type).filter(Boolean))],[interventions]);
  const intervInPeriod=useMemo(()=>interventions.filter(i=>inRange(i.date,periodFrom,periodTo)),[interventions,periodFrom,periodTo]);

  const filtered=useMemo(()=>{
    let rows=interventions;
    if(search.trim()){const q=search.toLowerCase();rows=rows.filter(i=>i.name?.toLowerCase().includes(q)||i._project_attached?.name?.toLowerCase().includes(q)||i._project_attached?._company_attached?.name?.toLowerCase().includes(q));}
    if(filterStatuts.length)rows=rows.filter(i=>filterStatuts.includes(i.intervention_status));
    if(filterTypes.length)rows=rows.filter(i=>filterTypes.includes(i.OS_prestations_type));
    if(dateFrom)rows=rows.filter(i=>i.date&&i.date>=dateFrom);
    if(dateTo)rows=rows.filter(i=>i.date&&i.date<=dateTo);
    if(selectedCompany)rows=rows.filter(i=>i._project_attached?._company_attached?.id===selectedCompany);
    return [...rows].sort((a,b)=>{
      let va,vb;
      if(sortBy==="client"){va=a._project_attached?._company_attached?.name||"";vb=b._project_attached?._company_attached?.name||"";}
      else if(sortBy==="projet"){va=a._project_attached?.name||"";vb=b._project_attached?.name||"";}
      else if(sortBy==="type"){va=a.OS_prestations_type||"";vb=b.OS_prestations_type||"";}
      else{va=new Date(a.date||0);vb=new Date(b.date||0);}
      if(va<vb)return sortDir==="asc"?-1:1;if(va>vb)return sortDir==="asc"?1:-1;return 0;
    });
  },[interventions,search,filterStatuts,filterTypes,dateFrom,dateTo,selectedCompany,sortBy,sortDir]);

  const terminees=intervInPeriod.filter(i=>i.intervention_status==="Terminé");
  const enCours=intervInPeriod.filter(i=>i.intervention_status==="En cours");
  const planifiees=intervInPeriod.filter(i=>i.intervention_status==="Planifié");
  const total=intervInPeriod.length||1;

  const byType={};intervInPeriod.forEach(i=>{const t=i.OS_prestations_type||"Autre";byType[t]=(byType[t]||0)+1;});
  const typeData=Object.entries(byType).sort((a,b)=>b[1]-a[1]).map(([name,value])=>({name,value}));

  const byRegion={};intervInPeriod.forEach(i=>{const r=i.address?.city||"—";byRegion[r]=(byRegion[r]||0)+1;});
  const regionData=Object.entries(byRegion).sort((a,b)=>b[1]-a[1]).slice(0,12);
  const maxRegion=regionData[0]?.[1]||1;

  const byMonth={};intervInPeriod.forEach(i=>{if(i.date){const m=i.date.slice(0,7);byMonth[m]=(byMonth[m]||0)+1;}});
  const monthData=Object.entries(byMonth).sort().slice(-6).map(([m,count])=>({mois:mLabel(m+"-01"),count}));

  const byClientI={};
  intervInPeriod.forEach(i=>{const c=i._project_attached?._company_attached;if(!c)return;if(!byClientI[c.id])byClientI[c.id]={id:c.id,name:c.name,count:0};byClientI[c.id].count++;});
  const topClientsI=Object.values(byClientI).sort((a,b)=>b.count-a.count).slice(0,5);
  const maxClientI=topClientsI[0]?.count||1;

  const hasPeriod=periodFrom||periodTo;
  const hasFilters=search||filterStatuts.length||filterTypes.length||dateFrom||dateTo||selectedCompany;

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18,padding:"10px 16px",background:T.card,border:`1px solid ${T.border}`,borderRadius:10,boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
        <span style={{fontSize:12,color:T.textMed,fontWeight:700}}>📅 Période KPIs</span>
        <DateRange dateFrom={periodFrom} dateTo={periodTo} onChange={(f,t)=>{setPeriodFrom(f);setPeriodTo(t);}}/>
        <span style={{fontSize:12,color:hasPeriod?T.indigo:T.textSoft}}>{hasPeriod?`${intervInPeriod.length} interventions dans la période`:"Toutes les périodes"}</span>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:20}}>
        <KpiCard label="Total"      value={intervInPeriod.length} sub={`sur ${projects.length} projets`} color={T.indigo} pct={100}/>
        <KpiCard label="Terminées"  value={terminees.length}  sub={`${Math.round((terminees.length/total)*100)}% du total`} color={T.sage}   pct={(terminees.length/total)*100}/>
        <KpiCard label="En cours"   value={enCours.length}    sub="actives"  color={T.amber}  pct={(enCours.length/total)*100}/>
        <KpiCard label="Planifiées" value={planifiees.length} sub="à venir"  color={T.violet} pct={(planifiees.length/total)*100}/>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 280px",gap:14,marginBottom:20}}>
        <Card title="Types de prestations" badge={<PeriodTag on={hasPeriod}/>}>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <ResponsiveContainer width={130} height={130}>
              <PieChart><Pie data={typeData} cx="50%" cy="50%" innerRadius={36} outerRadius={60} dataKey="value" paddingAngle={3}>
                {typeData.map((_,i)=><Cell key={i} fill={CHART_COLORS[i%CHART_COLORS.length]}/>)}
              </Pie><Tooltip contentStyle={{background:T.card,border:`1px solid ${T.border}`,fontSize:12}}/></PieChart>
            </ResponsiveContainer>
            <div style={{flex:1}}>
              {typeData.map((t,i)=>(
                <div key={t.name} style={{display:"flex",alignItems:"center",gap:7,marginBottom:8,cursor:"pointer"}}
                  onClick={()=>setFilterTypes(filterTypes.includes(t.name)?filterTypes.filter(x=>x!==t.name):[...filterTypes,t.name])}>
                  <div style={{width:9,height:9,borderRadius:2,background:CHART_COLORS[i%CHART_COLORS.length],flexShrink:0}}/>
                  <span style={{fontSize:12,color:filterTypes.includes(t.name)?T.text:T.textMed,flex:1,fontWeight:filterTypes.includes(t.name)?600:400}}>{t.name}</span>
                  <span style={{fontSize:12,fontWeight:700,color:CHART_COLORS[i%CHART_COLORS.length]}}>{t.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card title="Activité mensuelle" badge={<PeriodTag on={hasPeriod}/>}>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={monthData} margin={{top:4,right:4,left:0,bottom:4}}>
              <XAxis dataKey="mois" tick={{fontSize:10,fill:T.textSoft,fontFamily:"inherit"}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:10,fill:T.textSoft,fontFamily:"inherit"}} axisLine={false} tickLine={false} width={22} allowDecimals={false}/>
              <Tooltip contentStyle={{background:T.card,border:`1px solid ${T.border}`,fontSize:12}}/>
              <Bar dataKey="count" name="Interventions" fill={T.teal} radius={[4,4,0,0]} opacity={0.85}/>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Zones d'activité">
          <div style={{maxHeight:120,overflowY:"auto",marginBottom:12}}>
            {regionData.map(([r,v],i)=>(
              <div key={r} style={{marginBottom:7}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:3}}>
                  <span style={{color:T.textMed,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:155}}>{r}</span>
                  <span style={{color:T.textSoft,flexShrink:0,marginLeft:6,fontWeight:600}}>{v}</span>
                </div>
                <div style={{height:4,background:T.border,borderRadius:2}}>
                  <div style={{height:4,background:i===0?T.teal:T.border,width:`${(v/maxRegion)*100}%`,borderRadius:2}}/>
                </div>
              </div>
            ))}
          </div>
          <div style={{paddingTop:10,borderTop:`1px solid ${T.border}`}}>
            <div style={{fontSize:10,color:T.textSoft,fontWeight:700,textTransform:"uppercase",marginBottom:8}}>Top clients</div>
            {topClientsI.map((c,i)=>(
              <div key={c.id} style={{marginBottom:7,cursor:"pointer"}} onClick={()=>onSelectCompany(selectedCompany===c.id?null:c.id)}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:3}}>
                  <span style={{color:selectedCompany===c.id?T.indigo:T.text,fontWeight:selectedCompany===c.id?700:500}}>{c.name}</span>
                  <span style={{color:T.textSoft}}>{c.count}</span>
                </div>
                <div style={{height:4,background:T.border,borderRadius:2}}>
                  <div style={{height:4,background:selectedCompany===c.id?T.indigo:i===0?T.sage:T.border,width:`${(c.count/maxClientI)*100}%`,borderRadius:2}}/>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden",boxShadow:"0 2px 6px rgba(0,0,0,0.04)"}}>
        <div style={{padding:"16px 20px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",background:T.cardAlt}}>
          <SearchInput value={search} onChange={setSearch} placeholder="Intervention, projet, entreprise…"/>
          <MultiSelect label="Statut" options={STATUT_INTERV} selected={filterStatuts} onChange={setFilterStatuts} colorMap={S_COLOR}/>
          <MultiSelect label="Type"   options={allTypes}      selected={filterTypes}   onChange={setFilterTypes}/>
          <DateRange dateFrom={dateFrom} dateTo={dateTo} onChange={(f,t)=>{setDateFrom(f);setDateTo(t);}}/>
          {hasFilters&&<button onClick={()=>{setSearch("");setFilterStatuts([]);setFilterTypes([]);setDateFrom("");setDateTo("");onSelectCompany(null);}} style={{cursor:"pointer",padding:"7px 13px",background:T.indigoL,border:`1px solid ${T.indigo}44`,borderRadius:8,color:T.indigo,fontSize:12,fontWeight:600}}>Réinitialiser</button>}
          <span style={{marginLeft:"auto",fontSize:12,color:T.textSoft,fontWeight:600}}>{filtered.length} résultat{filtered.length>1?"s":""}</span>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"150px 180px 1fr 140px 95px 120px",gap:8,padding:"10px 20px",background:T.cardAlt,borderBottom:`2px solid ${T.border}`}}>
          <ColHeader label="Client"       sortKey="client" sortBy={sortBy} sortDir={sortDir} onSort={handleSort}/>
          <ColHeader label="Projet"       sortKey="projet" sortBy={sortBy} sortDir={sortDir} onSort={handleSort}/>
          <ColHeader label="Intervention" sortKey="name"   sortBy={sortBy} sortDir={sortDir} onSort={handleSort}/>
          <ColHeader label="Type"         sortKey="type"   sortBy={sortBy} sortDir={sortDir} onSort={handleSort}/>
          <ColHeader label="Date"         sortKey="date"   sortBy={sortBy} sortDir={sortDir} onSort={handleSort}/>
          <span style={{fontSize:11,color:T.textSoft,fontWeight:600}}>Statut</span>
        </div>

        <div style={{maxHeight:520,overflowY:"auto"}}>
          {filtered.length===0
            ?<div style={{padding:"40px 20px",textAlign:"center",color:T.textSoft,fontSize:13}}>Aucun résultat pour ces filtres</div>
            :filtered.map((i,idx)=>(
              <div key={i.id} style={{display:"grid",gridTemplateColumns:"150px 180px 1fr 140px 95px 120px",gap:8,padding:"11px 20px",borderBottom:`1px solid ${T.border}`,alignItems:"center",background:idx%2===0?T.card:T.cardAlt,transition:"background 0.1s"}}
                onMouseEnter={e=>e.currentTarget.style.background=T.indigoL}
                onMouseLeave={e=>e.currentTarget.style.background=idx%2===0?T.card:T.cardAlt}>
                <span style={{fontSize:12,color:T.text,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{i._project_attached?._company_attached?.name}</span>
                <span style={{fontSize:12,color:T.textMed,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{i._project_attached?.name}</span>
                <span style={{fontSize:12,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{i.name}</span>
                <span style={{fontSize:11,color:T.textMed,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{i.OS_prestations_type}</span>
                <span style={{fontSize:12,color:T.textMed}}>{fmtDate(i.date)}</span>
                <Badge label={i.intervention_status||"—"}/>
              </div>
            ))
          }
        </div>
        <div style={{padding:"10px 20px",fontSize:12,color:T.textSoft,borderTop:`1px solid ${T.border}`,background:T.cardAlt}}>
          {filtered.length} intervention{filtered.length>1?"s":""} affichée{filtered.length>1?"s":""}
        </div>
      </div>
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function QualidaDashboard(){
  const [tab,setTab]=useState("devis");
  const [data,setData]=useState(null);
  const [loading,setLoading]=useState(true);
  const [selectedCompany,setSelectedCompany]=useState(null);

  useEffect(()=>{fetchAll().then(d=>{setData(d);setLoading(false);});},[]);

  const selectedName=useMemo(()=>{
    if(!selectedCompany||!data)return null;
    return [...data.offers.map(o=>o._project_attached?._company_attached),...data.interventions.map(i=>i._project_attached?._company_attached)]
      .find(c=>c?.id===selectedCompany)?.name;
  },[selectedCompany,data]);

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

      {/* HEADER */}
      <div style={{borderBottom:`1px solid ${T.border}`,padding:"12px 28px",display:"flex",alignItems:"center",justifyContent:"space-between",background:T.card,position:"sticky",top:0,zIndex:100,boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}}>
        <div style={{display:"flex",alignItems:"center",gap:24}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:34,height:34,background:`linear-gradient(135deg,${T.indigo},${T.teal})`,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 4px 12px ${T.indigo}44`}}>
              <span style={{fontSize:16,fontWeight:900,color:"#fff"}}>Q</span>
            </div>
            <div>
              <div style={{fontSize:15,fontWeight:800,color:T.text,lineHeight:1.1}}>QUALIDAL</div>
              <div style={{fontSize:9,color:T.textSoft,letterSpacing:"0.1em",fontWeight:600}}>DASHBOARD</div>
            </div>
          </div>
          <div style={{display:"flex",gap:3,background:T.bg,border:`1px solid ${T.border}`,borderRadius:10,padding:4}}>
            {[["devis","📋 Devis"],["interventions","🔧 Interventions"]].map(([key,label])=>(
              <button key={key} onClick={()=>setTab(key)} style={{cursor:"pointer",padding:"7px 20px",borderRadius:7,fontSize:12,fontWeight:700,border:"none",background:tab===key?T.card:"transparent",color:tab===key?T.indigo:T.textMed,boxShadow:tab===key?`0 1px 6px rgba(0,0,0,0.08)`:"none",transition:"all 0.15s"}}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {selectedName&&(
            <div style={{display:"flex",alignItems:"center",gap:7,padding:"6px 13px",background:T.indigoL,border:`1px solid ${T.indigo}30`,borderRadius:20}}>
              <span style={{fontSize:12,color:T.indigo,fontWeight:700}}>🏢 {selectedName}</span>
              <button onClick={()=>setSelectedCompany(null)} style={{cursor:"pointer",background:"none",border:"none",color:T.indigo,fontSize:15,lineHeight:1,padding:0}}>×</button>
            </div>
          )}
          {USE_MOCK&&<span style={{fontSize:10,color:T.amber,padding:"3px 8px",border:`1px solid ${T.amber}44`,borderRadius:4,fontWeight:700}}>MOCK</span>}
          <span style={{fontSize:12,color:T.textSoft,fontWeight:500}}>{new Date().toLocaleDateString("fr-FR",{weekday:"short",day:"2-digit",month:"short",year:"numeric"})}</span>
        </div>
      </div>

      <div style={{padding:"24px 28px",maxWidth:1440,margin:"0 auto"}}>
        {tab==="devis"
          ?<TabDevis offers={data.offers} selectedCompany={selectedCompany} onSelectCompany={setSelectedCompany}/>
          :<TabInterventions interventions={data.interventions} projects={data.projects} selectedCompany={selectedCompany} onSelectCompany={setSelectedCompany}/>
        }
      </div>

      <div style={{padding:"14px 28px",fontSize:11,color:T.textSoft,textAlign:"center",borderTop:`1px solid ${T.border}`,background:T.card,fontWeight:500}}>
        Qualidal · Dashboard Commercial & Opérationnel · {USE_MOCK?"Données de démonstration":"Bubble Live"}
      </div>
    </div>
  );
}
