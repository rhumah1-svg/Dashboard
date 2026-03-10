import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

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

const STATUT_INTERV=["Planifié","En cours","Terminé","Annulé"];
const S_COLOR={
  "Planifié":T.violet,"En cours":T.amber,"Terminé":T.sage,"Annulé":T.rose,
};

const fmtDate = d => d ? new Date(d).toLocaleDateString("fr-FR") : "—";
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
  const toggle=v=>onChange(selected.includes(v)?selected.filter(x=>x!==v):[...selected,v]);
  return (
    <div style={{position:"relative"}}>
      <button onClick={()=>setOpen(o=>!o)}
        style={{padding:"7px 12px",border:`1.5px solid ${selected.length?T.teal:T.border}`,borderRadius:8,background:selected.length?T.tealL:T.bg,color:selected.length?T.teal:T.textMed,fontSize:12,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
        {label}{selected.length>0&&<span style={{background:T.teal,color:"#fff",borderRadius:10,padding:"1px 6px",fontSize:10}}>{selected.length}</span>}
        <span style={{fontSize:9,opacity:0.6}}>{open?"▲":"▼"}</span>
      </button>
      {open&&(
        <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,zIndex:200,background:T.card,border:`1px solid ${T.border}`,borderRadius:10,boxShadow:"0 8px 24px rgba(0,0,0,0.12)",minWidth:200,padding:6}}>
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
    <div style={{display:"flex",alignItems:"center",gap:6,padding:"6px 10px",border:`1.5px solid ${active?T.teal:T.border}`,borderRadius:8,background:active?T.tealL:T.card}}>
      <span style={{fontSize:11,color:active?T.teal:T.textSoft,fontWeight:600}}>Du</span>
      <input type="date" value={dateFrom||""} onChange={e=>onChange(e.target.value,dateTo)} style={inp}/>
      <span style={{fontSize:11,color:active?T.teal:T.textSoft,fontWeight:600}}>au</span>
      <input type="date" value={dateTo||""} onChange={e=>onChange(dateFrom,e.target.value)} min={dateFrom||undefined} style={inp}/>
      {active&&<span onClick={()=>onChange("","")} style={{cursor:"pointer",fontSize:15,color:T.textSoft}}>×</span>}
    </div>
  );
}

function ColHeader({label,sortKey,sortBy,sortDir,onSort}){
  const active=sortBy===sortKey;
  return (
    <span onClick={()=>onSort(sortKey)} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:3,userSelect:"none",color:active?T.teal:T.textSoft,fontWeight:active?700:600,fontSize:11}}>
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
  return <span style={{fontSize:10,color:T.teal,background:T.tealL,border:`1px solid ${T.teal}30`,borderRadius:20,padding:"2px 8px",fontWeight:600}}>période filtrée</span>;
}

// ─── ONGLET INTERVENTIONS ─────────────────────────────────────────────────────
export default function TabInterventions({interventions,projects,selectedCompany,onSelectCompany}){
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
  const byRegion={};intervInPeriod.forEach(i=>{const r=i.address?.city||"—";byRegion[r]=(byRegion[r]||0)+1;});
  const regionData=Object.entries(byRegion).sort((a,b)=>b[1]-a[1]).slice(0,12);
  const maxRegion=regionData[0]?.[1]||1;

  const byClientI={};
  intervInPeriod.forEach(i=>{const c=i._project_attached?._company_attached;if(!c)return;if(!byClientI[c.id])byClientI[c.id]={id:c.id,name:c.name,count:0};byClientI[c.id].count++;});
  const topClientsI=Object.values(byClientI).sort((a,b)=>b.count-a.count).slice(0,5);
  const maxClientI=topClientsI[0]?.count||1;

  const moisLabels=["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
  const byMois={};
  interventions.forEach(i=>{if(!i.date)return;const m=new Date(i.date).getMonth();byMois[m]=(byMois[m]||0)+1;});
  const moisData=Array.from({length:12},(_,m)=>({mois:moisLabels[m],count:byMois[m]||0}));

  const hasFilters=search||filterStatuts.length||filterTypes.length||dateFrom||dateTo||selectedCompany;
  const hasPeriod=periodFrom||periodTo;

  return (
    <div>
      {/* BARRE PÉRIODE */}
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18,padding:"10px 16px",background:T.card,border:`1px solid ${T.border}`,borderRadius:10,boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
        <span style={{fontSize:12,color:T.textMed,fontWeight:700}}>📅 Période KPIs</span>
        <DateRange dateFrom={periodFrom} dateTo={periodTo} onChange={(f,t)=>{setPeriodFrom(f);setPeriodTo(t);}}/>
        <span style={{fontSize:12,color:hasPeriod?T.teal:T.textSoft}}>{hasPeriod?`${intervInPeriod.length} interventions dans la période`:"Toutes les périodes"}</span>
      </div>

      {/* KPI CARDS */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:20}}>
        <KpiCard label="Total interventions" value={intervInPeriod.length} sub="dans la période"      color={T.teal}   pct={100}/>
        <KpiCard label="Terminées"           value={terminees.length}      sub={`${Math.round(terminees.length/total*100)}% du total`} color={T.sage} pct={terminees.length/total*100}/>
        <KpiCard label="En cours"            value={enCours.length}        sub="en progression"       color={T.amber}  pct={enCours.length/total*100}/>
        <KpiCard label="Planifiées"          value={planifiees.length}     sub="à venir"              color={T.violet} pct={planifiees.length/total*100}/>
      </div>

      {/* GRAPHIQUES */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 340px",gap:14,marginBottom:20}}>
        <Card title="Interventions par mois" badge={<PeriodTag on={hasPeriod}/>}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={moisData} margin={{top:4,right:4,left:0,bottom:4}}>
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
                  <span style={{color:selectedCompany===c.id?T.teal:T.textMed,fontWeight:selectedCompany===c.id?700:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:155}}>{c.name}</span>
                  <span style={{color:T.textSoft,flexShrink:0,marginLeft:6}}>{c.count}</span>
                </div>
                <div style={{height:4,background:T.border,borderRadius:2}}>
                  <div style={{height:4,background:selectedCompany===c.id?T.teal:i===0?T.teal:T.border,width:`${(c.count/maxClientI)*100}%`,borderRadius:2,transition:"all 0.4s"}}/>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* TABLEAU */}
      <div style={{background:T.card,border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden",boxShadow:"0 2px 6px rgba(0,0,0,0.04)"}}>
        <div style={{padding:"16px 20px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",background:T.cardAlt}}>
          <SearchInput value={search} onChange={setSearch} placeholder="Intervention, projet, entreprise…"/>
          <MultiSelect label="Statut" options={STATUT_INTERV} selected={filterStatuts} onChange={setFilterStatuts} colorMap={S_COLOR}/>
          <MultiSelect label="Type" options={allTypes} selected={filterTypes} onChange={setFilterTypes}/>
          <DateRange dateFrom={dateFrom} dateTo={dateTo} onChange={(f,t)=>{setDateFrom(f);setDateTo(t);}}/>
          {hasFilters&&<button onClick={()=>{setSearch("");setFilterStatuts([]);setFilterTypes([]);setDateFrom("");setDateTo("");onSelectCompany(null);}} style={{cursor:"pointer",padding:"7px 13px",background:T.tealL,border:`1px solid ${T.teal}44`,borderRadius:8,color:T.teal,fontSize:12,fontWeight:600}}>Réinitialiser</button>}
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
                onMouseEnter={e=>e.currentTarget.style.background=T.tealL}
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
