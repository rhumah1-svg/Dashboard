async function fetchClientData(clientName) {
  const [rawCompanies, rawProjects] = await Promise.all([
    _cache.companies || fetchAllPages("companies").then(r=>{ _cache.companies=r; return r; }),
    _cache.projects  || fetchAllPages("projects").then(r=>{ _cache.projects=r; return r; }),
  ]);

  const company = rawCompanies.find(c=>(c.name||"").toLowerCase()===clientName.toLowerCase());
  if(!company) return null;
  const companyId = company._id;

  // ── Exclure les projets archivés ──────────────────────────────────────
  const rawProjectsF = rawProjects.filter(p =>
    p._company_attached === companyId &&
    p["archived?"] !== true
  );
  const projectIds = new Set(rawProjectsF.map(p=>p._id));

  if(rawProjectsF.length===0){
    return {
      client:{ id:company._id, name:company.name||clientName, address:company.adresse_texte||"", phone:company.phone||"", email:company.email||"", siret:company.siret||"", created:company["Created Date"]?.slice(0,10)||"" },
      projets:[], devis:[], contacts:[],
    };
  }

  let rawUsers = [];
  try { rawUsers = _cache.users || await fetchAllPages("user").then(r=>{ _cache.users=r; return r; }); }
  catch(e) { console.warn("[FC] Users inaccessibles:", e.message); }

  const [rawInterventions, rawOffers, rawItems, rawContacts] = await Promise.all([
    _cache.interventions || fetchAllPages("interventions").then(r=>{ _cache.interventions=r; return r; }),
    _cache.offers        || fetchAllPages("offers_history_documents").then(r=>{ _cache.offers=r; return r; }),
    _cache.items         || fetchAllPages("items_devis").then(r=>{ _cache.items=r; return r; }),
    _cache.contacts      || fetchAllPages("contacts").then(r=>{ _cache.contacts=r; return r; }),
  ]);

  const userById = {};
  rawUsers.forEach(u => { userById[u._id] = extractUserEmail(u); });

  const rawIntervF   = rawInterventions.filter(i => projectIds.has(i._project_attached));
  const rawOffersF   = rawOffers.filter(o => projectIds.has(o._project_attached));
  const rawItemsF    = rawItems.filter(i => projectIds.has(i._project_attached));
  const rawContactsF = rawContacts.filter(c => c._company_attached === companyId);

  // ── Calcul montants par projet ─────────────────────────────────────────
  // denomByProj = somme Total HT des items  → montant HT projet
  // numByProj   = somme prix_intervention   → avancement
  const itemsByProj = {}, denomByProj = {}, numByProj = {};
  rawItemsF.forEach(item => {
    const pid         = item._project_attached;
    const ht          = item["Total HT"] || item.Total_HT || 0;
    const prix_interv = item.prix_intervention || item["prix intervention"] || 0;
    if (!pid) return;
    denomByProj[pid] = (denomByProj[pid] || 0) + ht;
    numByProj[pid]   = (numByProj[pid]   || 0) + prix_interv;
    // Items groupés par projet pour affichage détail
    if (!itemsByProj[pid]) itemsByProj[pid] = [];
    itemsByProj[pid].push({
      id:          item._id,
      designation: item.designation || "",
      quantity:    item.quantity || item.quantite || 0,
      unit:        item.unit || item.OS_product_unit || "",
      price_ht:    item.price_HT || item.prix_unitaire || 0,
      total_ht:    ht,
    });
  });

  const resolveUser = id => {
    if (!id) return "";
    if (typeof id === "string" && id.includes("@")) return id;
    return userById[id] || "";
  };

  // ── Map interventions par projet ───────────────────────────────────────
  const intervByProj = {};
  rawIntervF.forEach(i => {
    const pid = i._project_attached;
    if (!intervByProj[pid]) intervByProj[pid] = [];
    intervByProj[pid].push({
      id:      i._id,
      name:    i.name || "Sans nom",
      status:  normalizeType(i.intervention_status || i.OS_project_intervention_status) || "—",
      date:    i.date ? i.date.slice(0,10) : i["Created Date"]?.slice(0,10),
      agents:  toArray(i._list_user_concerned).map(id => resolveUser(id)),
      rapport: resolveUser(i._user_report_assigned),
    });
  });

  // ── Map projets ────────────────────────────────────────────────────────
  const projets = rawProjectsF.map(p => ({
    id:           p._id,
    name:         p.name || "",
    status:       p.OS_devis_status || "",
    type:         normalizeType(p.OS_prestations_type) || "",
    address:      extractAddr(p.chantier_address || p.address),
    ca_total:     denomByProj[p._id] || 0,
    avancement:   denomByProj[p._id] > 0
                    ? Math.min((numByProj[p._id] || 0) / denomByProj[p._id], 1)
                    : 0,
    interventions: intervByProj[p._id] || [],
  }));

  // ── Map devis ──────────────────────────────────────────────────────────
  // montant_ht = total items du projet lié (offer_document_item non rempli)
  const projectMap = Object.fromEntries(rawProjectsF.map(p => [p._id, p]));
  const devis = rawOffersF.map(o => ({
    id:              o._id,
    offer_number:    o.offer_number || o.devis_number || o._id,
    project_id:      o._project_attached,
    project_name:    projectMap[o._project_attached]?.name || "",
    os_devis_statut: o.os_devis_statut || projectMap[o._project_attached]?.OS_devis_status || "",
    date_offre:      o.date_offre ? o.date_offre.slice(0,10) : o["Created Date"]?.slice(0,10),
    date_validite:   o.date_validite ? o.date_validite.slice(0,10) : null,
    montant_ht:      denomByProj[o._project_attached] || 0, // ← par projet
    is_active:       o.is_active !== false,
    items:           itemsByProj[o._project_attached] || [], // ← items du projet
  }));

  // ── Map contacts ───────────────────────────────────────────────────────
  const contacts = rawContactsF.map(c => ({
    id:    c._id,
    name:  c.first_last_name || c.Nom || c.nom || c.name || "Sans nom",
    type:  normalizeType(c.type_contact || c.role_contact_projet),
    email: c.email || "",
    phone: c.phone || c.telephone || "",
  }));

  return {
    client: {
      id:      company._id,
      name:    company.name || clientName,
      address: company.adresse_texte || extractAddr(company.address) || "",
      phone:   company.phone || "",
      email:   company.email || "",
      siret:   company.siret || "",
      created: company["Created Date"]?.slice(0,10) || "",
    },
    projets, devis, contacts,
  };
}
