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

/** Espace terrain : activités du technicien, de l'animateur ou du superviseur. */
export const terrainApi = {
  mesActivites: () =>
    api.get("/api/activites/mes-activites").then((r) => r.data),
};

/** Indicateurs du projet relevés sur un périmètre. */
export const indicateursPerimetreApi = {
  duPerimetre: (id) =>
    api.get(`/api/perimetres/${id}/indicateurs`).then((r) => r.data),
  mesIndicateurs: () =>
    api.get("/api/perimetres/mes-indicateurs").then((r) => r.data),
  enregistrer: (id, data) =>
    api.post(`/api/perimetres/${id}/mesures`, data).then((r) => r.data),
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
