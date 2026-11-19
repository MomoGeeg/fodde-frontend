// ─────────────────────────────────────────────────────────────────────────────
// Périmètres : situés dans un village, liés à un seul projet, suivis par un
// technicien terrain et son superviseur. Gérés par le chef de projet ou le RP.
// ─────────────────────────────────────────────────────────────────────────────
import api from "@/api/axios";

export const perimetresApi = {
  parProjet: (projetId) =>
    api.get(`/api/perimetres/projet/${projetId}`).then((r) => r.data),
  mesPerimetres: () =>
    api.get("/api/perimetres/mes-perimetres").then((r) => r.data),
  intervenants: () =>
    api.get("/api/perimetres/intervenants").then((r) => r.data),
  creer: (data) => api.post("/api/perimetres", data).then((r) => r.data),
  modifier: (id, data) =>
    api.put(`/api/perimetres/${id}`, data).then((r) => r.data),
  supprimer: (id) => api.delete(`/api/perimetres/${id}`),
};

/** Espace terrain : activités du technicien ou du superviseur, participants des formations. */
export const terrainApi = {
  mesActivites: () =>
    api.get("/api/activites/mes-activites").then((r) => r.data),
  enregistrerParticipants: (id, participants, femmes) => {
    const params = {};
    if (participants != null) params.participants = participants;
    if (femmes != null) params.femmes = femmes;
    return api
      .patch(`/api/activites/${id}/participants`, null, { params })
      .then((r) => r.data);
  },
};

/** Mêmes droits que le backend : RP, admin ou chef de projet désigné. */
export function peutGererPerimetres(user, projet) {
  const roles = user?.roles ?? [];
  return (
    roles.includes("ROLE_RESPONSABLE_PROGRAMMES") ||
    roles.includes("ROLE_ADMIN") ||
    (!!user?.id && user.id === projet?.chefProjetId)
  );
}
