// ============================================================
// API RAF — proxy vers les services Supabase
// ============================================================
import * as raf from "@/services/rafService";

export const rafApi = {
  // ─── KPI & Alertes ──────────────────────────────────────
  getProjets: () => raf.getProjetsRAF(),
  getAlertes: () => raf.getAlertesRAF(),

  // ─── Dépenses ───────────────────────────────────────────
  getDepensesEnAttente: () => raf.getDepensesEnAttente(),
  getDepensesCount: () => raf.getDepensesCount(),
  validerDepense: (id) => raf.validerDepense(id),
  transmettreAuSE: (id) => raf.transmettreAuSE(id),
  rejeterDepense: (id, motif) => raf.rejeterDepense(id, motif),

  // ─── Lignes budgétaires ─────────────────────────────────
  getLignesBudgetaires: (projetId) =>
    projetId ? raf.getLignesByProjet(projetId) : raf.getAllLignesBudgetaires(),
  virementBudgetaire: (idSource, idCible, montant, motif) =>
    raf.virementBudgetaire(idSource, idCible, montant, motif),

  // ─── Trésorerie ─────────────────────────────────────────
  getComptes: () => raf.getComptes(),
  getEvolutionTresorerie: () => raf.getEvolutionTresorerie(),
  getDecaissements: () => raf.getDecaissements(),
  getAvancesNonJustifiees: () => raf.getAvancesNonJustifiees(),

  // ─── Missions ───────────────────────────────────────────
  getMissions: () => raf.getMissions(),
  validerMission: (id) => raf.validerMission(id),
  rejeterMission: (id, motif) => raf.rejeterMission(id, motif),

  // ─── Acquisitions ───────────────────────────────────────
  getAcquisitions: () => raf.getAcquisitions(),
  validerAcquisition: (id) => raf.validerAcquisition(id),
  rejeterAcquisition: (id, motif) => raf.rejeterAcquisition(id, motif),

  // ─── Rapports ───────────────────────────────────────────
  getRapports: () => raf.getRapports(),
  genererRapport: (params) => raf.genererRapport(params),
};
