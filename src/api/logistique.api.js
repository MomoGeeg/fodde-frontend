/**
 * logistique.api.js — API Logistique
 * Données mockées en mémoire (le backend existe mais les tables
 * doivent d'abord être créées en Supabase via le SQL fourni).
 */

// ══════════════════════════ DONNÉES MOCK ══════════════════════

let BIENS = [
  {
    id: "b1",
    codeActif: "MAT-2025-001",
    designation: "Ordinateur portable Dell XPS 15",
    categorie: "INFORMATIQUE",
    marque: "Dell",
    modele: "XPS 15",
    numeroSerie: "DL2025-00142",
    etat: "BON_ETAT",
    valeurAcquisition: 850000,
    dateAcquisition: "2025-01-15",
    localisationActuelle: "Bureau principal – Kolda",
    projetId: null,
    responsableId: null,
    notes: null,
    createdAt: "2025-01-15T09:00:00",
  },
  {
    id: "b2",
    codeActif: "MAT-2025-002",
    designation: "Groupe électrogène 5 KVA",
    categorie: "EQUIPEMENT_TERRAIN",
    marque: "Honda",
    modele: "EU5000i",
    numeroSerie: "HO5K-2025-77",
    etat: "BON_ETAT",
    valeurAcquisition: 1200000,
    dateAcquisition: "2025-02-10",
    localisationActuelle: "Antenne – Vélingara",
    projetId: null,
    responsableId: null,
    notes: "Utilisé lors des missions terrain",
    createdAt: "2025-02-10T10:30:00",
  },
  {
    id: "b3",
    codeActif: "MAT-2025-003",
    designation: "Réfrigérateur médicaments",
    categorie: "MATERIEL_MEDICAL",
    marque: "Haier",
    modele: "HRF-280",
    numeroSerie: "HA280-2025-33",
    etat: "BON_ETAT",
    valeurAcquisition: 620000,
    dateAcquisition: "2025-03-01",
    localisationActuelle: "Centre de santé – Saré Guilel",
    projetId: null,
    responsableId: null,
    notes: null,
    createdAt: "2025-03-01T08:00:00",
  },
  {
    id: "b4",
    codeActif: "MAT-2024-018",
    designation: "Tracteur agricole",
    categorie: "MATERIEL_AGRICOLE",
    marque: "Massey Ferguson",
    modele: "MF 290",
    numeroSerie: "MF290-2024-08",
    etat: "EN_REPARATION",
    valeurAcquisition: 5500000,
    dateAcquisition: "2024-08-20",
    localisationActuelle: "Atelier – Kolda",
    projetId: null,
    responsableId: null,
    notes: "En révision moteur depuis le 01/03/2026",
    createdAt: "2024-08-20T14:00:00",
  },
  {
    id: "b5",
    codeActif: "MAT-2024-005",
    designation: "Imprimante multifonction HP",
    categorie: "INFORMATIQUE",
    marque: "HP",
    modele: "LaserJet Pro M428",
    numeroSerie: "HP428-2024-12",
    etat: "HORS_SERVICE",
    valeurAcquisition: 280000,
    dateAcquisition: "2024-03-05",
    localisationActuelle: "Bureau – Kolda (stocké)",
    projetId: null,
    responsableId: null,
    notes: "Carte mère grillée, mise au rebut prévue",
    createdAt: "2024-03-05T09:00:00",
  },
];

let VEHICULES = [
  {
    id: "v1",
    immatriculation: "DK-7823-AB",
    marque: "Toyota",
    modele: "Land Cruiser",
    annee: 2022,
    kilometrageActuel: 87500,
    kilometrageRevision: 90000,
    etat: "BON",
    projetId: null,
    conducteurHabituelId: null,
    typeCarburant: "DIESEL",
    dateExpirationAssurance: "2026-04-05",
    dateVisiteTechnique: "2026-06-15",
    notes: "Véhicule principal missions terrain",
    joursAvantAssurance: 22,
    joursAvantVisite: 93,
    alerteAssurance: true,
    alerteVisite: false,
    alerteKilometrage: false,
    createdAt: "2022-06-01T00:00:00",
  },
  {
    id: "v2",
    immatriculation: "ZG-1145-CD",
    marque: "Mitsubishi",
    modele: "Pajero",
    annee: 2021,
    kilometrageActuel: 120000,
    kilometrageRevision: 120000,
    etat: "A_REVISER",
    projetId: null,
    conducteurHabituelId: null,
    typeCarburant: "DIESEL",
    dateExpirationAssurance: "2026-09-30",
    dateVisiteTechnique: "2026-08-20",
    notes: null,
    joursAvantAssurance: 200,
    joursAvantVisite: 159,
    alerteAssurance: false,
    alerteVisite: false,
    alerteKilometrage: true,
    createdAt: "2021-11-15T00:00:00",
  },
  {
    id: "v3",
    immatriculation: "KL-4412-EF",
    marque: "Nissan",
    modele: "Patrol",
    annee: 2020,
    kilometrageActuel: 195000,
    kilometrageRevision: 200000,
    etat: "MOYEN",
    projetId: null,
    conducteurHabituelId: null,
    typeCarburant: "DIESEL",
    dateExpirationAssurance: "2026-03-25",
    dateVisiteTechnique: "2026-03-20",
    notes: "Suspension avant à vérifier",
    joursAvantAssurance: 11,
    joursAvantVisite: 6,
    alerteAssurance: true,
    alerteVisite: true,
    alerteKilometrage: false,
    createdAt: "2020-03-10T00:00:00",
  },
];

let MOUVEMENTS = [
  {
    id: "m1",
    type: "AFFECTATION",
    bienId: "b1",
    bienDesignation: "Ordinateur portable Dell XPS 15",
    bienCodeActif: "MAT-2025-001",
    vehiculeId: null,
    vehiculeImmatriculation: null,
    projetId: null,
    employeId: null,
    localisationDepart: "Magasin central – Kolda",
    localisationArrivee: "Bureau principal – Kolda",
    dateMouvement: "2025-01-16",
    motif: "Affectation initiale au responsable admin",
    notes: null,
    createdAt: "2025-01-16T10:00:00",
  },
  {
    id: "m2",
    type: "TRANSFERT",
    bienId: "b2",
    bienDesignation: "Groupe électrogène 5 KVA",
    bienCodeActif: "MAT-2025-002",
    vehiculeId: null,
    vehiculeImmatriculation: null,
    projetId: null,
    employeId: null,
    localisationDepart: "Bureau principal – Kolda",
    localisationArrivee: "Antenne – Vélingara",
    dateMouvement: "2025-03-10",
    motif: "Mission terrain programme AGRI-2025",
    notes: null,
    createdAt: "2025-03-10T08:30:00",
  },
  {
    id: "m3",
    type: "MAINTENANCE",
    bienId: "b4",
    bienDesignation: "Tracteur agricole",
    bienCodeActif: "MAT-2024-018",
    vehiculeId: null,
    vehiculeImmatriculation: null,
    projetId: null,
    employeId: null,
    localisationDepart: "Champ expérimental – Médina Yoro Foulah",
    localisationArrivee: "Atelier – Kolda",
    dateMouvement: "2026-03-01",
    motif: "Révision moteur et remplacement filtres",
    notes: "Durée estimée : 2 semaines",
    createdAt: "2026-03-01T07:00:00",
  },
];

// ══════════════════════════ HELPERS ═══════════════════════════

const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms));

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

// ══════════════════════════ API FUNCTIONS ═════════════════════

export const logistiqueApi = {
  // ── KPI ──────────────────────────────────────────────────
  getKpi: async () => {
    await delay();
    const totalBiens = BIENS.length;
    const biensHorsService = BIENS.filter((b) => b.etat === "HORS_SERVICE").length;
    const totalVehicules = VEHICULES.length;
    const totalAlertes = VEHICULES.filter(
      (v) => v.alerteAssurance || v.alerteVisite || v.alerteKilometrage
    ).length;

    return {
      totalBiens,
      biensActifs: totalBiens - biensHorsService,
      biensHorsService,
      totalVehicules,
      totalAlertes,
    };
  },

  // ── BIENS ─────────────────────────────────────────────────
  getBiens: async () => {
    await delay();
    return [...BIENS];
  },

  getBien: async (id) => {
    await delay();
    const b = BIENS.find((x) => x.id === id);
    if (!b) throw new Error("Bien introuvable");
    return { ...b };
  },

  creerBien: async (data) => {
    await delay();
    const annee = new Date().getFullYear();
    const max = BIENS.map((b) => parseInt(b.codeActif?.split("-")[2] || "0")).reduce(
      (a, v) => Math.max(a, v),
      0
    );
    const nouveau = {
      ...data,
      id: genId(),
      codeActif: `MAT-${annee}-${String(max + 1).padStart(3, "0")}`,
      etat: data.etat || "BON_ETAT",
      createdAt: new Date().toISOString(),
    };
    BIENS = [nouveau, ...BIENS];
    return { ...nouveau };
  },

  modifierBien: async (id, data) => {
    await delay();
    BIENS = BIENS.map((b) => (b.id === id ? { ...b, ...data } : b));
    return BIENS.find((b) => b.id === id);
  },

  mettreHorsService: async (id) => {
    await delay();
    BIENS = BIENS.map((b) => (b.id === id ? { ...b, etat: "HORS_SERVICE" } : b));
  },

  // ── VEHICULES ─────────────────────────────────────────────
  getVehicules: async () => {
    await delay();
    return [...VEHICULES];
  },

  getVehicule: async (id) => {
    await delay();
    const v = VEHICULES.find((x) => x.id === id);
    if (!v) throw new Error("Véhicule introuvable");
    return { ...v };
  },

  creerVehicule: async (data) => {
    await delay();
    const existe = VEHICULES.find(
      (v) => v.immatriculation === data.immatriculation
    );
    if (existe) throw new Error("Cette immatriculation existe déjà");
    const nouveau = {
      ...data,
      id: genId(),
      etat: data.etat || "BON",
      typeCarburant: data.typeCarburant || "DIESEL",
      kilometrageActuel: data.kilometrageActuel || 0,
      alerteAssurance: false,
      alerteVisite: false,
      alerteKilometrage: false,
      createdAt: new Date().toISOString(),
    };
    VEHICULES = [nouveau, ...VEHICULES];
    return { ...nouveau };
  },

  modifierVehicule: async (id, data) => {
    await delay();
    VEHICULES = VEHICULES.map((v) => (v.id === id ? { ...v, ...data } : v));
    return VEHICULES.find((v) => v.id === id);
  },

  getAlertes: async () => {
    await delay();
    return VEHICULES.filter(
      (v) => v.alerteAssurance || v.alerteVisite || v.alerteKilometrage
    );
  },

  // ── MOUVEMENTS ────────────────────────────────────────────
  getMouvements: async () => {
    await delay();
    return [...MOUVEMENTS];
  },

  getMouvementsBien: async (bienId) => {
    await delay();
    return MOUVEMENTS.filter((m) => m.bienId === bienId);
  },

  getMouvementsVehicule: async (vehiculeId) => {
    await delay();
    return MOUVEMENTS.filter((m) => m.vehiculeId === vehiculeId);
  },

  enregistrerMouvement: async (data) => {
    await delay();
    const bien = data.bienId ? BIENS.find((b) => b.id === data.bienId) : null;
    const veh = data.vehiculeId ? VEHICULES.find((v) => v.id === data.vehiculeId) : null;

    const nouveau = {
      ...data,
      id: genId(),
      bienDesignation: bien?.designation || null,
      bienCodeActif: bien?.codeActif || null,
      vehiculeImmatriculation: veh?.immatriculation || null,
      createdAt: new Date().toISOString(),
    };

    // Mettre à jour la localisation du bien
    if (data.bienId && data.localisationArrivee) {
      BIENS = BIENS.map((b) =>
        b.id === data.bienId
          ? { ...b, localisationActuelle: data.localisationArrivee }
          : b
      );
    }

    MOUVEMENTS = [nouveau, ...MOUVEMENTS];
    return { ...nouveau };
  },
};

// ══════════════════════════ REACT QUERY HOOKS ═════════════════

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useLogistiqueKpi() {
  return useQuery({
    queryKey: ["logistique", "kpi"],
    queryFn: logistiqueApi.getKpi,
    staleTime: 30_000,
  });
}

export function useBiens() {
  return useQuery({
    queryKey: ["logistique", "biens"],
    queryFn: logistiqueApi.getBiens,
    staleTime: 30_000,
  });
}

export function useCreerBien() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: logistiqueApi.creerBien,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["logistique"] });
      toast.success("Bien enregistré avec succès");
    },
    onError: (e) => toast.error(e?.message || "Erreur lors de l'enregistrement"),
  });
}

export function useModifierBien() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => logistiqueApi.modifierBien(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["logistique"] });
      toast.success("Bien modifié");
    },
    onError: (e) => toast.error(e?.message || "Erreur"),
  });
}

export function useMettreHorsService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: logistiqueApi.mettreHorsService,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["logistique"] });
      toast.success("Bien marqué hors service");
    },
    onError: (e) => toast.error(e?.message || "Erreur"),
  });
}

export function useVehicules() {
  return useQuery({
    queryKey: ["logistique", "vehicules"],
    queryFn: logistiqueApi.getVehicules,
    staleTime: 30_000,
  });
}

export function useCreerVehicule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: logistiqueApi.creerVehicule,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["logistique"] });
      toast.success("Véhicule enregistré");
    },
    onError: (e) => toast.error(e?.message || "Erreur"),
  });
}

export function useModifierVehicule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => logistiqueApi.modifierVehicule(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["logistique"] });
      toast.success("Véhicule modifié");
    },
    onError: (e) => toast.error(e?.message || "Erreur"),
  });
}

export function useMouvements() {
  return useQuery({
    queryKey: ["logistique", "mouvements"],
    queryFn: logistiqueApi.getMouvements,
    staleTime: 30_000,
  });
}

export function useEnregistrerMouvement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: logistiqueApi.enregistrerMouvement,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["logistique"] });
      toast.success("Mouvement enregistré");
    },
    onError: (e) => toast.error(e?.message || "Erreur"),
  });
}
