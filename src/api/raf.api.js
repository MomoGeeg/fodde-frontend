// ============================================================
// API RAF — appels vers le backend Spring Boot
// ============================================================
import api from "@/api/axios";
import useAuthStore from "@/stores/auth.store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const getUserId = () => useAuthStore.getState().user?.id;

export const rafApi = {
  // ─── KPI & Alertes ──────────────────────────────────────
  getProjets: () => api.get("/api/projets").then((r) => r.data),

  // ─── Missions ────────────────────────────────────────────
  getMissions: () => api.get("/api/missions").then((r) => r.data).catch(() => []),
  validerMission: (id) => api.patch(`/api/missions/${id}/valider`, { userId: getUserId() }),
  rejeterMission: (id, motif) => api.patch(`/api/missions/${id}/rejeter`, { motif, userId: getUserId() }),

  // ─── Acquisitions ────────────────────────────────────────
  getAcquisitions: () => api.get("/api/acquisitions").then((r) => r.data).catch(() => []),
  validerAcquisition: (id) => api.patch(`/api/acquisitions/${id}/valider`, { userId: getUserId() }),
  rejeterAcquisition: (id, motif) => api.patch(`/api/acquisitions/${id}/rejeter`, { motif, userId: getUserId() }),

  // ─── Rapports ────────────────────────────────────────────
  getRapports: () => api.get("/api/rapports").then((r) => r.data).catch(() => []),
  genererRapport: (params) =>
    api.post("/api/rapports/generer", params, { params: { userId: getUserId() } }).then((r) => r.data),
};

// ── Hooks — Projets RAF ───────────────────────────────────────────────────────

export function useProjetsRAF() {
  return useQuery({
    queryKey: ["projets"],
    queryFn: () => api.get("/api/projets").then((r) => r.data),
  });
}

// ── Hooks — Budgets Annuels ───────────────────────────────────────────────────

export function useBudgetsAnnuels() {
  return useQuery({
    queryKey: ["budgets-annuels"],
    queryFn: () => api.get("/api/budgets-annuels").then((r) => r.data),
  });
}

export function useCreerBudgetAnnuel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => {
      const userId = getUserId();
      return api
        .post("/api/budgets-annuels", payload, { params: { userId } })
        .then((r) => r.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["budgets-annuels"] });
      toast.success("Budget annuel créé");
    },
    onError: (err) =>
      toast.error(err?.response?.data?.message || "Erreur lors de la création"),
  });
}

export function useActiverBudgetAnnuel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) =>
      api.patch(`/api/budgets-annuels/${id}/activer`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["budgets-annuels"] });
      toast.success("Budget annuel activé");
    },
    onError: (err) =>
      toast.error(err?.response?.data?.message || "Erreur lors de l'activation"),
  });
}

// ── Hooks — Allocations Projets ───────────────────────────────────────────────

export function useAllocations(budgetAnnuelId) {
  return useQuery({
    queryKey: ["allocations", budgetAnnuelId],
    queryFn: () =>
      api
        .get("/api/allocations", { params: { budgetAnnuelId } })
        .then((r) => r.data),
    enabled: !!budgetAnnuelId,
  });
}

export function useCreerAllocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => {
      const userId = getUserId();
      return api
        .post("/api/allocations", payload, { params: { userId } })
        .then((r) => r.data);
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["allocations", data.budgetAnnuelId] });
      qc.invalidateQueries({ queryKey: ["budgets-annuels"] });
      toast.success("Allocation projet créée");
    },
    onError: (err) =>
      toast.error(err?.response?.data?.message || "Erreur lors de la création de l'allocation"),
  });
}

export function useAjouterLigneAllocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ allocationId, ...payload }) =>
      api
        .post(`/api/allocations/${allocationId}/lignes`, payload)
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allocations"] });
      toast.success("Ligne budgétaire ajoutée");
    },
    onError: (err) =>
      toast.error(err?.response?.data?.message || "Erreur lors de l'ajout de la ligne"),
  });
}

export function useSoumettreAllocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) =>
      api.patch(`/api/allocations/${id}/soumettre`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allocations"] });
      toast.success("Allocation soumise au Secrétaire Exécutif");
    },
    onError: (err) =>
      toast.error(err?.response?.data?.message || "Erreur lors de la soumission"),
  });
}
