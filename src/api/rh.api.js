import * as rh from "@/services/rhService";

export const rhApi = {
  getEmployes: () => rh.getAllEmployes(),
  changerStatutEmploye: (id, statut) => rh.changerStatutEmploye(id, statut),
  getCongesEnAttente: () => rh.getCongesEnAttente(),
  getCongesValideN1: () => rh.getCongesValideN1(),
  validerN1: (id, validateurId) => rh.validerCongeN1(id, validateurId),
  approuverRH: (id, validateurId) => rh.approuverCongeRH(id, validateurId),
  rejeterConge: (id, validateurId, motif) =>
    rh.rejeterConge(id, validateurId, motif),
};
