import { gedApi } from "@/api/ged.api";
import { SOUS_REPERTOIRES } from "@/services/gedService";
import useAuthStore from "@/stores/auth.store";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  ChevronRight,
  Eye,
  FileArchive,
  FilePlus,
  Lock,
  Plus,
  Receipt,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import GEDDocumentForm from "./GEDDocumentForm";

const TYPE_LABELS = {
  RAPPORT: "Rapport",
  CONTRAT: "Contrat",
  JUSTIFICATIF: "Justificatif",
  PHOTO: "Photo",
  POLITIQUE: "Politique",
  PV: "PV",
  STATUTS: "Statuts",
  AUTRE: "Autre",
};

const STATUT_CLASSES = {
  BROUILLON: "bg-gray-100 text-gray-600",
  EN_VALIDATION: "bg-yellow-100 text-yellow-700",
  VALIDE: "bg-green-100 text-green-700",
  ARCHIVE: "bg-blue-100 text-blue-700",
};

const VISIBILITE_ICONS = {
  CONFIDENTIEL: <Lock size={12} className="text-red-400" />,
  RESTREINT: <Lock size={12} className="text-amber-400" />,
  PUBLIC: null,
};

function DocTable({ documents, isLoading, onView, onDeposerVersion }) {
  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("fr-FR") : "—");

  if (isLoading) {
    return (
      <div className="divide-y divide-gray-100">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5">
            <div className="h-8 w-8 animate-pulse rounded-lg bg-gray-200" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
              <div className="h-3 w-28 animate-pulse rounded bg-gray-200" />
            </div>
            <div className="h-6 w-16 animate-pulse rounded-full bg-gray-200" />
          </div>
        ))}
      </div>
    );
  }

  if (!documents || documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <FileArchive size={32} className="text-gray-200 mb-2" />
        <p className="text-sm text-gray-400">
          Aucun document dans ce sous-répertoire
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-100">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              Titre
            </th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              Type
            </th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              Ver.
            </th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              Déposé par
            </th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              Date
            </th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              Statut
            </th>
            <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {documents.map((doc) => (
            <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <FileArchive size={14} className="text-gray-400 shrink-0" />
                  <span className="text-sm font-medium text-gray-900 truncate max-w-xs">
                    {doc.titre}
                  </span>
                  {VISIBILITE_ICONS[doc.visibilite]}
                  {doc.lieDepense && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-orange-50 border border-orange-100 px-1.5 py-0.5 text-[10px] font-medium text-orange-700">
                      <Receipt size={9} /> {doc.lieDepense}
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3">
                <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                  {TYPE_LABELS[doc.type] ?? doc.type}
                </span>
              </td>
              <td className="px-4 py-3">
                {doc.version > 1 ? (
                  <span className="inline-flex rounded bg-indigo-100 px-1.5 py-0.5 text-xs font-bold text-indigo-700">
                    V{doc.version}
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">v1</span>
                )}
              </td>
              <td className="px-4 py-3 text-xs text-gray-600">
                {doc.deposePar}
              </td>
              <td className="px-4 py-3 text-xs text-gray-500">
                {fmtDate(doc.dateDepot)}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUT_CLASSES[doc.statut] ?? "bg-gray-100 text-gray-600"}`}
                >
                  {doc.statut === "EN_VALIDATION"
                    ? "En validation"
                    : doc.statut === "VALIDE"
                      ? "Validé"
                      : doc.statut === "BROUILLON"
                        ? "Brouillon"
                        : "Archivé"}
                </span>
                {doc.statut === "EN_VALIDATION" && (
                  <AlertTriangle
                    size={12}
                    className="inline ml-1 text-yellow-500"
                  />
                )}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => onView(doc.id)}
                    className="flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <Eye size={12} />
                    Détail
                  </button>
                  {doc.statut === "VALIDE" && (
                    <button
                      onClick={() => onDeposerVersion(doc)}
                      className="flex items-center gap-1 rounded-lg border border-blue-100 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      <FilePlus size={12} />
                      Nouvelle version
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function GEDProjetDossier() {
  const { projet_id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const projetId = Number(projet_id);

  const { data: projetsGED = [] } = useQuery({
    queryKey: ["ged-projets"],
    queryFn: gedApi.getProjets,
  });
  const projet = projetsGED.find((p) => p.id === projetId);
  const sousReps = SOUS_REPERTOIRES.projets;
  const [activeSousRep, setActiveSousRep] = useState(
    sousReps[0]?.id ?? "contrats",
  );
  const [openForm, setOpenForm] = useState(false);
  const [docPourNouvelleVersion, setDocPourNouvelleVersion] = useState(null);

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["ged", "projets", projetId, activeSousRep],
    queryFn: () =>
      gedApi.getDocumentsByRepertoire("projets", {
        sousRepertoire: activeSousRep,
        projetId,
      }),
  });

  const estCloture = projet && ["CLOTURE", "ARCHIVE"].includes(projet.statut);
  const canDepose = !estCloture;

  function handleOpenNouvelleVersion(doc) {
    setDocPourNouvelleVersion(doc);
    setOpenForm(true);
  }

  function handleCloseForm() {
    setOpenForm(false);
    setDocPourNouvelleVersion(null);
  }

  if (!projet) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-sm text-gray-400">Projet introuvable</p>
        <Link
          to="/documents/projets"
          className="mt-3 text-sm text-primary hover:underline"
        >
          Retour aux projets
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-gray-500">
        <button
          onClick={() => navigate("/documents")}
          className="hover:text-gray-700"
        >
          GED
        </button>
        <ChevronRight size={14} />
        <button
          onClick={() => navigate("/documents/projets")}
          className="hover:text-gray-700"
        >
          Projets
        </button>
        <ChevronRight size={14} />
        <span className="font-medium text-gray-900">{projet.titre}</span>
      </div>

      {/* Header projet */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/documents/projets")}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
          >
            <ArrowLeft size={15} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">
                {projet.titre}
              </h1>
              <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                {projet.code}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Bailleur : {projet.bailleur}
            </p>
          </div>
        </div>

        {canDepose && (
          <button
            onClick={() => {
              setDocPourNouvelleVersion(null);
              setOpenForm(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            <Plus size={15} />
            Déposer un document
          </button>
        )}
      </div>

      {/* Badge projet clôturé */}
      {estCloture && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
          <Lock size={14} className="text-red-500" />
          <p className="text-sm font-medium text-red-700">
            Projet clôturé — Dossier en lecture seule
          </p>
        </div>
      )}

      {/* Tabs sous-répertoires */}
      <div className="flex gap-1 border-b border-gray-200">
        {sousReps.map((sr) => {
          const count = documents.filter(
            (d) => d.sousRepertoire === sr.id,
          ).length;
          return (
            <button
              key={sr.id}
              onClick={() => setActiveSousRep(sr.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeSousRep === sr.id
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {sr.label}
              {count > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${activeSousRep === sr.id ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-500"}`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Table documents */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            {sousReps.find((s) => s.id === activeSousRep)?.label}
          </span>
          {canDepose && (
            <button
              onClick={() => {
                setDocPourNouvelleVersion(null);
                setOpenForm(true);
              }}
              className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80"
            >
              <Plus size={13} />
              Ajouter
            </button>
          )}
        </div>
        <DocTable
          documents={documents}
          isLoading={isLoading}
          onView={(id) => navigate(`/documents/${id}`)}
          onDeposerVersion={handleOpenNouvelleVersion}
        />
      </div>

      {/* Modal formulaire */}
      <GEDDocumentForm
        open={openForm}
        onClose={handleCloseForm}
        repertoire="projets"
        sousRepertoire={activeSousRep}
        projetId={projetId}
        nouvelleVersionDe={docPourNouvelleVersion}
      />
    </div>
  );
}
