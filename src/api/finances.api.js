import api from "@/api/axios";

/**
 * Crée une dépense (statut BROUILLON) via Spring Boot.
 * @param {Object} payload — champs DepenseRequest (ligneBudgetaireId, projetId, libelle, montant, devise, modePaiement, beneficiaire, dateDepense)
 * @param {string} userId
 */
export async function creerDepense(payload, userId) {
  const { data } = await api.post(`/api/depenses?userId=${userId}`, payload);
  return data;
}

/**
 * Change le statut d'une dépense (BROUILLON→SOUMISE, SOUMISE→VERIFIEE, etc.)
 * @param {string} id
 * @param {string} statut — valeur de StatutDepense
 * @param {string} userId
 * @param {string|null} motif
 */
export async function changerStatutDepense(id, statut, userId, motif = null) {
  const body = { statut, userId };
  if (motif) body.motif = motif;
  const { data } = await api.patch(`/api/depenses/${id}/statut`, body);
  return data;
}

/**
 * Annule une dépense (ROLE_RAF, ROLE_COMPTABLE, ROLE_ADMIN)
 * @param {string} id
 * @param {string} motif — obligatoire
 * @param {string} userId
 */
export async function annulerDepense(id, motif, userId) {
  const { data } = await api.patch(
    `/api/depenses/${id}/annuler?motif=${encodeURIComponent(motif)}&userId=${userId}`,
  );
  return data;
}

export const financesApi = {
  creerDepense,
  changerStatutDepense,
  annulerDepense,
};
