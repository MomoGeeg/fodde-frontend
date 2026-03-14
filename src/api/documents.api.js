import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/axios";

// ── Constantes UI ──────────────────────────────────────────────────────────────

export const TYPE_OPTIONS = [
  // Financier / RAF
  { value: "JUSTIFICATIF",       label: "Justificatif",         categorie: "Financier" },
  { value: "FACTURE",            label: "Facture",              categorie: "Financier" },
  { value: "RAPPORT_FINANCIER",  label: "Rapport financier",    categorie: "Financier" },
  { value: "CONTRAT_PRESTATAIRE",label: "Contrat prestataire",  categorie: "Financier" },
  { value: "ACQUISITION",        label: "Acquisition",          categorie: "Financier" },
  // RH
  { value: "CONTRAT_EMPLOI",     label: "Contrat d'emploi",     categorie: "RH" },
  { value: "BULLETIN_SALAIRE",   label: "Bulletin de salaire",  categorie: "RH" },
  { value: "EVALUATION_RH",      label: "Évaluation RH",        categorie: "RH" },
  // Programmes
  { value: "RAPPORT_ACTIVITE",   label: "Rapport d'activité",   categorie: "Programmes" },
  { value: "RAPPORT_MISSION",    label: "Rapport de mission",   categorie: "Programmes" },
  { value: "PLAN_TRAVAIL",       label: "Plan de travail",      categorie: "Programmes" },
  // S&E
  { value: "RAPPORT_SUIVI",      label: "Rapport de suivi",     categorie: "S&E" },
  { value: "RAPPORT_EVALUATION", label: "Rapport d'évaluation", categorie: "S&E" },
  { value: "PLAN_SE",            label: "Plan S&E",             categorie: "S&E" },
  { value: "DONNEES_COLLECTE",   label: "Données de collecte",  categorie: "S&E" },
  { value: "PHOTO_TERRAIN",      label: "Photo terrain",        categorie: "S&E" },
  // Direction
  { value: "CONVENTION_BAILLEUR",label: "Convention bailleur",  categorie: "Direction" },
  { value: "INSTITUTIONNEL",     label: "Institutionnel",       categorie: "Direction" },
  { value: "PV_REUNION",         label: "PV de réunion",        categorie: "Direction" },
  // Autre
  { value: "AUTRE",              label: "Autre",                categorie: "Autre" },
];

export const STATUT_CONFIG = {
  BROUILLON:     { label: "Brouillon",       bg: "bg-gray-100",   text: "text-gray-600"  },
  EN_VALIDATION: { label: "En validation",   bg: "bg-yellow-100", text: "text-yellow-700"},
  VALIDE:        { label: "Validé",          bg: "bg-green-100",  text: "text-green-700" },
  REJETE:        { label: "Rejeté",          bg: "bg-red-100",    text: "text-red-700"   },
  ARCHIVE:       { label: "Archivé",         bg: "bg-slate-100",  text: "text-slate-500" },
};

export function typeLabel(value) {
  return TYPE_OPTIONS.find((t) => t.value === value)?.label ?? value;
}

// ── Query keys ─────────────────────────────────────────────────────────────────

const KEYS = {
  all:        () => ["documents"],
  list:       (p) => ["documents", "list", p ?? {}],
  detail:     (id) => ["documents", id],
  versions:   (id) => ["documents", id, "versions"],
  validation: () => ["documents", "en-validation"],
};

// ── Queries ────────────────────────────────────────────────────────────────────

export function useDocuments(params = {}) {
  return useQuery({
    queryKey: KEYS.list(params),
    queryFn: () => api.get("/api/documents", { params }).then((r) => r.data),
  });
}

export function useDocument(id) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => api.get(`/api/documents/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useDocumentsEnValidation() {
  return useQuery({
    queryKey: KEYS.validation(),
    queryFn: () => api.get("/api/documents/en-validation").then((r) => r.data),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}

export function useVersionsDocument(documentId) {
  return useQuery({
    queryKey: KEYS.versions(documentId),
    queryFn: () =>
      api.get(`/api/documents/${documentId}/versions`).then((r) => r.data),
    enabled: !!documentId,
  });
}

// ── Mutations ──────────────────────────────────────────────────────────────────

export function useCreerDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post("/api/documents", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all() }),
  });
}

export function useSoumettreValidation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) =>
      api.patch(`/api/documents/${id}/soumettre`).then((r) => r.data),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: KEYS.all() });
      qc.invalidateQueries({ queryKey: KEYS.detail(id) });
    },
  });
}

export function useValiderDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) =>
      api.patch(`/api/documents/${id}/valider`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all() });
      qc.invalidateQueries({ queryKey: KEYS.validation() });
    },
  });
}

export function useRejeterDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, motif }) =>
      api.patch(`/api/documents/${id}/rejeter`, { motif }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all() });
      qc.invalidateQueries({ queryKey: KEYS.validation() });
    },
  });
}

export function useArchiverDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) =>
      api.patch(`/api/documents/${id}/archiver`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all() }),
  });
}

export function useAjouterVersion(documentId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      api
        .post(`/api/documents/${documentId}/versions`, data)
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.versions(documentId) });
      qc.invalidateQueries({ queryKey: KEYS.detail(documentId) });
    },
  });
}
