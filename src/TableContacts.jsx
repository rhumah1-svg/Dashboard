import { useState, useEffect, useMemo } from "react";
import { fetchAllPages } from "./api";

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
};

const TYPE_COLOR = {
  "Principal":T.indigo, "À mettre en copie":T.amber,
  "Contact sur site":T.teal, "Facturation":T.violet, "Autre - À préciser":T.textSoft,
};
const ALL_TYPES = Object.keys(TYPE_COLOR);

const normalizeType = v => {
  if (!v) return "Autre - À préciser";
  if (typeof v === "string") return v;
  if (typeof v === "object") return v.display || v.name || "Autre - À préciser";
  return String(v);
};

// ─── FETCH CONTACTS (via API sécurisée) ───────────────────────────────────────
async function fetchContacts() {
  const [rawContacts, rawCompanies] = await Promise.all([
    fetchAllPages("contacts"),
    fetchAllPages("companies"),
  ]);
  const companyById = Object.fromEntries(rawCompanies.map(c => [c._id, c.name || "—"]));
  return rawContacts.map(c => ({
    id: c._id,
    first_last_name: c.first_last_name || c["first last name"] || c.name || "Sans nom",
    type_contact: normalizeType(c.type_contact),
    email: c.email || "",
    phone: c.phone || c.telephone || "",
    _company_attached: companyById[c._company_attached] || "—",
  }));
}

// ─── EXPORT CSV ───────────────────────────────────────────────────────────────
function exportCSV(rows, filename = "contacts_qualidal.csv") {
  const headers = ["Nom", "Entreprise", "Email", "Téléphone", "Type"];
  const escape  = v => `"${String(v || "").replace(/"/g, '""')}"`;
  const lines   = rows.map(r => [
    escape(r.first_last_name), escape(r._company_attached),
    escape(r.email), escape(r.phone), escape(r.type_contact),
  ].join(";"));
  const blob = new Blob(["\uFEFF" + [headers.join(";"), ...lines].join("\n")], { type:"text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ─── COMPOSANTS ───────────────────────────────────────────────────────────────
function Badge({ label, color }) {
  const c = color || TYPE_COLOR[label] || T.textSoft;
  return <span style={{ fontSize:11, fontWeight:600, padding:"3px 9px", borderRadius:20, color:c, background:`${c}18`, border:`1px solid ${c}30`, whiteSpace:"nowrap" }}>{label}</span>;
}

function Avatar({ name, color }) {
  return (
    <div style={{ width:32, height:32, borderRadius:8, flexShrink:0, background:`${color}18`, border:`1px solid ${color}30`, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <span style={{ fontSize:13, fontWeight:800, color }}>{(name||"?").charAt(0).toUpperCase()}</span>
    </div>
  );
}

function SortIcon({ active, dir }) {
  if (!active) return <span style={{ color:T.border, marginLeft:4, fontSize:10 }}>↕</span>;
  return <span style={{ color:T.indigo, marginLeft:4, fontSize:10 }}>{dir === "asc" ? "↑" : "↓"}</span>;
}

// ─── PAGE PRINCIPALE ──────────────────────────────────────────────────────────
export default function TableContacts() {
  const [contacts, setContacts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [search,         setSearch]         = useState("");
  const [selectedTypes,  setSelectedTypes]  = useState(new Set());
  const [sortKey,  setSortKey]  = useState("first_last_name");
  const [sortDir,  setSortDir]  = useState("asc");
  const [selected, setSelected] = useState(new Set());

  useEffect(() => {
    fetchContacts()
      .then(data => { setContacts(data); setLoading(false); })
      .catch(e   => { setError("Erreur chargement : " + e.message); setLoading(false); });
  }, []);

  const filtered = useMemo(() => {
    let rows = contacts.filter(c => {
      const q = search.toLowerCase().trim();
      if (q && !c.first_last_name.toLowerCase().includes(q) && !c.email.toLowerCase().includes(q) && !c._company_attached.toLowerCase().includes(q)) return false;
      if (selectedTypes.size > 0 && !selectedTypes.has(c.type_contact)) return false;
      return true;
    });
    rows.sort((a, b) => {
      const va = (a[sortKey] || "").toLowerCase();
      const vb = (b[sortKey] || "").toLowerCase();
      return sortDir === "asc" ? va.localeCompare(vb, "fr") : vb.localeCompare(va, "fr");
    });
    return rows;
  }, [contacts, search, selectedTypes, sortKey, sortDir]);

  const toggleType = t => setSelectedTypes(p => { const n=new Set(p); n.has(t)?n.delete(t):n.add(t); return n; });
  const toggleRow  = id=> setSelected(p => { const n=new Set(p); n.has(id)?n.delete(id):n.add(id); return n; });
  const toggleAll  = () => selected.size === filtered.length ? setSelected(new Set()) : setSelected(new Set(filtered.map(r => r.id)));
  const onSort = key => { if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc"); else { setSortKey(key); setSortDir("asc"); } };

  const hasFilters   = !!(search || selectedTypes.size > 0);
  const resetFilters = () => { setSearch(""); setSelectedTypes(new Set()); };
  const activeCount  = selectedTypes.size + (search ? 1 : 0);
  const selectedRows = contacts.filter(c => selected.has(c.id));
  const allChecked   = selected.size > 0 && selected.size === filtered.length;
  const someChecked  = selected.size > 0 && selected.size < filtered.length;
  const today        = new Date().toISOString().slice(0, 10);

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"60vh", fontFamily:"'Nunito','Segoe UI',sans-serif" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ width:40, height:40, border:`3px solid ${T.border}`, borderTopColor:T.indigo, borderRadius:"50%", animation:"spin 0.8s linear infinite", margin:"0 auto 14px" }}/>
        <div style={{ fontSize:13, color:T.textSoft }}>Chargement des contacts…</div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"60vh", fontFamily:"'Nunito','Segoe UI',sans-serif" }}>
      <div style={{ textAlign:"center", padding:32, background:T.card, borderRadius:14, border:`1px solid ${T.rose}33` }}>
        <div style={{ fontSize:32, marginBottom:12 }}>⚠️</div>
        <div style={{ fontSize:14, color:T.rose, fontWeight:700, marginBottom:8 }}>{error}</div>
        <button onClick={() => window.location.reload()} style={{ padding:"8px 18px", borderRadius:8, border:`1px solid ${T.border}`, background:T.card, color:T.textMed, fontSize:13, fontWeight:600, cursor:"pointer" }}>Réessayer</button>
      </div>
    </div>
  );

  return (
    <div style={{ background:T.bg, minHeight:"100vh", fontFamily:"'Nunito','Segoe UI',sans-serif", color:T.text, padding:24 }}>
      <style>{`
        ::-webkit-scrollbar{width:5px;height:5px;}
        ::-webkit-scrollbar-track{background:${T.bg};}
        ::-webkit-scrollbar-thumb{background:${T.borderMd};border-radius:3px;}
        input{font-family:'Nunito','Segoe UI',sans-serif;}
        .tc-row:hover{background:${T.cardAlt} !important;}
        .tc-row.sel{background:${T.indigoL} !important;}
        .tc-sort{cursor:pointer;user-select:none;display:flex;align-items:center;}
        .tc-sort:hover span{color:${T.indigo};}
        .tc-pill{cursor:pointer;transition:all 0.15s;}
        .tc-pill:hover{opacity:0.85;}
      `}</style>

      <div style={{ maxWidth:1300, margin:"0 auto" }}>
        <div style={{ marginBottom:20, display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12 }}>
          <div>
            <h1 style={{ fontSize:22, fontWeight:800, color:T.text, margin:0 }}>👥 Annuaire contacts</h1>
            <p style={{ fontSize:12, color:T.textSoft, margin:"4px 0 0" }}>
              {filtered.length} contact{filtered.length > 1 ? "s" : ""} affiché{filtered.length > 1 ? "s" : ""}
              {hasFilters && ` · ${contacts.length} au total`}
            </p>
          </div>
          <div style={{ display:"flex", gap:10 }}>
            {selected.size > 0 && (
              <button onClick={() => exportCSV(selectedRows, `contacts_selection_${today}.csv`)}
                style={{ padding:"8px 16px", borderRadius:8, border:`1px solid ${T.sage}40`, background:T.sageL, color:T.sage, fontSize:12, fontWeight:700, cursor:"pointer" }}>
                ⬇ Sélection ({selected.size})
              </button>
            )}
            <button onClick={() => exportCSV(filtered, `contacts_qualidal_${today}.csv`)}
              style={{ padding:"8px 16px", borderRadius:8, border:"none", background:`linear-gradient(135deg,${T.indigo},${T.teal})`, color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer" }}>
              ⬇ Exporter CSV{filtered.length !== contacts.length ? ` (${filtered.length})` : ""}
            </button>
          </div>
        </div>

        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:16, marginBottom:16, boxShadow:"0 1px 4px rgba(0,0,0,0.04)" }}>
          <div style={{ display:"flex", gap:12, marginBottom:14, alignItems:"center" }}>
            <div style={{ position:"relative", flex:1 }}>
              <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", fontSize:14, color:T.textSoft, pointerEvents:"none" }}>🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par nom, email, entreprise…"
                style={{ width:"100%", padding:"9px 12px 9px 36px", border:`1.5px solid ${T.border}`, borderRadius:8, fontSize:13, color:T.text, background:T.bg, outline:"none", boxSizing:"border-box" }} />
            </div>
            {hasFilters && (
              <button onClick={resetFilters}
                style={{ padding:"9px 14px", borderRadius:8, border:`1px solid ${T.rose}40`, background:T.roseL, color:T.rose, fontSize:12, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap" }}>
                ✕ Reset{activeCount > 0 ? ` (${activeCount})` : ""}
              </button>
            )}
          </div>
          <div style={{ display:"flex", alignItems:"center", flexWrap:"wrap", gap:6 }}>
            <span style={{ fontSize:10, color:T.textSoft, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", marginRight:4, flexShrink:0 }}>Type</span>
            {ALL_TYPES.map(t => {
              const c = TYPE_COLOR[t] || T.textSoft;
              const active = selectedTypes.has(t);
              const count = contacts.filter(ct => ct.type_contact === t).length;
              return (
                <span key={t} className="tc-pill" onClick={() => toggleType(t)}
                  style={{ fontSize:11, fontWeight:600, padding:"4px 10px", borderRadius:20,
                    color: active ? "#fff" : c, background: active ? c : `${c}15`,
                    border: `1.5px solid ${active ? c : `${c}35`}` }}>
                  {t} <span style={{ opacity:0.7 }}>({count})</span>{active && " ✓"}
                </span>
              );
            })}
          </div>
        </div>

        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, overflow:"hidden", boxShadow:"0 2px 6px rgba(0,0,0,0.04)" }}>
          <div style={{ display:"grid", gridTemplateColumns:"40px 1fr 160px 220px 200px 150px", gap:12, padding:"10px 16px", background:T.cardAlt, borderBottom:`2px solid ${T.border}` }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center" }}>
              <input type="checkbox" checked={allChecked} ref={el => { if (el) el.indeterminate = someChecked; }} onChange={toggleAll} style={{ cursor:"pointer", accentColor:T.indigo }} />
            </div>
            {[
              { k:"first_last_name", label:"Nom" },
              { k:"type_contact", label:"Type" },
              { k:"_company_attached", label:"Entreprise" },
              { k:"email", label:"Email" },
              { k:"phone", label:"Téléphone" },
            ].map(({ k, label }) => (
              <div key={k} className="tc-sort" onClick={() => onSort(k)}>
                <span style={{ fontSize:11, color:T.textSoft, fontWeight:700, letterSpacing:"0.05em", textTransform:"uppercase" }}>{label}</span>
                <SortIcon active={sortKey === k} dir={sortDir} />
              </div>
            ))}
          </div>

          <div style={{ maxHeight:620, overflowY:"auto" }}>
            {filtered.length === 0 ? (
              <div style={{ padding:"40px 32px", textAlign:"center", color:T.textSoft, fontSize:13 }}>
                <div style={{ fontSize:32, marginBottom:10 }}>🔍</div>
                Aucun contact ne correspond aux filtres
              </div>
            ) : filtered.map((c, idx) => {
              const typeColor = TYPE_COLOR[c.type_contact] || T.textSoft;
              const isSel = selected.has(c.id);
              return (
                <div key={c.id} className={`tc-row${isSel ? " sel" : ""}`}
                  style={{ display:"grid", gridTemplateColumns:"40px 1fr 160px 220px 200px 150px", gap:12, padding:"11px 16px",
                    background: isSel ? T.indigoL : idx % 2 === 0 ? T.card : T.cardAlt,
                    borderBottom:`1px solid ${T.border}`, alignItems:"center", transition:"background 0.1s" }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <input type="checkbox" checked={isSel} onChange={() => toggleRow(c.id)} style={{ cursor:"pointer", accentColor:T.indigo }} />
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:10, minWidth:0 }}>
                    <Avatar name={c.first_last_name} color={typeColor} />
                    <span style={{ fontSize:13, fontWeight:700, color:T.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.first_last_name}</span>
                  </div>
                  <div><Badge label={c.type_contact} /></div>
                  <span style={{ fontSize:12, color:T.textMed, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {c._company_attached !== "—" ? `🏢 ${c._company_attached}` : <span style={{ color:T.border }}>—</span>}
                  </span>
                  <a href={`mailto:${c.email}`} style={{ fontSize:12, color: c.email ? T.indigo : T.border, textDecoration:"none", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", display:"block" }} title={c.email}>{c.email || "—"}</a>
                  <a href={`tel:${c.phone}`} style={{ fontSize:12, color: c.phone ? T.textMed : T.border, textDecoration:"none" }}>{c.phone || "—"}</a>
                </div>
              );
            })}
          </div>

          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 16px", borderTop:`2px solid ${T.border}`, background:T.cardAlt, flexWrap:"wrap", gap:10 }}>
            <span style={{ fontSize:12, color:T.textSoft }}>
              {selected.size > 0 && <><span style={{ color:T.indigo, fontWeight:700 }}>{selected.size} sélectionné{selected.size > 1 ? "s" : ""}</span> · </>}
              {filtered.length} résultat{filtered.length > 1 ? "s" : ""}{hasFilters ? ` sur ${contacts.length}` : ""}
            </span>
            <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
              {ALL_TYPES.map(t => {
                const count = contacts.filter(c => c.type_contact === t).length;
                if (!count) return null;
                return (
                  <div key={t} style={{ display:"flex", alignItems:"center", gap:4 }}>
                    <div style={{ width:8, height:8, borderRadius:"50%", background:TYPE_COLOR[t] || T.textSoft, flexShrink:0 }}/>
                    <span style={{ fontSize:10, color:T.textSoft }}>{t} ({count})</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
