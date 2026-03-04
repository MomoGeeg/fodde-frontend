/**
 * Service Finances — Supabase
 * Tables : depenses, lignes_budgetaires, categories_budgetaires,
 *          virements_budgetaires, tresorerie
 *
 * NOTE : Les colonnes Supabase utilisent snake_case. Les `select('*')`
 *        retournent les noms tels quels. Assurez-vous que le schéma
 *        Supabase correspond aux champs attendus par les composants
 *        (ou ajoutez un mapping ici).
 */
import { supabase } from "@/lib/supabase";

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTES UI (non issues de la BDD)
// ════════════════════════════════════════════════════════════════════════════

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

// ════════════════════════════════════════════════════════════════════════════
// DÉPENSES
// ════════════════════════════════════════════════════════════════════════════

export async function getAllDepenses() {
  const { data, error } = await supabase
    .from("depenses")
    .select("*")
    .order("date", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function getDepensesByProjet(projetId) {
  const { data, error } = await supabase
    .from("depenses")
    .select("*")
    .eq("projet_id", projetId)
    .order("date", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function getDepenseById(id) {
  const { data, error } = await supabase
    .from("depenses")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function createDepense(payload) {
  const { data, error } = await supabase
    .from("depenses")
    .insert({ ...payload, statut: payload.statut ?? "BROUILLON" })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateDepense(id, payload) {
  const { data, error } = await supabase
    .from("depenses")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Change le statut d'une dépense + ajoute une entrée dans l'historique.
 */
export async function changerStatutDepense(id, statut, userId, motif) {
  // On met à jour la dépense
  const { data: depense, error } = await supabase
    .from("depenses")
    .update({ statut })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Enregistrer dans l'historique des dépenses si la table existe
  try {
    await supabase.from("historique_depenses").insert({
      depense_id: id,
      etape: statut,
      par_user_id: userId,
      commentaire: motif || null,
      date: new Date().toISOString(),
    });
  } catch {
    // Si la table historique n'existe pas, on ignore silencieusement
  }

  return depense;
}

/**
 * Annule une dépense.
 */
export async function annulerDepense(id, motif, userId) {
  return changerStatutDepense(id, "ANNULEE", userId, motif);
}

// ════════════════════════════════════════════════════════════════════════════
// LIGNES BUDGÉTAIRES
// ════════════════════════════════════════════════════════════════════════════

export async function getAllLignesBudgetaires() {
  const { data, error } = await supabase
    .from("lignes_budgetaires")
    .select("*")
    .order("code", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function getLignesBudgetairesByProjet(projetId) {
  const { data, error } = await supabase
    .from("lignes_budgetaires")
    .select("*")
    .eq("projet_id", projetId)
    .order("code", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function createLigneBudgetaire(payload) {
  const { data, error } = await supabase
    .from("lignes_budgetaires")
    .insert(payload)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateLigneBudgetaire(id, payload) {
  const { data, error } = await supabase
    .from("lignes_budgetaires")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// ════════════════════════════════════════════════════════════════════════════
// CATÉGORIES BUDGÉTAIRES
// ════════════════════════════════════════════════════════════════════════════

export async function getCategoriesBudgetaires() {
  const { data, error } = await supabase
    .from("categories_budgetaires")
    .select("*")
    .order("nom", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

// ════════════════════════════════════════════════════════════════════════════
// VIREMENTS BUDGÉTAIRES
// ════════════════════════════════════════════════════════════════════════════

export async function getVirementsByProjet(projetId) {
  const { data, error } = await supabase
    .from("virements_budgetaires")
    .select("*")
    .eq("projet_id", projetId)
    .order("date", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function createVirement(payload) {
  const { data, error } = await supabase
    .from("virements_budgetaires")
    .insert(payload)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// ════════════════════════════════════════════════════════════════════════════
// HELPERS CÔTÉ CLIENT (initialement dans finances-mock-data.js)
// ════════════════════════════════════════════════════════════════════════════

/**
 * Calcule le solde disponible pour une ligne budgétaire.
 */
export function getSoldeDisponible(ligne) {
  if (!ligne) return 0;
  return (ligne.prevu ?? 0) - (ligne.depense ?? 0);
}

/**
 * Stats budget agrégées pour un ensemble de lignes.
 */
export function computeBudgetStats(lignes) {
  const prevu = lignes.reduce((s, l) => s + (l.prevu ?? 0), 0);
  const engage = lignes.reduce((s, l) => s + (l.engage ?? 0), 0);
  const depense = lignes.reduce((s, l) => s + (l.depense ?? 0), 0);
  const solde = prevu - depense;
  const taux = prevu > 0 ? Math.round((depense / prevu) * 100) : 0;
  return { prevu, engage, depense, solde, taux };
}

/**
 * Compteur pour numéro de pièce auto.
 */
let _pieceCounter = 100;
export function nextNumeroPiece() {
  _pieceCounter += 1;
  const year = new Date().getFullYear();
  return `DEP-${year}-${String(_pieceCounter).padStart(4, "0")}`;
}
