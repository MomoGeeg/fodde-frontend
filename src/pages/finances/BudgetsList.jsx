import useAuthStore from "@/stores/auth.store";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Search,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  createFinanceHelpers,
  useDepenses,
  useLignesBudgetaires,
  useProjetsFinances,
} from "./finances-data";

const fmtMontant = (n, devise = "XOF") =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: devise,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

function ProgressBar({ taux }) {
  const color =
    taux > 90 ? "bg-red-500" : taux > 70 ? "bg-orange-500" : "bg-green-500";
  const bgColor =
    taux > 90 ? "bg-red-100" : taux > 70 ? "bg-orange-100" : "bg-green-100";
  return (
    <div className={`h-2.5 w-full rounded-full ${bgColor}`}>
      <div
        className={`h-full rounded-full ${color} transition-all`}
        style={{ width: `${Math.min(taux, 100)}%` }}
      />
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// PAGE — Vue consolidée des budgets
// ════════════════════════════════════════════════════════════
export default function BudgetsList() {
  const { user } = useAuthStore();
  const [filterProjet, setFilterProjet] = useState("TOUS");
  const [search, setSearch] = useState("");

  // Données React Query
  const { data: allProjets = [] } = useProjetsFinances();
  const { data: allLignes = [] } = useLignesBudgetaires();
  const { data: allDepenses = [] } = useDepenses();
  const helpers = useMemo(
    () => createFinanceHelpers(allProjets, allLignes, allDepenses),
    [allProjets, allLignes, allDepenses],
  );

  const isComptable = user?.roles?.includes("ROLE_COMPTABLE");
  const isRP = user?.roles?.includes("ROLE_RESPONSABLE_PROGRAMMES");

  // Projets visibles selon rôle
  // - RP → uniquement ses propres projets
  // - Comptable → projets EN_COURS
  // - Autres → tous
  const projetsBase = useMemo(() => {
    if (isRP) return allProjets.filter((p) => p.responsableId === user?.userId);
    if (isComptable) return allProjets.filter((p) => p.statut === "EN_COURS");
    return allProjets;
  }, [allProjets, isComptable, isRP, user?.userId]);

  // Alertes >80% pour le RP
  const alertesBudget = useMemo(() => {
    if (!isRP) return [];
    return projetsBase
      .map((p) => {
        const s = helpers.getBudgetStatsForProjet(p.id);
        return { ...p, taux: s.taux, stats: s };
      })
      .filter((p) => p.taux >= 80)
      .sort((a, b) => b.taux - a.taux);
  }, [helpers, isRP, projetsBase]);

  const projets = useMemo(() => {
    let list = [...projetsBase];
    if (filterProjet !== "TOUS")
      list = list.filter((p) => p.id === filterProjet);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.code.toLowerCase().includes(q) || p.titre.toLowerCase().includes(q),
      );
    }
    return list;
  }, [projetsBase, filterProjet, search]);

  // KPIs globaux
  const totals = useMemo(() => {
    return projets.reduce(
      (acc, p) => {
        const s = helpers.getBudgetStatsForProjet(p.id);
        acc.prevu += s.prevu;
        acc.engage += s.engage;
        acc.depense += s.depense;
        acc.solde += s.solde;
        return acc;
      },
      { prevu: 0, engage: 0, depense: 0, solde: 0 },
    );
  }, [helpers, projets]);

  const tauxGlobal =
    totals.prevu > 0 ? Math.round((totals.depense / totals.prevu) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Suivi budgétaire</h1>
        <p className="mt-1 text-sm text-gray-500">
          {projets.length} projet{projets.length !== 1 ? "s" : ""}
          {isRP && " — lecture seule"}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <KPICard
          label="Budget prévu"
          value={fmtMontant(totals.prevu)}
          icon={Wallet}
        />
        <KPICard
          label="Engagé"
          value={fmtMontant(totals.engage)}
          className="border-blue-200 bg-blue-50"
        />
        <KPICard
          label="Dépensé"
          value={fmtMontant(totals.depense)}
          className="border-orange-200 bg-orange-50"
        />
        <KPICard
          label="Solde disponible"
          value={fmtMontant(totals.solde)}
          className={
            totals.solde < 0
              ? "border-red-200 bg-red-50"
              : "border-green-200 bg-green-50"
          }
        />
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            Taux global
          </p>
          <p
            className={`mt-1 text-lg font-bold ${tauxGlobal > 90 ? "text-red-600" : tauxGlobal > 70 ? "text-orange-600" : "text-green-600"}`}
          >
            {tauxGlobal}%
          </p>
          <ProgressBar taux={tauxGlobal} />
        </div>
      </div>

      {/* 🔔 Alertes budget >80% (RP uniquement) */}
      {isRP && alertesBudget.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-red-600" />
            <h3 className="text-sm font-bold text-red-800">
              Alertes budgétaires — {alertesBudget.length} projet
              {alertesBudget.length > 1 ? "s" : ""} au-dessus de 80 %
            </h3>
          </div>
          <div className="space-y-2">
            {alertesBudget.map((p) => (
              <Link
                key={p.id}
                to={`/finances/budgets/${p.id}`}
                className="flex items-center justify-between rounded-lg bg-white px-4 py-2.5 border border-red-100 hover:border-red-300 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white ${
                      p.taux > 90 ? "bg-red-500" : "bg-orange-500"
                    }`}
                  >
                    {p.taux}%
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {p.titre}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {p.code} — Budget : {fmtMontant(p.stats.prevu, p.devise)}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs font-bold ${
                    p.taux > 90 ? "text-red-600" : "text-orange-600"
                  }`}
                >
                  {p.taux > 90 ? "🔴 Critique" : "🟠 Attention"}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-2.5 text-gray-400"
          />
          <input
            type="text"
            placeholder="Rechercher un projet..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm text-gray-700 shadow-sm focus:border-green-500 focus:outline-none"
          />
        </div>
        <select
          value={filterProjet}
          onChange={(e) => setFilterProjet(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600 focus:border-green-500 focus:outline-none"
        >
          <option value="TOUS">Tous les projets</option>
          {projetsBase.map((p) => (
            <option key={p.id} value={p.id}>
              {p.code}
            </option>
          ))}
        </select>
      </div>

      {/* Cartes projets */}
      {projets.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
          <BarChart3 className="mx-auto mb-3 text-gray-300" size={40} />
          <p className="text-sm text-gray-400">Aucun projet trouvé.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projets.map((p) => {
            const stats = helpers.getBudgetStatsForProjet(p.id);
            const taux = stats.taux;
            const statutColor =
              p.statut === "EN_COURS"
                ? "bg-green-100 text-green-700"
                : p.statut === "SUSPENDU"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-gray-100 text-gray-500";

            return (
              <div
                key={p.id}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs font-mono font-medium text-gray-400">
                      {p.code}
                    </p>
                    <h3 className="mt-0.5 text-sm font-semibold text-gray-900 leading-snug">
                      {p.titre}
                    </h3>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${statutColor}`}
                  >
                    {p.statut.replace("_", " ")}
                  </span>
                </div>

                {/* Chiffres */}
                <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                  <div>
                    <p className="text-gray-400">Budget total</p>
                    <p className="font-semibold text-gray-900">
                      {fmtMontant(stats.prevu, p.devise)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Engagé</p>
                    <p className="font-semibold text-blue-700">
                      {fmtMontant(stats.engage, p.devise)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Dépensé</p>
                    <p className="font-semibold text-orange-700">
                      {fmtMontant(stats.depense, p.devise)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Solde</p>
                    <p
                      className={`font-semibold ${stats.solde < 0 ? "text-red-600" : "text-green-600"}`}
                    >
                      {fmtMontant(stats.solde, p.devise)}
                    </p>
                  </div>
                </div>

                {/* Barre progression */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-400">Consommation</span>
                    <span
                      className={`font-bold ${taux > 90 ? "text-red-600" : taux > 70 ? "text-orange-600" : "text-green-600"}`}
                    >
                      {taux}%
                    </span>
                  </div>
                  <ProgressBar taux={taux} />
                </div>

                {/* Bouton détail */}
                <Link
                  to={`/finances/budgets/${p.id}`}
                  className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <TrendingUp size={13} />
                  Voir le détail
                  <ArrowRight size={13} />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function KPICard({
  label,
  value,
  icon: Icon,
  className = "border-gray-200 bg-white",
}) {
  return (
    <div className={`rounded-xl border px-4 py-3 shadow-sm ${className}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
        {label}
      </p>
      <p className="mt-1 text-lg font-bold text-gray-900">{value}</p>
    </div>
  );
}
