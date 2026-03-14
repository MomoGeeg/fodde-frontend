/**
 * Service RH — Spring Boot API
 * Remplace les appels Supabase directs par des appels à l'API REST Spring Boot.
 */
import api from "@/api/axios";

// ════════════════════════════════════════════════════════════════════════════
// EMPLOYÉS  —  /api/employes
// ════════════════════════════════════════════════════════════════════════════

export async function getAllEmployes() {
  const res = await api.get("/api/employes");
  return res.data;
}

export async function getEmployeById(id) {
  const res = await api.get(`/api/employes/${id}`);
  return res.data;
}

export async function createEmploye(payload) {
  const res = await api.post("/api/employes", payload);
  return res.data;
}

// La mise à jour complète n'existe pas en REST pur — on passe par statut ou on ajoute un PUT si nécessaire
export async function updateEmploye(id, payload) {
  if (payload.statut) {
    const res = await api.patch(`/api/employes/${id}/statut`, null, {
      params: { statut: payload.statut },
    });
    return res.data;
  }
  // Fallback : mettre à jour via PUT si le backend l'expose plus tard
  const res = await api.put(`/api/employes/${id}`, payload);
  return res.data;
}

export async function changerStatutEmploye(id, statut) {
  const res = await api.patch(`/api/employes/${id}/statut`, null, {
    params: { statut },
  });
  return res.data;
}

// ════════════════════════════════════════════════════════════════════════════
// CONGÉS  —  /api/conges
// ════════════════════════════════════════════════════════════════════════════

export async function getAllConges() {
  const res = await api.get("/api/conges");
  return res.data;
}

export async function getCongesByEmploye(employeId) {
  const res = await api.get(`/api/conges/mes-conges/${employeId}`);
  return res.data;
}

export async function getCongesEnAttente() {
  const res = await api.get("/api/conges/en-attente");
  return res.data;
}

export async function getCongesValideN1() {
  const res = await api.get("/api/conges/valide-n1");
  return res.data;
}

export async function createConge(payload) {
  const res = await api.post("/api/conges", payload);
  return res.data;
}

export async function approuverCongeRAF(id, validateurId) {
  const res = await api.patch(`/api/conges/${id}/approuver`, null, {
    params: { validateurId },
  });
  return res.data;
}

export async function rejeterConge(id, validateurId, motif) {
  const res = await api.patch(`/api/conges/${id}/rejeter`, null, {
    params: { validateurId, motif },
  });
  return res.data;
}

export async function annulerConge(id) {
  const res = await api.patch(`/api/conges/${id}/annuler`);
  return res.data;
}

// ════════════════════════════════════════════════════════════════════════════
// TYPES CONGÉS  —  valeurs de l'enum TypeConge backend
// ════════════════════════════════════════════════════════════════════════════

export async function getTypesConges() {
  // L'enum est statique côté backend — on retourne les valeurs connues
  return [
    { id: "ANNUEL",       nom: "Congé annuel" },
    { id: "MALADIE",      nom: "Congé maladie" },
    { id: "MATERNITE",    nom: "Congé maternité" },
    { id: "PATERNITE",    nom: "Congé paternité" },
    { id: "SANS_SOLDE",   nom: "Congé sans solde" },
    { id: "EXCEPTIONNEL", nom: "Congé exceptionnel" },
  ];
}

// ════════════════════════════════════════════════════════════════════════════
// SERVICES / DÉPARTEMENTS  —  extraits dynamiquement des employés
// ════════════════════════════════════════════════════════════════════════════

export async function getServices() {
  const employes = await getAllEmployes();
  const set = new Set(employes.map((e) => e.departement).filter(Boolean));
  return [...set].sort().map((nom) => ({ id: nom, nom }));
}

// ════════════════════════════════════════════════════════════════════════════
// ÉVALUATIONS  —  /api/evaluations
// ════════════════════════════════════════════════════════════════════════════

export async function getAllEvaluations() {
  const res = await api.get("/api/evaluations");
  return res.data;
}

export async function getEvaluationsByEmploye(employeId) {
  const res = await api.get(`/api/evaluations/employe/${employeId}`);
  return res.data;
}

export async function createEvaluation(payload) {
  const res = await api.post("/api/evaluations", payload);
  return res.data;
}

export async function updateEvaluation(id, payload) {
  // Pas de PUT générique — on utilise les endpoints métier (soumettre/valider)
  if (payload.statut === "SOUMISE") {
    const res = await api.patch(`/api/evaluations/${id}/soumettre`);
    return res.data;
  }
  if (payload.statut === "VALIDEE") {
    const res = await api.patch(`/api/evaluations/${id}/valider`);
    return res.data;
  }
  throw new Error("updateEvaluation: statut non supporté : " + payload.statut);
}

// ════════════════════════════════════════════════════════════════════════════
// CRITÈRES D'ÉVALUATION  —  valeurs statiques (pas d'endpoint backend)
// ════════════════════════════════════════════════════════════════════════════

export async function getCriteresEvaluation() {
  return [
    { id: "COMPETENCES",    nom: "Compétences techniques" },
    { id: "PONCTUALITE",    nom: "Ponctualité" },
    { id: "TRAVAIL_EQUIPE", nom: "Travail en équipe" },
    { id: "INITIATIVES",    nom: "Initiatives" },
    { id: "RESULTATS",      nom: "Atteinte des résultats" },
  ];
}

// ════════════════════════════════════════════════════════════════════════════
// MISSIONS  —  /api/missions (RAF) retournées tel quel
// ════════════════════════════════════════════════════════════════════════════

export async function getMissions() {
  const res = await api.get("/api/missions").catch(() => ({ data: [] }));
  return res.data;
}

export async function getMissionsByEmploye(employeId) {
  // Pas d'endpoint dédié — filtre côté client
  const missions = await getMissions();
  return missions.filter((m) => m.employeId === employeId);
}

// ════════════════════════════════════════════════════════════════════════════
// DOCUMENTS RH  —  pas encore exposé dans Spring Boot (retourne [])
// ════════════════════════════════════════════════════════════════════════════

export async function getDocumentsEmploye(_employeId) {
  return [];
}

// ════════════════════════════════════════════════════════════════════════════
// HELPERS CÔTÉ CLIENT
// ════════════════════════════════════════════════════════════════════════════

export function joursRestants(dateFin) {
  if (!dateFin) return null;
  return Math.ceil((new Date(dateFin) - new Date()) / (1000 * 60 * 60 * 24));
}

export function urgenceContrat(dateFin) {
  const j = joursRestants(dateFin);
  if (j === null || j <= 0) return null;
  if (j <= 7)  return "CRITIQUE";
  if (j <= 30) return "DANGER";
  if (j <= 60) return "WARNING";
  return null;
}
