import useAuthStore from "@/stores/auth.store";
import {
  AlertTriangle,
  BarChart3,
  Filter,
  Lock,
  Plus,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  createSEHelpers,
  FREQUENCES_COLLECTE,
  STATUT_COLORS,
  UNITES_MESURE,
  useCollectes,
  useIndicateurs,
  useMembres,
  useProjets,
} from "./se-data";

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

// ════════════════════════════════════════════════════════════
// PAGE — Liste des indicateurs
// ════════════════════════════════════════════════════════════
export default function SEIndicateursList() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const isResponsableSE = user?.roles?.includes("ROLE_RESPONSABLE_SE");
  const isRP = user?.roles?.includes("ROLE_RESPONSABLE_PROGRAMMES");
  const isCP = user?.roles?.includes("ROLE_CHARGE_PROGRAMME");

  // Données Supabase
  const { data: projets = [] } = useProjets();
  const { data: indicateursData = [] } = useIndicateurs();
  const { data: membres = [] } = useMembres();
  const { data: collectes = [] } = useCollectes();

  const { getProjet, getMembre, getTauxAtteinte, getCollectesForIndicateur } =
    createSEHelpers(projets, membres, indicateursData, collectes, [], []);

  // Filtres
  const [search, setSearch] = useState("");
  const [filterProjet, setFilterProjet] = useState(
    searchParams.get("projet") || "TOUS",
  );
  const [filterFrequence, setFilterFrequence] = useState("TOUS");
  const [filterPerformance, setFilterPerformance] = useState("TOUS");
  const [showFilters, setShowFilters] = useState(false);

  // Indicateurs filtrés par rôle
  const indicateursBase = useMemo(() => {
    if (isResponsableSE) return indicateursData; // Tous
    if (isRP) return indicateursData; // Tous en lecture seule
    if (isCP) {
      // Ses projets affectés uniquement
      const projetsAffectes = ["p001", "p002", "p003"]; // mock
      return indicateursData.filter((i) =>
        projetsAffectes.includes(i.projetId),
      );
    }
    return indicateursData;
  }, [isResponsableSE, isRP, isCP, indicateursData]);

  // Application des filtres
  const indicateurs = useMemo(() => {
    let list = [...indicateursBase];

    if (filterProjet !== "TOUS") {
      list = list.filter((i) => i.projetId === filterProjet);
    }
    if (filterFrequence !== "TOUS") {
      list = list.filter((i) => i.frequence === filterFrequence);
    }
    if (filterPerformance !== "TOUS") {
      list = list.filter((i) => {
        const taux = getTauxAtteinte(i);
        if (filterPerformance === "BONNE_VOIE") return taux >= 75;
        if (filterPerformance === "EN_RETARD") return taux >= 50 && taux < 75;
        if (filterPerformance === "CRITIQUE") return taux < 50;
        return true;
      });
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (i) =>
          i.code.toLowerCase().includes(q) ||
          i.libelle.toLowerCase().includes(q) ||
          getProjet(i.projetId)?.titre.toLowerCase().includes(q),
      );
    }
    return list;
  }, [
    indicateursBase,
    filterProjet,
    filterFrequence,
    filterPerformance,
    search,
    projets,
    collectes,
  ]);

  const activeFilters = [
    filterProjet,
    filterFrequence,
    filterPerformance,
  ].filter((f) => f !== "TOUS").length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Indicateurs</h1>
          <p className="mt-1 text-sm text-gray-500">
            {indicateurs.length} indicateur{indicateurs.length !== 1 ? "s" : ""}
            {isRP && " — lecture seule"}
          </p>
        </div>
        {isResponsableSE && (
          <Link
            to="/se/indicateurs/nouveau"
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-sm"
            style={{ background: "linear-gradient(135deg, #5A9C3A, #4A7C2F)" }}
          >
            <Plus size={16} />
            Nouvel indicateur
          </Link>
        )}
      </div>

      {/* Recherche + Filtres */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-2.5 text-gray-400"
          />
          <input
            type="text"
            placeholder="Rechercher un indicateur..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm text-gray-700 shadow-sm focus:border-green-500 focus:outline-none"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
            activeFilters > 0
              ? "border-green-300 bg-green-50 text-green-700"
              : "border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          <Filter size={13} />
          Filtres
          {activeFilters > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-green-600 text-[9px] text-white">
              {activeFilters}
            </span>
          )}
        </button>
      </div>

      {/* Panneau filtres */}
      {showFilters && (
        <div className="flex flex-wrap gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <select
            value={filterProjet}
            onChange={(e) => setFilterProjet(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600 focus:border-green-500 focus:outline-none"
          >
            <option value="TOUS">Tous les projets</option>
            {projets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.titre}
              </option>
            ))}
          </select>
          <select
            value={filterFrequence}
            onChange={(e) => setFilterFrequence(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600 focus:border-green-500 focus:outline-none"
          >
            <option value="TOUS">Toutes fréquences</option>
            {FREQUENCES_COLLECTE.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
          <select
            value={filterPerformance}
            onChange={(e) => setFilterPerformance(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600 focus:border-green-500 focus:outline-none"
          >
            <option value="TOUS">Toute performance</option>
            <option value="BONNE_VOIE">En bonne voie (≥ 75%)</option>
            <option value="EN_RETARD">En retard (50-75%)</option>
            <option value="CRITIQUE">Critique (&lt; 50%)</option>
          </select>
          {activeFilters > 0 && (
            <button
              onClick={() => {
                setFilterProjet("TOUS");
                setFilterFrequence("TOUS");
                setFilterPerformance("TOUS");
              }}
              className="text-xs text-red-500 hover:text-red-700"
            >
              Réinitialiser
            </button>
          )}
        </div>
      )}

      {/* Tableau */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left">
              <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                Code
              </th>
              <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                Libellé
              </th>
              <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                Unité
              </th>
              <th className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                Baseline
              </th>
              <th className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                Cible
              </th>
              <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                Fréquence
              </th>
              <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                Projet
              </th>
              <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                Resp. collecte
              </th>
              <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400 w-40">
                Taux atteinte
              </th>
              <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                Statut
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {indicateurs.map((ind) => {
              const projet = getProjet(ind.projetId);
              const resp = getMembre(ind.responsableId);
              const taux = getTauxAtteinte(ind);
              const collectes = getCollectesForIndicateur(ind.id);
              const noCollecte = collectes.length === 0;
              const projetCloture = projet?.statut === "CLOTURE";

              return (
                <tr
                  key={ind.id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/se/indicateurs/${ind.id}`)}
                >
                  <td className="px-4 py-3 font-mono text-xs font-medium text-gray-500">
                    {ind.code}
                  </td>
                  <td className="px-4 py-3 max-w-[200px]">
                    <p className="font-medium text-gray-900 truncate">
                      {ind.libelle}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {UNITES_MESURE.find((u) => u.value === ind.unite)?.label ??
                      ind.unite}
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-gray-500">
                    {ind.valeurBaseline}
                  </td>
                  <td className="px-4 py-3 text-center text-xs font-semibold text-gray-700">
                    {ind.valeurCible}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {FREQUENCES_COLLECTE.find((f) => f.value === ind.frequenceCollecte)
                      ?.label ?? ind.frequenceCollecte}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-[150px] truncate">
                    {projet?.code}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {resp ? `${resp.prenom} ${resp.nom}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <ProgressBar taux={taux} />
                      </div>
                      <span
                        className={`text-xs font-bold w-10 text-right ${
                          taux >= 75
                            ? "text-green-600"
                            : taux >= 50
                              ? "text-orange-600"
                              : "text-red-600"
                        }`}
                      >
                        {taux}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUT_COLORS[ind.statut]}`}
                      >
                        {ind.statut}
                      </span>
                      {taux < 50 && ind.statut === "ACTIF" && (
                        <span className="flex items-center gap-0.5 rounded-full bg-red-100 px-1.5 py-0.5 text-[9px] font-bold text-red-700">
                          <AlertTriangle size={8} /> &lt;50%
                        </span>
                      )}
                      {noCollecte && ind.statut === "ACTIF" && (
                        <span className="rounded-full bg-orange-100 px-1.5 py-0.5 text-[9px] font-bold text-orange-700">
                          Sans collecte
                        </span>
                      )}
                      {projetCloture && (
                        <span className="flex items-center gap-0.5 rounded-full bg-gray-200 px-1.5 py-0.5 text-[9px] font-bold text-gray-500">
                          <Lock size={8} /> Verrouillé
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {indicateurs.length === 0 && (
          <div className="px-6 py-16 text-center">
            <BarChart3 className="mx-auto mb-3 text-gray-300" size={40} />
            <p className="text-sm text-gray-400">Aucun indicateur trouvé.</p>
          </div>
        )}
      </div>
    </div>
  );
}
