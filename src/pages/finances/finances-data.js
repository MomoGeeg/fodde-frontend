// ═══════════════════════════════════════════════════════════
// finances-data.js — Hooks React Query + helpers (Spring Boot)
// ═══════════════════════════════════════════════════════════
import api from "@/api/axios";
import useAuthStore from "@/stores/auth.store";
import { useQuery } from "@tanstack/react-query";

// ── Constantes ─────────────────────────────────────────────
export const SEUIL_APPROBATION_SE = 500_000;
export const SEUIL_PIECE_JUSTIFICATIVE = 100_000;

export const STATUT_COLORS = {
  BROUILLON: "bg-gray-100 text-gray-600",
  SOUMISE: "bg-blue-100 text-blue-700",
  VERIFIEE: "bg-indigo-100 text-indigo-700",
  EN_APPROBATION_SE: "bg-orange-100 text-orange-700",
  VALIDEE: "bg-green-100 text-green-700",
  REJETEE: "bg-red-100 text-red-600",
  ANNULEE: "bg-gray-200 text-gray-400",
};

export const STATUTS_DEPENSE = [
  { value: "BROUILLON", label: "Brouillon" },
  { value: "SOUMISE", label: "Soumise" },
  { value: "VERIFIEE", label: "Vérifiée" },
  { value: "EN_APPROBATION_SE", label: "En approbation SE" },
  { value: "VALIDEE", label: "Validée" },
  { value: "REJETEE", label: "Rejetée" },
  { value: "ANNULEE", label: "Annulée" },
];

export const MODE_PAIEMENT_LABELS = {
  ESPECES: "Espèces",
  VIREMENT: "Virement",
  CHEQUE: "Chèque",
  MOBILE_MONEY: "Mobile Money",
};

export const MODES_PAIEMENT = [
  { value: "ESPECES", label: "Espèces" },
  { value: "VIREMENT", label: "Virement bancaire" },
  { value: "CHEQUE", label: "Chèque" },
  { value: "MOBILE_MONEY", label: "Mobile Money" },
];

export const DEVISES = ["XOF", "EUR", "USD"];

/** Numéro de pièce provisoire (remplacé par le serveur) */
export function nextNumeroPiece() {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const rand = String(Math.floor(Math.random() * 9000) + 1000);
  return `DEP-${yy}${mm}-${rand}`;
}

// ── Mappers (normalise les champs backend → frontend) ───────

/**
 * DepenseResponse (Spring Boot) → format UI
 *   date      ← dateDepense
 *   saisiPar  ← saisiParNom
 *   montantXOF← montant (toujours en devise du projet)
 */
function mapDepense(d) {
  return {
    ...d,
    date: d.dateDepense,
    saisiPar: d.saisiParNom ?? "—",
    montantXOF: Number(d.montant ?? 0),
    montant: Number(d.montant ?? 0),
    justificatif: null, // pas encore géré côté backend
    historique: buildHistorique(d),
  };
}

function buildHistorique(d) {
  const par = d.saisiParNom ?? "—";
  const etapes = [
    { etape: "SOUMISE", date: d.createdAt ?? d.dateDepense, par, commentaire: null },
  ];
  const terminal = ["VERIFIEE", "EN_APPROBATION_SE", "VALIDEE", "REJETEE", "ANNULEE"];
  if (terminal.includes(d.statut)) {
    etapes.push({
      etape: d.statut,
      date: d.createdAt,
      par: "RAF / SE",
      commentaire: d.motifRejet ?? null,
    });
  }
  return etapes;
}

/**
 * LigneBudgetaireResponse (Spring Boot) → format UI
 *   prevu   ← montantPrevu
 *   engage  ← montantEngage
 *   depense ← montantDepense
 *   gele    ← estGelee
 */
function mapLigne(l) {
  return {
    ...l,
    prevu: Number(l.montantPrevu ?? 0),
    engage: Number(l.montantEngage ?? 0),
    depense: Number(l.montantDepense ?? 0),
    gele: l.estGelee ?? false,
  };
}

// ── Hooks React Query ──────────────────────────────────────

/** GET /api/projets */
export function useProjetsFinances() {
  return useQuery({
    queryKey: ["projets"],
    queryFn: async () => {
      const { data } = await api.get("/api/projets");
      return Array.isArray(data) ? data : [];
    },
    staleTime: 5 * 60_000,
  });
}

/**
 * Dépenses selon rôle :
 *  - COMPTABLE pur → GET /api/depenses/mes-depenses?userId=...
 *  - Autres        → GET /api/depenses
 */
export function useDepenses() {
  const { user } = useAuthStore();
  const isPureComptable =
    user?.roles?.includes("ROLE_COMPTABLE") &&
    !user?.roles?.some((r) => ["ROLE_RAF", "ROLE_SE", "ROLE_ADMIN"].includes(r));

  return useQuery({
    queryKey: ["fin-depenses", isPureComptable ? "mes" : "all", user?.id],
    queryFn: async () => {
      const url = isPureComptable
        ? `/api/depenses/mes-depenses?userId=${user.id}`
        : "/api/depenses";
      const { data } = await api.get(url);
      return Array.isArray(data) ? data.map(mapDepense) : [];
    },
    staleTime: 60_000,
    enabled: !!user?.id,
  });
}

/** GET /api/depenses/{id} */
export function useDepenseById(id) {
  return useQuery({
    queryKey: ["fin-depense", id],
    queryFn: async () => {
      const { data } = await api.get(`/api/depenses/${id}`);
      return mapDepense(data);
    },
    enabled: !!id,
    staleTime: 30_000,
    retry: false,
  });
}

/** GET /api/depenses/projet/{projetId} */
export function useDepensesParProjet(projetId) {
  return useQuery({
    queryKey: ["fin-depenses", "projet", projetId],
    queryFn: async () => {
      const { data } = await api.get(`/api/depenses/projet/${projetId}`);
      return Array.isArray(data) ? data.map(mapDepense) : [];
    },
    enabled: !!projetId,
    staleTime: 60_000,
  });
}

/**
 * GET /api/allocations/lignes?projetId=...
 * N'est déclenchée que si projetId est renseigné.
 */
export function useLignesParProjet(projetId) {
  return useQuery({
    queryKey: ["fin-lignes", projetId],
    queryFn: async () => {
      const { data } = await api.get("/api/allocations/lignes", { params: { projetId } });
      return Array.isArray(data) ? data.map(mapLigne) : [];
    },
    enabled: !!projetId,
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

/**
 * @deprecated — retourne toujours [].
 * Utilisez useLignesParProjet(projetId) à la place.
 */
export function useLignesBudgetaires() {
  return { data: [], isLoading: false, isError: false };
}

// ── Factory helpers ────────────────────────────────────────
/**
 * Crée des helpers en fermeture sur les données déjà chargées.
 * @param {Array} projets  — résultat de useProjetsFinances()
 * @param {Array} lignes   — résultat de useLignesParProjet()  (peut être [])
 * @param {Array} depenses — résultat de useDepenses() ou useDepensesParProjet()
 */
export function createFinanceHelpers(projets = [], lignes = [], depenses = []) {
  return {
    getProjet: (id) => projets.find((p) => p.id === id),

    getLigne: (id) => lignes.find((l) => l.id === id),

    /** null si lignes pas encore chargées (évite les faux positifs d'alerte) */
    getSoldeDisponible: (ligneBudgetaireId) => {
      if (!lignes.length) return null;
      const l = lignes.find((x) => x.id === ligneBudgetaireId);
      if (!l) return 0;
      return l.soldeDisponible != null ? Number(l.soldeDisponible) : l.prevu - l.depense;
    },

    /** Les lignes passées sont déjà filtrées par projet */
    getLignesForProjet: (_projetId) => lignes,

    getDepensesForLigne: (ligneBudgetaireId) =>
      depenses.filter((d) => d.ligneBudgetaireId === ligneBudgetaireId),

    /**
     * Stats budgétaires d'un projet.
     * Si lignes disponibles → agrège depuis les lignes (précis).
     * Sinon → utilise projet.budgetTotal + dépenses (approximatif).
     */
    getBudgetStatsForProjet: (projetId) => {
      if (lignes.length) {
        const prevu = lignes.reduce((s, l) => s + l.prevu, 0);
        const engage = lignes.reduce((s, l) => s + l.engage, 0);
        const depense = lignes.reduce((s, l) => s + l.depense, 0);
        const solde = prevu - engage;
        const taux = prevu > 0 ? Math.round((depense / prevu) * 100) : 0;
        return { prevu, engage, depense, solde, taux };
      }
      // Fallback sans lignes : budgetTotal + dépenses validées
      const projet = projets.find((p) => p.id === projetId);
      const prevu = Number(projet?.budgetTotal ?? 0);
      const depense = depenses
        .filter((d) => d.projetId === projetId && d.statut === "VALIDEE")
        .reduce((s, d) => s + d.montantXOF, 0);
      const engage = depenses
        .filter((d) => d.projetId === projetId && !["ANNULEE", "REJETEE"].includes(d.statut))
        .reduce((s, d) => s + d.montantXOF, 0);
      const solde = prevu - engage;
      const taux = prevu > 0 ? Math.round((depense / prevu) * 100) : 0;
      return { prevu, engage, depense, solde, taux };
    },
  };
}
