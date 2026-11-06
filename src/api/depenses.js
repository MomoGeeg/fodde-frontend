// ─────────────────────────────────────────────────────────────────────────────
// Dépenses : appels au backend et règles du circuit de validation.
// Circuit : BROUILLON → SOUMISE → VERIFIEE → (EN_APPROBATION_SE →) VALIDEE
// Au-delà du seuil, la dépense doit être approuvée par le Secrétaire exécutif.
// ─────────────────────────────────────────────────────────────────────────────
import api from "@/api/axios";
import { R, aAcces } from "@/lib/navigation";
import useAuthStore from "@/stores/auth.store";
import { useQuery } from "@tanstack/react-query";

export const SEUIL_APPROBATION_SE = 500_000;

/** Libellé et ton (couleur) de chaque statut. */
export const STATUTS_DEPENSE = {
  BROUILLON: { label: "Brouillon", ton: "neutre" },
  SOUMISE: { label: "Soumise", ton: "info" },
  VERIFIEE: { label: "Vérifiée", ton: "info" },
  EN_APPROBATION_SE: { label: "Chez le SE", ton: "attention" },
  VALIDEE: { label: "Validée", ton: "succes" },
  REJETEE: { label: "Rejetée", ton: "danger" },
  ANNULEE: { label: "Annulée", ton: "neutre" },
};

export const MODES_PAIEMENT = {
  ESPECES: "Espèces",
  VIREMENT: "Virement bancaire",
  CHEQUE: "Chèque",
  MOBILE_MONEY: "Mobile Money",
};

export const DEVISES = ["XOF", "EUR", "USD"];

import { montant } from "@/lib/format";
export { dateCourte, montant } from "@/lib/format";

const depasseSeuil = (d) => Number(d.montant) > SEUIL_APPROBATION_SE;

// ── Lecture ─────────────────────────────────────────────────────────────────

/**
 * Dépenses visibles par l'utilisateur :
 * RAF et SE voient toutes les dépenses, le comptable voit les siennes.
 */
export function useDepenses() {
  const { user } = useAuthStore();
  const roles = user?.roles ?? [];
  const voitTout = aAcces(roles, [R.RAF, R.SE]);
  return useQuery({
    queryKey: ["depenses", voitTout ? "toutes" : "miennes", user?.id],
    queryFn: async () => {
      const { data } = voitTout
        ? await api.get("/api/depenses")
        : await api.get("/api/depenses/mes-depenses", { params: { userId: user.id } });
      return Array.isArray(data) ? data : [];
    },
    enabled: !!user?.id,
    staleTime: 30_000,
  });
}

export function useDepense(id) {
  return useQuery({
    queryKey: ["depenses", "fiche", id],
    queryFn: async () => (await api.get(`/api/depenses/${id}`)).data,
    enabled: !!id,
    retry: false,
  });
}

/** Lignes budgétaires d'un projet, avec leur solde disponible. */
export function useLignesBudgetaires(projetId) {
  return useQuery({
    queryKey: ["lignes-budgetaires", projetId],
    queryFn: async () => {
      const { data } = await api.get("/api/allocations/lignes", { params: { projetId } });
      return Array.isArray(data) ? data : [];
    },
    enabled: !!projetId,
    staleTime: 60_000,
  });
}

export function useProjets() {
  return useQuery({
    queryKey: ["projets"],
    queryFn: async () => {
      const { data } = await api.get("/api/projets");
      return Array.isArray(data) ? data : [];
    },
    staleTime: 5 * 60_000,
  });
}

// ── Écriture ────────────────────────────────────────────────────────────────

export const creerDepense = (payload, userId) =>
  api.post("/api/depenses", payload, { params: { userId } }).then((r) => r.data);

const changerStatut = (id, statut, userId, motif) =>
  api.patch(`/api/depenses/${id}/statut`, { statut, userId, ...(motif ? { motif } : {}) });

const annuler = (id, motif, userId) => api.patch(`/api/depenses/${id}/annuler`, null, { params: { motif, userId } });

// ── Circuit ─────────────────────────────────────────────────────────────────

/** Étapes affichées dans le circuit de la fiche. */
export function etapesCircuit(d) {
  const etapes = [
    { code: "BROUILLON", label: "Saisie" },
    { code: "SOUMISE", label: "Soumise" },
    { code: "VERIFIEE", label: "Vérifiée par le RAF" },
  ];
  if (depasseSeuil(d) || d.statut === "EN_APPROBATION_SE") {
    etapes.push({ code: "EN_APPROBATION_SE", label: "Approuvée par le SE" });
  }
  etapes.push({ code: "VALIDEE", label: "Validée" });
  return etapes;
}

/** Vrai si la dépense attend une action de cet utilisateur. */
export function estATraiter(d, roles, userId) {
  if (aAcces(roles, [R.RAF]) && (d.statut === "SOUMISE" || d.statut === "VERIFIEE")) return true;
  if (aAcces(roles, [R.SE]) && d.statut === "EN_APPROBATION_SE") return true;
  const estAuteur = d.saisiParId === userId;
  return estAuteur && (d.statut === "BROUILLON" || d.statut === "REJETEE");
}

/**
 * Actions possibles sur une dépense pour cet utilisateur.
 * Chaque action : { cle, label, style, motif (obligatoire ?), confirmation, executer(motif) }.
 */
export function actionsDepense(d, roles, userId) {
  const actions = [];
  const estAuteur = d.saisiParId === userId;
  const transitions = (statuts, message) => async (motif) => {
    for (const s of statuts) await changerStatut(d.id, s, userId, s === "REJETEE" ? motif : undefined);
    return message;
  };
  const rejeter = {
    cle: "rejeter",
    label: "Rejeter",
    style: "danger",
    motif: true,
    confirmation: "Rejeter cette dépense ? Le motif sera visible par son auteur.",
    executer: transitions(["REJETEE"], "Dépense rejetée"),
  };

  if (estAuteur || aAcces(roles, [R.COMPTABLE])) {
    if (d.statut === "BROUILLON") {
      actions.push(
        { cle: "soumettre", label: "Soumettre", style: "principal", executer: transitions(["SOUMISE"], "Dépense soumise") },
        {
          cle: "annuler-brouillon",
          label: "Abandonner le brouillon",
          style: "secondaire",
          confirmation: "Abandonner ce brouillon ? Il passera au statut Annulée.",
          executer: transitions(["ANNULEE"], "Brouillon abandonné"),
        },
      );
    }
    if (d.statut === "REJETEE" && estAuteur) {
      actions.push({
        cle: "resoumettre",
        label: "Resoumettre",
        style: "principal",
        confirmation: "Resoumettre cette dépense au RAF ?",
        executer: transitions(["BROUILLON", "SOUMISE"], "Dépense resoumise"),
      });
    }
  }

  if (aAcces(roles, [R.RAF])) {
    if (d.statut === "SOUMISE" || d.statut === "VERIFIEE") {
      const avant = d.statut === "SOUMISE" ? ["VERIFIEE"] : [];
      if (depasseSeuil(d)) {
        actions.push({
          cle: "transmettre",
          label: "Vérifier et transmettre au SE",
          style: "principal",
          confirmation: `Montant supérieur à ${montant(SEUIL_APPROBATION_SE)} : l'approbation du Secrétaire exécutif est requise.`,
          executer: transitions([...avant, "EN_APPROBATION_SE"], "Dépense transmise au SE"),
        });
      } else {
        actions.push({
          cle: "valider",
          label: "Vérifier et valider",
          style: "principal",
          confirmation: "Valider cette dépense ? Le montant sera imputé sur la ligne budgétaire.",
          executer: transitions([...avant, "VALIDEE"], "Dépense validée"),
        });
      }
      actions.push(rejeter);
    }
    if (d.statut === "VALIDEE") {
      actions.push({
        cle: "annuler",
        label: "Annuler la dépense",
        style: "danger",
        motif: true,
        confirmation: "Annuler cette dépense validée ? Le montant sera libéré sur la ligne budgétaire.",
        executer: async (motif) => {
          await annuler(d.id, motif, userId);
          return "Dépense annulée";
        },
      });
    }
  }

  if (aAcces(roles, [R.SE]) && d.statut === "EN_APPROBATION_SE") {
    actions.push(
      {
        cle: "approuver",
        label: "Approuver",
        style: "principal",
        confirmation: "Approuver cette dépense ? Le montant sera imputé sur la ligne budgétaire.",
        executer: transitions(["VALIDEE"], "Dépense approuvée"),
      },
      rejeter,
    );
  }

  return actions;
}
