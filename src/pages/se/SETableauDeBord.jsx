import useAuthStore from "@/stores/auth.store";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Clock,
  FileText,
  Filter,
  TrendingDown,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  countEnAttente,
  getAlertesSE,
  getIndicateursSousPerformance,
  getProjet,
  getTauxAtteinte,
  getTauxParProjet,
  useCollectes,
  useFormulaires,
  useIndicateurs,
  useProjets,
  useReponsesEnAttente,
} from "./se-data";

// ── Constantes visuelles ─────────────────────────────────────────────────────
const STATUT_COLORS_PIE = {
  VALIDEE: "#22c55e",
  EN_ATTENTE: "#f59e0b",
  PRE_VALIDEE: "#3b82f6",
  REJETEE: "#e44646",
};
const STATUT_LABELS = {
  VALIDEE: "Validées",
  EN_ATTENTE: "En attente",
  PRE_VALIDEE: "Pré-validées",
  REJETEE: "Rejetées",
};
const getBarColor = (taux) =>
  taux >= 75 ? "#22c55e" : taux >= 50 ? "#f59e0b" : "#ef4444";

// ── Composants UI ─────────────────────────────────────────────────────────────
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

function ProgressBar({ taux }) {
  const color =
    taux >= 75 ? "bg-green-500" : taux >= 50 ? "bg-orange-500" : "bg-red-500";
  const bg =
    taux >= 75 ? "bg-green-100" : taux >= 50 ? "bg-orange-100" : "bg-red-100";
  return (
    <div className={`h-2 w-full rounded-full ${bg}`}>
      <div
        className={`h-full rounded-full ${color} transition-all`}
        style={{ width: `${Math.min(taux, 100)}%` }}
      />
    </div>
  );
}

function TooltipBar({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-gray-700 mb-1 max-w-[180px] truncate">
        {payload[0].payload?.label ?? label}
      </p>
      <p
        className={`font-bold ${val >= 75 ? "text-green-600" : val >= 50 ? "text-orange-600" : "text-red-600"}`}
      >
        Taux : {val}%
      </p>
    </div>
  );
}

function TooltipPie({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold">{payload[0].name}</p>
      <p className="text-gray-600">
        {payload[0].value} collecte{payload[0].value > 1 ? "s" : ""}
      </p>
      <p className="text-gray-400">{payload[0].payload.percent}%</p>
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

  // ── Filtre projet ──────────────────────────────────────────
  const [filterProjet, setFilterProjet] = useState("all");

  // ── Données ────────────────────────────────────────────────
  const { data: projets = [] } = useProjets();
  const { data: indicateurs = [] } = useIndicateurs();
  const { data: formulaires = [] } = useFormulaires();
  const { data: collectes = [] } = useCollectes();
  const { data: reponses = [] } = useReponsesEnAttente();

  // ── Projets actifs pour le filtre ─────────────────────────
  const projetsActifs = useMemo(
    () =>
      projets.filter((p) => p.statut !== "CLOTURE" && p.statut !== "ARCHIVE"),
    [projets],
  );

  // ── Données filtrées par projet ───────────────────────────
  const indicateursFiltres = useMemo(() => {
    if (filterProjet === "all") return indicateurs;
    return indicateurs.filter(
      (i) => (i.projetId ?? i.projet_id) === filterProjet,
    );
  }, [indicateurs, filterProjet]);

  const collectesFiltrees = useMemo(() => {
    if (filterProjet === "all") return collectes;
    const ids = new Set(indicateursFiltres.map((i) => i.id));
    return collectes.filter((c) => ids.has(c.indicateurId ?? c.indicateur_id));
  }, [collectes, indicateursFiltres, filterProjet]);

  const formulairesFiltres = useMemo(() => {
    if (filterProjet === "all") return formulaires;
    return formulaires.filter(
      (f) => (f.projetId ?? f.projet_id) === filterProjet,
    );
  }, [formulaires, filterProjet]);

  const reponsesFiltrees = filterProjet === "all" ? reponses : [];

  // ── KPIs ───────────────────────────────────────────────────
  const indicateursActifs = indicateursFiltres.filter(
    (i) => i.statut === "ACTIF",
  ).length;
  const formulairesPublies = formulairesFiltres.filter(
    (f) => f.statut === "PUBLIE",
  ).length;
  const enAttente = countEnAttente(collectesFiltrees, reponsesFiltrees);
  const sousPerformance = useMemo(
    () => getIndicateursSousPerformance(indicateursFiltres, collectesFiltrees),
    [indicateursFiltres, collectesFiltrees],
  );

  // ── Alertes ────────────────────────────────────────────────
  const alertes = useMemo(
    () => getAlertesSE(indicateursFiltres, collectesFiltrees, reponsesFiltrees),
    [indicateursFiltres, collectesFiltrees, reponsesFiltrees],
  );

  // ── Chart 1 : Taux d'atteinte (projet ou indicateur) ──────
  const tauxChartData = useMemo(() => {
    if (filterProjet !== "all") {
      // Détail : taux par indicateur du projet
      return indicateursFiltres
        .filter((i) => i.statut === "ACTIF")
        .map((ind) => ({
          name: ind.code,
          label: ind.libelle ?? ind.nom ?? ind.code,
          taux: getTauxAtteinte(ind, collectesFiltrees),
        }))
        .sort((a, b) => b.taux - a.taux)
        .slice(0, 10);
    }
    // Global : taux par projet
    return projetsActifs
      .map((p) => {
        const stats = getTauxParProjet(indicateurs, collectes, p.id);
        return {
          name: p.code,
          label: p.titre,
          taux: stats.taux,
          nb: stats.nbIndicateurs,
        };
      })
      .filter((d) => d.nb > 0)
      .sort((a, b) => b.taux - a.taux);
  }, [
    filterProjet,
    projetsActifs,
    indicateursFiltres,
    collectesFiltrees,
    indicateurs,
    collectes,
  ]);

  // ── Chart 2 : Répartition statuts collectes ───────────────
  const statutsChartData = useMemo(() => {
    const counts = {};
    collectesFiltrees.forEach((c) => {
      counts[c.statut] = (counts[c.statut] ?? 0) + 1;
    });
    const total = collectesFiltrees.length;
    return Object.entries(counts).map(([statut, count]) => ({
      name: STATUT_LABELS[statut] ?? statut,
      value: count,
      statut,
      percent: total > 0 ? Math.round((count / total) * 100) : 0,
      color: STATUT_COLORS_PIE[statut] ?? "#94a3b8",
    }));
  }, [collectesFiltrees]);

  // ── Chart 3 : Évolution collectes par mois ────────────────
  const collectesParMois = useMemo(() => {
    const map = {};
    collectesFiltrees.forEach((c) => {
      const d = new Date(c.dateCollecte ?? c.date_collecte);
      if (isNaN(d)) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!map[key])
        map[key] = {
          mois: key,
          VALIDEE: 0,
          EN_ATTENTE: 0,
          PRE_VALIDEE: 0,
          REJETEE: 0,
        };
      map[key][c.statut] = (map[key][c.statut] ?? 0) + 1;
    });
    return Object.values(map)
      .sort((a, b) => a.mois.localeCompare(b.mois))
      .slice(-8)
      .map((d) => ({
        ...d,
        label: new Date(d.mois + "-01").toLocaleDateString("fr-FR", {
          month: "short",
          year: "2-digit",
        }),
      }));
  }, [collectesFiltrees]);

  const selectedProjet =
    filterProjet !== "all" ? projets.find((p) => p.id === filterProjet) : null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Tableau de bord S&E
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Analyses et suivi des indicateurs
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

      {/* Filtre projet */}
      <div className="flex items-start gap-3">
        <Filter size={14} className="text-gray-400 shrink-0 mt-1.5" />
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterProjet("all")}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filterProjet === "all"
                ? "bg-green-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Tous les projets
          </button>
          {projetsActifs.map((p) => (
            <button
              key={p.id}
              onClick={() => setFilterProjet(p.id)}
              title={p.titre}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filterProjet === p.id
                  ? "bg-green-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {p.code}
            </button>
          ))}
        </div>
      </div>

      {/* Titre du projet sélectionné */}
      {selectedProjet && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-2.5">
          <p className="text-xs text-green-700">
            <span className="font-semibold">{selectedProjet.code}</span> —{" "}
            {selectedProjet.titre}
          </p>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KPICard
          label="Indicateurs actifs"
          value={indicateursActifs}
          icon={BarChart3}
          sublabel={`sur ${indicateursFiltres.length} total`}
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

      {/* ── Ligne graphiques ── */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Bar chart — Taux d'atteinte */}
        <div className="lg:col-span-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">
            {filterProjet === "all"
              ? "Taux d'atteinte par projet"
              : "Taux d'atteinte par indicateur"}
          </h2>
          <p className="text-[11px] text-gray-400 mb-4">
            Indicateurs actifs — valeur vs cible
          </p>

          {tauxChartData.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-sm text-gray-400">
              Aucune donnée disponible
            </div>
          ) : (
            <ResponsiveContainer
              width="100%"
              height={Math.max(160, tauxChartData.length * 38)}
            >
              <BarChart
                data={tauxChartData}
                layout="vertical"
                margin={{ top: 0, right: 48, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={58}
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                />
                <Tooltip content={<TooltipBar />} />
                <Bar dataKey="taux" radius={[0, 4, 4, 0]} maxBarSize={20}>
                  {tauxChartData.map((entry, i) => (
                    <Cell key={i} fill={getBarColor(entry.taux)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie chart — Statuts collectes */}
        <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">
            Statuts des collectes
          </h2>
          <p className="text-[11px] text-gray-400 mb-4">
            {collectesFiltrees.length} collecte
            {collectesFiltrees.length !== 1 ? "s" : ""} au total
          </p>

          {statutsChartData.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-sm text-gray-400">
              Aucune collecte
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie
                    data={statutsChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={42}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statutsChartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<TooltipPie />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-1.5">
                {statutsChartData.map((d) => (
                  <div
                    key={d.statut}
                    className="flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block h-2 w-2 rounded-full shrink-0"
                        style={{ background: d.color }}
                      />
                      <span className="text-gray-600">{d.name}</span>
                    </div>
                    <span className="font-semibold text-gray-700">
                      {d.value}{" "}
                      <span className="text-gray-400 font-normal">
                        ({d.percent}%)
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Évolution collectes par mois */}
      {collectesParMois.length > 1 && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">
            Évolution des collectes par mois
          </h2>
          <p className="text-[11px] text-gray-400 mb-4">
            8 derniers mois — répartition par statut
          </p>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart
              data={collectesParMois}
              margin={{ top: 0, right: 10, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                }}
                labelStyle={{ fontWeight: 600 }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar
                dataKey="VALIDEE"
                name="Validées"
                stackId="a"
                fill="#22c55e"
              />
              <Bar
                dataKey="PRE_VALIDEE"
                name="Pré-validées"
                stackId="a"
                fill="#3b82f6"
              />
              <Bar
                dataKey="EN_ATTENTE"
                name="En attente"
                stackId="a"
                fill="#f59e0b"
              />
              <Bar
                dataKey="REJETEE"
                name="Rejetées"
                stackId="a"
                fill="#ef4444"
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Alertes S&E */}
      {alertes.length > 0 && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Bell size={16} className="text-orange-600" />
            <h3 className="text-sm font-bold text-orange-800">
              Alertes S&E — {alertes.length}
            </h3>
          </div>
          <div className="space-y-2 max-h-44 overflow-y-auto">
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
                  <p className="text-xs text-gray-800">{a.message}</p>
                  {a.projetId && (
                    <p className="mt-0.5 text-[11px] text-gray-400">
                      Projet : {getProjet(projets, a.projetId)?.code}
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

      {/* Indicateurs en sous-performance */}
      {sousPerformance.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-900 mb-3">
            Indicateurs en sous-performance
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sousPerformance.slice(0, 6).map((ind) => {
              const projet = getProjet(projets, ind.projetId ?? ind.projet_id);
              const taux = getTauxAtteinte(ind, collectesFiltrees);
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
                      {taux}%
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-gray-900 leading-snug">
                    {ind.libelle}
                  </h4>
                  <p className="mt-1 text-[11px] text-gray-500">
                    {projet?.code} — {projet?.titre}
                  </p>
                  <div className="mt-2">
                    <ProgressBar taux={taux} />
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
