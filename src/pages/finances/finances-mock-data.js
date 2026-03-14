// ── Données mockées Module 4 — Gestion Financière (Comptabilité) ──
// Cohérentes avec les projets existants et les employés du module RH

const today = new Date();
const fmt = (d) => d.toISOString().split("T")[0];
const addDays = (d, n) => {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
};
const subDays = (d, n) => addDays(d, -n);

// ── Projets (identiques aux autres modules) ────────────────
export const MOCK_PROJETS = [
  {
    id: "p001",
    code: "PROJ-2024-001",
    titre: "Renforcement des capacités communautaires Kolda",
    statut: "EN_COURS",
    devise: "XOF",
    budgetTotal: 45000000,
    responsableId: "u002",
  },
  {
    id: "p002",
    code: "PROJ-2024-002",
    titre: "Appui aux femmes entrepreneures Sédhiou",
    statut: "EN_COURS",
    devise: "EUR",
    budgetTotal: 80000,
    responsableId: "u002",
  },
  {
    id: "p003",
    code: "PROJ-2025-001",
    titre: "Eau et assainissement Vélingara",
    statut: "EN_COURS",
    devise: "XOF",
    budgetTotal: 32000000,
    responsableId: "u002",
  },
  {
    id: "p004",
    code: "PROJ-2023-003",
    titre: "Formation professionnelle des jeunes",
    statut: "SUSPENDU",
    devise: "XOF",
    budgetTotal: 18000000,
    responsableId: "u002",
  },
  {
    id: "p005",
    code: "PROJ-2023-001",
    titre: "Alphabétisation communautaire",
    statut: "CLOTURE",
    devise: "XOF",
    budgetTotal: 12000000,
    responsableId: "u002",
  },
];

// ── Lignes budgétaires ─────────────────────────────────────
export const MOCK_LIGNES_BUDGETAIRES = [
  // ─ Projet 1 (Kolda — XOF) ─────────────
  {
    id: "lb001",
    projetId: "p001",
    code: "1.1.1",
    intitule: "Salaires personnel projet",
    categorie: "Ressources Humaines",
    prevu: 12000000,
    engage: 9800000,
    depense: 8500000,
    gele: false,
  },
  {
    id: "lb002",
    projetId: "p001",
    code: "1.1.2",
    intitule: "Indemnités et primes",
    categorie: "Ressources Humaines",
    prevu: 3000000,
    engage: 2100000,
    depense: 1800000,
    gele: false,
  },
  {
    id: "lb003",
    projetId: "p001",
    code: "1.2.1",
    intitule: "Matériel de formation",
    categorie: "Activités",
    prevu: 5000000,
    engage: 4200000,
    depense: 3800000,
    gele: false,
  },
  {
    id: "lb004",
    projetId: "p001",
    code: "1.2.2",
    intitule: "Frais de déplacement",
    categorie: "Activités",
    prevu: 4000000,
    engage: 3900000,
    depense: 3700000,
    gele: false,
  },
  {
    id: "lb005",
    projetId: "p001",
    code: "1.3.1",
    intitule: "Fournitures de bureau",
    categorie: "Fonctionnement",
    prevu: 2000000,
    engage: 800000,
    depense: 650000,
    gele: false,
  },
  {
    id: "lb006",
    projetId: "p001",
    code: "1.3.2",
    intitule: "Communication & visibilité",
    categorie: "Fonctionnement",
    prevu: 1500000,
    engage: 1400000,
    depense: 1350000,
    gele: true,
  },
  // ─ Projet 2 (Sédhiou — EUR) ────────────
  {
    id: "lb007",
    projetId: "p002",
    code: "2.1.1",
    intitule: "Accompagnement technique",
    categorie: "Expertise",
    prevu: 30000,
    engage: 22000,
    depense: 18000,
    gele: false,
  },
  {
    id: "lb008",
    projetId: "p002",
    code: "2.1.2",
    intitule: "Fonds de crédit rotatif",
    categorie: "Subventions",
    prevu: 35000,
    engage: 25000,
    depense: 20000,
    gele: false,
  },
  {
    id: "lb009",
    projetId: "p002",
    code: "2.2.1",
    intitule: "Suivi & évaluation",
    categorie: "Pilotage",
    prevu: 15000,
    engage: 6000,
    depense: 4500,
    gele: false,
  },
  // ─ Projet 3 (Vélingara — XOF) ──────────
  {
    id: "lb010",
    projetId: "p003",
    code: "3.1.1",
    intitule: "Travaux hydrauliques",
    categorie: "Infrastructure",
    prevu: 18000000,
    engage: 12000000,
    depense: 10000000,
    gele: false,
  },
  {
    id: "lb011",
    projetId: "p003",
    code: "3.1.2",
    intitule: "Équipement assainissement",
    categorie: "Infrastructure",
    prevu: 8000000,
    engage: 7500000,
    depense: 7200000,
    gele: false,
  },
  {
    id: "lb012",
    projetId: "p003",
    code: "3.2.1",
    intitule: "Sensibilisation communautaire",
    categorie: "Activités",
    prevu: 3000000,
    engage: 1200000,
    depense: 900000,
    gele: false,
  },
  {
    id: "lb013",
    projetId: "p003",
    code: "3.2.2",
    intitule: "Frais de fonctionnement",
    categorie: "Fonctionnement",
    prevu: 3000000,
    engage: 2900000,
    depense: 2850000,
    gele: false,
  },
  // ─ Projet 4 (Suspendu) ─────────────────
  {
    id: "lb014",
    projetId: "p004",
    code: "4.1.1",
    intitule: "Formation technique",
    categorie: "Activités",
    prevu: 10000000,
    engage: 5000000,
    depense: 4500000,
    gele: true,
  },
  {
    id: "lb015",
    projetId: "p004",
    code: "4.1.2",
    intitule: "Matériel pédagogique",
    categorie: "Équipements",
    prevu: 8000000,
    engage: 3000000,
    depense: 2500000,
    gele: true,
  },
];

// ── Compteurs pour numéro de pièce auto ────────────────────
let _pieceCounter = 48;
export function nextNumeroPiece() {
  _pieceCounter += 1;
  return `DEP-2026-${String(_pieceCounter).padStart(4, "0")}`;
}

// ── Dépenses ───────────────────────────────────────────────
export const MOCK_DEPENSES = [
  {
    id: "dep001",
    numeroPiece: "DEP-2026-0041",
    date: fmt(subDays(today, 2)),
    libelle: "Achat fournitures bureau — atelier Kolda",
    montant: 185000,
    devise: "XOF",
    tauxChange: null,
    montantXOF: 185000,
    projetId: "p001",
    ligneBudgetaireId: "lb005",
    modePaiement: "ESPECES",
    beneficiaire: "Papeterie Kolda SARL",
    saisiPar: "u009", // Comptable BALDÉ
    statut: "BROUILLON",
    justificatif: null,
    historique: [
      {
        etape: "BROUILLON",
        par: "BALDÉ Hawa",
        date: fmt(subDays(today, 2)),
        commentaire: null,
      },
    ],
  },
  {
    id: "dep002",
    numeroPiece: "DEP-2026-0042",
    date: fmt(subDays(today, 5)),
    libelle: "Location salle formation — session mars",
    montant: 350000,
    devise: "XOF",
    tauxChange: null,
    montantXOF: 350000,
    projetId: "p001",
    ligneBudgetaireId: "lb003",
    modePaiement: "VIREMENT",
    beneficiaire: "Hôtel Mango Kolda",
    saisiPar: "u009",
    statut: "SOUMISE",
    justificatif: {
      nom: "facture_hotel_mars.pdf",
      type: "application/pdf",
      taille: 245000,
    },
    historique: [
      {
        etape: "BROUILLON",
        par: "BALDÉ Hawa",
        date: fmt(subDays(today, 6)),
        commentaire: null,
      },
      {
        etape: "SOUMISE",
        par: "BALDÉ Hawa",
        date: fmt(subDays(today, 5)),
        commentaire: "Soumission pour validation",
      },
    ],
  },
  {
    id: "dep003",
    numeroPiece: "DEP-2026-0043",
    date: fmt(subDays(today, 10)),
    libelle: "Carburant mission terrain",
    montant: 125000,
    devise: "XOF",
    tauxChange: null,
    montantXOF: 125000,
    projetId: "p001",
    ligneBudgetaireId: "lb004",
    modePaiement: "ESPECES",
    beneficiaire: "Station Total Kolda",
    saisiPar: "u009",
    statut: "VALIDEE",
    justificatif: {
      nom: "bon_carburant_022.pdf",
      type: "application/pdf",
      taille: 180000,
    },
    historique: [
      {
        etape: "BROUILLON",
        par: "BALDÉ Hawa",
        date: fmt(subDays(today, 12)),
        commentaire: null,
      },
      {
        etape: "SOUMISE",
        par: "BALDÉ Hawa",
        date: fmt(subDays(today, 11)),
        commentaire: null,
      },
      {
        etape: "VALIDEE",
        par: "SANE Ousmane (RAF)",
        date: fmt(subDays(today, 10)),
        commentaire: "Conforme — validé",
      },
    ],
  },
  {
    id: "dep004",
    numeroPiece: "DEP-2026-0044",
    date: fmt(subDays(today, 8)),
    libelle: "Paiement consultant évaluation mi-parcours",
    montant: 750000,
    devise: "XOF",
    tauxChange: null,
    montantXOF: 750000,
    projetId: "p001",
    ligneBudgetaireId: "lb001",
    modePaiement: "VIREMENT",
    beneficiaire: "Cabinet Conseils DIOP & Associés",
    saisiPar: "u009",
    statut: "EN_APPROBATION_SE",
    justificatif: {
      nom: "contrat_consultant_eval.pdf",
      type: "application/pdf",
      taille: 520000,
    },
    historique: [
      {
        etape: "BROUILLON",
        par: "BALDÉ Hawa",
        date: fmt(subDays(today, 10)),
        commentaire: null,
      },
      {
        etape: "SOUMISE",
        par: "BALDÉ Hawa",
        date: fmt(subDays(today, 9)),
        commentaire: null,
      },
      {
        etape: "EN_APPROBATION_SE",
        par: "SANE Ousmane (RAF)",
        date: fmt(subDays(today, 8)),
        commentaire: "Montant > seuil → transmis au SE pour approbation",
      },
    ],
  },
  {
    id: "dep005",
    numeroPiece: "DEP-2026-0045",
    date: fmt(subDays(today, 15)),
    libelle: "Impression supports communication projet",
    montant: 420000,
    devise: "XOF",
    tauxChange: null,
    montantXOF: 420000,
    projetId: "p001",
    ligneBudgetaireId: "lb006",
    modePaiement: "CHEQUE",
    beneficiaire: "Imprimerie Casamance Print",
    saisiPar: "u009",
    statut: "REJETEE",
    justificatif: {
      nom: "devis_impression.pdf",
      type: "application/pdf",
      taille: 310000,
    },
    historique: [
      {
        etape: "BROUILLON",
        par: "BALDÉ Hawa",
        date: fmt(subDays(today, 17)),
        commentaire: null,
      },
      {
        etape: "SOUMISE",
        par: "BALDÉ Hawa",
        date: fmt(subDays(today, 16)),
        commentaire: null,
      },
      {
        etape: "REJETEE",
        par: "SANE Ousmane (RAF)",
        date: fmt(subDays(today, 15)),
        commentaire:
          "Ligne budgétaire gelée — veuillez utiliser une autre ligne",
      },
    ],
  },
  {
    id: "dep006",
    numeroPiece: "DEP-2026-0046",
    date: fmt(subDays(today, 3)),
    libelle: "Achat ciment et matériaux — chantier Vélingara",
    montant: 2800000,
    devise: "XOF",
    tauxChange: null,
    montantXOF: 2800000,
    projetId: "p003",
    ligneBudgetaireId: "lb010",
    modePaiement: "VIREMENT",
    beneficiaire: "Quincaillerie Générale du Sud",
    saisiPar: "u009",
    statut: "SOUMISE",
    justificatif: {
      nom: "facture_materiaux_vel.pdf",
      type: "application/pdf",
      taille: 412000,
    },
    historique: [
      {
        etape: "BROUILLON",
        par: "BALDÉ Hawa",
        date: fmt(subDays(today, 4)),
        commentaire: null,
      },
      {
        etape: "SOUMISE",
        par: "BALDÉ Hawa",
        date: fmt(subDays(today, 3)),
        commentaire: null,
      },
    ],
  },
  {
    id: "dep007",
    numeroPiece: "DEP-2026-0047",
    date: fmt(subDays(today, 1)),
    libelle: "Honoraires formatrice entrepreneuriat",
    montant: 2500,
    devise: "EUR",
    tauxChange: 655.957,
    montantXOF: 1639893,
    projetId: "p002",
    ligneBudgetaireId: "lb007",
    modePaiement: "VIREMENT",
    beneficiaire: "Mme Dupont Marie — Consultante",
    saisiPar: "u009",
    statut: "SOUMISE",
    justificatif: {
      nom: "contrat_formatrice.pdf",
      type: "application/pdf",
      taille: 289000,
    },
    historique: [
      {
        etape: "BROUILLON",
        par: "BALDÉ Hawa",
        date: fmt(subDays(today, 2)),
        commentaire: null,
      },
      {
        etape: "SOUMISE",
        par: "BALDÉ Hawa",
        date: fmt(subDays(today, 1)),
        commentaire: null,
      },
    ],
  },
  {
    id: "dep008",
    numeroPiece: "DEP-2026-0048",
    date: fmt(subDays(today, 20)),
    libelle: "Forfait téléphonique équipe projet",
    montant: 95000,
    devise: "XOF",
    tauxChange: null,
    montantXOF: 95000,
    projetId: "p003",
    ligneBudgetaireId: "lb013",
    modePaiement: "MOBILE_MONEY",
    beneficiaire: "Orange Money Sénégal",
    saisiPar: "u009",
    statut: "VALIDEE",
    justificatif: {
      nom: "recu_orange_money.jpg",
      type: "image/jpeg",
      taille: 150000,
    },
    historique: [
      {
        etape: "BROUILLON",
        par: "BALDÉ Hawa",
        date: fmt(subDays(today, 22)),
        commentaire: null,
      },
      {
        etape: "SOUMISE",
        par: "BALDÉ Hawa",
        date: fmt(subDays(today, 21)),
        commentaire: null,
      },
      {
        etape: "VALIDEE",
        par: "SANE Ousmane (RAF)",
        date: fmt(subDays(today, 20)),
        commentaire: "OK — validé",
      },
    ],
  },
  {
    id: "dep009",
    numeroPiece: "DEP-2026-0039",
    date: fmt(subDays(today, 30)),
    libelle: "Indemnités per diem — mission Sédhiou",
    montant: 480000,
    devise: "XOF",
    tauxChange: null,
    montantXOF: 480000,
    projetId: "p001",
    ligneBudgetaireId: "lb002",
    modePaiement: "ESPECES",
    beneficiaire: "Équipe terrain Kolda (5 agents)",
    saisiPar: "u009",
    statut: "ANNULEE",
    justificatif: {
      nom: "etat_per_diem.pdf",
      type: "application/pdf",
      taille: 340000,
    },
    historique: [
      {
        etape: "BROUILLON",
        par: "BALDÉ Hawa",
        date: fmt(subDays(today, 32)),
        commentaire: null,
      },
      {
        etape: "SOUMISE",
        par: "BALDÉ Hawa",
        date: fmt(subDays(today, 31)),
        commentaire: null,
      },
      {
        etape: "VALIDEE",
        par: "SANE Ousmane (RAF)",
        date: fmt(subDays(today, 30)),
        commentaire: "Validé",
      },
      {
        etape: "ANNULEE",
        par: "SANE Ousmane (RAF)",
        date: fmt(subDays(today, 28)),
        commentaire: "Annulée — doublon avec DEP-2026-0035",
      },
    ],
  },
  {
    id: "dep010",
    numeroPiece: "DEP-2026-0040",
    date: fmt(subDays(today, 12)),
    libelle: "Achat tuyaux PVC — lot 2",
    montant: 1450000,
    devise: "XOF",
    tauxChange: null,
    montantXOF: 1450000,
    projetId: "p003",
    ligneBudgetaireId: "lb011",
    modePaiement: "CHEQUE",
    beneficiaire: "Établissements Sow Matériaux",
    saisiPar: "u009",
    statut: "VALIDEE",
    justificatif: null,
    historique: [
      {
        etape: "BROUILLON",
        par: "BALDÉ Hawa",
        date: fmt(subDays(today, 14)),
        commentaire: null,
      },
      {
        etape: "SOUMISE",
        par: "BALDÉ Hawa",
        date: fmt(subDays(today, 13)),
        commentaire: null,
      },
      {
        etape: "VALIDEE",
        par: "SANE Ousmane (RAF)",
        date: fmt(subDays(today, 12)),
        commentaire: "Validé",
      },
    ],
  },
];

// ── Constantes ─────────────────────────────────────────────
export const SEUIL_APPROBATION_SE = 500000; // XOF
export const SEUIL_PIECE_JUSTIFICATIVE = 100000; // XOF

export const DEVISES = ["XOF", "EUR", "USD"];

export const MODES_PAIEMENT = [
  { value: "ESPECES", label: "Espèces" },
  { value: "VIREMENT", label: "Virement bancaire" },
  { value: "CHEQUE", label: "Chèque" },
  { value: "MOBILE_MONEY", label: "Mobile Money" },
];

export const STATUTS_DEPENSE = [
  { value: "BROUILLON", label: "Brouillon" },
  { value: "SOUMISE", label: "Soumise" },
  { value: "VERIFIEE", label: "Vérifiée" },
  { value: "EN_APPROBATION_SE", label: "En approbation SE" },
  { value: "VALIDEE", label: "Validée" },
  { value: "REJETEE", label: "Rejetée" },
  { value: "ANNULEE", label: "Annulée" },
];

export const STATUT_COLORS = {
  BROUILLON: "bg-gray-100 text-gray-600",
  SOUMISE: "bg-blue-100 text-blue-700",
  VERIFIEE: "bg-indigo-100 text-indigo-700",
  EN_APPROBATION_SE: "bg-orange-100 text-orange-700",
  VALIDEE: "bg-green-100 text-green-700",
  REJETEE: "bg-red-100 text-red-600",
  ANNULEE: "bg-gray-200 text-gray-400",
};

export const MODE_PAIEMENT_LABELS = {
  ESPECES: "Espèces",
  VIREMENT: "Virement",
  CHEQUE: "Chèque",
  MOBILE_MONEY: "Mobile Money",
};

// ── Helpers ────────────────────────────────────────────────
export function getProjet(id) {
  return MOCK_PROJETS.find((p) => p.id === id);
}
export function getLigne(id) {
  return MOCK_LIGNES_BUDGETAIRES.find((l) => l.id === id);
}
export function getLignesForProjet(projetId) {
  return MOCK_LIGNES_BUDGETAIRES.filter((l) => l.projetId === projetId);
}
export function getDepensesForProjet(projetId) {
  return MOCK_DEPENSES.filter((d) => d.projetId === projetId);
}
export function getDepensesForLigne(ligneId) {
  return MOCK_DEPENSES.filter(
    (d) => d.ligneBudgetaireId === ligneId && d.statut !== "ANNULEE",
  );
}
export function getSoldeDisponible(ligneId) {
  const l = getLigne(ligneId);
  if (!l) return 0;
  return l.prevu - l.depense;
}
export function getBudgetStatsForProjet(projetId) {
  const lignes = getLignesForProjet(projetId);
  const prevu = lignes.reduce((s, l) => s + l.prevu, 0);
  const engage = lignes.reduce((s, l) => s + l.engage, 0);
  const depense = lignes.reduce((s, l) => s + l.depense, 0);
  const solde = prevu - depense;
  const taux = prevu > 0 ? Math.round((depense / prevu) * 100) : 0;
  return { prevu, engage, depense, solde, taux };
}

// Projets affectés au comptable (mock : tous les projets EN_COURS)
export function getProjetsComptable() {
  return MOCK_PROJETS.filter((p) => p.statut === "EN_COURS");
}
