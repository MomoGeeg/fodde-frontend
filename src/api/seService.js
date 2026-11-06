/**
 * Service S&E (Suivi-Évaluation) — Spring Boot API
 * Remplace les appels Supabase directs par des appels JWT via Axios.
 */
import api from "@/api/axios";

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTES UI
// ════════════════════════════════════════════════════════════════════════════

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
  { value: "FERME", label: "Fermé" },
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
  EN_ATTENTE:  "bg-yellow-100 text-yellow-700",
  PRE_VALIDEE: "bg-blue-100 text-blue-700",
  VALIDEE:     "bg-green-100 text-green-700",
  REJETEE:     "bg-red-100 text-red-700",
  ACTIF:       "bg-green-100 text-green-700",
  INACTIF:     "bg-gray-100 text-gray-500",
  ARCHIVE:     "bg-gray-100 text-gray-500",
  BROUILLON:   "bg-gray-100 text-gray-500",
  PUBLIE:      "bg-green-100 text-green-700",
  FERME:       "bg-red-100 text-red-600",
  CLOTURE:     "bg-red-100 text-red-600",  // alias de compatibilité
  EN_COURS:    "bg-green-100 text-green-700",
  SUSPENDU:    "bg-yellow-100 text-yellow-700",
};

// ════════════════════════════════════════════════════════════════════════════
// INDICATEURS  —  /api/indicateurs
// ════════════════════════════════════════════════════════════════════════════

export async function getAllIndicateurs() {
  const res = await api.get("/api/indicateurs");
  return res.data;
}

export async function getIndicateursByProjet(projetId) {
  const res = await api.get(`/api/indicateurs/projet/${projetId}`);
  return res.data;
}

export async function getIndicateurById(id) {
  const res = await api.get(`/api/indicateurs/${id}`);
  return res.data;
}

export async function createIndicateur(payload) {
  const res = await api.post("/api/indicateurs", payload);
  return res.data;
}

export async function updateIndicateur(id, payload) {
  // Spring Boot n'expose que la mise à jour de la valeur atteinte
  const valeur = payload.valeur_atteinte ?? payload.valeurAtteinte;
  if (valeur !== undefined) {
    return mettreAJourValeurIndicateur(id, valeur);
  }
  return getIndicateurById(id);
}

export async function mettreAJourValeurIndicateur(id, valeurAtteinte) {
  const res = await api.patch(`/api/indicateurs/${id}/valeur`, { valeur: valeurAtteinte });
  return res.data;
}

// ════════════════════════════════════════════════════════════════════════════
// COLLECTES — non migrées côté Spring Boot (retour vide)
// ════════════════════════════════════════════════════════════════════════════

export async function getAllCollectes() { return []; }
export async function getCollectesByIndicateur() { return []; }
export async function getCollectesEnAttente() { return []; }
export async function createCollecte() { return null; }
export async function preValiderCollecte() { return null; }
export async function rejeterCollecte() { return null; }
export async function validerCollecte() { return null; }

// ════════════════════════════════════════════════════════════════════════════
// FORMULAIRES  —  /api/formulaires
// ════════════════════════════════════════════════════════════════════════════

export async function getAllFormulaires() {
  const res = await api.get("/api/formulaires");
  return res.data;
}

export async function getFormulairesByProjet(projetId) {
  const res = await api.get(`/api/formulaires/projet/${projetId}`);
  return res.data;
}

export async function getFormulaireById(id) {
  const res = await api.get(`/api/formulaires/${id}`);
  return res.data;
}

export async function createFormulaire(payload) {
  const { champs: _champs, ...formulaireData } = payload;
  const res = await api.post("/api/formulaires", formulaireData);
  return res.data;
}

export async function publierFormulaire(id) {
  const res = await api.patch(`/api/formulaires/${id}/publier`);
  return res.data;
}

export async function cloturerFormulaire(id) {
  const res = await api.patch(`/api/formulaires/${id}/cloturer`);
  return res.data;
}

// ════════════════════════════════════════════════════════════════════════════
// RÉPONSES  —  /api/formulaires/{id}/reponses
// ════════════════════════════════════════════════════════════════════════════

export async function getReponsesByFormulaire(formulaireId) {
  const res = await api.get(`/api/formulaires/${formulaireId}/reponses`);
  return res.data;
}

export async function getReponsesEnAttente() { return []; }

export async function createReponse(payload) {
  const { formulaireId, collecteurId, ...rest } = payload;
  const res = await api.post(
    `/api/formulaires/${formulaireId}/reponses`,
    rest,
    { params: { collecteurId } }
  );
  return res.data;
}

// ════════════════════════════════════════════════════════════════════════════
// COLLECTEURS  —  non disponibles via Spring Boot
// ════════════════════════════════════════════════════════════════════════════

export async function getCollecteursForFormulaire() { return []; }
export async function assignerCollecteur() { return null; }

// ════════════════════════════════════════════════════════════════════════════
// HELPERS CÔTÉ CLIENT
// ════════════════════════════════════════════════════════════════════════════

/**
 * Taux d'atteinte — utilise le tauxRealisation calculé côté serveur si disponible.
 */
export function computeTauxAtteinte(indicateur, collectes) {
  if (indicateur?.tauxRealisation != null) {
    return Math.round(indicateur.tauxRealisation);
  }
  // Fallback sur collectes validées
  const validees = (collectes ?? [])
    .filter((c) => ["VALIDEE", "PRE_VALIDEE"].includes(c.statut ?? ""))
    .sort((a, b) => new Date(a.date_collecte ?? a.dateCollecte) - new Date(b.date_collecte ?? b.dateCollecte));

  const valeurCible = indicateur?.valeurCible ?? indicateur?.valeur_cible;
  if (validees.length === 0 || !valeurCible) return 0;
  return Math.round((validees[validees.length - 1].valeur / valeurCible) * 100);
}

/**
 * Dernière valeur collectée validée.
 */
export function getDerniereValeur(collectes) {
  const validees = (collectes ?? [])
    .filter((c) => ["VALIDEE", "PRE_VALIDEE"].includes(c.statut ?? ""))
    .sort((a, b) => new Date(a.date_collecte ?? a.dateCollecte) - new Date(b.date_collecte ?? b.dateCollecte));
  return validees.length > 0 ? validees[validees.length - 1].valeur : null;
}

/**
 * Prochain code indicateur auto-généré.
 */
export function getNextIndicateurCode(indicateurs) {
  const maxNum = (indicateurs ?? []).reduce((max, ind) => {
    const n = parseInt((ind.code ?? "").replace("IND-", ""), 10);
    return isNaN(n) ? max : Math.max(max, n);
  }, 0);
  return `IND-${String(maxNum + 1).padStart(3, "0")}`;
}
