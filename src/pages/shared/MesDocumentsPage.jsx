import api from "@/api/axios";
import useAuthStore from "@/stores/auth.store";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileArchive,
  FileText,
  Loader2,
  Search,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

// ── Badge statut ────────────────────────────────────────────
const STATUT_CONFIG = {
  VALIDE:        { label: "Validé",        color: "bg-green-100 text-green-700" },
  EN_VALIDATION: { label: "En validation", color: "bg-amber-100 text-amber-700" },
  BROUILLON:     { label: "Brouillon",     color: "bg-gray-100 text-gray-600"   },
  ARCHIVE:       { label: "Archivé",       color: "bg-blue-100 text-blue-600"   },
  REJETE:        { label: "Rejeté",        color: "bg-red-100 text-red-600"     },
};

const TYPE_LABELS = {
  RAPPORT:      "Rapport",
  CONTRAT:      "Contrat",
  JUSTIFICATIF: "Justificatif",
  POLITIQUE:    "Politique",
  PV:           "PV",
  CONVENTION:   "Convention",
  PHOTO:        "Photo",
  AUTRE:        "Autre",
};

function StatutBadge({ statut }) {
  const cfg = STATUT_CONFIG[statut] ?? { label: statut, color: "bg-gray-100 text-gray-600" };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cfg.color}`}>
      {statut === "VALIDE"        && <CheckCircle2 size={11} />}
      {statut === "EN_VALIDATION" && <Clock size={11} />}
      {statut === "REJETE"        && <XCircle size={11} />}
      {cfg.label}
    </span>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

export default function MesDocumentsPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [search, setSearch]       = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  // ── Documents via Spring Boot (ACL respectées côté serveur) ────────────────
  const { data: docs = [], isLoading } = useQuery({
    queryKey: ["mes-documents", user?.id],
    queryFn:  () => api.get("/api/documents").then((r) => r.data),
    staleTime: 30_000,
  });

  // ── Projets pour résoudre projetId → code ─────────────────────────────────
  const { data: projets = [] } = useQuery({
    queryKey: ["projets"],
    queryFn:  () => api.get("/api/projets").then((r) => r.data),
    staleTime: 60_000,
  });

  const projetMap = useMemo(() => {
    const m = {};
    for (const p of projets) m[p.id] = p;
    return m;
  }, [projets]);

  // ── Documents visibles (hors archives) ────────────────────────────────────
  const allDocs = useMemo(
    () => docs.filter((d) => d.statut !== "ARCHIVE"),
    [docs]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return allDocs.filter((d) => {
      const projet     = d.projetId ? projetMap[d.projetId] : null;
      const projetCode = projet?.code ?? "";
      const matchSearch =
        !q ||
        (d.titre ?? "").toLowerCase().includes(q) ||
        projetCode.toLowerCase().includes(q) ||
        (projet?.titre ?? "").toLowerCase().includes(q);
      const matchType = !typeFilter || d.typeDocument === typeFilter;
      return matchSearch && matchType;
    });
  }, [allDocs, search, typeFilter, projetMap]);

  const typesDisponibles = useMemo(
    () => [...new Set(allDocs.map((d) => d.typeDocument).filter(Boolean))].sort(),
    [allDocs]
  );

  return (
    <div className="space-y-6">
      {/* ── En-tête ────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <FileArchive size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Documents</h1>
            <p className="text-sm text-gray-500">
              {isLoading
                ? "Chargement..."
                : `${allDocs.length} document${allDocs.length !== 1 ? "s" : ""} accessible${allDocs.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
      </div>

      {/* ── Barre de filtres ────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par titre, projet..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none"
        >
          <option value="">Tous les types</option>
          {typesDisponibles.map((t) => (
            <option key={t} value={t}>{TYPE_LABELS[t] ?? t}</option>
          ))}
        </select>
      </div>

      {/* ── Contenu ─────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <Loader2 size={24} className="animate-spin mr-2" />
          Chargement des documents...
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileText size={40} className="text-gray-300 mb-3" />
          <p className="text-sm font-medium text-gray-500">
            {search || typeFilter
              ? "Aucun document ne correspond à vos filtres"
              : "Aucun document disponible"}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Document</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Projet</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Statut</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Date dépôt</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((doc) => {
                const projet = doc.projetId ? projetMap[doc.projetId] : null;
                return (
                  <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                    {/* Titre */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-gray-400 shrink-0" />
                        <div>
                          <p className="font-medium text-gray-800 truncate max-w-[220px]">
                            {doc.titre ?? "—"}
                          </p>
                          {doc.createdByNom && (
                            <p className="text-xs text-gray-400 mt-0.5">Par {doc.createdByNom}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="px-4 py-3 text-gray-600">
                      {TYPE_LABELS[doc.typeDocument] ?? doc.typeDocument ?? "—"}
                    </td>

                    {/* Projet */}
                    <td className="px-4 py-3">
                      {projet ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                          {projet.code}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>

                    {/* Statut */}
                    <td className="px-4 py-3">
                      <StatutBadge statut={doc.statut} />
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 text-gray-500">
                      {formatDate(doc.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/documents/${doc.id}`)}
                          title="Voir le document"
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          title="Télécharger"
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                        >
                          <Download size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
