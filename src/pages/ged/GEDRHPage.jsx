import { gedApi } from "@/api/ged.api";
import { SOUS_REPERTOIRES } from "@/services/gedService";
import useAuthStore from "@/stores/auth.store";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Eye,
  FileArchive,
  FilePlus,
  Lock,
  Plus,
  ShieldOff,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import GEDDocumentForm from "./GEDDocumentForm";

const ROLES_AUTORISES = ["ROLE_RH", "ROLE_SE", "ROLE_ADMIN"];

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

const VISIBILITE = {
  CONFIDENTIEL: (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-red-600">
      <Lock size={9} />
      Confidentiel
    </span>
  ),
  RESTREINT: (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-amber-600">
      <Lock size={9} />
      Restreint
    </span>
  ),
  PUBLIC: <span className="text-[10px] text-gray-400">Public</span>,
};

export default function GEDRHPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const sousReps = SOUS_REPERTOIRES.rh;
  const [activeSousRep, setActiveSousRep] = useState(
    sousReps[0]?.id ?? "dossiers_personnel",
  );
  const [openForm, setOpenForm] = useState(false);
  const [docPourVersion, setDocPourVersion] = useState(null);

  const hasAccess = user?.roles?.some((r) => ROLES_AUTORISES.includes(r));

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["ged", "rh", activeSousRep],
    queryFn: () =>
      gedApi.getDocumentsByRepertoire("rh", { sousRepertoire: activeSousRep }),
    enabled: hasAccess,
  });

  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("fr-FR") : "—");

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50 py-16">
        <ShieldOff size={40} className="text-red-300 mb-3" />
        <p className="text-sm font-medium text-red-600">Accès non autorisé</p>
        <p className="text-xs text-red-400 mt-1">
          Ce répertoire est réservé aux rôles RH et SE
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Ressources Humaines
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Dossiers du personnel et politiques RH — Accès RH et SE uniquement
          </p>
        </div>
        <button
          onClick={() => {
            setDocPourVersion(null);
            setOpenForm(true);
          }}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
        >
          <Plus size={15} />
          Déposer un document
        </button>
      </div>

      {/* Bandeau confidentiel */}
      <div className="flex items-center gap-2 rounded-xl bg-purple-50 border border-purple-100 px-4 py-3">
        <Lock size={14} className="text-purple-500" />
        <p className="text-xs text-purple-700">
          <span className="font-medium">Zone confidentielle</span> — Les
          documents RH ne sont accessibles qu'aux rôles autorisés
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {sousReps.map((sr) => (
          <button
            key={sr.id}
            onClick={() => setActiveSousRep(sr.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeSousRep === sr.id
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {sr.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            {sousReps.find((s) => s.id === activeSousRep)?.label}
          </span>
          <button
            onClick={() => {
              setDocPourVersion(null);
              setOpenForm(true);
            }}
            className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80"
          >
            <Plus size={13} />
            Ajouter
          </button>
        </div>
        {isLoading ? (
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
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <FileArchive size={32} className="text-gray-200 mb-2" />
            <p className="text-sm text-gray-400">
              Aucun document dans ce sous-répertoire
            </p>
          </div>
        ) : (
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
                    Visibilité
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Version
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
                  <tr
                    key={doc.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileArchive
                          size={14}
                          className="text-gray-400 shrink-0"
                        />
                        <span className="text-sm font-medium text-gray-900 truncate max-w-xs">
                          {doc.titre}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                        {TYPE_LABELS[doc.type] ?? doc.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">{VISIBILITE[doc.visibilite]}</td>
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
                          onClick={() => navigate(`/documents/${doc.id}`)}
                          className="flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
                        >
                          <Eye size={12} /> Détail
                        </button>
                        {doc.statut === "VALIDE" && (
                          <button
                            onClick={() => {
                              setDocPourVersion(doc);
                              setOpenForm(true);
                            }}
                            className="flex items-center gap-1 rounded-lg border border-blue-100 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50"
                          >
                            <FilePlus size={12} /> Version
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <GEDDocumentForm
        open={openForm}
        onClose={() => {
          setOpenForm(false);
          setDocPourVersion(null);
        }}
        repertoire="rh"
        sousRepertoire={activeSousRep}
        nouvelleVersionDe={docPourVersion}
      />
    </div>
  );
}
