import api from "@/api/axios";

// ─────────────────────────────────────────────────────────────────────────────
// Animateurs des projets, activités de terrain et leurs pièces : une liste de
// présence (CSV) qui donne les participants, et jusqu'à trois photos.
// ─────────────────────────────────────────────────────────────────────────────

export const TYPES_ACTIVITE = {
  ACTIVITE: "Activité",
  FORMATION: "Formation",
  SENSIBILISATION: "Sensibilisation",
  SUIVI: "Suivi",
};

/** Types proposés à l'animateur quand il planifie une activité. */
export const TYPES_ANIMATEUR = ["SENSIBILISATION", "FORMATION", "SUIVI"];

export const PHOTOS_MAX = 3;

export const animateursApi = {
  duProjet: (projetId) => api.get(`/api/projets/${projetId}/animateurs`).then((r) => r.data),
  disponibles: () => api.get("/api/animateurs/disponibles").then((r) => r.data),
  affecter: (projetId, animateurId) =>
    api.post(`/api/projets/${projetId}/animateurs`, { animateurId }).then((r) => r.data),
  retirer: (projetId, animateurId) => api.delete(`/api/projets/${projetId}/animateurs/${animateurId}`),
  mesProjets: () => api.get("/api/animateurs/mes-projets").then((r) => r.data),
};

const envoyer = (url, fichier) => {
  const corps = new FormData();
  corps.append("fichier", fichier);
  return api.post(url, corps).then((r) => r.data);
};

export const activitesTerrainApi = {
  creer: (data) => api.post("/api/activites", data).then((r) => r.data),
  ficheSuivi: (id, ficheSuivi) => api.patch(`/api/activites/${id}/fiche-suivi`, { ficheSuivi }).then((r) => r.data),
  realisee: (id) => api.patch(`/api/activites/${id}/realisee`).then((r) => r.data),
  pieces: (id) => api.get(`/api/activites/${id}/pieces`).then((r) => r.data),
  listePresence: (id, fichier) => envoyer(`/api/activites/${id}/liste-presence`, fichier),
  ajouterPhoto: (id, fichier) => envoyer(`/api/activites/${id}/photos`, fichier),
  retirerPhoto: (id, pieceId) => api.delete(`/api/activites/${id}/photos/${pieceId}`),
};

/** Télécharge une pièce d'activité sous son nom d'origine. */
export async function telechargerPieceActivite(activiteId, piece) {
  const { data } = await api.get(`/api/activites/${activiteId}/pieces/${piece.id}/fichier`, { responseType: "blob" });
  const url = URL.createObjectURL(data);
  const a = document.createElement("a");
  a.href = url;
  a.download = piece.nom;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
