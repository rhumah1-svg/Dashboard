import { useState, useEffect, useMemo, useRef } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useParams } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const USE_MOCK = false;
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
const TYPE_CONTACT_COLOR={"Principal":T.indigo,"Secondaire":T.teal,"Mise en copie":T.amber,"Comptabilité":T.violet};
const HISTORIQUE_COLOR={"Appel":T.sage,"Email":T.indigo,"Réunion":T.violet,"Note":T.amber};

// ─── UTILS ────────────────────────────────────────────────────────────────────
const fmt     =n=>new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(n||0);
const fmtK    =n=>n>=1000?`${(n/1000).toFixed(0)}k€`:`${n}€`;
const fmtDate =d=>d?new Date(d).toLocaleDateString("fr-FR"):"—";
const mLabel  =d=>new Date(d).toLocaleDateString("fr-FR",{month:"short",year:"2-digit"});
const diffDays=d=>d?Math.ceil((new Date(d)-new Date())/86400000):null;
const inRange =(ds,f,t)=>{if(!ds)return true;if(f&&ds<f)return false;if(t&&ds>t)return false;return true;};

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const MOCK_COMPANIES=[
  {_id:"c1",name:"IDEC Construction",   address:"14 rue de la République, 75001 Paris",       phone:"+33 1 42 86 54 00",email:"contact@idec.fr",      siret:"412 345 678 00021","Created Date":"2021-03-15"},
  {_id:"c2",name:"COGESTRA",            address:"ZI des Bruyères, 59000 Lille",               phone:"+33 3 20 11 22 33",email:"info@cogestra.fr",     siret:"512 678 901 00034","Created Date":"2020-07-10"},
  {_id:"c3",name:"ACME Construction",   address:"15 avenue Haussmann, 75008 Paris",            phone:"+33 1 56 78 90 12",email:"contact@acme.fr",      siret:"312 456 789 00012","Created Date":"2022-01-20"},
  {_id:"c4",name:"VINCI Construction",  address:"1 cours Ferdinand de Lesseps, 92500 Rueil",  phone:"+33 1 47 16 35 00",email:"vinci@vinci.fr",       siret:"552 037 806 00201","Created Date":"2019-05-15"},
  {_id:"c5",name:"EIFFAGE",             address:"3-7 Place de l'Europe, 78140 Vélizy",        phone:"+33 1 34 65 89 89",email:"eiffage@eiffage.fr",   siret:"709 802 094 00022","Created Date":"2020-11-08"},
  {_id:"c6",name:"SOGEA",              address:"Tour Pacific, 92800 Puteaux",                 phone:"+33 1 47 16 45 00",email:"sogea@vinci.fr",        siret:"542 105 447 00089","Created Date":"2021-08-30"},
];
const MOCK_PROJECTS=[
  {_id:"p1",name:"AREFIM - REIMS (51)",      _company_attached:"c1",OS_devis_status:"Devis signé",        OS_prestations_type:"Dallage",         avancement:0.67},
  {_id:"p2",name:"LOGISTIQUE SENLIS (60)",   _company_attached:"c1",OS_devis_status:"Chiffrage en cours", OS_prestations_type:"Réparation béton",avancement:0.15},
  {_id:"p3",name:"ENTREPÔT ROISSY (95)",     _company_attached:"c1",OS_devis_status:"Devis envoyé",       OS_prestations_type:"Marquage sol",    avancement:0},
  {_id:"p4",name:"LOZENNES (59)",            _company_attached:"c2",OS_devis_status:"Devis envoyé",       OS_prestations_type:"Réparation béton",avancement:0.32},
  {_id:"p5",name:"ZI AMIENS NORD",           _company_attached:"c2",OS_devis_status:"Relance envoyée",    OS_prestations_type:"Dallage",         avancement:0.48},
  {_id:"p6",name:"Chantier Paris 15",        _company_attached:"c3",OS_devis_status:"A relancer",         OS_prestations_type:"Dallage",         avancement:0.10},
  {_id:"p7",name:"Parking Rouen",            _company_attached:"c4",OS_devis_status:"Saisie d'information",OS_prestations_type:"Marquage sol",   avancement:0},
  {_id:"p8",name:"Zone artisanale Creil",    _company_attached:"c5",OS_devis_status:"Devis signé",        OS_prestations_type:"Dallage",         avancement:1.0},
  {_id:"p9",name:"Plateforme Marne-la-Vallée",_company_attached:"c6",OS_devis_status:"Chiffrage en cours",OS_prestations_type:"Dallage",         avancement:0},
];
const MOCK_OFFERS=[
  {_id:"o1", offer_number:"devis_de00001898",date_offre:"2025-01-10",date_validite:"2025-06-20",_project_attached:"p1",montant_ht:48200, is_active:true },
  {_id:"o2", offer_number:"devis_de00001899",date_offre:"2025-01-05",date_validite:"2025-07-28",_project_attached:"p1",montant_ht:137200,is_active:true },
  {_id:"o3", offer_number:"devis_de00001901",date_offre:"2025-01-05",date_validite:"2025-07-28",_project_attached:"p2",montant_ht:67200, is_active:true },
  {_id:"o4", offer_number:"devis_de00001905",date_offre:"2025-03-20",date_validite:"2025-06-19",_project_attached:"p3",montant_ht:42800, is_active:true },
  {_id:"o5", offer_number:"devis_de00001910",date_offre:"2024-12-15",date_validite:"2025-06-21",_project_attached:"p4",montant_ht:127500,is_active:true },
  {_id:"o6", offer_number:"devis_de00001912",date_offre:"2024-12-01",date_validite:"2025-01-15",_project_attached:"p4",montant_ht:22000, is_active:false},
  {_id:"o7", offer_number:"devis_de00001915",date_offre:"2025-02-12",date_validite:"2025-08-15",_project_attached:"p5",montant_ht:215000,is_active:true },
  {_id:"o8", offer_number:"devis_de00001918",date_offre:"2025-01-25",date_validite:"2025-06-25",_project_attached:"p6",montant_ht:67300, is_active:true },
  {_id:"o9", offer_number:"devis_de00001920",date_offre:"2025-01-08",date_validite:"2025-06-22",_project_attached:"p7",montant_ht:89000, is_active:true },
  {_id:"o10",offer_number:"devis_de00001925",date_offre:"2025-02-18",date_validite:"2025-08-01",_project_attached:"p8",montant_ht:310000,is_active:true },
  {_id:"o11",offer_number:"devis_de00001922",date_offre:"2025-02-01",date_validite:"2025-07-20",_project_attached:"p9",montant_ht:98500, is_active:true },
];
const MOCK_INTERVENTIONS=[
  {_id:"i1", name:"Reprise fissures dalle",   _project_attached:"p1",date:"2025-01-15",OS_prestations_type:"Réparation béton",intervention_status:"Terminé", address:{city:"Reims" },agents:["Pierre Martin","Lucas Bernard"],rapport:"Sophie Durand"},
  {_id:"i2", name:"Traitement surface",        _project_attached:"p1",date:"2025-03-10",OS_prestations_type:"Dallage",         intervention_status:"En cours",address:{city:"Reims" },agents:["Lucas Bernard"],                  rapport:"Sophie Durand"},
  {_id:"i3", name:"Reprise joint dilatation",  _project_attached:"p1",date:"2025-04-22",OS_prestations_type:"Réparation béton",intervention_status:"Planifié",address:{city:"Reims" },agents:["Pierre Martin","Ali Benali"],     rapport:"Marc Dupont"  },
  {_id:"i4", name:"Diagnostic structure",      _project_attached:"p2",date:"2025-02-01",OS_prestations_type:"Réparation béton",intervention_status:"Terminé", address:{city:"Senlis"},agents:["Ali Benali"],                     rapport:"Marc Dupont"  },
  {_id:"i5", name:"Injection résine",          _project_attached:"p2",date:"2025-05-10",OS_prestations_type:"Réparation béton",intervention_status:"Planifié",address:{city:"Senlis"},agents:["Pierre Martin"],                  rapport:"Sophie Durand"},
  {_id:"i6", name:"Coulage dalle hangar",      _project_attached:"p4",date:"2024-11-20",OS_prestations_type:"Dallage",         intervention_status:"Terminé", address:{city:"Lille" },agents:["Lucas Bernard"],                  rapport:"Marc Dupont"  },
  {_id:"i7", name:"Ponçage + durcisseur",      _project_attached:"p4",date:"2025-01-28",OS_prestations_type:"Dallage",         intervention_status:"Terminé", address:{city:"Lille" },agents:["Lucas Bernard"],                  rapport:"Marc Dupont"  },
  {_id:"i8", name:"Marquage allées",           _project_attached:"p5",date:"2025-03-15",OS_prestations_type:"Marquage sol",    intervention_status:"Planifié",address:{city:"Amiens"},agents:["Ali Benali"],                     rapport:"Marc Dupont"  },
  {_id:"i9", name:"Injection résine fissures", _project_attached:"p5",date:"2024-12-10",OS_prestations_type:"Réparation béton",intervention_status:"Terminé", address:{city:"Amiens"},agents:["Pierre Martin"],                  rapport:"Sophie Durand"},
  {_id:"i10",name:"Traitement anti-poussière", _project_attached:"p6",date:"2025-02-05",OS_prestations_type:"Dallage",         intervention_status:"En cours",address:{city:"Paris" },agents:["Lucas Bernard"],                  rapport:"Sophie Durand"},
  {_id:"i11",name:"Marquage parking",          _project_attached:"p7",date:"2025-01-12",OS_prestations_type:"Marquage sol",    intervention_status:"Terminé", address:{city:"Rouen" },agents:["Ali Benali"],                     rapport:"Marc Dupont"  },
  {_id:"i12",name:"Traitement sol industriel", _project_attached:"p8",date:"2025-01-22",OS_prestations_type:"Dallage",         intervention_status:"En cours",address:{city:"Creil" },agents:["Ali Benali","Pierre Martin"],     rapport:"Sophie Durand"},
  {_id:"i13",name:"Coulage dallage neuf",      _project_attached:"p9",date:"2025-04-15",OS_prestations_type:"Dallage",         intervention_status:"Planifié",address:{city:"Marne" },agents:["Pierre Martin"],                  rapport:"Marc Dupont"  },
];
const MOCK_CONTACTS={
  c1:[
    {_id:"ct1",name:"Jean-Eudes Gohard",type_contact:"Principal",    email:"je.gohard@idec.fr",  phone:"+33 6 12 34 56 78"},
    {_id:"ct2",name:"Marie Fontaine",   type_contact:"Mise en copie",email:"m.fontaine@idec.fr", phone:"+33 6 98 76 54 32"},
    {_id:"ct3",name:"Thomas Beaumont",  type_contact:"Comptabilité", email:"compta@idec.fr",     phone:"+33 1 42 86 54 01"},
  ],
  c2:[
    {_id:"ct4",name:"Paul Henrard",     type_contact:"Principal",    email:"p.henrard@cogestra.fr",phone:"+33 6 11 22 33 44"},
    {_id:"ct5",name:"Claire Dubois",    type_contact:"Secondaire",   email:"c.dubois@cogestra.fr", phone:"+33 6 55 66 77 88"},
  ],
  c3:[{_id:"ct6",name:"Alex Martin",   type_contact:"Principal",    email:"a.martin@acme.fr",   phone:"+33 6 33 44 55 66"}],
  c4:[{_id:"ct7",name:"Sophie Blanc",  type_contact:"Principal",    email:"s.blanc@vinci.fr",   phone:"+33 6 77 88 99 00"}],
  c5:[{_id:"ct8",name:"Luc Petit",     type_contact:"Principal",    email:"l.petit@eiffage.fr", phone:"+33 6 44 55 66 77"}],
  c6:[{_id:"ct9",name:"Emma Roux",     type_contact:"Principal",    email:"e.roux@sogea.fr",    phone:"+33 6 22 33 44 55"}],
};
const MOCK_HISTORIQUE={
  c1:[
    {_id:"h1",date:"2025-02-14",type:"Appel",  auteur:"ST", note:"Relance devis AREFIM — client confirme signature prochaine semaine."},
    {_id:"h2",date:"2025-01-28",type:"Email",  auteur:"AM", note:"Envoi devis actualisé suite demande modification quantités."},
    {_id:"h3",date:"2025-01-10",type:"Réunion",auteur:"ST", note:"Réunion de chantier Reims. Points : planning T1, accès zone sud."},
  ],
  c2:[
    {_id:"h4",date:"2025-01-20",type:"Appel",  auteur:"MEM",note:"Suivi devis LOZENNES. Client demande délai supplémentaire."},
  ],
};

// ─── FETCH BUBBLE ─────────────────────────────────────────────────────────────
async function fetchAllPages(table){
  let results=[],cursor=0;
  while(true){
    const res=await fetch(`/api/bubble?table=${table}&cursor=${cursor}&secret=${DASH_SECRET}`);
    const data=await res.json();
    const page=data.response?.results||[];
    results=results.concat(page);
    if((data.response?.remaining??0)===0)break;
    cursor+=page.length;
  }
  return results;
}

function extractCity(a){
  if(!a?.address)return null;
  const p=a.address.split(",");
  return p[0].trim().replace(/^\d{4,5}\s*/,"")||p[1]?.trim()||null;
}

// Construit les données normalisées depuis Bubble ou Mock
async function fetchAll(){
  if(USE_MOCK){
    const cm=Object.fromEntries(MOCK_COMPANIES.map(c=>[c._id,{id:c._id,name:c.name}]));
    const pm=Object.fromEntries(MOCK_PROJECTS.map(p=>[p._id,{
      id:p._id,name:p.name,project_code:p._id,
      _company_attached:cm[p._company_attached]||{id:p._company_attached,name:"—"},
      OS_prestations_type:p.OS_prestations_type,OS_devis_status:p.OS_devis_status,avancement:p.avancement,
      chantier_address:{city:""},
    }]));
    const offers=MOCK_OFFERS.map(o=>({
      id:o._id,offer_number:o.offer_number,
      os_devis_statut:pm[o._project_attached]?.OS_devis_status||"Saisie d'information",
      date_offre:o.date_offre,date_validite:o.date_validite,
      _project_attached:pm[o._project_attached]||null,
      montant_ht:o.montant_ht,is_active:o.is_active,
    }));
    const interventions=MOCK_INTERVENTIONS.map(i=>({
      id:i._id,name:i.name,
      _project_attached:pm[i._project_attached]||null,
      date:i.date,OS_prestations_type:i.OS_prestations_type,
      intervention_status:i.intervention_status,
      address:i.address,agents:i.agents,rapport:i.rapport,
    }));
    return{offers,interventions,projects:Object.values(pm)};
  }
  const [rawOffers,rawProjects,rawInterventions,rawCompanies,rawItems]=await Promise.all([
    fetchAllPages("offers_history_documents"),fetchAllPages("projects"),
    fetchAllPages("interventions"),fetchAllPages("companies"),fetchAllPages("items_devis"),
  ]);
  const companiesMap=Object.fromEntries(rawCompanies.map(c=>[c._id,c]));
  const numByProject={},denomByProject={},montantByOffer={};
  rawItems.forEach(item=>{
    const pid=item._project_attached,oid=item.offer_document_item;
    const ht=item["Total HT"]||item.Total_HT||item.total_ht||0;
    const pi=item.prix_intervention||item["prix intervention"]||0;
    const isI=item["intervention?"]===true||item.intervention===true||item.is_intervention===true;
    if(oid)montantByOffer[oid]=(montantByOffer[oid]||0)+ht;
    if(pid){denomByProject[pid]=(denomByProject[pid]||0)+ht;if(isI)numByProject[pid]=(numByProject[pid]||0)+pi;}
  });
  const projectsMap=Object.fromEntries(rawProjects.map(p=>{
    const company=companiesMap[p._company_attached]||null;
    const city=extractCity(p.chantier_address);
    const num=numByProject[p._id]||0,denom=denomByProject[p._id]||0;
    return[p._id,{
      id:p._id,name:p.name||"",project_code:p.project_code||p._id,
      _company_attached:company?{id:company._id,name:company.name}:{id:p._company_attached,name:"—"},
      chantier_address:{city,state:city},
      OS_prestations_type:p.OS_prestations_type||"",OS_devis_status:p.OS_devis_status||"",
      avancement:denom>0?Math.min(num/denom,1):0,
    }];
  }));
  const offers=rawOffers.filter(o=>o._project_attached).map(o=>{
    const project=projectsMap[o._project_attached]||null;
    return{id:o._id,offer_number:o.devis_number||o._id,
      os_devis_statut:project?.OS_devis_status||"Saisie d'information",
      date_offre:o.date_offre?o.date_offre.slice(0,10):o["Created Date"]?.slice(0,10),
      date_validite:o.date_validite?o.date_validite.slice(0,10):null,
      _project_attached:project,montant_ht:montantByOffer[o._id]||0,is_active:o.is_active!==false,
    };
  });
  const interventions=rawInterventions.map(i=>{
    const project=projectsMap[i._project_attached]||null;
    return{id:i._id,name:i.name||"Sans nom",_project_attached:project,
      date:i.date?i.date.slice(0,10):i["Created Date"]?.slice(0,10),
      OS_prestations_type:i.OS_prestations_type||"",
      intervention_status:i.intervention_status||i.OS_project_intervention_status||"—",
      address:{city:extractCity(i.address)||project?.chantier_address?.city||"—"},
      agents:[],rapport:"",
    };
  });
  return{offers,interventions,projects:Object.values(projectsMap)};
}

// ─── COMPOSANTS PARTAGÉS ──────────────────────────────────────────────────────
function Badge({label,color}){
  const c=color||S_COLOR[label]||T.textSoft;
  return<span style={{fontSize:11,fontWeight:600,padding:"3px 9px",borderRadius:20,color:c,background:`${c}18`,border:`1px solid ${c}30`,whiteSpace:"nowrap",display:"inline-block",maxWidth:"100%",overflow:"hidden",textOverflow:"ellipsis"}}>{label}</span>;
}
function ProgressBar({value}){
  const pct=Math.round((value||0)*100);
  const color=pct>=80?T.sage:pct>=50?T.teal:pct>=20?T.indigo:T.textSoft;
  return(
    <div style={{display:"flex",alignItems:"center",gap:7}}>
      <div style={{flex:1,height:6,background:T.border,borderRadius:3}}>
        <div style={{height:6,background:`linear-gradient(90deg,${color}88,${color})`,width:`${pct}%`,borderRadius:3,transition:"width 0.3s"}}/>
      </div>
      <span style={{fontSize:11,color,fontWeight:700,width:34,textAlign:"right",flexShrink:0}}>{pct}%</span>
    </div>
  );
}
function KpiCard({label,value,sub,color,pct=0}){
  return(
    <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"20px 22px",boxShadow:"0 2px 6px rgba(0,0,0,0.05)",borderLeft:`4px solid ${color}`}}>
      <div style={{fontSize:10,color:T.textSoft,fontWeight:700,letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:10}}>{label}</div>
      <div style={{fontSize:28,fontWeight:800,color,lineHeight:1,marginBottom:6}}>{value}</div>
      <div style={{fontSize:12,color:T.textMed,marginBottom:10}}>{sub}</div>
      <div style={{height:4,background:T.border,borderRadius:2}}>
        <div style={{height:4,background:`linear-gradient(90deg,${color}66,${color})`,width:`${Math.min(pct,100)}%`,borderRadius:2}}/>
      </div>
    </div>
  );
}
function MultiSelect({label,options,selected,onChange,colorMap}){
  const[open,setOpen]=useState(false);const ref=useRef();
  useEffect(()=>{const h=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);},[]);
  const toggle=v=>onChange(selected.includes(v)?selected.filter(x=>x!==v):[...selected,v]);
  const active=selected.length>0;
  return(
    <div ref={ref} style={{position:"relative"}}>
      <button onClick={()=>setOpen(o=>!o)} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:6,padding:"7px 13px",borderRadius:8,border:`1.5px solid ${active?T.indigo:T.border}`,background:active?T.indigoL:T.card,color:active?T.indigo:T.textMed,fontSize:12,fontWeight:600,transition:"all 0.15s"}}>
        {label}{active?` · ${selected.length}`:""}<span style={{fontSize:9}}>{open?"▲":"▼"}</span>
      </button>
      {open&&(
        <div style={{position:"absolute",top:"calc(100% + 6px)",left:0,zIndex:300,background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:8,minWidth:220,maxHeight:300,overflowY:"auto",boxShadow:"0 12px 32px rgba(0,0,0,0.10)"}}>
          {selected.length>0&&<div onClick={()=>onChange([])} style={{cursor:"pointer",fontSize:11,color:T.textSoft,padding:"4px 8px",marginBottom:4}}>✕ Tout effacer</div>}
          {options.map(opt=>{
            const c=colorMap?.[opt]||T.textMed;const sel=selected.includes(opt);
            return(
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
function SearchBox({value,onChange,placeholder,width=250}){
  return(
    <div style={{position:"relative"}}>
      <span style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",fontSize:14,color:T.textSoft,pointerEvents:"none"}}>⌕</span>
      <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder||"Rechercher…"}
        style={{padding:"8px 32px 8px 30px",background:T.card,border:`1.5px solid ${T.border}`,borderRadius:8,color:T.text,fontSize:12,fontFamily:"inherit",outline:"none",width,transition:"border-color 0.15s"}}
        onFocus={e=>e.target.style.borderColor=T.indigo} onBlur={e=>e.target.style.borderColor=T.border}/>
      {value&&<span onClick={()=>onChange("")} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",cursor:"pointer",fontSize:13,color:T.textSoft}}>✕</span>}
    </div>
  );
}
function DateRange({dateFrom,dateTo,onChange}){
  const active=dateFrom||dateTo;
  const inp={background:T.card,border:`1.5px solid ${active?T.indigo:T.border}`,borderRadius:7,color:T.text,fontSize:12,fontFamily:"inherit",outline:"none",padding:"6px 8px",width:122};
  return(
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
  return(
    <span onClick={()=>onSort(sortKey)} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:3,userSelect:"none",color:active?T.indigo:T.textSoft,fontWeight:active?700:600,fontSize:11}}>
      {label}<span style={{fontSize:8,opacity:active?1:0.4}}>{active&&sortDir==="asc"?"▲":"▼"}</span>
    </span>
  );
}
function CardBox({title,children,badge,accent}){
  return(
    <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden",boxShadow:"0 2px 6px rgba(0,0,0,0.04)"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 20px",borderBottom:`1px solid ${T.border}`,background:T.cardAlt,borderLeft:accent?`4px solid ${accent}`:"none"}}>
        <span style={{fontSize:11,fontWeight:700,color:T.textMed,letterSpacing:"0.07em",textTransform:"uppercase"}}>{title}</span>
        {badge}
      </div>
      <div style={{padding:20}}>{children}</div>
    </div>
  );
}
function PeriodTag({on}){
  if(!on)return null;
  return<span style={{fontSize:10,color:T.indigo,background:T.indigoL,border:`1px solid ${T.indigo}30`,borderRadius:20,padding:"2px 8px",fontWeight:600}}>période filtrée</span>;
}

// ─── NAVBAR ───────────────────────────────────────────────────────────────────
function Navbar({mainTab,setMainTab,selectedName,onClearCompany}){
  const navigate=useNavigate();
  return(
    <div style={{background:T.card,borderBottom:`1px solid ${T.border}`,padding:"12px 28px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100,boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}}>
      <div style={{display:"flex",alignItems:"center",gap:20}}>
        <div style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}} onClick={()=>{setMainTab&&setMainTab("dashboard");navigate("/");}}>
          <div style={{width:34,height:34,background:`linear-gradient(135deg,${T.indigo},${T.teal})`,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 4px 10px ${T.indigo}44`}}>
            <span style={{fontSize:16,fontWeight:900,color:"#fff"}}>Q</span>
          </div>
          <div>
            <div style={{fontSize:15,fontWeight:800,color:T.text,lineHeight:1.1}}>QUALIDAL</div>
            <div style={{fontSize:9,color:T.textSoft,letterSpacing:"0.1em",fontWeight:600}}>DASHBOARD</div>
          </div>
        </div>
        {/* Onglets principaux */}
        <div style={{display:"flex",gap:3,background:T.bg,border:`1px solid ${T.border}`,borderRadius:10,padding:4}}>
          {[["dashboard","📊 Dashboard"],["clients","🏢 Clients"]].map(([key,label])=>(
            <button key={key} onClick={()=>{if(key==="clients")navigate("/clients");else navigate("/");setMainTab&&setMainTab(key);}}
              style={{cursor:"pointer",padding:"7px 18px",borderRadius:7,fontSize:12,fontWeight:700,border:"none",background:mainTab===key?T.card:"transparent",color:mainTab===key?T.indigo:T.textMed,boxShadow:mainTab===key?"0 1px 4px rgba(0,0,0,0.08)":"none",transition:"all 0.15s"}}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        {selectedName&&(
          <div style={{display:"flex",alignItems:"center",gap:7,padding:"6px 13px",background:T.indigoL,border:`1px solid ${T.indigo}30`,borderRadius:20}}>
            <span style={{fontSize:12,color:T.indigo,fontWeight:700}}>🏢 {selectedName}</span>
            <button onClick={onClearCompany} style={{cursor:"pointer",background:"none",border:"none",color:T.indigo,fontSize:15,lineHeight:1,padding:0}}>×</button>
          </div>
        )}
        {USE_MOCK&&<span style={{fontSize:10,color:T.amber,padding:"3px 8px",border:`1px solid ${T.amber}44`,borderRadius:4,fontWeight:700}}>MOCK</span>}
        <span style={{fontSize:12,color:T.textSoft}}>{new Date().toLocaleDateString("fr-FR",{weekday:"short",day:"2-digit",month:"short",year:"numeric"})}</span>
      </div>
    </div>
  );
}

// ─── ONGLET DEVIS ─────────────────────────────────────────────────────────────
function TabDevis({offers,selectedCompany,onSelectCompany}){
  const navigate=useNavigate();
  const[periodFrom,setPeriodFrom]=useState("");
  const[periodTo,setPeriodTo]=useState("");
  const[search,setSearch]=useState("");
  const[filterStatuts,setFilterStatuts]=useState([]);
  const[dateFrom,setDateFrom]=useState("");
  const[dateTo,setDateTo]=useState("");
  const[sortBy,setSortBy]=useState("date_offre");
  const[sortDir,setSortDir]=useState("desc");
  const handleSort=k=>{if(sortBy===k)setSortDir(d=>d==="asc"?"desc":"asc");else{setSortBy(k);setSortDir("desc");}};

  const offersInPeriod=useMemo(()=>offers.filter(o=>inRange(o.date_offre,periodFrom,periodTo)),[offers,periodFrom,periodTo]);
  const filtered=useMemo(()=>{
    let rows=offers;
    if(search.trim()){const q=search.toLowerCase();rows=rows.filter(o=>o._project_attached?.name?.toLowerCase().includes(q)||o._project_attached?._company_attached?.name?.toLowerCase().includes(q)||o.offer_number?.toLowerCase().includes(q));}
    if(filterStatuts.length)rows=rows.filter(o=>filterStatuts.includes(o.os_devis_statut));
    if(dateFrom)rows=rows.filter(o=>o.date_offre&&o.date_offre>=dateFrom);
    if(dateTo)rows=rows.filter(o=>o.date_offre&&o.date_offre<=dateTo);
    if(selectedCompany)rows=rows.filter(o=>o._project_attached?._company_attached?.id===selectedCompany);
    return[...rows].sort((a,b)=>{
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
  const expirent=active.filter(o=>STATUTS_PIPELINE.includes(o.os_devis_statut)).map(o=>({...o,daysLeft:diffDays(o.date_validite)})).filter(o=>o.daysLeft!==null&&o.daysLeft<=7).sort((a,b)=>a.daysLeft-b.daysLeft);
  const totalFiltre=filtered.reduce((s,o)=>s+(o.montant_ht||0),0);
  const byClient={};
  active.forEach(o=>{const c=o._project_attached?._company_attached;if(!c)return;if(!byClient[c.id])byClient[c.id]={id:c.id,name:c.name,montant:0,count:0};byClient[c.id].montant+=o.montant_ht||0;byClient[c.id].count++;});
  const topClients=Object.values(byClient).sort((a,b)=>b.montant-a.montant).slice(0,6);
  const maxClient=topClients[0]?.montant||1;
  const byStatut=STATUT_DEVIS.map(s=>({s:s.length>13?s.slice(0,13)+"…":s,full:s,count:offersInPeriod.filter(o=>o.os_devis_statut===s).length,montant:offersInPeriod.filter(o=>o.os_devis_statut===s).reduce((sum,o)=>sum+(o.montant_ht||0),0)})).filter(d=>d.count>0);
  const hasPeriod=periodFrom||periodTo;
  const hasFilters=search||filterStatuts.length||dateFrom||dateTo||selectedCompany;

  return(
    <div>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18,padding:"10px 16px",background:T.card,border:`1px solid ${T.border}`,borderRadius:10,boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
        <span style={{fontSize:12,color:T.textMed,fontWeight:700}}>📅 Période KPIs</span>
        <DateRange dateFrom={periodFrom} dateTo={periodTo} onChange={(f,t)=>{setPeriodFrom(f);setPeriodTo(t);}}/>
        <span style={{fontSize:12,color:hasPeriod?T.indigo:T.textSoft}}>{hasPeriod?`${offersInPeriod.length} devis dans la période`:"Toutes les périodes"}</span>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:20}}>
        <KpiCard label="CA Signé"        value={fmt(caSigne)}    sub={`${signe.length} devis signés`}   color={T.sage}   pct={(caSigne/(caSigne+caPipeline+1))*100}/>
        <KpiCard label="CA Pipeline"     value={fmt(caPipeline)} sub={`${pipeline.length} en cours`}    color={T.indigo} pct={(caPipeline/(caSigne+caPipeline+1))*100}/>
        <KpiCard label="Taux conversion" value={`${tauxConv}%`}  sub={`sur ${active.length} actifs`}    color={T.violet} pct={tauxConv}/>
        <KpiCard label="Expirent ≤7j"    value={expirent.length} sub={expirent.length>0?"⚠ Action requise":"✓ Tout est ok"} color={expirent.length>0?T.rose:T.sage}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 340px",gap:14,marginBottom:20}}>
        <CardBox title="Répartition CA par statut" badge={<PeriodTag on={hasPeriod}/>}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byStatut} margin={{top:4,right:4,left:0,bottom:24}}>
              <XAxis dataKey="s" tick={{fontSize:9,fill:T.textSoft,fontFamily:"inherit"}} axisLine={false} tickLine={false} angle={-20} textAnchor="end"/>
              <YAxis tickFormatter={fmtK} tick={{fontSize:10,fill:T.textSoft,fontFamily:"inherit"}} axisLine={false} tickLine={false} width={46}/>
              <Tooltip contentStyle={{background:T.card,border:`1px solid ${T.border}`,borderRadius:8,fontSize:12,color:T.text}} formatter={(v,_,p)=>[fmt(v),`${p.payload.count} devis`]} labelFormatter={(_,p)=>p[0]?.payload?.full||""}/>
              <Bar dataKey="montant" radius={[5,5,0,0]}>{byStatut.map(e=><Cell key={e.full} fill={S_COLOR[e.full]||T.textSoft} opacity={0.85}/>)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardBox>
        <CardBox title="Top clients" badge={<PeriodTag on={hasPeriod}/>}>
          {topClients.map((c,i)=>(
            <div key={c.id} style={{marginBottom:10,cursor:"pointer"}} onClick={()=>onSelectCompany(selectedCompany===c.id?null:c.id)}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}>
                <span style={{color:selectedCompany===c.id?T.indigo:T.text,fontWeight:selectedCompany===c.id?700:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:170,cursor:"pointer"}}
                  onClick={e=>{e.stopPropagation();navigate(`/client/${c.id}`);}}>
                  {c.name}
                </span>
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
                const d=o.daysLeft;const col=d<=2?T.rose:T.amber;
                return(
                  <div key={o.id} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:`1px solid ${T.border}`}}>
                    <div style={{fontSize:11,color:T.textMed,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:180}}>{o._project_attached?._company_attached?.name} — {o._project_attached?.name}</div>
                    <div style={{fontSize:12,fontWeight:700,color:col,flexShrink:0}}>{d<=0?"Expiré":`J-${d}`}</div>
                  </div>
                );
              })}
            </div>
          )}
        </CardBox>
      </div>
      {/* Tableau */}
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden",boxShadow:"0 2px 6px rgba(0,0,0,0.04)"}}>
        <div style={{padding:"16px 20px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",background:T.cardAlt}}>
          <SearchBox value={search} onChange={setSearch} placeholder="Projet, entreprise, référence…"/>
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
            ?<div style={{padding:"40px 20px",textAlign:"center",color:T.textSoft,fontSize:13}}>Aucun résultat</div>
            :filtered.map((o,idx)=>{
              const d=diffDays(o.date_validite);
              const ec=d===null?T.textSoft:d<=0?T.rose:d<=3?T.amber:d<=7?T.amber:T.textSoft;
              const companyId=o._project_attached?._company_attached?.id;
              return(
                <div key={o.id} style={{display:"grid",gridTemplateColumns:"150px 1fr 150px 165px 105px 130px 72px",gap:8,padding:"11px 20px",borderBottom:`1px solid ${T.border}`,alignItems:"center",background:idx%2===0?T.card:T.cardAlt,transition:"background 0.1s"}}
                  onMouseEnter={e=>e.currentTarget.style.background=T.indigoL}
                  onMouseLeave={e=>e.currentTarget.style.background=idx%2===0?T.card:T.cardAlt}>
                  {/* Client cliquable → fiche client */}
                  <span onClick={()=>companyId&&navigate(`/client/${companyId}`)} style={{fontSize:12,color:T.indigo,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",cursor:companyId?"pointer":"default",textDecoration:companyId?"underline":"none"}}>
                    {o._project_attached?._company_attached?.name}
                  </span>
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
          <span style={{gridColumn:"1/5",fontSize:12,color:T.textMed}}>{hasFilters?`${filtered.length} devis filtrés`:""}</span>
          <span style={{fontSize:15,fontWeight:800,color:T.indigo,textAlign:"right"}}>{fmt(totalFiltre)}</span>
          <span/><span/>
        </div>
      </div>
    </div>
  );
}

// ─── ONGLET INTERVENTIONS ─────────────────────────────────────────────────────
function TabInterventions({interventions,projects,selectedCompany,onSelectCompany}){
  const navigate=useNavigate();
  const[periodFrom,setPeriodFrom]=useState("");
  const[periodTo,setPeriodTo]=useState("");
  const[search,setSearch]=useState("");
  const[filterStatuts,setFilterStatuts]=useState([]);
  const[filterTypes,setFilterTypes]=useState([]);
  const[dateFrom,setDateFrom]=useState("");
  const[dateTo,setDateTo]=useState("");
  const[sortBy,setSortBy]=useState("date");
  const[sortDir,setSortDir]=useState("desc");
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
    return[...rows].sort((a,b)=>{
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

  return(
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
        <CardBox title="Types de prestations" badge={<PeriodTag on={hasPeriod}/>}>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <ResponsiveContainer width={130} height={130}>
              <PieChart><Pie data={typeData} cx="50%" cy="50%" innerRadius={36} outerRadius={60} dataKey="value" paddingAngle={3}>
                {typeData.map((_,i)=><Cell key={i} fill={CHART_COLORS[i%CHART_COLORS.length]}/>)}
              </Pie><Tooltip contentStyle={{background:T.card,border:`1px solid ${T.border}`,fontSize:12}}/></PieChart>
            </ResponsiveContainer>
            <div style={{flex:1}}>
              {typeData.map((t,i)=>(
                <div key={t.name} style={{display:"flex",alignItems:"center",gap:7,marginBottom:8,cursor:"pointer"}} onClick={()=>setFilterTypes(filterTypes.includes(t.name)?filterTypes.filter(x=>x!==t.name):[...filterTypes,t.name])}>
                  <div style={{width:9,height:9,borderRadius:2,background:CHART_COLORS[i%CHART_COLORS.length],flexShrink:0}}/>
                  <span style={{fontSize:12,color:filterTypes.includes(t.name)?T.text:T.textMed,flex:1,fontWeight:filterTypes.includes(t.name)?600:400}}>{t.name}</span>
                  <span style={{fontSize:12,fontWeight:700,color:CHART_COLORS[i%CHART_COLORS.length]}}>{t.value}</span>
                </div>
              ))}
            </div>
          </div>
        </CardBox>
        <CardBox title="Activité mensuelle" badge={<PeriodTag on={hasPeriod}/>}>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={monthData} margin={{top:4,right:4,left:0,bottom:4}}>
              <XAxis dataKey="mois" tick={{fontSize:10,fill:T.textSoft,fontFamily:"inherit"}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:10,fill:T.textSoft,fontFamily:"inherit"}} axisLine={false} tickLine={false} width={22} allowDecimals={false}/>
              <Tooltip contentStyle={{background:T.card,border:`1px solid ${T.border}`,fontSize:12}}/>
              <Bar dataKey="count" name="Interventions" fill={T.teal} radius={[4,4,0,0]} opacity={0.85}/>
            </BarChart>
          </ResponsiveContainer>
        </CardBox>
        <CardBox title="Zones d'activité">
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
                  <span onClick={e=>{e.stopPropagation();navigate(`/client/${c.id}`);}} style={{color:selectedCompany===c.id?T.indigo:T.text,fontWeight:selectedCompany===c.id?700:500,cursor:"pointer"}}>{c.name}</span>
                  <span style={{color:T.textSoft}}>{c.count}</span>
                </div>
                <div style={{height:4,background:T.border,borderRadius:2}}>
                  <div style={{height:4,background:selectedCompany===c.id?T.indigo:i===0?T.sage:T.border,width:`${(c.count/maxClientI)*100}%`,borderRadius:2}}/>
                </div>
              </div>
            ))}
          </div>
        </CardBox>
      </div>
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden",boxShadow:"0 2px 6px rgba(0,0,0,0.04)"}}>
        <div style={{padding:"16px 20px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",background:T.cardAlt}}>
          <SearchBox value={search} onChange={setSearch} placeholder="Intervention, projet, entreprise…"/>
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
            ?<div style={{padding:"40px 20px",textAlign:"center",color:T.textSoft,fontSize:13}}>Aucun résultat</div>
            :filtered.map((i,idx)=>{
              const companyId=i._project_attached?._company_attached?.id;
              return(
                <div key={i.id} style={{display:"grid",gridTemplateColumns:"150px 180px 1fr 140px 95px 120px",gap:8,padding:"11px 20px",borderBottom:`1px solid ${T.border}`,alignItems:"center",background:idx%2===0?T.card:T.cardAlt,transition:"background 0.1s"}}
                  onMouseEnter={e=>e.currentTarget.style.background=T.indigoL}
                  onMouseLeave={e=>e.currentTarget.style.background=idx%2===0?T.card:T.cardAlt}>
                  <span onClick={()=>companyId&&navigate(`/client/${companyId}`)} style={{fontSize:12,color:T.indigo,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",cursor:companyId?"pointer":"default",textDecoration:companyId?"underline":"none"}}>
                    {i._project_attached?._company_attached?.name}
                  </span>
                  <span style={{fontSize:12,color:T.textMed,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{i._project_attached?.name}</span>
                  <span style={{fontSize:12,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{i.name}</span>
                  <span style={{fontSize:11,color:T.textMed,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{i.OS_prestations_type}</span>
                  <span style={{fontSize:12,color:T.textMed}}>{fmtDate(i.date)}</span>
                  <Badge label={i.intervention_status||"—"}/>
                </div>
              );
            })
          }
        </div>
        <div style={{padding:"10px 20px",fontSize:12,color:T.textSoft,borderTop:`1px solid ${T.border}`,background:T.cardAlt}}>
          {filtered.length} intervention{filtered.length>1?"s":""} affichée{filtered.length>1?"s":""}
        </div>
      </div>
    </div>
  );
}

// ─── PAGE DASHBOARD ───────────────────────────────────────────────────────────
function PageDashboard({mainTab,setMainTab}){
  const[dashTab,setDashTab]=useState("devis");
  const[data,setData]=useState(null);
  const[loading,setLoading]=useState(true);
  const[selectedCompany,setSelectedCompany]=useState(null);
  useEffect(()=>{fetchAll().then(d=>{setData(d);setLoading(false);});},[]);
  const selectedName=useMemo(()=>{
    if(!selectedCompany||!data)return null;
    return[...data.offers.map(o=>o._project_attached?._company_attached),...data.interventions.map(i=>i._project_attached?._company_attached)].find(c=>c?.id===selectedCompany)?.name;
  },[selectedCompany,data]);

  if(loading)return(
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"calc(100vh - 60px)"}}>
      <div style={{textAlign:"center"}}>
        <div style={{width:48,height:48,background:`linear-gradient(135deg,${T.indigo},${T.teal})`,borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",boxShadow:`0 8px 24px ${T.indigo}44`}}>
          <span style={{fontSize:22,fontWeight:900,color:"#fff"}}>Q</span>
        </div>
        <div style={{fontSize:13,color:T.textSoft}}>Chargement des données…</div>
      </div>
    </div>
  );

  return(
    <div>
      <Navbar mainTab={mainTab} setMainTab={setMainTab} selectedName={selectedName} onClearCompany={()=>setSelectedCompany(null)}/>
      {/* Sous-onglets dashboard */}
      <div style={{background:T.card,borderBottom:`1px solid ${T.border}`,padding:"0 28px",display:"flex",gap:3}}>
        {[["devis","📋 Devis"],["interventions","🔧 Interventions"]].map(([key,label])=>(
          <button key={key} onClick={()=>setDashTab(key)} style={{cursor:"pointer",padding:"12px 20px",fontSize:12,fontWeight:700,border:"none",background:"transparent",color:dashTab===key?T.indigo:T.textMed,borderBottom:dashTab===key?`2px solid ${T.indigo}`:"2px solid transparent",transition:"all 0.15s",marginBottom:-1}}>
            {label}
          </button>
        ))}
      </div>
      <div style={{padding:"24px 28px",maxWidth:1440,margin:"0 auto"}}>
        {dashTab==="devis"
          ?<TabDevis offers={data.offers} selectedCompany={selectedCompany} onSelectCompany={setSelectedCompany}/>
          :<TabInterventions interventions={data.interventions} projects={data.projects} selectedCompany={selectedCompany} onSelectCompany={setSelectedCompany}/>
        }
      </div>
      <div style={{padding:"14px 28px",fontSize:11,color:T.textSoft,textAlign:"center",borderTop:`1px solid ${T.border}`,background:T.card}}>
        Qualidal · Dashboard Commercial & Opérationnel · {USE_MOCK?"Données de démonstration":"Bubble Live"}
      </div>
    </div>
  );
}

// ─── PAGE LISTE CLIENTS ───────────────────────────────────────────────────────
function PageClients({mainTab,setMainTab}){
  const navigate=useNavigate();
  const[search,setSearch]=useState("");
  const[data,setData]=useState(null);
  const[loading,setLoading]=useState(true);
  useEffect(()=>{
    if(USE_MOCK){
      const companies=MOCK_COMPANIES.map(c=>{
        const projets=MOCK_PROJECTS.filter(p=>p._company_attached===c._id);
        const pIds=projets.map(p=>p._id);
        const ca=MOCK_OFFERS.filter(o=>pIds.includes(o._project_attached)&&o.is_active).reduce((s,o)=>s+(o.montant_ht||0),0);
        const intervs=MOCK_INTERVENTIONS.filter(i=>pIds.includes(i._project_attached));
        const lastInterv=intervs.filter(i=>i.intervention_status==="Terminé").sort((a,b)=>new Date(b.date)-new Date(a.date))[0];
        const activeStatut=projets.find(p=>["Devis signé","Chiffrage en cours","Devis envoyé"].includes(p.OS_devis_status))?.OS_devis_status;
        return{...c,nb_projets:projets.length,ca_total:ca,derniere_interv:lastInterv?.date||null,statut_actif:activeStatut||null};
      });
      setData(companies);setLoading(false);
    } else {
      Promise.all([fetchAllPages("companies"),fetchAllPages("projects"),fetchAllPages("offers_history_documents"),fetchAllPages("interventions")])
        .then(([rawC,rawP,rawO,rawI])=>{
          const companies=rawC.map(c=>{
            const projets=rawP.filter(p=>p._company_attached===c._id);
            const pIds=projets.map(p=>p._id);
            const ca=rawO.filter(o=>pIds.includes(o._project_attached)&&o.is_active!==false).reduce((s,o)=>s+(o.montant_ht||0),0);
            const intervs=rawI.filter(i=>pIds.includes(i._project_attached));
            const lastInterv=intervs.filter(i=>(i.intervention_status||"")==="Terminé").sort((a,b)=>new Date(b.date)-new Date(a.date))[0];
            const activeStatut=projets.find(p=>p.OS_devis_status)?.OS_devis_status;
            return{...c,id:c._id,nb_projets:projets.length,ca_total:ca,derniere_interv:lastInterv?.date||null,statut_actif:activeStatut||null};
          });
          setData(companies);setLoading(false);
        });
    }
  },[]);
  const filtered=useMemo(()=>{
    if(!data)return[];
    const q=search.toLowerCase();
    return data.filter(c=>!q||c.name?.toLowerCase().includes(q)||c.address?.toLowerCase().includes(q));
  },[data,search]);

  return(
    <div style={{background:T.bg,minHeight:"100vh"}}>
      <Navbar mainTab={mainTab} setMainTab={setMainTab}/>
      <div style={{padding:"24px 28px",maxWidth:1400,margin:"0 auto"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
          <div>
            <div style={{fontSize:22,fontWeight:800,color:T.text}}>Clients</div>
            <div style={{fontSize:13,color:T.textSoft,marginTop:3}}>{data?.length||0} entreprises</div>
          </div>
        </div>
        <div style={{marginBottom:16}}>
          <SearchBox value={search} onChange={setSearch} placeholder="Rechercher un client, une adresse…" width="100%"/>
        </div>
        {loading
          ?<div style={{textAlign:"center",padding:60,color:T.textSoft}}>Chargement…</div>
          :(
          <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden",boxShadow:"0 2px 6px rgba(0,0,0,0.04)"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 110px 130px 130px 160px 36px",gap:12,padding:"11px 20px",background:T.cardAlt,borderBottom:`2px solid ${T.border}`}}>
              {["Entreprise","Projets","CA Total","Dernière interv.","Statut actif",""].map((h,i)=>(
                <span key={i} style={{fontSize:11,fontWeight:700,color:T.textSoft,letterSpacing:"0.06em",textTransform:"uppercase"}}>{h}</span>
              ))}
            </div>
            {filtered.length===0
              ?<div style={{padding:"40px 20px",textAlign:"center",color:T.textSoft}}>Aucun client trouvé</div>
              :filtered.map((c,idx)=>(
                <div key={c._id} onClick={()=>navigate(`/client/${c._id}`)}
                  style={{display:"grid",gridTemplateColumns:"1fr 110px 130px 130px 160px 36px",gap:12,padding:"13px 20px",borderBottom:idx<filtered.length-1?`1px solid ${T.border}`:"none",alignItems:"center",cursor:"pointer",background:idx%2===0?T.card:T.cardAlt,transition:"background 0.1s"}}
                  onMouseEnter={e=>e.currentTarget.style.background=T.indigoL}
                  onMouseLeave={e=>e.currentTarget.style.background=idx%2===0?T.card:T.cardAlt}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:36,height:36,borderRadius:9,background:`${T.indigo}18`,border:`1px solid ${T.indigo}25`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      <span style={{fontSize:15,fontWeight:800,color:T.indigo}}>{c.name?.charAt(0)}</span>
                    </div>
                    <div>
                      <div style={{fontSize:13,fontWeight:700,color:T.text}}>{c.name}</div>
                      <div style={{fontSize:11,color:T.textSoft,marginTop:1}}>{c.address}</div>
                    </div>
                  </div>
                  <span style={{fontSize:13,fontWeight:700,color:T.teal,textAlign:"center"}}>{c.nb_projets}</span>
                  <span style={{fontSize:13,fontWeight:700,color:T.indigo}}>{fmt(c.ca_total)}</span>
                  <span style={{fontSize:12,color:T.textMed}}>{fmtDate(c.derniere_interv)}</span>
                  <div>{c.statut_actif?<Badge label={c.statut_actif}/>:<span style={{color:T.textSoft,fontSize:12}}>—</span>}</div>
                  <span style={{color:T.textSoft,fontSize:16,textAlign:"right"}}>›</span>
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
function ProjetAccordeon({projet,interventions}){
  const[open,setOpen]=useState(false);
  const projInterv=interventions.filter(i=>i._project_attached===projet._id||i._project_attached?._id===projet._id||i._project_attached?.id===projet._id);
  return(
    <div style={{border:`1px solid ${T.border}`,borderRadius:10,overflow:"hidden",marginBottom:10}}>
      <div onClick={()=>setOpen(o=>!o)} style={{display:"grid",gridTemplateColumns:"1fr 165px 110px 32px",gap:12,padding:"13px 16px",alignItems:"center",cursor:"pointer",background:open?T.indigoL:T.card,transition:"background 0.15s"}}
        onMouseEnter={e=>{if(!open)e.currentTarget.style.background=T.cardAlt;}}
        onMouseLeave={e=>{if(!open)e.currentTarget.style.background=T.card;}}>
        <div>
          <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:2}}>{projet.name}</div>
          <div style={{fontSize:11,color:T.textSoft}}>{projet.OS_prestations_type}</div>
        </div>
        <Badge label={projet.OS_devis_status}/>
        <span style={{fontSize:11,color:T.textSoft}}>{projInterv.length} intervention{projInterv.length>1?"s":""}</span>
        <span style={{color:T.textSoft,fontSize:13}}>{open?"▲":"▼"}</span>
      </div>
      {open&&(
        <div style={{background:T.bg,borderTop:`1px solid ${T.border}`}}>
          {projInterv.length===0
            ?<div style={{padding:"16px 20px",fontSize:12,color:T.textSoft,textAlign:"center"}}>Aucune intervention</div>
            :projInterv.map((interv,idx)=>{
              const d=diffDays(interv.date);
              const dc=interv.intervention_status==="Planifié"?(d<=7?T.rose:T.violet):T.textSoft;
              return(
                <div key={interv._id||interv.id} style={{display:"grid",gridTemplateColumns:"10px 1fr 110px 130px 1fr 160px",gap:10,padding:"11px 16px",borderBottom:idx<projInterv.length-1?`1px solid ${T.border}`:"none",alignItems:"center",background:idx%2===0?T.card:T.cardAlt}}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:S_COLOR[interv.intervention_status]||T.textSoft}}/>
                  <span style={{fontSize:12,fontWeight:600,color:T.text}}>{interv.name}</span>
                  <Badge label={interv.intervention_status}/>
                  <span style={{fontSize:11,color:dc,fontWeight:interv.intervention_status==="Planifié"?700:400}}>
                    {fmtDate(interv.date)}{interv.intervention_status==="Planifié"&&d!==null?` (J-${d})`:""}</span>
                  <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                    {(interv.agents||[]).map(a=><span key={a} style={{fontSize:10,padding:"2px 7px",borderRadius:20,background:T.tealL,color:T.teal,fontWeight:600}}>{a}</span>)}
                  </div>
                  <span style={{fontSize:11,color:T.textMed}}><span style={{color:T.textSoft}}>Rapport : </span>{interv.rapport||"—"}</span>
                </div>
              );
            })
          }
        </div>
      )}
    </div>
  );
}

function ModalContact({onClose,onSave}){
  const[form,setForm]=useState({date:new Date().toISOString().slice(0,10),type:"Appel",auteur:"",note:""});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const inp={width:"100%",padding:"8px 12px",border:`1.5px solid ${T.border}`,borderRadius:8,color:T.text,fontSize:13,fontFamily:"inherit",outline:"none",background:T.bg};
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(26,38,64,0.45)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={onClose}>
      <div style={{background:T.card,borderRadius:14,padding:28,width:480,boxShadow:"0 24px 48px rgba(0,0,0,0.15)"}} onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:15,fontWeight:800,color:T.text,marginBottom:20}}>Nouveau contact client</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
          <div><label style={{fontSize:11,color:T.textSoft,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",display:"block",marginBottom:6}}>Date</label><input type="date" value={form.date} onChange={e=>set("date",e.target.value)} style={inp}/></div>
          <div><label style={{fontSize:11,color:T.textSoft,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",display:"block",marginBottom:6}}>Type</label>
            <select value={form.type} onChange={e=>set("type",e.target.value)} style={inp}>{["Appel","Email","Réunion","Note"].map(t=><option key={t}>{t}</option>)}</select></div>
        </div>
        <div style={{marginBottom:14}}><label style={{fontSize:11,color:T.textSoft,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",display:"block",marginBottom:6}}>Auteur</label><input value={form.auteur} onChange={e=>set("auteur",e.target.value)} placeholder="Initiales ou nom…" style={inp}/></div>
        <div style={{marginBottom:20}}><label style={{fontSize:11,color:T.textSoft,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",display:"block",marginBottom:6}}>Note</label><textarea value={form.note} onChange={e=>set("note",e.target.value)} placeholder="Résumé de l'échange…" rows={4} style={{...inp,resize:"vertical",lineHeight:1.5}}/></div>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <button onClick={onClose} style={{padding:"8px 18px",borderRadius:8,border:`1px solid ${T.border}`,background:T.card,color:T.textMed,fontSize:13,fontWeight:600,cursor:"pointer"}}>Annuler</button>
          <button onClick={()=>{onSave(form);onClose();}} style={{padding:"8px 18px",borderRadius:8,border:"none",background:`linear-gradient(135deg,${T.indigo},${T.teal})`,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>Enregistrer</button>
        </div>
      </div>
    </div>
  );
}

function PageFicheClient({mainTab,setMainTab}){
  const{id}=useParams();
  const navigate=useNavigate();
  const[client,setClient]=useState(null);
  const[contacts,setContacts]=useState([]);
  const[projets,setProjets]=useState([]);
  const[interventions,setInterventions]=useState([]);
  const[historique,setHistorique]=useState([]);
  const[caTotal,setCaTotal]=useState(0);
  const[loading,setLoading]=useState(true);
  const[activeTab,setActiveTab]=useState("projets");
  const[showModal,setShowModal]=useState(false);

  useEffect(()=>{
    if(USE_MOCK){
      const c=MOCK_COMPANIES.find(c=>c._id===id)||MOCK_COMPANIES[0];
      const p=MOCK_PROJECTS.filter(p=>p._company_attached===c._id);
      const pIds=p.map(x=>x._id);
      const ca=MOCK_OFFERS.filter(o=>pIds.includes(o._project_attached)&&o.is_active).reduce((s,o)=>s+(o.montant_ht||0),0);
      const i=MOCK_INTERVENTIONS.filter(i=>pIds.includes(i._project_attached));
      setClient(c);setProjets(p);setInterventions(i);setCaTotal(ca);
      setContacts(MOCK_CONTACTS[id]||[]);setHistorique(MOCK_HISTORIQUE[id]||[]);setLoading(false);
    }
  },[id]);

  if(loading)return<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",fontFamily:"Nunito,sans-serif",color:T.textSoft}}>Chargement…</div>;
  if(!client)return<div style={{padding:40,fontFamily:"Nunito,sans-serif"}}>Client introuvable</div>;
  const nbPlanifiees=interventions.filter(i=>i.intervention_status==="Planifié").length;
  const caByProjet=projets.map(p=>({name:p.name.split(" ")[0],ca:MOCK_OFFERS.filter(o=>o._project_attached===p._id).reduce((s,o)=>s+(o.montant_ht||0),0)}));

  return(
    <div style={{background:T.bg,minHeight:"100vh"}}>
      <Navbar mainTab={mainTab} setMainTab={setMainTab}/>
      {/* Breadcrumb */}
      <div style={{background:T.card,borderBottom:`1px solid ${T.border}`,padding:"10px 28px",display:"flex",alignItems:"center",gap:8}}>
        <span onClick={()=>navigate("/clients")} style={{fontSize:12,color:T.textSoft,cursor:"pointer",fontWeight:600}}>← Clients</span>
        <span style={{color:T.border,fontSize:16}}>›</span>
        <span style={{fontSize:12,fontWeight:700,color:T.text}}>{client.name}</span>
      </div>
      <div style={{padding:"24px 28px",maxWidth:1400,margin:"0 auto"}}>
        {/* HERO */}
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"22px 26px",marginBottom:20,boxShadow:"0 2px 8px rgba(0,0,0,0.05)",borderLeft:`5px solid ${T.indigo}`}}>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:16}}>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
                <div style={{width:48,height:48,background:`${T.indigo}18`,border:`2px solid ${T.indigo}30`,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <span style={{fontSize:20,fontWeight:900,color:T.indigo}}>{client.name?.charAt(0)}</span>
                </div>
                <div>
                  <div style={{fontSize:22,fontWeight:800,color:T.text}}>{client.name}</div>
                  <div style={{fontSize:12,color:T.textSoft,marginTop:2}}>Client depuis {fmtDate(client["Created Date"]||client.created)}</div>
                </div>
              </div>
              <div style={{display:"flex",gap:20,flexWrap:"wrap"}}>
                {client.address&&<span style={{fontSize:12,color:T.textMed}}>📍 {client.address}</span>}
                {client.phone&&<span style={{fontSize:12,color:T.textMed}}>📞 {client.phone}</span>}
                {client.email&&<span style={{fontSize:12,color:T.textMed}}>✉️ {client.email}</span>}
              </div>
            </div>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              {[["CA Total",fmt(caTotal),T.indigo],["Projets",projets.length,T.teal],["Interventions",interventions.length,T.sage],["Planifiées",nbPlanifiees,T.violet]].map(([l,v,c])=>(
                <div key={l} style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"12px 18px",background:`${c}12`,borderRadius:10,border:`1px solid ${c}25`,minWidth:110}}>
                  <span style={{fontSize:20,fontWeight:800,color:c}}>{v}</span>
                  <span style={{fontSize:10,color:T.textSoft,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em",marginTop:4}}>{l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* GRILLE */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 300px",gap:20}}>
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            {/* Onglets */}
            <div style={{display:"flex",gap:3,background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:4,width:"fit-content"}}>
              {[["projets","📁 Projets"],["contacts","👥 Contacts"],["historique","📋 Historique"]].map(([key,label])=>(
                <button key={key} onClick={()=>setActiveTab(key)} style={{cursor:"pointer",padding:"7px 16px",borderRadius:7,fontSize:12,fontWeight:700,border:"none",background:activeTab===key?T.card:"transparent",color:activeTab===key?T.indigo:T.textMed,boxShadow:activeTab===key?"0 1px 4px rgba(0,0,0,0.08)":"none",transition:"all 0.15s"}}>
                  {label}
                </button>
              ))}
            </div>
            {activeTab==="projets"&&projets.map(p=><ProjetAccordeon key={p._id} projet={p} interventions={interventions}/>)}
            {activeTab==="contacts"&&(
              <CardBox title="Contacts de l'entreprise" accent={T.teal}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  {contacts.length===0?<span style={{color:T.textSoft,fontSize:13}}>Aucun contact</span>
                    :contacts.map(ct=>{
                    const c=TYPE_CONTACT_COLOR[ct.type_contact]||T.textSoft;
                    return(
                      <div key={ct._id} style={{padding:"14px 16px",borderRadius:10,border:`1px solid ${c}25`,background:`${c}08`}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                          <div style={{width:34,height:34,borderRadius:10,background:`${c}18`,border:`1px solid ${c}30`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                            <span style={{fontSize:14,fontWeight:800,color:c}}>{ct.name?.charAt(0)}</span>
                          </div>
                          <Badge label={ct.type_contact} color={c}/>
                        </div>
                        <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:4}}>{ct.name}</div>
                        {ct.email&&<div style={{fontSize:11,color:T.textSoft,marginBottom:2}}>✉️ {ct.email}</div>}
                        {ct.phone&&<div style={{fontSize:11,color:T.textSoft}}>📞 {ct.phone}</div>}
                      </div>
                    );
                  })}
                </div>
              </CardBox>
            )}
            {activeTab==="historique"&&(
              <CardBox title="Historique des contacts" accent={T.violet}
                badge={<button onClick={()=>setShowModal(true)} style={{cursor:"pointer",padding:"6px 14px",borderRadius:8,border:"none",background:`linear-gradient(135deg,${T.indigo},${T.teal})`,color:"#fff",fontSize:12,fontWeight:700}}>+ Ajouter</button>}>
                <div style={{position:"relative",paddingLeft:8}}>
                  <div style={{position:"absolute",left:16,top:0,bottom:0,width:2,background:T.border,borderRadius:1}}/>
                  {historique.length===0&&<div style={{padding:"20px 0",color:T.textSoft,fontSize:13}}>Aucun historique</div>}
                  {historique.map((h,idx)=>{
                    const c=HISTORIQUE_COLOR[h.type]||T.textSoft;
                    return(
                      <div key={h._id||idx} style={{display:"flex",gap:16,marginBottom:idx<historique.length-1?20:0,position:"relative"}}>
                        <div style={{width:32,height:32,borderRadius:"50%",background:`${c}15`,border:`2px solid ${c}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,zIndex:1}}>
                          <span style={{fontSize:12}}>{h.type==="Appel"?"📞":h.type==="Email"?"✉️":h.type==="Réunion"?"🤝":"📝"}</span>
                        </div>
                        <div style={{flex:1,paddingTop:2}}>
                          <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                            <div style={{display:"flex",gap:8,alignItems:"center"}}>
                              <Badge label={h.type} color={c}/>
                              <span style={{fontSize:11,color:T.textSoft,fontWeight:600}}>{h.auteur}</span>
                            </div>
                            <span style={{fontSize:11,color:T.textSoft}}>{fmtDate(h.date)}</span>
                          </div>
                          <div style={{fontSize:13,color:T.textMed,lineHeight:1.5,padding:"10px 14px",background:T.cardAlt,borderRadius:8,border:`1px solid ${T.border}`}}>{h.note}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardBox>
            )}
          </div>
          {/* SIDEBAR */}
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <CardBox title="CA par projet" accent={T.sage}>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={caByProjet} margin={{top:4,right:4,left:0,bottom:4}}>
                  <XAxis dataKey="name" tick={{fontSize:10,fill:T.textSoft,fontFamily:"inherit"}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fontSize:10,fill:T.textSoft,fontFamily:"inherit"}} axisLine={false} tickLine={false} width={40} tickFormatter={n=>n>=1000?`${(n/1000).toFixed(0)}k`:n}/>
                  <Tooltip contentStyle={{background:T.card,border:`1px solid ${T.border}`,borderRadius:8,fontSize:12}} formatter={v=>[fmt(v),"CA"]}/>
                  <Bar dataKey="ca" radius={[5,5,0,0]}>{caByProjet.map((_,i)=><Cell key={i} fill={[T.indigo,T.teal,T.sage,T.amber,T.violet][i%5]} opacity={0.85}/>)}</Bar>
                </BarChart>
              </ResponsiveContainer>
              <div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between"}}>
                <span style={{fontSize:11,color:T.textSoft,fontWeight:700,textTransform:"uppercase"}}>Total</span>
                <span style={{fontSize:15,fontWeight:800,color:T.indigo}}>{fmt(caTotal)}</span>
              </div>
            </CardBox>
            <CardBox title="Prochaines interventions" accent={T.violet}>
              {interventions.filter(i=>i.intervention_status==="Planifié").sort((a,b)=>new Date(a.date)-new Date(b.date)).length===0
                ?<div style={{fontSize:12,color:T.textSoft,textAlign:"center",padding:"12px 0"}}>Aucune planifiée</div>
                :interventions.filter(i=>i.intervention_status==="Planifié").sort((a,b)=>new Date(a.date)-new Date(b.date)).map((i,idx,arr)=>{
                  const d=diffDays(i.date);
                  const dc=d<=3?T.rose:d<=7?T.amber:T.violet;
                  return(
                    <div key={i._id||i.id} style={{paddingBottom:10,marginBottom:idx<arr.length-1?10:0,borderBottom:idx<arr.length-1?`1px solid ${T.border}`:"none"}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                        <span style={{fontSize:12,fontWeight:700,color:T.text}}>{i.name}</span>
                        <span style={{fontSize:11,fontWeight:700,color:dc}}>J-{d}</span>
                      </div>
                      <div style={{fontSize:11,color:T.textSoft,marginBottom:4}}>{fmtDate(i.date)}</div>
                      <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                        {(i.agents||[]).map(a=><span key={a} style={{fontSize:10,padding:"2px 7px",borderRadius:20,background:T.tealL,color:T.teal,fontWeight:600}}>{a}</span>)}
                      </div>
                    </div>
                  );
                })
              }
            </CardBox>
            <CardBox title="Contacts" accent={T.teal}>
              {contacts.filter(c=>["Principal","Secondaire"].includes(c.type_contact)).map(ct=>{
                const c=TYPE_CONTACT_COLOR[ct.type_contact]||T.textSoft;
                return(
                  <div key={ct._id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                    <div style={{width:32,height:32,borderRadius:8,background:`${c}18`,border:`1px solid ${c}25`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      <span style={{fontSize:13,fontWeight:800,color:c}}>{ct.name?.charAt(0)}</span>
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:12,fontWeight:700,color:T.text}}>{ct.name}</div>
                      <div style={{fontSize:11,color:T.textSoft}}>{ct.email}</div>
                    </div>
                    <Badge label={ct.type_contact} color={c}/>
                  </div>
                );
              })}
            </CardBox>
          </div>
        </div>
      </div>
      <div style={{padding:"14px 28px",fontSize:11,color:T.textSoft,textAlign:"center",borderTop:`1px solid ${T.border}`,background:T.card,marginTop:24}}>
        Qualidal · Fiche Client · {USE_MOCK?"Données de démonstration":"Bubble Live"}
      </div>
      {showModal&&<ModalContact onClose={()=>setShowModal(false)} onSave={entry=>setHistorique(h=>[{_id:`h${Date.now()}`,...entry},...h])}/>}
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App(){
  const[mainTab,setMainTab]=useState("dashboard");
  return(
    <BrowserRouter>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'Nunito','Segoe UI',sans-serif;background:${T.bg};}
        ::-webkit-scrollbar{width:5px;height:5px;}
        ::-webkit-scrollbar-track{background:${T.bg};}
        ::-webkit-scrollbar-thumb{background:${T.borderMd};border-radius:3px;}
        input[type="date"]::-webkit-calendar-picker-indicator{opacity:0.5;cursor:pointer;}
        input::placeholder{color:${T.textSoft};}
        select,input,textarea{font-family:'Nunito','Segoe UI',sans-serif;}
      `}</style>
      <Routes>
        <Route path="/"           element={<PageDashboard mainTab={mainTab} setMainTab={setMainTab}/>}/>
        <Route path="/clients"    element={<PageClients   mainTab={mainTab} setMainTab={setMainTab}/>}/>
        <Route path="/client/:id" element={<PageFicheClient mainTab={mainTab} setMainTab={setMainTab}/>}/>
      </Routes>
    </BrowserRouter>
  );
}
