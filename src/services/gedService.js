/**
 * Service GED (Gestion Électronique de Documents) — Supabase
 * Tables : documents, versions_document, repertoires,
 *          journal_telechargements
 * Storage : Supabase Storage pour les fichiers binaires
 */
import { supabase } from "@/lib/supabase";

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTES UI
// ════════════════════════════════════════════════════════════════════════════

export const TYPE_OPTIONS = [
  "Rapport",
  "Contrat",
  "Convention",
  "Budget",
  "PV",
  "Photo",
  "Autre",
];

export const FORMATS_AUTORISES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

export const TAILLE_MAX_MB = 25;

export const STATUT_COLORS = {
  BROUILLON: "bg-gray-100 text-gray-600",
  EN_VALIDATION: "bg-yellow-100 text-yellow-700",
  VALIDE: "bg-green-100 text-green-700",
  ARCHIVE: "bg-gray-200 text-gray-400",
};

export const SOUS_REPERTOIRES = {
  projets: [
    { id: "contrats", label: "Contrats" },
    { id: "rapports", label: "Rapports" },
    { id: "justificatifs", label: "Justificatifs financiers" },
    { id: "terrain", label: "Documents terrain" },
  ],
  rh: [
    { id: "dossiers_personnel", label: "Dossiers du personnel" },
    { id: "politiques_rh", label: "Politiques RH" },
  ],
  institutionnel: [
    { id: "statuts", label: "Statuts & Agréments" },
    { id: "pv_ca", label: "PV Conseil d'Administration" },
    { id: "politiques", label: "Politiques internes" },
    { id: "agrements", label: "Agréments" },
  ],
  bailleurs: [
    { id: "conventions", label: "Conventions" },
    { id: "rapports_bailleurs", label: "Rapports bailleurs" },
    { id: "correspondances", label: "Correspondances" },
  ],
  communication: [
    { id: "supports", label: "Supports de communication" },
    { id: "photos_terrain", label: "Photos terrain" },
  ],
};

// ════════════════════════════════════════════════════════════════════════════
// DOCUMENTS
// ════════════════════════════════════════════════════════════════════════════

export async function getAllDocuments() {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function getDocumentsByProjet(projetId) {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("projet_id", projetId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function getDocumentsByRepertoire(repertoireId) {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("repertoire_id", repertoireId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function getDocumentById(id) {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function createDocument(payload) {
  const { data, error } = await supabase
    .from("documents")
    .insert(payload)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateDocument(id, payload) {
  const { data, error } = await supabase
    .from("documents")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function validerDocument(id) {
  return updateDocument(id, { statut: "VALIDE" });
}

export async function rejeterDocument(id, motif) {
  return updateDocument(id, { statut: "ARCHIVE", motif_rejet: motif });
}

export async function archiverDocument(id) {
  return updateDocument(id, { statut: "ARCHIVE" });
}

export async function deleteDocument(id) {
  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ════════════════════════════════════════════════════════════════════════════
// VERSIONS
// ════════════════════════════════════════════════════════════════════════════

export async function getVersionsByDocument(documentId) {
  const { data, error } = await supabase
    .from("versions_document")
    .select("*")
    .eq("document_id", documentId)
    .order("numero_version", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function createVersion(payload) {
  const { data, error } = await supabase
    .from("versions_document")
    .insert(payload)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// ════════════════════════════════════════════════════════════════════════════
// RÉPERTOIRES
// ════════════════════════════════════════════════════════════════════════════

export async function getAllRepertoires() {
  const { data, error } = await supabase
    .from("repertoires")
    .select("*")
    .order("nom", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function getRepertoireById(id) {
  const { data, error } = await supabase
    .from("repertoires")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function createRepertoire(payload) {
  const { data, error } = await supabase
    .from("repertoires")
    .insert(payload)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateRepertoire(id, payload) {
  const { data, error } = await supabase
    .from("repertoires")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// ════════════════════════════════════════════════════════════════════════════
// JOURNAL DE TÉLÉCHARGEMENTS
// ════════════════════════════════════════════════════════════════════════════

export async function getAccessLog(documentId) {
  const { data, error } = await supabase
    .from("journal_telechargements")
    .select("*")
    .eq("document_id", documentId)
    .order("date", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function logTelechargement(documentId, userId) {
  const { error } = await supabase.from("journal_telechargements").insert({
    document_id: documentId,
    utilisateur_id: userId,
    action: "TELECHARGEMENT",
    date: new Date().toISOString(),
  });

  if (error) throw new Error(error.message);
}

// ════════════════════════════════════════════════════════════════════════════
// SUPABASE STORAGE (fichiers binaires)
// ════════════════════════════════════════════════════════════════════════════

const BUCKET = "ged";

/**
 * Upload un fichier vers Supabase Storage.
 * @returns {{ path, publicUrl }}
 */
export async function uploadFile(file, path) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path || `documents/${Date.now()}_${file.name}`, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) throw new Error(error.message);

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(data.path);

  return { path: data.path, publicUrl };
}

/**
 * Télécharge un fichier depuis Supabase Storage.
 */
export async function downloadFile(path) {
  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (error) throw new Error(error.message);
  return data; // Blob
}

/**
 * Supprime un fichier du Storage.
 */
export async function deleteFile(path) {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw new Error(error.message);
}

/**
 * Génère une URL signée temporaire.
 */
export async function getSignedUrl(path, expiresIn = 3600) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresIn);

  if (error) throw new Error(error.message);
  return data.signedUrl;
}

// ════════════════════════════════════════════════════════════════════════════
// KPI GED (calculs côté client)
// ════════════════════════════════════════════════════════════════════════════

export function computeKpiGed(documents) {
  const total = documents.length;
  const enAttente = documents.filter(
    (d) => d.statut === "EN_VALIDATION",
  ).length;
  const valides = documents.filter((d) => d.statut === "VALIDE").length;
  const archives = documents.filter((d) => d.statut === "ARCHIVE").length;

  return { total, enAttente, valides, archives };
}
