import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

// ─── THÈME (identique au dashboard) ──────────────────────────────────────────
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
const MOCK_CLIENT = {
  id: "c1",
  name: "IDEC Construction",
  address: "14 rue de la République, 75001 Paris",
  phone: "+33 1 42 86 54 00",
  email: "contact@idec-construction.fr",
  siret: "412 345 678 00021",
  created: "2021-03-15",
};

const MOCK_CONTACTS = [
  { id:"ct1", name:"Jean-Eudes Gohard",   type:"Principal",        email:"je.gohard@idec.fr",      phone:"+33 6 12 34 56 78" },
  { id:"ct2", name:"Marie Fontaine",      type:"Mise en copie",    email:"m.fontaine@idec.fr",     phone:"+33 6 98 76 54 32" },
  { id:"ct3", name:"Thomas Beaumont",     type:"Comptabilité",     email:"compta@idec.fr",         phone:"+33 1 42 86 54 01" },
  { id:"ct4", name:"Sophie Leroux",       type:"Secondaire",       email:"s.leroux@idec.fr",       phone:"+33 6 55 44 33 22" },
];

const MOCK_PROJECTS = [
  {
    id:"p1", name:"AREFIM - REIMS (51)", status:"Devis signé", type:"Dallage",
    address:"Zone Industrielle Nord, 51100 Reims",
    ca_total: 185400, avancement: 0.67,
    interventions: [
      { id:"i1", name:"Reprise fissures dalle", status:"Terminé",  date:"2025-01-15", agents:["Pierre Martin","Lucas Bernard"], rapport:"Sophie Durand" },
      { id:"i2", name:"Traitement surface",      status:"En cours", date:"2025-03-10", agents:["Lucas Bernard"],                  rapport:"Sophie Durand" },
      { id:"i3", name:"Reprise joint dilatation",status:"Planifié", date:"2025-04-22", agents:["Pierre Martin","Ali Benali"],     rapport:"Marc Dupont"   },
    ],
  },
  {
    id:"p2", name:"LOGISTIQUE SENLIS (60)", status:"Chiffrage en cours", type:"Réparation béton",
    address:"Parc Logistique, 60300 Senlis",
    ca_total: 67200, avancement: 0.15,
    interventions: [
      { id:"i4", name:"Diagnostic structure",    status:"Terminé",  date:"2025-02-01", agents:["Ali Benali"],       rapport:"Marc Dupont"   },
      { id:"i5", name:"Injection résine",         status:"Planifié", date:"2025-05-10", agents:["Pierre Martin"],   rapport:"Sophie Durand" },
    ],
  },
  {
    id:"p3", name:"ENTREPÔT ROISSY (95)", status:"Devis envoyé", type:"Marquage sol",
    address:"Aéroport CDG, Zone Fret, 95700 Roissy",
    ca_total: 42800, avancement: 0,
    interventions: [],
  },
];

const MOCK_HISTORIQUE = [
  { id:"h1", date:"2025-02-14", type:"Appel",   auteur:"ST", note:"Relance devis AREFIM — client confirme signature prochaine semaine." },
  { id:"h2", date:"2025-01-28", type:"Email",   auteur:"AM", note:"Envoi devis actualisé suite demande modification quantités." },
  { id:"h3", date:"2025-01-10", type:"Réunion", auteur:"ST", note:"Réunion de chantier sur site Reims. Points : planning T1, accès zone sud." },
  { id:"h4", date:"2024-12-05", type:"Appel",   auteur:"MEM",note:"Premier contact pour le projet Senlis. RDV pris pour le 15/01." },
];

// ─── UTILS ────────────────────────────────────────────────────────────────────
const fmt     = n => new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(n||0);
const fmtDate = d => d ? new Date(d).toLocaleDateString("fr-FR") : "—";
const diffDays= d => d ? Math.ceil((new Date(d)-new Date())/86400000) : null;

// ─── COMPOSANTS ───────────────────────────────────────────────────────────────
function Badge({ label, color }) {
  const c = color || S_COLOR[label] || T.textSoft;
  return (
    <span style={{ fontSize:11, fontWeight:600, padding:"3px 9px", borderRadius:20, color:c, background:`${c}18`, border:`1px solid ${c}30`, whiteSpace:"nowrap" }}>
      {label}
    </span>
  );
}

function ProgressBar({ value }) {
  const pct   = Math.round((value||0)*100);
  const color = pct>=80?T.sage:pct>=50?T.teal:pct>=20?T.indigo:T.textSoft;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
      <div style={{ flex:1, height:6, background:T.border, borderRadius:3 }}>
        <div style={{ height:6, background:`linear-gradient(90deg,${color}88,${color})`, width:`${pct}%`, borderRadius:3, transition:"width 0.4s" }}/>
      </div>
      <span style={{ fontSize:11, color, fontWeight:700, width:34, textAlign:"right", flexShrink:0 }}>{pct}%</span>
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

function StatPill({ label, value, color }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"14px 20px", background:`${color}12`, borderRadius:10, border:`1px solid ${color}25`, minWidth:120 }}>
      <span style={{ fontSize:22, fontWeight:800, color }}>{value}</span>
      <span style={{ fontSize:10, color:T.textSoft, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em", marginTop:4 }}>{label}</span>
    </div>
  );
}

const TYPE_CONTACT_COLOR = {
  "Principal":     T.indigo,
  "Secondaire":    T.teal,
  "Mise en copie": T.amber,
  "Comptabilité":  T.violet,
};

const HISTORIQUE_COLOR = {
  "Appel":   T.sage,
  "Email":   T.indigo,
  "Réunion": T.violet,
  "Note":    T.amber,
};

// ─── SECTION PROJET ───────────────────────────────────────────────────────────
function ProjetAccordeon({ projet }) {
  const [open, setOpen] = useState(false);
  const d = diffDays(projet.interventions.find(i=>i.status==="Planifié")?.date);
  return (
    <div style={{ border:`1px solid ${T.border}`, borderRadius:10, overflow:"hidden", marginBottom:10 }}>
      {/* Header projet */}
      <div onClick={()=>setOpen(o=>!o)} style={{ display:"grid", gridTemplateColumns:"1fr 160px 120px 130px 32px", gap:12, padding:"13px 16px", alignItems:"center", cursor:"pointer", background:open?T.indigoL:T.card, transition:"background 0.15s" }}
        onMouseEnter={e=>{if(!open)e.currentTarget.style.background=T.cardAlt;}}
        onMouseLeave={e=>{if(!open)e.currentTarget.style.background=T.card;}}>
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:T.text, marginBottom:3 }}>{projet.name}</div>
          <div style={{ fontSize:11, color:T.textSoft }}>{projet.type} · {projet.address}</div>
        </div>
        <Badge label={projet.status}/>
        <span style={{ fontSize:13, fontWeight:700, color:T.indigo, textAlign:"right" }}>{fmt(projet.ca_total)}</span>
        <ProgressBar value={projet.avancement}/>
        <span style={{ color:T.textSoft, fontSize:13, textAlign:"center" }}>{open?"▲":"▼"}</span>
      </div>

      {/* Interventions */}
      {open && (
        <div style={{ background:T.bg, borderTop:`1px solid ${T.border}` }}>
          {projet.interventions.length===0
            ? <div style={{ padding:"20px 16px", fontSize:12, color:T.textSoft, textAlign:"center" }}>Aucune intervention enregistrée</div>
            : projet.interventions.map((interv,idx)=>{
              const jours = diffDays(interv.date);
              const dateColor = interv.status==="Planifié" ? (jours<=7?T.rose:T.violet) : T.textSoft;
              return (
                <div key={interv.id} style={{ display:"grid", gridTemplateColumns:"26px 1fr 110px 120px 1fr 1fr", gap:10, padding:"11px 16px", alignItems:"center", borderBottom:idx<projet.interventions.length-1?`1px solid ${T.border}`:"none", background:idx%2===0?T.card:T.cardAlt }}>
                  {/* Indicateur statut */}
                  <div style={{ width:8, height:8, borderRadius:"50%", background:S_COLOR[interv.status]||T.textSoft, margin:"0 auto", flexShrink:0 }}/>
                  {/* Nom */}
                  <span style={{ fontSize:12, color:T.text, fontWeight:600 }}>{interv.name}</span>
                  {/* Statut */}
                  <Badge label={interv.status}/>
                  {/* Date */}
                  <span style={{ fontSize:11, color:dateColor, fontWeight:interv.status==="Planifié"?700:400 }}>
                    {fmtDate(interv.date)}
                    {interv.status==="Planifié" && jours!==null && <span style={{ marginLeft:4 }}>({jours<=0?"Aujourd'hui":`J-${jours}`})</span>}
                  </span>
                  {/* Agents */}
                  <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                    {interv.agents.map(a=>(
                      <span key={a} style={{ fontSize:10, padding:"2px 7px", borderRadius:20, background:T.tealL, color:T.teal, fontWeight:600 }}>{a}</span>
                    ))}
                  </div>
                  {/* Rapport */}
                  <span style={{ fontSize:11, color:T.textSoft }}>
                    <span style={{ fontSize:10, color:T.textSoft, marginRight:4 }}>Rapport :</span>
                    <span style={{ color:T.textMed, fontWeight:600 }}>{interv.rapport}</span>
                  </span>
                </div>
              );
            })
          }
          {/* Total projet */}
          <div style={{ display:"flex", justifyContent:"flex-end", alignItems:"center", gap:8, padding:"10px 16px", borderTop:`1px solid ${T.border}`, background:T.card }}>
            <span style={{ fontSize:11, color:T.textSoft, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.05em" }}>CA Projet</span>
            <span style={{ fontSize:14, fontWeight:800, color:T.indigo }}>{fmt(projet.ca_total)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MODAL NOUVEAU CONTACT ────────────────────────────────────────────────────
function ModalContact({ onClose, onSave }) {
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0,10), type:"Appel", auteur:"", note:"" });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const inp = { width:"100%", padding:"8px 12px", border:`1.5px solid ${T.border}`, borderRadius:8, color:T.text, fontSize:13, fontFamily:"inherit", outline:"none", background:T.bg };
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(26,38,64,0.4)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center" }} onClick={onClose}>
      <div style={{ background:T.card, borderRadius:14, padding:28, width:480, boxShadow:"0 24px 48px rgba(0,0,0,0.15)" }} onClick={e=>e.stopPropagation()}>
        <div style={{ fontSize:15, fontWeight:800, color:T.text, marginBottom:20 }}>Nouveau contact client</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
          <div>
            <label style={{ fontSize:11, color:T.textSoft, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:6 }}>Date</label>
            <input type="date" value={form.date} onChange={e=>set("date",e.target.value)} style={inp}/>
          </div>
          <div>
            <label style={{ fontSize:11, color:T.textSoft, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", display:"block", marginBottom:6 }}>Type</label>
            <select value={form.type} onChange={e=>set("type",e.target.value)} style={{...inp}}>
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
          <textarea value={form.note} onChange={e=>set("note",e.target.value)} placeholder="Résumé de l'échange…" rows={4}
            style={{...inp, resize:"vertical", lineHeight:1.5}}/>
        </div>
        <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
          <button onClick={onClose} style={{ padding:"8px 18px", borderRadius:8, border:`1px solid ${T.border}`, background:T.card, color:T.textMed, fontSize:13, fontWeight:600, cursor:"pointer" }}>Annuler</button>
          <button onClick={()=>{onSave(form);onClose();}} style={{ padding:"8px 18px", borderRadius:8, border:"none", background:`linear-gradient(135deg,${T.indigo},${T.teal})`, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer" }}>Enregistrer</button>
        </div>
      </div>
    </div>
  );
}

// ─── PAGE PRINCIPALE ──────────────────────────────────────────────────────────
export default function FicheClient({ clientId, onBack }) {
  // En production : fetch depuis Bubble avec clientId
  // Pour le mock on utilise les données statiques
  const client      = MOCK_CLIENT;
  const contacts    = MOCK_CONTACTS;
  const projets     = MOCK_PROJECTS;
  const [historique, setHistorique] = useState(MOCK_HISTORIQUE);
  const [showModal, setShowModal]   = useState(false);
  const [activeTab, setActiveTab]   = useState("projets");

  const caTotal      = projets.reduce((s,p)=>s+p.ca_total,0);
  const nbProjets    = projets.length;
  const nbInterv     = projets.flatMap(p=>p.interventions).length;
  const nbPlanifiees = projets.flatMap(p=>p.interventions).filter(i=>i.status==="Planifié").length;

  const caByProjet = projets.map(p=>({ name:p.name.split(" ")[0], ca:p.ca_total, color:T.indigo }));

  const addHistorique = (entry) => {
    setHistorique(h=>[{ id:`h${Date.now()}`, ...entry },...h]);
  };

  return (
    <div style={{ background:T.bg, minHeight:"100vh", fontFamily:"'Nunito','Segoe UI',sans-serif", color:T.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:5px;} ::-webkit-scrollbar-track{background:${T.bg};} ::-webkit-scrollbar-thumb{background:${T.borderMd};border-radius:3px;}
        select,input,textarea{font-family:'Nunito','Segoe UI',sans-serif;}
      `}</style>

      {/* HEADER */}
      <div style={{ background:T.card, borderBottom:`1px solid ${T.border}`, padding:"12px 28px", display:"flex", alignItems:"center", gap:16, position:"sticky", top:0, zIndex:100, boxShadow:"0 2px 8px rgba(0,0,0,0.05)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:34, height:34, background:`linear-gradient(135deg,${T.indigo},${T.teal})`, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span style={{ fontSize:16, fontWeight:900, color:"#fff" }}>Q</span>
          </div>
          <div>
            <div style={{ fontSize:15, fontWeight:800, color:T.text, lineHeight:1.1 }}>QUALIDAL</div>
            <div style={{ fontSize:9, color:T.textSoft, letterSpacing:"0.1em", fontWeight:600 }}>DASHBOARD</div>
          </div>
        </div>
        <div style={{ width:1, height:28, background:T.border, margin:"0 4px" }}/>
        {/* Breadcrumb */}
        <button onClick={onBack} style={{ cursor:"pointer", background:"none", border:"none", color:T.textSoft, fontSize:13, fontWeight:600, display:"flex", alignItems:"center", gap:5 }}>
          ← Dashboard
        </button>
        <span style={{ color:T.border }}>/</span>
        <span style={{ fontSize:13, fontWeight:700, color:T.text }}>{client.name}</span>
        <div style={{ marginLeft:"auto", display:"flex", gap:8 }}>
          <span style={{ fontSize:12, color:T.textSoft }}>{new Date().toLocaleDateString("fr-FR",{weekday:"short",day:"2-digit",month:"short",year:"numeric"})}</span>
        </div>
      </div>

      <div style={{ padding:"24px 28px", maxWidth:1400, margin:"0 auto" }}>

        {/* HERO CLIENT */}
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:"24px 28px", marginBottom:20, boxShadow:"0 2px 8px rgba(0,0,0,0.05)", borderLeft:`5px solid ${T.indigo}` }}>
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:16 }}>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
                <div style={{ width:48, height:48, background:`linear-gradient(135deg,${T.indigo}22,${T.teal}22)`, border:`2px solid ${T.indigo}33`, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <span style={{ fontSize:20, fontWeight:900, color:T.indigo }}>{client.name.charAt(0)}</span>
                </div>
                <div>
                  <div style={{ fontSize:22, fontWeight:800, color:T.text }}>{client.name}</div>
                  <div style={{ fontSize:12, color:T.textSoft, marginTop:2 }}>Client depuis {fmtDate(client.created)} · SIRET {client.siret}</div>
                </div>
              </div>
              <div style={{ display:"flex", gap:16, flexWrap:"wrap", marginTop:6 }}>
                <span style={{ fontSize:12, color:T.textMed }}>📍 {client.address}</span>
                <span style={{ fontSize:12, color:T.textMed }}>📞 {client.phone}</span>
                <span style={{ fontSize:12, color:T.textMed }}>✉️ {client.email}</span>
              </div>
            </div>
            {/* Stats rapides */}
            <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
              <StatPill label="CA Total"    value={fmt(caTotal)}   color={T.indigo}/>
              <StatPill label="Projets"     value={nbProjets}      color={T.teal}/>
              <StatPill label="Interventions" value={nbInterv}     color={T.sage}/>
              <StatPill label="Planifiées"  value={nbPlanifiees}   color={T.violet}/>
            </div>
          </div>
        </div>

        {/* GRILLE PRINCIPALE */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 320px", gap:20 }}>

          {/* COLONNE GAUCHE */}
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

            {/* ONGLETS */}
            <div style={{ display:"flex", gap:3, background:T.card, border:`1px solid ${T.border}`, borderRadius:10, padding:4, width:"fit-content", boxShadow:"0 1px 4px rgba(0,0,0,0.04)" }}>
              {[["projets","📁 Projets & Interventions"],["contacts","👥 Contacts"],["historique","📋 Historique"]].map(([key,label])=>(
                <button key={key} onClick={()=>setActiveTab(key)} style={{ cursor:"pointer", padding:"7px 18px", borderRadius:7, fontSize:12, fontWeight:700, border:"none", background:activeTab===key?T.card:"transparent", color:activeTab===key?T.indigo:T.textMed, boxShadow:activeTab===key?"0 1px 4px rgba(0,0,0,0.08)":"none", transition:"all 0.15s" }}>
                  {label}
                </button>
              ))}
            </div>

            {/* PROJETS & INTERVENTIONS */}
            {activeTab==="projets" && (
              <div>
                {projets.map(p=><ProjetAccordeon key={p.id} projet={p}/>)}
              </div>
            )}

            {/* CONTACTS */}
            {activeTab==="contacts" && (
              <Card title="Contacts de l'entreprise" accent={T.teal}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                  {contacts.map(ct=>{
                    const c=TYPE_CONTACT_COLOR[ct.type]||T.textSoft;
                    return (
                      <div key={ct.id} style={{ padding:"14px 16px", borderRadius:10, border:`1px solid ${c}25`, background:`${c}08` }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                          <div style={{ width:34, height:34, borderRadius:10, background:`${c}18`, border:`1px solid ${c}30`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                            <span style={{ fontSize:14, fontWeight:800, color:c }}>{ct.name.charAt(0)}</span>
                          </div>
                          <Badge label={ct.type} color={c}/>
                        </div>
                        <div style={{ fontSize:13, fontWeight:700, color:T.text, marginBottom:4 }}>{ct.name}</div>
                        <div style={{ fontSize:11, color:T.textSoft, marginBottom:2 }}>✉️ {ct.email}</div>
                        <div style={{ fontSize:11, color:T.textSoft }}>📞 {ct.phone}</div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* HISTORIQUE */}
            {activeTab==="historique" && (
              <Card title="Historique des contacts" accent={T.violet}
                action={
                  <button onClick={()=>setShowModal(true)} style={{ cursor:"pointer", padding:"6px 14px", borderRadius:8, border:"none", background:`linear-gradient(135deg,${T.indigo},${T.teal})`, color:"#fff", fontSize:12, fontWeight:700 }}>
                    + Ajouter
                  </button>
                }>
                <div style={{ position:"relative" }}>
                  {/* Ligne verticale timeline */}
                  <div style={{ position:"absolute", left:16, top:0, bottom:0, width:2, background:T.border, borderRadius:1 }}/>
                  {historique.map((h,idx)=>{
                    const c=HISTORIQUE_COLOR[h.type]||T.textSoft;
                    return (
                      <div key={h.id} style={{ display:"flex", gap:16, marginBottom:idx<historique.length-1?20:0, position:"relative" }}>
                        {/* Dot */}
                        <div style={{ width:32, height:32, borderRadius:"50%", background:`${c}15`, border:`2px solid ${c}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, zIndex:1 }}>
                          <span style={{ fontSize:12 }}>{h.type==="Appel"?"📞":h.type==="Email"?"✉️":h.type==="Réunion"?"🤝":"📝"}</span>
                        </div>
                        <div style={{ flex:1, paddingTop:4 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                              <Badge label={h.type} color={c}/>
                              <span style={{ fontSize:11, color:T.textSoft, fontWeight:600 }}>{h.auteur}</span>
                            </div>
                            <span style={{ fontSize:11, color:T.textSoft }}>{fmtDate(h.date)}</span>
                          </div>
                          <div style={{ fontSize:13, color:T.textMed, lineHeight:1.5, padding:"10px 14px", background:T.cardAlt, borderRadius:8, border:`1px solid ${T.border}` }}>
                            {h.note}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>

          {/* COLONNE DROITE */}
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

            {/* CA PAR PROJET */}
            <Card title="CA par projet" accent={T.sage}>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={caByProjet} margin={{ top:4, right:4, left:0, bottom:4 }}>
                  <XAxis dataKey="name" tick={{ fontSize:10, fill:T.textSoft, fontFamily:"inherit" }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fontSize:10, fill:T.textSoft, fontFamily:"inherit" }} axisLine={false} tickLine={false} width={42} tickFormatter={n=>n>=1000?`${(n/1000).toFixed(0)}k`:n}/>
                  <Tooltip contentStyle={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, fontSize:12 }} formatter={v=>[fmt(v),"CA"]}/>
                  <Bar dataKey="ca" radius={[5,5,0,0]}>
                    {caByProjet.map((_,i)=><Cell key={i} fill={[T.indigo,T.teal,T.sage][i%3]} opacity={0.85}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div style={{ marginTop:12, paddingTop:12, borderTop:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:11, color:T.textSoft, fontWeight:700, textTransform:"uppercase" }}>Total</span>
                <span style={{ fontSize:16, fontWeight:800, color:T.indigo }}>{fmt(caTotal)}</span>
              </div>
            </Card>

            {/* INTERVENTIONS PLANIFIÉES */}
            <Card title="Prochaines interventions" accent={T.violet}>
              {projets.flatMap(p=>p.interventions.filter(i=>i.status==="Planifié").map(i=>({...i,projet:p.name}))).length===0
                ? <div style={{ fontSize:12, color:T.textSoft, textAlign:"center", padding:"16px 0" }}>Aucune intervention planifiée</div>
                : projets.flatMap(p=>p.interventions.filter(i=>i.status==="Planifié").map(i=>({...i,projet:p.name})))
                    .sort((a,b)=>new Date(a.date)-new Date(b.date))
                    .map((i,idx)=>{
                      const d=diffDays(i.date);
                      const dc=d<=3?T.rose:d<=7?T.amber:T.violet;
                      return (
                        <div key={i.id} style={{ padding:"10px 0", borderBottom:idx>0?`1px solid ${T.border}`:"none" }}>
                          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                            <span style={{ fontSize:12, fontWeight:700, color:T.text }}>{i.name}</span>
                            <span style={{ fontSize:11, fontWeight:700, color:dc }}>{d<=0?"Auj.":`J-${d}`}</span>
                          </div>
                          <div style={{ fontSize:11, color:T.textSoft, marginBottom:4 }}>{i.projet}</div>
                          <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                            {i.agents.map(a=>(
                              <span key={a} style={{ fontSize:10, padding:"2px 7px", borderRadius:20, background:T.tealL, color:T.teal, fontWeight:600 }}>{a}</span>
                            ))}
                          </div>
                        </div>
                      );
                    })
              }
            </Card>

            {/* CONTACTS RAPIDES */}
            <Card title="Contacts principaux" accent={T.teal}>
              {contacts.filter(c=>["Principal","Secondaire"].includes(c.type)).map(ct=>{
                const c=TYPE_CONTACT_COLOR[ct.type]||T.textSoft;
                return (
                  <div key={ct.id} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                    <div style={{ width:32, height:32, borderRadius:8, background:`${c}18`, border:`1px solid ${c}25`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <span style={{ fontSize:13, fontWeight:800, color:c }}>{ct.name.charAt(0)}</span>
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:T.text }}>{ct.name}</div>
                      <div style={{ fontSize:11, color:T.textSoft }}>{ct.email}</div>
                    </div>
                    <Badge label={ct.type} color={c}/>
                  </div>
                );
              })}
            </Card>

          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ padding:"14px 28px", fontSize:11, color:T.textSoft, textAlign:"center", borderTop:`1px solid ${T.border}`, background:T.card, marginTop:24 }}>
        Qualidal · Fiche Client · {USE_MOCK?"Données de démonstration":"Bubble Live"}
      </div>

      {/* MODAL */}
      {showModal && <ModalContact onClose={()=>setShowModal(false)} onSave={addHistorique}/>}
    </div>
  );
}

const USE_MOCK = true;
