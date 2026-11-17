import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQueries, useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import api from "@/api/axios";
import { useFinancements, nomCourt } from "@/api/bailleurs";
import { totaux, useLignesDesProjets, useProjets, SEUIL_ALERTE } from "@/api/budgets";
import Jauge from "@/components/demande/Jauge";
import { Bloc, Carte } from "@/components/tableau/Blocs";
import { dateCourte, montant } from "@/lib/format";

// ─────────────────────────────────────────────────────────────────────────────
// Accueil du responsable des programmes : ce qu'il doit valider, les chiffres
// clés du portefeuille, l'état de chaque projet en cours et les activités à suivre.
// ─────────────────────────────────────────────────────────────────────────────

/** Projets suivis au quotidien (budget, activités). */
const EN_COURS = ["ACTIF", "SUSPENDU", "EN_CLOTURE"];
const TERMINES = ["CLOTURE", "ARCHIVE"];
const ACTIVITES_OUVERTES = ["PLANIFIEE", "EN_COURS", "EN_RETARD"];

const STATUTS_PROJET = {
  ACTIF: { libelle: "En cours", classe: "bg-green-50 text-green-700" },
  SUSPENDU: { libelle: "Suspendu", classe: "bg-amber-50 text-amber-800" },
  EN_CLOTURE: { libelle: "En clôture", classe: "bg-blue-50 text-blue-700" },
};

const JOUR = 86_400_000;
const aujourdhui = () => new Date(new Date().toISOString().slice(0, 10));
const joursAvant = (date) => Math.round((new Date(date) - aujourdhui()) / JOUR);

/** Une activité est en retard si elle est marquée comme telle ou si sa fin prévue est passée sans être réalisée. */
const enRetard = (a) =>
  a.statut === "EN_RETARD" || (ACTIVITES_OUVERTES.includes(a.statut) && a.datePrevuFin && joursAvant(a.datePrevuFin) < 0);

const liste = (r) => (Array.isArray(r.data) ? r.data : []);

function useActivitesDesProjets(projets) {
  return useQueries({
    queries: projets.map((p) => ({
      queryKey: ["activites", "projet", p.id],
      queryFn: async () => liste(await api.get(`/api/activites/projet/${p.id}`)),
      staleTime: 60_000,
    })),
  });
}

function useMissionsAApprouver(userId) {
  return useQuery({
    queryKey: ["accueil", "rp", "missions", userId],
    queryFn: async () =>
      liste(await api.get("/api/missions")).filter((m) => m.statut === "SOUMISE" && m.n1Id === userId),
    staleTime: 60_000,
  });
}

export default function TableauDeBordRP({ userId }) {
  const { data: projets = [], isLoading: chargeProjets } = useProjets();
  const { data: financements = [] } = useFinancements();
  const missions = useMissionsAApprouver(userId);

  const suivis = useMemo(() => projets.filter((p) => EN_COURS.includes(p.statut)), [projets]);
  const lignes = useLignesDesProjets(suivis);
  const activites = useActivitesDesProjets(suivis);
  const chargeBudget = chargeProjets || lignes.some((q) => q.isLoading);
  const chargeActivites = chargeProjets || activites.some((q) => q.isLoading);

  // ── Projets suivis : budget, avancement, alertes ──────────────────────────
  const lignesProjets = suivis.map((p, i) => {
    const t = totaux(lignes[i]?.data ?? []);
    const acts = (activites[i]?.data ?? []).filter((a) => a.statut !== "ANNULEE");
    const bailleurs = [...new Set(financements.filter((f) => f.projetId === p.id).map(nomCourt))];
    const alertes = [];
    if (t.prevu > 0 && t.taux >= SEUIL_ALERTE) alertes.push(`Budget consommé à ${Math.round(t.taux * 100)} %`);
    if (p.dateFin && p.statut === "ACTIF") {
      const j = joursAvant(p.dateFin);
      if (j < 0) alertes.push("Date de fin dépassée");
      else if (j <= 30) alertes.push(`Se termine dans ${j} jour${j > 1 ? "s" : ""}`);
    }
    return {
      projet: p,
      bailleurs,
      budget: Number(p.budgetTotal) || t.prevu,
      ...t,
      realisees: acts.filter((a) => a.statut === "REALISEE").length,
      totalActivites: acts.length,
      retards: acts.filter(enRetard).length,
      alertes,
    };
  });

  // ── Chiffres clés ─────────────────────────────────────────────────────────
  const actifs = projets.filter((p) => p.statut === "ACTIF");
  const termines = projets.filter((p) => TERMINES.includes(p.statut));
  const budgetTotal = lignesProjets.reduce((s, l) => s + l.budget, 0);
  const prevuTotal = lignesProjets.reduce((s, l) => s + l.prevu, 0);
  const depenseTotal = lignesProjets.reduce((s, l) => s + l.depense, 0);
  const toutesActivites = activites.flatMap((q, i) =>
    (q.data ?? []).map((a) => ({ ...a, projet: suivis[i] })),
  );
  const retards = toutesActivites.filter(enRetard);

  // ── À valider ─────────────────────────────────────────────────────────────
  const renvoyes = projets.filter((p) => p.statut === "BROUILLON" && p.motifRenvoi);
  const brouillons = projets.filter((p) => p.statut === "BROUILLON" && !p.motifRenvoi);
  const aValider = [
    ...(missions.data ?? []).map((m) => ({
      id: `m-${m.id}`,
      lien: `/missions/${m.id}`,
      type: "Mission",
      titre: `${m.demandeurNom} · ${m.destination}`,
      detail: `${dateCourte(m.dateDebut)} → ${dateCourte(m.dateFin)}${m.projetCode ? ` · ${m.projetCode}` : ""}`,
    })),
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
        {missions.isLoading || chargeProjets ? (
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

      <Bloc titre="Projets en cours" lien="/projets" libelleLien="Tous les projets">
        {chargeProjets ? (
          <p className="px-4 py-6 text-sm text-gray-500">Chargement…</p>
        ) : lignesProjets.length === 0 ? (
          <p className="px-4 py-6 text-sm text-gray-500">Aucun projet en cours.</p>
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
