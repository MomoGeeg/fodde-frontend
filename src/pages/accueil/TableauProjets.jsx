import { Link } from "react-router-dom";
import Jauge from "@/components/demande/Jauge";
import { Bloc, Vide } from "@/components/tableau/Blocs";
import { dateCourte, montant } from "@/lib/format";

const STATUTS_PROJET = {
  ACTIF: { libelle: "En cours", classe: "bg-green-50 text-green-700" },
  SUSPENDU: { libelle: "Suspendu", classe: "bg-amber-50 text-amber-800" },
  EN_CLOTURE: { libelle: "En clôture", classe: "bg-blue-50 text-blue-700" },
};

/** Projets en cours : bailleurs, période, budget, consommation, activités, état et alertes. */
export default function TableauProjets({ lignesProjets, chargement }) {
  return (
    <Bloc titre="Projets en cours" lien="/projets" libelleLien="Tous les projets">
      {chargement ? (
        <Vide>Chargement…</Vide>
      ) : lignesProjets.length === 0 ? (
        <Vide>Aucun projet en cours.</Vide>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                <th className="px-4 py-2.5">Projet</th>
                <th className="px-4 py-2.5">Période</th>
                <th className="px-4 py-2.5 text-right">Budget</th>
                <th className="w-40 px-4 py-2.5">Consommé</th>
                <th className="px-4 py-2.5 text-center">Activités</th>
                <th className="px-4 py-2.5">État</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {lignesProjets.map((l) => {
                const statut = STATUTS_PROJET[l.projet.statut];
                return (
                  <tr key={l.projet.id} className="align-top hover:bg-gray-50/60">
                    <td className="px-4 py-3">
                      <Link to={`/projets/${l.projet.id}`} className="font-medium text-gray-900 hover:text-primary">
                        {l.projet.titre}
                      </Link>
                      <p className="text-xs text-gray-500">
                        {l.projet.code}
                        {l.bailleurs.length > 0 && ` · ${l.bailleurs.join(", ")}`}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-600 tabular-nums">
                      {dateCourte(l.projet.dateDebut)}
                      <br />
                      {dateCourte(l.projet.dateFin)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-gray-900">{montant(l.budget)}</td>
                    <td className="px-4 py-3">
                      <Link to={`/finances/budgets/${l.projet.id}`} title="Suivi budgétaire">
                        <Jauge taux={l.taux} />
                        <span className="text-xs text-gray-500 tabular-nums">{montant(l.depense)}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-center tabular-nums text-gray-700">
                      {l.totalActivites ? `${l.realisees}/${l.totalActivites}` : "—"}
                      {l.retards > 0 && <p className="text-xs font-medium text-red-600">{l.retards} en retard</p>}
                    </td>
                    <td className="px-4 py-3">
                      {statut && (
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statut.classe}`}>
                          {statut.libelle}
                        </span>
                      )}
                      {l.alertes.map((a) => (
                        <p key={a} className="mt-1 text-xs font-medium text-amber-700">
                          {a}
                        </p>
                      ))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Bloc>
  );
}
