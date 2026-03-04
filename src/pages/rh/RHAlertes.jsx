import RoleGate from "@/components/shared/RoleGate";
import {
  AlertTriangle,
  ChevronRight,
  Clock,
  FileWarning,
  Star,
  TrendingDown,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  joursRestants,
  urgenceContrat,
  useConges,
  useEmployes,
  useEvaluations,
} from "./rh-data";

// ── Helpers ────────────────────────────────────────────────
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("fr-FR") : "—");

function PriorityBadge({ level }) {
  const cn = {
    CRITIQUE: "bg-red-100 text-red-700 border-red-200",
    URGENT: "bg-orange-100 text-orange-700 border-orange-200",
    ATTENTION: "bg-yellow-100 text-yellow-700 border-yellow-200",
    INFO: "bg-blue-100 text-blue-700 border-blue-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cn[level] || cn.INFO}`}
    >
      {level}
    </span>
  );
}

// ── Contrats à échéance ────────────────────────────────────
function ContratsSection() {
  const navigate = useNavigate();
  const { data: allEmployes = [] } = useEmployes();
  const contrats = allEmployes
    .filter(
      (e) =>
        e.statut !== "PARTI" && e.typeContrat !== "CDI" && e.dateFinContrat,
    )
    .map((e) => {
      const jours = joursRestants(e.dateFinContrat);
      const level = urgenceContrat(e.dateFinContrat);
      return { ...e, joursRestants: jours, level };
    })
    .filter((e) => e.level !== null)
    .sort((a, b) => a.joursRestants - b.joursRestants);

  if (contrats.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-gray-400">
        Aucun contrat à échéance dans les 90 prochains jours.
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {contrats.map((c) => (
        <div
          key={c.id}
          className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
          onClick={() => navigate(`/rh/employes/${c.id}`)}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white ${
                c.level === "CRITIQUE"
                  ? "bg-red-500"
                  : c.level === "URGENT"
                    ? "bg-orange-500"
                    : "bg-yellow-500"
              }`}
            >
              {c.prenom?.[0]}
              {c.nom?.[0]}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {c.prenom} {c.nom}
              </p>
              <p className="text-xs text-gray-400">
                {c.typeContrat} — fin le {fmtDate(c.dateFinContrat)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <PriorityBadge
              level={
                c.level === "CRITIQUE"
                  ? "CRITIQUE"
                  : c.level === "URGENT"
                    ? "URGENT"
                    : "ATTENTION"
              }
            />
            <span className="w-12 text-right text-sm font-bold tabular-nums text-gray-700">
              {c.joursRestants}j
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Évaluations en retard ──────────────────────────────────
function EvaluationsRetardSection() {
  const navigate = useNavigate();
  const { data: allEvaluations = [] } = useEvaluations();
  const retard = allEvaluations
    .filter((e) => e.statut === "EN_RETARD" || e.statut === "EN_COURS")
    .sort((a, b) => new Date(a.dateDebut) - new Date(b.dateDebut));

  if (retard.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-gray-400">
        Toutes les évaluations sont à jour.
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {retard.map((ev) => {
        const isRetard = ev.statut === "EN_RETARD";
        return (
          <div
            key={ev.id}
            className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
            onClick={() => navigate("/rh/evaluations")}
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900">
                {ev.employeNom}
              </p>
              <p className="text-xs text-gray-400">
                {ev.service} · Année {ev.annee}
              </p>
            </div>
            <PriorityBadge level={isRetard ? "URGENT" : "ATTENTION"} />
          </div>
        );
      })}
    </div>
  );
}

// ── Congés en attente > 3 jours ────────────────────────────
function CongesAttenteSection() {
  const navigate = useNavigate();
  const { data: allConges = [] } = useConges();
  const maintenant = new Date();
  const enAttente = allConges
    .filter((c) => c.statut === "EN_ATTENTE" || c.statut === "VALIDE_N1")
    .map((c) => {
      const created = new Date(c.createdAt || c.dateDebut);
      const joursAttente = Math.floor(
        (maintenant - created) / (1000 * 60 * 60 * 24),
      );
      return { ...c, joursAttente };
    })
    .filter((c) => c.joursAttente >= 3)
    .sort((a, b) => b.joursAttente - a.joursAttente);

  if (enAttente.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-gray-400">
        Aucune demande en attente depuis plus de 3 jours.
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {enAttente.map((c) => (
        <div
          key={c.id}
          className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
          onClick={() => navigate("/rh/conges")}
        >
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900">{c.employeNom}</p>
            <p className="text-xs text-gray-400">
              {c.typeConge} · {fmtDate(c.dateDebut)} → {fmtDate(c.dateFin)} · en
              attente depuis {c.joursAttente}j
            </p>
          </div>
          <PriorityBadge level={c.joursAttente >= 7 ? "URGENT" : "ATTENTION"} />
        </div>
      ))}
    </div>
  );
}

// ── Soldes négatifs ────────────────────────────────────────
function SoldesNegatifsSection() {
  const navigate = useNavigate();
  const { data: allEmployes = [] } = useEmployes();
  const negatifs = allEmployes.filter(
    (e) =>
      e.statut !== "PARTI" && (e.soldeConges < 0 || e.soldeRecuperation < 0),
  );

  if (negatifs.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-gray-400">
        Aucun solde négatif détecté.
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {negatifs.map((e) => (
        <div
          key={e.id}
          className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
          onClick={() => navigate(`/rh/employes/${e.id}`)}
        >
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900">
              {e.prenom} {e.nom}
            </p>
            <p className="text-xs text-gray-400">
              {e.soldeConges < 0 ? `Annuel : ${e.soldeConges}j` : ""}
              {e.soldeConges < 0 && e.soldeRecuperation < 0 ? " · " : ""}
              {e.soldeRecuperation < 0
                ? `Récup. : ${e.soldeRecuperation}j`
                : ""}
            </p>
          </div>
          <PriorityBadge level="CRITIQUE" />
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// PAGE ALERTES
// ══════════════════════════════════════════════════════════
export default function RHAlertes() {
  const navigate = useNavigate();

  const { data: allEmployes = [] } = useEmployes();
  const { data: allConges = [] } = useConges();
  const { data: allEvaluations = [] } = useEvaluations();

  // Comptage global
  const contratsCount = allEmployes.filter(
    (e) =>
      e.statut !== "PARTI" &&
      e.typeContrat !== "CDI" &&
      e.dateFinContrat &&
      urgenceContrat(e.dateFinContrat) !== null,
  ).length;
  const evalRetardCount = allEvaluations.filter(
    (e) => e.statut === "EN_RETARD",
  ).length;
  const congesAttente = allConges.filter((c) =>
    ["EN_ATTENTE", "VALIDE_N1"].includes(c.statut),
  ).length;
  const soldesNegatifs = allEmployes.filter(
    (e) =>
      e.statut !== "PARTI" && (e.soldeConges < 0 || e.soldeRecuperation < 0),
  ).length;

  const totalAlertes =
    contratsCount + evalRetardCount + congesAttente + soldesNegatifs;

  const CARDS = [
    {
      icon: FileWarning,
      label: "Contrats à échéance",
      count: contratsCount,
      color: "text-orange-500",
      bg: "bg-orange-50",
    },
    {
      icon: Star,
      label: "Évaluations en retard",
      count: evalRetardCount,
      color: "text-red-500",
      bg: "bg-red-50",
    },
    {
      icon: Clock,
      label: "Congés en attente",
      count: congesAttente,
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      icon: TrendingDown,
      label: "Soldes négatifs",
      count: soldesNegatifs,
      color: "text-purple-500",
      bg: "bg-purple-50",
    },
  ];

  return (
    <RoleGate allowedRoles={["ROLE_RH", "ROLE_SE", "ROLE_ADMIN"]}>
      <div className="space-y-6">
        {/* En-tête */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="text-orange-500" size={24} />
            Alertes RH
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {totalAlertes} alerte{totalAlertes !== 1 ? "s" : ""} active
            {totalAlertes !== 1 ? "s" : ""}
          </p>
        </div>

        {/* KPI Alertes */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CARDS.map((card) => (
            <div
              key={card.label}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className={`rounded-xl p-2.5 ${card.bg}`}>
                  <card.icon size={20} className={card.color} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {card.count}
                  </p>
                  <p className="text-xs text-gray-500">{card.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Contrats à échéance */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
            <div className="flex items-center gap-2">
              <FileWarning size={16} className="text-orange-500" />
              <h2 className="text-sm font-bold text-gray-900">
                Contrats à échéance
              </h2>
              {contratsCount > 0 && (
                <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700">
                  {contratsCount}
                </span>
              )}
            </div>
            <button
              onClick={() => navigate("/rh/employes")}
              className="flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors"
            >
              Voir tous
              <ChevronRight size={14} />
            </button>
          </div>
          <ContratsSection />
        </div>

        {/* Évaluations en retard */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
            <div className="flex items-center gap-2">
              <Star size={16} className="text-red-500" />
              <h2 className="text-sm font-bold text-gray-900">
                Évaluations en retard
              </h2>
              {evalRetardCount > 0 && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                  {evalRetardCount}
                </span>
              )}
            </div>
            <button
              onClick={() => navigate("/rh/evaluations")}
              className="flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors"
            >
              Voir tous
              <ChevronRight size={14} />
            </button>
          </div>
          <EvaluationsRetardSection />
        </div>

        {/* Congés en attente > 3j */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-blue-500" />
              <h2 className="text-sm font-bold text-gray-900">
                Congés en attente {">"}3 jours
              </h2>
              {congesAttente > 0 && (
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                  {congesAttente}
                </span>
              )}
            </div>
            <button
              onClick={() => navigate("/rh/conges")}
              className="flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors"
            >
              Voir tous
              <ChevronRight size={14} />
            </button>
          </div>
          <CongesAttenteSection />
        </div>

        {/* Soldes négatifs */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
            <div className="flex items-center gap-2">
              <TrendingDown size={16} className="text-purple-500" />
              <h2 className="text-sm font-bold text-gray-900">
                Soldes négatifs
              </h2>
              {soldesNegatifs > 0 && (
                <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700">
                  {soldesNegatifs}
                </span>
              )}
            </div>
          </div>
          <SoldesNegatifsSection />
        </div>
      </div>
    </RoleGate>
  );
}
