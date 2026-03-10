import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

// ─── THÈME (importé depuis App) ───────────────────────────────────────────────
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
const STATUTS_SIGNES=["Devis signé","Projet terminé"];
const STATUTS_PIPELINE=["Chiffrage en cours","Validé par l'administration","Devis envoyé","A relancer","Relance envoyée"];
const STATUTS_ACTIFS_SYNTHESE=["Saisie d'information","Chiffrage en cours","Validé par l'administration","Devis envoyé","A relancer","Relance envoyée","Devis signé","Projet terminé"];

const S_COLOR={
  "Saisie d'information":T.textSoft,"Chiffrage en cours":T.sky,"Validé par l'administration":T.violet,
  "Devis envoyé":T.indigo,"Devis signé":T.sage,"Projet terminé":"#2E7A4E",
  "A relancer":T.amber,"Relance envoyée":T.coral,"Classé sans suite":T.rose,"Non formalisé":T.textSoft,
};

const fmt     = n => new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(n||0);
const fmtK    = n => n>=1000000?`${(n/1000000).toFixed(1)}M€`:n>=1000?`${Math.round(n/1000)}k€`:`${n}€`;
const diffDays= d => d?Math.ceil((new Date(d)-new Date())/86400000):null;
const inRange  = (d,from,to) => { if(!from&&!to)return true; if(from&&d<from)return false; if(to&&d>to)return false; return true; };

// ─── COMPOSANTS UI LOCAUX ─────────────────────────────────────────────────────
function KpiCard({label,value,sub,color,pct=0}){
  return (
    <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,padding:"20px 22px",boxShadow:"0 2px 6px rgba(0,0,0,0.05)",borderLeft:`4px solid ${color}`}}>
      <div style={{fontSize:10,color:T.textSoft,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>{label}</div>
      <div style={{fontSize:24,fontWeight:800,color,marginBottom:4,lineHeight:1}}>{value}</div>
      <div style={{fontSize:11,color:T.textMed,marginBottom:12}}>{sub}</div>
      <div style={{height:4,background:T.border,borderRadius:2}}>
        <div style={{height:4,background:color,width:`${Math.min(pct,100)}%`,borderRadius:2,transition:"width 0.6s"}}/>
      </div>
    </div>
  );
}

function Badge({label,color}){
  const c=color||S_COLOR[label]||T.textSoft;
  return <span style={{fontSize:11,fontWeight:600,padding:"3px 9px",borderRadius:20,color:c,background:`${c}18`,border:`1px solid ${c}30`,whiteSpace:"nowrap"}}>{label}</span>;
}

function SearchInput({value,onChange,placeholder}){
  return (
    <div style={{position:"relative",flex:1,minWidth:200}}>
      <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",fontSize:13,color:T.textSoft,pointerEvents:"none"}}>🔍</span>
      <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder||"Rechercher…"}
        style={{width:"100%",padding:"7px 10px 7px 30px",border:`1.5px solid ${T.border}`,borderRadius:8,fontSize:12,color:T.text,background:T.bg,outline:"none",boxSizing:"border-box"}}/>
    </div>
  );
}

function MultiSelect({label,options,selected,onChange,colorMap}){
  const [open,setOpen]=useState(false);
  const ref=useState(null);
  const toggle=v=>onChange(selected.includes(v)?selected.filter(x=>x!==v):[...selected,v]);
  return (
    <div style={{position:"relative"}}>
      <button onClick={()=>setOpen(o=>!o)}
        style={{padding:"7px 12px",border:`1.5px solid ${selected.length?T.indigo:T.border}`,borderRadius:8,background:selected.length?T.indigoL:T.bg,color:selected.length?T.indigo:T.textMed,fontSize:12,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
        {label}{selected.length>0&&<span style={{background:T.indigo,color:"#fff",borderRadius:10,padding:"1px 6px",fontSize:10}}>{selected.length}</span>}
        <span style={{fontSize:9,opacity:0.6}}>{open?"▲":"▼"}</span>
      </button>
      {open&&(
        <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,zIndex:200,background:T.card,border:`1px solid ${T.border}`,borderRadius:10,boxShadow:"0 8px 24px rgba(0,0,0,0.12)",minWidth:220,padding:6}}>
          {options.map(o=>{
            const active=selected.includes(o);
            const c=colorMap?.[o]||T.textSoft;
            return (
              <div key={o} onClick={()=>toggle(o)}
                style={{padding:"7px 10px",borderRadius:7,cursor:"pointer",display:"flex",alignItems:"center",gap:8,background:active?`${c}12`:"transparent"}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:c,flexShrink:0}}/>
                <span style={{fontSize:12,color:active?c:T.text,fontWeight:active?700:400,flex:1}}>{o}</span>
                {active&&<span style={{fontSize:10,color:c}}>✓</span>}
              </div>
            );
          })}
          {selected.length>0&&<div onClick={()=>onChange([])} style={{padding:"6px 10px",borderTop:`1px solid ${T.border}`,marginTop:4,fontSize:11,color:T.rose,cursor:"pointer",textAlign:"center",fontWeight:600}}>Tout effacer</div>}
        </div>
      )}
    </div>
  );
}

function DateRange({dateFrom,dateTo,onChange}){
  const active=dateFrom||dateTo;
  const inp={border:"none",background:"transparent",fontSize:12,color:T.text,outline:"none",width:110,cursor:"pointer"};
  return (
    <div style={{display:"flex",alignItems:"center",gap:6,padding:"6px 10px",border:`1.5px solid ${active?T.indigo:T.border}`,borderRadius:8,background:active?T.indigoL:T.card}}>
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
export default function TabDevis({offers,selectedCompany,onSelectCompany}){
  const [periodFrom,setPeriodFrom]=useState("");
  const [periodTo,setPeriodTo]=useState("");
  const [search,setSearch]=useState("");
  const [filterStatuts,setFilterStatuts]=useState([]);
  const [dateFrom,setDateFrom]=useState("");
  const [dateTo,setDateTo]=useState("");
  const [sortBy,setSortBy]=useState("date_offre");
  const [sortDir,setSortDir]=useState("desc");
  const [showArchived,setShowArchived]=useState(false);

  const handleSort=k=>{if(sortBy===k)setSortDir(d=>d==="asc"?"desc":"asc");else{setSortBy(k);setSortDir("desc");}};

  const offersInPeriod=useMemo(()=>offers.filter(o=>inRange(o.date_offre,periodFrom,periodTo)),[offers,periodFrom,periodTo]);

  const filtered=useMemo(()=>{
    let rows=offers.filter(o=>showArchived?true:!o.is_archived);
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
  },[offers,search,filterStatuts,dateFrom,dateTo,selectedCompany,sortBy,sortDir,showArchived]);

  const active=offersInPeriod.filter(o=>o.is_active&&!o.is_archived);
  const signe=active.filter(o=>STATUTS_SIGNES.includes(o.os_devis_statut));
  const pipeline=active.filter(o=>STATUTS_PIPELINE.includes(o.os_devis_statut));
  const caSigne=signe.reduce((s,o)=>s+(o.montant_ht||0),0);
  const caPipeline=pipeline.reduce((s,o)=>s+(o.montant_ht||0),0);

  // CA Réel facturé = somme total_facture des projets distincts des devis signés
  const caReelFacture=useMemo(()=>{
    const seen=new Set();
    let total=0;
    signe.forEach(o=>{
      const pid=o._project_attached?.id;
      if(pid&&!seen.has(pid)){
        seen.add(pid);
        total+=(o._project_attached?.total_facture||0);
      }
    });
    return total;
  },[signe]);

  const resteAFacturer=Math.max(0, caSigne - caReelFacture);

  const dansLaCourse=active.filter(o=>o.os_devis_statut!=="Classé sans suite"&&o.os_devis_statut!=="Non formalisé");
  const tauxConv=dansLaCourse.length?Math.round((signe.length/dansLaCourse.length)*100):0;

  const expirent=active.filter(o=>STATUTS_PIPELINE.includes(o.os_devis_statut))
    .map(o=>({...o,daysLeft:diffDays(o.date_validite)}))
    .filter(o=>o.daysLeft!==null&&o.daysLeft<=7).sort((a,b)=>a.daysLeft-b.daysLeft);
  const totalFiltre=filtered.reduce((s,o)=>s+(o.montant_ht||0),0);

  const byStatutActif=STATUTS_ACTIFS_SYNTHESE.map(s=>({
    s,
    count:offersInPeriod.filter(o=>!o.is_archived&&o.os_devis_statut===s).length,
    montant:offersInPeriod.filter(o=>!o.is_archived&&o.os_devis_statut===s).reduce((sum,o)=>sum+(o.montant_ht||0),0),
    color:S_COLOR[s]||T.textSoft,
  })).filter(d=>d.count>0);

  const byStatut=STATUT_DEVIS.map(s=>({
    s:s.length>13?s.slice(0,13)+"…":s,full:s,
    count:offersInPeriod.filter(o=>o.os_devis_statut===s).length,
    montant:offersInPeriod.filter(o=>o.os_devis_statut===s).reduce((sum,o)=>sum+(o.montant_ht||0),0),
  })).filter(d=>d.count>0);

  const hasFilters=search||filterStatuts.length||dateFrom||dateTo||selectedCompany;
  const hasPeriod=periodFrom||periodTo;

  const fmtDate=d=>d?new Date(d).toLocaleDateString("fr-FR"):"—";

  return (
    <div>
      {/* BARRE PÉRIODE KPIs */}
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18,padding:"10px 16px",background:T.card,border:`1px solid ${T.border}`,borderRadius:10,boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
        <span style={{fontSize:12,color:T.textMed,fontWeight:700}}>📅 Période KPIs</span>
        <DateRange dateFrom={periodFrom} dateTo={periodTo} onChange={(f,t)=>{setPeriodFrom(f);setPeriodTo(t);}}/>
        <span style={{fontSize:12,color:hasPeriod?T.indigo:T.textSoft}}>{hasPeriod?`${offersInPeriod.length} devis dans la période`:"Toutes les périodes"}</span>
      </div>

      {/* KPI CARDS — 6 cartes sur 2 lignes */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:14}}>
        <KpiCard label="CA Signé"        value={fmt(caSigne)}        sub={`${signe.length} devis signés`}          color={T.sage}   pct={(caSigne/(caSigne+caPipeline+1))*100}/>
        <KpiCard label="CA Pipeline"     value={fmt(caPipeline)}     sub={`${pipeline.length} en cours`}           color={T.indigo} pct={(caPipeline/(caSigne+caPipeline+1))*100}/>
        <KpiCard label="Taux conversion" value={`${tauxConv}%`}      sub={`sur ${dansLaCourse.length} actifs`}     color={T.violet} pct={tauxConv}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:20}}>
        <KpiCard label="CA Réel facturé" value={fmt(caReelFacture)}  sub="facturé sur devis signés"                color={T.teal}   pct={caSigne>0?(caReelFacture/caSigne)*100:0}/>
        <KpiCard label="Reste à facturer" value={fmt(resteAFacturer)} sub="CA Signé − Réel facturé"                color={T.amber}  pct={caSigne>0?(resteAFacturer/caSigne)*100:0}/>
        <KpiCard label="Expirent ≤7j"    value={expirent.length}     sub={expirent.length>0?"⚠ Action requise":"✓ Tout est ok"} color={expirent.length>0?T.rose:T.sage}/>
      </div>

      {/* GRAPHIQUE + SYNTHÈSE STATUTS */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 340px",gap:14,marginBottom:20}}>
        <Card title="Répartition CA par statut" badge={<PeriodTag on={hasPeriod}/>}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byStatut} margin={{top:4,right:4,left:0,bottom:24}}>
              <XAxis dataKey="s" tick={{fontSize:9,fill:T.textSoft,fontFamily:"inherit"}} axisLine={false} tickLine={false} angle={-20} textAnchor="end"/>
              <YAxis tickFormatter={fmtK} tick={{fontSize:10,fill:T.textSoft,fontFamily:"inherit"}} axisLine={false} tickLine={false} width={46}/>
              <Tooltip contentStyle={{background:T.card,border:`1px solid ${T.border}`,borderRadius:8,fontSize:12,color:T.text}} formatter={(v,_,p)=>[fmt(v),`${p.payload.count} devis`]} labelFormatter={(_,p)=>p[0]?.payload?.full||""}/>
              <Bar dataKey="montant" radius={[5,5,0,0]}>
                {byStatut.map(e=><Cell key={e.full} fill={S_COLOR[e.full]||T.textSoft} opacity={0.85}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Synthèse par statut" badge={<PeriodTag on={hasPeriod}/>}>
          <div style={{display:"flex",flexDirection:"column",gap:5}}>
            {byStatutActif.length===0
              ?<div style={{fontSize:12,color:T.textSoft,textAlign:"center",padding:"16px 0"}}>Aucun devis dans la période</div>
              :byStatutActif.map(d=>{
                const isActive=filterStatuts.includes(d.s);
                return (
                  <div key={d.s}
                    onClick={()=>setFilterStatuts(prev=>prev.includes(d.s)?prev.filter(x=>x!==d.s):[...prev,d.s])}
                    style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",borderRadius:8,cursor:"pointer",
                      background:isActive?`${d.color}15`:T.cardAlt,
                      border:`1.5px solid ${isActive?d.color:T.border}`,transition:"all 0.15s"}}>
                    <div style={{width:9,height:9,borderRadius:"50%",background:d.color,flexShrink:0}}/>
                    <span style={{flex:1,fontSize:12,color:T.text,fontWeight:isActive?700:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.s}</span>
                    <span style={{fontSize:13,fontWeight:700,color:d.color,flexShrink:0,minWidth:20,textAlign:"right"}}>{d.count}</span>
                    <span style={{fontSize:11,color:T.textSoft,flexShrink:0,minWidth:55,textAlign:"right"}}>{d.montant>0?fmtK(d.montant):""}</span>
                  </div>
                );
              })
            }
          </div>
          {filterStatuts.length>0&&(
            <button onClick={()=>setFilterStatuts([])}
              style={{marginTop:10,width:"100%",padding:"6px 0",fontSize:11,color:T.rose,background:T.roseL,border:`1px solid ${T.rose}30`,borderRadius:7,cursor:"pointer",fontWeight:600}}>
              ✕ Réinitialiser les filtres statut
            </button>
          )}
          {expirent.length>0&&(
            <div style={{marginTop:14,paddingTop:12,borderTop:`1px solid ${T.border}`}}>
              <div style={{fontSize:11,color:T.rose,fontWeight:700,textTransform:"uppercase",marginBottom:8}}>⚠ Expirations urgentes</div>
              {expirent.slice(0,4).map(o=>{
                const d=o.daysLeft;const col=d<=0?T.rose:T.amber;
                return(
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

      {/* TABLEAU */}
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden",boxShadow:"0 2px 6px rgba(0,0,0,0.04)"}}>
        <div style={{padding:"16px 20px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",background:T.cardAlt}}>
          <SearchInput value={search} onChange={setSearch} placeholder="Projet, entreprise, référence…"/>
          <MultiSelect label="Statut" options={STATUT_DEVIS} selected={filterStatuts} onChange={setFilterStatuts} colorMap={S_COLOR}/>
          <DateRange dateFrom={dateFrom} dateTo={dateTo} onChange={(f,t)=>{setDateFrom(f);setDateTo(t);}}/>
          {hasFilters&&<button onClick={()=>{setSearch("");setFilterStatuts([]);setDateFrom("");setDateTo("");onSelectCompany(null);}} style={{cursor:"pointer",padding:"7px 13px",background:T.indigoL,border:`1px solid ${T.indigo}44`,borderRadius:8,color:T.indigo,fontSize:12,fontWeight:600}}>Réinitialiser</button>}
          <label style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:T.textMed,cursor:"pointer",userSelect:"none",padding:"6px 10px",borderRadius:8,border:`1.5px solid ${showArchived?T.amber:T.border}`,background:showArchived?T.amberL:T.bg}}>
            <input type="checkbox" checked={showArchived} onChange={e=>setShowArchived(e.target.checked)} style={{accentColor:T.amber,cursor:"pointer"}}/>
            Archivés
          </label>
          <span style={{marginLeft:"auto",fontSize:12,color:T.textSoft,fontWeight:600}}>{filtered.length} résultat{filtered.length>1?"s":""}</span>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"150px 1fr 150px 165px 105px 130px 72px",gap:8,padding:"10px 20px",background:T.cardAlt,borderBottom:`2px solid ${T.border}`}}>
          <ColHeader label="Client ▾"      sortKey="client"     sortBy={sortBy} sortDir={sortDir} onSort={handleSort}/>
          <ColHeader label="Projet ▾"      sortKey="projet"     sortBy={sortBy} sortDir={sortDir} onSort={handleSort}/>
          <ColHeader label="Référence"     sortKey="offer"      sortBy={sortBy} sortDir={sortDir} onSort={handleSort}/>
          <ColHeader label="Statut"        sortKey="statut"     sortBy={sortBy} sortDir={sortDir} onSort={handleSort}/>
          <ColHeader label="Montant HT ▾"  sortKey="montant_ht" sortBy={sortBy} sortDir={sortDir} onSort={handleSort}/>
          <ColHeader label="Avancement ▾"  sortKey="avancement" sortBy={sortBy} sortDir={sortDir} onSort={handleSort}/>
          <ColHeader label="Expir. ▾"      sortKey="expiration" sortBy={sortBy} sortDir={sortDir} onSort={handleSort}/>
        </div>

        <div style={{maxHeight:520,overflowY:"auto"}}>
          {filtered.length===0
            ?<div style={{padding:"40px 20px",textAlign:"center",color:T.textSoft,fontSize:13}}>Aucun résultat pour ces filtres</div>
            :filtered.map((o,idx)=>{
              const d=diffDays(o.date_validite);
              const expColor=d===null?T.textSoft:d<=0?T.rose:d<=7?T.amber:T.textSoft;
              const av=Math.round((o._project_attached?.avancement||0)*100);
              const avColor=av>=80?T.sage:av>=40?T.teal:T.textSoft;
              return (
                <div key={o.id} style={{display:"grid",gridTemplateColumns:"150px 1fr 150px 165px 105px 130px 72px",gap:8,padding:"11px 20px",borderBottom:`1px solid ${T.border}`,alignItems:"center",background:o.is_archived?`${T.amber}08`:idx%2===0?T.card:T.cardAlt,transition:"background 0.1s",opacity:o.is_archived?0.7:1}}
                  onMouseEnter={e=>e.currentTarget.style.background=T.indigoL}
                  onMouseLeave={e=>e.currentTarget.style.background=o.is_archived?`${T.amber}08`:idx%2===0?T.card:T.cardAlt}>
                  <span style={{fontSize:12,fontWeight:700,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o._project_attached?._company_attached?.name||"—"}</span>
                  <span style={{fontSize:12,color:T.textMed,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o._project_attached?.name||"—"}</span>
                  <span style={{fontSize:11,color:T.textSoft,fontFamily:"monospace",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.offer_number}</span>
                  <Badge label={o.os_devis_statut||"—"}/>
                  <span style={{fontSize:13,fontWeight:700,color:T.text,textAlign:"right"}}>{o.montant_ht>0?fmt(o.montant_ht):"0 €"}</span>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <div style={{flex:1,height:5,background:T.border,borderRadius:3}}>
                      <div style={{height:5,background:avColor,width:`${av}%`,borderRadius:3}}/>
                    </div>
                    <span style={{fontSize:10,color:avColor,fontWeight:700,width:28,flexShrink:0}}>{av}%</span>
                  </div>
                  <span style={{fontSize:11,fontWeight:700,color:expColor,textAlign:"right"}}>{d===null?"—":d<=0?"Expiré":`J-${d}`}</span>
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
