import * as ps from "@/services/projetService";

export const activitesApi = {
  getByProjet: (projetId) => ps.getActivitesByProjet(projetId),
  demarrer: (id) => ps.demarrerActivite(id),
  mettreAJourAvancement: (id, tauxAvancement) =>
    ps.mettreAJourAvancement(id, tauxAvancement),
};
