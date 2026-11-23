import { TYPES_ACTIVITE, animateursApi } from "@/api/animateurs";
import { indicateursPerimetreApi, perimetresApi, terrainApi } from "@/api/perimetres";
import FormulairePlanification from "@/components/activites/FormulairePlanification";
import PiecesActivite from "@/components/activites/PiecesActivite";
import IndicateursPerimetre from "@/components/perimetres/IndicateursPerimetre";
import { Bloc, Carte, Vide } from "@/components/tableau/Blocs";
import { dateCourte } from "@/lib/format";
import { R, aAcces } from "@/lib/navigation";
import { BlocSuiviTechnicien, BlocsSuperviseur } from "@/pages/terrain/TerrainPages";
import useAuthStore from "@/stores/auth.store";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Plus, X } from "lucide-react";
import { useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Accueil du terrain : technicien, animateur et superviseur. Participants,
// avancement des activités, puis les activités elles-mêmes, que l'on ouvre
// pour joindre la liste de présence, les photos et la fiche de suivi.
// ─────────────────────────────────────────────────────────────────────────────

const STATUTS = {
  PLANIFIEE: { label: "Planifiée", classe: "bg-gray-100 text-gray-600" },
  EN_COURS: { label: "En cours", classe: "bg-blue-50 text-blue-700" },
  REALISEE: { label: "Réalisée", classe: "bg-green-50 text-green-700" },
  ANNULEE: { label: "Annulée", classe: "bg-gray-100 text-gray-400" },
  EN_RETARD: { label: "En retard", classe: "bg-red-50 text-red-700" },
};

const CLES = [["terrain", "activites"]];
const aujourdhui = () => new Date().toISOString().slice(0, 10);
const nombre = (n) => new Intl.NumberFormat("fr-FR").format(n);
const estEnRetard = (a, jour) => a.datePrevuFin < jour && a.statut !== "REALISEE" && a.statut !== "ANNULEE";

function Statut({ activite, jour }) {
  const s = STATUTS[estEnRetard(activite, jour) ? "EN_RETARD" : activite.statut] ?? STATUTS.PLANIFIEE;
  return <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${s.classe}`}>{s.label}</span>;
}

export default function TableauDeBordTerrain() {
  const { user } = useAuthStore();
  const roles = user?.roles ?? [];
  const superviseur = aAcces(roles, [R.SUP]);
  const technicien = aAcces(roles, [R.TT]);
  const animateur = aAcces(roles, [R.ANIM]);
  const [ouverte, setOuverte] = useState(null);
  const [vue, setVue] = useState("aVenir");
  const [creation, setCreation] = useState(false);
  const jour = aujourdhui();

  const { data: perimetres = [], isLoading: chargePerimetres } = useQuery({
    queryKey: ["terrain", "perimetres"],
    queryFn: perimetresApi.mesPerimetres,
  });
  const { data: activites = [], isLoading: chargeActivites } = useQuery({
    queryKey: ["terrain", "activites"],
    queryFn: terrainApi.mesActivites,
  });
  const { data: projets = [], isLoading: chargeProjets } = useQuery({
    queryKey: ["terrain", "projets"],
    queryFn: animateursApi.mesProjets,
    enabled: animateur,
  });
  const { data: indicateurs = [], isLoading: chargeIndicateurs } = useQuery({
    queryKey: ["indicateurs-perimetre", "miens"],
    queryFn: indicateursPerimetreApi.mesIndicateurs,
    enabled: perimetres.length > 0,
  });

  const valides = activites.filter((a) => a.statut !== "ANNULEE");
  const realisees = valides.filter((a) => a.statut === "REALISEE");
  const participants = valides.reduce((t, a) => t + (a.participants ?? 0), 0);
  const femmes = valides.reduce((t, a) => t + (a.participantsFemmes ?? 0), 0);
  const retards = valides.filter((a) => estEnRetard(a, jour));
  const aVenir = valides.filter((a) => a.statut !== "REALISEE");
  const liste = vue === "aVenir" ? aVenir : [...realisees].reverse();
  const mesPerimetres = new Set(perimetres.filter((p) => p.technicienId === user?.id).map((p) => p.id));
  const peutRenseigner = (a) => a.responsableId === user?.id || mesPerimetres.has(a.perimetreId);
  const activitesParPerimetre = (id) => valides.filter((a) => a.perimetreId === id);
  // Périmètres sur lesquels l'utilisateur planifie : ceux qu'il suit comme technicien ou superviseur.
  const perimetresPlanifiables = perimetres.filter((p) => p.technicienId === user?.id || p.superviseurId === user?.id);
  const peutPlanifier = technicien || animateur || superviseur;

  return (
    <div className="space-y-6">
      {superviseur && <BlocsSuperviseur />}
      {(technicien || animateur) && (
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Carte
            libelle="Participants"
            valeur={nombre(participants)}
            detail={`dont ${nombre(femmes)} femmes`}
            chargement={chargeActivites}
          />
          <Carte
            libelle="Activités réalisées"
            valeur={`${realisees.length} sur ${valides.length}`}
            detail={valides.length ? `${Math.round((realisees.length / valides.length) * 100)} %` : undefined}
            chargement={chargeActivites}
          />
          <Carte libelle="En retard" valeur={retards.length} chargement={chargeActivites} alerte={retards.length > 0} />
        </section>
      )}

      <section className="rounded-lg border border-gray-200 bg-white">
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 px-4 py-3">
          <h2 className="mr-auto text-sm font-semibold text-gray-900">Mes activités</h2>
          {[
            ["aVenir", `À venir (${aVenir.length})`],
            ["realisees", `Réalisées (${realisees.length})`],
          ].map(([code, libelle]) => (
            <button
              key={code}
              type="button"
              onClick={() => setVue(code)}
              className={`rounded-md px-3 py-1 text-xs font-medium ${
                vue === code ? "bg-primary/10 text-primary" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {libelle}
            </button>
          ))}
          {peutPlanifier && !creation && (
            <button
              type="button"
              onClick={() => setCreation(true)}
              className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-white hover:bg-primary-dark"
            >
              <Plus size={13} /> Planifier une activité
            </button>
          )}
          {creation && (
            <button type="button" onClick={() => setCreation(false)} className="rounded p-1 text-gray-400 hover:bg-gray-100">
              <X size={15} />
            </button>
          )}
        </div>
        {creation && (
          <FormulairePlanification
            perimetres={perimetresPlanifiables}
            projets={animateur ? projets : []}
            onFermer={() => setCreation(false)}
          />
        )}
        {chargeActivites ? (
          <Vide>Chargement…</Vide>
        ) : liste.length ? (
          <ul className="divide-y divide-gray-100">
            {liste.map((a) => {
              const ouvert = ouverte === a.id;
              return (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => setOuverte(ouvert ? null : a.id)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-gray-50"
                  >
                    {ouvert ? (
                      <ChevronDown size={14} className="shrink-0 text-gray-400" />
                    ) : (
                      <ChevronRight size={14} className="shrink-0 text-gray-400" />
                    )}
                    <span className="w-24 shrink-0 text-xs font-medium text-primary">{dateCourte(a.datePrevuDebut)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-gray-900">{a.titre}</span>
                      <span className="block truncate text-xs text-gray-500">
                        {[
                          a.type !== "ACTIVITE" && TYPES_ACTIVITE[a.type],
                          a.lieu ?? a.perimetreNom,
                          a.participants != null &&
                            `${a.participants} participants` +
                              (a.participantsFemmes != null ? `, dont ${a.participantsFemmes} femmes` : ""),
                          a.nbPhotos > 0 && `${a.nbPhotos} photo${a.nbPhotos > 1 ? "s" : ""}`,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </span>
                    <Statut activite={a} jour={jour} />
                  </button>
                  {ouvert && <PiecesActivite activite={a} peutModifier={peutRenseigner(a)} cles={CLES} />}
                </li>
              );
            })}
          </ul>
        ) : (
          <Vide>{vue === "aVenir" ? "Aucune activité à venir." : "Aucune activité réalisée."}</Vide>
        )}
      </section>

      {(technicien || animateur) && <BlocSuiviTechnicien />}

      <div className={`grid gap-6 ${animateur && perimetres.length > 0 ? "lg:grid-cols-2" : ""}`}>
        {animateur && (
          <Bloc titre="Mes projets">
            {chargeProjets ? (
              <Vide>Chargement…</Vide>
            ) : projets.length ? (
              <ul className="divide-y divide-gray-100">
                {projets.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-gray-900">{p.titre}</span>
                      <span className="block truncate text-xs text-gray-500">
                        {[p.code, p.coordonnateurNom && `Coordonnateur : ${p.coordonnateurNom}`].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs tabular-nums text-gray-600">
                      {valides.filter((a) => a.projetId === p.id && a.statut === "REALISEE").length} sur{" "}
                      {valides.filter((a) => a.projetId === p.id).length} activités
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <Vide>Aucun projet ne vous est encore affecté.</Vide>
            )}
          </Bloc>
        )}

        {(perimetres.length > 0 || technicien) && (
          <Bloc titre="Mes périmètres">
            {chargePerimetres ? (
              <Vide>Chargement…</Vide>
            ) : perimetres.length ? (
              <ul className="divide-y divide-gray-100">
                {perimetres.map((p) => {
                  const activitesDuPerimetre = activitesParPerimetre(p.id);
                  const faites = activitesDuPerimetre.filter((a) => a.statut === "REALISEE").length;
                  return (
                    <li key={p.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-gray-900">{p.nom}</span>
                        <span className="block truncate text-xs text-gray-500">
                          {[p.village, p.projetCode, p.superficieHa != null && `${nombre(p.superficieHa)} ha`]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs tabular-nums text-gray-600">
                        {faites} sur {activitesDuPerimetre.length} activités
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <Vide>Aucun périmètre ne vous est encore affecté.</Vide>
            )}
          </Bloc>
        )}
      </div>

      {perimetres.length > 0 && (
        <Bloc titre="Indicateurs de mes périmètres">
          {chargeIndicateurs ? (
            <Vide>Chargement…</Vide>
          ) : (
            <div className="divide-y divide-gray-200">
              {indicateurs.map((d) => (
                <div key={d.perimetreId}>
                  <p className="bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-700">
                    {d.perimetreNom} · {d.village}
                  </p>
                  <IndicateursPerimetre donnees={d} />
                </div>
              ))}
            </div>
          )}
        </Bloc>
      )}
    </div>
  );
}
