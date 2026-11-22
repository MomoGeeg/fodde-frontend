// ─────────────────────────────────────────────────────────────────────────────
// Acquisitions : un employé demande l'achat d'un bien pour un projet ; le RAF
// valide ou rejette. Le coordonnateur du projet (chef de projet) le vise d'abord,
// sauf s'il le demande lui-même. Circuit : (ATTENTE_COORDONNATEUR →) EN_ATTENTE → VALIDEE
// ─────────────────────────────────────────────────────────────────────────────
import api from "@/api/axios";
import { R, aAcces } from "@/lib/navigation";
import useAuthStore from "@/stores/auth.store";
import { useQuery } from "@tanstack/react-query";

export const STATUTS_ACQUISITION = {
  ATTENTE_COORDONNATEUR: { label: "Visa du coordonnateur", ton: "attention" },
  EN_ATTENTE: { label: "En attente", ton: "info" },
  VALIDEE: { label: "Validée", ton: "succes" },
  REJETEE: { label: "Rejetée", ton: "danger" },
};

export const CATEGORIES_ACQUISITION = {
  EQUIPEMENT: "Équipement",
  INFORMATIQUE: "Informatique",
  MOBILIER: "Mobilier",
  VEHICULE: "Véhicule",
  MATERIEL_AGRICOLE: "Matériel agricole",
  MATERIEL_MEDICAL: "Matériel médical",
  AUTRE: "Autre",
};

// La logistique voit toutes les acquisitions pour inventorier celles qui sont validées.
const VOIT_TOUT = [R.RAF, R.SE, R.ADMIN, R.LOG];

export function useAcquisitions() {
  const { user } = useAuthStore();
  const roles = user?.roles ?? [];
  const voitTout = aAcces(roles, VOIT_TOUT);
  return useQuery({
    queryKey: ["acquisitions", voitTout ? "toutes" : "miennes"],
    queryFn: async () => {
      if (voitTout) {
        const { data } = await api.get("/api/acquisitions");
        return Array.isArray(data) ? data : [];
      }
      const [miennes, projets] = await Promise.all([
        api.get("/api/acquisitions/mes-acquisitions").then((r) => r.data),
        api.get("/api/acquisitions/mes-projets").then((r) => r.data),
      ]);
      // Chacun voit ses demandes ; le coordonnateur aussi celles de ses projets, sans doublon.
      const parId = new Map();
      [...(miennes ?? []), ...(projets ?? [])].forEach((x) => parId.set(x.id, x));
      return [...parId.values()].sort((x, y) => (y.createdAt ?? "").localeCompare(x.createdAt ?? ""));
    },
    enabled: !!user,
    staleTime: 30_000,
  });
}

export const creerAcquisition = (payload, userId) =>
  api.post("/api/acquisitions", payload, { params: { userId } }).then((r) => r.data);

export const ETAPES_ACQUISITION = [
  { code: "EN_ATTENTE", label: "Demandée" },
  { code: "VALIDEE", label: "Validée par le RAF" },
];

/** Achat d'un projet qui a un coordonnateur : son visa avant le RAF. */
const ETAPES_ACQUISITION_COORDONNEE = [
  { code: "ATTENTE_COORDONNATEUR", label: "Demandée" },
  { code: "EN_ATTENTE", label: "Visée par le coordonnateur" },
  { code: "VALIDEE", label: "Validée par le RAF" },
];

const viseeParCoordonnateur = (a) => !!a?.coordonnateurId && a.coordonnateurId !== a.soumisParId;

export const etapesAcquisition = (a) =>
  a?.statut === "ATTENTE_COORDONNATEUR" || viseeParCoordonnateur(a) ? ETAPES_ACQUISITION_COORDONNEE : ETAPES_ACQUISITION;

const aViser = (a, userId) =>
  a.statut === "ATTENTE_COORDONNATEUR" && !!userId && a.coordonnateurId === userId && a.soumisParId !== userId;

export const estATraiter = (a, roles, userId) =>
  (aAcces(roles, [R.RAF]) && a.statut === "EN_ATTENTE") || aViser(a, userId);

export function actionsAcquisition(a, roles, userId) {
  if (aViser(a, userId)) {
    return [
      {
        cle: "viser",
        label: "Viser l'achat",
        style: "principal",
        confirmation: "Viser cet achat ? Il sera transmis au RAF.",
        executer: async () => {
          await api.patch(`/api/acquisitions/${a.id}/viser`);
          return "Achat visé et transmis au RAF";
        },
      },
      {
        cle: "rejeter",
        label: "Rejeter",
        style: "danger",
        motif: true,
        confirmation: "Rejeter cet achat ? Le motif sera visible par le demandeur.",
        executer: async (motif) => {
          await api.patch(`/api/acquisitions/${a.id}/rejeter-coordonnateur`, { motif });
          return "Achat rejeté";
        },
      },
    ];
  }
  if (!estATraiter(a, roles, userId)) return [];
  return [
    {
      cle: "valider",
      label: "Valider l'achat",
      style: "principal",
      confirmation: "Valider cette acquisition ?",
      executer: async () => {
        await api.patch(`/api/acquisitions/${a.id}/valider`, { userId });
        return "Acquisition validée";
      },
    },
    {
      cle: "rejeter",
      label: "Rejeter",
      style: "danger",
      motif: true,
      confirmation: "Rejeter cette acquisition ? Le motif sera visible par le demandeur.",
      executer: async (motif) => {
        await api.patch(`/api/acquisitions/${a.id}/rejeter`, { motif, userId });
        return "Acquisition rejetée";
      },
    },
  ];
}
