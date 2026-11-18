// ─────────────────────────────────────────────────────────────────────────────
// Portefeuille de projets : budget consommé, activités et alertes de chaque
// projet en cours. Partagé par les tableaux de bord du RP et du SE.
// ─────────────────────────────────────────────────────────────────────────────
import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import api from "@/api/axios";
import { useFinancements, nomCourt } from "@/api/bailleurs";
import { totaux, useLignesDesProjets, useProjets, SEUIL_ALERTE } from "@/api/budgets";

/** Projets suivis au quotidien (budget, activités). */
export const EN_COURS = ["ACTIF", "SUSPENDU", "EN_CLOTURE"];
export const TERMINES = ["CLOTURE", "ARCHIVE"];
const ACTIVITES_OUVERTES = ["PLANIFIEE", "EN_COURS", "EN_RETARD"];

const JOUR = 86_400_000;
const aujourdhui = () => new Date(new Date().toISOString().slice(0, 10));
/** Jours entre aujourd'hui et la date (négatif si passée). */
export const joursAvant = (date) => Math.round((new Date(date) - aujourdhui()) / JOUR);

/** Une activité est en retard si elle est marquée comme telle ou si sa fin prévue est passée sans être réalisée. */
export const enRetard = (a) =>
  a.statut === "EN_RETARD" || (ACTIVITES_OUVERTES.includes(a.statut) && a.datePrevuFin && joursAvant(a.datePrevuFin) < 0);

const liste = (r) => (Array.isArray(r.data) ? r.data : []);

function useActivitesDesProjets(projets) {
  return useQueries({
    queries: projets.map((p) => ({
      queryKey: ["activites", "projet", p.id],
      queryFn: async () => liste(await api.get(`/api/activites/projet/${p.id}`)),
      staleTime: 60_000,
    })),
  });
}

/** Tous les projets, et pour ceux en cours : budget, activités, bailleurs, alertes. */
export function usePortefeuille() {
  const { data: projets = [], isLoading: chargeProjets } = useProjets();
  const { data: financements = [] } = useFinancements();

  const suivis = useMemo(() => projets.filter((p) => EN_COURS.includes(p.statut)), [projets]);
  const lignes = useLignesDesProjets(suivis);
  const activites = useActivitesDesProjets(suivis);
  const chargeBudget = chargeProjets || lignes.some((q) => q.isLoading);
  const chargeActivites = chargeProjets || activites.some((q) => q.isLoading);

  const lignesProjets = suivis.map((p, i) => {
    const t = totaux(lignes[i]?.data ?? []);
    const acts = (activites[i]?.data ?? []).filter((a) => a.statut !== "ANNULEE");
    const bailleurs = [...new Set(financements.filter((f) => f.projetId === p.id).map(nomCourt))];
    const alertes = [];
    if (t.prevu > 0 && t.taux >= SEUIL_ALERTE) alertes.push(`Budget consommé à ${Math.round(t.taux * 100)} %`);
    if (p.dateFin && p.statut === "ACTIF") {
      const j = joursAvant(p.dateFin);
      if (j < 0) alertes.push("Date de fin dépassée");
      else if (j <= 30) alertes.push(`Se termine dans ${j} jour${j > 1 ? "s" : ""}`);
    }
    return {
      projet: p,
      bailleurs,
      budget: Number(p.budgetTotal) || t.prevu,
      ...t,
      realisees: acts.filter((a) => a.statut === "REALISEE").length,
      totalActivites: acts.length,
      retards: acts.filter(enRetard).length,
      alertes,
    };
  });

  const toutesActivites = activites.flatMap((q, i) => (q.data ?? []).map((a) => ({ ...a, projet: suivis[i] })));

  return {
    projets,
    chargeProjets,
    chargeBudget,
    chargeActivites,
    lignesProjets,
    toutesActivites,
    retards: toutesActivites.filter(enRetard),
    actifs: projets.filter((p) => p.statut === "ACTIF"),
    termines: projets.filter((p) => TERMINES.includes(p.statut)),
    budgetTotal: lignesProjets.reduce((s, l) => s + l.budget, 0),
    prevuTotal: lignesProjets.reduce((s, l) => s + l.prevu, 0),
    depenseTotal: lignesProjets.reduce((s, l) => s + l.depense, 0),
  };
}
