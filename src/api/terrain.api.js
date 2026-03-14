// ─────────────────────────────────────────────────────────────────────────────
// terrain.api.js — Mock store pour le module Agent de Terrain
// ─────────────────────────────────────────────────────────────────────────────
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// ── Données mock ──────────────────────────────────────────────────────────────

let MOCK_FORMULAIRES = [
  {
    id: "f1",
    titre: "Suivi mensuel bénéficiaires — Kolda",
    description: "Collecte des données de suivi des bénéficiaires du programme nutrition",
    projetCode: "PROJ-2024-001",
    projetTitre: "Amélioration nutritionnelle Kolda",
    statut: "PUBLIE",
    dateEcheance: "2026-03-20",
    nbChamps: 12,
    nbSoumissions: 2,
    responsable: "Ousmane Diallo",
  },
  {
    id: "f2",
    titre: "Enquête satisfaction bénéficiaires",
    description: "Mesure du niveau de satisfaction des bénéficiaires du projet AMED",
    projetCode: "PROJ-2024-002",
    projetTitre: "AMED — Appui maraîchage Vélingara",
    statut: "PUBLIE",
    dateEcheance: "2026-03-25",
    nbChamps: 8,
    nbSoumissions: 0,
    responsable: "Mariama Baldé",
  },
  {
    id: "f3",
    titre: "Bilan de formation agricole",
    description: "Évaluation post-formation des producteurs accompagnés",
    projetCode: "PROJ-2024-002",
    projetTitre: "AMED — Appui maraîchage Vélingara",
    statut: "PUBLIE",
    dateEcheance: "2026-04-05",
    nbChamps: 10,
    nbSoumissions: 1,
    responsable: "Mariama Baldé",
  },
  {
    id: "f4",
    titre: "Inventaire cheptels — Zone nord",
    description: "Recensement des animaux dans les villages d'intervention",
    projetCode: "PROJ-2023-001",
    projetTitre: "Projet élevage Médina Yoro Foulah",
    statut: "CLOTURE",
    dateEcheance: "2026-02-28",
    nbChamps: 7,
    nbSoumissions: 5,
    responsable: "Ousmane Diallo",
  },
];

let MOCK_SOUMISSIONS = [
  {
    id: "s1",
    formulaireTitre: "Suivi mensuel bénéficiaires — Kolda",
    formulaireId: "f1",
    projetCode: "PROJ-2024-001",
    dateCollecte: "2026-03-05",
    localisation: "Village de Saré Bodio",
    statut: "VALIDE",
    nbChamps: 12,
    gpsCoordonnees: "12.8891° N, 14.9477° O",
    commentaire: "Collecte effectuée en présence du chef de village",
  },
  {
    id: "s2",
    formulaireTitre: "Suivi mensuel bénéficiaires — Kolda",
    formulaireId: "f1",
    projetCode: "PROJ-2024-001",
    dateCollecte: "2026-03-08",
    localisation: "Village de Médina Gounass",
    statut: "EN_ATTENTE",
    nbChamps: 12,
    gpsCoordonnees: "12.9102° N, 15.0213° O",
    commentaire: "",
  },
  {
    id: "s3",
    formulaireTitre: "Bilan de formation agricole",
    formulaireId: "f3",
    projetCode: "PROJ-2024-002",
    dateCollecte: "2026-03-10",
    localisation: "Vélingara centre",
    statut: "REJETE",
    nbChamps: 10,
    gpsCoordonnees: "13.1500° N, 14.1000° O",
    commentaire: "Données GPS manquantes sur plusieurs champs",
  },
  {
    id: "s4",
    formulaireTitre: "Inventaire cheptels — Zone nord",
    formulaireId: "f4",
    projetCode: "PROJ-2023-001",
    dateCollecte: "2026-02-20",
    localisation: "Médina Yoro Foulah",
    statut: "VALIDE",
    nbChamps: 7,
    gpsCoordonnees: "12.4521° N, 14.2876° O",
    commentaire: "",
  },
];

let MOCK_RAPPORTS = [
  {
    id: "r1",
    titre: "Rapport hebdomadaire — S10 2026",
    type: "HEBDOMADAIRE",
    periode: "03/03/2026 – 09/03/2026",
    projetCode: "PROJ-2024-001",
    projetTitre: "Amélioration nutritionnelle Kolda",
    statut: "SOUMIS",
    dateCreation: "2026-03-10",
    contenu: "Visite de 3 villages. Collecte de données sur 45 bénéficiaires. RAS.",
  },
  {
    id: "r2",
    titre: "Rapport mensuel — Février 2026",
    type: "MENSUEL",
    periode: "01/02/2026 – 28/02/2026",
    projetCode: "PROJ-2024-001",
    projetTitre: "Amélioration nutritionnelle Kolda",
    statut: "VALIDE",
    dateCreation: "2026-03-01",
    contenu: "Bilan complet du mois de février. 12 villages visités, 180 bénéficiaires enregistrés.",
  },
];

// ── Mock API ──────────────────────────────────────────────────────────────────

export const terrainApi = {
  getKpi: () =>
    Promise.resolve({
      formulairesActifs: MOCK_FORMULAIRES.filter((f) => f.statut === "PUBLIE").length,
      soumissionsMois: MOCK_SOUMISSIONS.filter((s) => s.dateCollecte >= "2026-03-01").length,
      soumissionsValidees: MOCK_SOUMISSIONS.filter((s) => s.statut === "VALIDE").length,
      rapportsSoumis: MOCK_RAPPORTS.filter((r) => r.statut === "SOUMIS").length,
    }),

  getFormulaires: () =>
    Promise.resolve([...MOCK_FORMULAIRES]),

  getSoumissions: () =>
    Promise.resolve([...MOCK_SOUMISSIONS]),

  getRapports: () =>
    Promise.resolve([...MOCK_RAPPORTS]),

  soumettreRapport: (data) => {
    const nouveau = {
      id: `r${Date.now()}`,
      titre: data.titre,
      type: data.type,
      periode: data.periode,
      projetCode: data.projetCode,
      projetTitre: data.projetTitre || "",
      statut: "SOUMIS",
      dateCreation: new Date().toISOString().slice(0, 10),
      contenu: data.contenu,
    };
    MOCK_RAPPORTS = [nouveau, ...MOCK_RAPPORTS];
    return Promise.resolve(nouveau);
  },
};

// ── React Query hooks ─────────────────────────────────────────────────────────

export function useTerrainKpi() {
  return useQuery({
    queryKey: ["terrain", "kpi"],
    queryFn: terrainApi.getKpi,
    staleTime: 30_000,
  });
}

export function useFormulairesAssignes() {
  return useQuery({
    queryKey: ["terrain", "formulaires"],
    queryFn: terrainApi.getFormulaires,
    staleTime: 30_000,
  });
}

export function useMesSoumissions() {
  return useQuery({
    queryKey: ["terrain", "soumissions"],
    queryFn: terrainApi.getSoumissions,
    staleTime: 30_000,
  });
}

export function useMesRapports() {
  return useQuery({
    queryKey: ["terrain", "rapports"],
    queryFn: terrainApi.getRapports,
    staleTime: 30_000,
  });
}

export function useSoumettreRapport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: terrainApi.soumettreRapport,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["terrain"] }),
  });
}
