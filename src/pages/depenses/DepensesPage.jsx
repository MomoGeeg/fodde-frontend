import { STATUTS_DEPENSE, dateCourte, estATraiter, montant, useDepenses } from "@/api/depenses";
import StatutBadge from "@/components/demande/StatutBadge";
import { R, aAcces } from "@/lib/navigation";
import useAuthStore from "@/stores/auth.store";
import { Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

/**
 * Liste des dépenses. Deux vues : « À traiter » (ce qui attend une action de
 * l'utilisateur) et « Toutes ». Un clic ouvre la fiche.
 */
export default function DepensesPage() {
  const { user } = useAuthStore();
  const roles = useMemo(() => user?.roles ?? [], [user]);
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const vue = params.get("vue") === "toutes" ? "toutes" : "a-traiter";

  const [recherche, setRecherche] = useState("");
  const [statut, setStatut] = useState("");
  const [projet, setProjet] = useState("");

  const { data: depenses = [], isLoading, isError } = useDepenses();
  const peutCreer = aAcces(roles, [R.COMPTABLE, R.RAF]);

  const aTraiter = useMemo(() => depenses.filter((d) => estATraiter(d, roles, user?.id)), [depenses, roles, user?.id]);
  const projets = useMemo(
    () => [...new Map(depenses.map((d) => [d.projetId, d.projetCode])).entries()].filter(([id]) => id),
    [depenses],
  );

  const affichees = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return (vue === "a-traiter" ? aTraiter : depenses)
      .filter((d) => !statut || d.statut === statut)
      .filter((d) => !projet || d.projetId === projet)
      .filter(
        (d) =>
          !q ||
          [d.numeroPiece, d.libelle, d.beneficiaire, d.saisiParNom].some((v) => v?.toLowerCase().includes(q)),
      )
      .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
  }, [vue, aTraiter, depenses, statut, projet, recherche]);

  const changerVue = (v) => setParams(v === "toutes" ? { vue: "toutes" } : {}, { replace: true });

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-md border border-gray-200 bg-white p-0.5 text-sm">
          {[
            ["a-traiter", `À traiter (${aTraiter.length})`],
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
        {peutCreer && (
          <Link
            to="/finances/depenses/nouvelle"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
          >
            <Plus size={16} /> Nouvelle dépense
          </Link>
        )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="N° de pièce, libellé, bénéficiaire…"
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
          {Object.entries(STATUTS_DEPENSE).map(([code, s]) => (
            <option key={code} value={code}>
              {s.label}
            </option>
          ))}
        </select>
        {projets.length > 1 && (
          <select
            value={projet}
            onChange={(e) => setProjet(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            aria-label="Projet"
          >
            <option value="">Tous les projets</option>
            {projets.map(([id, code]) => (
              <option key={id} value={id}>
                {code}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        {isLoading ? (
          <p className="px-4 py-8 text-center text-sm text-gray-500">Chargement…</p>
        ) : isError ? (
          <p className="px-4 py-8 text-center text-sm text-danger">Impossible de charger les dépenses.</p>
        ) : affichees.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-gray-500">
            {vue === "a-traiter" ? "Aucune dépense ne vous attend." : "Aucune dépense."}
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="hidden border-b border-gray-200 bg-gray-50 text-left text-xs text-gray-500 md:table-header-group">
              <tr>
                <th className="px-4 py-2 font-medium">Pièce</th>
                <th className="px-4 py-2 font-medium">Libellé</th>
                <th className="px-4 py-2 font-medium">Projet</th>
                <th className="px-4 py-2 text-right font-medium">Montant</th>
                <th className="px-4 py-2 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {affichees.map((d) => (
                <tr
                  key={d.id}
                  onClick={() => navigate(`/finances/depenses/${d.id}`)}
                  className="flex cursor-pointer flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 hover:bg-gray-50 md:table-row"
                >
                  <td className="md:px-4 md:py-3">
                    <span className="font-medium text-gray-900">{d.numeroPiece}</span>
                    <span className="block text-xs text-gray-500">{dateCourte(d.dateDepense)}</span>
                  </td>
                  <td className="w-full md:w-auto md:px-4 md:py-3">
                    <span className="text-gray-900">{d.libelle}</span>
                    <span className="block text-xs text-gray-500">
                      {d.beneficiaire}
                      {d.saisiParNom ? ` · saisie par ${d.saisiParNom}` : ""}
                    </span>
                  </td>
                  <td className="text-gray-700 md:px-4 md:py-3">
                    {d.projetCode}
                    <span className="block text-xs text-gray-500">{d.ligneBudgetaireCode}</span>
                  </td>
                  <td className="font-medium text-gray-900 tabular-nums md:px-4 md:py-3 md:text-right">
                    {montant(d.montant, d.devise)}
                  </td>
                  <td className="md:px-4 md:py-3">
                    <StatutBadge statut={d.statut} statuts={STATUTS_DEPENSE} />
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
