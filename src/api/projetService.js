/**
 * Service Projets & Activités — Spring Boot API
 * Remplace les appels Supabase directs par des appels JWT via Axios.
 */
import api from "@/api/axios";

// ════════════════════════════════════════════════════════════════════════════
// PROJETS  —  /api/projets
// ════════════════════════════════════════════════════════════════════════════

export async function getAllProjets() {
  const res = await api.get("/api/projets");
  return res.data;
}

export async function getProjetById(id) {
  const res = await api.get(`/api/projets/${id}`);
  return res.data;
}

export async function createProjet(payload) {
  const res = await api.post("/api/projets", payload);
  return res.data;
}

export async function updateProjet(id, payload) {
  const res = await api.put(`/api/projets/${id}`, payload);
  return res.data;
}

export async function changerStatutProjet(id, { statut, validateurId, commentaire }) {
  const res = await api.patch(`/api/projets/${id}/statut`, {
    statut,
    validateurId: validateurId ?? null,
    commentaire: commentaire ?? null,
  });
  return res.data;
}

export async function prolongerProjet(id, nouvelleDateFin, justification) {
  const res = await api.patch(`/api/projets/${id}/prolonger`, null, {
    params: { nouvelleDateFin, justification },
  });
  return res.data;
}

export async function ajouterMembreEquipe(projetId, userId) {
  const res = await api.post(`/api/projets/${projetId}/equipe`, { userId });
  return res.data;
}

export async function retirerMembreEquipe(projetId, userId) {
  await api.delete(`/api/projets/${projetId}/equipe/${userId}`);
}

// ════════════════════════════════════════════════════════════════════════════
// ACTIVITÉS  —  /api/activites
// ════════════════════════════════════════════════════════════════════════════

export async function getActivitesByProjet(projetId) {
  const res = await api.get(`/api/activites/projet/${projetId}`);
  return res.data;
}

export async function createActivite(payload) {
  const res = await api.post("/api/activites", payload);
  return res.data;
}

export async function demarrerActivite(id) {
  const res = await api.patch(`/api/activites/${id}/demarrer`);
  return res.data;
}

export async function mettreAJourAvancement(id, taux, statut) {
  const params = {};
  if (taux != null) params.taux = taux;
  if (statut) params.statut = statut;
  const res = await api.patch(`/api/activites/${id}/avancement`, null, { params });
  return res.data;
}

// Helpers synchrones (pour compatibilité, pas de logique async)
export function joursRestants() { return null; }
export function urgenceContrat() { return false; }

// ════════════════════════════════════════════════════════════════════════════
// BAILLEURS — champs inclus dans le projet, pas d'endpoint séparé
// ════════════════════════════════════════════════════════════════════════════

export async function getBailleursByProjet() { return []; }
export async function createBailleur() { return null; }
