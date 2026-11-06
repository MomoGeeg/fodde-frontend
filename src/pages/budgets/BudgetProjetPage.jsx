import {
  depensesValideesSur,
  nombre,
  tauxLigne,
  totaux,
  useDepensesProjet,
  useLignes,
  useProjets,
} from "@/api/budgets";
import { MODES_PAIEMENT } from "@/api/depenses";
import Jauge from "@/components/demande/Jauge";
import { telechargerCsv } from "@/lib/export";
import { dateCourte, montant } from "@/lib/format";
import { ArrowLeft, FileSpreadsheet, Printer } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

const aujourdhui = () => new Date().toISOString().slice(0, 10);
const libellePeriode = (du, au) =>
  du || au ? `du ${du ? dateCourte(du) : "début du projet"} au ${au ? dateCourte(au) : dateCourte(aujourdhui())}` : "depuis le début du projet";

/**
 * Suivi budgétaire d'un projet : prévu / dépensé par ligne, dépenses validées
 * sur une période, export Excel et impression (PDF) pour le rapport au bailleur.
 */
export default function BudgetProjetPage() {
  const { projet_id: id } = useParams();
  const { data: projets = [], isLoading: chargementProjets } = useProjets();
  const projet = projets.find((p) => p.id === id);
  const { data: lignes = [], isLoading: chargementLignes } = useLignes(id);
  const { data: depenses } = useDepensesProjet(id);
  const [du, setDu] = useState("");
  const [au, setAu] = useState("");

  const devise = projet?.devise ?? "XOF";
  const t = totaux(lignes);
  const validees = useMemo(() => depensesValideesSur(depenses ?? [], du, au), [depenses, du, au]);
  const parLigne = useMemo(() => {
    const m = new Map();
    for (const d of validees) m.set(d.ligneBudgetaireId, (m.get(d.ligneBudgetaireId) ?? 0) + nombre(d.montant));
    return m;
  }, [validees]);
  const totalPeriode = validees.reduce((s, d) => s + nombre(d.montant), 0);
  const lignesTriees = [...lignes].sort((a, b) => (a.code ?? "").localeCompare(b.code ?? ""));
  const avecPeriode = !!(du || au);

  const exporter = () => {
    const periode = libellePeriode(du, au);
    telechargerCsv(`Suivi_budgetaire_${projet.code}_${aujourdhui()}`, [
      ["ONG FODDE — Suivi budgétaire"],
      ["Projet", `${projet.code} — ${projet.titre}`],
      ["Période des dépenses", periode],
      ["Édité le", dateCourte(aujourdhui())],
      [],
      ["Code", "Ligne budgétaire", "Catégorie", "Prévu", `Dépensé (${periode})`, "Dépensé cumulé", "Solde", "Taux de consommation"],
      ...lignesTriees.map((l) => [
        l.code,
        l.intitule,
        l.categorie,
        nombre(l.montantPrevu),
        parLigne.get(l.id) ?? 0,
        nombre(l.montantDepense),
        nombre(l.montantPrevu) - nombre(l.montantDepense),
        `${Math.round(tauxLigne(l) * 100)} %`,
      ]),
      ["", "Total", "", t.prevu, totalPeriode, t.depense, t.solde, `${Math.round(t.taux * 100)} %`],
      [],
      [`Dépenses validées (${periode})`],
      ["N° pièce", "Date", "Libellé", "Bénéficiaire", "Ligne", "Mode de paiement", "Montant"],
      ...[...validees]
        .sort((a, b) => a.dateDepense.localeCompare(b.dateDepense))
        .map((d) => [d.numeroPiece, dateCourte(d.dateDepense), d.libelle, d.beneficiaire, d.ligneBudgetaireCode, MODES_PAIEMENT[d.modePaiement] ?? d.modePaiement, nombre(d.montant)]),
      ["", "", "", "", "", "Total", totalPeriode],
    ]);
  };

  if (chargementProjets) return <p className="text-sm text-gray-500">Chargement…</p>;
  if (!projet)
    return (
      <div className="space-y-4">
        <Link to="/finances/budgets" className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft size={16} /> Budgets
        </Link>
        <p className="text-sm text-gray-600">Projet introuvable.</p>
      </div>
    );

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      {/* En-tête visible uniquement à l'impression */}
      <div className="hidden print:block">
        <p className="text-sm font-semibold">ONG FODDE — Suivi budgétaire</p>
        <p className="text-xs">Édité le {dateCourte(aujourdhui())}</p>
      </div>

      <Link to="/finances/budgets" className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 print:hidden">
        <ArrowLeft size={16} /> Budgets
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs text-gray-500">{projet.code}</p>
          <h2 className="text-lg font-semibold text-gray-900">{projet.titre}</h2>
          <p className="text-xs text-gray-500">
            Projet du {dateCourte(projet.dateDebut)} au {dateCourte(projet.dateFin)} · dépenses {libellePeriode(du, au)}
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2 print:hidden">
          <label className="text-xs text-gray-600">
            Du
            <input type="date" value={du} max={au || undefined} onChange={(e) => setDu(e.target.value)} className="mt-1 block rounded-md border border-gray-300 px-2 py-1.5 text-sm" />
          </label>
          <label className="text-xs text-gray-600">
            Au
            <input type="date" value={au} min={du || undefined} onChange={(e) => setAu(e.target.value)} className="mt-1 block rounded-md border border-gray-300 px-2 py-1.5 text-sm" />
          </label>
          <button
            onClick={exporter}
            disabled={chargementLignes}
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <FileSpreadsheet size={16} /> Excel
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-dark"
          >
            <Printer size={16} /> Imprimer / PDF
          </button>
        </div>
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Budget prévu", montant(t.prevu, devise)],
          ["Dépensé (cumul validé)", montant(t.depense, devise)],
          ["Solde disponible", montant(t.solde, devise)],
          [avecPeriode ? "Dépensé sur la période" : "Taux de consommation", avecPeriode ? montant(totalPeriode, devise) : `${Math.round(t.taux * 100)} %`],
        ].map(([libelle, valeur]) => (
          <div key={libelle} className="rounded-lg border border-gray-200 bg-white p-4 print:border-gray-400">
            <p className="text-xs text-gray-500">{libelle}</p>
            <p className="mt-1 text-lg font-semibold text-gray-900 tabular-nums">{chargementLignes ? "…" : valeur}</p>
          </div>
        ))}
      </section>

      <section className="overflow-x-auto rounded-lg border border-gray-200 bg-white print:overflow-visible">
        <h3 className="border-b border-gray-100 px-4 py-3 text-sm font-semibold text-gray-900">Lignes budgétaires</h3>
        {chargementLignes ? (
          <p className="px-4 py-6 text-sm text-gray-500">Chargement…</p>
        ) : lignesTriees.length === 0 ? (
          <p className="px-4 py-6 text-sm text-gray-500">
            Aucune ligne budgétaire pour ce projet. Elles se créent depuis le budget annuel (allocation au projet).
          </p>
        ) : (
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs text-gray-500">
              <tr>
                <th className="px-4 py-2 font-medium">Ligne</th>
                <th className="px-4 py-2 text-right font-medium">Prévu</th>
                {avecPeriode && <th className="px-4 py-2 text-right font-medium">Période</th>}
                <th className="px-4 py-2 text-right font-medium">Dépensé</th>
                <th className="px-4 py-2 text-right font-medium">Solde</th>
                <th className="w-44 px-4 py-2 font-medium">Consommation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lignesTriees.map((l) => (
                <tr key={l.id}>
                  <td className="px-4 py-2.5">
                    <span className="text-gray-900">
                      {l.code} — {l.intitule}
                    </span>
                    <span className="block text-xs text-gray-500">
                      {l.categorie}
                      {l.estGelee ? " · gelée" : ""}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{montant(l.montantPrevu, devise)}</td>
                  {avecPeriode && <td className="px-4 py-2.5 text-right tabular-nums">{montant(parLigne.get(l.id) ?? 0, devise)}</td>}
                  <td className="px-4 py-2.5 text-right tabular-nums">{montant(l.montantDepense, devise)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{montant(nombre(l.montantPrevu) - nombre(l.montantDepense), devise)}</td>
                  <td className="px-4 py-2.5">
                    <Jauge taux={tauxLigne(l)} />
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-semibold">
                <td className="px-4 py-2.5">Total</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{montant(t.prevu, devise)}</td>
                {avecPeriode && <td className="px-4 py-2.5 text-right tabular-nums">{montant(totalPeriode, devise)}</td>}
                <td className="px-4 py-2.5 text-right tabular-nums">{montant(t.depense, devise)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{montant(t.solde, devise)}</td>
                <td className="px-4 py-2.5">
                  <Jauge taux={t.taux} />
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </section>

      <section className="overflow-x-auto rounded-lg border border-gray-200 bg-white print:overflow-visible">
        <h3 className="border-b border-gray-100 px-4 py-3 text-sm font-semibold text-gray-900">
          Dépenses validées {libellePeriode(du, au)}
        </h3>
        {depenses === null ? (
          <p className="px-4 py-6 text-sm text-gray-500">Le détail des dépenses n'est pas accessible avec votre rôle.</p>
        ) : validees.length === 0 ? (
          <p className="px-4 py-6 text-sm text-gray-500">Aucune dépense validée sur cette période.</p>
        ) : (
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs text-gray-500">
              <tr>
                <th className="px-4 py-2 font-medium">Pièce</th>
                <th className="px-4 py-2 font-medium">Libellé</th>
                <th className="px-4 py-2 font-medium">Ligne</th>
                <th className="px-4 py-2 text-right font-medium">Montant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[...validees]
                .sort((a, b) => a.dateDepense.localeCompare(b.dateDepense))
                .map((d) => (
                  <tr key={d.id}>
                    <td className="px-4 py-2.5">
                      <Link to={`/finances/depenses/${d.id}`} className="text-gray-900 hover:underline">
                        {d.numeroPiece}
                      </Link>
                      <span className="block text-xs text-gray-500">{dateCourte(d.dateDepense)}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      {d.libelle}
                      <span className="block text-xs text-gray-500">{d.beneficiaire}</span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-700">{d.ligneBudgetaireCode}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{montant(d.montant, d.devise)}</td>
                  </tr>
                ))}
              <tr className="bg-gray-50 font-semibold">
                <td className="px-4 py-2.5" colSpan={3}>
                  Total
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums">{montant(totalPeriode, devise)}</td>
              </tr>
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
