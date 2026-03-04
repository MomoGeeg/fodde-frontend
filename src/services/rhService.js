/**
 * Service RH — Supabase
 * Tables : employes, contrats, conges, types_conges, evaluations,
 *          criteres_evaluation, services
 */
import { supabase } from "@/lib/supabase";

// ════════════════════════════════════════════════════════════════════════════
// EMPLOYÉS
// ════════════════════════════════════════════════════════════════════════════

export async function getAllEmployes() {
  const { data, error } = await supabase
    .from("employes")
    .select("*")
    .order("nom", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function getEmployeById(id) {
  const { data, error } = await supabase
    .from("employes")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function createEmploye(payload) {
  const { data, error } = await supabase
    .from("employes")
    .insert(payload)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateEmploye(id, payload) {
  const { data, error } = await supabase
    .from("employes")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function changerStatutEmploye(id, statut) {
  return updateEmploye(id, { statut });
}

// ════════════════════════════════════════════════════════════════════════════
// CONGÉS
// ════════════════════════════════════════════════════════════════════════════

export async function getAllConges() {
  const { data, error } = await supabase
    .from("conges")
    .select("*")
    .order("date_soumission", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function getCongesByEmploye(employeId) {
  const { data, error } = await supabase
    .from("conges")
    .select("*")
    .eq("employe_id", employeId)
    .order("date_soumission", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function getCongesEnAttente() {
  const { data, error } = await supabase
    .from("conges")
    .select("*")
    .eq("statut", "EN_ATTENTE")
    .order("date_soumission", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function getCongesValideN1() {
  const { data, error } = await supabase
    .from("conges")
    .select("*")
    .eq("statut", "VALIDE_N1")
    .order("date_soumission", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function createConge(payload) {
  const { data, error } = await supabase
    .from("conges")
    .insert({ ...payload, statut: "EN_ATTENTE" })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function validerCongeN1(id, validateurId) {
  const { data, error } = await supabase
    .from("conges")
    .update({ statut: "VALIDE_N1", valideur_n1: validateurId })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function approuverCongeRH(id, validateurId) {
  const { data, error } = await supabase
    .from("conges")
    .update({ statut: "APPROUVE", valideur_rh: validateurId })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function rejeterConge(id, validateurId, motif) {
  const { data, error } = await supabase
    .from("conges")
    .update({
      statut: "REJETE",
      valideur_rh: validateurId,
      motif_rejet: motif,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// ════════════════════════════════════════════════════════════════════════════
// TYPES CONGÉS
// ════════════════════════════════════════════════════════════════════════════

export async function getTypesConges() {
  const { data, error } = await supabase
    .from("types_conges")
    .select("*")
    .order("nom", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

// ════════════════════════════════════════════════════════════════════════════
// SERVICES / DÉPARTEMENTS
// ════════════════════════════════════════════════════════════════════════════

export async function getServices() {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .order("nom", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

// ════════════════════════════════════════════════════════════════════════════
// ÉVALUATIONS
// ════════════════════════════════════════════════════════════════════════════

export async function getAllEvaluations() {
  const { data, error } = await supabase
    .from("evaluations")
    .select("*")
    .order("date", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function getEvaluationsByEmploye(employeId) {
  const { data, error } = await supabase
    .from("evaluations")
    .select("*")
    .eq("employe_id", employeId)
    .order("annee", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function createEvaluation(payload) {
  const { data, error } = await supabase
    .from("evaluations")
    .insert(payload)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateEvaluation(id, payload) {
  const { data, error } = await supabase
    .from("evaluations")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// ════════════════════════════════════════════════════════════════════════════
// CRITÈRES D'ÉVALUATION
// ════════════════════════════════════════════════════════════════════════════

export async function getCriteresEvaluation() {
  const { data, error } = await supabase
    .from("criteres_evaluation")
    .select("*")
    .order("nom", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

// ════════════════════════════════════════════════════════════════════════════
// MISSIONS (RH)
// ════════════════════════════════════════════════════════════════════════════

export async function getMissions() {
  const { data, error } = await supabase
    .from("missions")
    .select("*")
    .order("date_debut", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function getMissionsByEmploye(employeId) {
  const { data, error } = await supabase
    .from("missions")
    .select("*")
    .eq("employe_id", employeId)
    .order("date_debut", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

// ════════════════════════════════════════════════════════════════════════════
// DOCUMENTS RH
// ════════════════════════════════════════════════════════════════════════════

export async function getDocumentsEmploye(employeId) {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("employe_id", employeId)
    .order("date_depot", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

// ════════════════════════════════════════════════════════════════════════════
// HELPERS CÔTÉ CLIENT
// ════════════════════════════════════════════════════════════════════════════

/**
 * Calcule les jours restants avant une date.
 */
export function joursRestants(dateFin) {
  if (!dateFin) return null;
  const diff = Math.ceil(
    (new Date(dateFin) - new Date()) / (1000 * 60 * 60 * 24),
  );
  return diff;
}

/**
 * Retourne le niveau d'urgence d'un contrat.
 */
export function urgenceContrat(dateFin) {
  const j = joursRestants(dateFin);
  if (j === null) return null;
  if (j <= 7) return "CRITIQUE";
  if (j <= 30) return "DANGER";
  if (j <= 60) return "WARNING";
  return null;
}
