// ════════════════════════════════════════════════════════════════════════════
// Bridge Module S&E — mappe l'ancien se-mock-data vers Supabase
// ════════════════════════════════════════════════════════════════════════════
import * as ps from "@/services/projetService";
import * as se from "@/services/seService";
import * as us from "@/services/userService";
import { useQuery } from "@tanstack/react-query";

// ── Constantes (re-exports depuis le service) ─────────────────────────────
export {
  FREQUENCES_COLLECTE,
  STATUT_COLORS,
  STATUTS_COLLECTE,
  STATUTS_FORMULAIRE,
  STATUTS_INDICATEUR,
  TYPES_CHAMP,
  UNITES_MESURE,
} from "@/services/seService";

// ── Helpers purs (re-exports) ─────────────────────────────────────────────
export {
  computeTauxAtteinte,
  getDerniereValeur,
  getNextIndicateurCode,
} from "@/services/seService";

// ── Mutations (re-exports) ────────────────────────────────────────────────
export {
  assignerCollecteur,
  cloturerFormulaire,
  createCollecte,
  createFormulaire,
  createIndicateur,
  createReponse,
  mettreAJourValeurIndicateur,
  preValiderCollecte,
  publierFormulaire,
  rejeterCollecte,
  updateIndicateur,
  validerCollecte,
} from "@/services/seService";

// ════════════════════════════════════════════════════════════════════════════
// HOOKS REACT QUERY
// ════════════════════════════════════════════════════════════════════════════

// ── Projets ───────────────────────────────────────────────────────────────

export function useProjets() {
  return useQuery({
    queryKey: ["se-projets"],
    queryFn: ps.getAllProjets,
    staleTime: 5 * 60_000,
  });
}

// ── Membres / Utilisateurs ────────────────────────────────────────────────

export function useMembres() {
  return useQuery({
    queryKey: ["se-membres"],
    queryFn: us.getActiveUsers,
    staleTime: 5 * 60_000,
  });
}

// ── Indicateurs ───────────────────────────────────────────────────────────

export function useIndicateurs() {
  return useQuery({
    queryKey: ["se-indicateurs"],
    queryFn: se.getAllIndicateurs,
    staleTime: 2 * 60_000,
  });
}

export function useIndicateursByProjet(projetId) {
  return useQuery({
    queryKey: ["se-indicateurs", projetId],
    queryFn: () => se.getIndicateursByProjet(projetId),
    enabled: !!projetId,
    staleTime: 2 * 60_000,
  });
}

export function useIndicateurById(id) {
  return useQuery({
    queryKey: ["se-indicateur", id],
    queryFn: () => se.getIndicateurById(id),
    enabled: !!id,
    staleTime: 2 * 60_000,
  });
}

// ── Collectes de données ──────────────────────────────────────────────────

export function useCollectes() {
  return useQuery({
    queryKey: ["se-collectes"],
    queryFn: se.getAllCollectes,
    staleTime: 2 * 60_000,
  });
}

export function useCollectesByIndicateur(indicateurId) {
  return useQuery({
    queryKey: ["se-collectes", indicateurId],
    queryFn: () => se.getCollectesByIndicateur(indicateurId),
    enabled: !!indicateurId,
    staleTime: 2 * 60_000,
  });
}

export function useCollectesEnAttente() {
  return useQuery({
    queryKey: ["se-collectes-en-attente"],
    queryFn: se.getCollectesEnAttente,
    staleTime: 1 * 60_000,
  });
}

// ── Formulaires ───────────────────────────────────────────────────────────

export function useFormulaires() {
  return useQuery({
    queryKey: ["se-formulaires"],
    queryFn: se.getAllFormulaires,
    staleTime: 2 * 60_000,
  });
}

export function useFormulairesByProjet(projetId) {
  return useQuery({
    queryKey: ["se-formulaires", projetId],
    queryFn: () => se.getFormulairesByProjet(projetId),
    enabled: !!projetId,
    staleTime: 2 * 60_000,
  });
}

export function useFormulaireById(id) {
  return useQuery({
    queryKey: ["se-formulaire", id],
    queryFn: () => se.getFormulaireById(id),
    enabled: !!id,
    staleTime: 2 * 60_000,
  });
}

// ── Réponses ──────────────────────────────────────────────────────────────

export function useReponsesByFormulaire(formulaireId) {
  return useQuery({
    queryKey: ["se-reponses", formulaireId],
    queryFn: () => se.getReponsesByFormulaire(formulaireId),
    enabled: !!formulaireId,
    staleTime: 2 * 60_000,
  });
}

export function useReponsesEnAttente() {
  return useQuery({
    queryKey: ["se-reponses-en-attente"],
    queryFn: se.getReponsesEnAttente,
    staleTime: 1 * 60_000,
  });
}

// ── Collecteurs ───────────────────────────────────────────────────────────

export function useCollecteursForFormulaire(formulaireId) {
  return useQuery({
    queryKey: ["se-collecteurs", formulaireId],
    queryFn: () => se.getCollecteursForFormulaire(formulaireId),
    enabled: !!formulaireId,
    staleTime: 2 * 60_000,
  });
}

// ════════════════════════════════════════════════════════════════════════════
// HELPERS SYNCHRONES — prennent les données chargées en paramètre
// ════════════════════════════════════════════════════════════════════════════

export function getProjet(projets, id) {
  return (projets ?? []).find((p) => p.id === id || p.id === Number(id));
}

export function getMembre(membres, id) {
  return (membres ?? []).find((m) => m.id === id || m.id === Number(id));
}

export function getIndicateur(indicateurs, id) {
  return (indicateurs ?? []).find((i) => i.id === id || i.id === Number(id));
}

export function getFormulaire(formulaires, id) {
  return (formulaires ?? []).find((f) => f.id === id || f.id === Number(id));
}

export function getCollectesForIndicateur(collectes, indicateurId) {
  return (collectes ?? [])
    .filter((c) => (c.indicateur_id ?? c.indicateurId) === indicateurId)
    .sort(
      (a, b) =>
        new Date(a.date_collecte ?? a.dateCollecte) -
        new Date(b.date_collecte ?? b.dateCollecte),
    );
}

export function getReponsesForFormulaire(reponses, formulaireId) {
  return (reponses ?? []).filter(
    (r) => (r.formulaire_id ?? r.formulaireId) === formulaireId,
  );
}

export function getIndicateursForProjet(indicateurs, projetId) {
  return (indicateurs ?? []).filter(
    (i) => (i.projet_id ?? i.projetId) === projetId,
  );
}

export function getFormulairesForProjet(formulaires, projetId) {
  return (formulaires ?? []).filter(
    (f) => (f.projet_id ?? f.projetId) === projetId,
  );
}

// ── Agrégations ───────────────────────────────────────────────────────────

/** Taux d'atteinte d'un indicateur (wrapper qui va chercher ses collectes) */
export function getTauxAtteinte(indicateur, collectes) {
  const indCollectes = getCollectesForIndicateur(collectes, indicateur.id);
  return se.computeTauxAtteinte(indicateur, indCollectes);
}

/** Taux d'atteinte moyen pour un projet */
export function getTauxParProjet(indicateurs, collectes, projetId) {
  const inds = getIndicateursForProjet(indicateurs, projetId).filter(
    (i) => i.statut === "ACTIF",
  );
  if (inds.length === 0) return { taux: 0, nbIndicateurs: 0 };
  const sum = inds.reduce(
    (acc, ind) => acc + getTauxAtteinte(ind, collectes),
    0,
  );
  return { taux: Math.round(sum / inds.length), nbIndicateurs: inds.length };
}

/** Collectes en attente parmi une liste */
export function getCollectesEnAttenteFromList(collectes) {
  return (collectes ?? []).filter((c) =>
    ["EN_ATTENTE", "PRE_VALIDEE"].includes(c.statut),
  );
}

/** Réponses en attente parmi une liste */
export function getReponsesEnAttenteFromList(reponses) {
  return (reponses ?? []).filter((r) =>
    ["EN_ATTENTE", "PRE_VALIDEE"].includes(r.statut),
  );
}

/** Compteur global de données en attente */
export function countEnAttente(collectes, reponses) {
  return (
    getCollectesEnAttenteFromList(collectes).length +
    getReponsesEnAttenteFromList(reponses).length
  );
}

/** Indicateurs en sous-performance (taux < 50 %) */
export function getIndicateursSousPerformance(indicateurs, collectes) {
  return (indicateurs ?? []).filter(
    (i) => i.statut === "ACTIF" && getTauxAtteinte(i, collectes) < 50,
  );
}

/** Alertes S&E — mêmes règles que l'ancien mock */
export function getAlertesSE(indicateurs, collectes, reponses) {
  const alertes = [];
  const today = new Date();

  // 1. Indicateurs sous-performance
  getIndicateursSousPerformance(indicateurs, collectes).forEach((ind) => {
    const taux = getTauxAtteinte(ind, collectes);
    alertes.push({
      type: "SOUS_PERFORMANCE",
      niveau: "DANGER",
      message: `${ind.code} — ${ind.libelle ?? ind.nom} : taux à ${taux}% (< 50%)`,
      indicateurId: ind.id,
      projetId: ind.projet_id ?? ind.projetId,
    });
  });

  // 2. Données en attente depuis > 7 jours
  [
    ...getCollectesEnAttenteFromList(collectes),
    ...getReponsesEnAttenteFromList(reponses),
  ].forEach((item) => {
    const soumission = new Date(item.date_soumission ?? item.dateSoumission);
    const joursAttente = Math.floor(
      (today - soumission) / (1000 * 60 * 60 * 24),
    );
    if (joursAttente > 7) {
      alertes.push({
        type: "VALIDATION_EN_RETARD",
        niveau: "ATTENTION",
        message: `Données en attente depuis ${joursAttente} jours`,
        itemId: item.id,
      });
    }
  });

  // 3. Indicateurs actifs sans collecte
  (indicateurs ?? [])
    .filter((i) => i.statut === "ACTIF")
    .forEach((ind) => {
      const indCollectes = getCollectesForIndicateur(collectes, ind.id);
      if (indCollectes.length === 0) {
        alertes.push({
          type: "SANS_COLLECTE",
          niveau: "ATTENTION",
          message: `${ind.code} — Aucune collecte enregistrée`,
          indicateurId: ind.id,
          projetId: ind.projet_id ?? ind.projetId,
        });
      }
    });

  return alertes;
}

// ════════════════════════════════════════════════════════════════════════════
// FACTORY — crée des helpers « fermetures » sur les données chargées
// Permet de garder la même signature `getProjet(id)` dans les pages
// ════════════════════════════════════════════════════════════════════════════
export function createSEHelpers(
  projets = [],
  membres = [],
  indicateurs = [],
  collectes = [],
  formulaires = [],
  reponses = [],
) {
  return {
    getProjet: (id) => getProjet(projets, id),
    getMembre: (id) => getMembre(membres, id),
    getIndicateur: (id) => getIndicateur(indicateurs, id),
    getFormulaire: (id) => getFormulaire(formulaires, id),

    getCollectesForIndicateur: (indicateurId) =>
      getCollectesForIndicateur(collectes, indicateurId),
    getReponsesForFormulaire: (formulaireId) =>
      getReponsesForFormulaire(reponses, formulaireId),

    getIndicateursForProjet: (projetId) =>
      getIndicateursForProjet(indicateurs, projetId),
    getFormulairesForProjet: (projetId) =>
      getFormulairesForProjet(formulaires, projetId),

    getTauxAtteinte: (indicateur) => getTauxAtteinte(indicateur, collectes),
    getTauxParProjet: (projetId) =>
      getTauxParProjet(indicateurs, collectes, projetId),

    countEnAttente: () => countEnAttente(collectes, reponses),
    getIndicateursSousPerformance: () =>
      getIndicateursSousPerformance(indicateurs, collectes),
    getAlertesSE: () => getAlertesSE(indicateurs, collectes, reponses),

    getNextIndicateurCode: () => se.getNextIndicateurCode(indicateurs),
  };
}
