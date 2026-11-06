// ─────────────────────────────────────────────────────────────────────────────
// Indicateurs de suivi-évaluation : valeur de départ, cible, valeur atteinte.
// Le taux de réalisation est calculé par le backend (atteinte / cible).
// ─────────────────────────────────────────────────────────────────────────────
import api from "@/api/axios";
import { R } from "@/lib/navigation";
import { useQuery } from "@tanstack/react-query";

/** Rôles qui créent les indicateurs et mettent à jour leur valeur atteinte. */
export const GESTIONNAIRES_INDICATEURS = [R.RSE, R.SE, R.ADMIN];

export const NIVEAUX = { IMPACT: "Impact", EFFET: "Effet", PRODUIT: "Produit", ACTIVITE: "Activité" };
export const TYPES = { QUANTITATIF: "Quantitatif", QUALITATIF: "Qualitatif" };
export const FREQUENCES = {
  HEBDOMADAIRE: "Hebdomadaire",
  MENSUELLE: "Mensuelle",
  TRIMESTRIELLE: "Trimestrielle",
  SEMESTRIELLE: "Semestrielle",
  ANNUELLE: "Annuelle",
};

/** Ordre de lecture d'un cadre logique : de l'impact vers l'activité. */
export const ORDRE_NIVEAUX = Object.keys(NIVEAUX);

/** Taux de réalisation (0 à 1+) depuis la réponse du backend (en pourcentage). */
export const taux = (i) => (Number(i.tauxRealisation) || 0) / 100;

/** Valeur avec son unité : « 1 250 ménages ». */
export const valeur = (v, unite) =>
  v === null || v === undefined || v === ""
    ? "—"
    : `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(Number(v))}${unite ? `${String.fromCharCode(160)}${unite}` : ""}`;

export function useIndicateurs() {
  return useQuery({
    queryKey: ["indicateurs"],
    queryFn: async () => {
      const { data } = await api.get("/api/indicateurs");
      return Array.isArray(data) ? data : [];
    },
    staleTime: 60_000,
  });
}

export function useIndicateur(id) {
  return useQuery({
    queryKey: ["indicateurs", id],
    queryFn: async () => (await api.get(`/api/indicateurs/${id}`)).data,
    enabled: !!id,
    retry: false,
  });
}

export const creerIndicateur = (payload) => api.post("/api/indicateurs", payload).then((r) => r.data);

export const mettreAJourValeur = (id, v) => api.patch(`/api/indicateurs/${id}/valeur`, { valeur: v }).then((r) => r.data);
