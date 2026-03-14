// ════════════════════════════════════════════════════════════════════════════
// Bridge Module RH — mappe l'ancien rh-mock-data vers Supabase
// ════════════════════════════════════════════════════════════════════════════
import * as rh from "@/services/rhService";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// ── Re-exports helpers synchrones depuis le service ───────────────────────
export { joursRestants, urgenceContrat } from "@/services/rhService";

// ════════════════════════════════════════════════════════════════════════════
// QUERY KEYS
// ════════════════════════════════════════════════════════════════════════════
export const rhKeys = {
  employes: ["rh-employes"],
  employe: (id) => ["rh-employe", id],
  conges: ["rh-conges"],
  congesByEmploye: (id) => ["rh-conges", id],
  congesEnAttente: ["rh-conges-attente"],
  congesValideN1: ["rh-conges-valide-n1"],
  evaluations: ["rh-evaluations"],
  evaluationsByEmploye: (id) => ["rh-evaluations", id],
  criteresEvaluation: ["rh-criteres-evaluation"],
  missions: ["rh-missions"],
  missionsByEmploye: (id) => ["rh-missions", id],
  documentsEmploye: (id) => ["rh-documents", id],
  typesConges: ["rh-types-conges"],
  services: ["rh-services"],
};

// ════════════════════════════════════════════════════════════════════════════
// HOOKS — EMPLOYÉS
// ════════════════════════════════════════════════════════════════════════════

export function useEmployes() {
  return useQuery({
    queryKey: rhKeys.employes,
    queryFn: rh.getAllEmployes,
    staleTime: 5 * 60_000,
  });
}

export function useEmployeById(id) {
  return useQuery({
    queryKey: rhKeys.employe(id),
    queryFn: () => rh.getEmployeById(id),
    enabled: !!id,
    staleTime: 5 * 60_000,
  });
}

export function useCreateEmploye() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => rh.createEmploye(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: rhKeys.employes }),
  });
}

export function useUpdateEmploye() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => rh.updateEmploye(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: rhKeys.employes });
      qc.invalidateQueries({ queryKey: rhKeys.employe(id) });
    },
  });
}

export function useChangerStatutEmploye() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, statut }) => rh.changerStatutEmploye(id, statut),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: rhKeys.employes });
      qc.invalidateQueries({ queryKey: rhKeys.employe(id) });
    },
  });
}

// ════════════════════════════════════════════════════════════════════════════
// HOOKS — CONGÉS
// ════════════════════════════════════════════════════════════════════════════

export function useConges() {
  return useQuery({
    queryKey: rhKeys.conges,
    queryFn: rh.getAllConges,
    staleTime: 2 * 60_000,
  });
}

export function useCongesByEmploye(employeId) {
  return useQuery({
    queryKey: rhKeys.congesByEmploye(employeId),
    queryFn: () => rh.getCongesByEmploye(employeId),
    enabled: !!employeId,
    staleTime: 2 * 60_000,
  });
}

export function useCongesEnAttente() {
  return useQuery({
    queryKey: rhKeys.congesEnAttente,
    queryFn: rh.getCongesEnAttente,
    staleTime: 1 * 60_000,
  });
}

export function useCongesValideN1() {
  return useQuery({
    queryKey: rhKeys.congesValideN1,
    queryFn: rh.getCongesValideN1,
    staleTime: 1 * 60_000,
  });
}

export function useCreateConge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => rh.createConge(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: rhKeys.conges });
      qc.invalidateQueries({ queryKey: rhKeys.congesEnAttente });
    },
  });
}

export function useApprouverCongeRAF() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, validateurId }) => rh.approuverCongeRAF(id, validateurId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: rhKeys.conges });
      qc.invalidateQueries({ queryKey: rhKeys.congesEnAttente });
    },
  });
}

export function useRejeterConge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, validateurId, motif }) =>
      rh.rejeterConge(id, validateurId, motif),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: rhKeys.conges });
      qc.invalidateQueries({ queryKey: rhKeys.congesEnAttente });
      qc.invalidateQueries({ queryKey: rhKeys.congesValideN1 });
    },
  });
}

// ════════════════════════════════════════════════════════════════════════════
// HOOKS — TYPES CONGÉS & SERVICES
// ════════════════════════════════════════════════════════════════════════════

export function useTypesConges() {
  return useQuery({
    queryKey: rhKeys.typesConges,
    queryFn: rh.getTypesConges,
    staleTime: 10 * 60_000,
  });
}

export function useServices() {
  return useQuery({
    queryKey: rhKeys.services,
    queryFn: rh.getServices,
    staleTime: 10 * 60_000,
  });
}

// ════════════════════════════════════════════════════════════════════════════
// HOOKS — ÉVALUATIONS
// ════════════════════════════════════════════════════════════════════════════

export function useEvaluations() {
  return useQuery({
    queryKey: rhKeys.evaluations,
    queryFn: rh.getAllEvaluations,
    staleTime: 5 * 60_000,
  });
}

export function useEvaluationsByEmploye(employeId) {
  return useQuery({
    queryKey: rhKeys.evaluationsByEmploye(employeId),
    queryFn: () => rh.getEvaluationsByEmploye(employeId),
    enabled: !!employeId,
    staleTime: 5 * 60_000,
  });
}

export function useCreateEvaluation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => rh.createEvaluation(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: rhKeys.evaluations }),
  });
}

export function useUpdateEvaluation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => rh.updateEvaluation(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: rhKeys.evaluations }),
  });
}

// ════════════════════════════════════════════════════════════════════════════
// HOOKS — CRITÈRES D'ÉVALUATION
// ════════════════════════════════════════════════════════════════════════════

export function useCriteresEvaluation() {
  return useQuery({
    queryKey: rhKeys.criteresEvaluation,
    queryFn: rh.getCriteresEvaluation,
    staleTime: 10 * 60_000,
  });
}

// ════════════════════════════════════════════════════════════════════════════
// HOOKS — MISSIONS
// ════════════════════════════════════════════════════════════════════════════

export function useMissions() {
  return useQuery({
    queryKey: rhKeys.missions,
    queryFn: rh.getMissions,
    staleTime: 5 * 60_000,
  });
}

export function useMissionsByEmploye(employeId) {
  return useQuery({
    queryKey: rhKeys.missionsByEmploye(employeId),
    queryFn: () => rh.getMissionsByEmploye(employeId),
    enabled: !!employeId,
    staleTime: 5 * 60_000,
  });
}

// ════════════════════════════════════════════════════════════════════════════
// HOOKS — DOCUMENTS
// ════════════════════════════════════════════════════════════════════════════

export function useDocumentsEmploye(employeId) {
  return useQuery({
    queryKey: rhKeys.documentsEmploye(employeId),
    queryFn: () => rh.getDocumentsEmploye(employeId),
    enabled: !!employeId,
    staleTime: 5 * 60_000,
  });
}

// ════════════════════════════════════════════════════════════════════════════
// HELPERS SYNCHRONES (prennent les données en paramètre)
// ════════════════════════════════════════════════════════════════════════════

/** Retrouver un employé par id dans une liste déjà chargée */
export function getEmploye(employes, id) {
  return employes?.find((e) => e.id === id || e.id === Number(id));
}

/** Filtrer les congés pour un employé donné */
export function getCongesForEmploye(conges, employeId) {
  return conges?.filter(
    (c) => c.employe_id === employeId || c.employeId === employeId,
  );
}

/** Filtrer les évaluations pour un employé donné */
export function getEvaluationsForEmploye(evaluations, employeId) {
  return evaluations?.filter(
    (e) => e.employe_id === employeId || e.employeId === employeId,
  );
}

/** Filtrer les missions pour un employé donné */
export function getMissionsForEmploye(missions, employeId) {
  return missions?.filter(
    (m) => m.employe_id === employeId || m.employeId === employeId,
  );
}

/** Filtrer les documents pour un employé donné */
export function getDocumentsForEmploye(documents, employeId) {
  return documents?.filter(
    (d) => d.employe_id === employeId || d.employeId === employeId,
  );
}
