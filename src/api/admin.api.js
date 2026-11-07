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

// ── Lien entre compte utilisateur et fiche employé ───────────────────────────

/**
 * Fiches employé et comptes, pour relier l'un à l'autre :
 * - fichesLiees : fiches déjà associées, avec le compte correspondant ;
 * - comptesLibres : comptes qui ne sont liés à aucune fiche.
 */
export function useLiensComptesFiches() {
  return useQuery({
    queryKey: ["admin", "liens"],
    queryFn: async () => {
      const [{ data: employes }, { data: users }] = await Promise.all([api.get("/api/employes"), api.get("/api/users")]);
      const comptes = new Map(users.map((u) => [u.id, u]));
      const pris = new Set(employes.map((e) => e.userId).filter(Boolean));
      return {
        fichesLiees: employes
          .filter((e) => e.userId)
          .map((e) => ({ ...e, compte: comptes.get(e.userId) ?? null }))
          .sort((a, b) => `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`)),
        comptesLibres: users
          .filter((u) => !pris.has(u.id))
          .sort((a, b) => `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`)),
      };
    },
  });
}

/** Associe une fiche employé à un compte existant. */
export function useAssocierCompte() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ employeId, userId }) =>
      api.patch(`/api/employes/${employeId}/associer-compte`, { userId }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin"] });
      toast.success("Compte associé à la fiche");
    },
    onError: (err) => toast.error(err?.response?.data?.erreur ?? "Association impossible"),
  });
}

/** Retire le lien entre une fiche et son compte. */
export function useDissocierCompte() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (employeId) => api.patch(`/api/employes/${employeId}/dissocier-compte`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin"] });
      toast.success("Lien retiré");
    },
    onError: (err) => toast.error(err?.response?.data?.erreur ?? "Opération impossible"),
  });
}
