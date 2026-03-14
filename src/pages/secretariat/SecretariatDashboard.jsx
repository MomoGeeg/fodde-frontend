import { useNavigate } from "react-router-dom";
import {
  FolderOpen,
  TrendingUp,
  Wallet,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  Users,
  BarChart3,
  FileText,
  ArrowRight,
} from "lucide-react";
import { useKPISE, useValidationsSE, useAlertesSE } from "@/api/secretariat.api";

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat("fr-SN").format(n) + " F";

function KpiCard({ label, value, sub, icon: Icon, color, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border border-gray-100 bg-white p-5 ${onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""}`}
    >
      <div className="flex items-start justify-between">
        <div className={`rounded-xl p-2.5 ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
        {onClick && <ChevronRight size={16} className="text-gray-300" />}
      </div>
      <p className="mt-3 text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm font-medium text-gray-700">{label}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

function NiveauBadge({ niveau }) {
  const map = {
    CRITIQUE: "bg-red-100 text-red-800",
    URGENT:   "bg-orange-100 text-orange-800",
    WARNING:  "bg-yellow-100 text-yellow-800",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${map[niveau] ?? "bg-gray-100 text-gray-600"}`}>
      {niveau}
    </span>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SecretariatDashboard() {
  const navigate = useNavigate();
  const { data: kpi } = useKPISE();
  const { data: validations = [] } = useValidationsSE();
  const { data: alertes = [] } = useAlertesSE();

  const pendingCount = validations.length;
  const alertesNonLues = alertes.filter((a) => !a.lue);
  const top3Validations = validations.slice(0, 3);
  const top5Alertes = alertesNonLues.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* KPI cards — ligne 1 */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard
          label="Projets actifs"
          value={kpi?.projetsActifs ?? "—"}
          sub={kpi?.projetsEnRetard ? `${kpi.projetsEnRetard} en retard` : "Aucun retard"}
          icon={FolderOpen}
          color="bg-indigo-500"
          onClick={() => navigate("/secretariat/projets")}
        />
        <KpiCard
          label="Projets en validation"
          value={kpi?.projetsEnValidation ?? "—"}
          sub={kpi?.projetsEnRetard ? `${kpi.projetsEnRetard} en retard` : "Aucun retard"}
          icon={TrendingUp}
          color="bg-emerald-500"
          onClick={() => navigate("/secretariat/validations")}
        />
        <KpiCard
          label="Dépenses du mois"
          value={kpi ? fmt(kpi.depensesMoisCourant) : "—"}
          sub={`${kpi?.depensesEnAttenteApprobation ?? 0} en attente d'approbation`}
          icon={Wallet}
          color="bg-amber-500"
          onClick={() => navigate("/secretariat/validations")}
        />
        <KpiCard
          label="Alertes critiques"
          value={alertesNonLues.filter((a) => a.niveau === "CRITIQUE").length}
          sub={`${alertesNonLues.length} alertes non lues`}
          icon={AlertTriangle}
          color="bg-red-500"
          onClick={() => navigate("/secretariat/alertes")}
        />
      </div>

      {/* KPI cards — ligne 2 */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard
          label="Validations en attente"
          value={pendingCount}
          sub={`${validations.filter((v) => v.type === "PROJET").length} projets · ${validations.filter((v) => v.type === "DEPENSE").length} dépenses`}
          icon={Clock}
          color="bg-violet-500"
          onClick={() => navigate("/secretariat/validations")}
        />
        <KpiCard
          label="Avances non justifiées"
          value={kpi?.avancesNonJustifiees ?? "—"}
          sub="Délai de justification dépassé"
          icon={AlertTriangle}
          color="bg-orange-500"
          onClick={() => navigate("/secretariat/validations")}
        />
        <KpiCard
          label="Employés actifs"
          value={kpi?.employes?.actifs ?? "—"}
          sub={`${kpi?.employes?.suspendus ?? 0} suspendu(s)`}
          icon={Users}
          color="bg-blue-500"
          onClick={() => navigate("/secretariat/employes")}
        />
        <KpiCard
          label="Contrats CDD à échéance"
          value={kpi?.contratsEcheance30j ?? "—"}
          sub="Dans les 30 prochains jours"
          icon={FileText}
          color="bg-pink-500"
          onClick={() => navigate("/secretariat/employes")}
        />
      </div>

      {/* Validations urgentes + Alertes récentes */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Validations urgentes */}
        <div className="rounded-2xl border border-gray-100 bg-white">
          <div className="flex items-center justify-between border-b border-gray-50 px-5 py-4">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-violet-500" />
              <h3 className="text-sm font-semibold text-gray-900">
                Validations en attente
              </h3>
              {pendingCount > 0 && (
                <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-bold text-violet-700">
                  {pendingCount}
                </span>
              )}
            </div>
            <button
              onClick={() => navigate("/secretariat/validations")}
              className="flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-800"
            >
              Voir tout <ArrowRight size={12} />
            </button>
          </div>

          <div className="divide-y divide-gray-50">
            {top3Validations.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle2 size={24} className="mx-auto mb-2 text-green-400" />
                <p className="text-sm text-gray-500">Aucune validation en attente</p>
              </div>
            ) : (
              top3Validations.map((v) => (
                <div key={v.id} className="px-5 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            v.type === "PROJET"
                              ? "bg-indigo-100 text-indigo-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {v.type}
                        </span>
                        <span className="text-xs text-gray-400">{v.reference}</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {v.titre}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {v.soumetteur}
                      </p>
                    </div>
                    {v.montant && (
                      <p className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                        {fmt(v.montant)}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {pendingCount > 3 && (
            <div className="border-t border-gray-50 px-5 py-3">
              <button
                onClick={() => navigate("/secretariat/validations")}
                className="text-xs font-medium text-violet-600 hover:text-violet-800"
              >
                +{pendingCount - 3} autres validations en attente →
              </button>
            </div>
          )}
        </div>

        {/* Alertes récentes */}
        <div className="rounded-2xl border border-gray-100 bg-white">
          <div className="flex items-center justify-between border-b border-gray-50 px-5 py-4">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-500" />
              <h3 className="text-sm font-semibold text-gray-900">
                Alertes non lues
              </h3>
              {alertesNonLues.length > 0 && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
                  {alertesNonLues.length}
                </span>
              )}
            </div>
            <button
              onClick={() => navigate("/secretariat/alertes")}
              className="flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-800"
            >
              Voir tout <ArrowRight size={12} />
            </button>
          </div>

          <div className="divide-y divide-gray-50">
            {top5Alertes.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle2 size={24} className="mx-auto mb-2 text-green-400" />
                <p className="text-sm text-gray-500">Aucune alerte non lue</p>
              </div>
            ) : (
              top5Alertes.map((a) => (
                <div
                  key={a.id}
                  className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50/50 cursor-pointer"
                  onClick={() => navigate(a.lien)}
                >
                  <div
                    className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
                      a.niveau === "CRITIQUE"
                        ? "bg-red-500"
                        : a.niveau === "URGENT"
                        ? "bg-orange-500"
                        : "bg-yellow-400"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {a.titre}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <NiveauBadge niveau={a.niveau} />
                      <span className="text-xs text-gray-400">{a.module}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
