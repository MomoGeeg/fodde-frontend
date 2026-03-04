import useAuthStore from "@/stores/auth.store";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Calendar,
  Clock,
  Edit3,
  History,
  Lock,
  TrendingUp,
  WifiOff,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  createSEHelpers,
  FREQUENCES_COLLECTE,
  STATUT_COLORS,
  STATUTS_COLLECTE,
  UNITES_MESURE,
  useCollectes,
  useIndicateurs,
  useMembres,
  useProjets,
} from "./se-data";

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

function ProgressRing({ taux, size = 120 }) {
  const r = (size - 12) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(taux, 100) / 100) * c;
  const color = taux >= 75 ? "#22c55e" : taux >= 50 ? "#f97316" : "#ef4444";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#f3f4f6"
          strokeWidth="10"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold" style={{ color }}>
          {taux}%
        </span>
        <span className="text-[10px] text-gray-400">atteinte</span>
      </div>
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

const TABS = [
  { key: "general", label: "Vue générale", icon: BarChart3 },
  { key: "historique", label: "Historique des collectes", icon: History },
  { key: "courbe", label: "Courbe de progression", icon: TrendingUp },
];

// ════════════════════════════════════════════════════════════
// PAGE — Détail d'un indicateur
// ════════════════════════════════════════════════════════════
export default function SEIndicateurDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState("general");

  const isResponsableSE = user?.roles?.includes("ROLE_RESPONSABLE_SE");

  // Données Supabase
  const { data: projets = [] } = useProjets();
  const { data: indicateursData = [] } = useIndicateurs();
  const { data: membres = [] } = useMembres();
  const { data: collectesData = [] } = useCollectes();

  const {
    getIndicateur,
    getProjet,
    getMembre,
    getCollectesForIndicateur,
    getTauxAtteinte,
  } = createSEHelpers(projets, membres, indicateursData, collectesData, [], []);

  const indicateur = getIndicateur(id);
  const projet = indicateur ? getProjet(indicateur.projetId) : null;
  const resp = indicateur ? getMembre(indicateur.responsableCollecteId) : null;
  const collectes = useMemo(
    () => (indicateur ? getCollectesForIndicateur(indicateur.id) : []),
    [indicateur, collectesData],
  );
  const taux = indicateur ? getTauxAtteinte(indicateur) : 0;
  const projetCloture = projet?.statut === "CLOTURE";

  if (!indicateur) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate("/se/indicateurs")}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft size={16} /> Retour
        </button>
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
          <AlertTriangle className="mx-auto mb-3 text-gray-300" size={40} />
          <p className="text-gray-500">Indicateur introuvable.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Retour */}
      <button
        onClick={() => navigate("/se/indicateurs")}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft size={16} /> Retour aux indicateurs
      </button>

      {/* Header */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start gap-6">
          <ProgressRing taux={taux} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs text-gray-400">
                {indicateur.code}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${STATUT_COLORS[indicateur.statut]}`}
              >
                {indicateur.statut}
              </span>
              {projetCloture && (
                <span className="flex items-center gap-1 rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
                  <Lock size={9} /> Verrouillé
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              {indicateur.libelle}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {projet?.code} — {projet?.titre}
            </p>
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
              <span>
                Unité :{" "}
                <strong>
                  {UNITES_MESURE.find((u) => u.value === indicateur.unite)
                    ?.label ?? indicateur.unite}
                </strong>
              </span>
              <span>
                Cible : <strong>{indicateur.valeurCible}</strong>
              </span>
              <span>
                Baseline : <strong>{indicateur.valeurReference}</strong>
              </span>
              <span>
                Fréquence :{" "}
                <strong>
                  {FREQUENCES_COLLECTE.find(
                    (f) => f.value === indicateur.frequence,
                  )?.label ?? indicateur.frequence}
                </strong>
              </span>
            </div>
          </div>
          {isResponsableSE && !projetCloture && (
            <Link
              to={`/se/indicateurs/${indicateur.id}/edit`}
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white"
              style={{
                background: "linear-gradient(135deg, #5A9C3A, #4A7C2F)",
              }}
            >
              <Edit3 size={14} />
              Modifier
            </Link>
          )}
        </div>
      </div>

      {/* Onglets */}
      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === key
                ? "border-green-600 text-green-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Contenu onglet */}
      {activeTab === "general" && (
        <TabGeneral indicateur={indicateur} projet={projet} resp={resp} />
      )}
      {activeTab === "historique" && (
        <TabHistorique
          collectes={collectes}
          indicateur={indicateur}
          getMembre={getMembre}
        />
      )}
      {activeTab === "courbe" && (
        <TabCourbe collectes={collectes} indicateur={indicateur} />
      )}
    </div>
  );
}

// ── Onglet 1 — Vue générale ────────────────────────────────
function TabGeneral({ indicateur, projet, resp }) {
  const fields = [
    { label: "Code indicateur", value: indicateur.code },
    { label: "Libellé", value: indicateur.libelle },
    {
      label: "Unité de mesure",
      value:
        UNITES_MESURE.find((u) => u.value === indicateur.unite)?.label ??
        indicateur.unite,
    },
    { label: "Valeur de référence", value: indicateur.valeurReference },
    { label: "Valeur cible", value: indicateur.valeurCible },
    {
      label: "Fréquence de collecte",
      value:
        FREQUENCES_COLLECTE.find((f) => f.value === indicateur.frequence)
          ?.label ?? indicateur.frequence,
    },
    {
      label: "Source de vérification",
      value: indicateur.sourceVerification || "—",
    },
    { label: "Projet associé", value: `${projet?.code} — ${projet?.titre}` },
    {
      label: "Responsable de collecte",
      value: resp ? `${resp.prenom} ${resp.nom}` : "—",
    },
    {
      label: "Résultat attendu lié",
      value: indicateur.resultatAttendu || "—",
    },
    { label: "Statut", value: indicateur.statut },
    { label: "Date de création", value: fmtDate(indicateur.dateCreation) },
  ];

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="divide-y divide-gray-100">
        {fields.map(({ label, value }) => (
          <div
            key={label}
            className="flex items-start px-5 py-3 text-sm hover:bg-gray-50"
          >
            <span className="w-52 shrink-0 text-xs font-semibold uppercase tracking-wider text-gray-400">
              {label}
            </span>
            <span className="text-gray-900">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Onglet 2 — Historique des collectes ────────────────────
function TabHistorique({ collectes, indicateur, getMembre }) {
  if (collectes.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
        <History className="mx-auto mb-3 text-gray-300" size={40} />
        <p className="text-sm text-gray-400">
          Aucune collecte enregistrée pour cet indicateur.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50 text-left">
            <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Date collecte
            </th>
            <th className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Valeur saisie
            </th>
            <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Collecteur
            </th>
            <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Statut
            </th>
            <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Badges
            </th>
            <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Validé par
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {[...collectes].reverse().map((col) => {
            const collecteur = getMembre(col.collecteurId);
            const validateur = col.validePar
              ? getMembre(col.validePar)
              : col.preValidePar
                ? getMembre(col.preValidePar)
                : null;
            const isVerrouille = col.statut === "VALIDEE";

            return (
              <tr
                key={col.id}
                className={`transition-colors ${isVerrouille ? "bg-green-50/30" : "hover:bg-gray-50"}`}
              >
                <td className="px-4 py-3 text-xs text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={12} className="text-gray-400" />
                    {fmtDate(col.dateCollecte)}
                  </div>
                </td>
                <td className="px-4 py-3 text-center font-semibold text-gray-900">
                  {col.valeur}
                  <span className="ml-1 text-[10px] text-gray-400">
                    {UNITES_MESURE.find((u) => u.value === indicateur.unite)
                      ?.label ?? ""}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-600">
                  {collecteur ? `${collecteur.prenom} ${collecteur.nom}` : "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUT_COLORS[col.statut]}`}
                  >
                    {STATUTS_COLLECTE.find((s) => s.value === col.statut)
                      ?.label ?? col.statut}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {col.horsDelai && (
                      <span className="flex items-center gap-0.5 rounded-full bg-orange-100 px-1.5 py-0.5 text-[9px] font-bold text-orange-700">
                        <Clock size={8} /> Hors délai
                      </span>
                    )}
                    {col.horsLigne && (
                      <span className="flex items-center gap-0.5 rounded-full bg-purple-100 px-1.5 py-0.5 text-[9px] font-bold text-purple-700">
                        <WifiOff size={8} /> Hors-ligne
                      </span>
                    )}
                    {isVerrouille && (
                      <span className="flex items-center gap-0.5 rounded-full bg-green-100 px-1.5 py-0.5 text-[9px] font-bold text-green-700">
                        <Lock size={8} /> Verrouillé
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {validateur ? `${validateur.prenom} ${validateur.nom}` : "—"}
                  {col.dateValidation && (
                    <span className="ml-1 text-[10px] text-gray-400">
                      ({fmtDate(col.dateValidation)})
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Onglet 3 — Courbe de progression ──────────────────────
function TabCourbe({ collectes, indicateur }) {
  // Filtrer uniquement les collectes validées + pré-validées for graph
  const dataPoints = useMemo(() => {
    return collectes
      .filter((c) =>
        ["VALIDEE", "PRE_VALIDEE", "EN_ATTENTE"].includes(c.statut),
      )
      .map((c) => ({
        date: new Date(c.dateCollecte),
        dateLabel: new Date(c.dateCollecte).toLocaleDateString("fr-FR", {
          month: "short",
          year: "2-digit",
        }),
        valeur: c.valeur,
        statut: c.statut,
        id: c.id,
      }));
  }, [collectes]);

  const [hoveredPoint, setHoveredPoint] = useState(null);

  if (dataPoints.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
        <TrendingUp className="mx-auto mb-3 text-gray-300" size={40} />
        <p className="text-sm text-gray-400">
          Pas assez de données pour afficher la courbe.
        </p>
      </div>
    );
  }

  // SVG chart dimensions
  const W = 700;
  const H = 300;
  const PX = 60;
  const PY = 30;
  const PB = 40;
  const PT = 20;

  const cible = indicateur.valeurCible;
  const maxVal = Math.max(
    cible * 1.1,
    ...dataPoints.map((d) => d.valeur * 1.1),
  );
  const minVal = 0;

  const xScale = (i) =>
    PX + (i / Math.max(dataPoints.length - 1, 1)) * (W - PX - 20);
  const yScale = (v) =>
    PT + (1 - (v - minVal) / (maxVal - minVal)) * (H - PT - PB);

  // Build path
  const pathD = dataPoints
    .map((d, i) => `${i === 0 ? "M" : "L"} ${xScale(i)} ${yScale(d.valeur)}`)
    .join(" ");

  // Cible line
  const cibleY = yScale(cible);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">
          Progression : valeur réelle vs cible
        </h3>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 bg-blue-500 rounded" /> Réel
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="h-0.5 w-4 bg-red-400 rounded border-dashed"
              style={{ borderBottom: "2px dashed #ef4444", height: 0 }}
            />{" "}
            Cible
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full min-w-[500px]"
          style={{ maxHeight: 320 }}
        >
          {/* Grille horizontale */}
          {[0, 0.25, 0.5, 0.75, 1].map((f) => {
            const y = PT + (1 - f) * (H - PT - PB);
            const val = Math.round(f * maxVal);
            return (
              <g key={f}>
                <line
                  x1={PX}
                  y1={y}
                  x2={W - 20}
                  y2={y}
                  stroke="#f3f4f6"
                  strokeWidth="1"
                />
                <text
                  x={PX - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="text-[10px] fill-gray-400"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Ligne cible (pointillée rouge) */}
          <line
            x1={PX}
            y1={cibleY}
            x2={W - 20}
            y2={cibleY}
            stroke="#ef4444"
            strokeWidth="1.5"
            strokeDasharray="6 4"
          />
          <text
            x={W - 18}
            y={cibleY - 6}
            className="text-[9px] fill-red-500 font-semibold"
          >
            Cible: {cible}
          </text>

          {/* Zone sous la courbe */}
          <path
            d={`${pathD} L ${xScale(dataPoints.length - 1)} ${H - PB} L ${xScale(0)} ${H - PB} Z`}
            fill="url(#blueGrad)"
            opacity="0.15"
          />

          {/* Courbe bleue */}
          <path
            d={pathD}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Points */}
          {dataPoints.map((d, i) => (
            <g key={d.id}>
              <circle
                cx={xScale(i)}
                cy={yScale(d.valeur)}
                r={hoveredPoint === i ? 7 : 5}
                fill={
                  d.statut === "VALIDEE"
                    ? "#22c55e"
                    : d.statut === "PRE_VALIDEE"
                      ? "#3b82f6"
                      : "#f59e0b"
                }
                stroke="white"
                strokeWidth="2"
                className="cursor-pointer transition-all"
                onMouseEnter={() => setHoveredPoint(i)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
              {/* Label date */}
              <text
                x={xScale(i)}
                y={H - PB + 18}
                textAnchor="middle"
                className="text-[9px] fill-gray-400"
              >
                {d.dateLabel}
              </text>
              {/* Tooltip */}
              {hoveredPoint === i && (
                <g>
                  <rect
                    x={xScale(i) - 40}
                    y={yScale(d.valeur) - 34}
                    width="80"
                    height="24"
                    rx="4"
                    fill="#1f2937"
                    opacity="0.9"
                  />
                  <text
                    x={xScale(i)}
                    y={yScale(d.valeur) - 18}
                    textAnchor="middle"
                    className="text-[10px] fill-white font-semibold"
                  >
                    {d.valeur}{" "}
                    {UNITES_MESURE.find((u) => u.value === indicateur.unite)
                      ?.label ?? ""}
                  </text>
                </g>
              )}
            </g>
          ))}

          {/* Gradient def */}
          <defs>
            <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Légende des points */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-green-500" /> Validée
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-blue-500" /> Pré-validée
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-amber-500" /> En attente
        </span>
      </div>
    </div>
  );
}
