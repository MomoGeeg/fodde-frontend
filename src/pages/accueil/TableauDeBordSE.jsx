import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, TriangleAlert } from "lucide-react";
import api from "@/api/axios";
import { TYPES_CONGE, useConges } from "@/api/conges";
import { joursRestants, useEmployes } from "@/api/rh-data";
import { Bloc, Carte, Vide } from "@/components/tableau/Blocs";
import { dateCourte, montant } from "@/lib/format";
import { usePortefeuille } from "./portefeuille";
import TableauProjets from "./TableauProjets";

// ─────────────────────────────────────────────────────────────────────────────
// Accueil du Secrétaire exécutif : vue d'ensemble de l'ONG (projets, finances,
// équipe, terrain) et les décisions qui l'attendent. Il ne saisit rien.
// ─────────────────────────────────────────────────────────────────────────────

/** GET qui renvoie une liste vide si l'appel échoue. */
const liste = (url) =>
  api
    .get(url)
    .then((r) => (Array.isArray(r.data) ? r.data : []))
    .catch(() => []);

const iso = (d) => d.toISOString().slice(0, 10);
const dansJours = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return iso(d);
};

/** Demandes qui attendent la décision du SE, et les missions (pour le terrain). */
async function chargerSE() {
  const [depenses, missions, allocations, documents, alertes, depensesMois] = await Promise.all([
    liste("/api/depenses?statut=EN_APPROBATION_SE"),
    liste("/api/missions"),
    liste("/api/allocations/en-validation"),
    liste("/api/documents/en-validation"),
    liste("/api/alertes"),
    api
      .get("/api/depenses/stats/mois-courant")
      .then((r) => r.data?.total ?? 0)
      .catch(() => null),
  ]);
  return { depenses, missions, allocations, documents, alertes: alertes.filter((a) => !a.lue), depensesMois };
}

function Ligne({ lien, gauche, classeGauche = "text-primary", titre, detail, droite }) {
  return (
    <li>
      <Link to={lien} className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50">
        {gauche && <span className={`w-28 shrink-0 text-xs font-medium ${classeGauche}`}>{gauche}</span>}
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium text-gray-900">{titre}</span>
          {detail && <span className="block truncate text-xs text-gray-500">{detail}</span>}
        </span>
        {droite}
        <ChevronRight size={16} className="shrink-0 text-gray-400" />
      </Link>
    </li>
  );
}

export default function TableauDeBordSE() {
  const portefeuille = usePortefeuille();
  const { projets, chargeProjets, chargeBudget, lignesProjets, actifs, termines, prevuTotal, depenseTotal } = portefeuille;
  const se = useQuery({ queryKey: ["accueil", "se"], queryFn: chargerSE, staleTime: 60_000 });
  const { data: employes = [], isLoading: chargeEmployes } = useEmployes();
  const { data: conges = [] } = useConges();
  const d = se.data ?? { depenses: [], missions: [], allocations: [], documents: [], alertes: [], depensesMois: null };

  const aujourdhui = iso(new Date());

  // ── À valider ─────────────────────────────────────────────────────────────
  const aValider = [
    ...d.depenses.map((x) => ({
      id: `d-${x.id}`,
      lien: `/finances/depenses/${x.id}`,
      type: "Dépense",
      titre: x.libelle,
      detail: [x.projetCode, x.saisiParNom].filter(Boolean).join(" · "),
      montant: x.montant,
    })),
    ...d.missions
      .filter((m) => m.statut === "EN_VALIDATION_SE")
      .map((m) => ({
        id: `m-${m.id}`,
        lien: `/missions/${m.id}`,
        type: "Mission",
        titre: `${m.demandeurNom} · ${m.destination}`,
        detail: `${dateCourte(m.dateDebut)} → ${dateCourte(m.dateFin)}${m.projetCode ? ` · ${m.projetCode}` : ""}`,
      })),
    ...projets
      .filter((p) => p.statut === "EN_VALIDATION_SE")
      .map((p) => ({ id: `p-${p.id}`, lien: `/projets/${p.id}`, type: "Projet", titre: p.titre, detail: p.code, montant: p.budgetTotal })),
    ...d.allocations.map((a) => ({
      id: `a-${a.id}`,
      lien: "/secretariat/validations",
      type: "Allocation",
      titre: a.projetTitre ?? a.projetCode,
      detail: [a.projetCode, a.exercice && `exercice ${a.exercice}`].filter(Boolean).join(" · "),
      montant: a.montantAlloue,
    })),
    ...d.documents.map((x) => ({
      id: `doc-${x.id}`,
      lien: `/documents/${x.id}`,
      type: "Document",
      titre: x.titre,
      detail: x.createdByNom,
    })),
  ];

  // ── Équipe ────────────────────────────────────────────────────────────────
  const presents = employes.filter((e) => e.statut !== "PARTI");
  const enConge = conges.filter((c) => c.statut === "APPROUVE" && c.dateDebut <= aujourdhui && c.dateFin >= aujourdhui);
  const contrats = presents
    .filter((e) => e.typeContrat && e.typeContrat !== "CDI" && e.dateFinContrat)
    .map((e) => ({ ...e, jours: joursRestants(e.dateFinContrat) }))
    .filter((e) => e.jours !== null && e.jours <= 30)
    .sort((a, b) => a.jours - b.jours);

  // ── Terrain : missions en cours, puis départs dans les 7 jours ────────────
  const pretes = d.missions.filter((m) => ["PRETE", "VALIDEE"].includes(m.statut));
  const surLeTerrain = pretes.filter((m) => m.dateDebut <= aujourdhui && m.dateFin >= aujourdhui);
  const departs = pretes
    .filter((m) => m.dateDebut > aujourdhui && m.dateDebut <= dansJours(7))
    .sort((a, b) => a.dateDebut.localeCompare(b.dateDebut));
  const personnes = (m) => Math.max(1, m.participants?.length ?? 0);

  const projetsEnAlerte = lignesProjets.filter((l) => l.alertes.length > 0).length;

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <Carte
          libelle="Projets en cours"
          valeur={actifs.length}
          detail={`${termines.length} terminé${termines.length > 1 ? "s" : ""}`}
          chargement={chargeProjets}
          lien="/projets"
        />
        <Carte
          libelle="Budget consommé"
          valeur={prevuTotal > 0 ? `${Math.round((depenseTotal / prevuTotal) * 100)} %` : "—"}
          detail={`${montant(depenseTotal)} sur ${montant(prevuTotal)}`}
          chargement={chargeBudget}
          lien="/finances/budgets"
        />
        <Carte
          libelle="Dépenses validées ce mois"
          valeur={d.depensesMois === null ? "—" : montant(d.depensesMois)}
          chargement={se.isLoading}
          lien="/finances/depenses"
        />
        <Carte
          libelle="Effectif"
          valeur={presents.length}
          detail={`${enConge.length} en congé · ${surLeTerrain.reduce((s, m) => s + personnes(m), 0)} en mission`}
          chargement={chargeEmployes || se.isLoading}
          lien="/rh/employes"
        />
        <Carte
          libelle="Projets en alerte"
          valeur={projetsEnAlerte}
          chargement={chargeBudget}
          alerte={projetsEnAlerte > 0}
        />
      </section>

      <Bloc titre={`À valider${aValider.length ? ` (${aValider.length})` : ""}`}>
        {se.isLoading || chargeProjets ? (
          <Vide>Chargement…</Vide>
        ) : aValider.length ? (
          <ul className="divide-y divide-gray-100">
            {aValider.map((v) => (
              <Ligne
                key={v.id}
                lien={v.lien}
                gauche={v.type}
                titre={v.titre}
                detail={v.detail}
                droite={
                  v.montant != null && (
                    <span className="shrink-0 text-sm font-medium tabular-nums text-gray-900">{montant(v.montant)}</span>
                  )
                }
              />
            ))}
          </ul>
        ) : (
          <Vide>Rien à valider.</Vide>
        )}
      </Bloc>

      <TableauProjets lignesProjets={lignesProjets} chargement={chargeProjets} />

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <Bloc titre="Sur le terrain" lien="/missions" libelleLien="Missions">
          {se.isLoading ? (
            <Vide>Chargement…</Vide>
          ) : surLeTerrain.length + departs.length ? (
            <ul className="divide-y divide-gray-100">
              {surLeTerrain.map((m) => (
                <Ligne
                  key={m.id}
                  lien={`/missions/${m.id}`}
                  gauche="En mission"
                  titre={m.destination}
                  detail={`${m.demandeurNom}${personnes(m) > 1 ? ` + ${personnes(m) - 1}` : ""} · retour le ${dateCourte(m.dateFin)}`}
                />
              ))}
              {departs.map((m) => (
                <Ligne
                  key={m.id}
                  lien={`/missions/${m.id}`}
                  gauche={`Départ ${dateCourte(m.dateDebut)}`}
                  classeGauche="text-gray-500"
                  titre={m.destination}
                  detail={`${m.demandeurNom}${m.projetCode ? ` · ${m.projetCode}` : ""}`}
                />
              ))}
            </ul>
          ) : (
            <Vide>Aucune mission en cours ni de départ dans les 7 jours.</Vide>
          )}
        </Bloc>

        <Bloc titre="Équipe" lien="/rh/employes" libelleLien="Employés">
          {chargeEmployes ? (
            <Vide>Chargement…</Vide>
          ) : enConge.length + contrats.length ? (
            <ul className="divide-y divide-gray-100">
              {enConge.map((c) => (
                <Ligne
                  key={c.id}
                  lien={`/conges/${c.id}`}
                  gauche="En congé"
                  titre={c.employeNom}
                  detail={`${TYPES_CONGE[c.typeConge] ?? c.typeConge} · retour le ${dateCourte(c.dateFin)}`}
                />
              ))}
              {contrats.map((e) => (
                <Ligne
                  key={e.id}
                  lien={`/rh/employes/${e.id}`}
                  gauche="Fin de contrat"
                  classeGauche="text-amber-700"
                  titre={`${e.prenom} ${e.nom}`}
                  detail={`${e.typeContrat} · ${e.jours <= 0 ? "échu" : `le ${dateCourte(e.dateFinContrat)}`}`}
                />
              ))}
            </ul>
          ) : (
            <Vide>Personne en congé, aucun contrat ne se termine dans les 30 jours.</Vide>
          )}
        </Bloc>

        <Bloc titre="Alertes">
          {se.isLoading ? (
            <Vide>Chargement…</Vide>
          ) : d.alertes.length ? (
            <ul className="divide-y divide-gray-100">
              {d.alertes.slice(0, 6).map((a) => {
                const contenu = (
                  <>
                    <TriangleAlert
                      size={16}
                      className={`mt-0.5 shrink-0 ${a.niveau === "CRITIQUE" ? "text-danger" : "text-warning"}`}
                    />
                    <span className="min-w-0">
                      <span className="block text-gray-800">{a.titre}</span>
                      {a.description && <span className="block text-xs text-gray-500">{a.description}</span>}
                    </span>
                  </>
                );
                return (
                  <li key={a.id}>
                    {a.lien ? (
                      <Link to={a.lien} className="flex gap-3 px-4 py-3 text-sm hover:bg-gray-50">
                        {contenu}
                      </Link>
                    ) : (
                      <div className="flex gap-3 px-4 py-3 text-sm">{contenu}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <Vide>Aucune alerte.</Vide>
          )}
        </Bloc>
      </div>
    </div>
  );
}
