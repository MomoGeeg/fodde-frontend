// ── Données mockées Module 3 — Suivi-Évaluation (S&E) ─────
// Cohérentes avec les projets et membres des autres modules

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
    dateDebut: "2024-01-15",
    dateFin: "2026-01-15",
    responsableId: "u002",
  },
  {
    id: "p002",
    code: "PROJ-2024-002",
    titre: "Appui aux femmes entrepreneures Sédhiou",
    statut: "EN_COURS",
    dateDebut: "2024-03-01",
    dateFin: "2025-12-31",
    responsableId: "u002",
  },
  {
    id: "p003",
    code: "PROJ-2025-001",
    titre: "Eau et assainissement Vélingara",
    statut: "EN_COURS",
    dateDebut: "2025-01-01",
    dateFin: "2027-06-30",
    responsableId: "u002",
  },
  {
    id: "p004",
    code: "PROJ-2023-003",
    titre: "Formation professionnelle des jeunes",
    statut: "SUSPENDU",
    dateDebut: "2023-06-01",
    dateFin: "2025-06-01",
    responsableId: "u002",
  },
  {
    id: "p005",
    code: "PROJ-2023-001",
    titre: "Alphabétisation communautaire",
    statut: "CLOTURE",
    dateDebut: "2023-01-01",
    dateFin: "2024-12-31",
    responsableId: "u002",
  },
];

// ── Membres / Utilisateurs ─────────────────────────────────
export const MOCK_MEMBRES = [
  {
    id: "u001",
    nom: "DIALLO",
    prenom: "Mamadou",
    role: "ROLE_RESPONSABLE_SE",
    email: "m.diallo@fodde.org",
  },
  {
    id: "u002",
    nom: "BA",
    prenom: "Aissatou",
    role: "ROLE_RESPONSABLE_PROGRAMMES",
    email: "a.ba@fodde.org",
  },
  {
    id: "u003",
    nom: "SOW",
    prenom: "Ibrahima",
    role: "ROLE_CHARGE_PROGRAMME",
    email: "i.sow@fodde.org",
    projetsAffectes: ["p001", "p002", "p003"],
  },
  {
    id: "u004",
    nom: "NDIAYE",
    prenom: "Fatou",
    role: "ROLE_TECHNICIEN_TERRAIN",
    email: "f.ndiaye@fodde.org",
  },
  {
    id: "u005",
    nom: "CAMARA",
    prenom: "Ousmane",
    role: "ROLE_TECHNICIEN_TERRAIN",
    email: "o.camara@fodde.org",
  },
  {
    id: "u006",
    nom: "DIOP",
    prenom: "Mariam",
    role: "ROLE_CHARGE_PROGRAMME",
    email: "m.diop@fodde.org",
    projetsAffectes: ["p003", "p004"],
  },
];

// ── Constantes ─────────────────────────────────────────────
export const UNITES_MESURE = [
  { value: "POURCENTAGE", label: "%" },
  { value: "NOMBRE", label: "Nombre" },
  { value: "RATIO", label: "Ratio" },
  { value: "SCORE", label: "Score" },
  { value: "BINAIRE", label: "Oui / Non" },
];

export const FREQUENCES_COLLECTE = [
  { value: "HEBDOMADAIRE", label: "Hebdomadaire" },
  { value: "MENSUELLE", label: "Mensuelle" },
  { value: "TRIMESTRIELLE", label: "Trimestrielle" },
  { value: "ANNUELLE", label: "Annuelle" },
];

export const STATUTS_INDICATEUR = [
  { value: "ACTIF", label: "Actif" },
  { value: "INACTIF", label: "Inactif" },
  { value: "ARCHIVE", label: "Archivé" },
];

export const STATUTS_FORMULAIRE = [
  { value: "BROUILLON", label: "Brouillon" },
  { value: "PUBLIE", label: "Publié" },
  { value: "CLOTURE", label: "Clôturé" },
];

export const STATUTS_COLLECTE = [
  { value: "EN_ATTENTE", label: "En attente" },
  { value: "PRE_VALIDEE", label: "Pré-validée" },
  { value: "VALIDEE", label: "Validée" },
  { value: "REJETEE", label: "Rejetée" },
];

export const TYPES_CHAMP = [
  { value: "TEXTE_COURT", label: "Texte court", icon: "Type" },
  { value: "TEXTE_LONG", label: "Texte long", icon: "AlignLeft" },
  { value: "NOMBRE_ENTIER", label: "Nombre entier", icon: "Hash" },
  { value: "NOMBRE_DECIMAL", label: "Nombre décimal", icon: "Percent" },
  { value: "DATE", label: "Date", icon: "Calendar" },
  { value: "LISTE_DEROULANTE", label: "Liste déroulante", icon: "List" },
  { value: "CASE_A_COCHER", label: "Case à cocher", icon: "CheckSquare" },
  { value: "FICHIER", label: "Photo / Fichier", icon: "Upload" },
  { value: "GEOLOCALISATION", label: "Géolocalisation", icon: "MapPin" },
];

export const STATUT_COLORS = {
  EN_ATTENTE: "bg-yellow-100 text-yellow-700",
  PRE_VALIDEE: "bg-blue-100 text-blue-700",
  VALIDEE: "bg-green-100 text-green-700",
  REJETEE: "bg-red-100 text-red-700",
  ACTIF: "bg-green-100 text-green-700",
  INACTIF: "bg-gray-100 text-gray-500",
  ARCHIVE: "bg-gray-100 text-gray-500",
  BROUILLON: "bg-gray-100 text-gray-500",
  PUBLIE: "bg-green-100 text-green-700",
  CLOTURE: "bg-red-100 text-red-600",
  EN_COURS: "bg-green-100 text-green-700",
  SUSPENDU: "bg-yellow-100 text-yellow-700",
};

// ── Indicateurs ────────────────────────────────────────────
export const MOCK_INDICATEURS = [
  {
    id: "ind001",
    code: "IND-001",
    libelle: "Nombre de bénéficiaires formés",
    unite: "NOMBRE",
    valeurReference: 0,
    valeurCible: 500,
    frequence: "TRIMESTRIELLE",
    sourceVerification: "Registres de formation, listes de présence",
    projetId: "p001",
    responsableCollecteId: "u004",
    resultatAttendu: "R1 — Meilleure gouvernance communautaire",
    statut: "ACTIF",
    creePar: "u001",
    dateCreation: "2024-02-01",
  },
  {
    id: "ind002",
    code: "IND-002",
    libelle: "Taux de satisfaction des participants",
    unite: "POURCENTAGE",
    valeurReference: 0,
    valeurCible: 80,
    frequence: "TRIMESTRIELLE",
    sourceVerification: "Enquêtes de satisfaction",
    projetId: "p001",
    responsableCollecteId: "u004",
    resultatAttendu: "R1 — Meilleure gouvernance communautaire",
    statut: "ACTIF",
    creePar: "u001",
    dateCreation: "2024-02-01",
  },
  {
    id: "ind003",
    code: "IND-003",
    libelle: "Nombre de femmes entrepreneures accompagnées",
    unite: "NOMBRE",
    valeurReference: 0,
    valeurCible: 150,
    frequence: "MENSUELLE",
    sourceVerification: "Registres d'accompagnement, photos",
    projetId: "p002",
    responsableCollecteId: "u005",
    resultatAttendu: "R1 — Autonomisation économique des femmes",
    statut: "ACTIF",
    creePar: "u001",
    dateCreation: "2024-04-01",
  },
  {
    id: "ind004",
    code: "IND-004",
    libelle: "Chiffre d'affaires moyen des micro-entreprises",
    unite: "NOMBRE",
    valeurReference: 50000,
    valeurCible: 200000,
    frequence: "TRIMESTRIELLE",
    sourceVerification: "Registres comptables des bénéficiaires",
    projetId: "p002",
    responsableCollecteId: "u005",
    resultatAttendu: "R2 — Augmentation des revenus",
    statut: "ACTIF",
    creePar: "u001",
    dateCreation: "2024-04-01",
  },
  {
    id: "ind005",
    code: "IND-005",
    libelle: "Nombre de points d'eau construits",
    unite: "NOMBRE",
    valeurReference: 0,
    valeurCible: 25,
    frequence: "TRIMESTRIELLE",
    sourceVerification: "Rapports terrain, photos GPS",
    projetId: "p003",
    responsableCollecteId: "u004",
    resultatAttendu: "R1 — Accès à l'eau potable amélioré",
    statut: "ACTIF",
    creePar: "u001",
    dateCreation: "2025-02-01",
  },
  {
    id: "ind006",
    code: "IND-006",
    libelle: "Taux d'accès à l'eau potable dans la zone",
    unite: "POURCENTAGE",
    valeurReference: 35,
    valeurCible: 75,
    frequence: "ANNUELLE",
    sourceVerification: "Enquête ménage, données municipalité",
    projetId: "p003",
    responsableCollecteId: "u005",
    resultatAttendu: "R2 — Réduction des maladies hydriques",
    statut: "ACTIF",
    creePar: "u001",
    dateCreation: "2025-02-01",
  },
  {
    id: "ind007",
    code: "IND-007",
    libelle: "Nombre de jeunes certifiés",
    unite: "NOMBRE",
    valeurReference: 0,
    valeurCible: 200,
    frequence: "TRIMESTRIELLE",
    sourceVerification: "Certificats, rapports examens",
    projetId: "p004",
    responsableCollecteId: "u004",
    resultatAttendu: "R1 — Insertion professionnelle accrue",
    statut: "ACTIF",
    creePar: "u001",
    dateCreation: "2023-07-01",
  },
  {
    id: "ind008",
    code: "IND-008",
    libelle: "Taux d'alphabétisation de la communauté cible",
    unite: "POURCENTAGE",
    valeurReference: 25,
    valeurCible: 60,
    frequence: "ANNUELLE",
    sourceVerification: "Tests d'évaluation, rapports ONG",
    projetId: "p005",
    responsableCollecteId: "u005",
    resultatAttendu: "R1 — Population alphabétisée",
    statut: "ACTIF",
    creePar: "u001",
    dateCreation: "2023-02-01",
  },
  {
    id: "ind009",
    code: "IND-009",
    libelle: "Nombre de latrines construites",
    unite: "NOMBRE",
    valeurReference: 0,
    valeurCible: 40,
    frequence: "MENSUELLE",
    sourceVerification: "Rapports chantier, photos terrain",
    projetId: "p003",
    responsableCollecteId: "u004",
    resultatAttendu: "R3 — Assainissement amélioré",
    statut: "ACTIF",
    creePar: "u001",
    dateCreation: "2025-02-15",
  },
  {
    id: "ind010",
    code: "IND-010",
    libelle: "Taux de rétention des apprentis",
    unite: "POURCENTAGE",
    valeurReference: 0,
    valeurCible: 85,
    frequence: "TRIMESTRIELLE",
    sourceVerification: "Registres de présence ateliers",
    projetId: "p004",
    responsableCollecteId: "u005",
    resultatAttendu: "R2 — Qualité de la formation",
    statut: "INACTIF",
    creePar: "u001",
    dateCreation: "2023-08-01",
  },
];

// ── Collectes de données (historique) ──────────────────────
export const MOCK_COLLECTES = [
  // IND-001 : Bénéficiaires formés (cible 500)
  {
    id: "col001",
    indicateurId: "ind001",
    valeur: 85,
    dateCollecte: "2024-04-01",
    dateSoumission: "2024-04-02",
    collecteurId: "u004",
    statut: "VALIDEE",
    validePar: "u001",
    dateValidation: "2024-04-05",
    horsDelai: false,
    horsLigne: false,
    commentaire: "",
  },
  {
    id: "col002",
    indicateurId: "ind001",
    valeur: 180,
    dateCollecte: "2024-07-01",
    dateSoumission: "2024-07-03",
    collecteurId: "u004",
    statut: "VALIDEE",
    validePar: "u001",
    dateValidation: "2024-07-08",
    horsDelai: false,
    horsLigne: false,
    commentaire: "",
  },
  {
    id: "col003",
    indicateurId: "ind001",
    valeur: 290,
    dateCollecte: "2024-10-01",
    dateSoumission: "2024-10-05",
    collecteurId: "u004",
    statut: "VALIDEE",
    validePar: "u001",
    dateValidation: "2024-10-10",
    horsDelai: true,
    horsLigne: false,
    commentaire: "Soumis avec retard de 5 jours",
  },
  {
    id: "col004",
    indicateurId: "ind001",
    valeur: 370,
    dateCollecte: "2025-01-01",
    dateSoumission: "2025-01-03",
    collecteurId: "u004",
    statut: "PRE_VALIDEE",
    preValidePar: "u003",
    datePreValidation: "2025-01-05",
    horsDelai: false,
    horsLigne: false,
    commentaire: "En bonne voie",
  },
  {
    id: "col005",
    indicateurId: "ind001",
    valeur: 420,
    dateCollecte: "2025-04-01",
    dateSoumission: fmt(subDays(today, 5)),
    collecteurId: "u004",
    statut: "EN_ATTENTE",
    horsDelai: false,
    horsLigne: true,
    commentaire: "Collecte hors-ligne synchronisée",
  },

  // IND-002 : Satisfaction participants (cible 80%)
  {
    id: "col006",
    indicateurId: "ind002",
    valeur: 72,
    dateCollecte: "2024-07-01",
    dateSoumission: "2024-07-02",
    collecteurId: "u004",
    statut: "VALIDEE",
    validePar: "u001",
    dateValidation: "2024-07-05",
    horsDelai: false,
    horsLigne: false,
    commentaire: "",
  },
  {
    id: "col007",
    indicateurId: "ind002",
    valeur: 78,
    dateCollecte: "2024-10-01",
    dateSoumission: "2024-10-02",
    collecteurId: "u004",
    statut: "VALIDEE",
    validePar: "u001",
    dateValidation: "2024-10-06",
    horsDelai: false,
    horsLigne: false,
    commentaire: "",
  },
  {
    id: "col008",
    indicateurId: "ind002",
    valeur: 82,
    dateCollecte: "2025-01-01",
    dateSoumission: "2025-01-04",
    collecteurId: "u004",
    statut: "EN_ATTENTE",
    horsDelai: true,
    horsLigne: false,
    commentaire: "Enquête terminée en retard",
  },

  // IND-003 : Femmes entrepreneures (cible 150)
  {
    id: "col009",
    indicateurId: "ind003",
    valeur: 22,
    dateCollecte: "2024-05-01",
    dateSoumission: "2024-05-02",
    collecteurId: "u005",
    statut: "VALIDEE",
    validePar: "u001",
    dateValidation: "2024-05-05",
    horsDelai: false,
    horsLigne: false,
    commentaire: "",
  },
  {
    id: "col010",
    indicateurId: "ind003",
    valeur: 45,
    dateCollecte: "2024-08-01",
    dateSoumission: "2024-08-02",
    collecteurId: "u005",
    statut: "VALIDEE",
    validePar: "u001",
    dateValidation: "2024-08-06",
    horsDelai: false,
    horsLigne: false,
    commentaire: "",
  },
  {
    id: "col011",
    indicateurId: "ind003",
    valeur: 68,
    dateCollecte: "2024-11-01",
    dateSoumission: "2024-11-03",
    collecteurId: "u005",
    statut: "VALIDEE",
    validePar: "u001",
    dateValidation: "2024-11-07",
    horsDelai: false,
    horsLigne: false,
    commentaire: "",
  },
  {
    id: "col012",
    indicateurId: "ind003",
    valeur: 85,
    dateCollecte: "2025-02-01",
    dateSoumission: fmt(subDays(today, 3)),
    collecteurId: "u005",
    statut: "EN_ATTENTE",
    horsDelai: false,
    horsLigne: false,
    commentaire: "",
  },

  // IND-004 : Chiffre d'affaires (cible 200000)
  {
    id: "col013",
    indicateurId: "ind004",
    valeur: 72000,
    dateCollecte: "2024-07-01",
    dateSoumission: "2024-07-03",
    collecteurId: "u005",
    statut: "VALIDEE",
    validePar: "u001",
    dateValidation: "2024-07-08",
    horsDelai: false,
    horsLigne: false,
    commentaire: "",
  },
  {
    id: "col014",
    indicateurId: "ind004",
    valeur: 95000,
    dateCollecte: "2024-10-01",
    dateSoumission: "2024-10-04",
    collecteurId: "u005",
    statut: "VALIDEE",
    validePar: "u001",
    dateValidation: "2024-10-09",
    horsDelai: false,
    horsLigne: false,
    commentaire: "",
  },
  {
    id: "col015",
    indicateurId: "ind004",
    valeur: 110000,
    dateCollecte: "2025-01-01",
    dateSoumission: "2025-01-05",
    collecteurId: "u005",
    statut: "REJETEE",
    rejetePar: "u003",
    motifRejet:
      "Données incomplètes, registres manquants pour 3 micro-entreprises",
    horsDelai: true,
    horsLigne: false,
    commentaire: "",
  },

  // IND-005 : Points d'eau (cible 25)
  {
    id: "col016",
    indicateurId: "ind005",
    valeur: 4,
    dateCollecte: "2025-04-01",
    dateSoumission: fmt(subDays(today, 2)),
    collecteurId: "u004",
    statut: "PRE_VALIDEE",
    preValidePar: "u003",
    datePreValidation: fmt(subDays(today, 1)),
    horsDelai: false,
    horsLigne: false,
    commentaire: "4 forages réalisés dans le secteur nord",
  },

  // IND-006 : Taux accès eau (cible 75%)
  {
    id: "col017",
    indicateurId: "ind006",
    valeur: 38,
    dateCollecte: "2025-06-01",
    dateSoumission: fmt(subDays(today, 8)),
    collecteurId: "u005",
    statut: "EN_ATTENTE",
    horsDelai: false,
    horsLigne: true,
    commentaire: "Données collectées hors connexion sur le terrain",
  },

  // IND-007 : Jeunes certifiés (cible 200)
  {
    id: "col018",
    indicateurId: "ind007",
    valeur: 45,
    dateCollecte: "2023-10-01",
    dateSoumission: "2023-10-02",
    collecteurId: "u004",
    statut: "VALIDEE",
    validePar: "u001",
    dateValidation: "2023-10-05",
    horsDelai: false,
    horsLigne: false,
    commentaire: "",
  },
  {
    id: "col019",
    indicateurId: "ind007",
    valeur: 82,
    dateCollecte: "2024-01-01",
    dateSoumission: "2024-01-03",
    collecteurId: "u004",
    statut: "VALIDEE",
    validePar: "u001",
    dateValidation: "2024-01-06",
    horsDelai: false,
    horsLigne: false,
    commentaire: "",
  },

  // IND-008 : Alphabétisation (cible 60%)
  {
    id: "col020",
    indicateurId: "ind008",
    valeur: 32,
    dateCollecte: "2023-12-01",
    dateSoumission: "2023-12-03",
    collecteurId: "u005",
    statut: "VALIDEE",
    validePar: "u001",
    dateValidation: "2023-12-08",
    horsDelai: false,
    horsLigne: false,
    commentaire: "",
  },
  {
    id: "col021",
    indicateurId: "ind008",
    valeur: 41,
    dateCollecte: "2024-12-01",
    dateSoumission: "2024-12-05",
    collecteurId: "u005",
    statut: "VALIDEE",
    validePar: "u001",
    dateValidation: "2024-12-10",
    horsDelai: false,
    horsLigne: false,
    commentaire: "",
  },

  // IND-009 : Latrines (cible 40)
  {
    id: "col022",
    indicateurId: "ind009",
    valeur: 5,
    dateCollecte: "2025-03-01",
    dateSoumission: "2025-03-02",
    collecteurId: "u004",
    statut: "PRE_VALIDEE",
    preValidePar: "u006",
    datePreValidation: "2025-03-04",
    horsDelai: false,
    horsLigne: false,
    commentaire: "5 latrines dans le village de Kéréwane",
  },
  {
    id: "col023",
    indicateurId: "ind009",
    valeur: 12,
    dateCollecte: fmt(subDays(today, 10)),
    dateSoumission: fmt(subDays(today, 9)),
    collecteurId: "u004",
    statut: "EN_ATTENTE",
    horsDelai: false,
    horsLigne: false,
    commentaire: "",
  },
];

// ── Formulaires de collecte ────────────────────────────────
export const MOCK_FORMULAIRES = [
  {
    id: "form001",
    titre: "Suivi des formations communautaires",
    description:
      "Formulaire de collecte pour le suivi des sessions de formation aux leaders communautaires.",
    projetId: "p001",
    statut: "PUBLIE",
    dateCreation: "2024-02-15",
    datePublication: "2024-02-20",
    creePar: "u001",
    collecteursAssignes: ["u004", "u005"],
    delegationValidation: false,
    champs: [
      {
        id: "ch001",
        type: "DATE",
        libelle: "Date de la formation",
        obligatoire: true,
        ordre: 1,
      },
      {
        id: "ch002",
        type: "TEXTE_COURT",
        libelle: "Lieu de la formation",
        obligatoire: true,
        ordre: 2,
      },
      {
        id: "ch003",
        type: "NOMBRE_ENTIER",
        libelle: "Nombre de participants",
        obligatoire: true,
        ordre: 3,
      },
      {
        id: "ch004",
        type: "NOMBRE_ENTIER",
        libelle: "Nombre de femmes parmi les participants",
        obligatoire: true,
        ordre: 4,
      },
      {
        id: "ch005",
        type: "LISTE_DEROULANTE",
        libelle: "Thème de la formation",
        obligatoire: true,
        ordre: 5,
        options: [
          "Gouvernance locale",
          "Gestion de projets",
          "Leadership féminin",
          "Droits fonciers",
          "Autre",
        ],
      },
      {
        id: "ch006",
        type: "TEXTE_LONG",
        libelle: "Observations",
        obligatoire: false,
        ordre: 6,
      },
      {
        id: "ch007",
        type: "FICHIER",
        libelle: "Photo de la session",
        obligatoire: false,
        ordre: 7,
      },
    ],
  },
  {
    id: "form002",
    titre: "Enquête de satisfaction bénéficiaires",
    description:
      "Questionnaire de satisfaction post-formation pour mesurer l'impact perçu.",
    projetId: "p001",
    statut: "PUBLIE",
    dateCreation: "2024-03-01",
    datePublication: "2024-03-05",
    creePar: "u001",
    collecteursAssignes: ["u004"],
    delegationValidation: true,
    champs: [
      {
        id: "ch008",
        type: "TEXTE_COURT",
        libelle: "Nom du bénéficiaire",
        obligatoire: true,
        ordre: 1,
      },
      {
        id: "ch009",
        type: "LISTE_DEROULANTE",
        libelle: "Niveau de satisfaction global",
        obligatoire: true,
        ordre: 2,
        options: [
          "Très satisfait",
          "Satisfait",
          "Neutre",
          "Insatisfait",
          "Très insatisfait",
        ],
      },
      {
        id: "ch010",
        type: "NOMBRE_ENTIER",
        libelle: "Score sur 10",
        obligatoire: true,
        ordre: 3,
      },
      {
        id: "ch011",
        type: "CASE_A_COCHER",
        libelle: "Recommanderait la formation à un collègue",
        obligatoire: false,
        ordre: 4,
      },
      {
        id: "ch012",
        type: "TEXTE_LONG",
        libelle: "Commentaires et suggestions",
        obligatoire: false,
        ordre: 5,
      },
    ],
  },
  {
    id: "form003",
    titre: "Suivi des micro-entreprises féminines",
    description:
      "Collecte mensuelle des données financières et d'accompagnement.",
    projetId: "p002",
    statut: "PUBLIE",
    dateCreation: "2024-04-10",
    datePublication: "2024-04-15",
    creePar: "u001",
    collecteursAssignes: ["u005"],
    delegationValidation: false,
    champs: [
      {
        id: "ch013",
        type: "TEXTE_COURT",
        libelle: "Nom de l'entrepreneuse",
        obligatoire: true,
        ordre: 1,
      },
      {
        id: "ch014",
        type: "TEXTE_COURT",
        libelle: "Activité économique",
        obligatoire: true,
        ordre: 2,
      },
      {
        id: "ch015",
        type: "NOMBRE_DECIMAL",
        libelle: "Chiffre d'affaires du mois (XOF)",
        obligatoire: true,
        ordre: 3,
      },
      {
        id: "ch016",
        type: "NOMBRE_ENTIER",
        libelle: "Nombre d'employés",
        obligatoire: true,
        ordre: 4,
      },
      {
        id: "ch017",
        type: "CASE_A_COCHER",
        libelle: "A bénéficié d'un accompagnement ce mois",
        obligatoire: false,
        ordre: 5,
      },
      {
        id: "ch018",
        type: "GEOLOCALISATION",
        libelle: "Localisation de l'entreprise",
        obligatoire: false,
        ordre: 6,
      },
    ],
  },
  {
    id: "form004",
    titre: "Suivi des infrastructures eau et assainissement",
    description:
      "Formulaire de suivi terrain pour les points d'eau et latrines.",
    projetId: "p003",
    statut: "PUBLIE",
    dateCreation: "2025-01-20",
    datePublication: "2025-02-01",
    creePar: "u001",
    collecteursAssignes: ["u004", "u005"],
    delegationValidation: false,
    champs: [
      {
        id: "ch019",
        type: "LISTE_DEROULANTE",
        libelle: "Type d'infrastructure",
        obligatoire: true,
        ordre: 1,
        options: ["Forage", "Puits amélioré", "Latrine", "Borne fontaine"],
      },
      {
        id: "ch020",
        type: "TEXTE_COURT",
        libelle: "Village / localité",
        obligatoire: true,
        ordre: 2,
      },
      {
        id: "ch021",
        type: "DATE",
        libelle: "Date de mise en service",
        obligatoire: true,
        ordre: 3,
      },
      {
        id: "ch022",
        type: "NOMBRE_ENTIER",
        libelle: "Nombre de bénéficiaires estimés",
        obligatoire: true,
        ordre: 4,
      },
      {
        id: "ch023",
        type: "FICHIER",
        libelle: "Photo de l'infrastructure",
        obligatoire: true,
        ordre: 5,
      },
      {
        id: "ch024",
        type: "GEOLOCALISATION",
        libelle: "Coordonnées GPS",
        obligatoire: true,
        ordre: 6,
      },
      {
        id: "ch025",
        type: "TEXTE_LONG",
        libelle: "Observations techniques",
        obligatoire: false,
        ordre: 7,
      },
    ],
  },
  {
    id: "form005",
    titre: "Évaluation des apprentis",
    description:
      "Formulaire d'évaluation trimestrielle des apprentis en formation.",
    projetId: "p004",
    statut: "BROUILLON",
    dateCreation: fmt(subDays(today, 15)),
    datePublication: null,
    creePar: "u001",
    collecteursAssignes: [],
    delegationValidation: false,
    champs: [
      {
        id: "ch026",
        type: "TEXTE_COURT",
        libelle: "Nom de l'apprenti",
        obligatoire: true,
        ordre: 1,
      },
      {
        id: "ch027",
        type: "LISTE_DEROULANTE",
        libelle: "Métier",
        obligatoire: true,
        ordre: 2,
        options: [
          "Menuiserie",
          "Couture",
          "Mécanique",
          "Maçonnerie",
          "Électricité",
        ],
      },
      {
        id: "ch028",
        type: "NOMBRE_ENTIER",
        libelle: "Score d'évaluation (/100)",
        obligatoire: true,
        ordre: 3,
      },
      {
        id: "ch029",
        type: "CASE_A_COCHER",
        libelle: "Apte à passer au niveau suivant",
        obligatoire: false,
        ordre: 4,
      },
    ],
  },
  {
    id: "form006",
    titre: "Suivi alphabétisation",
    description: "Formulaire annuel d'évaluation du niveau d'alphabétisation.",
    projetId: "p005",
    statut: "CLOTURE",
    dateCreation: "2023-03-01",
    datePublication: "2023-03-10",
    creePar: "u001",
    collecteursAssignes: ["u005"],
    delegationValidation: false,
    champs: [
      {
        id: "ch030",
        type: "TEXTE_COURT",
        libelle: "Village",
        obligatoire: true,
        ordre: 1,
      },
      {
        id: "ch031",
        type: "NOMBRE_ENTIER",
        libelle: "Nombre de personnes testées",
        obligatoire: true,
        ordre: 2,
      },
      {
        id: "ch032",
        type: "NOMBRE_ENTIER",
        libelle: "Nombre ayant atteint le niveau de base",
        obligatoire: true,
        ordre: 3,
      },
    ],
  },
];

// ── Réponses aux formulaires ───────────────────────────────
export const MOCK_REPONSES = [
  {
    id: "rep001",
    formulaireId: "form001",
    collecteurId: "u004",
    dateSoumission: "2024-03-15",
    statut: "VALIDEE",
    validePar: "u001",
    dateValidation: "2024-03-18",
    horsDelai: false,
    horsLigne: false,
    donnees: {
      ch001: "2024-03-10",
      ch002: "Kolda Centre",
      ch003: 35,
      ch004: 18,
      ch005: "Gouvernance locale",
      ch006: "Bonne participation, salle comble",
    },
  },
  {
    id: "rep002",
    formulaireId: "form001",
    collecteurId: "u004",
    dateSoumission: "2024-06-20",
    statut: "VALIDEE",
    validePar: "u001",
    dateValidation: "2024-06-23",
    horsDelai: false,
    horsLigne: false,
    donnees: {
      ch001: "2024-06-15",
      ch002: "Dabo",
      ch003: 42,
      ch004: 25,
      ch005: "Leadership féminin",
      ch006: "",
    },
  },
  {
    id: "rep003",
    formulaireId: "form001",
    collecteurId: "u005",
    dateSoumission: "2024-09-10",
    statut: "VALIDEE",
    validePar: "u001",
    dateValidation: "2024-09-14",
    horsDelai: true,
    horsLigne: false,
    donnees: {
      ch001: "2024-09-05",
      ch002: "Saré Koundian",
      ch003: 28,
      ch004: 14,
      ch005: "Droits fonciers",
      ch006: "Quelques absences dues à la pluie",
    },
  },
  {
    id: "rep004",
    formulaireId: "form001",
    collecteurId: "u004",
    dateSoumission: fmt(subDays(today, 7)),
    statut: "EN_ATTENTE",
    horsDelai: false,
    horsLigne: false,
    donnees: {
      ch001: fmt(subDays(today, 10)),
      ch002: "Médina Yoro Foulah",
      ch003: 50,
      ch004: 30,
      ch005: "Gestion de projets",
      ch006: "Formation très appréciée par les participants",
    },
  },
  {
    id: "rep005",
    formulaireId: "form002",
    collecteurId: "u004",
    dateSoumission: fmt(subDays(today, 4)),
    statut: "PRE_VALIDEE",
    preValidePar: "u003",
    datePreValidation: fmt(subDays(today, 2)),
    horsDelai: false,
    horsLigne: false,
    donnees: {
      ch008: "Aminata DIALLO",
      ch009: "Très satisfait",
      ch010: 9,
      ch011: true,
      ch012: "Formation excellente, souhaité un suivi post-formation",
    },
  },
  {
    id: "rep006",
    formulaireId: "form003",
    collecteurId: "u005",
    dateSoumission: fmt(subDays(today, 6)),
    statut: "EN_ATTENTE",
    horsDelai: false,
    horsLigne: true,
    donnees: {
      ch013: "Kadiatou SOW",
      ch014: "Transformation de céréales",
      ch015: 185000,
      ch016: 3,
      ch017: true,
    },
  },
  {
    id: "rep007",
    formulaireId: "form003",
    collecteurId: "u005",
    dateSoumission: fmt(subDays(today, 3)),
    statut: "EN_ATTENTE",
    horsDelai: false,
    horsLigne: false,
    donnees: {
      ch013: "Sira BALDE",
      ch014: "Commerce de tissus",
      ch015: 120000,
      ch016: 2,
      ch017: false,
    },
  },
  {
    id: "rep008",
    formulaireId: "form004",
    collecteurId: "u004",
    dateSoumission: fmt(subDays(today, 2)),
    statut: "PRE_VALIDEE",
    preValidePar: "u003",
    datePreValidation: fmt(subDays(today, 1)),
    horsDelai: false,
    horsLigne: false,
    donnees: {
      ch019: "Forage",
      ch020: "Kéréwane",
      ch021: "2025-02-15",
      ch022: 320,
      ch024: { lat: 12.8935, lng: -14.9412 },
      ch025: "Forage opérationnel, débit satisfaisant",
    },
  },
  {
    id: "rep009",
    formulaireId: "form004",
    collecteurId: "u005",
    dateSoumission: fmt(subDays(today, 1)),
    statut: "EN_ATTENTE",
    horsDelai: true,
    horsLigne: true,
    donnees: {
      ch019: "Latrine",
      ch020: "Bagadadji",
      ch021: "2025-02-20",
      ch022: 150,
      ch024: { lat: 12.9015, lng: -14.8832 },
      ch025: "5 latrines installées au centre de santé",
    },
  },
];

// ══════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════

export const getProjet = (id) => MOCK_PROJETS.find((p) => p.id === id);
export const getMembre = (id) => MOCK_MEMBRES.find((m) => m.id === id);
export const getIndicateur = (id) => MOCK_INDICATEURS.find((i) => i.id === id);
export const getFormulaire = (id) => MOCK_FORMULAIRES.find((f) => f.id === id);

/** Collectes pour un indicateur donné */
export const getCollectesForIndicateur = (indicateurId) =>
  MOCK_COLLECTES.filter((c) => c.indicateurId === indicateurId).sort(
    (a, b) => new Date(a.dateCollecte) - new Date(b.dateCollecte),
  );

/** Dernière valeur collectée (validée ou pré-validée) pour un indicateur */
export const getDerniereValeur = (indicateurId) => {
  const collectes = getCollectesForIndicateur(indicateurId).filter((c) =>
    ["VALIDEE", "PRE_VALIDEE"].includes(c.statut),
  );
  return collectes.length > 0 ? collectes[collectes.length - 1].valeur : null;
};

/** Taux d'atteinte d'un indicateur */
export const getTauxAtteinte = (indicateur) => {
  const val = getDerniereValeur(indicateur.id);
  if (val === null || !indicateur.valeurCible) return 0;
  if (indicateur.unite === "POURCENTAGE") {
    // Pour les pourcentages on calcule la progression relative
    const progression = val - indicateur.valeurReference;
    const cibleProgression =
      indicateur.valeurCible - indicateur.valeurReference;
    return cibleProgression > 0
      ? Math.round((progression / cibleProgression) * 100)
      : 0;
  }
  return Math.round((val / indicateur.valeurCible) * 100);
};

/** Taux d'atteinte par projet */
export const getTauxParProjet = (projetId) => {
  const inds = MOCK_INDICATEURS.filter(
    (i) => i.projetId === projetId && i.statut === "ACTIF",
  );
  if (inds.length === 0) return { taux: 0, nbIndicateurs: 0 };
  const sum = inds.reduce((acc, ind) => acc + getTauxAtteinte(ind), 0);
  return {
    taux: Math.round(sum / inds.length),
    nbIndicateurs: inds.length,
  };
};

/** Indicateurs pour un projet */
export const getIndicateursForProjet = (projetId) =>
  MOCK_INDICATEURS.filter((i) => i.projetId === projetId);

/** Formulaires pour un projet */
export const getFormulairesForProjet = (projetId) =>
  MOCK_FORMULAIRES.filter((f) => f.projetId === projetId);

/** Réponses pour un formulaire */
export const getReponsesForFormulaire = (formulaireId) =>
  MOCK_REPONSES.filter((r) => r.formulaireId === formulaireId);

/** Toutes les collectes en attente de validation */
export const getCollectesEnAttente = () =>
  MOCK_COLLECTES.filter((c) =>
    ["EN_ATTENTE", "PRE_VALIDEE"].includes(c.statut),
  );

/** Toutes les réponses en attente de validation */
export const getReponsesEnAttente = () =>
  MOCK_REPONSES.filter((r) => ["EN_ATTENTE", "PRE_VALIDEE"].includes(r.statut));

/** Compteur global de données en attente */
export const countEnAttente = () =>
  getCollectesEnAttente().length + getReponsesEnAttente().length;

/** Indicateurs en sous-performance (< 50%) */
export const getIndicateursSousPerformance = () =>
  MOCK_INDICATEURS.filter(
    (i) => i.statut === "ACTIF" && getTauxAtteinte(i) < 50,
  );

/** Alertes S&E */
export const getAlertesSE = () => {
  const alertes = [];

  // Indicateurs sous-performance
  getIndicateursSousPerformance().forEach((ind) => {
    alertes.push({
      type: "SOUS_PERFORMANCE",
      niveau: "DANGER",
      message: `${ind.code} — ${ind.libelle} : taux à ${getTauxAtteinte(ind)}% (< 50%)`,
      indicateurId: ind.id,
      projetId: ind.projetId,
    });
  });

  // Données en attente depuis > 7 jours
  [...getCollectesEnAttente(), ...getReponsesEnAttente()].forEach((item) => {
    const soumission = new Date(item.dateSoumission);
    const joursAttente = Math.floor(
      (today - soumission) / (1000 * 60 * 60 * 24),
    );
    if (joursAttente > 7) {
      alertes.push({
        type: "VALIDATION_EN_RETARD",
        niveau: "ATTENTION",
        message: `Données en attente depuis ${joursAttente} jours`,
        itemId: item.id,
      });
    }
  });

  // Indicateurs sans collecte récente
  MOCK_INDICATEURS.filter((i) => i.statut === "ACTIF").forEach((ind) => {
    const collectes = getCollectesForIndicateur(ind.id);
    if (collectes.length === 0) {
      alertes.push({
        type: "SANS_COLLECTE",
        niveau: "ATTENTION",
        message: `${ind.code} — Aucune collecte enregistrée`,
        indicateurId: ind.id,
        projetId: ind.projetId,
      });
    }
  });

  return alertes;
};

/** Prochain code indicateur auto-généré */
export const getNextIndicateurCode = () => {
  const maxNum = MOCK_INDICATEURS.reduce((max, ind) => {
    const n = parseInt(ind.code.replace("IND-", ""), 10);
    return n > max ? n : max;
  }, 0);
  return `IND-${String(maxNum + 1).padStart(3, "0")}`;
};

/** Prochain ID de collecte */
let collecteCounter = MOCK_COLLECTES.length + 1;
export const getNextCollecteId = () =>
  `col${String(collecteCounter++).padStart(3, "0")}`;

/** Prochain ID de réponse */
let reponseCounter = MOCK_REPONSES.length + 1;
export const getNextReponseId = () =>
  `rep${String(reponseCounter++).padStart(3, "0")}`;
