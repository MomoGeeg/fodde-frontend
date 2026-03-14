import { gedApi } from "@/api/ged.api";
import {
  FORMATS_AUTORISES,
  FORMATS_LABEL,
  TAILLE_MAX_MB,
  TYPE_OPTIONS,
} from "@/services/gedService";
import useAuthStore from "@/stores/auth.store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, FileText, Loader2, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

/**
 * Modal de dépôt d'un document
 * Props:
 *  - open: boolean
 *  - onClose: () => void
 *  - repertoire: string (ex: "projets")
 *  - projetId: number (optionnel, pré-sélectionné)
 *  - nouvelleVersionDe: object (doc existant si on dépose une nouvelle version)
 */
export default function GEDDocumentForm({
  open,
  onClose,
  repertoire = "projets",
  projetId: projetIdDefaut,
  nouvelleVersionDe,
}) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  const { data: projetsGED = [] } = useQuery({
    queryKey: ["ged-projets"],
    queryFn: gedApi.getProjets,
  });

  const [form, setForm] = useState({
    titre: nouvelleVersionDe?.titre ?? "",
    type: nouvelleVersionDe?.type ?? "",
    projetId: projetIdDefaut ?? "",
    description: "",
    visibilite: "PRIVE",
    commentaire: "",
  });
  const [fichier, setFichier] = useState(null);
  const [erreurFichier, setErreurFichier] = useState("");
  const [doublon, setDoublon] = useState(null);
  const [choixDoublon, setChoixDoublon] = useState(null); // "version" | "nouveau"
  const [dragging, setDragging] = useState(false);

  // Reset à l'ouverture
  useEffect(() => {
    if (open) {
      setForm({
        titre: nouvelleVersionDe?.titre ?? "",
        type: nouvelleVersionDe?.type ?? "",
        projetId: projetIdDefaut ?? "",
        description: "",
        visibilite: "PRIVE",
        commentaire: "",
      });
      setFichier(null);
      setErreurFichier("");
      setDoublon(null);
      setChoixDoublon(null);
    }
  }, [open, nouvelleVersionDe, projetIdDefaut]);

  const { mutate: deposer, isPending } = useMutation({
    mutationFn: (data) => gedApi.deposerDocument(data),
    onSuccess: (result) => {
      if (result.doublon) {
        setDoublon(result.docExistant);
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["ged"] });
      const msg = result.estNouvelleVersion
        ? "Nouvelle version déposée avec succès"
        : result.statut === "VALIDE"
          ? "Document déposé et validé automatiquement"
          : result.statut === "EN_VALIDATION"
            ? "Document soumis à validation"
            : "Document déposé avec succès";
      toast.success(msg);
      onClose();
    },
    onError: (err) => toast.error(err.message ?? "Erreur lors du dépôt"),
  });

  function validerFichier(file) {
    if (!file) return false;
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!FORMATS_AUTORISES.includes(ext)) {
      setErreurFichier(
        `Format non autorisé. Formats acceptés : ${FORMATS_LABEL}`,
      );
      return false;
    }
    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > TAILLE_MAX_MB) {
      setErreurFichier(
        `Fichier trop volumineux (${sizeMb.toFixed(1)} Mo). Maximum : ${TAILLE_MAX_MB} Mo`,
      );
      return false;
    }
    setErreurFichier("");
    return true;
  }

  function handleFileChange(file) {
    if (validerFichier(file)) {
      setFichier(file);
      // Pré-remplir le titre si vide
      if (!form.titre && !nouvelleVersionDe) {
        const nomSanExt = file.name
          .replace(/\.[^.]+$/, "")
          .replace(/[-_]/g, " ");
        setForm((f) => ({ ...f, titre: nomSanExt }));
      }
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileChange(file);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!fichier && !nouvelleVersionDe) {
      setErreurFichier("Veuillez sélectionner un fichier");
      return;
    }
    if (erreurFichier) return;

    const projetSelectionne = projetsGED.find((p) => p.id === form.projetId);

    const data = {
      titre: form.titre,
      type: form.type,
      projetId: form.projetId || null,
      description: form.description,
      visibilite: form.visibilite,
      commentaire: form.commentaire,
      fichier: fichier?.name ?? "document.pdf",
      taille: fichier ? `${(fichier.size / (1024 * 1024)).toFixed(1)} MB` : "—",
      createdBy: user?.userId ?? user?.id ?? null,
      deposePar: user ? `${user.prenom} ${user.nom}` : "Utilisateur courant",
      roles: user?.roles ?? [],
      nouvelleVersionDeId:
        choixDoublon === "version"
          ? doublon?.id
          : (nouvelleVersionDe?.id ?? null),
    };
    deposer(data);
  }

  function handleChoixDoublon(choix) {
    setChoixDoublon(choix);
    setDoublon(null);
    if (choix === "version") {
      const projetSelectionne = projetsGED.find((p) => p.id === form.projetId);
      deposer({
        titre: form.titre,
        type: form.type,
        projetId: form.projetId || null,
        description: form.description,
        visibilite: form.visibilite,
        commentaire: form.commentaire,
        fichier: fichier?.name ?? "document.pdf",
        taille: fichier
          ? `${(fichier.size / (1024 * 1024)).toFixed(1)} MB`
          : "—",
        deposePar: user ? `${user.prenom} ${user.nom}` : "Utilisateur courant",
        nouvelleVersionDeId: doublon.id,
      });
    }
    // Si choix === "nouveau" : on continue avec le formulaire sans ID de doublon
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {nouvelleVersionDe
                ? "Déposer une nouvelle version"
                : "Déposer un document"}
            </h2>
            {nouvelleVersionDe && (
              <p className="text-xs text-gray-500 mt-0.5 truncate max-w-sm">
                {nouvelleVersionDe.titre} — Version actuelle : v
                {nouvelleVersionDe.version}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>

        {/* Alerte doublon */}
        {doublon && (
          <div className="mx-6 mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 shrink-0">
            <div className="flex items-start gap-3">
              <AlertTriangle
                size={16}
                className="text-amber-600 mt-0.5 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-amber-800">
                  Document existant détecté
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Un document portant ce titre existe déjà (v{doublon.version}).
                  Que souhaitez-vous faire ?
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleChoixDoublon("version")}
                    disabled={isPending}
                    className="flex-1 rounded-lg bg-amber-600 px-3 py-2 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-50"
                  >
                    {isPending ? (
                      <Loader2 size={12} className="animate-spin mx-auto" />
                    ) : (
                      "Créer version N+1"
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setDoublon(null);
                      setChoixDoublon("nouveau");
                    }}
                    className="flex-1 rounded-lg border border-amber-300 px-3 py-2 text-xs font-medium text-amber-700 hover:bg-amber-50"
                  >
                    Créer un nouveau document
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-6 py-4 space-y-4">
            {/* Zone upload */}
            {!nouvelleVersionDe && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Fichier *
                </label>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 cursor-pointer transition-colors ${dragging ? "border-primary bg-green-50" : fichier ? "border-green-400 bg-green-50" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"}`}
                >
                  {fichier ? (
                    <>
                      <FileText size={24} className="text-green-600" />
                      <p className="text-sm font-medium text-green-700">
                        {fichier.name}
                      </p>
                      <p className="text-xs text-green-600">
                        {(fichier.size / (1024 * 1024)).toFixed(1)} Mo
                      </p>
                    </>
                  ) : (
                    <>
                      <Upload size={24} className="text-gray-400" />
                      <p className="text-sm text-gray-500">
                        Glissez votre fichier ici ou{" "}
                        <span className="text-primary font-medium">
                          parcourir
                        </span>
                      </p>
                      <p className="text-xs text-gray-400">
                        PDF, DOCX, XLSX, JPG, PNG, ZIP — max {TAILLE_MAX_MB} Mo
                      </p>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.docx,.xlsx,.jpg,.jpeg,.png,.zip"
                  onChange={(e) => handleFileChange(e.target.files[0])}
                />
                {erreurFichier && (
                  <p className="mt-1.5 text-xs text-red-600">{erreurFichier}</p>
                )}
              </div>
            )}

            {/* Titre */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Titre *
              </label>
              <input
                required
                type="text"
                value={form.titre}
                onChange={(e) =>
                  setForm((f) => ({ ...f, titre: e.target.value }))
                }
                placeholder="Nom descriptif du document"
                disabled={!!nouvelleVersionDe}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>

            {/* Type + Visibilité sur la même ligne */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Type *
                </label>
                <select
                  required
                  value={form.type}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, type: e.target.value }))
                  }
                  disabled={!!nouvelleVersionDe}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none disabled:bg-gray-50"
                >
                  <option value="">Sélectionner...</option>
                  {TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Visibilité *
                </label>
                <select
                  required
                  value={form.visibilite}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, visibilite: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                >
                  <option value="PRIVE">Privé</option>
                  <option value="EQUIPE_PROJET">Équipe projet</option>
                  <option value="ORGANISATION">Organisation</option>
                  <option value="CONSEIL_ADMIN">
                    Conseil d'administration
                  </option>
                </select>
              </div>
            </div>

            {/* Projet associé */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Projet associé{repertoire === "projets" ? " *" : ""}
              </label>
              <select
                required={repertoire === "projets"}
                value={form.projetId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, projetId: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              >
                <option value="">Sélectionner un projet...</option>
                {projetsGED.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} — {p.titre}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Description
              </label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Résumé du contenu du document..."
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none resize-none"
              />
            </div>

            {/* Commentaire (pour nouvelle version) */}
            {nouvelleVersionDe && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Commentaire de version
                </label>
                <input
                  type="text"
                  value={form.commentaire}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, commentaire: e.target.value }))
                  }
                  placeholder="Ex : Corrections suite aux retours du SE..."
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>
            )}

            {/* Info validation */}
            {form.type && ["PHOTO", "AUTRE"].includes(form.type) && (
              <div className="rounded-lg bg-green-50 border border-green-100 px-3 py-2.5">
                <p className="text-xs text-green-700">
                  <span className="font-medium">Validation automatique</span> —
                  Ce type de document sera validé automatiquement au dépôt.
                </p>
              </div>
            )}
            {form.type &&
              [
                "RAPPORT",
                "CONTRAT",
                "JUSTIFICATIF",
                "POLITIQUE",
                "PV",
                "CONVENTION",
              ].includes(form.type) &&
              !(user?.roles ?? []).includes("ROLE_SE") && (
                <div className="rounded-lg bg-blue-50 border border-blue-100 px-3 py-2.5">
                  <p className="text-xs text-blue-700">
                    <span className="font-medium">Validation requise</span> — Ce
                    type de document devra être soumis à validation par le SE ou
                    le Responsable Programmes.
                  </p>
                </div>
              )}
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending || !!erreurFichier || !!doublon}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
          >
            {isPending && <Loader2 size={14} className="animate-spin" />}
            {nouvelleVersionDe ? "Déposer la version" : "Déposer le document"}
          </button>
        </div>
      </div>
    </div>
  );
}
