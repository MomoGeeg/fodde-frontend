// ─────────────────────────────────────────────────────────────────────────────
// Acquisitions : un employé demande l'achat d'un bien pour un projet ; le RAF
// valide ou rejette. Circuit : EN_ATTENTE → VALIDEE
// ─────────────────────────────────────────────────────────────────────────────
import api from "@/api/axios";
import { R, aAcces } from "@/lib/navigation";
import useAuthStore from "@/stores/auth.store";
import { useQuery } from "@tanstack/react-query";

export const STATUTS_ACQUISITION = {
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

const VOIT_TOUT = [R.RAF, R.SE, R.ADMIN];

export function useAcquisitions() {
  const { user } = useAuthStore();
  const voitTout = aAcces(user?.roles ?? [], VOIT_TOUT);
  return useQuery({
    queryKey: ["acquisitions", voitTout ? "toutes" : "miennes"],
    queryFn: async () => {
      const { data } = await api.get(voitTout ? "/api/acquisitions" : "/api/acquisitions/mes-acquisitions");
      return Array.isArray(data) ? data : [];
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

export const estATraiter = (a, roles) => aAcces(roles, [R.RAF]) && a.statut === "EN_ATTENTE";

export function actionsAcquisition(a, roles, userId) {
  if (!estATraiter(a, roles)) return [];
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
