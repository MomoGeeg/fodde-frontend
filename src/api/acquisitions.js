// ─────────────────────────────────────────────────────────────────────────────
// Acquisitions : un employé demande l'achat d'un bien pour un projet ; le RAF
// valide ou rejette. Achat pour un périmètre : le superviseur du périmètre le
// vise d'abord. Circuit : (ATTENTE_SUPERVISEUR →) EN_ATTENTE → VALIDEE
// ─────────────────────────────────────────────────────────────────────────────
import api from "@/api/axios";
import { R, aAcces } from "@/lib/navigation";
import useAuthStore from "@/stores/auth.store";
import { useQuery } from "@tanstack/react-query";

export const STATUTS_ACQUISITION = {
  ATTENTE_SUPERVISEUR: { label: "Visa du superviseur", ton: "attention" },
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
  const superviseur = !voitTout && aAcces(roles, [R.SUP]);
  return useQuery({
    queryKey: ["acquisitions", voitTout ? "toutes" : superviseur ? "supervisees" : "miennes"],
    queryFn: async () => {
      if (voitTout) {
        const { data } = await api.get("/api/acquisitions");
        return Array.isArray(data) ? data : [];
      }
      const [miennes, supervisees] = await Promise.all([
        api.get("/api/acquisitions/mes-acquisitions").then((r) => r.data),
        superviseur ? api.get("/api/acquisitions/supervises").then((r) => r.data) : [],
      ]);
      // Le superviseur voit ses demandes et celles de ses périmètres, sans doublon.
      const parId = new Map();
      [...(miennes ?? []), ...(supervisees ?? [])].forEach((x) => parId.set(x.id, x));
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

/** Achat pour un périmètre : visa du superviseur avant le RAF. */
const ETAPES_ACQUISITION_TERRAIN = [
  { code: "ATTENTE_SUPERVISEUR", label: "Demandée" },
  { code: "EN_ATTENTE", label: "Visée par le superviseur" },
  { code: "VALIDEE", label: "Validée par le RAF" },
];

export const etapesAcquisition = (a) => (a?.perimetreId ? ETAPES_ACQUISITION_TERRAIN : ETAPES_ACQUISITION);

/** Le service vérifie en plus que l'utilisateur supervise bien le périmètre de l'achat. */
const aViser = (a, roles, userId) =>
  aAcces(roles, [R.SUP]) && a.statut === "ATTENTE_SUPERVISEUR" && a.soumisParId !== userId;

export const estATraiter = (a, roles, userId) =>
  (aAcces(roles, [R.RAF]) && a.statut === "EN_ATTENTE") || aViser(a, roles, userId);

export function actionsAcquisition(a, roles, userId) {
  if (aViser(a, roles, userId)) {
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
          await api.patch(`/api/acquisitions/${a.id}/rejeter-superviseur`, { motif });
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
