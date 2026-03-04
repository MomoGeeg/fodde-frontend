import useAuthStore from "@/stores/auth.store";
import {
  AlertTriangle,
  CheckCircle,
  ClipboardList,
  Eye,
  FileText,
  Filter,
  Lock,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  createSEHelpers,
  STATUT_COLORS,
  STATUTS_FORMULAIRE,
  useFormulaires,
  useMembres,
  useProjets,
  useReponsesEnAttente,
} from "./se-data";

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

// ════════════════════════════════════════════════════════════
// PAGE 5 — Liste des formulaires de collecte
// ════════════════════════════════════════════════════════════
export default function SEFormulairesList() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const isResponsableSE = user?.roles?.includes("ROLE_RESPONSABLE_SE");
  const isRP = user?.roles?.includes("ROLE_RESPONSABLE_PROGRAMMES");
  const isCP = user?.roles?.includes("ROLE_CHARGE_PROGRAMME");
  // Données Supabase
  const { data: projets = [] } = useProjets();
  const { data: allFormulaires = [] } = useFormulaires();
  const { data: membres = [] } = useMembres();
  const { data: reponsesData = [] } = useReponsesEnAttente();

  const { getProjet, getMembre, getReponsesForFormulaire } = createSEHelpers(
    projets,
    membres,
    [],
    [],
    allFormulaires,
    reponsesData,
  );
  // ── Filtres ───────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [filterProjet, setFilterProjet] = useState("all");
  const [filterStatut, setFilterStatut] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // ── Données ──────────────────────────────────────────────
  const formulaires = useMemo(() => {
    let list = [...allFormulaires];

    // CP ne voit que ses projets
    if (isCP) {
      const mes = ["p001", "p002", "p003"]; // mock
      list = list.filter((f) => mes.includes(f.projetId));
    }

    // Filtres
    if (filterProjet !== "all") {
      list = list.filter((f) => f.projetId === filterProjet);
    }
    if (filterStatut !== "all") {
      list = list.filter((f) => f.statut === filterStatut);
    }
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(
        (f) =>
          f.titre.toLowerCase().includes(s) ||
          getProjet(f.projetId)?.titre?.toLowerCase().includes(s),
      );
    }

    return list;
  }, [search, filterProjet, filterStatut, isCP, allFormulaires, projets]);

  const activeFilters = [filterProjet, filterStatut].filter(
    (f) => f !== "all",
  ).length;

  return (
    <div className="space-y-5">
      {/* Barre d'actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Recherche */}
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={15}
            />
            <input
              type="text"
              placeholder="Rechercher un formulaire…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm shadow-sm focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-100 w-64"
            />
          </div>

          {/* Toggle filtres */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium shadow-sm transition-colors ${
              showFilters || activeFilters
                ? "border-green-300 bg-green-50 text-green-700"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Filter size={13} />
            Filtres
            {activeFilters > 0 && (
              <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-green-600 text-[9px] text-white">
                {activeFilters}
              </span>
            )}
          </button>
        </div>

        {/* Bouton créer */}
        {isResponsableSE && (
          <Link
            to="/se/formulaires/nouveau"
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white shadow-sm"
            style={{
              background: "linear-gradient(135deg, #5A9C3A, #4A7C2F)",
            }}
          >
            <Plus size={15} />
            Nouveau formulaire
          </Link>
        )}
      </div>

      {/* Filtres étendus */}
      {showFilters && (
        <div className="flex flex-wrap gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Projet
            </label>
            <select
              value={filterProjet}
              onChange={(e) => setFilterProjet(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs focus:border-green-400 focus:ring-2 focus:ring-green-100"
            >
              <option value="all">Tous les projets</option>
              {projets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.titre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Statut
            </label>
            <select
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs focus:border-green-400 focus:ring-2 focus:ring-green-100"
            >
              <option value="all">Tous</option>
              {STATUTS_FORMULAIRE.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Statistiques rapides */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: "Total",
            value: allFormulaires.length,
            icon: FileText,
            color: "text-blue-600 bg-blue-50",
          },
          {
            label: "Publiés",
            value: allFormulaires.filter((f) => f.statut === "PUBLIE").length,
            icon: CheckCircle,
            color: "text-green-600 bg-green-50",
          },
          {
            label: "Brouillons",
            value: allFormulaires.filter((f) => f.statut === "BROUILLON")
              .length,
            icon: ClipboardList,
            color: "text-orange-600 bg-orange-50",
          },
          {
            label: "Clôturés",
            value: allFormulaires.filter((f) => f.statut === "CLOTURE").length,
            icon: Lock,
            color: "text-gray-600 bg-gray-100",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm"
          >
            <div className={`rounded-lg p-2 ${s.color}`}>
              <s.icon size={16} />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{s.value}</p>
              <p className="text-[10px] text-gray-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tableau */}
      {formulaires.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
          <ClipboardList className="mx-auto mb-3 text-gray-300" size={40} />
          <p className="text-sm text-gray-400">Aucun formulaire trouvé.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left">
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  Titre
                </th>
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  Projet
                </th>
                <th className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  Champs
                </th>
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  Collecteurs
                </th>
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  Date pub.
                </th>
                <th className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  Réponses
                </th>
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  Statut
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {formulaires.map((form) => {
                const projet = getProjet(form.projetId);
                const collecteurs = form.collecteursIds?.map(getMembre) ?? [];
                const reponses = getReponsesForFormulaire(form.id);
                const enAttente = reponses.filter(
                  (r) => r.statut === "EN_ATTENTE",
                ).length;

                return (
                  <tr
                    key={form.id}
                    className="cursor-pointer transition-colors hover:bg-gray-50"
                    onClick={() => navigate(`/se/formulaires/${form.id}`)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileText
                          size={14}
                          className="shrink-0 text-gray-400"
                        />
                        <span className="font-medium text-gray-900">
                          {form.titre}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      <span className="font-mono text-[10px] text-gray-400">
                        {projet?.code}
                      </span>{" "}
                      {projet?.titre}
                    </td>
                    <td className="px-4 py-3 text-center text-xs font-semibold text-gray-700">
                      {form.champs?.length ?? 0}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Users size={12} className="text-gray-400" />
                        <span className="text-xs text-gray-600">
                          {collecteurs
                            .slice(0, 2)
                            .map((m) =>
                              m ? `${m.prenom} ${m.nom?.charAt(0)}.` : "—",
                            )
                            .join(", ")}
                          {collecteurs.length > 2 &&
                            ` +${collecteurs.length - 2}`}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {fmtDate(form.datePublication)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs font-semibold text-gray-700">
                        {reponses.length}
                      </span>
                      {enAttente > 0 && (
                        <span className="ml-1.5 inline-flex items-center gap-0.5 rounded-full bg-orange-100 px-1.5 py-0.5 text-[9px] font-bold text-orange-700">
                          <AlertTriangle size={8} />
                          {enAttente} en attente
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${STATUT_COLORS[form.statut]}`}
                      >
                        {STATUTS_FORMULAIRE.find((s) => s.value === form.statut)
                          ?.label ?? form.statut}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        title="Voir détail"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/se/formulaires/${form.id}`);
                        }}
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
