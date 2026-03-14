import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardCheck,
  CheckCircle,
  XCircle,
  ChevronRight,
  FileText,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import {
  useDocumentsEnValidation,
  useValiderDocument,
  useRejeterDocument,
  typeLabel,
} from "@/api/documents.api";

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR");
}

export default function DocumentValidationPage() {
  const navigate = useNavigate();
  const { data: documents = [], isLoading, refetch } = useDocumentsEnValidation();
  const valider = useValiderDocument();
  const rejeter = useRejeterDocument();

  // État local : motif de rejet par document
  const [rejectState, setRejectState] = useState({}); // { [docId]: { open, motif } }

  const openReject = (id) =>
    setRejectState((s) => ({ ...s, [id]: { open: true, motif: "" } }));

  const setMotif = (id, motif) =>
    setRejectState((s) => ({ ...s, [id]: { ...s[id], motif } }));

  const cancelReject = (id) =>
    setRejectState((s) => ({ ...s, [id]: { open: false, motif: "" } }));

  const handleValider = async (id) => {
    try {
      await valider.mutateAsync(id);
      toast.success("Document validé");
    } catch (err) {
      toast.error(err?.response?.data?.erreur ?? "Erreur lors de la validation");
    }
  };

  const handleRejeter = async (id) => {
    const motif = rejectState[id]?.motif ?? "";
    if (!motif.trim()) return toast.error("Le motif est obligatoire");
    try {
      await rejeter.mutateAsync({ id, motif });
      toast.success("Document rejeté");
      cancelReject(id);
    } catch (err) {
      toast.error(err?.response?.data?.erreur ?? "Erreur lors du rejet");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        Chargement de la file de validation…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── En-tête ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <ClipboardCheck size={20} className="text-yellow-500" />
            File de validation
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {documents.length} document{documents.length !== 1 ? "s" : ""} en
            attente de validation
          </p>
        </div>
      </div>

      {/* ── Liste ── */}
      {documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <CheckCircle size={40} className="mb-3 text-green-300" />
          <p className="text-sm font-medium text-gray-500">
            Aucun document en attente
          </p>
          <p className="text-xs mt-1">Tous les documents ont été traités.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => {
            const rs = rejectState[doc.id] ?? { open: false, motif: "" };
            return (
              <div
                key={doc.id}
                className="bg-white rounded-xl border border-yellow-200 shadow-sm"
              >
                {/* Ligne principale */}
                <div className="flex items-center gap-4 px-5 py-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-yellow-50">
                    <FileText size={18} className="text-yellow-600" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {doc.titre}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">
                        {typeLabel(doc.typeDocument)}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-yellow-600">
                        <Clock size={11} />
                        Soumis le {formatDate(doc.createdAt)}
                      </span>
                    </div>
                    {doc.description && (
                      <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                        {doc.description}
                      </p>
                    )}
                  </div>

                  {/* Actions rapides */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => navigate(`/documents/${doc.id}`)}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg px-2.5 py-1.5 transition-colors"
                    >
                      Détail
                      <ChevronRight size={13} />
                    </button>

                    {!rs.open && (
                      <>
                        <button
                          onClick={() => handleValider(doc.id)}
                          disabled={valider.isPending}
                          className="flex items-center gap-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-60"
                        >
                          <CheckCircle size={13} />
                          Valider
                        </button>
                        <button
                          onClick={() => openReject(doc.id)}
                          className="flex items-center gap-1 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg px-3 py-1.5 transition-colors"
                        >
                          <XCircle size={13} />
                          Rejeter
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Zone de rejet inline */}
                {rs.open && (
                  <div className="px-5 pb-4 border-t border-yellow-100">
                    <p className="text-xs font-medium text-red-700 mt-3 mb-2">
                      Motif de rejet
                    </p>
                    <textarea
                      value={rs.motif}
                      onChange={(e) => setMotif(doc.id, e.target.value)}
                      rows={2}
                      placeholder="Expliquez la raison du rejet…"
                      className="w-full rounded-lg border border-red-200 px-3 py-2 text-sm focus:border-red-400 focus:outline-none resize-none"
                    />
                    <div className="flex gap-2 mt-2 justify-end">
                      <button
                        onClick={() => cancelReject(doc.id)}
                        className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={() => handleRejeter(doc.id)}
                        disabled={rejeter.isPending}
                        className="rounded-lg bg-red-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
                      >
                        Confirmer le rejet
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
