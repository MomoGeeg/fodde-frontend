// ─────────────────────────────────────────────────────────────────────────────
// secretariat.api.js — API Espace Secrétariat Exécutif
// ─────────────────────────────────────────────────────────────────────────────
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/api/axios";
import useAuthStore from "@/stores/auth.store";

// ── KPI — agrégation de plusieurs endpoints ───────────────────────────────────
async function fetchKPI() {
  const today = new Date().toISOString().slice(0, 10);
  const in30Days = new Date(Date.now() + 30 * 86400_000).toISOString().slice(0, 10);

  const [projetsRes, employesRes, statsRes, depAttRes, avancesRes] = await Promise.all([
    api.get("/api/projets"),
    api.get("/api/employes"),
    api.get("/api/depenses/stats/mois-courant"),
    api.get("/api/depenses?statut=EN_APPROBATION_SE"),
    api.get("/api/avances?justifiee=false").catch(() => ({ data: [] })),
  ]);

  const projets = projetsRes.data ?? [];
  const employes = employesRes.data ?? [];
  const depensesMoisCourant = statsRes.data?.total ?? 0;
  const depAttente = Array.isArray(depAttRes.data) ? depAttRes.data : [];
  const avances = Array.isArray(avancesRes.data) ? avancesRes.data : [];

  // Contrats CDD dont la date de fin est dans les 30 prochains jours
  const contratsEcheance30j = employes.filter(
    (e) =>
      e.statut === "ACTIF" &&
      e.typeContrat === "CDD" &&
      e.dateFinContrat &&
      e.dateFinContrat >= today &&
      e.dateFinContrat <= in30Days
  ).length;

  return {
    projetsActifs: projets.filter((p) => p.statut === "ACTIF").length,
    projetsEnRetard: projets.filter(
      (p) => p.statut === "ACTIF" && p.dateFin && p.dateFin < today
    ).length,
    projetsEnValidation: projets.filter((p) => p.statut === "EN_VALIDATION").length,
    depensesMoisCourant,
    depensesEnAttenteApprobation: depAttente.length,
    avancesNonJustifiees: avances.length,
    contratsEcheance30j,
    employes: {
      actifs: employes.filter((e) => e.statut === "ACTIF").length,
      suspendus: employes.filter((e) => e.statut === "SUSPENDU").length,
    },
  };
}

// ── Validations — projets EN_VALIDATION + dépenses EN_APPROBATION_SE + budgets EN_VALIDATION ──
async function fetchValidations() {
  // Projets et dépenses en parallèle (toujours disponibles)
  const [projetsRes, depensesRes] = await Promise.all([
    api.get("/api/projets"),
    api.get("/api/depenses?statut=EN_APPROBATION_SE"),
  ]);

  // Allocations en attente de validation SE
  let budgetsData = [];
  try {
    const allocRes = await api.get("/api/allocations/en-validation");
    budgetsData = allocRes.data ?? [];
  } catch {
    // Silencieux — endpoint non accessible selon le rôle
  }

  const projets = projetsRes.data ?? [];

  const projetsEnValidation = projets
    .filter((p) => p.statut === "EN_VALIDATION")
    .map((p) => ({
      id: p.id,
      type: "PROJET",
      titre: p.titre,
      statut: p.statut,
      dateSoumission: p.createdAt,
      projetId: p.id,
    }));

  const depensesEnApprobation = (Array.isArray(depensesRes.data) ? depensesRes.data : []).map(
    (d) => ({
      id: d.id,
      type: "DEPENSE",
      titre: d.libelle,
      montant: d.montant,
      statut: d.statut,
      dateSoumission: d.createdAt,
      depenseId: d.id,
    })
  );

  const budgetsEnValidation = budgetsData.map((b) => ({
    id: b.id,
    type: "ALLOCATION",
    titre: `Allocation — ${b.projetTitre ?? b.projetCode ?? "Projet inconnu"} (${b.exercice ?? ""})`,
    reference: b.projetCode ?? "",
    soumetteur: b.soumisParNom ?? "RAF",
    montant: b.montantAlloue,
    statut: b.statut,
    dateSoumission: b.createdAt,
    projetId: b.projetId,
    allocationId: b.id,
  }));

  return [...projetsEnValidation, ...depensesEnApprobation, ...budgetsEnValidation].sort(
    (a, b) => new Date(a.dateSoumission) - new Date(b.dateSoumission)
  );
}

// ── React Query hooks ─────────────────────────────────────────────────────────

export function useKPISE() {
  return useQuery({
    queryKey: ["secretariat", "kpi"],
    queryFn: fetchKPI,
    staleTime: 30_000,
  });
}

export function useValidationsSE() {
  return useQuery({
    queryKey: ["secretariat", "validations"],
    queryFn: fetchValidations,
    staleTime: 0,
  });
}

export function useAlertesSE() {
  return useQuery({
    queryKey: ["secretariat", "alertes"],
    queryFn: async () => {
      const { data } = await api.get("/api/alertes");
      // Normalise createdAt → date pour la compatibilité avec le template
      return (data ?? []).map((a) => ({ ...a, date: a.createdAt ?? a.date }));
    },
    staleTime: 30_000,
  });
}

export function useAlertesNonLuesCount() {
  return useQuery({
    queryKey: ["secretariat", "alertes", "non-lues"],
    queryFn: async () => {
      const { data } = await api.get("/api/alertes");
      return (data ?? []).filter((a) => !a.lue).length;
    },
    refetchInterval: 60_000,
  });
}

// ── Mutations projets ─────────────────────────────────────────────────────────

export function useApprouverProjet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, commentaire }) => {
      const { user } = useAuthStore.getState();
      return api
        .patch(`/api/projets/${id}/statut`, {
          statut: "ACTIF",
          validateurId: user?.id,
          commentaire,
        })
        .then((r) => r.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["secretariat"] });
      qc.invalidateQueries({ queryKey: ["projets"] });
      toast.success("Projet approuvé — statut : ACTIF");
    },
    onError: () => toast.error("Erreur lors de l'approbation"),
  });
}

export function useRejeterProjet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, commentaire }) =>
      api
        .patch(`/api/projets/${id}/statut`, { statut: "BROUILLON", commentaire })
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["secretariat"] });
      qc.invalidateQueries({ queryKey: ["projets"] });
      toast.success("Projet rejeté — renvoyé au responsable");
    },
    onError: () => toast.error("Erreur lors du rejet"),
  });
}

// ── Mutations dépenses ────────────────────────────────────────────────────────

export function useApprouverDepense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }) => {
      const { user } = useAuthStore.getState();
      return api
        .patch(`/api/depenses/${id}/statut`, {
          statut: "VALIDEE",
          userId: user?.id,
        })
        .then((r) => r.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["secretariat"] });
      toast.success("Dépense approuvée");
    },
    onError: () => toast.error("Erreur lors de l'approbation"),
  });
}

export function useRejeterDepense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, motif }) => {
      const { user } = useAuthStore.getState();
      return api
        .patch(`/api/depenses/${id}/statut`, {
          statut: "REJETEE",
          userId: user?.id,
          motif,
        })
        .then((r) => r.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["secretariat"] });
      toast.success("Dépense rejetée");
    },
    onError: () => toast.error("Erreur lors du rejet"),
  });
}

// ── Mutations allocations projets ─────────────────────────────────────────────

export function useValiderAllocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }) => {
      const { user } = useAuthStore.getState();
      return api
        .patch(`/api/allocations/${id}/valider`, { validateurId: user?.id })
        .then((r) => r.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["secretariat"] });
      toast.success("Allocation validée — statut : ACTIVE");
    },
    onError: () => toast.error("Erreur lors de la validation de l'allocation"),
  });
}

export function useRejeterAllocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, motif }) =>
      api
        .patch(`/api/allocations/${id}/rejeter`, { motif })
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["secretariat"] });
      toast.success("Allocation rejetée — le RAF sera notifié");
    },
    onError: () => toast.error("Erreur lors du rejet de l'allocation"),
  });
}

// ── Mutations alertes ─────────────────────────────────────────────────────────

export function useMarquerAlerteLue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) =>
      api.patch(`/api/alertes/${id}/lire`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["secretariat", "alertes"] });
    },
  });
}

export function useMarquerToutesLues() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.patch("/api/alertes/tout-lire"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["secretariat", "alertes"] });
      toast.success("Toutes les alertes marquées comme lues");
    },
  });
}

// ── Export plain API object (utilisé par MainLayout pour les badges) ──────────
export const secretariatApi = {
  getValidations: fetchValidations,
  getAlertesNonLues: async () => {
    try {
      const { data } = await api.get("/api/alertes");
      return Array.isArray(data) ? data.filter((a) => !a.lue) : [];
    } catch {
      return [];
    }
  },
};
