// Petites fonctions utilitaires pour gerer le token JWT cote client.
// Le token est stocke dans localStorage - acceptable ici car ceci est
// une vraie application Next.js (pas un artifact Claude), executee
// dans le navigateur de l'utilisateur.

const TOKEN_KEY = "smart_facture_token";
const USER_KEY = "smart_facture_user";

export type StoredUser = {
  email: string;
  fullName: string;
};

export function saveAuth(token: string, user: StoredUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): StoredUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isAuthenticated(): boolean {
  return getToken() !== null;
}

// Wrapper autour de fetch qui ajoute automatiquement le header
// Authorization: Bearer <token> - a utiliser pour tous les appels
// vers les routes protegees (/api/factures/*, /api/dashboard/*)
export async function authFetch(url: string, options: RequestInit = {}) {
  const token = getToken();
  const headers = new Headers(options.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  const res = await fetch(url, { ...options, headers });

  // Token expire ou invalide -> deconnexion automatique
  if (res.status === 401) {
    clearAuth();
    window.location.href = "/login";
  }

  return res;
}
