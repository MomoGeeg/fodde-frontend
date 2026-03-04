/**
 * Service S&E (Suivi-Évaluation) — Supabase
 * Tables : indicateurs, formulaires_collecte, champs_formulaire,
 *          donnees_collectees, collecteurs_assignes
 */
import { supabase } from "@/lib/supabase";

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

// ════════════════════════════════════════════════════════════════════════════
// INDICATEURS
// ════════════════════════════════════════════════════════════════════════════

export async function getAllIndicateurs() {
  const { data, error } = await supabase
    .from("indicateurs")
    .select("*")
    .order("code", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function getIndicateursByProjet(projetId) {
  const { data, error } = await supabase
    .from("indicateurs")
    .select("*")
    .eq("projet_id", projetId)
    .order("code", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function getIndicateurById(id) {
  const { data, error } = await supabase
    .from("indicateurs")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function createIndicateur(payload) {
  const { data, error } = await supabase
    .from("indicateurs")
    .insert(payload)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateIndicateur(id, payload) {
  const { data, error } = await supabase
    .from("indicateurs")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function mettreAJourValeurIndicateur(id, valeurAtteinte) {
  return updateIndicateur(id, { valeur_atteinte: valeurAtteinte });
}

// ════════════════════════════════════════════════════════════════════════════
// COLLECTES DE DONNÉES (donnees_collectees)
// ════════════════════════════════════════════════════════════════════════════

export async function getAllCollectes() {
  const { data, error } = await supabase
    .from("donnees_collectees")
    .select("*")
    .order("date_collecte", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function getCollectesByIndicateur(indicateurId) {
  const { data, error } = await supabase
    .from("donnees_collectees")
    .select("*")
    .eq("indicateur_id", indicateurId)
    .order("date_collecte", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function getCollectesEnAttente() {
  const { data, error } = await supabase
    .from("donnees_collectees")
    .select("*")
    .in("statut", ["EN_ATTENTE", "PRE_VALIDEE"])
    .order("date_soumission", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function createCollecte(payload) {
  const { data, error } = await supabase
    .from("donnees_collectees")
    .insert(payload)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function validerCollecte(id, validateurId) {
  const { data, error } = await supabase
    .from("donnees_collectees")
    .update({
      statut: "VALIDEE",
      valide_par: validateurId,
      date_validation: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function preValiderCollecte(id, validateurId) {
  const { data, error } = await supabase
    .from("donnees_collectees")
    .update({
      statut: "PRE_VALIDEE",
      pre_valide_par: validateurId,
      date_pre_validation: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function rejeterCollecte(id, validateurId, motif) {
  const { data, error } = await supabase
    .from("donnees_collectees")
    .update({
      statut: "REJETEE",
      rejete_par: validateurId,
      motif_rejet: motif,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// ════════════════════════════════════════════════════════════════════════════
// FORMULAIRES
// ════════════════════════════════════════════════════════════════════════════

export async function getAllFormulaires() {
  const { data, error } = await supabase
    .from("formulaires_collecte")
    .select("*, champs:champs_formulaire(*)")
    .order("date_creation", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function getFormulairesByProjet(projetId) {
  const { data, error } = await supabase
    .from("formulaires_collecte")
    .select("*, champs:champs_formulaire(*)")
    .eq("projet_id", projetId)
    .order("date_creation", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function getFormulaireById(id) {
  const { data, error } = await supabase
    .from("formulaires_collecte")
    .select("*, champs:champs_formulaire(*)")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function createFormulaire(payload) {
  // Séparer champs du payload
  const { champs, ...formulaireData } = payload;

  const { data: formulaire, error: formError } = await supabase
    .from("formulaires_collecte")
    .insert({ ...formulaireData, statut: "BROUILLON" })
    .select()
    .single();

  if (formError) throw new Error(formError.message);

  // Créer les champs si fournis
  if (champs?.length > 0) {
    const champsWithFormId = champs.map((c) => ({
      ...c,
      formulaire_id: formulaire.id,
    }));
    const { error: champsError } = await supabase
      .from("champs_formulaire")
      .insert(champsWithFormId);

    if (champsError) throw new Error(champsError.message);
  }

  return formulaire;
}

export async function publierFormulaire(id) {
  const { data, error } = await supabase
    .from("formulaires_collecte")
    .update({
      statut: "PUBLIE",
      date_publication: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function cloturerFormulaire(id) {
  const { data, error } = await supabase
    .from("formulaires_collecte")
    .update({ statut: "CLOTURE" })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// ════════════════════════════════════════════════════════════════════════════
// RÉPONSES AUX FORMULAIRES
// ════════════════════════════════════════════════════════════════════════════

export async function getReponsesByFormulaire(formulaireId) {
  const { data, error } = await supabase
    .from("donnees_collectees")
    .select("*")
    .eq("formulaire_id", formulaireId)
    .order("date_soumission", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function getReponsesEnAttente() {
  const { data, error } = await supabase
    .from("donnees_collectees")
    .select("*")
    .not("formulaire_id", "is", null)
    .in("statut", ["EN_ATTENTE", "PRE_VALIDEE"])
    .order("date_soumission", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function createReponse(payload) {
  const { data, error } = await supabase
    .from("donnees_collectees")
    .insert({ ...payload, statut: "EN_ATTENTE" })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// ════════════════════════════════════════════════════════════════════════════
// COLLECTEURS ASSIGNÉS
// ════════════════════════════════════════════════════════════════════════════

export async function getCollecteursForFormulaire(formulaireId) {
  const { data, error } = await supabase
    .from("collecteurs_assignes")
    .select("*, utilisateur:utilisateurs(*)")
    .eq("formulaire_id", formulaireId);

  if (error) throw new Error(error.message);
  return data;
}

export async function assignerCollecteur(formulaireId, utilisateurId) {
  const { data, error } = await supabase
    .from("collecteurs_assignes")
    .insert({ formulaire_id: formulaireId, utilisateur_id: utilisateurId })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// ════════════════════════════════════════════════════════════════════════════
// HELPERS CÔTÉ CLIENT
// ════════════════════════════════════════════════════════════════════════════

/**
 * Taux d'atteinte d'un indicateur à partir de ses collectes validées.
 */
export function computeTauxAtteinte(indicateur, collectes) {
  const validees = collectes
    .filter((c) => ["VALIDEE", "PRE_VALIDEE"].includes(c.statut))
    .sort((a, b) => new Date(a.date_collecte) - new Date(b.date_collecte));

  if (validees.length === 0 || !indicateur.valeur_cible) return 0;

  const derniereValeur = validees[validees.length - 1].valeur;

  if (indicateur.unite === "POURCENTAGE") {
    const progression = derniereValeur - (indicateur.valeur_reference ?? 0);
    const cibleProgression =
      indicateur.valeur_cible - (indicateur.valeur_reference ?? 0);
    return cibleProgression > 0
      ? Math.round((progression / cibleProgression) * 100)
      : 0;
  }

  return Math.round((derniereValeur / indicateur.valeur_cible) * 100);
}

/**
 * Dernière valeur collectée (validée ou pré-validée) pour un indicateur.
 */
export function getDerniereValeur(collectes) {
  const validees = collectes
    .filter((c) => ["VALIDEE", "PRE_VALIDEE"].includes(c.statut))
    .sort((a, b) => new Date(a.date_collecte) - new Date(b.date_collecte));

  return validees.length > 0 ? validees[validees.length - 1].valeur : null;
}

/**
 * Prochain code indicateur auto-généré.
 */
export function getNextIndicateurCode(indicateurs) {
  const maxNum = indicateurs.reduce((max, ind) => {
    const n = parseInt((ind.code ?? "").replace("IND-", ""), 10);
    return isNaN(n) ? max : Math.max(max, n);
  }, 0);
  return `IND-${String(maxNum + 1).padStart(3, "0")}`;
}
