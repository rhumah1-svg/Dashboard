import { useState, useRef, useEffect, useCallback } from "react";

const BASE_KNOWLEDGE = `Tu es l'assistant technique expert du système Qualidal. Tu connais parfaitement toute l'architecture, les workflows, l'API, et la base de données Bubble. Réponds toujours en français.

COMPORTEMENT :
- Tu es un expert technique qui guide l'utilisateur étape par étape
- Quand on te montre une capture d'écran, analyse-la en détail et identifie les problèmes
- Propose des solutions concrètes avec les étapes exactes à suivre dans Bubble/N8N/API
- Si tu apprends une nouvelle info sur le système, retiens-la pour les prochaines questions
- Raisonne à voix haute : explique ton analyse avant de proposer une solution
- Si tu hésites entre plusieurs solutions, présente les options avec leurs avantages/inconvénients
- Utilise des exemples concrets du système Qualidal quand c'est pertinent

=== ARCHITECTURE GLOBALE ===

Le système Qualidal gère des devis de travaux (dallage, réparation béton) avec 3 composants :
1. **Bubble** (portail-qualidal.com) — Frontend + Backend + Base de données
2. **N8N** (cloud) — Orchestration de workflows automatiques
3. **API Python/FastAPI** (Render + local) — Extraction de données PDF via IA

=== API PYTHON (main_v10.py) ===

URL Render : https://invoice-api-0t6l.onrender.com
URL locale : via ngrok (pour traitement en masse)

4 endpoints :
- GET /health → Vérification santé API
- POST /extract → Extraction IA d'un seul PDF (utilisé par WF2 auto)
  - Reçoit : fichier PDF
  - Retourne : metadata (vendor_name, project_name, invoice_number, date, currency), line_items (designation, quantity, unite, unit_price), totals (subtotal_ht, total_tax, total_ttc)
  - Utilise OpenAI gpt-4o-mini avec structured output (Pydantic)

- POST /split → Découpage d'un gros PDF en devis individuels
  - Détecte les numéros DE\\d{4,10} pour identifier les points de coupure
  - Retourne : file_name + pdf_base64 pour chaque devis

- POST /split-light → Split + metadata regex (SANS IA, rapide)
  - Utilisé par WF1 pour le traitement en masse
  - Extrait vendor_name, project_name, invoice_number par regex
  - Retourne aussi drive_path calculé pour OneDrive
  - Regex vendor : cherche ligne après "Monsieur/Madame" ou ligne majuscules après bloc Qualidal
  - Regex project : cherche dans tableau après "Chantier", coupe avant date JJ/MM/AAAA, nettoie mots parasites (de l'offre, Date, Condition, VIREMENT)
  - Regex invoice : DE\\d{4,10} → formaté en devis_deXXXXXX

- POST /split-and-extract → Split + extraction IA en masse (plus lourd, lots de 5)

=== WORKFLOWS N8N ===

**WF1 — Traitement en masse (ponctuel, manuel)**
Objectif : Découper un gros PDF contenant plusieurs devis et les classer dans OneDrive
Flux : Manuel → Chercher fichier → Télécharger → /split-light (local ngrok) → Séparer résultats (ItemLists fieldToSplitOut=results) → Préparer fichiers & dossiers ($input.all()) → Upload OneDrive
Structure OneDrive : /TEST/{Lettre}/{Entreprise}/{Projet}/Devis et commande/{invoice_number}.pdf
Note : Pas d'IA, pas de Bubble. Juste du classement de fichiers. Le noeud Préparer utilise $input.all() pour traiter tous les items d'un coup.

**WF2 — Automatique (continu, chaque minute)**
Objectif : Détecter les nouveaux PDFs dans OneDrive, extraire les données et les envoyer vers Bubble
Deux modes d'entrée :
- Auto : OneDrive Trigger (surveille /TEST avec folderChild=true, chaque minute)
- Manuel : Health check Render → Config fenêtre temporelle (MINUTES variable) → Chercher PDFs récursif via Graph API → Extraire fichiers PDF → Filtrer par createdDateTime → IF récent

Flux commun après détection :
IF devis PDF (name startsWith "devis" AND endsWith ".pdf") → Extract company & project from path → Share file (anonymous view) → Upload to Bubble (upload_offer_document)
→ Télécharger PDF → API Render /extract (timeout 120s) → Préparer lignes (avec getBubbleUnit mapping) → Créer produit si inexistant → Upload item to Bubble (upload_devis_item)

Le nœud "Extract company & project from path" lit le chemin OneDrive :
path = item.parentReference.path décodé, segments séparés par /
company_name = segments[2], project_code = segments[3] (si "devis et commande" → utilise company_name)
offer_number = nom fichier sans .pdf

Mapping des unités (getBubbleUnit) :
- m2/m² → m², ml/m → ml, h/heure → Heures, j/jour → Jours
- sem/semaine → Semaine, forf/forfait/ff/ens → Forfait, défaut → U

Wake-up Render : GET /health avec retryOnFail=true, waitBetweenTries=5000

=== BASE DE DONNÉES BUBBLE ===

**Tables principales :**

1. Projects
   - project_code (text) — code unique du projet
   - name (text)
   - _company_attached (Companies) — lien vers l'entreprise
   - OS_devis_status — statut du devis ("Saisie d'information" par défaut)
   - Montant_ajustement (number) — ajustement manuel du montant

2. Companies
   - name (text) — nom de l'entreprise

3. Offers_history_documents
   - offer_number (text) — ex: "devis_de00001898"
   - _project_attached (Projects)
   - file_url (text) — URL OneDrive partagée
   - is_active (yes/no, default: yes) — checkbox pour inclure/exclure du calcul total
   - date_offre (date) — actuellement Current date/time
   - os_devis_statut — "Devis signé" par défaut

4. Items_devis
   - _project_attached (Projects)
   - offer_document_item (Offers_history_documents) — lien vers le devis
   - _product_attached (Products)
   - designation (text)
   - quantity (number)
   - unit (text) — m², ml, Forfait, U, Heures, Jours, Semaine
   - price_HT (number)
   - Total_HT (number)
   - description (text)
   - is_intervention (yes/no)

5. Products
   - name (text) — nom du produit
   - product_code (text) — "PRDT" + timestamp + random 3 chars (pour éviter doublons)

6. Contact_projet (liaison many-to-many)
   - contact_projet_attache (Contacts)
   - projet_contact_attache (Projects)
   - role_contact_projet (OS_contact_type)
   - email (text)
   - Nom (text)

=== BACKENDS BUBBLE (API Workflows) ===

1. upload_offer_document
   Paramètres : file_url, offer_number, project_code, company_name
   Actions (dans l'ordre CORRECT — entreprise AVANT projet) :
   1. Create Companies (Only when Search Companies name=company_name count=0)
   2. Create Projects (Only when Search Projects project_code=project_code count=0) — avec _company_attached = Search Companies:first item, OS_devis_status = "Saisie d'information"
   3. Create Offers_history_documents (Only when count=0) — avec is_active = yes
   4. Make changes to Offers_history_documents (file_url, etc.)
   5. Make changes to Projects (Only when _company_attached is empty) — _company_attached = Search Companies:first item

2. create_product_if_not_exists
   Paramètre : designation
   Action : Create Products (Only when Search name=designation count=0)
   - name = designation, product_code = "PRDT" + timestamp + random 3 chars

3. upload_devis_item
   Paramètres : project_code, designation, quantite, prix_unitaire, prix_total, numero_devis, Unit
   Action : Create Items_devis avec condition anti-doublon
   - Only when : Search Items_devis where offer_document_item + _product_attached + quantity + price_HT count = 0

=== INTERFACE BUBBLE (Frontend) ===

**Page Dashboard — Onglet Devis :**
- RepeatingGroup Offres (type: Offers_history_documents) — liste les devis du projet
  - Group Offers_history_documents (data: Current cell's)
    - Checkbox A (auto-binding is_active) pour sélectionner/désélectionner un devis
  - Preview PDF, numéro devis, dates

- RepeatingGroup Produits devis (type: Items_devis)
  - Data source par défaut : Search Items_devis where _project_attached = Parent group's Projects
  - Condition : quand Search Offers_history_documents where _project_attached count > 0
    → Data source = Search Items_devis where _project_attached AND offer_document_item is in Search Offers_history_documents where is_active = yes
  - Affiche : produit (searchbox), unité, quantité, prix unitaire, total HT, toggle intervention

- Total HT = RG Produits devis's List:each item's Total HT:sum + Montant ajustement €

**Contacts :**
- Table Contact_projet pour liaison many-to-many avec rôles
- Contact principal via dropdown → crée Contact_projet avec rôle Principal
- Contacts secondaires dans RepeatingGroup avec dropdown type de contact
- Workflow : dropdown value changed → Make changes to Parent group's Contact_projet

=== STRUCTURE ONEDRIVE ===
Dossier surveillé : ID = 9703C0B58BCB25AD!s633fb5d0cd424bbb8b0d047442d77b1a
Structure : /TEST/{Lettre}/{Entreprise}/{Projet}/Devis et commande/{devis_number}.pdf
Le WF1 crée les dossiers automatiquement (API Graph PUT crée les dossiers intermédiaires).
Le WF2 surveille le dossier TEST et ses sous-dossiers (folderChild: true).

=== PASSAGE EN PRODUCTION ===
- Changer ID dossier OneDrive dans trigger
- Changer URL API : ngrok → Render (ou nouveau serveur)
- Changer token Bubble : test_xxx → live_xxx
- Changer URL Bubble : /version-test/ → /
- Changer base_folder dans API : /TEST → /NOM_PROD
- Les backends Bubble sont les mêmes en test et live

=== PROBLÈMES CONNUS ET SOLUTIONS ===
- Render plan gratuit : cold start 30-60s → nœud health check avec retry
- N8N SplitInBatches v3 : sortie index 0 = done, index 1 = loop items. Retour boucle sur index 1
- Regex project_name : pdfplumber mélange les colonnes du tableau → nettoyer mots parasites
- Vendor sans "Monsieur/Madame" : fallback vers ligne majuscules après bloc Qualidal
- 79 devis en masse : utiliser /split-light (pas d'IA) + WF2 auto pour l'extraction
- Doublons produits : acceptés temporairement, product_code unique avec timestamp+random
- is_active checkbox : auto-binding nécessite Privacy Rules avec "Allow auto-binding" coché`;

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [learnedContext, setLearnedContext] = useState([]);
  const [attachedImages, setAttachedImages] = useState([]);
  const [showMemory, setShowMemory] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load memory on mount
  useEffect(() => {
    const loadMemory = async () => {
      try {
        const result = await window.storage.get("qualidal-memory");
        if (result?.value) {
          const parsed = JSON.parse(result.value);
          setLearnedContext(parsed.learned || []);
          setMessages(parsed.messages || [{
            role: "assistant",
            content: "Salut ! Je suis l'assistant technique Qualidal. Je connais toute ton architecture : workflows N8N, API Python, base Bubble, structure OneDrive...\n\n📸 Tu peux m'envoyer des captures d'écran avec le bouton 📎\n🧠 J'apprends et mémorise les nouvelles infos au fil de nos échanges\n💡 Je raisonne étape par étape pour t'aider\n\nPose-moi n'importe quelle question !"
          }]);
        } else {
          setMessages([{
            role: "assistant",
            content: "Salut ! Je suis l'assistant technique Qualidal. Je connais toute ton architecture : workflows N8N, API Python, base Bubble, structure OneDrive...\n\n📸 Tu peux m'envoyer des captures d'écran avec le bouton 📎\n🧠 J'apprends et mémorise les nouvelles infos au fil de nos échanges\n💡 Je raisonne étape par étape pour t'aider\n\nPose-moi n'importe quelle question !"
          }]);
        }
      } catch {
        setMessages([{
          role: "assistant",
          content: "Salut ! Je suis l'assistant technique Qualidal. Je connais toute ton architecture : workflows N8N, API Python, base Bubble, structure OneDrive...\n\n📸 Tu peux m'envoyer des captures d'écran avec le bouton 📎\n🧠 J'apprends et mémorise les nouvelles infos au fil de nos échanges\n💡 Je raisonne étape par étape pour t'aider\n\nPose-moi n'importe quelle question !"
        }]);
      }
    };
    loadMemory();
  }, []);

  // Save memory on changes
  useEffect(() => {
    if (messages.length <= 1) return;
    const saveMemory = async () => {
      try {
        await window.storage.set("qualidal-memory", JSON.stringify({
          learned: learnedContext,
          messages: messages.slice(-20), // Keep last 20 messages
        }));
      } catch {}
    };
    saveMemory();
  }, [messages, learnedContext]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(",")[1];
        const mediaType = file.type || "image/png";
        setAttachedImages(prev => [...prev, {
          base64, mediaType, name: file.name,
          preview: reader.result,
        }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removeImage = (index) => {
    setAttachedImages(prev => prev.filter((_, i) => i !== index));
  };

  const sendMessage = async () => {
    if ((!input.trim() && attachedImages.length === 0) || loading) return;

    const userText = input.trim();
    setInput("");
    const images = [...attachedImages];
    setAttachedImages([]);

    const userMsg = {
      role: "user",
      content: userText,
      images: images.map(img => img.preview),
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      // Build conversation for API
      const apiMessages = [];
      const recentMessages = messages.slice(-14);

      for (const msg of recentMessages) {
        if (msg.role === "user") {
          const content = [];
          if (msg.images?.length) {
            msg.images.forEach(img => {
              const b64 = img.split(",")[1] || img;
              content.push({
                type: "image",
                source: { type: "base64", media_type: "image/png", data: b64 },
              });
            });
          }
          if (msg.content) content.push({ type: "text", text: msg.content });
          apiMessages.push({ role: "user", content });
        } else {
          apiMessages.push({ role: "assistant", content: msg.content });
        }
      }

      // Current message
      const currentContent = [];
      images.forEach(img => {
        currentContent.push({
          type: "image",
          source: { type: "base64", media_type: img.mediaType, data: img.base64 },
        });
      });
      if (userText) currentContent.push({ type: "text", text: userText });
      apiMessages.push({ role: "user", content: currentContent });

      // System prompt with learned context
      const learnedSection = learnedContext.length > 0
        ? "\n\n=== CONNAISSANCES APPRISES ===\n" + learnedContext.join("\n")
        : "";

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: BASE_KNOWLEDGE + learnedSection,
          messages: apiMessages,
        }),
      });

      const data = await response.json();
      const text = data.content
        ?.map(item => (item.type === "text" ? item.text : ""))
        .filter(Boolean)
        .join("\n") || "Erreur de réponse.";

      setMessages(prev => [...prev, { role: "assistant", content: text }]);

      // Auto-learn: detect new knowledge
      if (userText.toLowerCase().includes("en fait") ||
          userText.toLowerCase().includes("maintenant") ||
          userText.toLowerCase().includes("j'ai changé") ||
          userText.toLowerCase().includes("j'ai ajouté") ||
          userText.toLowerCase().includes("j'ai créé") ||
          userText.toLowerCase().includes("le champ s'appelle") ||
          userText.toLowerCase().includes("la table") ||
          userText.toLowerCase().includes("retiens")) {
        const newFact = `[${new Date().toLocaleDateString('fr-FR')}] Info utilisateur: ${userText.substring(0, 200)}`;
        setLearnedContext(prev => [...prev.slice(-30), newFact]);
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "Erreur de connexion. Vérifie ta connexion et réessaie." },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const addMemory = () => {
    const fact = prompt("Nouvelle info à mémoriser :");
    if (fact?.trim()) {
      setLearnedContext(prev => [...prev, `[${new Date().toLocaleDateString('fr-FR')}] ${fact.trim()}`]);
    }
  };

  const clearMemory = async () => {
    if (confirm("Supprimer toute la mémoire apprise ?")) {
      setLearnedContext([]);
      try { await window.storage.delete("qualidal-memory"); } catch {}
    }
  };

  const clearChat = () => {
    setMessages([{
      role: "assistant",
      content: "Conversation réinitialisée. Ma mémoire et mes connaissances sont intactes.\n\nComment puis-je t'aider ?"
    }]);
  };

  const quickQuestions = [
    "Comment fonctionne le WF1 ?",
    "Structure de la base Bubble ?",
    "Comment passer en prod ?",
    "Explique le flux d'un devis",
  ];

  return (
    <div style={{
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      background: "#0a0f1c",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      color: "#e2e8f0",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{
        padding: "12px 20px",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        borderBottom: "1px solid rgba(59, 130, 246, 0.2)",
        display: "flex", alignItems: "center", gap: 12, flexShrink: 0,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, fontWeight: 700,
          boxShadow: "0 0 20px rgba(59, 130, 246, 0.3)",
        }}>Q</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Assistant Qualidal</div>
          <div style={{ fontSize: 10, color: "#64748b" }}>
            🧠 {learnedContext.length} mémoires · Architecture · Workflows · API · Bubble
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => setShowMemory(!showMemory)} title="Mémoire"
            style={headerBtnStyle}>{showMemory ? "✕" : "🧠"}</button>
          <button onClick={addMemory} title="Ajouter une info"
            style={headerBtnStyle}>+</button>
          <button onClick={clearChat} title="Nouvelle conversation"
            style={headerBtnStyle}>🔄</button>
        </div>
      </div>

      {/* Memory Panel */}
      {showMemory && (
        <div style={{
          padding: "12px 20px",
          background: "rgba(30, 41, 59, 0.95)",
          borderBottom: "1px solid rgba(59, 130, 246, 0.2)",
          maxHeight: 200, overflowY: "auto",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#93c5fd" }}>
              🧠 Mémoire apprise ({learnedContext.length})
            </span>
            {learnedContext.length > 0 && (
              <button onClick={clearMemory} style={{
                fontSize: 11, color: "#ef4444", background: "none", border: "none", cursor: "pointer",
              }}>Tout supprimer</button>
            )}
          </div>
          {learnedContext.length === 0 ? (
            <div style={{ fontSize: 12, color: "#475569", fontStyle: "italic" }}>
              Aucune mémoire pour l'instant. J'apprends automatiquement quand tu me donnes de nouvelles infos, ou tu peux ajouter manuellement avec le bouton +
            </div>
          ) : (
            learnedContext.map((item, i) => (
              <div key={i} style={{
                fontSize: 11, padding: "4px 0",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                color: "#94a3b8", display: "flex", justifyContent: "space-between",
              }}>
                <span style={{ flex: 1 }}>{item}</span>
                <button onClick={() => setLearnedContext(prev => prev.filter((_, idx) => idx !== i))}
                  style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 11, padding: "0 4px" }}>✕</button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: "auto", padding: "16px 20px",
        display: "flex", flexDirection: "column", gap: 14,
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: "flex",
            justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
          }}>
            <div style={{
              maxWidth: "85%",
              padding: "10px 14px",
              borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
              background: msg.role === "user"
                ? "linear-gradient(135deg, #3b82f6, #2563eb)"
                : "rgba(30, 41, 59, 0.8)",
              border: msg.role === "user" ? "none" : "1px solid rgba(59, 130, 246, 0.1)",
              fontSize: 13, lineHeight: 1.65, whiteSpace: "pre-wrap", wordBreak: "break-word",
            }}>
              {msg.images?.length > 0 && (
                <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                  {msg.images.map((img, j) => (
                    <img key={j} src={img} alt="" style={{
                      maxWidth: 180, maxHeight: 120, borderRadius: 8,
                      border: "1px solid rgba(255,255,255,0.1)",
                    }} />
                  ))}
                </div>
              )}
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{
              padding: "12px 16px",
              borderRadius: "14px 14px 14px 4px",
              background: "rgba(30, 41, 59, 0.8)",
              border: "1px solid rgba(59, 130, 246, 0.1)",
              display: "flex", gap: 6, alignItems: "center",
            }}>
              {[0, 1, 2].map(idx => (
                <div key={idx} style={{
                  width: 7, height: 7, borderRadius: "50%", background: "#3b82f6",
                  animation: `pulse 1.4s ease-in-out ${idx * 0.2}s infinite`,
                }} />
              ))}
              <span style={{ fontSize: 11, color: "#64748b", marginLeft: 6 }}>Réflexion...</span>
            </div>
          </div>
        )}

        {messages.length <= 1 && !loading && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
            {quickQuestions.map((q, i) => (
              <button key={i} onClick={() => { setInput(q); inputRef.current?.focus(); }}
                style={{
                  padding: "7px 13px", borderRadius: 20,
                  border: "1px solid rgba(59, 130, 246, 0.25)",
                  background: "rgba(59, 130, 246, 0.06)",
                  color: "#93c5fd", fontSize: 12, cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={e => { e.target.style.background = "rgba(59, 130, 246, 0.15)"; }}
                onMouseLeave={e => { e.target.style.background = "rgba(59, 130, 246, 0.06)"; }}
              >{q}</button>
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Attached Images Preview */}
      {attachedImages.length > 0 && (
        <div style={{
          padding: "8px 20px",
          background: "rgba(30, 41, 59, 0.6)",
          borderTop: "1px solid rgba(59, 130, 246, 0.1)",
          display: "flex", gap: 8, flexWrap: "wrap",
        }}>
          {attachedImages.map((img, i) => (
            <div key={i} style={{ position: "relative" }}>
              <img src={img.preview} alt="" style={{
                height: 56, borderRadius: 8,
                border: "1px solid rgba(59, 130, 246, 0.3)",
              }} />
              <button onClick={() => removeImage(i)} style={{
                position: "absolute", top: -6, right: -6,
                width: 18, height: 18, borderRadius: "50%",
                background: "#ef4444", border: "none", color: "#fff",
                fontSize: 10, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>✕</button>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{
        padding: "12px 20px",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        borderTop: "1px solid rgba(59, 130, 246, 0.15)",
        flexShrink: 0,
      }}>
        <div style={{
          display: "flex", gap: 8, alignItems: "flex-end",
          background: "rgba(15, 23, 42, 0.6)",
          borderRadius: 14,
          border: "1px solid rgba(59, 130, 246, 0.2)",
          padding: "6px 10px",
        }}>
          <input type="file" ref={fileInputRef} accept="image/*" multiple
            onChange={handleImageUpload} style={{ display: "none" }} />
          <button onClick={() => fileInputRef.current?.click()}
            title="Joindre une capture d'écran"
            style={{
              width: 34, height: 34, borderRadius: 8, border: "none",
              background: attachedImages.length > 0 ? "rgba(59, 130, 246, 0.3)" : "rgba(59, 130, 246, 0.1)",
              color: "#93c5fd", cursor: "pointer", fontSize: 16,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>📎</button>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pose une question ou envoie une capture..."
            rows={1}
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              color: "#e2e8f0", fontSize: 13, fontFamily: "inherit",
              resize: "none", lineHeight: 1.5, maxHeight: 100,
            }}
          />
          <button onClick={sendMessage}
            disabled={loading || (!input.trim() && attachedImages.length === 0)}
            style={{
              width: 34, height: 34, borderRadius: 8, border: "none",
              background: loading || (!input.trim() && !attachedImages.length)
                ? "rgba(59, 130, 246, 0.15)"
                : "linear-gradient(135deg, #3b82f6, #8b5cf6)",
              color: "#fff",
              cursor: loading || (!input.trim() && !attachedImages.length) ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, flexShrink: 0,
              boxShadow: loading || (!input.trim() && !attachedImages.length) ? "none" : "0 0 12px rgba(59, 130, 246, 0.3)",
            }}>↑</button>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(59, 130, 246, 0.3); border-radius: 3px; }
        textarea::placeholder { color: #475569; }
      `}</style>
    </div>
  );
}

const headerBtnStyle = {
  width: 32, height: 32, borderRadius: 8,
  border: "1px solid rgba(59, 130, 246, 0.2)",
  background: "rgba(59, 130, 246, 0.08)",
  color: "#93c5fd", cursor: "pointer", fontSize: 14,
  display: "flex", alignItems: "center", justifyContent: "center",
};

export default App;
