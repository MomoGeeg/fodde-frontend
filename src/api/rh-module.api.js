import api from "./axios";

export const rhModuleApi = {
  // ── Tableau de bord ──────────────────────────────────────
  getDashboardKpis: () => api.get("/api/rh/dashboard/kpis"),
  getRepartitionStatut: () => api.get("/api/rh/dashboard/repartition-statut"),
  getRepartitionContrat: () => api.get("/api/rh/dashboard/repartition-contrat"),
  getRepartitionService: () => api.get("/api/rh/dashboard/repartition-service"),
  getAbsencesCalendrier: () => api.get("/api/rh/dashboard/absences-calendrier"),
  getAlertesActives: () => api.get("/api/rh/dashboard/alertes"),

  // ── Employés ─────────────────────────────────────────────
  getEmployes: () => api.get("/api/employes"),
  getEmployeById: (id) => api.get(`/api/employes/${id}`),
  createEmploye: (data) => api.post("/api/employes", data),
  updateEmploye: (id, data) => api.put(`/api/employes/${id}`, data),
  changerStatutEmploye: (id, statut) =>
    api.patch(`/api/employes/${id}/statut`, null, { params: { statut } }),
  getEmployeContrats: (id) => api.get(`/api/employes/${id}/contrats`),
  getEmployeConges: (id) => api.get(`/api/employes/${id}/conges`),
  getEmployeEvaluations: (id) => api.get(`/api/employes/${id}/evaluations`),
  getEmployeMissions: (id) => api.get(`/api/employes/${id}/missions`),
  getEmployeDocuments: (id) => api.get(`/api/employes/${id}/documents`),

  // ── Congés ───────────────────────────────────────────────
  getAllConges: (params) => api.get("/api/conges", { params }),
  getCongesEnAttente: () => api.get("/api/conges/en-attente"),
  getCongesValideN1: () => api.get("/api/conges/valide-n1"),
  createConge: (data) => api.post("/api/conges", data),
  validerN1: (id, validateurId) =>
    api.patch(`/api/conges/${id}/valider-n1`, null, {
      params: { validateurId },
    }),
  approuverRH: (id, validateurId) =>
    api.patch(`/api/conges/${id}/approuver-rh`, null, {
      params: { validateurId },
    }),
  rejeterConge: (id, validateurId, motif) =>
    api.patch(`/api/conges/${id}/rejeter`, null, {
      params: { validateurId, motif },
    }),

  // ── Évaluations ──────────────────────────────────────────
  getAllEvaluations: (params) => api.get("/api/evaluations", { params }),
  getEvaluationById: (id) => api.get(`/api/evaluations/${id}`),
  createEvaluation: (data) => api.post("/api/evaluations", data),
  updateEvaluation: (id, data) => api.put(`/api/evaluations/${id}`, data),
  signerEvaluation: (id) => api.patch(`/api/evaluations/${id}/signer`),

  // ── Alertes RH ───────────────────────────────────────────
  getContratEcheances: () => api.get("/api/rh/alertes/contrats-echeance"),
  getEvaluationsRetard: () => api.get("/api/rh/alertes/evaluations-retard"),
  getCongesEnAttenteAlerte: () => api.get("/api/rh/alertes/conges-attente"),
  getSoldesNegatifs: () => api.get("/api/rh/alertes/soldes-negatifs"),
};
