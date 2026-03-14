import { projetsApi } from "@/api/projets.api";
import useAuthStore from "@/stores/auth.store";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FolderKanban,
  Plus,
  Search,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const STATUT_COLORS = {
  BROUILLON: "bg-gray-100 text-gray-600",
  EN_VALIDATION: "bg-yellow-100 text-yellow-700",
  ACTIF: "bg-green-100 text-green-700",
  SUSPENDU: "bg-orange-100 text-orange-700",
  EN_CLOTURE: "bg-blue-100 text-blue-700",
  CLOTURE: "bg-purple-100 text-purple-700",
  ARCHIVE: "bg-gray-100 text-gray-400",
};

const STATUT_LABELS = {
  BROUILLON: "Brouillon",
  EN_VALIDATION: "En validation",
  ACTIF: "Actif",
  SUSPENDU: "Suspendu",
  EN_CLOTURE: "En clôture",
  CLOTURE: "Clôturé",
  ARCHIVE: "Archivé",
};

const FILTRES = [
  "TOUS",
  "BROUILLON",
  "EN_VALIDATION",
  "ACTIF",
  "SUSPENDU",
  "EN_CLOTURE",
  "CLOTURE",
];

function StatusBadge({ statut }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUT_COLORS[statut] ?? "bg-gray-100 text-gray-600"}`}
    >
      {STATUT_LABELS[statut] ?? statut}
    </span>
  );
}

function isProjetJ30(projet) {
  if (projet.statut !== "ACTIF") return false;
  const fin = new Date(projet.dateFin);
  const today = new Date();
  const diffDays = Math.ceil((fin - today) / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= 30;
}

function formatBudget(montant, devise) {
  if (montant == null) return "—";
  return new Intl.NumberFormat("fr-SN").format(montant) + " " + (devise ?? "");
}

function AdminKpiView({ projets, isLoading }) {
  const total = projets.length;
  const actifs = projets.filter((p) => p.statut === "ACTIF").length;
  const enValidation = projets.filter(
    (p) => p.statut === "EN_VALIDATION",
  ).length;
  const budgetTotal = projets.reduce(
    (acc, p) => acc + (parseFloat(p.budgetTotal) || 0),
    0,
  );

  const kpis = [
    {
      label: "Total projets",
      value: total,
      icon: FolderKanban,
      color: "bg-primary/10 text-primary",
    },
    {
      label: "Projets actifs",
      value: actifs,
      icon: CheckCircle2,
      color: "bg-success/10 text-success",
    },
    {
      label: "En validation",
      value: enValidation,
      icon: Clock,
      color: "bg-warning/10 text-warning",
    },
    {
      label: "Budget total",
      value: new Intl.NumberFormat("fr-SN").format(budgetTotal) + " F",
      icon: Wallet,
      color: "bg-info/10 text-info",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Projets & Programmes
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Vue d'ensemble — {total} projet{total !== 1 ? "s" : ""} au total
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-lg ${color}`}
            >
              <Icon size={22} />
            </div>
            <div>
              <p className="text-sm text-gray-600">{label}</p>
              {isLoading ? (
                <div className="mt-1 h-7 w-20 animate-pulse rounded bg-gray-200" />
              ) : (
                <p className="text-xl font-bold text-gray-900">{value}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {!isLoading && projets.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
          <h2 className="mb-4 text-sm font-semibold text-gray-700">
            Répartition par statut
          </h2>
          <div className="flex flex-wrap gap-3">
            {Object.entries(STATUT_LABELS).map(([key, label]) => {
              const count = projets.filter((p) => p.statut === key).length;
              if (count === 0) return null;
              return (
                <div
                  key={key}
                  className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-4 py-2"
                >
                  <StatusBadge statut={key} />
                  <span className="text-sm font-semibold text-gray-700">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProjetsList() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const isAdmin = user?.roles?.includes("ROLE_ADMIN");
  const canCreate = [
    "ROLE_RESPONSABLE_PROGRAMMES",
    "ROLE_ADMIN",
  ].some((r) => user?.roles?.includes(r));

  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState("TOUS");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["projets"],
    queryFn: projetsApi.getAll,
  });
  const projets = data ?? [];

  if (isAdmin) {
    return <AdminKpiView projets={projets} isLoading={isLoading} />;
  }

  const projetsFiltered = projets.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch =
      !search ||
      p.code?.toLowerCase().includes(q) ||
      p.titre?.toLowerCase().includes(q);
    const matchStatut = filterStatut === "TOUS" || p.statut === filterStatut;
    return matchSearch && matchStatut;
  });

  const j30Projets = projets.filter(isProjetJ30);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Projets & Programmes
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {projets.length} projet{projets.length !== 1 ? "s" : ""} au total
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => navigate("nouveau")}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white transition-colors"
            style={{ background: "linear-gradient(135deg, #5A9C3A, #4A7C2F)" }}
          >
            <Plus size={16} />
            Nouveau projet
          </button>
        )}
      </div>

      {/* Alerte J-30 */}
      {j30Projets.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 px-5 py-4">
          <AlertTriangle
            size={18}
            className="mt-0.5 shrink-0 text-orange-500"
          />
          <div>
            <p className="text-sm font-semibold text-orange-800">
              {j30Projets.length} projet{j30Projets.length > 1 ? "s" : ""} à
              moins de 30 jours de leur échéance
            </p>
            <p className="mt-0.5 text-xs text-orange-600">
              {j30Projets.map((p) => p.code).join(", ")}
            </p>
          </div>
        </div>
      )}

      {/* Recherche + filtres */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-2.5 text-gray-400"
          />
          <input
            type="text"
            placeholder="Rechercher par code, titre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm text-gray-700 shadow-sm focus:border-green-500 focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTRES.map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatut(s)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filterStatut === s
                  ? "bg-primary text-white"
                  : "border border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              }`}
            >
              {s === "TOUS" ? "Tous" : STATUT_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Tableau */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="divide-y divide-gray-100">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4">
                <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
                <div className="ml-auto h-6 w-20 animate-pulse rounded-full bg-gray-200" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="px-6 py-12 text-center text-sm text-red-500">
            Erreur lors du chargement des projets.
          </div>
        ) : projetsFiltered.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <FolderKanban className="mx-auto mb-3 text-gray-300" size={40} />
            <p className="text-sm text-gray-400">
              {search || filterStatut !== "TOUS"
                ? "Aucun projet correspond aux filtres."
                : "Aucun projet trouvé."}
            </p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Titre
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Zone
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Période
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Budget
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Statut
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {projetsFiltered.map((projet) => (
                <tr
                  key={projet.id}
                  onClick={() => navigate(String(projet.id))}
                  className="cursor-pointer transition-colors hover:bg-gray-50"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-gray-700">
                        {projet.code}
                      </span>
                      {isProjetJ30(projet) && (
                        <AlertTriangle
                          size={13}
                          className="text-orange-500"
                          title="Échéance dans moins de 30 jours"
                        />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900">
                      {projet.titre}
                    </p>
                    {projet.objectifGeneral && (
                      <p className="max-w-xs truncate text-xs text-gray-400">
                        {projet.objectifGeneral}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {projet.zoneGeographique ?? "—"}
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500">
                    {projet.dateDebut} → {projet.dateFin}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-700">
                    {formatBudget(projet.budgetTotal, projet.devise)}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge statut={projet.statut} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
