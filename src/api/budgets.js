// ─────────────────────────────────────────────────────────────────────────────
// Suivi budgétaire des projets : prévu / dépensé par ligne budgétaire, et
// dépenses validées sur une période. Sert aussi aux rapports pour les bailleurs.
// ─────────────────────────────────────────────────────────────────────────────
import api from "@/api/axios";
import { useQueries, useQuery } from "@tanstack/react-query";

const liste = (r) => (Array.isArray(r.data) ? r.data : []);

/** Seuil à partir duquel une ligne est signalée (part du prévu déjà dépensée). */
export const SEUIL_ALERTE = 0.8;

export const nombre = (v) => Number(v) || 0;

/** Totaux d'un ensemble de lignes budgétaires. */
export function totaux(lignes) {
  const prevu = lignes.reduce((s, l) => s + nombre(l.montantPrevu), 0);
  const depense = lignes.reduce((s, l) => s + nombre(l.montantDepense), 0);
  return { prevu, depense, solde: prevu - depense, taux: prevu > 0 ? depense / prevu : 0 };
}

export const tauxLigne = (l) => (nombre(l.montantPrevu) > 0 ? nombre(l.montantDepense) / nombre(l.montantPrevu) : 0);

export function useProjets() {
  return useQuery({
    queryKey: ["projets"],
    queryFn: async () => liste(await api.get("/api/projets")),
    staleTime: 5 * 60_000,
  });
}

/** Lignes budgétaires d'un projet. */
export function useLignes(projetId) {
  return useQuery({
    queryKey: ["lignes-budgetaires", projetId],
    queryFn: async () => liste(await api.get("/api/allocations/lignes", { params: { projetId } })),
    enabled: !!projetId,
    staleTime: 60_000,
  });
}

/** Lignes de plusieurs projets à la fois (pour la vue d'ensemble). */
export function useLignesDesProjets(projets) {
  return useQueries({
    queries: projets.map((p) => ({
      queryKey: ["lignes-budgetaires", p.id],
      queryFn: async () => liste(await api.get("/api/allocations/lignes", { params: { projetId: p.id } })),
      staleTime: 60_000,
    })),
  });
}

/** Dépenses d'un projet (tous statuts) ; liste vide si le rôle n'y a pas accès. */
export function useDepensesProjet(projetId) {
  return useQuery({
    queryKey: ["depenses", "projet", projetId],
    queryFn: async () => {
      try {
        return liste(await api.get(`/api/depenses/projet/${projetId}`));
      } catch (err) {
        if (err?.response?.status === 403) return null; // pas autorisé : on le signale à l'écran
        throw err;
      }
    },
    enabled: !!projetId,
    staleTime: 60_000,
  });
}

/** Dépenses validées comprises dans la période [du, au] (bornes facultatives, AAAA-MM-JJ). */
export const depensesValideesSur = (depenses, du, au) =>
  depenses.filter(
    (d) => d.statut === "VALIDEE" && (!du || d.dateDepense >= du) && (!au || d.dateDepense <= au),
  );
