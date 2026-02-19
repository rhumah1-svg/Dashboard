// ═══════════════════════════════════════════════════════════════════════════════
// src/api.js — Module API centralisé (AUCUN secret côté client)
// ═══════════════════════════════════════════════════════════════════════════════
//
// Ce module gère :
//   ✅ Stockage du token signé (sessionStorage)
//   ✅ Ajout automatique du header Authorization
//   ✅ Auto-logout si le token expire (401)
//   ✅ Pagination Bubble (fetchAllPages)
//   ✅ Aucun secret, aucun token API dans le code
// ═══════════════════════════════════════════════════════════════════════════════

const TOKEN_KEY = "qd_token";
const USER_KEY  = "qd_user";

// ── Token management ──────────────────────────────────────────────────────────

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function getUser() {
  try {
    const raw = sessionStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  return !!getToken();
}

function setSession(token, user) {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}

// ── Callback pour forcer le logout depuis n'importe quel composant ────────────
let _onSessionExpired = null;

export function onSessionExpired(callback) {
  _onSessionExpired = callback;
}

function handleExpired() {
  clearSession();
  if (_onSessionExpired) _onSessionExpired();
}

// ── Login ─────────────────────────────────────────────────────────────────────

export async function login(email, password) {
  const res = await fetch("/api/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim(), password }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Erreur d'authentification");
  }

  setSession(data.token, data.user);

  return {
    user: data.user,
    warning: data.warning || null,
  };
}

export function logout() {
  clearSession();
}

// ── Fetch Bubble (avec token) ─────────────────────────────────────────────────

export async function fetchBubble(table, cursor = 0, constraints = null) {
  const token = getToken();
  if (!token) {
    handleExpired();
    throw new Error("Non authentifié");
  }

  let url = `/api/bubble?table=${encodeURIComponent(table)}&cursor=${cursor}`;
  if (constraints) url += `&constraints=${encodeURIComponent(JSON.stringify(constraints))}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) {
    handleExpired();
    throw new Error("Session expirée — reconnexion nécessaire");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Erreur ${res.status}`);
  }

  return res.json();
}

// ── Fetch toutes les pages (pagination Bubble) ───────────────────────────────

export async function fetchAllPages(table) {
  let results = [];
  let cursor = 0;

  while (true) {
    const data = await fetchBubble(table, cursor);
    const page = data.response?.results || [];
    results = results.concat(page);

    if ((data.response?.remaining ?? 0) === 0) break;
    cursor += page.length;
  }

  return results;
}
