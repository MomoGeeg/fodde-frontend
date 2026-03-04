import * as fs from "@/services/financeService";

export const financesApi = {
  getDepensesByProjet: (projetId) => fs.getDepensesByProjet(projetId),
  changerStatutDepense: (id, statut, userId, motif) =>
    fs.changerStatutDepense(id, statut, userId, motif),
  annulerDepense: (id, motif, userId) => fs.annulerDepense(id, motif, userId),
  getAvancesByProjet: (projetId) => fs.getDepensesByProjet(projetId),
};
