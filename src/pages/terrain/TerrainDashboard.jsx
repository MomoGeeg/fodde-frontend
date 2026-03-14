import { useTerrainKpi, useFormulairesAssignes, useMesSoumissions } from "@/api/terrain.api";
import useAuthStore from "@/stores/auth.store";
import {
  AlertTriangle,
  CheckCircle,
  ClipboardList,
  Clock,
  FileText,
  MapPin,
  TrendingUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const STATUT_SOUMISSION = {
  VALIDE:     { label: "Validée",     color: "bg-green-100 text-green-700" },
  EN_ATTENTE: { label: "En attente",  color: "bg-yellow-100 text-yellow-700" },
  REJETE:     { label: "Rejetée",     color: "bg-red-100 text-red-700" },
};

export default function TerrainDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { data: kpi = {} } = useTerrainKpi();
  const { data: formulaires = [] } = useFormulairesAssignes();
  const { data: soumissions = [] } = useMesSoumissions();

  const formulairesActifs = formulaires.filter((f) => f.statut === "PUBLIE");
  const soumissionsRecentes = soumissions.slice(0, 4);

  // Formulaires proches de l'échéance (≤ 5 jours)
  const today = new Date();
  const urgents = formulairesActifs.filter((f) => {
    if (!f.dateEcheance) return false;
    const diff = (new Date(f.dateEcheance) - today) / (1000 * 60 * 60 * 24);
    return diff <= 5 && diff >= 0;
  });

  return (
    <div className="space-y-6">
      {/* Alerte échéances */}
      {urgents.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3">
          <AlertTriangle size={18} className="text-orange-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-orange-800">
              {urgents.length} formulaire(s) à remplir avant le{" "}
              {new Date(urgents[0].dateEcheance).toLocaleDateString("fr-FR")}
            </p>
            <p className="text-xs text-orange-600 mt-0.5">
              {urgents.map((f) => f.titre).join(", ")}
            </p>
          </div>
        </div>
      )}

      {/* Bonjour */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">
          Bonjour, {user?.prenom || "Agent"} 👋
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Voici un résumé de votre activité terrain
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Formulaires actifs"
          value={kpi.formulairesActifs ?? 0}
          icon={ClipboardList}
          color="text-blue-600"
          bg="bg-blue-50"
          onClick={() => navigate("/terrain/collecte")}
        />
        <KpiCard
          label="Soumissions ce mois"
          value={kpi.soumissionsMois ?? 0}
          icon={TrendingUp}
          color="text-green-600"
          bg="bg-green-50"
        />
        <KpiCard
          label="Soumissions validées"
          value={kpi.soumissionsValidees ?? 0}
          icon={CheckCircle}
          color="text-emerald-600"
          bg="bg-emerald-50"
        />
        <KpiCard
          label="Rapports soumis"
          value={kpi.rapportsSoumis ?? 0}
          icon={FileText}
          color="text-purple-600"
          bg="bg-purple-50"
          onClick={() => navigate("/terrain/rapports")}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulaires à remplir */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Formulaires à remplir</h3>
            <button
              onClick={() => navigate("/terrain/collecte")}
              className="text-xs text-primary font-medium hover:underline"
            >
              Voir tout
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {formulairesActifs.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-gray-400">
                Aucun formulaire actif
              </p>
            ) : (
              formulairesActifs.slice(0, 3).map((f) => {
                const jours = f.dateEcheance
                  ? Math.ceil((new Date(f.dateEcheance) - today) / (1000 * 60 * 60 * 24))
                  : null;
                return (
                  <div key={f.id} className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 shrink-0">
                      <ClipboardList size={16} className="text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{f.titre}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{f.projetCode} · {f.nbChamps} champs</p>
                    </div>
                    {jours !== null && (
                      <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 font-medium ${
                        jours <= 2 ? "bg-red-100 text-red-700"
                        : jours <= 5 ? "bg-orange-100 text-orange-700"
                        : "bg-gray-100 text-gray-600"
                      }`}>
                        {jours <= 0 ? "Expiré" : `J-${jours}`}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Soumissions récentes */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Dernières soumissions</h3>
            <button
              onClick={() => navigate("/terrain/collecte")}
              className="text-xs text-primary font-medium hover:underline"
            >
              Voir tout
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {soumissionsRecentes.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-gray-400">
                Aucune soumission
              </p>
            ) : (
              soumissionsRecentes.map((s) => {
                const meta = STATUT_SOUMISSION[s.statut] ?? { label: s.statut, color: "bg-gray-100 text-gray-600" };
                return (
                  <div key={s.id} className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50 shrink-0">
                      <MapPin size={16} className="text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{s.formulaireTitre}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {s.localisation} · {new Date(s.dateCollecte).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 font-medium ${meta.color}`}>
                      {meta.label}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Agenda — prochaines échéances */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Agenda — Prochaines échéances</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {formulairesActifs
            .filter((f) => f.dateEcheance)
            .sort((a, b) => new Date(a.dateEcheance) - new Date(b.dateEcheance))
            .slice(0, 4)
            .map((f) => {
              const jours = Math.ceil((new Date(f.dateEcheance) - today) / (1000 * 60 * 60 * 24));
              return (
                <div key={f.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50">
                  <div className="shrink-0 w-12 text-center">
                    <p className="text-lg font-bold text-gray-900 leading-none">
                      {new Date(f.dateEcheance).getDate()}
                    </p>
                    <p className="text-[10px] text-gray-400 uppercase leading-tight">
                      {new Date(f.dateEcheance).toLocaleDateString("fr-FR", { month: "short" })}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{f.titre}</p>
                    <p className="text-xs text-gray-400">{f.projetCode} · {f.responsable}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={13} className="text-gray-300 shrink-0" />
                    <span className={`text-xs font-medium ${jours <= 3 ? "text-red-600" : "text-gray-500"}`}>
                      {jours <= 0 ? "Expiré" : `Dans ${jours} j`}
                    </span>
                  </div>
                </div>
              );
            })}
          {formulairesActifs.filter((f) => f.dateEcheance).length === 0 && (
            <p className="px-5 py-6 text-center text-sm text-gray-400">Aucune échéance à venir</p>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, icon: Icon, color, bg, onClick }) {
  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 shadow-sm p-5 ${onClick ? "cursor-pointer hover:border-primary/40 transition-colors" : ""}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}>
          <Icon size={20} className={color} />
        </div>
      </div>
    </div>
  );
}
