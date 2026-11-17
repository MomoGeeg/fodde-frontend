import api from "@/api/axios";
import { create } from "zustand";

/**
 * Store Zustand — gère l'authentification via l'API Spring Boot.
 *
 * • `user`            — profil applicatif (token, userId, email, nom, prenom, roles)
 * • `isAuthenticated` — booléen dérivé
 * • `loading`         — true tant que l'init n'est pas terminée
 */
const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  loading: true,

  /* ── Initialisation (appelée une seule fois dans App.jsx) ──────── */
  init: async () => {
    const token = localStorage.getItem("fodde_token");
    const userJson = localStorage.getItem("fodde_user");

    if (token && userJson) {
      try {
        const user = JSON.parse(userJson);
        set({ user, isAuthenticated: true, loading: false });
      } catch {
        localStorage.removeItem("fodde_token");
        localStorage.removeItem("fodde_user");
        set({ loading: false });
      }
    } else {
      set({ loading: false });
    }
  },

  /* ── Login via Spring Boot POST /api/auth/login ────────────────── */
  login: async (email, password) => {
    const { data } = await api.post("/api/auth/login", {
      email,
      motDePasse: password,
    });

    // data = { token, type, userId, email, nom, prenom, roles }
    const user = {
      id: data.userId,
      email: data.email,
      nom: data.nom,
      prenom: data.prenom,
      roles: data.roles ?? [],
      connexionId: data.connexionId ?? null,
    };

    localStorage.setItem("fodde_token", data.token);
    localStorage.setItem("fodde_user", JSON.stringify(user));

    set({ user, isAuthenticated: true });
    return user;
  },

  /* ── Logout ────────────────────────────────────────────────────── */
  logout: () => {
    // Le serveur note l'heure de déconnexion (historique des connexions). Le jeton est passé
    // explicitement : il est retiré du navigateur juste après. Une erreur n'empêche pas de sortir.
    const token = localStorage.getItem("fodde_token");
    const connexionId = get().user?.connexionId;
    if (token && connexionId) {
      api
        .post("/api/auth/deconnexion", { connexionId }, { headers: { Authorization: `Bearer ${token}` } })
        .catch(() => {});
    }
    localStorage.removeItem("fodde_token");
    localStorage.removeItem("fodde_user");
    set({ user: null, isAuthenticated: false });
  },

  /* ── Helpers ───────────────────────────────────────────────────── */
  hasRole: (role) => {
    const { user } = get();
    return user?.roles?.includes(role) ?? false;
  },
}));

export default useAuthStore;
