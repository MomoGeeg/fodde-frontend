import { useAcquisitions } from "@/api/acquisitions";
import { STATUTS_SUIVI, TYPES_SUIVI, libelleMois, moisDecale, suivisApi } from "@/api/suivis";
import StatutBadge from "@/components/demande/StatutBadge";
import { Bloc, Carte, Vide } from "@/components/tableau/Blocs";
import { messageErreur } from "@/lib/erreurs";
import { dateCourte } from "@/lib/format";
import { R, aAcces } from "@/lib/navigation";
import useAuthStore from "@/stores/auth.store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

// ─────────────────────────────────────────────────────────────────────────────
// Espace terrain : planning et rapport mensuels (technicien), validation et
// équipe (superviseur). Les blocs d'accueil réutilisent les mêmes requêtes.
// ─────────────────────────────────────────────────────────────────────────────

const CLE_MIENS = ["suivis-terrain", "miens"];
const CLE_EQUIPE = ["suivis-terrain", "equipe"];
const CLE_MEMBRES = ["suivis-terrain", "membres"];
const nombre = (n) => new Intl.NumberFormat("fr-FR").format(n ?? 0);

const champ =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none";
const etiquette = "mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500";

const useSuivisMiens = (actif = true) =>
  useQuery({ queryKey: CLE_MIENS, queryFn: suivisApi.miens, enabled: actif });
const useSuivisEquipe = (actif = true) =>
  useQuery({ queryKey: CLE_EQUIPE, queryFn: suivisApi.equipe, enabled: actif });
const useMembresEquipe = (actif = true) =>
  useQuery({ queryKey: CLE_MEMBRES, queryFn: suivisApi.membres, enabled: actif });

const titreSuivi = (s) => `${TYPES_SUIVI[s.type]} de ${libelleMois(s.mois)}`;

// ── Détail d'un planning ou d'un rapport ─────────────────────────────────────

function DetailSuivi({ suivi }) {
  return (
    <div className="space-y-3 px-4 pb-4 text-sm">
      <p className="whitespace-pre-line rounded-md bg-gray-50 p-3 text-gray-800">{suivi.contenu}</p>
      {suivi.type === "PLANNING" && (
        <div>
          <p className={etiquette}>Activités prévues dans le mois</p>
          {suivi.activites?.length ? (
            <ul className="divide-y divide-gray-100 rounded-md border border-gray-100">
              {suivi.activites.map((a) => (
                <li key={a.id} className="flex items-center gap-3 px-3 py-2">
                  <span className="w-24 shrink-0 text-xs text-primary">{dateCourte(a.datePrevuDebut)}</span>
                  <span className="min-w-0 flex-1 truncate text-gray-900">{a.titre}</span>
                  {a.perimetreNom && <span className="shrink-0 text-xs text-gray-500">{a.perimetreNom}</span>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">Aucune activité prévue dans le mois.</p>
          )}
        </div>
      )}
      {suivi.commentaire && (
        <p
          className={`rounded-md p-3 ${
            suivi.statut === "A_REVOIR" ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"
          }`}
        >
          <span className="font-semibold">{suivi.decideParNom ?? "Superviseur"} : </span>
          {suivi.commentaire}
        </p>
      )}
    </div>
  );
}

/** Décision du superviseur : valider, ou renvoyer à revoir avec un commentaire. */
function Decision({ suivi }) {
  const queryClient = useQueryClient();
  const [commentaire, setCommentaire] = useState("");
  const { mutate, isPending } = useMutation({
    mutationFn: (valide) => suivisApi.decider(suivi.id, valide, commentaire.trim() || null),
    onSuccess: (_, valide) => {
      queryClient.invalidateQueries({ queryKey: ["suivis-terrain"] });
      toast.success(valide ? "Document validé" : "Document renvoyé au technicien");
    },
    onError: (err) => toast.error(messageErreur(err)),
  });
  return (
    <div className="flex flex-col gap-2 border-t border-gray-100 px-4 py-3 sm:flex-row sm:items-end">
      <label className="flex-1">
        <span className={etiquette}>Commentaire</span>
        <textarea
          rows={2}
          value={commentaire}
          onChange={(e) => setCommentaire(e.target.value)}
          className={champ}
        />
      </label>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            if (!commentaire.trim()) {
              toast.error("Indiquez ce qui est à revoir");
              return;
            }
            mutate(false);
          }}
          className="rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
        >
          À revoir
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => mutate(true)}
          className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-60"
        >
          Valider
        </button>
      </div>
    </div>
  );
}

function LigneSuivi({ suivi, avecTechnicien, peutDecider }) {
  const [ouvert, setOuvert] = useState(peutDecider);
  return (
    <li>
      <button
        type="button"
        onClick={() => setOuvert(!ouvert)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-gray-50"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium text-gray-900">{titreSuivi(suivi)}</span>
          <span className="block truncate text-xs text-gray-500">
            {[avecTechnicien && suivi.technicienNom, `remis le ${dateCourte(suivi.createdAt)}`]
              .filter(Boolean)
              .join(" · ")}
          </span>
        </span>
        <StatutBadge statut={suivi.statut} statuts={STATUTS_SUIVI} />
      </button>
      {ouvert && <DetailSuivi suivi={suivi} />}
      {ouvert && peutDecider && <Decision suivi={suivi} />}
    </li>
  );
}

// ── Remise par le technicien ─────────────────────────────────────────────────

function FormulaireSuivi({ suivis }) {
  const queryClient = useQueryClient();
  // Reprend le texte déjà remis pour ce mois (à corriger s'il est à revoir).
  const texteRemis = (t, m) => {
    const s = suivis.find((x) => x.type === t && x.mois === m);
    return s && s.statut !== "VALIDE" ? s.contenu : "";
  };
  const [type, setType] = useState("PLANNING");
  const [mois, setMois] = useState(moisDecale(0));
  const [contenu, setContenu] = useState(() => texteRemis("PLANNING", moisDecale(0)));
  const existant = suivis.find((s) => s.type === type && s.mois === mois);
  const verrouille = existant?.statut === "VALIDE";

  const moisPossibles = (t) => (t === "PLANNING" ? [-1, 0, 1] : [-2, -1, 0]).map((e) => moisDecale(e));
  const choixMois = moisPossibles(type);

  const choisir = (t, m) => {
    const moisValide = moisPossibles(t).includes(m) ? m : moisDecale(0);
    setType(t);
    setMois(moisValide);
    setContenu(texteRemis(t, moisValide));
  };

  const { mutate, isPending } = useMutation({
    mutationFn: () => suivisApi.soumettre({ type, mois, contenu: contenu.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suivis-terrain"] });
      toast.success(`${TYPES_SUIVI[type]} remis au superviseur`);
    },
    onError: (err) => toast.error(messageErreur(err)),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!contenu.trim()) {
          toast.error("Le contenu est obligatoire");
          return;
        }
        mutate();
      }}
      className="space-y-4 p-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className={etiquette}>Document</span>
          <select value={type} onChange={(e) => choisir(e.target.value, mois)} className={champ}>
            {Object.entries(TYPES_SUIVI).map(([code, libelle]) => (
              <option key={code} value={code}>
                {libelle}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className={etiquette}>Mois</span>
          <select value={mois} onChange={(e) => choisir(type, e.target.value)} className={champ}>
            {choixMois.map((m) => (
              <option key={m} value={m}>
                {libelleMois(m)}
              </option>
            ))}
          </select>
        </label>
      </div>
      {existant && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <StatutBadge statut={existant.statut} statuts={STATUTS_SUIVI} />
          {existant.statut === "A_REVOIR" && existant.commentaire && (
            <span className="text-red-700">{existant.commentaire}</span>
          )}
        </div>
      )}
      <label className="block">
        <span className={etiquette}>{type === "PLANNING" ? "Activités prévues" : "Activités réalisées et résultats"}</span>
        <textarea
          rows={8}
          value={contenu}
          disabled={verrouille}
          onChange={(e) => setContenu(e.target.value)}
          className={`${champ} disabled:bg-gray-50`}
        />
      </label>
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending || verrouille}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-60"
        >
          {isPending ? "Envoi…" : existant && !verrouille ? "Remettre à nouveau" : "Remettre au superviseur"}
        </button>
      </div>
    </form>
  );
}

// ── Pages ────────────────────────────────────────────────────────────────────

/** Planning et rapport du mois : remise (technicien), validation (superviseur). */
export function SuiviMensuelPage() {
  const { user } = useAuthStore();
  const roles = user?.roles ?? [];
  const technicien = aAcces(roles, [R.TT]);
  const superviseur = aAcces(roles, [R.SUP, R.ADMIN]);
  const [vue, setVue] = useState("attente");

  const { data: miens = [], isLoading: chargeMiens } = useSuivisMiens(technicien);
  const { data: equipe = [], isLoading: chargeEquipe } = useSuivisEquipe(superviseur);
  const enAttente = equipe.filter((s) => s.statut === "SOUMIS");
  const listeEquipe = vue === "attente" ? enAttente : equipe;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {superviseur && (
        <Bloc titre="Plannings et rapports de mon équipe">
          <div className="flex gap-1 border-b border-gray-100 px-4 py-2">
            {[
              ["attente", `À valider (${enAttente.length})`],
              ["tous", "Tous"],
            ].map(([code, libelle]) => (
              <button
                key={code}
                type="button"
                onClick={() => setVue(code)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                  vue === code ? "bg-primary/10 text-primary" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {libelle}
              </button>
            ))}
          </div>
          {chargeEquipe ? (
            <Vide>Chargement…</Vide>
          ) : listeEquipe.length ? (
            <ul className="divide-y divide-gray-100">
              {listeEquipe.map((s) => (
                <LigneSuivi
                  key={s.id}
                  suivi={s}
                  avecTechnicien
                  peutDecider={s.statut === "SOUMIS" && s.technicienId !== user?.id}
                />
              ))}
            </ul>
          ) : (
            <Vide>{vue === "attente" ? "Rien à valider." : "Aucun document remis."}</Vide>
          )}
        </Bloc>
      )}

      {technicien && (
        <>
          <Bloc titre="Remettre un planning ou un rapport">
            {chargeMiens ? <Vide>Chargement…</Vide> : <FormulaireSuivi suivis={miens} />}
          </Bloc>
          <Bloc titre="Mes plannings et rapports">
            {chargeMiens ? (
              <Vide>Chargement…</Vide>
            ) : miens.length ? (
              <ul className="divide-y divide-gray-100">
                {miens.map((s) => (
                  <LigneSuivi key={s.id} suivi={s} />
                ))}
              </ul>
            ) : (
              <Vide>Aucun document remis.</Vide>
            )}
          </Bloc>
        </>
      )}
    </div>
  );
}

/** Techniciens encadrés : périmètres, avancement, état du suivi mensuel. */
export function TableauEquipe({ membres, chargement }) {
  if (chargement) return <Vide>Chargement…</Vide>;
  if (!membres.length) return <Vide>Aucun technicien sur vos périmètres.</Vide>;
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-100 text-sm">
        <thead className="bg-gray-50">
          <tr>
            {["Technicien", "Activités réalisées", "En retard", "Personnes formées", "Planning du mois", "Dernier rapport"].map(
              (t) => (
                <th key={t} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {t}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {membres.map((m) => (
            <tr key={m.technicienId}>
              <td className="px-4 py-3">
                <p className="font-medium text-gray-900">{m.nom}</p>
                <p className="text-xs text-gray-500">{m.perimetres.join(", ")}</p>
              </td>
              <td className="px-4 py-3 tabular-nums text-gray-700">
                {m.activitesRealisees} sur {m.activitesPrevues}
              </td>
              <td className={`px-4 py-3 tabular-nums ${m.enRetard ? "font-semibold text-red-600" : "text-gray-700"}`}>
                {m.enRetard}
              </td>
              <td className="px-4 py-3 tabular-nums text-gray-700">
                {nombre(m.personnesFormees)}
                <span className="block text-xs text-gray-500">
                  {m.formations} formation{m.formations > 1 ? "s" : ""}
                </span>
              </td>
              <td className="px-4 py-3">
                {m.planningDuMois ? (
                  <StatutBadge statut={m.planningDuMois} statuts={STATUTS_SUIVI} />
                ) : (
                  <span className="text-xs text-gray-400">Non remis</span>
                )}
              </td>
              <td className="px-4 py-3">
                {m.dernierRapport ? (
                  <>
                    <StatutBadge statut={m.dernierRapport} statuts={STATUTS_SUIVI} />
                    <span className="block text-xs text-gray-500">{libelleMois(m.moisDernierRapport)}</span>
                  </>
                ) : (
                  <span className="text-xs text-gray-400">Aucun</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function EquipePage() {
  const { data: membres = [], isLoading } = useMembresEquipe();
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Carte libelle="Techniciens" valeur={membres.length} chargement={isLoading} />
        <Carte
          libelle="Activités réalisées"
          valeur={`${membres.reduce((t, m) => t + m.activitesRealisees, 0)} sur ${membres.reduce((t, m) => t + m.activitesPrevues, 0)}`}
          chargement={isLoading}
        />
        <Carte
          libelle="En retard"
          valeur={membres.reduce((t, m) => t + m.enRetard, 0)}
          alerte={membres.some((m) => m.enRetard > 0)}
          chargement={isLoading}
        />
        <Carte
          libelle="Personnes formées"
          valeur={nombre(membres.reduce((t, m) => t + m.personnesFormees, 0))}
          chargement={isLoading}
        />
      </section>
      <Bloc titre="Mon équipe">
        <TableauEquipe membres={membres} chargement={isLoading} />
      </Bloc>
    </div>
  );
}

// ── Blocs de l'accueil ───────────────────────────────────────────────────────

/** Technicien : état du planning du mois et du dernier rapport. */
export function BlocSuiviTechnicien() {
  const { data: miens = [], isLoading } = useSuivisMiens();
  const moisCourant = moisDecale(0);
  const planning = miens.find((s) => s.type === "PLANNING" && s.mois === moisCourant);
  const rapport = miens.find((s) => s.type === "RAPPORT");
  const ligne = (libelle, suivi, absent) => (
    <li className="flex items-center gap-3 px-4 py-3 text-sm">
      <span className="min-w-0 flex-1">
        <span className="block font-medium text-gray-900">{libelle}</span>
        {suivi?.statut === "A_REVOIR" && suivi.commentaire && (
          <span className="block truncate text-xs text-red-700">{suivi.commentaire}</span>
        )}
      </span>
      {suivi ? (
        <StatutBadge statut={suivi.statut} statuts={STATUTS_SUIVI} />
      ) : (
        <span className="text-xs text-gray-400">{absent}</span>
      )}
    </li>
  );
  return (
    <Bloc titre="Planning et rapport" lien="/terrain/suivi" libelleLien="Remettre">
      {isLoading ? (
        <Vide>Chargement…</Vide>
      ) : (
        <ul className="divide-y divide-gray-100">
          {ligne(`Planning de ${libelleMois(moisCourant)}`, planning, "Non remis")}
          {ligne(rapport ? `Rapport de ${libelleMois(rapport.mois)}` : "Dernier rapport", rapport, "Aucun")}
        </ul>
      )}
    </Bloc>
  );
}

/** Superviseur : ce qui attend sa décision, puis son équipe. */
export function BlocsSuperviseur() {
  const { user } = useAuthStore();
  const { data: suivis = [], isLoading: chargeSuivis } = useSuivisEquipe();
  const { data: achats = [], isLoading: chargeAchats } = useAcquisitions();
  const { data: membres = [], isLoading: chargeMembres } = useMembresEquipe();
  const achatsAViser = achats.filter((a) => a.statut === "ATTENTE_SUPERVISEUR" && a.soumisParId !== user?.id);
  const plannings = suivis.filter((s) => s.statut === "SOUMIS" && s.type === "PLANNING");
  const rapports = suivis.filter((s) => s.statut === "SOUMIS" && s.type === "RAPPORT");
  return (
    <>
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Carte
          libelle="Achats à viser"
          valeur={achatsAViser.length}
          lien="/acquisitions"
          alerte={achatsAViser.length > 0}
          chargement={chargeAchats}
        />
        <Carte
          libelle="Plannings à valider"
          valeur={plannings.length}
          lien="/terrain/suivi"
          alerte={plannings.length > 0}
          chargement={chargeSuivis}
        />
        <Carte
          libelle="Rapports à valider"
          valeur={rapports.length}
          lien="/terrain/suivi"
          alerte={rapports.length > 0}
          chargement={chargeSuivis}
        />
      </section>
      <Bloc titre="Mon équipe" lien="/terrain/equipe" libelleLien="Voir tout">
        <TableauEquipe membres={membres} chargement={chargeMembres} />
      </Bloc>
    </>
  );
}
