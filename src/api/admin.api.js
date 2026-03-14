// ─────────────────────────────────────────────────────────────────────────────
// admin.api.js — API réelle pour la gestion des utilisateurs (ROLE_ADMIN)
// ─────────────────────────────────────────────────────────────────────────────
import api from "@/api/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// ── React Query hooks ─────────────────────────────────────────────────────────

export function useUsers() {
  return useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const { data } = await api.get("/api/users");
      return data.sort((a, b) => {
        if (a.statut !== b.statut) return a.statut === "ACTIF" ? -1 : 1;
        return a.nom.localeCompare(b.nom);
      });
    },
  });
}

export function useUser(id) {
  return useQuery({
    queryKey: ["admin", "user", id],
    queryFn: async () => {
      const { data } = await api.get(`/api/users/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) =>
      api.post("/api/users", payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin"] });
    },
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }) =>
      api.put(`/api/users/${id}`, payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin"] });
    },
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/api/users/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin"] });
      toast.success("Utilisateur supprimé");
    },
  });
}

/** Reçoit { id, statut } — le nouveau statut à appliquer */
export function useToggleStatutUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, statut }) =>
      api.patch(`/api/users/${id}/statut?statut=${statut}`).then((r) => r.data),
    onSuccess: (user) => {
      qc.invalidateQueries({ queryKey: ["admin"] });
      toast.success(
        user.statut === "ACTIF" ? "Compte réactivé" : "Compte désactivé",
      );
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: ({ id, motDePasse }) =>
      api
        .patch(`/api/users/${id}/reinitialiser-motdepasse`, { motDePasse })
        .then((r) => r.data),
    onSuccess: () => {
      toast.success("Mot de passe réinitialisé");
    },
  });
}

export function useEmployesSansCompte() {
  return useQuery({
    queryKey: ["admin", "sans-compte"],
    queryFn: async () => {
      const { data } = await api.get("/api/employes/sans-user");
      return data;
    },
  });
}

/**
 * Crée un compte utilisateur depuis une fiche employé.
 * Reçoit { employe, email, roles, motDePasse }
 * 1. POST /api/users  → crée le compte
 * 2. PATCH /api/employes/{id}/associer-compte → lie l'employé au compte
 */
export function useCreerCompteDepuisEmploye() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ employe, email, roles, motDePasse }) => {
      const { data: newUser } = await api.post("/api/users", {
        nom: employe.nom,
        prenom: employe.prenom,
        email,
        motDePasse,
        roles,
        telephone: employe.telephone ?? null,
        service: employe.departement ?? null,
      });
      await api.patch(`/api/employes/${employe.id}/associer-compte`, {
        userId: newUser.id,
      });
      return newUser;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin"] });
      toast.success("Compte utilisateur créé avec succès");
    },
  });
}
