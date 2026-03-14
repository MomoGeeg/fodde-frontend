import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send,
  Archive,
  ExternalLink,
  Plus,
  History,
} from "lucide-react";
import { toast } from "sonner";
import {
  useDocument,
  useVersionsDocument,
  useSoumettreValidation,
  useValiderDocument,
  useRejeterDocument,
  useArchiverDocument,
  useAjouterVersion,
  STATUT_CONFIG,
  typeLabel,
} from "@/api/documents.api";
import useAuthStore from "@/stores/auth.store";

// ── Helpers ───────────────────────────────────────────────────────────────────

function StatutBadge({ statut }) {
  const cfg = STATUT_CONFIG[statut] ?? {
    label: statut,
    bg: "bg-gray-100",
    text: "text-gray-600",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.bg} ${cfg.text}`}
    >
      {cfg.label}
    </span>
  );
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatSize(bytes) {
  if (!bytes) return null;
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-xs text-gray-800 font-medium text-right max-w-[60%]">
        {value}
      </span>
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

export default function DocumentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [rejectMotif, setRejectMotif] = useState("");
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [showAddVersion, setShowAddVersion] = useState(false);
  const [newVersionUrl, setNewVersionUrl] = useState("");
  const [newVersionType, setNewVersionType] = useState("");

  const { data: doc, isLoading, error } = useDocument(id);
  const { data: versions = [] } = useVersionsDocument(id);

  const soumettre = useSoumettreValidation();
  const valider = useValiderDocument();
  const rejeter = useRejeterDocument();
  const archiver = useArchiverDocument();
  const ajouterVersion = useAjouterVersion(id);

  const userRoles = user?.roles ?? [];
  const isSE = userRoles.includes("ROLE_SE") || userRoles.includes("ROLE_ADMIN");
  const isCreator = doc?.createdBy === user?.id;

  // Actions disponibles selon statut + rôle
  const canSoumettre =
    doc?.requiresValidation &&
    isCreator &&
    (doc?.statut === "BROUILLON" || doc?.statut === "REJETE");
  const canValiderRejeter = isSE && doc?.statut === "EN_VALIDATION";
  const canArchiver =
    isSE && doc?.statut !== "ARCHIVE";

  const handleSoumettre = async () => {
    try {
      await soumettre.mutateAsync(id);
      toast.success("Document soumis pour validation");
    } catch (err) {
      toast.error(err?.response?.data?.erreur ?? "Erreur lors de la soumission");
    }
  };

  const handleValider = async () => {
    try {
      await valider.mutateAsync(id);
      toast.success("Document validé");
    } catch (err) {
      toast.error(err?.response?.data?.erreur ?? "Erreur lors de la validation");
    }
  };

  const handleRejeter = async () => {
    if (!rejectMotif.trim()) return toast.error("Le motif de rejet est obligatoire");
    try {
      await rejeter.mutateAsync({ id, motif: rejectMotif });
      toast.success("Document rejeté");
      setShowRejectBox(false);
      setRejectMotif("");
    } catch (err) {
      toast.error(err?.response?.data?.erreur ?? "Erreur lors du rejet");
    }
  };

  const handleArchiver = async () => {
    if (!confirm("Archiver ce document ? Cette action est irréversible.")) return;
    try {
      await archiver.mutateAsync(id);
      toast.success("Document archivé");
      navigate(-1);
    } catch (err) {
      toast.error(err?.response?.data?.erreur ?? "Erreur lors de l'archivage");
    }
  };

  const handleAjouterVersion = async () => {
    if (!newVersionUrl.trim()) return toast.error("L'URL est obligatoire");
    try {
      await ajouterVersion.mutateAsync({
        url: newVersionUrl.trim(),
        typeFichier: newVersionType || null,
      });
      toast.success("Nouvelle version ajoutée");
      setShowAddVersion(false);
      setNewVersionUrl("");
      setNewVersionType("");
    } catch (err) {
      toast.error(err?.response?.data?.erreur ?? "Erreur lors de l'ajout");
    }
  };

  // ── États de chargement / erreur ──────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        Chargement du document…
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
        Document introuvable ou accès refusé.
        <button onClick={() => navigate(-1)} className="ml-2 underline">
          Retour
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-4xl">
      {/* ── Navigation ── */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft size={16} />
        Retour
      </button>

      {/* ── Alerte : Rejeté ── */}
      {doc.statut === "REJETE" && doc.motifRejet && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 flex gap-3">
          <XCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700">Document rejeté</p>
            <p className="text-sm text-red-600 mt-0.5">{doc.motifRejet}</p>
            {canSoumettre && (
              <p className="text-xs text-red-500 mt-1">
                Vous pouvez corriger et resoumettre ce document.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Alerte : En validation ── */}
      {doc.statut === "EN_VALIDATION" && (
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-3 flex gap-3">
          <Clock size={18} className="text-yellow-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-yellow-700">
              En attente de validation
            </p>
            <p className="text-xs text-yellow-600 mt-0.5">
              Ce document est en cours d'examen par le Secrétaire Exécutif.
            </p>
          </div>
        </div>
      )}

      {/* ── Alerte : Validé ── */}
      {doc.statut === "VALIDE" && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 flex gap-3">
          <CheckCircle size={18} className="text-green-500 shrink-0 mt-0.5" />
          <p className="text-sm text-green-700">
            Document validé le {formatDate(doc.dateValidation)}
          </p>
        </div>
      )}

      {/* ── En-tête ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <FileText size={22} className="text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{doc.titre}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <span className="text-xs text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">
                  {typeLabel(doc.typeDocument)}
                </span>
                <StatutBadge statut={doc.statut} />
                <span className="text-xs text-gray-400">v{doc.versionActuelle ?? 1}</span>
                {doc.requiresValidation && (
                  <span className="text-xs text-blue-600 bg-blue-50 rounded-full px-2 py-0.5">
                    Validation requise
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 shrink-0">
            {canSoumettre && (
              <button
                onClick={handleSoumettre}
                disabled={soumettre.isPending}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-60"
              >
                <Send size={13} />
                {doc.statut === "REJETE" ? "Re-soumettre" : "Soumettre"}
              </button>
            )}

            {canValiderRejeter && !showRejectBox && (
              <>
                <button
                  onClick={handleValider}
                  disabled={valider.isPending}
                  className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-xs font-medium text-white hover:bg-green-700 transition-colors disabled:opacity-60"
                >
                  <CheckCircle size={13} />
                  Valider
                </button>
                <button
                  onClick={() => setShowRejectBox(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-700 transition-colors"
                >
                  <XCircle size={13} />
                  Rejeter
                </button>
              </>
            )}

            {canArchiver && (
              <button
                onClick={handleArchiver}
                disabled={archiver.isPending}
                className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-60"
              >
                <Archive size={13} />
                Archiver
              </button>
            )}
          </div>
        </div>

        {/* Zone de rejet ── */}
        {showRejectBox && (
          <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-xs font-semibold text-red-700 mb-2">
              Motif de rejet
            </p>
            <textarea
              value={rejectMotif}
              onChange={(e) => setRejectMotif(e.target.value)}
              rows={3}
              placeholder="Expliquez la raison du rejet…"
              className="w-full rounded-lg border border-red-200 px-3 py-2 text-sm focus:border-red-400 focus:outline-none resize-none"
            />
            <div className="flex gap-2 mt-2 justify-end">
              <button
                onClick={() => { setShowRejectBox(false); setRejectMotif(""); }}
                className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5"
              >
                Annuler
              </button>
              <button
                onClick={handleRejeter}
                disabled={rejeter.isPending}
                className="rounded-lg bg-red-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
              >
                Confirmer le rejet
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Grille info + versions ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Informations */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Informations
          </h3>

          {doc.description && (
            <p className="text-sm text-gray-600 mb-3 pb-3 border-b border-gray-100">
              {doc.description}
            </p>
          )}

          <div>
            <InfoRow label="Déposé par" value={doc.createdByNom} />
            <InfoRow label="Déposé le"  value={formatDate(doc.createdAt)} />
            <InfoRow label="Validé le"  value={formatDate(doc.dateValidation)} />
            {doc.requiresValidation === false && (
              <InfoRow label="Validation" value="Non requise pour ce type" />
            )}
          </div>
        </div>

        {/* Versions */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <History size={15} />
              Versions ({versions.length})
            </h3>
            {doc.statut !== "EN_VALIDATION" && doc.statut !== "ARCHIVE" && (
              <button
                onClick={() => setShowAddVersion(!showAddVersion)}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Plus size={13} />
                Nouvelle version
              </button>
            )}
          </div>

          {/* Formulaire nouvelle version */}
          {showAddVersion && (
            <div className="mb-3 rounded-lg bg-gray-50 border border-gray-200 p-3 space-y-2">
              <input
                type="text"
                value={newVersionUrl}
                onChange={(e) => setNewVersionUrl(e.target.value)}
                placeholder="URL du fichier *"
                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs focus:border-primary focus:outline-none"
              />
              <div className="flex gap-2">
                <select
                  value={newVersionType}
                  onChange={(e) => setNewVersionType(e.target.value)}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs focus:border-primary focus:outline-none"
                >
                  <option value="">Type fichier</option>
                  {["PDF", "DOCX", "XLSX", "JPG", "PNG", "ZIP"].map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
                <button
                  onClick={handleAjouterVersion}
                  disabled={ajouterVersion.isPending}
                  className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary/90 disabled:opacity-60"
                >
                  Ajouter
                </button>
              </div>
            </div>
          )}

          {versions.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">
              Aucune version déposée
            </p>
          ) : (
            <div className="space-y-2">
              {versions.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-primary bg-primary/10 rounded px-1.5 py-0.5">
                      v{v.version}
                    </span>
                    <div>
                      <p className="text-xs text-gray-700">
                        {v.typeFichier ?? "Fichier"}
                        {v.taille ? ` · ${formatSize(v.taille)}` : ""}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {formatDate(v.uploadeLe)}
                      </p>
                    </div>
                  </div>
                  <a
                    href={v.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-primary hover:text-primary/70 transition-colors"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Accès (rôles) ── */}
      {isSE && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Contrôle d'accès
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-2">Lecture</p>
              <div className="flex flex-wrap gap-1">
                {(doc.rolesLecture ?? []).map((r) => (
                  <span
                    key={r}
                    className="text-[11px] bg-blue-50 text-blue-700 rounded-full px-2 py-0.5"
                  >
                    {r.replace("ROLE_", "")}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-2">Écriture</p>
              <div className="flex flex-wrap gap-1">
                {(doc.rolesEcriture ?? []).map((r) => (
                  <span
                    key={r}
                    className="text-[11px] bg-green-50 text-green-700 rounded-full px-2 py-0.5"
                  >
                    {r.replace("ROLE_", "")}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
