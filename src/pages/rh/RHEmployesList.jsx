import useAuthStore from "@/stores/auth.store";
import {
  AlertTriangle,
  Clock,
  Plus,
  Search,
  TrendingDown,
  UserCheck,
  Users,
  UserX,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { joursRestants, urgenceContrat, useConges, useEmployes } from "./rh-data";

// ── Constantes ─────────────────────────────────────────────
const STATUT_COLORS = {
  ACTIF: "bg-green-100 text-green-700",
  EN_CONGE: "bg-blue-100 text-blue-700",
  SUSPENDU: "bg-orange-100 text-orange-700",
  PARTI: "bg-gray-100 text-gray-400",
};
const STATUT_LABELS = {
  ACTIF: "Actif",
  EN_CONGE: "En congé",
  SUSPENDU: "Suspendu",
  PARTI: "Parti",
};

const TYPE_CONTRAT_LABELS = {
  CDI: "CDI",
  CDD: "CDD",
  CONSULTANT: "Consultant",
  VOLONTAIRE: "Volontaire",
  STAGIAIRE: "Stagiaire",
};

const FILTRES_STATUT = ["TOUS", "ACTIF", "EN_CONGE", "SUSPENDU", "PARTI"];
const FILTRES_CONTRAT = [
  "TOUS",
  "CDI",
  "CDD",
  "CONSULTANT",
  "VOLONTAIRE",
  "STAGIAIRE",
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

function UrgenceBadge({ dateFin }) {
  const urgence = urgenceContrat(dateFin);
  if (!urgence) return null;
  const j = joursRestants(dateFin);
  const styles = {
    CRITIQUE: "bg-red-100 text-red-700",
    DANGER: "bg-orange-100 text-orange-700",
    WARNING: "bg-yellow-100 text-yellow-700",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${styles[urgence]}`}
    >
      <AlertTriangle size={10} />
      {j}j
    </span>
  );
}

export default function RHEmployesList() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { data: fetchedEmployes = [] } = useEmployes();
  const { data: fetchedConges = [] } = useConges();
  const DEPARTEMENTS = useMemo(
    () => [
      ...new Set(fetchedEmployes.map((e) => e.departement).filter(Boolean)),
    ],
    [fetchedEmployes],
  );

  const isRH = user?.roles?.some((r) => ["ROLE_RH", "ROLE_ADMIN"].includes(r));
  const isSE = user?.roles?.includes("ROLE_SE");
  const isRP = user?.roles?.includes("ROLE_RESPONSABLE_PROGRAMMES");
  const isRAF = user?.roles?.includes("ROLE_RAF");
  const canSeeAll = isRH || isSE || isRP || isRAF;
  const canSeeContrats = isRH || isSE || isRAF;

  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState("TOUS");
  const [filterContrat, setFilterContrat] = useState("TOUS");
  const [filterService, setFilterService] = useState("TOUS");

  const baseEmployes = canSeeAll
    ? fetchedEmployes
    : fetchedEmployes.filter((e) => e.userId === user?.id);

  // Calcul dynamique : employé "en congé" si congé APPROUVE non encore terminé
  const enCongeIds = useMemo(() => {
    const ids = new Set();
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    // YYYY-MM-DD en heure locale (évite les décalages UTC)
    const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    fetchedConges.forEach((c) => {
      if (c.statut !== "APPROUVE") return;
      // Inclure si la date de fin est aujourd'hui ou dans le futur
      if (c.dateFin >= todayStr) ids.add(c.employeId);
    });
    return ids;
  }, [fetchedConges]);

  // Enrichir avec le statut effectif
  const allEmployes = useMemo(
    () =>
      baseEmployes.map((e) => ({
        ...e,
        statutEffectif: enCongeIds.has(e.id) ? "EN_CONGE" : e.statut,
      })),
    [baseEmployes, enCongeIds],
  );

  // ── Stats ──────────────────────────────────────────────────
  const nbActifs    = allEmployes.filter((e) => e.statutEffectif === "ACTIF").length;
  const nbConge     = allEmployes.filter((e) => e.statutEffectif === "EN_CONGE").length;
  const nbSuspendus = allEmployes.filter((e) => e.statutEffectif === "SUSPENDU").length;
  const contratsUrgents = allEmployes.filter(
    (e) => urgenceContrat(e.dateFinContrat) === "CRITIQUE" || urgenceContrat(e.dateFinContrat) === "DANGER",
  );

  // ── Alertes ────────────────────────────────────────────────
  const alertesCritiques = allEmployes.filter(
    (e) => urgenceContrat(e.dateFinContrat) === "CRITIQUE",
  );
  const alertesDanger = allEmployes.filter(
    (e) => urgenceContrat(e.dateFinContrat) === "DANGER",
  );
  const alertesSuspendus = allEmployes.filter((e) => e.statutEffectif === "SUSPENDU");

  const employes = allEmployes.filter((e) => {
    const q = search.toLowerCase();
    const matchSearch =
      !search ||
      e.nom.toLowerCase().includes(q) ||
      e.prenom.toLowerCase().includes(q) ||
      e.matricule.toLowerCase().includes(q) ||
      e.poste.toLowerCase().includes(q);
    const matchStatut = filterStatut === "TOUS" || e.statutEffectif === filterStatut;
    const matchContrat =
      filterContrat === "TOUS" || e.typeContrat === filterContrat;
    const matchService =
      filterService === "TOUS" || e.departement === filterService;
    return matchSearch && matchStatut && matchContrat && matchService;
  });

  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("fr-FR") : "—");

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Personnel</h1>
          <p className="mt-1 text-sm text-gray-500">
            {allEmployes.length} employé{allEmployes.length !== 1 ? "s" : ""} au total
          </p>
        </div>
        {isRH && (
          <button
            onClick={() => navigate("/rh/employes/nouveau")}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white transition-colors"
            style={{ background: "linear-gradient(135deg, #5A9C3A, #4A7C2F)" }}
          >
            <Plus size={16} />
            Nouveau dossier
          </button>
        )}
      </div>

      {/* KPI Cards — visibles RAF, RH, SE */}
      {canSeeAll && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            {
              label: "Employés actifs",
              value: nbActifs,
              icon: UserCheck,
              color: "text-green-600",
              bg: "bg-green-50",
            },
            {
              label: "En congé",
              value: nbConge,
              icon: Clock,
              color: "text-blue-600",
              bg: "bg-blue-50",
            },
            {
              label: "Suspendus",
              value: nbSuspendus,
              icon: UserX,
              color: "text-orange-600",
              bg: "bg-orange-50",
            },
            {
              label: "Contrats urgents",
              value: contratsUrgents.length,
              icon: TrendingDown,
              color: contratsUrgents.length > 0 ? "text-red-600" : "text-gray-500",
              bg: contratsUrgents.length > 0 ? "bg-red-50" : "bg-gray-50",
            },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${bg}`}>
                <Icon size={18} className={color} />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Alertes — affichées uniquement si pertinentes */}
      {canSeeAll && (alertesCritiques.length > 0 || alertesDanger.length > 0 || alertesSuspendus.length > 0) && (
        <div className="space-y-2">
          {/* Contrats expirant dans < 7 jours */}
          {alertesCritiques.length > 0 && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-500" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-800">
                  {alertesCritiques.length} contrat{alertesCritiques.length > 1 ? "s" : ""} expire{alertesCritiques.length > 1 ? "nt" : ""} dans moins de 7 jours
                </p>
                <p className="mt-0.5 text-xs text-red-600">
                  {alertesCritiques.map((e) => `${e.prenom} ${e.nom} (${joursRestants(e.dateFinContrat)}j)`).join(" · ")}
                </p>
              </div>
            </div>
          )}

          {/* Contrats expirant dans 7–30 jours */}
          {alertesDanger.length > 0 && (
            <div className="flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-orange-500" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-orange-800">
                  {alertesDanger.length} contrat{alertesDanger.length > 1 ? "s" : ""} à renouveler dans 30 jours
                </p>
                <p className="mt-0.5 text-xs text-orange-600">
                  {alertesDanger.map((e) => `${e.prenom} ${e.nom} (${joursRestants(e.dateFinContrat)}j)`).join(" · ")}
                </p>
              </div>
            </div>
          )}

          {/* Employés suspendus */}
          {alertesSuspendus.length > 0 && (
            <div className="flex items-start gap-3 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3">
              <Users size={16} className="mt-0.5 shrink-0 text-yellow-600" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-yellow-800">
                  {alertesSuspendus.length} employé{alertesSuspendus.length > 1 ? "s" : ""} suspendu{alertesSuspendus.length > 1 ? "s" : ""}
                </p>
                <p className="mt-0.5 text-xs text-yellow-700">
                  {alertesSuspendus.map((e) => `${e.prenom} ${e.nom}`).join(" · ")}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recherche + Filtres */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
        <div className="relative max-w-sm flex-1">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-2.5 text-gray-400"
          />
          <input
            type="text"
            placeholder="Rechercher par nom, matricule, poste..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm text-gray-700 shadow-sm focus:border-green-500 focus:outline-none"
          />
        </div>

        <select
          value={filterService}
          onChange={(e) => setFilterService(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600 focus:border-green-500 focus:outline-none"
        >
          <option value="TOUS">Tous les services</option>
          {DEPARTEMENTS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        {canSeeContrats && (
          <select
            value={filterContrat}
            onChange={(e) => setFilterContrat(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600 focus:border-green-500 focus:outline-none"
          >
            <option value="TOUS">Tous contrats</option>
            {Object.entries(TYPE_CONTRAT_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Filtres statut */}
      <div className="flex flex-wrap gap-1.5">
        {FILTRES_STATUT.map((s) => (
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

      {/* Tableau */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {employes.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Users className="mx-auto mb-3 text-gray-300" size={40} />
            <p className="text-sm text-gray-400">
              {search || filterStatut !== "TOUS" || filterContrat !== "TOUS"
                ? "Aucun employé ne correspond aux filtres."
                : "Aucun employé trouvé."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Matricule
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Nom / Prénom
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Poste
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Service
                  </th>
                  {canSeeContrats && (
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Contrat
                    </th>
                  )}
                  {canSeeContrats && (
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Fin contrat
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {employes.map((emp) => {
                  const isParti = emp.statut === "PARTI";
                  const urgence = urgenceContrat(emp.dateFinContrat);
                  return (
                    <tr
                      key={emp.id}
                      onClick={() => navigate(String(emp.id))}
                      className={`cursor-pointer transition-colors hover:bg-gray-50 ${isParti ? "opacity-50" : ""} ${urgence === "CRITIQUE" ? "bg-red-50/40" : ""}`}
                    >
                      <td className="px-6 py-4 text-xs font-mono text-gray-600">
                        {emp.matricule}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700 shrink-0">
                            {emp.prenom?.[0]}
                            {emp.nom?.[0]}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {emp.nom} {emp.prenom}
                            </p>
                            <p className="text-xs text-gray-400">
                              {emp.telephone}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {emp.poste}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {emp.departement}
                      </td>
                      {canSeeContrats && (
                        <td className="px-6 py-4">
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                            {TYPE_CONTRAT_LABELS[emp.typeContrat] ?? emp.typeContrat ?? "—"}
                          </span>
                        </td>
                      )}
                      {canSeeContrats && (
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">
                              {fmtDate(emp.dateFinContrat)}
                            </span>
                            <UrgenceBadge dateFin={emp.dateFinContrat} />
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <StatusBadge statut={emp.statutEffectif} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
