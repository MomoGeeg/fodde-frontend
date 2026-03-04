import { gedApi } from "@/api/ged.api";
import useAuthStore from "@/stores/auth.store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ChevronRight,
  Clock,
  Download,
  Eye,
  FileArchive,
  FileCheck,
  FilePlus,
  FileText,
  History,
  Image,
  Info,
  Loader2,
  Lock,
  Receipt,
  ShieldAlert,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import GEDDocumentForm from "./GEDDocumentForm";

const TYPE_LABELS = {
  RAPPORT: "Rapport", CONTRAT: "Contrat", JUSTIFICATIF: "Justificatif financier",
  PHOTO: "Photo / Média", POLITIQUE: "Politique interne", PV: "Procès-verbal",
  STATUTS: "Statuts", AUTRE: "Autre",
};

const STATUT_CLASSES = {
  BROUILLON: "bg-gray-100 text-gray-700",
  EN_VALIDATION: "bg-yellow-100 text-yellow-700",
  VALIDE: "bg-green-100 text-green-700",
  ARCHIVE: "bg-blue-100 text-blue-700",
};

const STATUT_LABELS = {
  BROUILLON: "Brouillon",
  EN_VALIDATION: "En validation",
  VALIDE: "Validé",
  ARCHIVE: "Archivé",
};

const VISIBILITE_CLASSES = {
  CONFIDENTIEL: "bg-red-100 text-red-700",
  RESTREINT: "bg-amber-100 text-amber-700",
  PUBLIC: "bg-green-100 text-green-700",
};

const REPERTOIRE_LABELS = {
  projets: "Projets", rh: "RH", institutionnel: "Institutionnel",
  bailleurs: "Bailleurs", communication: "Communication",
};

function getRepertoirePath(repertoire) {
  const paths = {
    projets: "/documents/projets",
    rh: "/documents/rh",
    institutionnel: "/documents/institutionnel",
    bailleurs: "/documents/bailleurs",
    communication: "/documents/communication",
  };
  return paths[repertoire] ?? "/documents";
}

// Modal archivage
function ModalArchivage({ onConfirm, onCancel, isPending }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl">
        <div className="px-6 py-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 mb-4">
            <FileArchive size={24} className="text-blue-600" />
          </div>
          <h2 className="text-base font-semibold text-gray-900">Archiver ce document ?</h2>
          <p className="mt-2 text-sm text-gray-500">
            Le document sera retiré de la vue courante mais conservé dans l'historique. La suppression physique est interdite.
          </p>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onCancel} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending && <Loader2 size={14} className="animate-spin" />}
            Archiver
          </button>
        </div>
      </div>
    </div>
  );
}

// Section prévisualisation
function PreviewSection({ doc }) {
  if (doc.format === "PDF") {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 overflow-hidden">
        <div className="border-b border-gray-200 bg-white px-4 py-3 flex items-center gap-2">
          <FileText size={16} className="text-red-500" />
          <span className="text-sm font-medium text-gray-700">Prévisualisation PDF</span>
        </div>
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="flex h-20 w-16 flex-col items-center justify-center rounded-xl border-2 border-red-200 bg-white shadow-sm mb-4">
            <FileText size={28} className="text-red-500" />
            <span className="text-[10px] font-bold text-red-500 mt-1">PDF</span>
          </div>
          <p className="text-sm font-medium text-gray-700 mb-1">{doc.fichier}</p>
          <p className="text-xs text-gray-400 mb-4">{doc.taille}</p>
          <button
            onClick={() => toast.info("Téléchargement simulé — PDF en cours...")}
            className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            <Download size={14} />
            Télécharger le PDF
          </button>
        </div>
      </div>
    );
  }

  if (["JPG", "JPEG", "PNG"].includes(doc.format)) {
    return (
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200 bg-white px-4 py-3 flex items-center gap-2">
          <Image size={16} className="text-blue-500" />
          <span className="text-sm font-medium text-gray-700">Aperçu image</span>
        </div>
        <div className="flex flex-col items-center justify-center bg-gray-100 py-16">
          <div className="flex h-32 w-48 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm">
            <Image size={48} className="text-gray-300" />
          </div>
          <p className="text-xs text-gray-400 mt-3">Aperçu non disponible en mode démo</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 overflow-hidden">
      <div className="border-b border-gray-200 bg-white px-4 py-3 flex items-center gap-2">
        <FileArchive size={16} className="text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Fichier</span>
      </div>
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="flex h-16 w-14 flex-col items-center justify-center rounded-xl border-2 border-gray-200 bg-white shadow-sm mb-3">
          <FileArchive size={24} className="text-gray-400" />
          <span className="text-[10px] font-bold text-gray-400 mt-1">{doc.format}</span>
        </div>
        <p className="text-sm text-gray-500 mb-1">{doc.fichier}</p>
        <p className="text-xs text-gray-400 mb-4">{doc.taille}</p>
        <button
          onClick={() => toast.info("Téléchargement simulé...")}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
        >
          <Download size={14} />
          Télécharger
        </button>
      </div>
    </div>
  );
}

export default function GEDDocumentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [openNouvelleVersion, setOpenNouvelleVersion] = useState(false);

  const isAdmin = user?.roles?.includes("ROLE_ADMIN");
  const isSE = user?.roles?.includes("ROLE_SE");
  const isRAF = user?.roles?.includes("ROLE_RAF");
  const isRH = user?.roles?.includes("ROLE_RH");
  const isRP = user?.roles?.includes("ROLE_RESPONSABLE_PROGRAMMES");
  const canValidate = isAdmin || isSE || isRP;
  const canSeeAudit = isAdmin || isSE;

  const { data: doc, isLoading, isError } = useQuery({
    queryKey: ["ged", "document", id],
    queryFn: () => gedApi.getDocument(id),
  });

  const { data: versions = [] } = useQuery({
    queryKey: ["ged", "versions", id],
    queryFn: () => gedApi.getVersions(id),
    enabled: !!doc,
  });

  const { data: accessLog = [] } = useQuery({
    queryKey: ["ged", "access-log", id],
    queryFn: () => gedApi.getAccessLog(id),
    enabled: !!doc && canSeeAudit,
  });

  const { mutate: valider, isPending: pendingValider } = useMutation({
    mutationFn: () => gedApi.validerDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ged"] });
      toast.success("Document validé");
    },
    onError: () => toast.error("Erreur lors de la validation"),
  });

  const { mutate: rejeter, isPending: pendingRejet } = useMutation({
    mutationFn: (motif) => gedApi.rejeterDocument(id, motif),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ged"] });
      toast.success("Document rejeté");
    },
    onError: () => toast.error("Erreur lors du rejet"),
  });

  const { mutate: archiver, isPending: pendingArchiver } = useMutation({
    mutationFn: () => gedApi.archiverDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ged"] });
      toast.success("Document archivé");
      setShowArchiveModal(false);
      navigate(doc ? getRepertoirePath(doc.repertoire) : "/documents");
    },
    onError: () => toast.error("Erreur lors de l'archivage"),
  });

  const { mutate: soumettre, isPending: pendingSoumettre } = useMutation({
    mutationFn: () => gedApi.soumettrePourValidation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ged"] });
      toast.success("Document soumis à validation");
    },
    onError: () => toast.error("Erreur lors de la soumission"),
  });

  const { mutate: logDL } = useMutation({
    mutationFn: () => gedApi.logTelechargement(id, user ? `${user.prenom} ${user.nom}` : "Utilisateur"),
    onSuccess: () => toast.info("Téléchargement enregistré dans le journal"),
  });

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR") : "—";
  const fmtDateTime = (d) => d ?? "—";

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="h-10 w-48 animate-pulse rounded-xl bg-gray-200" />
        <div className="h-32 animate-pulse rounded-2xl bg-gray-100" />
        <div className="h-64 animate-pulse rounded-2xl bg-gray-100" />
      </div>
    );
  }

  if (isError || !doc) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <FileArchive size={40} className="text-gray-300 mb-3" />
        <p className="text-sm text-gray-400">Document introuvable</p>
        <Link to="/documents" className="mt-3 text-sm text-primary hover:underline">Retour à la GED</Link>
      </div>
    );
  }

  const enValidation = doc.statut === "EN_VALIDATION";
  const estValide = doc.statut === "VALIDE";
  const estBrouillon = doc.statut === "BROUILLON";

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-gray-500">
        <button onClick={() => navigate("/documents")} className="hover:text-gray-700">GED</button>
        <ChevronRight size={14} />
        <button onClick={() => navigate(getRepertoirePath(doc.repertoire))} className="hover:text-gray-700">
          {REPERTOIRE_LABELS[doc.repertoire] ?? doc.repertoire}
        </button>
        {doc.projetCode && (
          <>
            <ChevronRight size={14} />
            <button onClick={() => navigate(`/documents/projets/${doc.projetId}`)} className="hover:text-gray-700">
              {doc.projetCode}
            </button>
          </>
        )}
        <ChevronRight size={14} />
        <span className="text-gray-900 font-medium truncate max-w-xs">{doc.titre}</span>
      </div>

      {/* Header */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50"
          >
            <ArrowLeft size={16} />
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {/* Statut */}
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUT_CLASSES[doc.statut] ?? "bg-gray-100 text-gray-600"}`}>
                {STATUT_LABELS[doc.statut]}
              </span>
              {/* Visibilité */}
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${VISIBILITE_CLASSES[doc.visibilite] ?? "bg-gray-100 text-gray-600"}`}>
                {doc.visibilite !== "PUBLIC" && <Lock size={10} />}
                {doc.visibilite === "CONFIDENTIEL" ? "Confidentiel" : doc.visibilite === "RESTREINT" ? "Restreint" : "Public"}
              </span>
              {/* Version */}
              {doc.version > 1 && (
                <span className="inline-flex rounded bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-700">
                  V{doc.version}
                </span>
              )}
              {/* Lié à dépense */}
              {doc.lieDepense && (
                <span className="inline-flex items-center gap-1 rounded-md bg-orange-50 border border-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                  <Receipt size={10} />
                  Lié à dépense N° {doc.lieDepense}
                </span>
              )}
            </div>

            <h1 className="text-xl font-bold text-gray-900 mb-1">{doc.titre}</h1>
            {doc.description && <p className="text-sm text-gray-500">{doc.description}</p>}
          </div>

          {/* Actions header */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Télécharger */}
            <button
              onClick={() => { logDL(); toast.success("Téléchargement démarré"); }}
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Download size={14} />
              Télécharger
            </button>

            {/* Nouvelle version — si validé */}
            {estValide && (
              <button
                onClick={() => setOpenNouvelleVersion(true)}
                className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
              >
                <FilePlus size={14} />
                Nouvelle version
              </button>
            )}

            {/* Archiver */}
            {(estValide || estBrouillon) && (
              <button
                onClick={() => setShowArchiveModal(true)}
                className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                <FileArchive size={14} />
                Archiver
              </button>
            )}
          </div>
        </div>

        {/* Bandeau En validation */}
        {enValidation && (
          <div className="mt-4 flex items-center justify-between rounded-xl bg-yellow-50 border border-yellow-200 px-4 py-3">
            <div className="flex items-center gap-2">
              <ShieldAlert size={16} className="text-yellow-600" />
              <p className="text-sm font-medium text-yellow-800">Ce document est en cours de validation</p>
              <p className="text-xs text-yellow-600">— Modification désactivée pendant la validation</p>
            </div>
            {canValidate && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => valider()}
                  disabled={pendingValider}
                  className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {pendingValider ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                  Valider
                </button>
                <button
                  onClick={() => { const m = prompt("Motif du rejet :"); if (m && m.length >= 5) rejeter(m); }}
                  disabled={pendingRejet}
                  className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {pendingRejet ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                  Rejeter
                </button>
              </div>
            )}
          </div>
        )}

        {/* Bandeau brouillon */}
        {estBrouillon && (
          <div className="mt-4 flex items-center justify-between rounded-xl bg-gray-50 border border-gray-200 px-4 py-3">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-gray-500" />
              <p className="text-sm text-gray-600">Document en brouillon — non encore soumis à validation</p>
            </div>
            <button
              onClick={() => soumettre()}
              disabled={pendingSoumettre}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary/90 disabled:opacity-50"
            >
              {pendingSoumettre && <Loader2 size={12} className="animate-spin" />}
              Soumettre à validation
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Colonne gauche — Prévisualisation + Métadonnées */}
        <div className="lg:col-span-2 space-y-5">
          {/* Prévisualisation */}
          <PreviewSection doc={doc} />

          {/* Métadonnées */}
          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
            <div className="border-b border-gray-100 px-5 py-4 flex items-center gap-2">
              <Info size={16} className="text-gray-500" />
              <h2 className="text-sm font-semibold text-gray-900">Métadonnées</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {[
                { label: "Titre", value: doc.titre },
                { label: "Type", value: TYPE_LABELS[doc.type] ?? doc.type },
                { label: "Répertoire", value: REPERTOIRE_LABELS[doc.repertoire] ?? doc.repertoire },
                { label: "Projet associé", value: doc.projetCode ? `${doc.projetCode} — ${doc.projetTitre}` : "—" },
                { label: "Déposé par", value: doc.deposePar },
                { label: "Date de dépôt", value: fmtDate(doc.dateDepot) },
                { label: "Version actuelle", value: `v${doc.version}` },
                { label: "Statut", value: STATUT_LABELS[doc.statut] },
                { label: "Validé par", value: doc.valideePar ?? "—" },
                { label: "Date de validation", value: fmtDate(doc.dateValidation) },
                { label: "Visibilité", value: doc.visibilite === "CONFIDENTIEL" ? "Confidentiel" : doc.visibilite === "RESTREINT" ? "Restreint" : "Public" },
                { label: "Format", value: doc.format },
                { label: "Taille", value: doc.taille },
                ...(doc.lieDepense ? [{ label: "Lié à la dépense", value: `N° ${doc.lieDepense}` }] : []),
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center px-5 py-3">
                  <span className="w-40 shrink-0 text-xs text-gray-500">{label}</span>
                  <span className="text-sm text-gray-800 font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Colonne droite — Versions + Journal */}
        <div className="space-y-5">
          {/* Historique des versions */}
          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
            <div className="border-b border-gray-100 px-5 py-4 flex items-center gap-2">
              <History size={16} className="text-gray-500" />
              <h2 className="text-sm font-semibold text-gray-900">Versions</h2>
              <span className="ml-auto text-xs text-gray-400">{versions.length} version{versions.length !== 1 ? "s" : ""}</span>
            </div>
            {versions.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-xs text-gray-400">Aucun historique disponible</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {versions.map((v) => (
                  <div
                    key={v.id}
                    className={`px-5 py-3.5 ${v.version === doc.version ? "bg-green-50" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {v.version === doc.version ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700 shrink-0">
                            <Star size={8} /> Actuelle
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600 shrink-0">
                            v{v.version}
                          </span>
                        )}
                        <span className="text-xs font-medium text-gray-700">v{v.version}</span>
                      </div>
                      <button
                        onClick={() => toast.info(`Téléchargement v${v.version} simulé`)}
                        className="flex items-center gap-0.5 text-[10px] text-gray-400 hover:text-primary transition-colors shrink-0"
                      >
                        <Download size={10} />
                        Télécharger
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">{v.commentaire}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Clock size={9} className="text-gray-400" />
                      <span className="text-[10px] text-gray-400">{fmtDate(v.dateDepot)} · {v.deposePar} · {v.taille}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Journal d'accès */}
          {canSeeAudit && (
            <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
              <div className="border-b border-gray-100 px-5 py-4 flex items-center gap-2">
                <Eye size={16} className="text-gray-500" />
                <h2 className="text-sm font-semibold text-gray-900">Journal d'accès</h2>
                <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">
                  <Lock size={8} />
                  Admin & SE
                </span>
              </div>
              {accessLog.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <p className="text-xs text-gray-400">Aucun accès enregistré</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {accessLog.map((log) => (
                    <div key={log.id} className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`flex h-6 w-6 items-center justify-center rounded-full ${log.action === "TELECHARGEMENT" ? "bg-blue-50" : "bg-gray-50"}`}>
                          {log.action === "TELECHARGEMENT" ? <Download size={11} className="text-blue-600" /> : <Eye size={11} className="text-gray-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-700">{log.nom}</p>
                          <p className="text-[10px] text-gray-400">{log.action} · {fmtDateTime(log.date)} · {log.ip}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal archivage */}
      {showArchiveModal && (
        <ModalArchivage
          onConfirm={() => archiver()}
          onCancel={() => setShowArchiveModal(false)}
          isPending={pendingArchiver}
        />
      )}

      {/* Formulaire nouvelle version */}
      <GEDDocumentForm
        open={openNouvelleVersion}
        onClose={() => setOpenNouvelleVersion(false)}
        repertoire={doc.repertoire}
        sousRepertoire={doc.sousRepertoire}
        projetId={doc.projetId}
        nouvelleVersionDe={doc}
      />
    </div>
  );
}
