/**
 * Service d'authentification — Spring Boot API
 * L'auth passe par le backend, les données par Supabase.
 */
import api from "@/api/axios";

// ── Redirections post-login par rôle ───────────────────────
export const ROLE_HOME_ROUTES = {
  ROLE_RAF: "/raf/tableau-de-bord",
  ROLE_SE: "/dashboard",
  ROLE_RESPONSABLE_PROGRAMMES: "/projets",
  ROLE_COMPTABLE: "/finances/depenses",
  ROLE_RH: "/rh/tableau-de-bord",
  ROLE_RESPONSABLE_SE: "/se/tableau-de-bord",
  ROLE_LOGISTIQUE: "/logistique",
  ROLE_TECHNICIEN_TERRAIN: "/terrain",
  ROLE_CA: "/reporting",
  ROLE_ADMIN: "/",
  ROLE_CHARGE_PROGRAMME: "/projets",
};

/**
 * Connexion email / mot de passe via Spring Boot.
 * @returns {{ token, userId, email, nom, prenom, roles }}
 */
export async function login(email, password) {
  const { data } = await api.post("/api/auth/login", {
    email,
    motDePasse: password,
  });
  return data;
}

/**
 * Déconnexion (côté client uniquement — JWT stateless).
 */
export function logout() {
  localStorage.removeItem("fodde_token");
  localStorage.removeItem("fodde_user");
}

/**
 * Retourne le home route pour un rôle donné.
 */
export function getHomeRouteForRole(roles) {
  if (!roles?.length) return "/";
  for (const role of roles) {
    if (ROLE_HOME_ROUTES[role]) return ROLE_HOME_ROUTES[role];
  }
  return "/";
}
