// ─────────────────────────────────────────────────────────────────────────────
// Missions : un employé demande une mission ; le responsable (N+1) peut donner
// son accord ; le RAF valide (décaissement autorisé) ou rejette.
// Circuit : SOUMISE → (APPROUVEE_N1 →) VALIDEE_RAF
// ─────────────────────────────────────────────────────────────────────────────
import api from "@/api/axios";
import { R, aAcces } from "@/lib/navigation";
import useAuthStore from "@/stores/auth.store";
import { useQuery } from "@tanstack/react-query";

export const STATUTS_MISSION = {
  SOUMISE: { label: "Soumise", ton: "info" },
  APPROUVEE_N1: { label: "Accord du responsable", ton: "info" },
  VALIDEE_RAF: { label: "Validée", ton: "succes" },
  REJETEE: { label: "Rejetée", ton: "danger" },
};

const VOIT_TOUT = [R.RAF, R.SE, R.ADMIN, R.RP];
const RESPONSABLES_N1 = [R.RP, R.SE];

/** RAF, SE, admin et responsable des programmes voient toutes les missions ; les autres, les leurs. */
export function useMissions() {
  const { user } = useAuthStore();
  const voitTout = aAcces(user?.roles ?? [], VOIT_TOUT);
  return useQuery({
    queryKey: ["missions", voitTout ? "toutes" : "miennes"],
    queryFn: async () => {
      const { data } = await api.get(voitTout ? "/api/missions" : "/api/missions/mes-missions");
      return Array.isArray(data) ? data : [];
    },
    enabled: !!user,
    staleTime: 30_000,
  });
}

export const creerMission = (payload, userId) =>
  api.post("/api/missions", payload, { params: { userId } }).then((r) => r.data);

export function etapesMission(m) {
  const etapes = [{ code: "SOUMISE", label: "Demandée" }];
  if (m.statut === "APPROUVEE_N1") etapes.push({ code: "APPROUVEE_N1", label: "Accord du responsable" });
  etapes.push({ code: "VALIDEE_RAF", label: "Validée par le RAF" });
  return etapes;
}

export function estATraiter(m, roles, userId) {
  if (aAcces(roles, [R.RAF]) && (m.statut === "SOUMISE" || m.statut === "APPROUVEE_N1")) return true;
  return aAcces(roles, RESPONSABLES_N1) && m.statut === "SOUMISE" && m.employeId !== userId;
}

export function actionsMission(m, roles, userId) {
  const actions = [];
  if (aAcces(roles, RESPONSABLES_N1) && m.statut === "SOUMISE" && m.employeId !== userId) {
    actions.push({
      cle: "accord",
      label: "Donner mon accord",
      style: aAcces(roles, [R.RAF]) ? "secondaire" : "principal",
      confirmation: "Donner votre accord de responsable ? Le RAF devra ensuite valider la mission.",
      executer: async () => {
        await api.patch(`/api/missions/${m.id}/approuver-n1`);
        return "Accord enregistré";
      },
    });
  }
  if (aAcces(roles, [R.RAF]) && (m.statut === "SOUMISE" || m.statut === "APPROUVEE_N1")) {
    actions.push(
      {
        cle: "valider",
        label: "Valider la mission",
        style: "principal",
        confirmation: "Valider cette mission ? Le décaissement du budget estimé sera autorisé.",
        executer: async () => {
          await api.patch(`/api/missions/${m.id}/valider`, { userId });
          return "Mission validée";
        },
      },
      {
        cle: "rejeter",
        label: "Rejeter",
        style: "danger",
        motif: true,
        confirmation: "Rejeter cette mission ? Le motif sera visible par l'employé.",
        executer: async (motif) => {
          await api.patch(`/api/missions/${m.id}/rejeter`, { motif, userId });
          return "Mission rejetée";
        },
      },
    );
  }
  return actions;
}
