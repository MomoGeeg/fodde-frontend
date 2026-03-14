import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, ExternalLink, Download, Plus } from "lucide-react";
import { useDocuments, typeLabel, STATUT_CONFIG } from "@/api/documents.api";
import DocumentUploadModal from "@/pages/documents/DocumentUploadModal";

// ── Helpers ───────────────────────────────────────────────────────────────────

function StatutBadge({ statut }) {
  const cfg = STATUT_CONFIG[statut] ?? { label: statut, bg: "bg-gray-100", text: "text-gray-600" };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR");
}

// Types de rapport planifiés (futurs exports)
const EXPORTS_FUTURES = [
  {
    label: "Rapport d'exécution budgétaire",
    description: "Synthèse des dépenses vs. budget par projet et par ligne budgétaire.",
    format: "PDF / Excel",
  },
  {
    label: "Rapport bailleur",
    description: "Rapport consolidé des activités et dépenses par bailleur de fonds.",
    format: "PDF",
  },
  {
    label: "Grand livre comptable",
    description: "Journal de toutes les transactions financières sur la période.",
    format: "Excel",
  },
  {
    label: "Rapport de caisse antennes",
    description: "Mouvements de trésorerie par antenne régionale.",
    format: "PDF / Excel",
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SecretariatRapports() {
  const navigate = useNavigate();
  const [showUpload, setShowUpload] = useState(false);
  const { data: documents = [], isLoading, refetch } = useDocuments();

  const docsRecents = documents.slice(0, 10);

  return (
    <div className="space-y-8">

      {/* ── Exports à venir ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700">
            Exports &amp; rapports consolidés
          </h3>
          <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-medium text-orange-700">
            Prochainement
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {EXPORTS_FUTURES.map((e) => (
            <div
              key={e.label}
              className="flex items-start gap-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 opacity-60"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-200">
                <Download size={16} className="text-gray-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">{e.label}</p>
                <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                  {e.description}
                </p>
                <span className="mt-1.5 inline-block rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-mono text-gray-500">
                  {e.format}
                </span>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-3 text-xs text-gray-400">
          Les exports seront disponibles dans la prochaine version. Utilisez la barre latérale pour naviguer vers chaque module.
        </p>
      </div>

      {/* ── Documents récents ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700">
            Documents récents
          </h3>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 transition-colors"
            >
              <Plus size={13} />
              Déposer un document
            </button>
            <button
              onClick={() => navigate("/documents")}
              className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800"
            >
              Voir tout <ExternalLink size={12} />
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-gray-400">
              Chargement…
            </div>
          ) : docsRecents.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400">
              Aucun document trouvé.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-gray-50 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Document
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Statut
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {docsRecents.map((doc) => (
                  <tr
                    key={doc.id}
                    className="hover:bg-gray-50/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/secretariat/documents/${doc.id}`)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileText size={15} className="text-gray-400 shrink-0" />
                        <span className="font-medium text-gray-900 truncate max-w-[220px]">
                          {doc.titre}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                        {typeLabel(doc.typeDocument)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatutBadge statut={doc.statut} />
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-gray-400">
                      {formatDate(doc.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showUpload && (
        <DocumentUploadModal
          onClose={() => setShowUpload(false)}
          onSuccess={() => { refetch(); setShowUpload(false); }}
        />
      )}
    </div>
  );
}
