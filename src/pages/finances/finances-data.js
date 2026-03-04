// ════════════════════════════════════════════════════════════════════════════
// Bridge Module Finances — mappe l'ancien finances-mock-data vers Supabase
// ════════════════════════════════════════════════════════════════════════════
import * as fs from "@/services/financeService";
import * as ps from "@/services/projetService";
import { useQuery } from "@tanstack/react-query";

// ── Constantes (re-exports depuis le service) ─────────────────────────────
export {
  DEVISES,
  MODE_PAIEMENT_LABELS,
  MODES_PAIEMENT,
  SEUIL_APPROBATION_SE,
  SEUIL_PIECE_JUSTIFICATIVE,
  STATUT_COLORS,
  STATUTS_DEPENSE,
} from "@/services/financeService";

// ── Hooks React Query ─────────────────────────────────────────────────────

export function useProjetsFinances() {
  return useQuery({
    queryKey: ["fin-projets"],
    queryFn: ps.getAllProjets,
    staleTime: 5 * 60_000,
  });
}

export function useDepenses() {
  return useQuery({
    queryKey: ["fin-depenses"],
    queryFn: fs.getAllDepenses,
    staleTime: 2 * 60_000,
  });
}

export function useDepensesByProjet(projetId) {
  return useQuery({
    queryKey: ["fin-depenses", projetId],
    queryFn: () => fs.getDepensesByProjet(projetId),
    enabled: !!projetId,
    staleTime: 2 * 60_000,
  });
}

export function useDepenseById(id) {
  return useQuery({
    queryKey: ["fin-depense", id],
    queryFn: () => fs.getDepenseById(id),
    enabled: !!id,
    staleTime: 2 * 60_000,
  });
}

export function useLignesBudgetaires() {
  return useQuery({
    queryKey: ["fin-lignes"],
    queryFn: fs.getAllLignesBudgetaires,
    staleTime: 5 * 60_000,
  });
}

export function useLignesByProjet(projetId) {
  return useQuery({
    queryKey: ["fin-lignes", projetId],
    queryFn: () => fs.getLignesBudgetairesByProjet(projetId),
    enabled: !!projetId,
    staleTime: 5 * 60_000,
  });
}

export function useCategoriesBudgetaires() {
  return useQuery({
    queryKey: ["fin-categories"],
    queryFn: fs.getCategoriesBudgetaires,
    staleTime: 10 * 60_000,
  });
}

// ── Helpers synchrones (prennent les données en paramètre) ────────────────

export function getProjet(projets, id) {
  return projets.find((p) => p.id === id || p.id === Number(id));
}

export function getLigne(lignes, id) {
  return lignes.find((l) => l.id === id || l.id === Number(id));
}

export function getLignesForProjet(lignes, projetId) {
  return lignes.filter(
    (l) => l.projet_id === projetId || l.projetId === projetId,
  );
}

export function getDepensesForProjet(depenses, projetId) {
  return depenses.filter(
    (d) => d.projet_id === projetId || d.projetId === projetId,
  );
}

export function getDepensesForLigne(depenses, ligneBudgetaireId) {
  return depenses.filter(
    (d) =>
      d.ligne_budgetaire_id === ligneBudgetaireId ||
      d.ligneBudgetaireId === ligneBudgetaireId,
  );
}

export function getSoldeDisponible(ligne) {
  if (!ligne) return null;
  return (
    (ligne.prevu ?? ligne.montant_prevu ?? 0) -
    (ligne.depense ?? ligne.montant_depense ?? 0) -
    (ligne.engage ?? ligne.montant_engage ?? 0)
  );
}

export function getBudgetStatsForProjet(lignes, depenses, projetId) {
  const pLignes = getLignesForProjet(lignes, projetId);
  const pDepenses = getDepensesForProjet(depenses, projetId);

  const totalPrevu = pLignes.reduce(
    (s, l) => s + (l.prevu ?? l.montant_prevu ?? 0),
    0,
  );
  const totalDepense = pLignes.reduce(
    (s, l) => s + (l.depense ?? l.montant_depense ?? 0),
    0,
  );
  const totalEngage = pLignes.reduce(
    (s, l) => s + (l.engage ?? l.montant_engage ?? 0),
    0,
  );
  const solde = totalPrevu - totalDepense - totalEngage;
  const taux = totalPrevu > 0 ? (totalDepense / totalPrevu) * 100 : 0;

  const enAttente = pDepenses.filter((d) =>
    ["SOUMISE", "EN_APPROBATION_SE"].includes(d.statut),
  ).length;

  return {
    totalPrevu,
    totalDepense,
    totalEngage,
    solde,
    taux,
    enAttente,
    nbLignes: pLignes.length,
  };
}

export function nextNumeroPiece() {
  return fs.nextNumeroPiece();
}

// ── Factory : crée des helpers « fermétures » sur les données chargées ────
// Permet de garder la même signature `getProjet(id)` dans les pages
export function createFinanceHelpers(projets = [], lignes = [], depenses = []) {
  return {
    getProjet: (id) => projets.find((p) => p.id === id || p.id === Number(id)),

    getLigne: (id) => lignes.find((l) => l.id === id || l.id === Number(id)),

    getLignesForProjet: (projetId) =>
      lignes.filter((l) => (l.projet_id ?? l.projetId) === projetId),

    getDepensesForProjet: (projetId) =>
      depenses.filter((d) => (d.projet_id ?? d.projetId) === projetId),

    getDepensesForLigne: (ligneBudgetaireId) =>
      depenses.filter(
        (d) =>
          (d.ligne_budgetaire_id ?? d.ligneBudgetaireId) === ligneBudgetaireId,
      ),

    getSoldeDisponible: (ligneBudgetaireId) => {
      const l = lignes.find(
        (x) => x.id === ligneBudgetaireId || x.id === Number(ligneBudgetaireId),
      );
      if (!l) return 0;
      return (
        (l.prevu ?? l.montant_prevu ?? 0) -
        (l.depense ?? l.montant_depense ?? 0) -
        (l.engage ?? l.montant_engage ?? 0)
      );
    },

    getBudgetStatsForProjet: (projetId) =>
      getBudgetStatsForProjet(lignes, depenses, projetId),
  };
}
