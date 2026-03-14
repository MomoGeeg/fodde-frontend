import {
  useLogistiqueKpi,
  useVehicules,
  useBiens,
} from "@/api/logistique.api";
import {
  AlertTriangle,
  Box,
  Car,
  CheckCircle,
  Truck,
  Wrench,
} from "lucide-react";
import { Link } from "react-router-dom";

const ETAT_BIEN_LABEL = {
  NEUF: "Neuf",
  BON_ETAT: "Bon état",
  USE: "Usagé",
  EN_REPARATION: "En réparation",
  HORS_SERVICE: "Hors service",
};

const ETAT_BIEN_COLOR = {
  NEUF: "bg-emerald-100 text-emerald-700",
  BON_ETAT: "bg-green-100 text-green-700",
  USE: "bg-yellow-100 text-yellow-700",
  EN_REPARATION: "bg-orange-100 text-orange-700",
  HORS_SERVICE: "bg-red-100 text-red-700",
};

const ETAT_VEH_COLOR = {
  BON: "bg-green-100 text-green-700",
  MOYEN: "bg-yellow-100 text-yellow-700",
  A_REVISER: "bg-orange-100 text-orange-700",
  HORS_SERVICE: "bg-red-100 text-red-700",
};

export default function LogistiqueDashboard() {
  const { data: kpi = {}, isLoading: kpiLoading } = useLogistiqueKpi();
  const { data: biens = [] } = useBiens();
  const { data: vehicules = [] } = useVehicules();

  const alertesVehicules = vehicules.filter(
    (v) => v.alerteAssurance || v.alerteVisite || v.alerteKilometrage
  );
  const biensStat = biens.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={<Box size={22} className="text-blue-600" />}
          bg="bg-blue-50"
          label="Équipements actifs"
          value={kpiLoading ? "…" : kpi.biensActifs ?? 0}
        />
        <KpiCard
          icon={<Car size={22} className="text-emerald-600" />}
          bg="bg-emerald-50"
          label="Véhicules"
          value={kpiLoading ? "…" : kpi.totalVehicules ?? 0}
        />
        <KpiCard
          icon={<Wrench size={22} className="text-orange-600" />}
          bg="bg-orange-50"
          label="Hors service"
          value={kpiLoading ? "…" : kpi.biensHorsService ?? 0}
        />
        <KpiCard
          icon={<AlertTriangle size={22} className="text-red-600" />}
          bg="bg-red-50"
          label="Alertes véhicules"
          value={kpiLoading ? "…" : kpi.totalAlertes ?? 0}
          highlight={kpi.totalAlertes > 0}
        />
      </div>

      {/* Alertes véhicules */}
      {alertesVehicules.length > 0 && (
        <section className="bg-white rounded-xl border border-red-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-red-100 flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-500" />
            <h2 className="text-sm font-semibold text-red-700">
              Alertes — {alertesVehicules.length} véhicule(s) à traiter
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {alertesVehicules.map((v) => (
              <div
                key={v.id}
                className="flex items-center justify-between px-5 py-3 hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <Truck size={16} className="text-gray-400 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {v.immatriculation} — {v.marque} {v.modele}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {v.alerteAssurance && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                          Assurance expire dans {v.joursAvantAssurance}j
                        </span>
                      )}
                      {v.alerteVisite && (
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                          Visite technique dans {v.joursAvantVisite}j
                        </span>
                      )}
                      {v.alerteKilometrage && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                          Révision km requise ({v.kilometrageActuel?.toLocaleString("fr-SN")} km)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${ETAT_VEH_COLOR[v.etat] ?? ""}`}
                >
                  {v.etat?.replace("_", " ")}
                </span>
              </div>
            ))}
          </div>
          <div className="px-5 py-2 border-t border-gray-100 bg-gray-50">
            <Link
              to="/logistique/vehicules"
              className="text-xs text-blue-600 hover:underline"
            >
              Gérer le parc de véhicules →
            </Link>
          </div>
        </section>
      )}

      {/* Inventaire récent + Véhicules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Équipements récents */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">
              Équipements récents
            </h2>
            <Link
              to="/logistique/inventaire"
              className="text-xs text-blue-600 hover:underline"
            >
              Voir tout
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {biensStat.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">
                Aucun équipement enregistré
              </p>
            )}
            {biensStat.map((b) => (
              <div key={b.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Box size={16} className="text-gray-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {b.designation}
                    </p>
                    <p className="text-xs text-gray-500">
                      {b.codeActif} · {b.localisationActuelle || "—"}
                    </p>
                  </div>
                </div>
                <span
                  className={`ml-3 shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                    ETAT_BIEN_COLOR[b.etat] ?? "bg-gray-100 text-gray-600"
                  }`}
                >
                  {ETAT_BIEN_LABEL[b.etat] ?? b.etat}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Parc véhicules */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">
              Parc véhicules
            </h2>
            <Link
              to="/logistique/vehicules"
              className="text-xs text-blue-600 hover:underline"
            >
              Voir tout
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {vehicules.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">
                Aucun véhicule enregistré
              </p>
            )}
            {vehicules.map((v) => (
              <div key={v.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  {(v.alerteAssurance || v.alerteVisite || v.alerteKilometrage) ? (
                    <AlertTriangle size={16} className="text-red-500 shrink-0" />
                  ) : (
                    <CheckCircle size={16} className="text-green-500 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {v.immatriculation}
                    </p>
                    <p className="text-xs text-gray-500">
                      {v.marque} {v.modele} · {v.kilometrageActuel?.toLocaleString("fr-SN")} km
                    </p>
                  </div>
                </div>
                <span
                  className={`ml-3 shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                    ETAT_VEH_COLOR[v.etat] ?? "bg-gray-100 text-gray-600"
                  }`}
                >
                  {v.etat?.replace("_", " ")}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function KpiCard({ icon, bg, label, value, highlight = false }) {
  return (
    <div
      className={`bg-white rounded-xl border shadow-sm p-4 flex items-center gap-4 ${
        highlight ? "border-red-300" : "border-gray-200"
      }`}
    >
      <div className={`rounded-xl p-3 ${bg}`}>{icon}</div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p
          className={`text-2xl font-bold ${
            highlight ? "text-red-600" : "text-gray-900"
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
