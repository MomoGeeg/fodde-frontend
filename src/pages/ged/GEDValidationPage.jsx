import { gedApi } from "@/api/ged.api";
import useAuthStore from "@/stores/auth.store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Check,
  ClipboardCheck,
  Eye,
  FileArchive,
  Lock,
  Loader2,
  ShieldOff,
  X,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const ROLES_AUTORISES = ["ROLE_SE", "ROLE_ADMIN", "ROLE_RESPONSABLE_PROGRAMMES"];

const TYPE_LABELS = {
  RAPPORT: "Rapport", CONTRAT: "Contrat", JUSTIFICATIF: "Justificatif",
  PHOTO: "Photo", POLITIQUE: "Politique", PV: "PV", STATUTS: "Statuts", AUTRE: "Autre",
};

const REPERTOIRE_LABELS = {
  projets: "Projets", rh: "RH", institutionnel: "Institutionnel",
  bailleurs: "Bailleurs", communication: "Communication",
};

const VISIBILITE_CLASSES = {
  CONFIDENTIEL: "bg-red-100 text-red-700",
  RESTREINT: "bg-amber-100 text-amber-700",
  PUBLIC: "bg-green-100 text-green-700",
};

// Modal de rejet avec motif obligatoire
function ModalRejet({ doc, onConfirm, onCancel, isPending }) {
  const [motif, setMotif] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <X size={18} className="text-red-500" />
            <h2 className="text-base font-semibold text-gray-900">Rejeter le document</h2>
          </div>
          <button onClick={onCancel} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-4 space-y-4">
          <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-3">
            <p className="text-xs text-gray-500">Document concerné</p>
            <p className="text-sm font-medium text-gray-900 mt-0.5">{doc?.titre}</p>
            <p className="text-xs text-gray-500 mt-0.5">Déposé par : {doc?.deposePar}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Motif du rejet <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="Expliquez pourquoi ce document est rejeté et ce que le déposant doit corriger..."
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-red-400 focus:outline-none resize-none"
            />
            {motif.trim().length > 0 && motif.trim().length < 10 && (
              <p className="mt-1 text-xs text-red-500">Le motif doit faire au moins 10 caractères</p>
            )}
          </div>
          <div className="rounded-lg bg-amber-50 border border-amber-100 px-3 py-2.5">
            <p className="text-xs text-amber-700">
              <span className="font-medium">Information</span> — Le document repassera en statut "Brouillon" et le déposant sera notifié pour correction.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onCancel} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
            Annuler
          </button>
          <button
            onClick={() => motif.trim().length >= 10 && onConfirm(motif)}
            disabled={isPending || motif.trim().length < 10}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {isPending && <Loader2 size={14} className="animate-spin" />}
            Confirmer le rejet
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal de confirmation de validation
function ModalValidation({ doc, onConfirm, onCancel, isPending }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Check size={18} className="text-green-600" />
            <h2 className="text-base font-semibold text-gray-900">Valider le document</h2>
          </div>
          <button onClick={onCancel} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-4 space-y-4">
          <div className="rounded-xl bg-green-50 border border-green-100 px-4 py-3">
            <p className="text-xs text-gray-500">Document à valider</p>
            <p className="text-sm font-medium text-gray-900 mt-0.5">{doc?.titre}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {TYPE_LABELS[doc?.type]} · Déposé par {doc?.deposePar} le {doc?.dateDepot ? new Date(doc.dateDepot).toLocaleDateString("fr-FR") : "—"}
            </p>
          </div>
          <p className="text-sm text-gray-600">
            En validant ce document, vous confirmez qu'il est conforme et qu'il peut être archivé dans la GED.
          </p>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onCancel} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {isPending && <Loader2 size={14} className="animate-spin" />}
            <Check size={14} />
            Valider
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GEDValidationPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [docAValider, setDocAValider] = useState(null);
  const [docARejeté, setDocARejeter] = useState(null);

  const hasAccess = user?.roles?.some((r) => ROLES_AUTORISES.includes(r));

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["ged", "validation"],
    queryFn: gedApi.getDocumentsEnValidation,
    enabled: hasAccess,
    refetchInterval: 30_000,
  });

  const { mutate: valider, isPending: pendingValider } = useMutation({
    mutationFn: (id) => gedApi.validerDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ged"] });
      toast.success("Document validé et archivé avec succès");
      setDocAValider(null);
    },
    onError: () => toast.error("Erreur lors de la validation"),
  });

  const { mutate: rejeter, isPending: pendingRejet } = useMutation({
    mutationFn: ({ id, motif }) => gedApi.rejeterDocument(id, motif),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ged"] });
      toast.success("Document rejeté — le déposant a été notifié");
      setDocARejeter(null);
    },
    onError: () => toast.error("Erreur lors du rejet"),
  });

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR") : "—";

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50 py-16">
        <ShieldOff size={40} className="text-red-300 mb-3" />
        <p className="text-sm font-medium text-red-600">Accès non autorisé</p>
        <p className="text-xs text-red-400 mt-1">La file de validation est réservée au SE et au Responsable Programmes</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">File de validation</h1>
          <p className="mt-1 text-sm text-gray-500">
            {documents.length} document{documents.length !== 1 ? "s" : ""} en attente de validation
          </p>
        </div>
        {documents.length > 0 && (
          <span className="flex h-8 min-w-8 items-center justify-center rounded-full bg-yellow-500 px-2.5 text-sm font-bold text-white">
            {documents.length}
          </span>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-gray-100">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4">
                <div className="h-8 w-8 animate-pulse rounded-lg bg-gray-200" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 w-56 animate-pulse rounded bg-gray-200" />
                  <div className="h-3 w-32 animate-pulse rounded bg-gray-200" />
                </div>
                <div className="flex gap-2">
                  <div className="h-8 w-20 animate-pulse rounded-lg bg-gray-200" />
                  <div className="h-8 w-20 animate-pulse rounded-lg bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <ClipboardCheck size={40} className="text-green-300 mb-3" />
            <p className="text-sm font-medium text-gray-500">File de validation vide</p>
            <p className="text-xs text-gray-400 mt-1">Tous les documents ont été traités</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Titre</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Répertoire</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Déposé par</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Date soumission</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Visibilité</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-50 shrink-0">
                          <AlertTriangle size={15} className="text-yellow-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{doc.titre}</p>
                          {doc.projetCode && (
                            <p className="text-xs text-gray-500">{doc.projetCode}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                        {TYPE_LABELS[doc.type] ?? doc.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                        {REPERTOIRE_LABELS[doc.repertoire] ?? doc.repertoire}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{doc.deposePar}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{fmtDate(doc.dateDepot)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${VISIBILITE_CLASSES[doc.visibilite] ?? "bg-gray-100 text-gray-600"}`}>
                        {doc.visibilite === "CONFIDENTIEL" && <Lock size={9} />}
                        {doc.visibilite === "CONFIDENTIEL" ? "Confidentiel" : doc.visibilite === "RESTREINT" ? "Restreint" : "Public"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/documents/${doc.id}`)}
                          className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          <Eye size={12} />
                          Voir
                        </button>
                        <button
                          onClick={() => setDocAValider(doc)}
                          className="flex items-center gap-1 rounded-lg border border-green-200 bg-green-50 px-2.5 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 transition-colors"
                        >
                          <Check size={12} />
                          Valider
                        </button>
                        <button
                          onClick={() => setDocARejeter(doc)}
                          className="flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors"
                        >
                          <X size={12} />
                          Rejeter
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {docAValider && (
        <ModalValidation
          doc={docAValider}
          onConfirm={() => valider(docAValider.id)}
          onCancel={() => setDocAValider(null)}
          isPending={pendingValider}
        />
      )}
      {docARejeté && (
        <ModalRejet
          doc={docARejeté}
          onConfirm={(motif) => rejeter({ id: docARejeté.id, motif })}
          onCancel={() => setDocARejeter(null)}
          isPending={pendingRejet}
        />
      )}
    </div>
  );
}
