import {
  depensesValideesSur,
  nombre,
  tauxLigne,
  totaux,
  useDepensesProjet,
  useLignes,
  useProjets,
} from "@/api/budgets";
import { GESTIONNAIRES_BAILLEURS, useFinancements } from "@/api/bailleurs";
import { MODES_PAIEMENT } from "@/api/depenses";
import Jauge from "@/components/demande/Jauge";
import { telechargerCsv } from "@/lib/export";
import { dateCourte, montant } from "@/lib/format";
import { aAcces } from "@/lib/navigation";
import useAuthStore from "@/stores/auth.store";
import { ArrowLeft, FileSpreadsheet, Handshake, Plus, Printer } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";

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
  const { user } = useAuthStore();
  const [params, setParams] = useSearchParams();
  const { data: financements = [] } = useFinancements({ projetId: id });
  const convention = financements.find((f) => f.id === params.get("convention"));
  const peutGererBailleurs = aAcces(user?.roles ?? [], GESTIONNAIRES_BAILLEURS);

  /** Choisir une convention cale la période sur ses dates ; « Tout le projet » revient au suivi général. */
  const choisirConvention = (fid) => {
    const f = financements.find((x) => x.id === fid);
    setParams(f ? { convention: f.id } : {}, { replace: true });
    setDu(f?.dateDebut ?? "");
    setAu(f?.dateFin ?? "");
  };
  // Arrivée depuis la fiche d'un bailleur (?convention=…) : caler la période une fois chargée.
  useEffect(() => {
    if (convention) {
      setDu(convention.dateDebut ?? ""); // eslint-disable-line react-hooks/set-state-in-effect
      setAu(convention.dateFin ?? "");
    }
  }, [convention]);

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
  const accorde = convention ? nombre(convention.montantAccorde) : 0;
  const titreRapport = convention
    ? `Rapport financier — ${convention.bailleurNom}${convention.bailleurSigle ? ` (${convention.bailleurSigle})` : ""}`
    : "Suivi budgétaire";

  const exporter = () => {
    const periode = libellePeriode(du, au);
    const nomFichier = convention
      ? `Rapport_${convention.bailleurSigle || convention.bailleurNom}_${projet.code}_${aujourdhui()}`
      : `Suivi_budgetaire_${projet.code}_${aujourdhui()}`;
    telechargerCsv(nomFichier, [
      [`ONG FODDE — ${titreRapport}`],
      ["Projet", `${projet.code} — ${projet.titre}`],
      ...(convention
        ? [
            ["Bailleur", convention.bailleurNom],
            ["Convention", convention.referenceConvention],
            ["Montant accordé", accorde, convention.devise],
            ["Dépensé sur la période", totalPeriode],
            ["Solde de la convention", accorde - totalPeriode],
          ]
        : []),
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
        <p className="text-sm font-semibold">ONG FODDE — {titreRapport}</p>
        {convention && (
          <p className="text-xs">
            Convention {convention.referenceConvention} · période {libellePeriode(du, au)}
          </p>
        )}
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
          {financements.length > 0 && (
            <label className="text-xs text-gray-600">
              Rapport pour
              <select
                value={convention?.id ?? ""}
                onChange={(e) => choisirConvention(e.target.value)}
                className="mt-1 block rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm"
              >
                <option value="">Tout le projet</option>
                {financements.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.bailleurSigle || f.bailleurNom} — {f.referenceConvention}
                  </option>
                ))}
              </select>
            </label>
          )}
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

      {convention && (
        <div className="flex gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-gray-800 print:hidden">
          <Handshake size={18} className="mt-0.5 shrink-0 text-primary" />
          <p>
            Rapport pour <strong>{convention.bailleurNom}</strong>, convention {convention.referenceConvention}. La période
            est calée sur la convention. Les dépenses comptées sont toutes les dépenses validées du projet sur cette
            période : si le projet a plusieurs bailleurs, elles ne sont pas réparties entre eux.
          </p>
        </div>
      )}

      {convention && (
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            ["Montant accordé", montant(accorde, convention.devise)],
            ["Dépensé sur la période", montant(totalPeriode, devise)],
            ["Solde de la convention", montant(accorde - totalPeriode, convention.devise)],
            ["Taux d'utilisation", `${accorde > 0 ? Math.round((totalPeriode / accorde) * 100) : 0} %`],
          ].map(([libelle, valeur]) => (
            <div key={libelle} className="rounded-lg border border-primary/30 bg-white p-4 print:border-gray-400">
              <p className="text-xs text-gray-500">{libelle}</p>
              <p className="mt-1 text-lg font-semibold text-gray-900 tabular-nums">{valeur}</p>
            </div>
          ))}
        </section>
      )}

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

      <section className="rounded-lg border border-gray-200 bg-white print:hidden">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <h3 className="text-sm font-semibold text-gray-900">Financements du projet</h3>
          {peutGererBailleurs && (
            <Link
              to={`/financements/nouveau?projet=${projet.id}`}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <Plus size={14} /> Ajouter une convention
            </Link>
          )}
        </div>
        {financements.length === 0 ? (
          <p className="px-4 py-6 text-sm text-gray-500">Aucune convention de financement enregistrée pour ce projet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {financements.map((f) => (
              <li key={f.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                <span>
                  <span className="text-gray-900">
                    {f.bailleurNom} — {f.referenceConvention}
                  </span>
                  <span className="block text-xs text-gray-500">
                    {f.dateDebut || f.dateFin ? `${dateCourte(f.dateDebut)} → ${dateCourte(f.dateFin)}` : "Période non précisée"}
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <span className="font-medium tabular-nums">{montant(f.montantAccorde, f.devise)}</span>
                  <button onClick={() => choisirConvention(f.id)} className="text-xs font-medium text-primary hover:underline">
                    Voir le rapport
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
