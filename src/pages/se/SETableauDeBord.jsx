import useAuthStore from "@/stores/auth.store";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bell,
  ChevronRight,
  ClipboardList,
  Clock,
  FileText,
  TrendingDown,
} from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  createSEHelpers,
  STATUT_COLORS,
  useCollectes,
  useFormulaires,
  useIndicateurs,
  useProjets,
  useReponsesEnAttente,
} from "./se-data";

function ProgressBar({ taux }) {
  const color =
    taux >= 75 ? "bg-green-500" : taux >= 50 ? "bg-orange-500" : "bg-red-500";
  const bg =
    taux >= 75 ? "bg-green-100" : taux >= 50 ? "bg-orange-100" : "bg-red-100";
  return (
    <div className={`h-2.5 w-full rounded-full ${bg}`}>
      <div
        className={`h-full rounded-full ${color} transition-all`}
        style={{ width: `${Math.min(taux, 100)}%` }}
      />
    </div>
  );
}

function KPICard({ label, value, icon: Icon, className = "", sublabel }) {
  return (
    <div
      className={`rounded-xl border px-4 py-3 shadow-sm ${className || "border-gray-200 bg-white"}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
          {label}
        </p>
        {Icon && <Icon size={14} className="text-gray-300" />}
      </div>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
      {sublabel && (
        <p className="mt-0.5 text-[11px] text-gray-400">{sublabel}</p>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// PAGE — Tableau de bord S&E
// ════════════════════════════════════════════════════════════
export default function SETableauDeBord() {
  const { user } = useAuthStore();

  const isResponsableSE = user?.roles?.includes("ROLE_RESPONSABLE_SE");
  const isRP = user?.roles?.includes("ROLE_RESPONSABLE_PROGRAMMES");
  const isCP = user?.roles?.includes("ROLE_CHARGE_PROGRAMME");

  // Données Supabase
  const { data: projets = [] } = useProjets();
  const { data: indicateurs = [] } = useIndicateurs();
  const { data: formulaires = [] } = useFormulaires();
  const { data: collectes = [] } = useCollectes();
  const { data: reponses = [] } = useReponsesEnAttente();

  const {
    getProjet,
    getTauxAtteinte,
    getTauxParProjet,
    countEnAttente,
    getIndicateursSousPerformance,
    getAlertesSE,
  } = createSEHelpers(
    projets,
    [],
    indicateurs,
    collectes,
    formulaires,
    reponses,
  );

  // KPIs
  const indicateursActifs = indicateurs.filter(
    (i) => i.statut === "ACTIF",
  ).length;
  const formulairesPublies = formulaires.filter(
    (f) => f.statut === "PUBLIE",
  ).length;
  const enAttente = countEnAttente();
  const sousPerformance = getIndicateursSousPerformance();
  const alertes = useMemo(
    () => getAlertesSE(),
    [indicateurs, collectes, reponses],
  );

  // Projets avec taux d'atteinte
  const projetsStats = useMemo(() => {
    let filtered = projets.filter((p) => p.statut !== "CLOTURE");
    if (isCP) {
      const membre = { projetsAffectes: ["p001", "p002", "p003"] }; // mock
      filtered = filtered.filter((p) => membre.projetsAffectes?.includes(p.id));
    }
    return filtered.map((p) => {
      const stats = getTauxParProjet(p.id);
      return { ...p, ...stats };
    });
  }, [isCP, projets, indicateurs, collectes]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Tableau de bord S&E
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Vue d'ensemble du suivi-évaluation
            {isRP && " — lecture seule"}
          </p>
        </div>
        {isResponsableSE && (
          <Link
            to="/se/indicateurs/nouveau"
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-sm"
            style={{ background: "linear-gradient(135deg, #5A9C3A, #4A7C2F)" }}
          >
            <BarChart3 size={16} />
            Nouvel indicateur
          </Link>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KPICard
          label="Indicateurs actifs"
          value={indicateursActifs}
          icon={BarChart3}
          sublabel={`sur ${indicateurs.length} total`}
        />
        <KPICard
          label="Formulaires publiés"
          value={formulairesPublies}
          icon={FileText}
          className="border-blue-200 bg-blue-50"
        />
        <KPICard
          label="En attente validation"
          value={enAttente}
          icon={Clock}
          className={
            enAttente > 5
              ? "border-red-200 bg-red-50"
              : "border-yellow-200 bg-yellow-50"
          }
        />
        <KPICard
          label="Sous-performance"
          value={sousPerformance.length}
          icon={TrendingDown}
          className={
            sousPerformance.length > 0
              ? "border-red-200 bg-red-50"
              : "border-green-200 bg-green-50"
          }
          sublabel="Taux < 50%"
        />
      </div>

      {/* Alertes S&E */}
      {alertes.length > 0 && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Bell size={16} className="text-orange-600" />
            <h3 className="text-sm font-bold text-orange-800">
              Alertes S&E actives — {alertes.length}
            </h3>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {alertes.map((a, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 rounded-lg bg-white px-4 py-2.5 border border-orange-100"
              >
                <AlertTriangle
                  size={14}
                  className={`mt-0.5 shrink-0 ${a.niveau === "DANGER" ? "text-red-500" : "text-orange-500"}`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800">{a.message}</p>
                  {a.projetId && (
                    <p className="mt-0.5 text-[11px] text-gray-400">
                      Projet : {getProjet(a.projetId)?.code}
                    </p>
                  )}
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    a.niveau === "DANGER"
                      ? "bg-red-100 text-red-700"
                      : "bg-orange-100 text-orange-700"
                  }`}
                >
                  {a.type === "SOUS_PERFORMANCE"
                    ? "Sous-perf."
                    : a.type === "VALIDATION_EN_RETARD"
                      ? "Retard valid."
                      : "Sans collecte"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Taux d'atteinte par projet */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-900">
            Taux d'atteinte par projet
          </h2>
          <Link
            to="/se/indicateurs"
            className="flex items-center gap-1 text-xs font-medium text-green-700 hover:text-green-800"
          >
            Voir tous les indicateurs <ChevronRight size={14} />
          </Link>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left">
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  Code projet
                </th>
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  Titre
                </th>
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  Statut
                </th>
                <th className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  Indicateurs
                </th>
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400 w-64">
                  Taux d'atteinte moyen
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {projetsStats.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-medium text-gray-500">
                    {p.code}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900 max-w-[250px] truncate">
                    {p.titre}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${STATUT_COLORS[p.statut]}`}
                    >
                      {p.statut.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-medium text-gray-700">
                    {p.nbIndicateurs}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <ProgressBar taux={p.taux} />
                      </div>
                      <span
                        className={`text-sm font-bold w-12 text-right ${
                          p.taux >= 75
                            ? "text-green-600"
                            : p.taux >= 50
                              ? "text-orange-600"
                              : "text-red-600"
                        }`}
                      >
                        {p.taux}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/se/indicateurs?projet=${p.id}`}
                      className="text-gray-400 hover:text-green-600"
                    >
                      <ArrowRight size={16} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {projetsStats.length === 0 && (
            <div className="px-6 py-12 text-center">
              <ClipboardList className="mx-auto mb-2 text-gray-300" size={32} />
              <p className="text-sm text-gray-400">Aucun projet actif.</p>
            </div>
          )}
        </div>
      </div>

      {/* Sous-performance */}
      {sousPerformance.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-3">
            Indicateurs en sous-performance
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sousPerformance.map((ind) => {
              const projet = getProjet(ind.projetId);
              const tauxCalc = getTauxAtteinte(ind);

              return (
                <Link
                  key={ind.id}
                  to={`/se/indicateurs/${ind.id}`}
                  className="rounded-xl border border-red-200 bg-red-50/50 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-mono text-[11px] font-semibold text-gray-400">
                      {ind.code}
                    </span>
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                      {tauxCalc}%
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-gray-900 leading-snug">
                    {ind.libelle}
                  </h4>
                  <p className="mt-1 text-[11px] text-gray-500">
                    {projet?.code} — {projet?.titre}
                  </p>
                  <div className="mt-2">
                    <ProgressBar taux={tauxCalc} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Raccourcis rapides */}
      <div className="grid gap-3 sm:grid-cols-3">
        {!isRP && (
          <Link
            to="/se/validation"
            className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100">
              <Clock size={20} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                File de validation
              </p>
              <p className="text-[11px] text-gray-400">
                {enAttente} donnée{enAttente > 1 ? "s" : ""} en attente
              </p>
            </div>
          </Link>
        )}
        <Link
          to="/se/formulaires"
          className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
            <FileText size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Formulaires</p>
            <p className="text-[11px] text-gray-400">
              {formulairesPublies} publié{formulairesPublies > 1 ? "s" : ""}
            </p>
          </div>
        </Link>
        <Link
          to="/se/indicateurs"
          className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
            <BarChart3 size={20} className="text-green-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Indicateurs</p>
            <p className="text-[11px] text-gray-400">
              {indicateursActifs} actif{indicateursActifs > 1 ? "s" : ""}
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
