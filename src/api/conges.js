// ─────────────────────────────────────────────────────────────────────────────
// Congés : l'employé demande ; les RH valident et transmettent ; le RAF approuve.
// Les RH peuvent aussi enregistrer un congé pour un employé (il part au RAF).
// Chacun voit ses propres congés (fiche employé liée à son compte).
// Circuit : EN_ATTENTE (chez les RH), VALIDE_RH (chez le RAF), APPROUVE
// ─────────────────────────────────────────────────────────────────────────────
import api from "@/api/axios";
import { R, aAcces } from "@/lib/navigation";
import useAuthStore from "@/stores/auth.store";
import { useQuery } from "@tanstack/react-query";

export const STATUTS_CONGE = {
  EN_ATTENTE: { label: "Chez les RH", ton: "info" },
  VALIDE_RH: { label: "Chez le RAF", ton: "info" },
  VALIDE_N1: { label: "Accord du responsable", ton: "info" },
  APPROUVE: { label: "Approuvé", ton: "succes" },
  REJETE: { label: "Rejeté", ton: "danger" },
  ANNULE: { label: "Annulé", ton: "neutre" },
};

export const TYPES_CONGE = {
  ANNUEL: "Congé annuel",
  MALADIE: "Maladie",
  MATERNITE: "Maternité",
  PATERNITE: "Paternité",
  SANS_SOLDE: "Sans solde",
  RECUPERATION: "Récupération",
  MISSION: "Mission",
};

/** Rôles qui voient les congés de tout le monde ; les autres voient les leurs. */
export const VOIT_TOUS_LES_CONGES = [R.RH, R.RAF, R.SE, R.RP];

const tableau = (r) => (Array.isArray(r.data) ? r.data : []);

/**
 * Fiche employé liée au compte connecté (solde de congés…), ou null si
 * l'administrateur ne l'a pas encore associée (le backend répond 204).
 */
export function useMaFiche() {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: ["employes", "moi", user?.id],
    queryFn: () => api.get("/api/employes/moi").then((r) => (r.status === 204 || !r.data ? null : r.data)),
    enabled: !!user,
    staleTime: 5 * 60_000,
  });
}

/**
 * Demandes de congé, avec le nom de l'employé (la réponse du backend ne le contient pas).
 * RH, RAF, SE et responsable des programmes voient tout ; chacun voit les siennes
 * (par la fiche employé liée à son compte).
 */
export function useConges() {
  const { user } = useAuthStore();
  const voitTout = aAcces(user?.roles ?? [], VOIT_TOUS_LES_CONGES);
  return useQuery({
    queryKey: ["conges", voitTout ? "tous" : "miens", user?.id],
    queryFn: async () => {
      if (!voitTout) {
        const [conges, moi] = await Promise.all([
          api.get("/api/conges/mes-conges").then(tableau),
          api.get("/api/employes/moi").then((r) => (r.status === 204 ? null : r.data)).catch(() => null),
        ]);
        const nom = moi ? `${moi.prenom} ${moi.nom}` : "Moi";
        return conges.map((c) => ({ ...c, employeNom: nom, employePoste: moi?.poste }));
      }
      const [conges, employes] = await Promise.all([
        api.get("/api/conges").then(tableau),
        api.get("/api/employes").then(tableau).catch(() => []),
      ]);
      const parId = new Map(employes.map((e) => [e.id, e]));
      return conges.map((c) => {
        const e = parId.get(c.employeId);
        return { ...c, employeNom: e ? `${e.prenom} ${e.nom}` : "Employé inconnu", employePoste: e?.poste };
      });
    },
    enabled: !!user,
    staleTime: 30_000,
  });
}

/** Employés actifs, pour choisir à qui s'applique une demande (avec leur solde). */
export function useEmployesActifs({ enabled = true } = {}) {
  return useQuery({
    queryKey: ["employes", "actifs"],
    enabled,
    queryFn: async () => {
      const { data } = await api.get("/api/employes");
      return (Array.isArray(data) ? data : [])
        .filter((e) => e.statut === "ACTIF")
        .sort((a, b) => `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`));
    },
    staleTime: 5 * 60_000,
  });
}

export const creerConge = (payload) => api.post("/api/conges", payload).then((r) => r.data);

export const ETAPES_CONGE = [
  { code: "EN_ATTENTE", label: "Demandée" },
  { code: "VALIDE_RH", label: "Validée par les RH" },
  { code: "APPROUVE", label: "Approuvée par le RAF" },
];

/** Demande qui attend l'utilisateur : les RH à la première étape, le RAF à la seconde. */
export const estATraiter = (c, roles) =>
  (aAcces(roles, [R.RH]) && c.statut === "EN_ATTENTE") || (aAcces(roles, [R.RAF]) && c.statut === "VALIDE_RH");

const rejet = (c) => ({
  cle: "rejeter",
  label: "Rejeter",
  style: "danger",
  motif: true,
  confirmation: "Rejeter cette demande de congé ?",
  executer: async (motif) => {
    await api.patch(`/api/conges/${c.id}/rejeter`, null, { params: { motif } });
    return "Demande rejetée";
  },
});

/** Actions possibles ; `estMoi` = la demande concerne la personne connectée. */
export function actionsConge(c, roles, estMoi = false) {
  const actions = [];
  if (aAcces(roles, [R.RH]) && c.statut === "EN_ATTENTE") {
    actions.push(
      {
        cle: "valider-rh",
        label: "Valider et transmettre au RAF",
        style: "principal",
        confirmation: `Valider ce congé de ${c.nbJours ?? "?"} jour(s) et le transmettre au RAF ?`,
        executer: async () => {
          await api.patch(`/api/conges/${c.id}/valider-rh`);
          return "Congé transmis au RAF";
        },
      },
      rejet(c),
    );
  }
  if (aAcces(roles, [R.RAF]) && c.statut === "VALIDE_RH") {
    actions.push(
      {
        cle: "approuver",
        label: "Approuver",
        style: "principal",
        confirmation: `Approuver ce congé de ${c.nbJours ?? "?"} jour(s) ?`,
        executer: async () => {
          await api.patch(`/api/conges/${c.id}/approuver`);
          return "Congé approuvé";
        },
      },
      rejet(c),
    );
  }
  if ((estMoi || aAcces(roles, [R.RH])) && ["EN_ATTENTE", "VALIDE_RH"].includes(c.statut)) {
    actions.push({
      cle: "annuler",
      label: "Annuler la demande",
      style: "secondaire",
      confirmation: "Annuler cette demande de congé ?",
      executer: async () => {
        await api.patch(`/api/conges/${c.id}/annuler`);
        return "Demande annulée";
      },
    });
  }
  return actions;
}
