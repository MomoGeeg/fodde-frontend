import { useState, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, Upload, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/api/axios";
import { useCreerDocument, TYPE_OPTIONS } from "@/api/documents.api";

// ── Helpers ───────────────────────────────────────────────────────────────────

const TYPE_GROUPS = TYPE_OPTIONS.reduce((acc, t) => {
  if (!acc[t.categorie]) acc[t.categorie] = [];
  acc[t.categorie].push(t);
  return acc;
}, {});

const TYPES_RH = ["CONTRAT_EMPLOI", "BULLETIN_SALAIRE", "EVALUATION_RH"];

function detectTypeFichier(file) {
  const ext = file.name.split(".").pop()?.toUpperCase();
  const map = {
    PDF: "PDF", DOC: "DOCX", DOCX: "DOCX",
    XLS: "XLSX", XLSX: "XLSX",
    JPG: "JPG", JPEG: "JPG", PNG: "PNG",
    ZIP: "ZIP", RAR: "ZIP",
  };
  return map[ext] ?? "AUTRE";
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

// ── Composant ─────────────────────────────────────────────────────────────────

export default function DocumentUploadModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    titre: "",
    typeDocument: "",
    description: "",
    projetId: "",
    concerneEmployeId: "",
  });
  const [fichier, setFichier] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const creer = useCreerDocument();

  const { data: projets = [] } = useQuery({
    queryKey: ["projets"],
    queryFn: () => api.get("/api/projets").then((r) => r.data),
  });

  const { data: employes = [] } = useQuery({
    queryKey: ["employes"],
    queryFn: () => api.get("/api/employes").then((r) => r.data),
    enabled: TYPES_RH.includes(form.typeDocument),
  });

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleFile = useCallback(
    (file) => {
      if (!file) return;
      setFichier(file);
      // Auto-remplir le titre depuis le nom du fichier si le champ est vide
      if (!form.titre.trim()) {
        const name = file.name.replace(/\.[^.]+$/, "");
        setForm((f) => ({ ...f, titre: name }));
      }
    },
    [form.titre]
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleSubmit = async () => {
    if (!form.titre.trim()) return toast.error("Le titre est obligatoire");
    if (!form.typeDocument) return toast.error("Le type de document est obligatoire");
    if (!fichier) return toast.error("Veuillez sélectionner un fichier");

    try {
      // 1. Créer le document (métadonnées)
      const doc = await creer.mutateAsync({
        titre: form.titre.trim(),
        typeDocument: form.typeDocument,
        description: form.description.trim() || null,
        projetId: form.projetId || null,
        concerneEmployeId: form.concerneEmployeId || null,
      });

      // 2. Enregistrer la version avec les infos du fichier
      await api.post(`/api/documents/${doc.id}/versions`, {
        url: fichier.name,
        taille: fichier.size,
        typeFichier: detectTypeFichier(fichier),
      });

      toast.success("Document déposé avec succès");
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.erreur ?? "Erreur lors du dépôt");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-2">
            <Upload size={18} className="text-primary" />
            <h2 className="text-base font-semibold text-gray-900">
              Déposer un document
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* Zone de téléversement */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Fichier <span className="text-red-500">*</span>
            </label>

            {fichier ? (
              /* Fichier sélectionné */
              <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100">
                  <FileText size={18} className="text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {fichier.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {detectTypeFichier(fichier)} · {formatSize(fichier.size)}
                  </p>
                </div>
                <button
                  onClick={() => setFichier(null)}
                  className="shrink-0 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ) : (
              /* Zone drag-and-drop */
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`cursor-pointer rounded-lg border-2 border-dashed px-6 py-8 text-center transition-colors ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-gray-300 hover:border-primary hover:bg-gray-50"
                }`}
              >
                <Upload size={24} className="mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600">
                  Glissez-déposez votre fichier ici ou{" "}
                  <span className="text-primary font-medium">parcourir</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  PDF, DOCX, XLSX, JPG, PNG, ZIP
                </p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.zip"
              className="hidden"
              onChange={(e) => handleFile(e.target.files[0])}
            />
          </div>

          {/* Titre */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Titre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.titre}
              onChange={set("titre")}
              placeholder="Ex. : Rapport d'activité Q1 2026"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Type de document */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Type de document <span className="text-red-500">*</span>
            </label>
            <select
              value={form.typeDocument}
              onChange={set("typeDocument")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">-- Sélectionner --</option>
              {Object.entries(TYPE_GROUPS).map(([cat, types]) => (
                <optgroup key={cat} label={cat}>
                  {types.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={set("description")}
              rows={2}
              placeholder="Description courte (optionnel)"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          {/* Projet lié */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Projet lié
            </label>
            <select
              value={form.projetId}
              onChange={set("projetId")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">-- Aucun projet --</option>
              {projets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.titre}
                </option>
              ))}
            </select>
          </div>

          {/* Employé concerné (types RH uniquement) */}
          {TYPES_RH.includes(form.typeDocument) && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Employé concerné
              </label>
              <select
                value={form.concerneEmployeId}
                onChange={set("concerneEmployeId")}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">-- Sélectionner un employé --</option>
                {employes.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.prenom} {e.nom} — {e.poste ?? e.departement}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl shrink-0">
          <button
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={creer.isPending}
            className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {creer.isPending ? "Enregistrement…" : "Déposer le document"}
          </button>
        </div>
      </div>
    </div>
  );
}
