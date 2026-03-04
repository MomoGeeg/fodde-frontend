import useAuthStore from "@/stores/auth.store";
import { AlertTriangle, Plus, Search, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { joursRestants, urgenceContrat, useEmployes } from "./rh-data";

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

function Skeleton() {
  return (
    <div className="divide-y divide-gray-100">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-6 py-4">
          <div className="h-9 w-9 animate-pulse rounded-full bg-gray-200" />
          <div className="space-y-1.5 flex-1">
            <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
            <div className="h-3 w-28 animate-pulse rounded bg-gray-200" />
          </div>
          <div className="h-6 w-16 animate-pulse rounded-full bg-gray-200" />
        </div>
      ))}
    </div>
  );
}

export default function RHEmployesList() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { data: fetchedEmployes = [] } = useEmployes();
  const DEPARTEMENTS = useMemo(
    () => [
      ...new Set(fetchedEmployes.map((e) => e.departement).filter(Boolean)),
    ],
    [fetchedEmployes],
  );

  const isRH = user?.roles?.some((r) => ["ROLE_RH", "ROLE_ADMIN"].includes(r));
  const isSE = user?.roles?.includes("ROLE_SE");
  const isRP = user?.roles?.includes("ROLE_RESPONSABLE_PROGRAMMES");
  const canSeeAll = isRH || isSE || isRP;
  const canSeeContrats = isRH || isSE; // RP ne voit pas les contrats

  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState("TOUS");
  const [filterContrat, setFilterContrat] = useState("TOUS");
  const [filterService, setFilterService] = useState("TOUS");

  // Pour un employé simple : ne voir que lui-même
  const allEmployes = canSeeAll
    ? fetchedEmployes
    : fetchedEmployes.filter((e) => e.userId === user?.userId);

  const employes = allEmployes.filter((e) => {
    const q = search.toLowerCase();
    const matchSearch =
      !search ||
      e.nom.toLowerCase().includes(q) ||
      e.prenom.toLowerCase().includes(q) ||
      e.matricule.toLowerCase().includes(q) ||
      e.poste.toLowerCase().includes(q);
    const matchStatut = filterStatut === "TOUS" || e.statut === filterStatut;
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
            {allEmployes.length} employé{allEmployes.length !== 1 ? "s" : ""} au
            total
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

        {/* Filtre service */}
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

        {/* Filtre type contrat — masqué pour RP */}
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
                  return (
                    <tr
                      key={emp.id}
                      onClick={() => navigate(`/rh/employes/${emp.id}`)}
                      className={`cursor-pointer transition-colors hover:bg-gray-50 ${isParti ? "opacity-50" : ""}`}
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
                            {TYPE_CONTRAT_LABELS[emp.typeContrat] ??
                              emp.typeContrat}
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
                        <StatusBadge statut={emp.statut} />
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
