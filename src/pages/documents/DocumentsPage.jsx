import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Plus,
  Search,
  Filter,
  ChevronRight,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  FolderOpen,
} from "lucide-react";
import { useDocuments, TYPE_OPTIONS, STATUT_CONFIG, typeLabel } from "@/api/documents.api";
import useAuthStore from "@/stores/auth.store";
import DocumentUploadModal from "./DocumentUploadModal";

// ── Helpers ───────────────────────────────────────────────────────────────────

function StatutBadge({ statut }) {
  const cfg = STATUT_CONFIG[statut] ?? { label: statut, bg: "bg-gray-100", text: "text-gray-600" };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
}

function StatutIcon({ statut }) {
  switch (statut) {
    case "VALIDE":        return <CheckCircle size={14} className="text-green-500" />;
    case "EN_VALIDATION": return <Clock size={14} className="text-yellow-500" />;
    case "REJETE":        return <XCircle size={14} className="text-red-500" />;
    default:              return <AlertCircle size={14} className="text-gray-400" />;
  }
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR");
}

function formatSize(bytes) {
  if (!bytes) return null;
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

// ── Composant principal ───────────────────────────────────────────────────────

export default function DocumentsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatut, setFilterStatut] = useState("");
  const [showUpload, setShowUpload] = useState(false);

  const { data: documents = [], isLoading, error, refetch } = useDocuments();

  // Filtrage client-side
  const filtered = useMemo(() => {
    return documents.filter((doc) => {
      const matchSearch =
        !search ||
        doc.titre?.toLowerCase().includes(search.toLowerCase()) ||
        typeLabel(doc.typeDocument)?.toLowerCase().includes(search.toLowerCase());
      const matchType = !filterType || doc.typeDocument === filterType;
      const matchStatut = !filterStatut || doc.statut === filterStatut;
      return matchSearch && matchType && matchStatut;
    });
  }, [documents, search, filterType, filterStatut]);

  // Compteurs pour les onglets-statuts
  const counts = useMemo(() => {
    const c = { total: documents.length };
    Object.keys(STATUT_CONFIG).forEach((s) => {
      c[s] = documents.filter((d) => d.statut === s).length;
    });
    return c;
  }, [documents]);

  const handleClearFilters = () => {
    setSearch("");
    setFilterType("");
    setFilterStatut("");
  };

  const hasFilters = search || filterType || filterStatut;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        Chargement des documents…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
        Erreur de chargement des documents.{" "}
        <button onClick={refetch} className="underline">
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── En-tête ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Tous les documents
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {counts.total} document{counts.total !== 1 ? "s" : ""} accessibles
          </p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
        >
          <Plus size={16} />
          Déposer un document
        </button>
      </div>

      {/* ── Filtres ── */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Recherche */}
        <div className="relative flex-1 min-w-48">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par titre ou type…"
            className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Filtre type */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">Tous les types</option>
          {TYPE_OPTIONS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        {/* Filtre statut */}
        <select
          value={filterStatut}
          onChange={(e) => setFilterStatut(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">Tous les statuts</option>
          {Object.entries(STATUT_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>

        {hasFilters && (
          <button
            onClick={handleClearFilters}
            className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
          >
            <Filter size={13} />
            Réinitialiser
          </button>
        )}
      </div>

      {/* ── Compteurs rapides ── */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { statut: "BROUILLON",     icon: AlertCircle, color: "text-gray-500" },
          { statut: "EN_VALIDATION", icon: Clock,        color: "text-yellow-500" },
          { statut: "VALIDE",        icon: CheckCircle,  color: "text-green-500" },
          { statut: "REJETE",        icon: XCircle,      color: "text-red-500" },
        ].map(({ statut, icon: Icon, color }) => {
          const cfg = STATUT_CONFIG[statut];
          const isActive = filterStatut === statut;
          return (
            <button
              key={statut}
              onClick={() =>
                setFilterStatut(isActive ? "" : statut)
              }
              className={`flex items-center justify-between rounded-lg border px-4 py-3 text-left transition-all ${
                isActive
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div>
                <p className="text-xl font-bold text-gray-900">
                  {counts[statut] ?? 0}
                </p>
                <p className="text-xs text-gray-500">{cfg.label}</p>
              </div>
              <Icon size={20} className={color} />
            </button>
          );
        })}
      </div>

      {/* ── Liste des documents ── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <FolderOpen size={40} className="mb-3 opacity-40" />
          <p className="text-sm font-medium">Aucun document trouvé</p>
          {hasFilters && (
            <button
              onClick={handleClearFilters}
              className="mt-2 text-xs text-primary hover:underline"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Document
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Version
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((doc) => (
                <tr
                  key={doc.id}
                  onClick={() => navigate(String(doc.id))}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  {/* Titre */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <FileText size={15} className="text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 line-clamp-1">
                          {doc.titre}
                        </p>
                        {doc.motifRejet && (
                          <p className="text-[11px] text-red-500 mt-0.5 line-clamp-1">
                            Rejeté : {doc.motifRejet}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Type */}
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-600 bg-gray-100 rounded-full px-2 py-0.5">
                      {typeLabel(doc.typeDocument)}
                    </span>
                  </td>

                  {/* Statut */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <StatutIcon statut={doc.statut} />
                      <StatutBadge statut={doc.statut} />
                    </div>
                  </td>

                  {/* Version */}
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    v{doc.versionActuelle ?? 1}
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {formatDate(doc.createdAt)}
                  </td>

                  {/* Arrow */}
                  <td className="px-4 py-3 text-gray-400">
                    <ChevronRight size={16} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modal upload ── */}
      {showUpload && (
        <DocumentUploadModal
          onClose={() => setShowUpload(false)}
          onSuccess={refetch}
        />
      )}
    </div>
  );
}
