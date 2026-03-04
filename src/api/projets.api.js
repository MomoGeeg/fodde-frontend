import * as ps from "@/services/projetService";

export const projetsApi = {
  getAll: () => ps.getAllProjets(),
  getById: (id) => ps.getProjetById(id),
  create: (data) => ps.createProjet(data),
  update: (id, data) => ps.updateProjet(id, data),
  changerStatut: (id, body) => ps.changerStatutProjet(id, body),
  prolongerDateFin: (id, nouvelleDateFin, justification) =>
    ps.prolongerProjet(id, nouvelleDateFin, justification),
  ajouterMembre: (id, userId) => ps.ajouterMembreEquipe(id, userId),
  retirerMembre: (projetId, userId) => ps.retirerMembreEquipe(projetId, userId),
};

export const activitesProjetApi = {
  getByProjet: (projetId) => ps.getActivitesByProjet(projetId),
  create: (data) => ps.createActivite(data),
  demarrer: (id) => ps.demarrerActivite(id),
  mettreAJourAvancement: (id, taux, statut) =>
    ps.mettreAJourAvancement(id, taux, statut),
};
