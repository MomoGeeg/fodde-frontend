// ─────────────────────────────────────────────────────────────────────────────
// Acquisitions : le matériel de terrain est déployé avant l'arrivée des agents ;
// seul le coordonnateur du projet (chef de projet) lance un achat, adressé au RAF.
// Le RAF valide, rejette ou, s'il le juge nécessaire, transmet au RP.
// Circuit : EN_ATTENTE (→ ATTENTE_RP) → VALIDEE
// ─────────────────────────────────────────────────────────────────────────────
import api from "@/api/axios";
import { useProjets } from "@/api/depenses";
import { R, aAcces } from "@/lib/navigation";
import useAuthStore from "@/stores/auth.store";
import { useQuery } from "@tanstack/react-query";

export const STATUTS_ACQUISITION = {
  EN_ATTENTE: { label: "Chez le RAF", ton: "info" },
  ATTENTE_RP: { label: "Chez le RP", ton: "attention" },
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
const VOIT_TOUT = [R.RAF, R.RP, R.SE, R.ADMIN, R.LOG];

export function useAcquisitions() {
  const { user } = useAuthStore();
  const voitTout = aAcces(user?.roles ?? [], VOIT_TOUT);
  return useQuery({
    queryKey: ["acquisitions", voitTout ? "toutes" : "miennes"],
    queryFn: async () => {
      const { data } = await api.get(voitTout ? "/api/acquisitions" : "/api/acquisitions/mes-acquisitions");
      return (Array.isArray(data) ? data : []).sort((x, y) => (y.createdAt ?? "").localeCompare(x.createdAt ?? ""));
    },
    enabled: !!user,
    staleTime: 30_000,
  });
}

/** Projets actifs dont l'utilisateur est le coordonnateur : les seuls pour lesquels il lance un achat. */
export function useProjetsPilotes() {
  const { user } = useAuthStore();
  const requete = useProjets();
  const projets = (requete.data ?? []).filter((p) => p.statut === "ACTIF" && !!user?.id && p.chefProjetId === user.id);
  return { ...requete, data: projets };
}

export const creerAcquisition = (payload, userId) =>
  api.post("/api/acquisitions", payload, { params: { userId } }).then((r) => r.data);

const ETAPES_ACQUISITION = [
  { code: "EN_ATTENTE", label: "Demandée" },
  { code: "VALIDEE", label: "Validée" },
];

const ETAPES_ACQUISITION_RP = [
  { code: "EN_ATTENTE", label: "Demandée" },
  { code: "ATTENTE_RP", label: "Transmise au RP" },
  { code: "VALIDEE", label: "Validée" },
];

export const etapesAcquisition = (a) => (a?.statut === "ATTENTE_RP" ? ETAPES_ACQUISITION_RP : ETAPES_ACQUISITION);

export const estATraiter = (a, roles) =>
  (aAcces(roles, [R.RAF]) && a.statut === "EN_ATTENTE") || (aAcces(roles, [R.RP]) && a.statut === "ATTENTE_RP");

const rejet = (url) => ({
  cle: "rejeter",
  label: "Rejeter",
  style: "danger",
  motif: true,
  confirmation: "Rejeter cette acquisition ? Le motif sera visible par le demandeur.",
  executer: async (motif) => {
    await api.patch(url, { motif });
    return "Acquisition rejetée";
  },
});

export function actionsAcquisition(a, roles, userId) {
  if (aAcces(roles, [R.RP]) && a.statut === "ATTENTE_RP") {
    return [
      {
        cle: "valider",
        label: "Valider l'achat",
        style: "principal",
        confirmation: "Valider cette acquisition ?",
        executer: async () => {
          await api.patch(`/api/acquisitions/${a.id}/valider-rp`);
          return "Acquisition validée";
        },
      },
      rejet(`/api/acquisitions/${a.id}/rejeter-rp`),
    ];
  }
  if (!(aAcces(roles, [R.RAF]) && a.statut === "EN_ATTENTE")) return [];
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
      cle: "transmettre",
      label: "Transmettre au RP",
      style: "secondaire",
      confirmation: "Transmettre cet achat au responsable des programmes pour validation ?",
      executer: async () => {
        await api.patch(`/api/acquisitions/${a.id}/transmettre-rp`);
        return "Achat transmis au RP";
      },
    },
    rejet(`/api/acquisitions/${a.id}/rejeter`),
  ];
}
