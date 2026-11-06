import { SEUIL_ALERTE, totaux, useLignesDesProjets, useProjets } from "@/api/budgets";
import Jauge from "@/components/demande/Jauge";
import { montant } from "@/lib/format";
import { useNavigate } from "react-router-dom";

const STATUTS_VISIBLES = ["ACTIF", "EN_VALIDATION", "SUSPENDU", "CLOTURE"];
const LIBELLE_STATUT = { ACTIF: "Actif", EN_VALIDATION: "En validation", SUSPENDU: "Suspendu", CLOTURE: "Clôturé" };

/** Vue d'ensemble : consommation du budget de chaque projet. Un clic ouvre le suivi détaillé. */
export default function BudgetsPage() {
  const navigate = useNavigate();
  const { data: projets = [], isLoading } = useProjets();
  const visibles = projets
    .filter((p) => STATUTS_VISIBLES.includes(p.statut))
    .sort((a, b) => STATUTS_VISIBLES.indexOf(a.statut) - STATUTS_VISIBLES.indexOf(b.statut) || a.code.localeCompare(b.code));
  const lignesParProjet = useLignesDesProjets(visibles);

  const lignesProjets = visibles.map((p, i) => {
    const lignes = lignesParProjet[i]?.data ?? [];
    const t = totaux(lignes);
    // Sans ligne budgétaire, on retient le budget total déclaré du projet.
    return { projet: p, ...t, prevu: lignes.length ? t.prevu : Number(p.budgetTotal) || 0, sansLignes: !lignes.length, chargement: lignesParProjet[i]?.isLoading };
  });
  const global = lignesProjets.reduce(
    (s, l) => ({ prevu: s.prevu + l.prevu, depense: s.depense + l.depense }),
    { prevu: 0, depense: 0 },
  );
  const alertes = lignesProjets.filter((l) => l.taux >= SEUIL_ALERTE).length;

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Budget prévu", montant(global.prevu)],
          ["Dépensé (validé)", montant(global.depense)],
          ["Solde", montant(global.prevu - global.depense)],
          ["Projets au-delà de 80 %", alertes],
        ].map(([libelle, valeur]) => (
          <div key={libelle} className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-xs text-gray-500">{libelle}</p>
            <p className="mt-1 text-lg font-semibold text-gray-900 tabular-nums">{isLoading ? "…" : valeur}</p>
          </div>
        ))}
      </section>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        {isLoading ? (
          <p className="px-4 py-8 text-center text-sm text-gray-500">Chargement…</p>
        ) : lignesProjets.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-gray-500">Aucun projet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="hidden border-b border-gray-200 bg-gray-50 text-left text-xs text-gray-500 md:table-header-group">
              <tr>
                <th className="px-4 py-2 font-medium">Projet</th>
                <th className="px-4 py-2 text-right font-medium">Prévu</th>
                <th className="px-4 py-2 text-right font-medium">Dépensé</th>
                <th className="px-4 py-2 text-right font-medium">Solde</th>
                <th className="w-48 px-4 py-2 font-medium">Consommation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lignesProjets.map(({ projet: p, prevu, depense, taux, sansLignes, chargement }) => (
                <tr
                  key={p.id}
                  onClick={() => navigate(`/finances/budgets/${p.id}`)}
                  className="grid cursor-pointer grid-cols-2 gap-x-3 gap-y-1 px-4 py-3 hover:bg-gray-50 md:table-row"
                >
                  <td className="col-span-2 md:px-4 md:py-3">
                    <span className="font-medium text-gray-900">{p.code}</span>
                    <span className="block text-xs text-gray-500">
                      {p.titre} · {LIBELLE_STATUT[p.statut] ?? p.statut}
                      {sansLignes && !chargement ? " · aucune ligne budgétaire" : ""}
                    </span>
                  </td>
                  <td className="tabular-nums text-gray-700 md:px-4 md:py-3 md:text-right">
                    <span className="text-xs text-gray-500 md:hidden">Prévu </span>
                    {montant(prevu, p.devise)}
                  </td>
                  <td className="tabular-nums text-gray-700 md:px-4 md:py-3 md:text-right">
                    <span className="text-xs text-gray-500 md:hidden">Dépensé </span>
                    {montant(depense, p.devise)}
                  </td>
                  <td className="hidden tabular-nums text-gray-900 md:table-cell md:px-4 md:py-3 md:text-right">
                    {montant(prevu - depense, p.devise)}
                  </td>
                  <td className="col-span-2 md:px-4 md:py-3">
                    <Jauge taux={taux} />
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
