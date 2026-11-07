// ─────────────────────────────────────────────────────────────────────────────
// Logistique : inventaire du matériel (avec ses mouvements), parc de véhicules
// et carnet de bord. Lecture : logistique, RAF, SE, admin. Saisie : logistique, admin.
// L'état d'un bien et son affectation ne changent que par un mouvement.
// ─────────────────────────────────────────────────────────────────────────────
import api from "@/api/axios";
import { R, aAcces } from "@/lib/navigation";
import { useQuery } from "@tanstack/react-query";

export const peutSaisir = (roles) => aAcces(roles, [R.LOG, R.ADMIN]);

export const CATEGORIES_MATERIEL = {
  INFORMATIQUE: "Informatique",
  MOBILIER: "Mobilier",
  TERRAIN: "Équipement de terrain",
  ELECTROMENAGER: "Électroménager",
  VEHICULE: "Véhicule / engin",
  AUTRE: "Autre",
};

/** États communs aux biens et aux véhicules (libellé et ton du badge). */
export const ETATS = {
  NEUF: { label: "Neuf", ton: "succes" },
  BON_ETAT: { label: "Bon état", ton: "succes" },
  USE: { label: "Usé", ton: "attention" },
  EN_REPARATION: { label: "En réparation", ton: "attention" },
  HORS_SERVICE: { label: "Hors service", ton: "neutre" },
};

export const TYPES_MOUVEMENT = {
  AFFECTATION: "Affectation",
  RETOUR: "Retour",
  REPARATION: "Départ en réparation",
  MISE_HORS_SERVICE: "Mise hors service",
  INVENTAIRE: "Inventaire",
};

export const CARBURANTS = { DIESEL: "Diesel", ESSENCE: "Essence", HYBRIDE: "Hybride", ELECTRIQUE: "Électrique" };

/** Catégorie d'inventaire proposée pour une catégorie d'acquisition (modifiable). */
export const CATEGORIE_DEPUIS_ACQUISITION = {
  INFORMATIQUE: "INFORMATIQUE",
  MOBILIER: "MOBILIER",
  VEHICULE: "VEHICULE",
  EQUIPEMENT: "TERRAIN",
  MATERIEL_AGRICOLE: "TERRAIN",
  MATERIEL_MEDICAL: "AUTRE",
  AUTRE: "AUTRE",
};

const tableau = (r) => (Array.isArray(r.data) ? r.data : []);

// ── Lecture ─────────────────────────────────────────────────────────────────

export const useMateriels = () =>
  useQuery({ queryKey: ["logistique", "materiels"], queryFn: () => api.get("/api/logistique/materiels").then(tableau) });

export const useMateriel = (id) =>
  useQuery({
    queryKey: ["logistique", "materiel", id],
    queryFn: () => api.get(`/api/logistique/materiels/${id}`).then((r) => r.data),
    enabled: !!id,
  });

export const useMouvements = (id) =>
  useQuery({
    queryKey: ["logistique", "mouvements", id],
    queryFn: () => api.get(`/api/logistique/materiels/${id}/mouvements`).then(tableau),
    enabled: !!id,
  });

export const useVehicules = () =>
  useQuery({ queryKey: ["logistique", "vehicules"], queryFn: () => api.get("/api/logistique/vehicules").then(tableau) });

export const useVehicule = (id) =>
  useQuery({
    queryKey: ["logistique", "vehicule", id],
    queryFn: () => api.get(`/api/logistique/vehicules/${id}`).then((r) => r.data),
    enabled: !!id,
  });

export const useSorties = (id) =>
  useQuery({
    queryKey: ["logistique", "sorties", id],
    queryFn: () => api.get(`/api/logistique/vehicules/${id}/sorties`).then(tableau),
    enabled: !!id,
  });

/** Comptes actifs, pour choisir un responsable ou un conducteur. */
export const usePersonnes = () =>
  useQuery({
    queryKey: ["logistique", "personnes"],
    queryFn: () => api.get("/api/logistique/personnes").then(tableau),
    staleTime: 5 * 60_000,
  });

/**
 * Acquisitions validées pas encore entrées dans l'inventaire (seulement pour
 * ceux qui saisissent ; la liste des acquisitions leur est ouverte).
 */
export function useAcquisitionsAInventorier(actif) {
  return useQuery({
    queryKey: ["logistique", "acquisitions-a-inventorier"],
    queryFn: async () => {
      const [acquisitions, materiels] = await Promise.all([
        api.get("/api/acquisitions").then(tableau),
        api.get("/api/logistique/materiels").then(tableau),
      ]);
      const deja = new Set(materiels.map((m) => m.acquisitionId).filter(Boolean));
      return acquisitions.filter((a) => a.statut === "VALIDEE" && !deja.has(a.id));
    },
    enabled: !!actif,
  });
}

// ── Saisie ──────────────────────────────────────────────────────────────────

export const creerMateriel = (payload) => api.post("/api/logistique/materiels", payload).then((r) => r.data);
export const modifierMateriel = (id, payload) => api.put(`/api/logistique/materiels/${id}`, payload).then((r) => r.data);
export const enregistrerMouvement = (id, payload) =>
  api.post(`/api/logistique/materiels/${id}/mouvements`, payload).then((r) => r.data);

export const creerVehicule = (payload) => api.post("/api/logistique/vehicules", payload).then((r) => r.data);
export const modifierVehicule = (id, payload) => api.put(`/api/logistique/vehicules/${id}`, payload).then((r) => r.data);
export const enregistrerDepart = (id, payload) =>
  api.post(`/api/logistique/vehicules/${id}/sorties`, payload).then((r) => r.data);
export const enregistrerRetour = (sortieId, payload) =>
  api.patch(`/api/logistique/sorties/${sortieId}/retour`, payload).then((r) => r.data);

/** Mouvements possibles pour un bien, selon son état et son affectation. */
export function mouvementsPossibles(m) {
  if (!m || m.etat === "HORS_SERVICE") return [];
  const liste = [];
  if (m.etat !== "EN_REPARATION") liste.push("AFFECTATION");
  if (m.responsableId || m.etat === "EN_REPARATION") liste.push("RETOUR");
  if (m.etat !== "EN_REPARATION") liste.push("REPARATION");
  liste.push("INVENTAIRE", "MISE_HORS_SERVICE");
  return liste;
}
