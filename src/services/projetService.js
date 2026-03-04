/**
 * Service Projets & Activités — Supabase
 * Tables : projets, activites, sous_activites, equipe_projet, bailleurs
 */
import { supabase } from "@/lib/supabase";

// ════════════════════════════════════════════════════════════════════════════
// PROJETS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Récupère tous les projets.
 * Le filtrage par rôle devrait se faire via RLS côté Supabase,
 * ou en passant le userRole/userId si nécessaire.
 */
export async function getAllProjets() {
  const { data, error } = await supabase
    .from("projets")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Récupère un projet par ID avec ses relations.
 */
export async function getProjetById(id) {
  const { data, error } = await supabase
    .from("projets")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Crée un nouveau projet (statut BROUILLON par défaut).
 */
export async function createProjet(payload) {
  const { data, error } = await supabase
    .from("projets")
    .insert({ ...payload, statut: payload.statut ?? "BROUILLON" })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Met à jour un projet.
 */
export async function updateProjet(id, payload) {
  const { data, error } = await supabase
    .from("projets")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Change le statut d'un projet ({ statut, validateurId, commentaire }).
 */
export async function changerStatutProjet(
  id,
  { statut, validateurId, commentaire },
) {
  const updates = { statut };
  if (validateurId) updates.validateur_id = validateurId;
  if (commentaire) updates.commentaire_validation = commentaire;

  const { data, error } = await supabase
    .from("projets")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Prolonge la date de fin d'un projet.
 */
export async function prolongerProjet(id, nouvelleDateFin, justification) {
  const { data, error } = await supabase
    .from("projets")
    .update({
      date_fin: nouvelleDateFin,
      justification_prolongation: justification,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Supprime un projet.
 */
export async function deleteProjet(id) {
  const { error } = await supabase.from("projets").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ════════════════════════════════════════════════════════════════════════════
// EQUIPE PROJET
// ════════════════════════════════════════════════════════════════════════════

export async function getEquipeProjet(projetId) {
  const { data, error } = await supabase
    .from("equipe_projet")
    .select("*, utilisateur:utilisateurs(*)")
    .eq("projet_id", projetId);

  if (error) throw new Error(error.message);
  return data;
}

export async function ajouterMembreEquipe(projetId, userId) {
  const { data, error } = await supabase
    .from("equipe_projet")
    .insert({ projet_id: projetId, utilisateur_id: userId })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function retirerMembreEquipe(projetId, userId) {
  const { error } = await supabase
    .from("equipe_projet")
    .delete()
    .eq("projet_id", projetId)
    .eq("utilisateur_id", userId);

  if (error) throw new Error(error.message);
}

// ════════════════════════════════════════════════════════════════════════════
// ACTIVITÉS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Récupère toutes les activités d'un projet.
 */
export async function getActivitesByProjet(projetId) {
  const { data, error } = await supabase
    .from("activites")
    .select("*")
    .eq("projet_id", projetId)
    .order("date_prevu_debut", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Crée une nouvelle activité.
 */
export async function createActivite(payload) {
  const { data, error } = await supabase
    .from("activites")
    .insert(payload)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Démarre une activité (passe en EN_COURS + date début réelle).
 */
export async function demarrerActivite(id) {
  const { data, error } = await supabase
    .from("activites")
    .update({
      statut: "EN_COURS",
      date_reel_debut: new Date().toISOString().slice(0, 10),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Met à jour l'avancement d'une activité.
 */
export async function mettreAJourAvancement(id, taux, statut) {
  const updates = {};
  if (taux != null) updates.taux_avancement = taux;
  if (statut) updates.statut = statut;
  if (statut === "REALISEE") {
    updates.date_reel_fin = new Date().toISOString().slice(0, 10);
  }

  const { data, error } = await supabase
    .from("activites")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// ════════════════════════════════════════════════════════════════════════════
// BAILLEURS
// ════════════════════════════════════════════════════════════════════════════

export async function getBailleursByProjet(projetId) {
  const { data, error } = await supabase
    .from("bailleurs")
    .select("*")
    .eq("projet_id", projetId);

  if (error) throw new Error(error.message);
  return data;
}

export async function createBailleur(payload) {
  const { data, error } = await supabase
    .from("bailleurs")
    .insert(payload)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}
