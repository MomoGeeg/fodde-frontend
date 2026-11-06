import StatutBadge from "@/components/demande/StatutBadge";
import { Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

/**
 * Liste commune à toutes les demandes (dépenses, missions, acquisitions, congés).
 * Deux vues : « À traiter » (ce qui attend une action de l'utilisateur) et
 * « Toutes » ; recherche, filtre de statut ; lignes cliquables vers la fiche.
 *
 * @param {object[]} demandes
 * @param {(d) => boolean} aTraiter       vrai si la demande attend l'utilisateur
 * @param {object} statuts                 { CODE: { label, ton } }
 * @param {{titre, rendu: (d) => node, droite?: boolean}[]} colonnes  avant la colonne Statut
 * @param {(d) => string[]} texteRecherche champs fouillés par la recherche
 * @param {(d) => string} lien             adresse de la fiche
 * @param {{label, to}} [nouveau]          bouton de création (si autorisé)
 * @param {(d) => string} [tri]            clé de tri décroissant (par défaut createdAt)
 */
export default function ListeDemandes({
  demandes = [],
  isLoading,
  isError,
  aTraiter,
  statuts,
  colonnes,
  texteRecherche,
  lien,
  nouveau,
  placeholder = "Rechercher…",
  tri = (d) => d.createdAt ?? "",
}) {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const vue = params.get("vue") === "toutes" ? "toutes" : "a-traiter";
  const [recherche, setRecherche] = useState("");
  const [statut, setStatut] = useState("");

  const enAttente = useMemo(() => demandes.filter(aTraiter), [demandes, aTraiter]);

  const affichees = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return (vue === "a-traiter" ? enAttente : demandes)
      .filter((d) => !statut || d.statut === statut)
      .filter((d) => !q || texteRecherche(d).some((v) => v?.toString().toLowerCase().includes(q)))
      .sort((a, b) => tri(b).localeCompare(tri(a)));
  }, [vue, enAttente, demandes, statut, recherche, texteRecherche, tri]);

  const changerVue = (v) => setParams(v === "toutes" ? { vue: "toutes" } : {}, { replace: true });

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-md border border-gray-200 bg-white p-0.5 text-sm">
          {[
            ["a-traiter", `À traiter (${enAttente.length})`],
            ["toutes", "Toutes"],
          ].map(([v, label]) => (
            <button
              key={v}
              onClick={() => changerVue(v)}
              className={`rounded px-3 py-1.5 ${vue === v ? "bg-primary text-white" : "text-gray-700 hover:bg-gray-50"}`}
            >
              {label}
            </button>
          ))}
        </div>
        {nouveau && (
          <Link
            to={nouveau.to}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
          >
            <Plus size={16} /> {nouveau.label}
          </Link>
        )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-md border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm focus:border-primary focus:outline-none"
          />
        </label>
        <select
          value={statut}
          onChange={(e) => setStatut(e.target.value)}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
          aria-label="Statut"
        >
          <option value="">Tous les statuts</option>
          {Object.entries(statuts).map(([code, s]) => (
            <option key={code} value={code}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        {isLoading ? (
          <p className="px-4 py-8 text-center text-sm text-gray-500">Chargement…</p>
        ) : isError ? (
          <p className="px-4 py-8 text-center text-sm text-danger">Impossible de charger la liste.</p>
        ) : affichees.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-gray-500">
            {vue === "a-traiter" ? "Rien ne vous attend ici." : "Aucune demande."}
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="hidden border-b border-gray-200 bg-gray-50 text-left text-xs text-gray-500 md:table-header-group">
              <tr>
                {colonnes.map((c) => (
                  <th key={c.titre} className={`px-4 py-2 font-medium ${c.droite ? "text-right" : ""}`}>
                    {c.titre}
                  </th>
                ))}
                <th className="px-4 py-2 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {affichees.map((d) => (
                <tr
                  key={d.id}
                  onClick={() => navigate(lien(d))}
                  className="flex cursor-pointer flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 hover:bg-gray-50 md:table-row"
                >
                  {colonnes.map((c, i) => (
                    <td
                      key={c.titre}
                      className={`md:px-4 md:py-3 ${i === 1 ? "w-full md:w-auto" : ""} ${c.droite ? "font-medium tabular-nums md:text-right" : ""}`}
                    >
                      {c.rendu(d)}
                    </td>
                  ))}
                  <td className="md:px-4 md:py-3">
                    <StatutBadge statut={d.statut} statuts={statuts} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
