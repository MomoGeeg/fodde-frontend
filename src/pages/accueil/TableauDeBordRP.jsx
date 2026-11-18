import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { Bloc, Carte } from "@/components/tableau/Blocs";
import { dateCourte, montant } from "@/lib/format";
import { enRetard, joursAvant, usePortefeuille } from "./portefeuille";
import TableauProjets from "./TableauProjets";

// ─────────────────────────────────────────────────────────────────────────────
// Accueil du responsable des programmes : ce qu'il doit valider, les chiffres
// clés du portefeuille, l'état de chaque projet en cours et les activités à suivre.
// ─────────────────────────────────────────────────────────────────────────────

export default function TableauDeBordRP() {
  const {
    projets,
    chargeProjets,
    chargeBudget,
    chargeActivites,
    lignesProjets,
    toutesActivites,
    retards,
    actifs,
    termines,
    budgetTotal,
    prevuTotal,
    depenseTotal,
  } = usePortefeuille();

  // ── À valider ─────────────────────────────────────────────────────────────
  const renvoyes = projets.filter((p) => p.statut === "BROUILLON" && p.motifRenvoi);
  const brouillons = projets.filter((p) => p.statut === "BROUILLON" && !p.motifRenvoi);
  const aValider = [
    ...renvoyes.map((p) => ({
      id: `r-${p.id}`,
      lien: `/projets/${p.id}`,
      type: "Projet renvoyé",
      titre: p.titre,
      detail: p.motifRenvoi,
    })),
    ...brouillons.map((p) => ({
      id: `b-${p.id}`,
      lien: `/projets/${p.id}`,
      type: "À soumettre",
      titre: p.titre,
      detail: p.code,
    })),
  ];

  // ── Activités à suivre : en retard, puis celles qui démarrent dans 15 jours ─
  const prochaines = toutesActivites
    .filter((a) => !enRetard(a) && a.statut === "PLANIFIEE" && a.datePrevuDebut)
    .filter((a) => {
      const j = joursAvant(a.datePrevuDebut);
      return j >= 0 && j <= 15;
    });
  const aSuivre = [
    ...retards.sort((a, b) => String(a.datePrevuFin).localeCompare(String(b.datePrevuFin))).map((a) => ({ ...a, retard: true })),
    ...prochaines.sort((a, b) => String(a.datePrevuDebut).localeCompare(String(b.datePrevuDebut))),
  ].slice(0, 10);

  return (
    <div className="space-y-6">
      <Bloc titre={`À valider${aValider.length ? ` (${aValider.length})` : ""}`}>
        {chargeProjets ? (
          <p className="px-4 py-6 text-sm text-gray-500">Chargement…</p>
        ) : aValider.length ? (
          <ul className="divide-y divide-gray-100">
            {aValider.map((v) => (
              <li key={v.id}>
                <Link to={v.lien} className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50">
                  <span className="w-28 shrink-0 text-xs font-medium text-primary">{v.type}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-gray-900">{v.titre}</span>
                    {v.detail && <span className="block truncate text-xs text-gray-500">{v.detail}</span>}
                  </span>
                  <ChevronRight size={16} className="shrink-0 text-gray-400" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-4 py-6 text-sm text-gray-500">Rien à valider.</p>
        )}
      </Bloc>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <Carte libelle="Projets en cours" valeur={actifs.length} chargement={chargeProjets} />
        <Carte libelle="Projets terminés" valeur={termines.length} chargement={chargeProjets} />
        <Carte libelle="Budget des projets en cours" valeur={montant(budgetTotal)} chargement={chargeBudget} />
        <Carte
          libelle="Dépensé"
          valeur={montant(depenseTotal)}
          detail={prevuTotal > 0 ? `${Math.round((depenseTotal / prevuTotal) * 100)} % du budget ventilé` : null}
          chargement={chargeBudget}
        />
        <Carte libelle="Activités en retard" valeur={retards.length} chargement={chargeActivites} />
      </section>

      <TableauProjets lignesProjets={lignesProjets} chargement={chargeProjets} />

      <Bloc titre="Activités à suivre">
        {chargeActivites ? (
          <p className="px-4 py-6 text-sm text-gray-500">Chargement…</p>
        ) : aSuivre.length === 0 ? (
          <p className="px-4 py-6 text-sm text-gray-500">Aucune activité en retard ni prévue dans les 15 jours.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {aSuivre.map((a) => (
              <li key={a.id}>
                <Link to={`/projets/${a.projetId}`} className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50">
                  <span
                    className={`w-24 shrink-0 text-xs font-medium ${a.retard ? "text-red-600" : "text-gray-500"}`}
                  >
                    {a.retard ? "En retard" : `Début ${dateCourte(a.datePrevuDebut)}`}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-gray-900">{a.titre}</span>
                    <span className="block truncate text-xs text-gray-500">
                      {a.projet?.code}
                      {a.responsableNom && ` · ${a.responsableNom}`}
                      {a.retard && a.datePrevuFin && ` · fin prévue ${dateCourte(a.datePrevuFin)}`}
                    </span>
                  </span>
                  {a.tauxAvancement != null && (
                    <span className="shrink-0 text-xs tabular-nums text-gray-500">{a.tauxAvancement} %</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Bloc>
    </div>
  );
}
