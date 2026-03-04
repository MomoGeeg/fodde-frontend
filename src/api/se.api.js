import * as se from "@/services/seService";

export const seApi = {
  getIndicateursByProjet: (projetId) => se.getIndicateursByProjet(projetId),
  mettreAJourValeur: (id, valeurAtteinte) =>
    se.mettreAJourValeurIndicateur(id, valeurAtteinte),
  getFormulairesByProjet: (projetId) => se.getFormulairesByProjet(projetId),
  publierFormulaire: (id) => se.publierFormulaire(id),
};
