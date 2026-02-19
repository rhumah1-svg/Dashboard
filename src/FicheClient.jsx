import { useState, useEffect, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
// Passer à false pour brancher Bubble
const USE_MOCK    = false;
const DASH_SECRET = "qd_x9k2m7p4nz3";
// URL Bubble : version-test → sera automatiquement la live quand déployé
// car le proxy /api/bubble dans vite.config pointe vers portail-qualidal.com
// ── Pour passer en live : changer /version-test/api → /api dans vite.config ──

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
  "Saisie d'information":T.textSoft, "Chiffrage en cours":T.sky,
  "Validé par l'administration":T.violet, "Devis envoyé":T.indigo,
  "Devis signé":T.sage, "Projet terminé":"#2E7A4E",
  "A relancer":T.amber, "Relance envoyée":T.coral,
  "Classé sans suite":T.rose, "Non formalisé":T.textSoft,
  "Planifié":T.violet, "En cours":T.amber, "Terminé":T.sage, "Annulé":T.rose,
};

// ── OS_contact_type options (Bubble option set) ──────────────────────────────
// Valeurs exactes : Principal / À mettre en copie / Contact sur site / Facturation / Autre - À préciser
const TYPE_CONTACT_COLOR = {
  "Principal":          T.indigo,
  "À mettre en copie":  T.amber,
  "Contact sur site":   T.teal,
  "Facturation":        T.violet,
  "Autre - À préciser": T.textSoft,
  // Anciens labels mock (rétrocompat)
  "Secondaire":T.teal, "Mise en copie":T.amber, "Compta":T.violet,
};

const HISTORIQUE_COLOR = { Appel:T.sage, Email:T.indigo, Réunion:T.violet, Note:T.amber };

// ════════════════════════════════════════════════════════════════════════════════
// ██ LIAISONS BUBBLE — MODIFIE ICI POUR CHANGER LES SOURCES DE DONNÉES ██
// ════════════════════════════════════════════════════════════════════════════════
//
// [1] CLIENT (table: Companies)
//     Champ nom       → company.name
//     Champ adresse   → company.address  (si tu ajoutes ce champ dans Bubble)
//     Champ tel       → company.phone    (si tu ajoutes ce champ dans Bubble)
//     Champ email     → company.email    (si tu ajoutes ce champ dans Bubble)
//     Champ siret     → company.siret    (si tu ajoutes ce champ dans Bubble)
//     Champ créé le   → company["Created Date"]
//
// [2] PROJETS (table: Projects)
//     Liaison client  → project._company_attached === company._id
//     Champ nom       → project.name
//     Champ statut    → project.OS_devis_status
//     Champ type      → project.OS_prestations_type
//     Champ code      → project.project_code
//
// [3] DEVIS (table: Offers_history_documents)
//     Liaison projet  → offer._project_attached === project._id
//     Champ numéro    → offer.offer_number  (ex: devis_de00001898)
//     Champ statut    → offer.os_devis_statut
//     Champ date      → offer.date_offre
//     Champ validité  → offer.date_validite
//     Champ montant   → calculé depuis Items_devis (sum Total_HT)
//     Champ actif     → offer.is_active
//
// [4] INTERVENTIONS (table: interventions)
//     Liaison projet  → intervention._project_attached === project._id
//     Champ nom       → intervention.name
//     Champ statut    → intervention.intervention_status
//     Champ date      → intervention.date
//     Champ type      → intervention.OS_prestations_type
//
// [5] CONTACTS PROJET (table: Contact_projet)
//     Liaison projet  → contact_projet.projet_contact_attache === project._id
//     Champ contact   → contact_projet.contact_projet_attache (lien vers Contacts)
//     Champ rôle      → contact_projet.role_contact_projet
//     Champ email     → contact_projet.email
//     Champ nom       → contact_projet.Nom
//
// [6] CONTACTS ENTREPRISE (table: Contacts — contacts généraux de la société)
//     Liaison client  → à définir selon ton modèle Bubble
//     (actuellement mockés dans MOCK_CONTACTS, rattachés à la company)
//
// ════════════════════════════════════════════════════════════════════════════════

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
// [1] CLIENT — source: table Companies
const MOCK_CLIENT = {
  id:"c1", name:"IDEC Construction",
  address:"14 rue de la République, 75001 Paris",
  phone:"+33 1 42 86 54 00", email:"contact@idec-construction.fr",
  siret:"412 345 678 00021", created:"2021-03-15",
};

// [5] CONTACTS PROJET — source: table Contact_projet
const MOCK_CONTACTS = [
  { id:"ct1", name:"Jean-Eudes Gohard", type:"Principal",       email:"je.gohard@idec.fr",  phone:"+33 6 12 34 56 78" },
  { id:"ct2", name:"Marie Fontaine",    type:"Mise en copie",   email:"m.fontaine@idec.fr", phone:"+33 6 98 76 54 32" },
  { id:"ct3", name:"Thomas Beaumont",   type:"Compta",          email:"compta@idec.fr",     phone:"+33 1 42 86 54 01" },
  { id:"ct4", name:"Sophie Leroux",     type:"Secondaire",      email:"s.leroux@idec.fr",   phone:"+33 6 55 44 33 22" },
];

// [2] PROJETS — source: table Projects (filtrés par _company_attached)
// [4] INTERVENTIONS — source: table interventions (imbriquées dans chaque projet)
const MOCK_PROJECTS = [
  {
    id:"p1", name:"AREFIM - REIMS (51)", status:"Devis signé",
    type:"Dallage", address:"Zone Industrielle Nord, 51100 Reims",
    ca_total:185400, avancement:0.67,
    interventions:[
      { id:"i1", name:"Reprise fissures dalle",    status:"Terminé",  date:"2025-01-15", agents:["Pierre Martin","Lucas Bernard"], rapport:"Sophie Durand" },
      { id:"i2", name:"Traitement surface",         status:"En cours", date:"2025-03-10", agents:["Lucas Bernard"],                 rapport:"Sophie Durand" },
      { id:"i3", name:"Reprise joint dilatation",   status:"Planifié", date:"2025-04-22", agents:["Pierre Martin","Ali Benali"],    rapport:"Marc Dupont"   },
    ],
  },
  {
    id:"p2", name:"LOGISTIQUE SENLIS (60)", status:"Chiffrage en cours",
    type:"Réparation béton", address:"Parc Logistique, 60300 Senlis",
    ca_total:67200, avancement:0.15,
    interventions:[
      { id:"i4", name:"Diagnostic structure", status:"Terminé",  date:"2025-02-01", agents:["Ali Benali"],    rapport:"Marc Dupont"   },
      { id:"i5", name:"Injection résine",     status:"Planifié", date:"2025-05-10", agents:["Pierre Martin"], rapport:"Sophie Durand" },
    ],
  },
  {
    id:"p3", name:"ENTREPÔT ROISSY (95)", status:"Devis envoyé",
    type:"Marquage sol", address:"Aéroport CDG, Zone Fret, 95700 Roissy",
    ca_total:42800, avancement:0, interventions:[],
  },
];

// [3] DEVIS — source: table Offers_history_documents (filtrés via projets du client)
const MOCK_DEVIS = [
  { id:"d1", offer_number:"devis_de00001898", project_id:"p1", project_name:"AREFIM - REIMS (51)",    os_devis_statut:"Devis signé",          date_offre:"2025-01-10", date_validite:"2025-06-20", montant_ht:48200,  is_active:true  },
  { id:"d2", offer_number:"devis_de00001901", project_id:"p1", project_name:"AREFIM - REIMS (51)",    os_devis_statut:"Devis envoyé",         date_offre:"2024-12-01", date_validite:"2025-03-01", montant_ht:22000,  is_active:false },
  { id:"d3", offer_number:"devis_de00001910", project_id:"p2", project_name:"LOGISTIQUE SENLIS (60)", os_devis_statut:"Chiffrage en cours",   date_offre:"2025-02-15", date_validite:"2025-07-15", montant_ht:67200,  is_active:true  },
  { id:"d4", offer_number:"devis_de00001918", project_id:"p3", project_name:"ENTREPÔT ROISSY (95)",   os_devis_statut:"Devis envoyé",         date_offre:"2025-03-01", date_validite:"2025-06-25", montant_ht:42800,  is_active:true  },
  { id:"d5", offer_number:"devis_de00001925", project_id:"p2", project_name:"LOGISTIQUE SENLIS (60)", os_devis_statut:"Classé sans suite",    date_offre:"2024-11-10", date_validite:"2025-01-10", montant_ht:31000,  is_active:false },
];

// HISTORIQUE — source: à créer dans Bubble si besoin (table CRM_historique par ex.)
const MOCK_HISTORIQUE_INIT = [
  { id:"h1", date:"2025-02-14", type:"Appel",   auteur:"ST",  note:"Relance devis AREFIM — client confirme signature prochaine semaine." },
  { id:"h2", date:"2025-01-28", type:"Email",   auteur:"AM",  note:"Envoi devis actualisé suite demande modification quantités." },
  { id:"h3", date:"2025-01-10", type:"Réunion", auteur:"ST",  note:"Réunion de chantier sur site Reims. Points : planning T1, accès zone sud." },
  { id:"h4", date:"2024-12-05", type:"Appel",   auteur:"MEM", note:"Premier contact pour le projet Senlis. RDV pris pour le 15/01." },
];

// ─── UTILS ────────────────────────────────────────────────────────────────────
const fmt     = n => new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(n||0);
const fmtDate = d => d ? new Date(d).toLocaleDateString("fr-FR") : "—";
const diffDays= d => d ? Math.ceil((new Date(d)-new Date())/86400000) : null;

// ─── FETCH BUBBLE ─────────────────────────────────────────────────────────────
// Stratégie performance : 2 phases séquentielles
//   Phase 1 : companies + projects (petit volume, rapide)
//   Phase 2 : interventions + offers + items + contacts, filtrés en JS
// Cache mémoire pour éviter de tout recharger si on revient sur la fiche
let _cache = {};

async function fetchAllPages(table){
  let results=[], cursor=0;
  while(true){
    const res  = await fetch(`/api/bubble?table=${table}&cursor=${cursor}&secret=${DASH_SECRET}`);
    const data = await res.json();
    const page = data.response?.results||[];
    results    = results.concat(page);
    if((data.response?.remaining??0)===0) break;
    cursor += page.length;
  }
  return results;
}

// Extrait une string depuis un champ adresse Bubble {address,lat,lng} ou string
const extractAddr = v => {
  if(!v) return "";
  if(typeof v==="string") return v;
  if(typeof v==="object") return v.address||v.name||"";
  return "";
};

// Normalise le type de contact (Option Set Bubble → string display)
const normalizeType = v => {
  if(!v) return "Autre - À préciser";
  if(typeof v==="string") return v;
  if(typeof v==="object") return v.display||v.name||"Autre - À préciser";
  return String(v);
};

async function fetchClientData(clientName){
  console.log("[FC] fetch:", clientName);

  // ── Phase 1 : tables légères ──────────────────────────────────────────────
  const [rawCompanies, rawProjects] = await Promise.all([
    _cache.companies  || fetchAllPages("companies").then(r=>{ _cache.companies=r; return r; }),
    _cache.projects   || fetchAllPages("projects").then(r=>{ _cache.projects=r; return r; }),
  ]);

  // Trouver la company par name (filtre JS)
  const company = rawCompanies.find(c=>(c.name||"").toLowerCase()===clientName.toLowerCase());
  if(!company){ console.warn("[FC] company introuvable:", clientName); return null; }
  const companyId = company._id;

  // Projets du client
  const rawProjectsF = rawProjects.filter(p=>p._company_attached===companyId);
  const projectIds   = new Set(rawProjectsF.map(p=>p._id));
  console.log("[FC] company:", companyId, "| projets:", rawProjectsF.length);

  if(rawProjectsF.length===0) {
    return {
      client: {
        id:company._id, name:company.name||clientName,
        address:company.adresse_texte||"", phone:company.phone||"", email:company.email||"",
        siret:company.siret||"", created:company["Created Date"]?.slice(0,10)||"",
      },
      projets:[], devis:[], contacts:[],
    };
  }

  // ── Phase 2 : tables volumineuses (parallèle) ─────────────────────────────
  const [rawInterventions, rawOffers, rawItems, rawContacts] = await Promise.all([
    _cache.interventions || fetchAllPages("interventions").then(r=>{ _cache.interventions=r; return r; }),
    _cache.offers        || fetchAllPages("offers_history_documents").then(r=>{ _cache.offers=r; return r; }),
    _cache.items         || fetchAllPages("items_devis").then(r=>{ _cache.items=r; return r; }),
    _cache.contacts      || fetchAllPages("contact").then(r=>{ _cache.contacts=r; return r; }),
  ]);

  // Filtres JS
  const rawIntervF   = rawInterventions.filter(i=>projectIds.has(i._project_attached));
  const rawOffersF   = rawOffers.filter(o=>projectIds.has(o._project_attached));
  const rawItemsF    = rawItems.filter(i=>projectIds.has(i._project_attached));
  const rawContactsF = rawContacts.filter(c=>c._company_attached===companyId);
  console.log("[FC] companyId cherché:", companyId);
  console.log("[FC] contacts total dans Bubble:", rawContacts.length);
  console.log("[FC] contacts filtrés:", rawContactsF.length);
  console.log("[FC] interv:", rawIntervF.length, "| offers:", rawOffersF.length, "| items:", rawItemsF.length, "| contacts:", rawContactsF.length);

  // Items groupés par devis (pour affichage accordéon dans onglet Devis)
  const itemsByOffer = {};
  rawItemsF.forEach(item=>{
    const oid = item.offer_document_item;
    if(!oid) return;
    if(!itemsByOffer[oid]) itemsByOffer[oid]=[];
    itemsByOffer[oid].push({
      id:item._id,
      designation:item.designation||"",
      quantity:item.quantity||item.quantite||0,
      unit:item.unit||item.OS_product_unit||"",
      price_ht:item.price_HT||item.prix_unitaire||0,
      total_ht:item["Total HT"]||item.Total_HT||0,
    });
  });

  // Montant HT par devis
  const montantByOffer={};
  rawItemsF.forEach(item=>{
    const oid=item.offer_document_item;
    const ht=item["Total HT"]||item.Total_HT||0;
    if(oid) montantByOffer[oid]=(montantByOffer[oid]||0)+ht;
  });

  // Avancement par projet
  const numByProj={}, denomByProj={};
  rawItemsF.forEach(item=>{
    const pid=item._project_attached;
    const ht=item["Total HT"]||item.Total_HT||0;
    const isI=item.is_intervention===true||item["intervention?"]=== true;
    if(pid){ denomByProj[pid]=(denomByProj[pid]||0)+ht; if(isI) numByProj[pid]=(numByProj[pid]||0)+ht; }
  });

  // Interventions groupées par projet
  const intervByProj={};
  rawIntervF.forEach(i=>{
    const pid=i._project_attached;
    if(!intervByProj[pid]) intervByProj[pid]=[];
    intervByProj[pid].push({
      id:i._id,
      name:i.name||"Sans nom",
      status:normalizeType(i.intervention_status||i.OS_project_intervention_status)||"—",
      date:i.date?i.date.slice(0,10):i["Created Date"]?.slice(0,10),
    });
  });

  // Normalisation projets
  const projets = rawProjectsF.map(p=>({
    id:p._id, name:p.name||"",
    status:p.OS_devis_status||"",
    type:normalizeType(p.OS_prestations_type)||"",
    address:extractAddr(p.chantier_address||p.address),
    ca_total:denomByProj[p._id]||0,
    avancement:denomByProj[p._id]>0?Math.min((numByProj[p._id]||0)/denomByProj[p._id],1):0,
    interventions:intervByProj[p._id]||[],
  }));

  // Normalisation devis
  const projectMap=Object.fromEntries(rawProjectsF.map(p=>[p._id,p]));
  const devis = rawOffersF.map(o=>({
    id:o._id,
    offer_number:o.offer_number||o.devis_number||o._id,
    project_id:o._project_attached,
    project_name:projectMap[o._project_attached]?.name||"",
    os_devis_statut:o.os_devis_statut||projectMap[o._project_attached]?.OS_devis_status||"",
    date_offre:o.date_offre?o.date_offre.slice(0,10):o["Created Date"]?.slice(0,10),
    date_validite:o.date_validite?o.date_validite.slice(0,10):null,
    montant_ht:montantByOffer[o._id]||0,
    is_active:o.is_active!==false,
    items:(itemsByOffer[o._id]||[]).filter(Boolean),
  }));

  // Normalisation contacts
  // Champs Bubble table "contact" : first_last_name, type_contact, email, phone
  const contacts = rawContactsF.map(c=>({
    id:c._id,
    name:c.first_last_name||c.Nom||c.nom||c.name||"Sans nom",
    type:normalizeType(c.type_contact||c.role_contact_projet),
    email:c.email||"",
    phone:c.phone||c.telephone||"",
  }));

  // Normalisation company
  // ── CHAMPS BUBBLE : adresse_texte / phone / email ─────────────────────────
  const client = {
    id:company._id, name:company.name||clientName,
    address:company.adresse_texte||extractAddr(company.address)||"",
    phone:company.phone||"",
    email:company.email||"",
    siret:company.siret||"",
    created:company["Created Date"]?.slice(0,10)||"",
  };

  console.log("[FC] OK ✓");
  return { client, projets, devis, contacts };
}

// ─── COMPOSANTS UI ────────────────────────────────────────────────────────────
function Badge({label,color}){
  const c=color||S_COLOR[label]||T.textSoft;
  return <span style={{fontSize:11,fontWeight:600,padding:"3px 9px",borderRadius:20,color:c,background:`${c}18`,border:`1px solid ${c}30`,whiteSpace:"nowrap"}}>{label}</span>;
}

function ProgressBar({value}){
  const pct=Math.round((value||0)*100);
  const color=pct>=80?T.sage:pct>=50?T.teal:pct>=20?T.indigo:T.textSoft;
  return (
    <div style={{display:"flex",alignItems:"center",gap:8}}>
      <div style={{flex:1,height:6,background:T.border,borderRadius:3}}>
        <div style={{height:6,background:`linear-gradient(90deg,${color}88,${color})`,width:`${pct}%`,borderRadius:3,transition:"width 0.4s"}}/>
      </div>
      <span style={{fontSize:11,color,fontWeight:700,width:34,textAlign:"right",flexShrink:0}}>{pct}%</span>
    </div>
  );
}

function Card({title,children,action,accent}){
  return (
    <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden",boxShadow:"0 2px 6px rgba(0,0,0,0.04)"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 20px",borderBottom:`1px solid ${T.border}`,background:T.cardAlt,borderLeft:accent?`4px solid ${accent}`:"none"}}>
        <span style={{fontSize:11,fontWeight:700,color:T.textMed,letterSpacing:"0.07em",textTransform:"uppercase"}}>{title}</span>
        {action}
      </div>
      <div style={{padding:20}}>{children}</div>
    </div>
  );
}

function StatPill({label,value,color}){
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"14px 20px",background:`${color}12`,borderRadius:10,border:`1px solid ${color}25`,minWidth:110}}>
      <span style={{fontSize:20,fontWeight:800,color}}>{value}</span>
      <span style={{fontSize:10,color:T.textSoft,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em",marginTop:4,textAlign:"center"}}>{label}</span>
    </div>
  );
}

// ─── ACCORDÉON PROJET ─────────────────────────────────────────────────────────
function ProjetAccordeon({projet}){
  const [open,setOpen]=useState(false);
  return (
    <div style={{border:`1px solid ${T.border}`,borderRadius:10,overflow:"hidden",marginBottom:10}}>
      <div onClick={()=>setOpen(o=>!o)}
        style={{display:"grid",gridTemplateColumns:"1fr 160px 120px 130px 32px",gap:12,padding:"13px 16px",alignItems:"center",cursor:"pointer",background:open?T.indigoL:T.card,transition:"background 0.15s"}}
        onMouseEnter={e=>{if(!open)e.currentTarget.style.background=T.cardAlt;}}
        onMouseLeave={e=>{if(!open)e.currentTarget.style.background=T.card;}}>
        <div>
          <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:3}}>{projet.name}</div>
          <div style={{fontSize:11,color:T.textSoft}}>{projet.type} · {projet.address}</div>
        </div>
        <Badge label={projet.status}/>
        <span style={{fontSize:13,fontWeight:700,color:T.indigo,textAlign:"right"}}>{fmt(projet.ca_total)}</span>
        <ProgressBar value={projet.avancement}/>
        <span style={{color:T.textSoft,fontSize:13,textAlign:"center"}}>{open?"▲":"▼"}</span>
      </div>

      {open&&(
        <div style={{background:T.bg,borderTop:`1px solid ${T.border}`}}>
          {/* [4] INTERVENTIONS — liaison: intervention._project_attached === projet.id */}
          {(projet.interventions||[]).length===0
            ?<div style={{padding:"20px 16px",fontSize:12,color:T.textSoft,textAlign:"center"}}>Aucune intervention enregistrée</div>
            :(projet.interventions||[]).map((interv,idx)=>{
              const jours=diffDays(interv.date);
              const dateColor=interv.status==="Planifié"?(jours<=7?T.rose:T.violet):T.textSoft;
              return (
                <div key={interv.id}
                  style={{display:"grid",gridTemplateColumns:"26px 1fr 110px 130px 1fr 1fr",gap:10,padding:"11px 16px",alignItems:"center",borderBottom:idx<projet.interventions.length-1?`1px solid ${T.border}`:"none",background:idx%2===0?T.card:T.cardAlt}}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:S_COLOR[interv.status]||T.textSoft,margin:"0 auto",flexShrink:0}}/>
                  <span style={{fontSize:12,color:T.text,fontWeight:600}}>{interv.name}</span>
                  <Badge label={interv.status}/>
                  <span style={{fontSize:11,color:dateColor,fontWeight:interv.status==="Planifié"?700:400}}>
                    {fmtDate(interv.date)}
                    {interv.status==="Planifié"&&jours!==null&&<span style={{marginLeft:4}}>({jours<=0?"Auj.":`J-${jours}`})</span>}
                  </span>
                  <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                    {(interv.agents||[]).map(a=><span key={a} style={{fontSize:10,padding:"2px 7px",borderRadius:20,background:T.tealL,color:T.teal,fontWeight:600}}>{a}</span>)}
                  </div>
                  <span style={{fontSize:11,color:T.textSoft}}>
                    <span style={{fontSize:10,marginRight:4}}>Rapport :</span>
                    <span style={{color:T.textMed,fontWeight:600}}>{interv.rapport}</span>
                  </span>
                </div>
              );
            })
          }
          <div style={{display:"flex",justifyContent:"flex-end",alignItems:"center",gap:8,padding:"10px 16px",borderTop:`1px solid ${T.border}`,background:T.card}}>
            <span style={{fontSize:11,color:T.textSoft,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.05em"}}>CA Projet</span>
            <span style={{fontSize:14,fontWeight:800,color:T.indigo}}>{fmt(projet.ca_total)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ONGLET DEVIS ─────────────────────────────────────────────────────────────
function DevisRow({d, idx}){
  const [open,setOpen] = useState(false);
  const exp=diffDays(d.date_validite);
  const expColor=exp===null?T.textSoft:exp<=0?T.rose:exp<=7?T.amber:T.textSoft;
  return (
    <>
      {/* Ligne devis */}
      <div onClick={()=>(d.items||[]).length&&setOpen(o=>!o)}
        style={{display:"grid",gridTemplateColumns:"28px 150px 1fr 155px 100px 100px 50px",gap:8,padding:"11px 16px",
          borderBottom:open&&(d.items||[]).length?`none`:`1px solid ${T.border}`,
          alignItems:"center",opacity:d.is_active?1:0.55,cursor:(d.items||[]).length?"pointer":"default",
          background:open?T.indigoL:idx%2===0?T.card:T.cardAlt,transition:"background 0.1s"}}
        onMouseEnter={e=>{if(!open)e.currentTarget.style.background=T.cardAlt;}}
        onMouseLeave={e=>{e.currentTarget.style.background=open?T.indigoL:idx%2===0?T.card:T.cardAlt;}}>
        <span style={{color:T.textSoft,fontSize:11,textAlign:"center"}}>{(d.items||[]).length?open?"▲":"▼":""}</span>
        <span style={{fontSize:11,color:T.textSoft,fontFamily:"monospace",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.offer_number}</span>
        <span style={{fontSize:12,color:T.textMed,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.project_name}</span>
        <Badge label={d.os_devis_statut}/>
        <span style={{fontSize:13,fontWeight:700,color:T.text,textAlign:"right"}}>{fmt(d.montant_ht)}</span>
        <div>
          <div style={{fontSize:11,color:T.textMed}}>{fmtDate(d.date_offre)}</div>
          {d.date_validite&&<div style={{fontSize:10,color:expColor,fontWeight:exp!==null&&exp<=7?700:400}}>{exp<=0?"Expiré":`J-${exp}`}</div>}
        </div>
        <div style={{display:"flex",justifyContent:"center"}}>
          <div style={{width:10,height:10,borderRadius:"50%",background:d.is_active?T.sage:T.border,border:`2px solid ${d.is_active?T.sage:T.borderMd}`}}/>
        </div>
      </div>
      {/* Items accordéon */}
      {open&&(d.items||[]).length>0&&(
        <div style={{background:T.indigoL,borderBottom:`1px solid ${T.border}`,padding:"0 16px 10px 46px"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 70px 70px 100px 100px",gap:8,padding:"6px 0",marginBottom:4,borderBottom:`1px solid ${T.border}`}}>
            {["Désignation","Qté","Unité","P.U. HT","Total HT"].map(h=>
              <span key={h} style={{fontSize:10,color:T.textSoft,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.05em"}}>{h}</span>
            )}
          </div>
          {(d.items||[]).map(item=>(
            <div key={item.id} style={{display:"grid",gridTemplateColumns:"1fr 70px 70px 100px 100px",gap:8,padding:"5px 0",borderBottom:`1px solid ${T.border}44`}}>
              <span style={{fontSize:12,color:T.text}}>{item.designation}</span>
              <span style={{fontSize:12,color:T.textMed,textAlign:"right"}}>{item.quantity}</span>
              <span style={{fontSize:12,color:T.textMed}}>{item.unit}</span>
              <span style={{fontSize:12,color:T.textMed,textAlign:"right"}}>{fmt(item.price_ht)}</span>
              <span style={{fontSize:12,fontWeight:600,color:T.indigo,textAlign:"right"}}>{fmt(item.total_ht)}</span>
            </div>
          ))}
          <div style={{display:"flex",justifyContent:"flex-end",marginTop:8}}>
            <span style={{fontSize:13,fontWeight:700,color:T.indigo}}>{fmt(d.montant_ht)} HT</span>
          </div>
        </div>
      )}
    </>
  );
}

function TabDevisClient({devis}){
  const total = devis.filter(d=>d.is_active).reduce((s,d)=>s+(d.montant_ht||0),0);
  return (
    <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden",boxShadow:"0 2px 6px rgba(0,0,0,0.04)"}}>
      <div style={{display:"grid",gridTemplateColumns:"28px 150px 1fr 155px 100px 100px 50px",gap:8,padding:"10px 16px",background:T.cardAlt,borderBottom:`2px solid ${T.border}`}}>
        {["","Référence","Projet","Statut","Montant HT","Date","Actif"].map(h=>(
          <span key={h} style={{fontSize:11,color:T.textSoft,fontWeight:700,letterSpacing:"0.05em",textTransform:"uppercase"}}>{h}</span>
        ))}
      </div>
      <div style={{maxHeight:560,overflowY:"auto"}}>
        {devis.length===0
          ?<div style={{padding:"32px",textAlign:"center",color:T.textSoft,fontSize:13}}>Aucun devis pour ce client</div>
          :(devis||[]).map((d,idx)=><DevisRow key={d.id} d={d} idx={idx}/>)
        }
      </div>
      <div style={{display:"grid",gridTemplateColumns:"28px 150px 1fr 155px 100px 100px 50px",gap:8,padding:"12px 16px",borderTop:`2px solid ${T.border}`,background:T.cardAlt}}>
        <span style={{gridColumn:"1/5",fontSize:12,color:T.textSoft}}>{devis.filter(d=>d.is_active).length} devis actifs sur {devis.length}</span>
        <span style={{fontSize:15,fontWeight:800,color:T.indigo,textAlign:"right"}}>{fmt(total)}</span>
        <span/><span/>
      </div>
    </div>
  );
}

// ─── MODAL HISTORIQUE ─────────────────────────────────────────────────────────
function ModalContact({onClose,onSave}){
  const [form,setForm]=useState({date:new Date().toISOString().slice(0,10),type:"Appel",auteur:"",note:""});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const inp={width:"100%",padding:"8px 12px",border:`1.5px solid ${T.border}`,borderRadius:8,color:T.text,fontSize:13,fontFamily:"inherit",outline:"none",background:T.bg};
  const lbl={fontSize:11,color:T.textSoft,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",display:"block",marginBottom:6};
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(26,38,64,0.4)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={onClose}>
      <div style={{background:T.card,borderRadius:14,padding:28,width:480,boxShadow:"0 24px 48px rgba(0,0,0,0.15)"}} onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:15,fontWeight:800,color:T.text,marginBottom:20}}>Nouveau contact client</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
          <div><label style={lbl}>Date</label><input type="date" value={form.date} onChange={e=>set("date",e.target.value)} style={inp}/></div>
          <div><label style={lbl}>Type</label>
            <select value={form.type} onChange={e=>set("type",e.target.value)} style={inp}>
              {["Appel","Email","Réunion","Note"].map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div style={{marginBottom:14}}><label style={lbl}>Auteur</label><input value={form.auteur} onChange={e=>set("auteur",e.target.value)} placeholder="Initiales ou nom…" style={inp}/></div>
        <div style={{marginBottom:20}}><label style={lbl}>Note</label><textarea value={form.note} onChange={e=>set("note",e.target.value)} placeholder="Résumé de l'échange…" rows={4} style={{...inp,resize:"vertical",lineHeight:1.5}}/></div>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <button onClick={onClose} style={{padding:"8px 18px",borderRadius:8,border:`1px solid ${T.border}`,background:T.card,color:T.textMed,fontSize:13,fontWeight:600,cursor:"pointer"}}>Annuler</button>
          <button onClick={()=>{onSave(form);onClose();}} style={{padding:"8px 18px",borderRadius:8,border:"none",background:`linear-gradient(135deg,${T.indigo},${T.teal})`,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>Enregistrer</button>
        </div>
      </div>
    </div>
  );
}

// ─── PAGE FICHE CLIENT ────────────────────────────────────────────────────────
export default function FicheClient({clientId, clientName}){

  // ── State données ──────────────────────────────────────────────────────────
  const [client,   setClient]   = useState(clientId ? {...MOCK_CLIENT, name: clientName||""} : MOCK_CLIENT);
  const [contacts, setContacts] = useState(USE_MOCK ? MOCK_CONTACTS : []);
  const [projets,  setProjets]  = useState(USE_MOCK ? MOCK_PROJECTS : []);
  const [devis,    setDevis]    = useState(USE_MOCK ? MOCK_DEVIS    : []);
  const [fetchLoading, setFetchLoading] = useState(!USE_MOCK && !!clientId);
  const [fetchError,   setFetchError]   = useState(null);

  const [historique,setHistorique] = useState(MOCK_HISTORIQUE_INIT);
  const [showModal,setShowModal]   = useState(false);
  const [activeTab,setActiveTab]   = useState("projets");

  // ── Fetch Bubble quand clientId change ────────────────────────────────────
  // USE_MOCK=false + clientId fourni → on charge depuis Bubble
  // USE_MOCK=true                   → on garde les mocks (développement)
  useEffect(()=>{
    if(USE_MOCK || !clientId) return;
    setFetchLoading(true);
    setFetchError(null);
    fetchClientData(clientId)
      .then(data=>{
        if(!data){ setFetchError("Client introuvable dans Bubble"); return; }
        setClient(data.client);
        setProjets(data.projets);
        setDevis(data.devis);
        setContacts(data.contacts);
      })
      .catch(e=>setFetchError("Erreur de chargement : "+e.message))
      .finally(()=>setFetchLoading(false));
  },[clientId]);

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const caTotal   = devis.filter(d=>d.is_active).reduce((s,d)=>s+(d.montant_ht||0),0);
  const nbProjets = projets.length;
  const nbInterv  = projets.flatMap(p=>p.interventions).length;
  const nbPlanif  = projets.flatMap(p=>p.interventions).filter(i=>i.status==="Planifié").length;
  const nbDevis   = devis.length;
  const caByProjet= projets.map(p=>({name:(p.name||'').split(' ')[0]||'—',ca:p.ca_total}));

  const contactsRapides = contacts.filter(c=>["Principal","Secondaire","Contact sur site"].includes(c.type));
  // Prochaines = date dans le futur (ou aujourd'hui), triées par date
  const today = new Date(); today.setHours(0,0,0,0);
  const prochaines = projets
    .flatMap(p=>p.interventions
      .filter(i=> i.date && new Date(i.date) >= today)
      .map(i=>({...i, projet:p.name}))
    )
    .sort((a,b)=>new Date(a.date)-new Date(b.date));

  const addHistorique = entry => setHistorique(h=>[{id:`h${Date.now()}`,...entry},...h]);

  const TABS = [
    ["projets",   "📁 Projets & Interventions"],
    ["devis",     "📄 Devis"],
    ["contacts",  "ðŸ‘¥ Contacts"],
    ["historique","📋 Historique"],
  ];

  // ── Écran chargement ──────────────────────────────────────────────────────
  if(fetchLoading) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"60vh",fontFamily:"'Nunito','Segoe UI',sans-serif"}}>
      <div style={{textAlign:"center"}}>
        <div style={{width:40,height:40,border:`3px solid ${T.border}`,borderTopColor:T.indigo,borderRadius:"50%",animation:"spin 0.8s linear infinite",margin:"0 auto 14px"}}/>
        <div style={{fontSize:13,color:T.textSoft}}>Chargement de la fiche <strong>{clientName}</strong>…</div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  // ── Écran erreur ──────────────────────────────────────────────────────────
  if(fetchError) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"60vh",fontFamily:"'Nunito','Segoe UI',sans-serif"}}>
      <div style={{textAlign:"center",padding:32,background:T.card,borderRadius:14,border:`1px solid ${T.rose}33`}}>
        <div style={{fontSize:32,marginBottom:12}}>⚠️</div>
        <div style={{fontSize:14,color:T.rose,fontWeight:700,marginBottom:8}}>{fetchError}</div>
        <div style={{fontSize:12,color:T.textSoft}}>Vérifie que USE_MOCK=false et que le clientId est correct</div>
      </div>
    </div>
  );

  // ── Écran "aucun client sélectionné" ──────────────────────────────────────
  if(!clientId && !USE_MOCK) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"60vh",fontFamily:"'Nunito','Segoe UI',sans-serif"}}>
      <div style={{textAlign:"center",padding:32,background:T.card,borderRadius:14,border:`1px solid ${T.border}`}}>
        <div style={{fontSize:32,marginBottom:12}}>ðŸ”</div>
        <div style={{fontSize:14,color:T.textMed,fontWeight:700}}>Recherche un client dans la barre en haut</div>
      </div>
    </div>
  );

  return (
    <div style={{background:T.bg,minHeight:"100vh",fontFamily:"'Nunito','Segoe UI',sans-serif",color:T.text}}>
      <style>{`
        select,input,textarea{font-family:'Nunito','Segoe UI',sans-serif;}
        ::-webkit-scrollbar{width:5px;height:5px;}
        ::-webkit-scrollbar-track{background:${T.bg};}
        ::-webkit-scrollbar-thumb{background:${T.borderMd};border-radius:3px;}
      `}</style>

      <div style={{padding:"24px 28px",maxWidth:1400,margin:"0 auto"}}>

        {/* ── HERO CLIENT ── [1] source: Companies */}
        <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"24px 28px",marginBottom:20,boxShadow:"0 2px 8px rgba(0,0,0,0.05)",borderLeft:`5px solid ${T.indigo}`}}>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:16}}>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
                <div style={{width:48,height:48,background:`linear-gradient(135deg,${T.indigo}22,${T.teal}22)`,border:`2px solid ${T.indigo}33`,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <span style={{fontSize:20,fontWeight:900,color:T.indigo}}>{(client.name||"?").charAt(0)}</span>
                </div>
                <div>
                  {/* [1] company.name */}
                  <div style={{fontSize:22,fontWeight:800,color:T.text}}>{client.name}</div>
                  <div style={{fontSize:12,color:T.textSoft,marginTop:2}}>
                    Client depuis {fmtDate(client.created)} · SIRET {client.siret}
                  </div>
                </div>
              </div>
              <div style={{display:"flex",gap:16,flexWrap:"wrap",marginTop:6}}>
                <span style={{fontSize:12,color:T.textMed}}>📍 {client.address}</span>
                <span style={{fontSize:12,color:T.textMed}}>📞 {client.phone}</span>
                <span style={{fontSize:12,color:T.textMed}}>✉️ {client.email}</span>
              </div>
            </div>
            {/* KPIs */}
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              <StatPill label="CA Actif"      value={fmt(caTotal)}  color={T.indigo}/>
              <StatPill label="Projets"        value={nbProjets}     color={T.teal}/>
              <StatPill label="Interventions"  value={nbInterv}      color={T.sage}/>
              <StatPill label="Planifiées"     value={nbPlanif}      color={T.violet}/>
              <StatPill label="Devis"          value={nbDevis}       color={T.amber}/>
            </div>
          </div>
        </div>

        {/* ── GRILLE PRINCIPALE ── */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 300px",gap:20}}>

          {/* COLONNE GAUCHE */}
          <div style={{display:"flex",flexDirection:"column",gap:16}}>

            {/* ONGLETS */}
            <div style={{display:"flex",gap:3,background:T.card,border:`1px solid ${T.border}`,borderRadius:10,padding:4,width:"fit-content",boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
              {TABS.map(([key,label])=>(
                <button key={key} onClick={()=>setActiveTab(key)}
                  style={{cursor:"pointer",padding:"7px 18px",borderRadius:7,fontSize:12,fontWeight:700,border:"none",
                    background:activeTab===key?T.card:"transparent",
                    color:activeTab===key?T.indigo:T.textMed,
                    boxShadow:activeTab===key?"0 1px 4px rgba(0,0,0,0.08)":"none",
                    transition:"all 0.15s"}}>
                  {label}
                </button>
              ))}
            </div>

            {/* ── ONGLET PROJETS ── */}
            {/* [2] Projects filtrés par _company_attached + [4] interventions imbriquées */}
            {activeTab==="projets"&&(
              <div>
                {projets.length===0
                  ?<div style={{padding:32,textAlign:"center",color:T.textSoft,fontSize:13,background:T.card,borderRadius:12,border:`1px solid ${T.border}`}}>Aucun projet pour ce client</div>
                  :(projets||[]).map(p=><ProjetAccordeon key={p.id} projet={p}/>)
                }
              </div>
            )}

            {/* ── ONGLET DEVIS ── */}
            {/* [3] Offers_history_documents via projets du client */}
            {activeTab==="devis"&&<TabDevisClient devis={devis}/>}

            {/* ── ONGLET CONTACTS ── */}
            {/* [5] Contact_projet liés aux projets du client */}
            {activeTab==="contacts"&&(
              <Card title="Contacts de l'entreprise" accent={T.teal}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  {(contacts||[]).map(ct=>{
                    const c=TYPE_CONTACT_COLOR[ct.type]||T.textSoft;
                    return (
                      <div key={ct.id} style={{padding:"14px 16px",borderRadius:10,border:`1px solid ${c}25`,background:`${c}08`}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                          <div style={{width:34,height:34,borderRadius:10,background:`${c}18`,border:`1px solid ${c}30`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                            <span style={{fontSize:14,fontWeight:800,color:c}}>{ct.name.charAt(0)}</span>
                          </div>
                          <Badge label={ct.type} color={c}/>
                        </div>
                        <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:4}}>{ct.name}</div>
                        <div style={{fontSize:11,color:T.textSoft,marginBottom:2}}>✉️ {ct.email}</div>
                        <div style={{fontSize:11,color:T.textSoft}}>📞 {ct.phone}</div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* ── ONGLET HISTORIQUE ── */}
            {activeTab==="historique"&&(
              <Card title="Historique des contacts" accent={T.violet}
                action={<button onClick={()=>setShowModal(true)} style={{cursor:"pointer",padding:"6px 14px",borderRadius:8,border:"none",background:`linear-gradient(135deg,${T.indigo},${T.teal})`,color:"#fff",fontSize:12,fontWeight:700}}>+ Ajouter</button>}>
                <div style={{position:"relative"}}>
                  <div style={{position:"absolute",left:16,top:0,bottom:0,width:2,background:T.border,borderRadius:1}}/>
                  {historique.map((h,idx)=>{
                    const c=HISTORIQUE_COLOR[h.type]||T.textSoft;
                    return (
                      <div key={h.id} style={{display:"flex",gap:16,marginBottom:idx<historique.length-1?20:0,position:"relative"}}>
                        <div style={{width:32,height:32,borderRadius:"50%",background:`${c}15`,border:`2px solid ${c}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,zIndex:1}}>
                          <span style={{fontSize:12}}>{h.type==="Appel"?"📞":h.type==="Email"?"✉️":h.type==="Réunion"?"🤝":"ðŸ“"}</span>
                        </div>
                        <div style={{flex:1,paddingTop:4}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
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
              </Card>
            )}
          </div>

          {/* COLONNE DROITE */}
          <div style={{display:"flex",flexDirection:"column",gap:16}}>

            {/* CA PAR PROJET */}
            {/* [2] Projects — ca_total calculé depuis Items_devis */}
            <Card title="CA par projet" accent={T.sage}>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={caByProjet} margin={{top:4,right:4,left:0,bottom:4}}>
                  <XAxis dataKey="name" tick={{fontSize:10,fill:T.textSoft,fontFamily:"inherit"}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fontSize:10,fill:T.textSoft,fontFamily:"inherit"}} axisLine={false} tickLine={false} width={42} tickFormatter={n=>n>=1000?`${(n/1000).toFixed(0)}k`:n}/>
                  <Tooltip contentStyle={{background:T.card,border:`1px solid ${T.border}`,borderRadius:8,fontSize:12}} formatter={v=>[fmt(v),"CA"]}/>
                  <Bar dataKey="ca" radius={[5,5,0,0]}>
                    {caByProjet.map((_,i)=><Cell key={i} fill={[T.indigo,T.teal,T.sage][i%3]} opacity={0.85}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:11,color:T.textSoft,fontWeight:700,textTransform:"uppercase"}}>Total actif</span>
                <span style={{fontSize:16,fontWeight:800,color:T.indigo}}>{fmt(caTotal)}</span>
              </div>
            </Card>

            {/* PROCHAINES INTERVENTIONS */}
            {/* [4] interventions.status === "Planifié" triées par date */}
            <Card title="Prochaines interventions" accent={T.violet}>
              {prochaines.length===0
                ?<div style={{fontSize:12,color:T.textSoft,textAlign:"center",padding:"16px 0"}}>Aucune intervention planifiée</div>
                :(prochaines||[]).map((i,idx)=>{
                  const d=diffDays(i.date);
                  const dc=d<=3?T.rose:d<=7?T.amber:T.violet;
                  return (
                    <div key={i.id} style={{padding:"10px 0",borderBottom:idx<prochaines.length-1?`1px solid ${T.border}`:"none"}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                        <span style={{fontSize:12,fontWeight:700,color:T.text}}>{i.name}</span>
                        <span style={{fontSize:11,fontWeight:700,color:dc}}>{d<=0?"Auj.":`J-${d}`}</span>
                      </div>
                      <div style={{fontSize:11,color:T.textSoft,marginBottom:4}}>{i.projet}</div>
                      <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                        {(i.agents||[]).map(a=><span key={a} style={{fontSize:10,padding:"2px 7px",borderRadius:20,background:T.tealL,color:T.teal,fontWeight:600}}>{a}</span>)}
                      </div>
                    </div>
                  );
                })
              }
            </Card>

            {/* CONTACTS RAPIDES */}
            {/* [5] Contact_projet filtrés role IN ["Principal","Secondaire"] */}
            <Card title="Contacts principaux" accent={T.teal}>
              {contactsRapides.length===0
                ?<div style={{fontSize:12,color:T.textSoft,textAlign:"center"}}>Aucun contact principal</div>
                :(contactsRapides||[]).map(ct=>{
                  const c=TYPE_CONTACT_COLOR[ct.type]||T.textSoft;
                  return (
                    <div key={ct.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:`1px solid ${T.border}`}}>
                      <div style={{width:32,height:32,borderRadius:8,background:`${c}18`,border:`1px solid ${c}25`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        <span style={{fontSize:13,fontWeight:800,color:c}}>{ct.name.charAt(0)}</span>
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:12,fontWeight:700,color:T.text}}>{ct.name}</div>
                        <div style={{fontSize:11,color:T.textSoft,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ct.email}</div>
                      </div>
                      <Badge label={ct.type} color={c}/>
                    </div>
                  );
                })
              }
            </Card>

          </div>
        </div>
      </div>

      {/* MODAL HISTORIQUE */}
      {showModal&&<ModalContact onClose={()=>setShowModal(false)} onSave={addHistorique}/>}
    </div>
  );
}
