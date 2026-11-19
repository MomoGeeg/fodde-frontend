import { perimetresApi, terrainApi } from "@/api/perimetres";
import { Bloc, Carte, Vide } from "@/components/tableau/Blocs";
import { messageErreur } from "@/lib/erreurs";
import { dateCourte } from "@/lib/format";
import useAuthStore from "@/stores/auth.store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

// ─────────────────────────────────────────────────────────────────────────────
// Accueil du technicien terrain et du superviseur : formations, personnes
// formées, avancement des activités de ses périmètres, puis ses activités à
// venir et la liste de ses périmètres.
// ─────────────────────────────────────────────────────────────────────────────

const STATUTS = {
  PLANIFIEE: { label: "Planifiée", classe: "bg-gray-100 text-gray-600" },
  EN_COURS: { label: "En cours", classe: "bg-blue-50 text-blue-700" },
  REALISEE: { label: "Réalisée", classe: "bg-green-50 text-green-700" },
  ANNULEE: { label: "Annulée", classe: "bg-gray-100 text-gray-400" },
  EN_RETARD: { label: "En retard", classe: "bg-red-50 text-red-700" },
};

const aujourdhui = () => new Date().toISOString().slice(0, 10);
const nombre = (n) => new Intl.NumberFormat("fr-FR").format(n);
const estEnRetard = (a, jour) => a.datePrevuFin < jour && a.statut !== "REALISEE" && a.statut !== "ANNULEE";

function Statut({ activite, jour }) {
  const s = STATUTS[estEnRetard(activite, jour) ? "EN_RETARD" : activite.statut] ?? STATUTS.PLANIFIEE;
  return <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${s.classe}`}>{s.label}</span>;
}

/** Saisie des participants d'une formation, directement depuis l'accueil. */
function Participants({ activite, onFermer }) {
  const queryClient = useQueryClient();
  const [total, setTotal] = useState(activite.participants ?? "");
  const [femmes, setFemmes] = useState(activite.participantsFemmes ?? "");
  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      terrainApi.enregistrerParticipants(
        activite.id,
        total === "" ? null : Number(total),
        femmes === "" ? null : Number(femmes),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["terrain", "activites"] });
      toast.success("Participants enregistrés");
      onFermer();
    },
    onError: (err) => toast.error(messageErreur(err)),
  });
  const champ = "w-24 rounded-md border border-gray-300 px-2 py-1 text-sm";
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        mutate();
      }}
      className="flex flex-wrap items-end gap-3 px-4 pb-3"
    >
      <label className="text-xs text-gray-500">
        Participants
        <input type="number" min="0" value={total} onChange={(e) => setTotal(e.target.value)} className={`${champ} mt-1 block`} />
      </label>
      <label className="text-xs text-gray-500">
        Dont femmes
        <input type="number" min="0" value={femmes} onChange={(e) => setFemmes(e.target.value)} className={`${champ} mt-1 block`} />
      </label>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-60"
      >
        {isPending ? "Enregistrement…" : "Enregistrer"}
      </button>
      <button type="button" onClick={onFermer} className="px-2 py-1.5 text-sm text-gray-500 hover:text-gray-700">
        Annuler
      </button>
    </form>
  );
}

export default function TableauDeBordTerrain() {
  const { user } = useAuthStore();
  const [saisie, setSaisie] = useState(null);
  const jour = aujourdhui();

  const { data: perimetres = [], isLoading: chargePerimetres } = useQuery({
    queryKey: ["terrain", "perimetres"],
    queryFn: perimetresApi.mesPerimetres,
  });
  const { data: activites = [], isLoading: chargeActivites } = useQuery({
    queryKey: ["terrain", "activites"],
    queryFn: terrainApi.mesActivites,
  });

  const valides = activites.filter((a) => a.statut !== "ANNULEE");
  const realisees = valides.filter((a) => a.statut === "REALISEE");
  const formations = valides.filter((a) => a.type === "FORMATION");
  const formationsRealisees = formations.filter((a) => a.statut === "REALISEE");
  const formes = formations.reduce((t, a) => t + (a.participants ?? 0), 0);
  const formees = formations.reduce((t, a) => t + (a.participantsFemmes ?? 0), 0);
  const retards = valides.filter((a) => estEnRetard(a, jour));
  const aVenir = valides.filter((a) => a.statut !== "REALISEE");

  const activitesParPerimetre = (id) => valides.filter((a) => a.perimetreId === id);

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <Carte libelle="Mes périmètres" valeur={perimetres.length} chargement={chargePerimetres} />
        <Carte
          libelle="Formations réalisées"
          valeur={formationsRealisees.length}
          detail={`sur ${formations.length} prévue${formations.length > 1 ? "s" : ""}`}
          chargement={chargeActivites}
        />
        <Carte
          libelle="Personnes formées"
          valeur={nombre(formes)}
          detail={`dont ${nombre(formees)} femmes`}
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

      <Bloc titre={`Mes activités${aVenir.length ? ` (${aVenir.length})` : ""}`}>
        {chargeActivites ? (
          <Vide>Chargement…</Vide>
        ) : aVenir.length ? (
          <ul className="divide-y divide-gray-100">
            {aVenir.map((a) => {
              const peutSaisir = a.type === "FORMATION" && a.responsableId === user?.id;
              return (
                <li key={a.id}>
                  <div className="flex items-center gap-3 px-4 py-3 text-sm">
                    <span className="w-24 shrink-0 text-xs font-medium text-primary">{dateCourte(a.datePrevuDebut)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-gray-900">{a.titre}</span>
                      <span className="block truncate text-xs text-gray-500">
                        {[
                          a.type === "FORMATION" && "Formation",
                          a.perimetreNom,
                          a.participants != null && `${a.participants} participants, dont ${a.participantsFemmes ?? 0} femmes`,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </span>
                    {peutSaisir && saisie !== a.id && (
                      <button
                        onClick={() => setSaisie(a.id)}
                        className="shrink-0 rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                      >
                        Participants
                      </button>
                    )}
                    <Statut activite={a} jour={jour} />
                  </div>
                  {saisie === a.id && <Participants activite={a} onFermer={() => setSaisie(null)} />}
                </li>
              );
            })}
          </ul>
        ) : (
          <Vide>Aucune activité à venir.</Vide>
        )}
      </Bloc>

      <div className="grid gap-6 lg:grid-cols-2">
        <Bloc titre="Mes périmètres">
          {chargePerimetres ? (
            <Vide>Chargement…</Vide>
          ) : perimetres.length ? (
            <ul className="divide-y divide-gray-100">
              {perimetres.map((p) => {
                const liste = activitesParPerimetre(p.id);
                const faites = liste.filter((a) => a.statut === "REALISEE").length;
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
                      {faites} sur {liste.length} activités
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <Vide>Aucun périmètre ne vous est encore affecté.</Vide>
          )}
        </Bloc>

        <Bloc titre="Formations réalisées">
          {chargeActivites ? (
            <Vide>Chargement…</Vide>
          ) : formationsRealisees.length ? (
            <ul className="divide-y divide-gray-100">
              {formationsRealisees.map((a) => (
                <li key={a.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                  <span className="w-24 shrink-0 text-xs text-gray-500">{dateCourte(a.datePrevuDebut)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-gray-900">{a.titre}</span>
                    {a.perimetreNom && <span className="block truncate text-xs text-gray-500">{a.perimetreNom}</span>}
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-gray-600">
                    {a.participants != null ? `${a.participants} dont ${a.participantsFemmes ?? 0} femmes` : "Participants à saisir"}
                  </span>
                  {a.responsableId === user?.id && saisie !== a.id && (
                    <button
                      onClick={() => setSaisie(a.id)}
                      className="shrink-0 rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                    >
                      Participants
                    </button>
                  )}
                </li>
              ))}
              {formationsRealisees.some((a) => a.id === saisie) && (
                <li>
                  <Participants
                    activite={formationsRealisees.find((a) => a.id === saisie)}
                    onFermer={() => setSaisie(null)}
                  />
                </li>
              )}
            </ul>
          ) : (
            <Vide>Aucune formation réalisée pour le moment.</Vide>
          )}
        </Bloc>
      </div>
    </div>
  );
}
