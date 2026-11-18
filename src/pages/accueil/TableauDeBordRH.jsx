import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import api from "@/api/axios";
import { TYPES_CONGE, useConges } from "@/api/conges";
import { POLES, joursRestants, useComptesSansFiche, useEmployes, useEvaluations } from "@/api/rh-data";
import { Bloc, Carte, Vide } from "@/components/tableau/Blocs";
import { dateCourte } from "@/lib/format";

// ─────────────────────────────────────────────────────────────────────────────
// Accueil des ressources humaines : ce qu'il reste à faire sur les dossiers,
// les chiffres clés du personnel, les contrats qui arrivent à échéance, les
// absences et les alertes.
// ─────────────────────────────────────────────────────────────────────────────

/** Contrats affichés dans « Contrats en phase finale » (jours avant la fin). */
const FENETRE_CONTRATS = 90;
/** Contrats comptés comme urgents dans les chiffres clés. */
const CONTRATS_URGENTS = 60;
const EN_ATTENTE = ["EN_ATTENTE", "VALIDE_RH"];

const iso = (d) => d.toISOString().slice(0, 10);
const joursDepuis = (d) => (new Date() - new Date(d)) / 86_400_000;
const dansJours = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return iso(d);
};

function Ligne({ lien, gauche, titre, detail, droite, classeGauche = "text-primary" }) {
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

export default function TableauDeBordRH({ userId }) {
  // Rare, mais possible : la personne RH est le supérieur direct d'un missionnaire.
  const { data: missions = [] } = useQuery({
    queryKey: ["accueil", "rh", "missions", userId],
    queryFn: async () => {
      const { data } = await api.get("/api/missions");
      return (Array.isArray(data) ? data : []).filter((m) => m.statut === "SOUMISE" && m.n1Id === userId);
    },
    staleTime: 60_000,
  });
  const { data: employes = [], isLoading: chargeEmployes } = useEmployes();
  const { data: conges = [], isLoading: chargeConges } = useConges();
  const { data: evaluations = [] } = useEvaluations();
  const { data: comptesSansFiche = [] } = useComptesSansFiche();

  const presents = employes.filter((e) => e.statut !== "PARTI");
  const aujourdhui = iso(new Date());

  // ── Absences : en congé aujourd'hui, puis départs dans les 15 jours ───────
  const approuves = conges.filter((c) => c.statut === "APPROUVE");
  const enConge = approuves.filter((c) => c.dateDebut <= aujourdhui && c.dateFin >= aujourdhui);
  const prochains = approuves
    .filter((c) => c.dateDebut > aujourdhui && c.dateDebut <= dansJours(15))
    .sort((a, b) => a.dateDebut.localeCompare(b.dateDebut));
  const enCongeIds = new Set(enConge.map((c) => c.employeId));
  const nbEnConge = new Set([...enCongeIds, ...presents.filter((e) => e.statut === "EN_CONGE").map((e) => e.id)]).size;

  // ── Contrats en phase finale (hors CDI) ───────────────────────────────────
  const contrats = presents
    .filter((e) => e.typeContrat && e.typeContrat !== "CDI" && e.dateFinContrat)
    .map((e) => ({ ...e, jours: joursRestants(e.dateFinContrat) }))
    .filter((e) => e.jours !== null && e.jours <= FENETRE_CONTRATS)
    .sort((a, b) => a.jours - b.jours);
  const contratsUrgents = contrats.filter((e) => e.jours <= CONTRATS_URGENTS);

  // ── À traiter : dossiers à compléter ──────────────────────────────────────
  const incompletes = presents.filter((e) => !e.pole || (!e.superieurId && e.pole !== "DIRECTION"));
  const aTraiter = [
    ...conges
      .filter((c) => c.statut === "EN_ATTENTE")
      .map((c) => ({
        id: `cg-${c.id}`,
        lien: `/conges/${c.id}`,
        type: "Congé à valider",
        titre: c.employeNom,
        detail: `${TYPES_CONGE[c.typeConge] ?? c.typeConge}, du ${dateCourte(c.dateDebut)} au ${dateCourte(c.dateFin)}`,
      })),
    ...missions.map((m) => ({
      id: `m-${m.id}`,
      lien: `/missions/${m.id}`,
      type: "Mission",
      titre: `${m.demandeurNom} · ${m.destination}`,
      detail: `${dateCourte(m.dateDebut)} → ${dateCourte(m.dateFin)}`,
    })),
    ...comptesSansFiche.map((c) => ({
      id: `c-${c.id}`,
      lien: `/rh/employes/nouveau?compte=${c.id}`,
      type: "Fiche à créer",
      titre: `${c.prenom} ${c.nom}`,
      detail: c.email,
    })),
    ...incompletes.map((e) => ({
      id: `i-${e.id}`,
      lien: `/rh/employes/${e.id}/edit`,
      type: "Fiche à compléter",
      titre: `${e.prenom} ${e.nom}`,
      detail: [!e.pole && "pôle", !e.superieurId && e.pole !== "DIRECTION" && "supérieur direct"]
        .filter(Boolean)
        .join(" et ") + " à renseigner",
    })),
  ];

  // ── Alertes ───────────────────────────────────────────────────────────────
  const congesEnAttente = conges.filter((c) => EN_ATTENTE.includes(c.statut));
  const attenteLongue = congesEnAttente.filter(
    (c) => c.createdAt && joursDepuis(c.createdAt) >= 3,
  );
  const soldesNegatifs = presents.filter((e) => (e.soldeConges ?? 0) < 0);
  const evaluationsRetard = evaluations.filter((e) => e.statut === "EN_RETARD");
  const alertes = [
    ...contrats
      .filter((e) => e.jours <= 30)
      .map((e) => ({
        id: `ct-${e.id}`,
        lien: `/rh/employes/${e.id}`,
        titre: `Contrat de ${e.prenom} ${e.nom}`,
        detail: e.jours <= 0 ? "Échu" : `Se termine dans ${e.jours} jour${e.jours > 1 ? "s" : ""}`,
      })),
    ...attenteLongue.map((c) => ({
      id: `cg-${c.id}`,
      lien: `/conges/${c.id}`,
      titre: `Congé de ${c.employeNom}`,
      detail: `En attente de décision depuis le ${dateCourte(c.createdAt)}`,
    })),
    ...soldesNegatifs.map((e) => ({
      id: `s-${e.id}`,
      lien: `/rh/employes/${e.id}`,
      titre: `Solde de congés de ${e.prenom} ${e.nom}`,
      detail: `${e.soldeConges} jours`,
    })),
    ...(evaluationsRetard.length
      ? [
          {
            id: "ev",
            lien: "/rh/evaluations",
            titre: `${evaluationsRetard.length} évaluation${evaluationsRetard.length > 1 ? "s" : ""} en retard`,
          },
        ]
      : []),
  ];

  // ── Effectif par pôle ─────────────────────────────────────────────────────
  const parPole = [...Object.entries(POLES), ["", { label: "Pôle à préciser" }]]
    .map(([code, p]) => ({ code, libelle: p.label, nombre: presents.filter((e) => (e.pole ?? "") === code).length }))
    .filter((p) => p.nombre > 0);

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <Carte libelle="Employés" valeur={presents.length} chargement={chargeEmployes} lien="/rh/employes" />
        <Carte libelle="En congé aujourd'hui" valeur={nbEnConge} chargement={chargeEmployes || chargeConges} lien="/conges" />
        <Carte
          libelle="Contrats en phase finale"
          valeur={contratsUrgents.length}
          detail={`dans les ${CONTRATS_URGENTS} jours`}
          chargement={chargeEmployes}
          alerte={contratsUrgents.length > 0}
        />
        <Carte libelle="Congés en attente" valeur={congesEnAttente.length} chargement={chargeConges} lien="/conges" />
        <Carte
          libelle="Alertes"
          valeur={alertes.length}
          chargement={chargeEmployes || chargeConges}
          lien="/rh/alertes"
          alerte={alertes.length > 0}
        />
      </section>

      <Bloc titre={`À traiter${aTraiter.length ? ` (${aTraiter.length})` : ""}`}>
        {chargeEmployes ? (
          <Vide>Chargement…</Vide>
        ) : aTraiter.length ? (
          <ul className="divide-y divide-gray-100">
            {aTraiter.map((t) => (
              <Ligne key={t.id} lien={t.lien} gauche={t.type} titre={t.titre} detail={t.detail} />
            ))}
          </ul>
        ) : (
          <Vide>Rien à traiter.</Vide>
        )}
      </Bloc>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <Bloc titre="Contrats en phase finale" lien="/rh/alertes" libelleLien="Alertes RH">
          {chargeEmployes ? (
            <Vide>Chargement…</Vide>
          ) : contrats.length ? (
            <ul className="divide-y divide-gray-100">
              {contrats.map((e) => (
                <Ligne
                  key={e.id}
                  lien={`/rh/employes/${e.id}`}
                  titre={`${e.prenom} ${e.nom}`}
                  detail={`${e.typeContrat} · fin le ${dateCourte(e.dateFinContrat)}`}
                  droite={
                    <span
                      className={`shrink-0 text-xs font-semibold tabular-nums ${
                        e.jours <= 30 ? "text-red-600" : e.jours <= CONTRATS_URGENTS ? "text-amber-700" : "text-gray-500"
                      }`}
                    >
                      {e.jours <= 0 ? "Échu" : `${e.jours} j`}
                    </span>
                  }
                />
              ))}
            </ul>
          ) : (
            <Vide>Aucun contrat ne se termine dans les {FENETRE_CONTRATS} jours.</Vide>
          )}
        </Bloc>

        <Bloc titre="Absences" lien="/conges" libelleLien="Congés">
          {chargeConges ? (
            <Vide>Chargement…</Vide>
          ) : enConge.length + prochains.length ? (
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
              {prochains.map((c) => (
                <Ligne
                  key={c.id}
                  lien={`/conges/${c.id}`}
                  gauche={`Dès le ${dateCourte(c.dateDebut)}`}
                  classeGauche="text-gray-500"
                  titre={c.employeNom}
                  detail={`${TYPES_CONGE[c.typeConge] ?? c.typeConge} · ${c.nbJours ?? ""} j`}
                />
              ))}
            </ul>
          ) : (
            <Vide>Personne n'est en congé ni ne part dans les 15 jours.</Vide>
          )}
        </Bloc>

        <Bloc titre="Effectif par pôle" lien="/rh/employes" libelleLien="Employés">
          {chargeEmployes ? (
            <Vide>Chargement…</Vide>
          ) : parPole.length ? (
            <ul className="divide-y divide-gray-100">
              {parPole.map((p) => (
                <li key={p.code || "aucun"} className="flex items-center justify-between px-4 py-3 text-sm">
                  <span className={p.code ? "text-gray-800" : "text-amber-700"}>{p.libelle}</span>
                  <span className="font-semibold tabular-nums text-gray-900">{p.nombre}</span>
                </li>
              ))}
            </ul>
          ) : (
            <Vide>Aucun employé enregistré.</Vide>
          )}
        </Bloc>
      </div>
    </div>
  );
}
