import {
  FORMATS_WORD,
  STATUTS_SUIVI,
  TYPES_SUIVI,
  libelleMois,
  moisDecale,
  suivisApi,
  telechargerRapport,
} from "@/api/suivis";
import { taille } from "@/api/pieces";
import StatutBadge from "@/components/demande/StatutBadge";
import { Bloc, Carte, Vide } from "@/components/tableau/Blocs";
import { messageErreur } from "@/lib/erreurs";
import { dateCourte } from "@/lib/format";
import { R, aAcces } from "@/lib/navigation";
import useAuthStore from "@/stores/auth.store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";

// ─────────────────────────────────────────────────────────────────────────────
// Espace terrain : planning et rapport mensuels (technicien, animateur), visa
// du superviseur, validation du coordonnateur, équipe ; rapports validés pour
// le RAF, le RP, le SE et le suivi-évaluation. Les blocs d'accueil réutilisent
// les mêmes requêtes.
// ─────────────────────────────────────────────────────────────────────────────

const CLE_MIENS = ["suivis-terrain", "miens"];
const CLE_EQUIPE = ["suivis-terrain", "equipe"];
const CLE_MEMBRES = ["suivis-terrain", "membres"];
const CLE_VALIDES = ["suivis-terrain", "valides"];
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

/** Ce que doit faire celui qui décide : viser (superviseur) ou valider (coordonnateur). */
const etapeVisa = (s) => s.statut === "SOUMIS";

/** Lien de téléchargement du rapport Word. */
function LienRapport({ suivi, initial = false, libelle }) {
  const [enCours, setEnCours] = useState(false);
  const nom = initial ? suivi.fichierInitialNom : suivi.fichierNom;
  return (
    <button
      type="button"
      disabled={enCours}
      onClick={async () => {
        setEnCours(true);
        try {
          await telechargerRapport(suivi, initial);
        } catch (err) {
          toast.error(messageErreur(err));
        } finally {
          setEnCours(false);
        }
      }}
      className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-left text-sm text-primary hover:bg-gray-50 disabled:opacity-60"
    >
      <span className="font-medium">{libelle ?? nom}</span>
      {!initial && suivi.fichierTaille != null && (
        <span className="text-xs text-gray-500">{taille(suivi.fichierTaille)}</span>
      )}
    </button>
  );
}

// ── Détail d'un planning ou d'un rapport ─────────────────────────────────────

function DetailSuivi({ suivi }) {
  const [initial, setInitial] = useState(false);
  const circuit = [
    suivi.projetCode,
    suivi.viseParNom && `visé par ${suivi.viseParNom} le ${dateCourte(suivi.dateVisa)}`,
    suivi.statut === "VALIDE" && suivi.decideParNom && `validé par ${suivi.decideParNom} le ${dateCourte(suivi.dateDecision)}`,
  ].filter(Boolean);
  return (
    <div className="space-y-3 px-4 pb-4 text-sm">
      {circuit.length > 0 && <p className="text-xs text-gray-500">{circuit.join(" · ")}</p>}
      {suivi.fichierNom && (
        <div className="flex flex-wrap items-center gap-3">
          <LienRapport suivi={suivi} />
          {suivi.fichierInitialNom && (
            <span className="text-xs text-gray-500">
              Corrigé par le superviseur.{" "}
              <LienRapport suivi={suivi} initial libelle="Version de l’auteur" />
            </span>
          )}
        </div>
      )}
      {suivi.contenu && (
        <p className="whitespace-pre-line rounded-md bg-gray-50 p-3 text-gray-800">{suivi.contenu}</p>
      )}
      {suivi.contenuInitial && (
        <div>
          <button
            type="button"
            onClick={() => setInitial(!initial)}
            className="text-xs font-medium text-primary hover:underline"
          >
            {initial ? "Masquer le texte d’origine" : "Corrigé par le superviseur : voir le texte d’origine"}
          </button>
          {initial && (
            <p className="mt-2 whitespace-pre-line rounded-md border border-dashed border-gray-300 p-3 text-gray-600">
              {suivi.contenuInitial}
            </p>
          )}
        </div>
      )}
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
          <span className="font-semibold">
            {suivi.statut === "A_REVOIR"
              ? `Renvoyé par ${suivi.decideParNom ?? "le validateur"}`
              : suivi.statut === "TRANSMIS"
                ? suivi.viseParNom ?? "Superviseur"
                : suivi.decideParNom ?? "Validation"}{" "}
            :{" "}
          </span>
          {suivi.commentaire}
        </p>
      )}
    </div>
  );
}

/**
 * Décision sur un document : le superviseur le vise (en corrigeant le texte au
 * besoin) et le transmet ; le coordonnateur le valide. Tous deux peuvent le
 * renvoyer à son auteur avec un commentaire.
 */
function Decision({ suivi }) {
  const queryClient = useQueryClient();
  const [commentaire, setCommentaire] = useState("");
  const [correction, setCorrection] = useState(null);
  const corrige = correction !== null && correction.trim() && correction.trim() !== suivi.contenu;
  const { mutate, isPending } = useMutation({
    mutationFn: (valide) =>
      suivisApi.decider(suivi.id, valide, commentaire.trim() || null, valide && corrige ? correction.trim() : null),
    onSuccess: (r, valide) => {
      queryClient.invalidateQueries({ queryKey: ["suivis-terrain"] });
      toast.success(
        !valide
          ? `Renvoyé à ${suivi.technicienNom ?? "son auteur"} pour correction`
          : r.statut === "TRANSMIS"
            ? "Validé et transmis au coordonnateur"
            : "Document validé",
      );
    },
    onError: (err) => toast.error(messageErreur(err)),
  });
  const fichierCorrige = useRef(null);
  const correctionFichier = useMutation({
    mutationFn: (fichier) => suivisApi.corriger(suivi.id, fichier),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suivis-terrain"] });
      toast.success("Version corrigée enregistrée");
    },
    onError: (err) => toast.error(messageErreur(err)),
  });
  return (
    <div className="space-y-3 border-t border-gray-100 px-4 py-3">
      {etapeVisa(suivi) && suivi.type === "RAPPORT" && (
        <div>
          <input
            ref={fichierCorrige}
            type="file"
            accept={FORMATS_WORD}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) correctionFichier.mutate(f);
            }}
          />
          <button
            type="button"
            disabled={correctionFichier.isPending}
            onClick={() => fichierCorrige.current?.click()}
            className="text-xs font-medium text-primary hover:underline disabled:opacity-60"
          >
            {correctionFichier.isPending ? "Envoi…" : "Déposer une version corrigée"}
          </button>
        </div>
      )}
      {etapeVisa(suivi) &&
        suivi.type === "PLANNING" &&
        (correction === null ? (
          <button
            type="button"
            onClick={() => setCorrection(suivi.contenu)}
            className="text-xs font-medium text-primary hover:underline"
          >
            Corriger le texte
          </button>
        ) : (
          <label className="block">
            <span className={etiquette}>Texte corrigé</span>
            <textarea rows={8} value={correction} onChange={(e) => setCorrection(e.target.value)} className={champ} />
          </label>
        ))}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
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
                toast.error("Indiquez ce qui est à corriger");
                return;
              }
              mutate(false);
            }}
            className="rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
          >
            Renvoyer pour correction
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => mutate(true)}
            className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-60"
          >
            {etapeVisa(suivi) && corrige ? "Valider avec la correction" : "Valider"}
          </button>
        </div>
      </div>
    </div>
  );
}

function LigneSuivi({ suivi, avecTechnicien, peutDecider, sousTitre }) {
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
            {[
              avecTechnicien && suivi.technicienNom,
              sousTitre ?? [suivi.projetCode, `remis le ${dateCourte(suivi.createdAt)}`].filter(Boolean).join(" · "),
            ]
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

function FormulaireSuivi({ suivis, projets }) {
  const queryClient = useQueryClient();
  const [type, setType] = useState("RAPPORT");
  const [mois, setMois] = useState(moisDecale(0));
  const [projetId, setProjetId] = useState(projets.length === 1 ? projets[0].id : "");
  const trouver = (t, m, p) => suivis.find((x) => x.type === t && x.mois === m && x.projetId === p);
  // Reprend le texte déjà remis (à corriger s'il est renvoyé).
  const texteRemis = (t, m, p) => {
    const s = trouver(t, m, p);
    return s && s.statut !== "VALIDE" ? s.contenu ?? "" : "";
  };
  const [contenu, setContenu] = useState(() => texteRemis("RAPPORT", moisDecale(0), projetId));
  const [fichier, setFichier] = useState(null);
  const champFichier = useRef(null);
  const existant = trouver(type, mois, projetId);
  const verrouille = existant?.statut === "VALIDE" || existant?.statut === "TRANSMIS";
  const rapport = type === "RAPPORT";

  const moisPossibles = (t) => (t === "PLANNING" ? [-1, 0, 1] : [-2, -1, 0]).map((e) => moisDecale(e));
  const choixMois = moisPossibles(type);

  const choisir = (t, m, p) => {
    const moisValide = moisPossibles(t).includes(m) ? m : moisDecale(0);
    setType(t);
    setMois(moisValide);
    setProjetId(p);
    setContenu(texteRemis(t, moisValide, p));
    setFichier(null);
    if (champFichier.current) champFichier.current.value = "";
  };

  const { mutate, isPending } = useMutation({
    mutationFn: () => suivisApi.soumettre({ type, mois, projetId, contenu: contenu.trim() || null }, fichier),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suivis-terrain"] });
      toast.success(`${TYPES_SUIVI[type]} remis`);
      setFichier(null);
      if (champFichier.current) champFichier.current.value = "";
    },
    onError: (err) => toast.error(messageErreur(err)),
  });

  if (!projets.length) return <Vide>Aucun projet ne vous est affecté.</Vide>;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!projetId) {
          toast.error("Choisissez le projet");
          return;
        }
        if (rapport && !fichier) {
          toast.error("Joignez le rapport au format Word");
          return;
        }
        if (!rapport && !contenu.trim()) {
          toast.error("Décrivez les activités prévues");
          return;
        }
        mutate();
      }}
      className="space-y-4 p-4"
    >
      <div className={`grid gap-4 ${projets.length > 1 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
        <label>
          <span className={etiquette}>Document</span>
          <select value={type} onChange={(e) => choisir(e.target.value, mois, projetId)} className={champ}>
            {Object.entries(TYPES_SUIVI).map(([code, libelle]) => (
              <option key={code} value={code}>
                {libelle}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className={etiquette}>Mois</span>
          <select value={mois} onChange={(e) => choisir(type, e.target.value, projetId)} className={champ}>
            {choixMois.map((m) => (
              <option key={m} value={m}>
                {libelleMois(m)}
              </option>
            ))}
          </select>
        </label>
        {projets.length > 1 && (
          <label>
            <span className={etiquette}>Projet</span>
            <select value={projetId} onChange={(e) => choisir(type, mois, e.target.value)} className={champ}>
              <option value="">Choisir</option>
              {projets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} · {p.titre}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      {existant && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
          <StatutBadge statut={existant.statut} statuts={STATUTS_SUIVI} />
          {existant.fichierNom && <LienRapport suivi={existant} />}
          {existant.statut === "A_REVOIR" && existant.commentaire && (
            <span className="text-red-700">
              {existant.decideParNom ? `${existant.decideParNom} : ` : ""}
              {existant.commentaire}
            </span>
          )}
        </div>
      )}
      {rapport && (
        <label className="block">
          <span className={etiquette}>Rapport (Word)</span>
          <input
            ref={champFichier}
            type="file"
            accept={FORMATS_WORD}
            disabled={verrouille}
            onChange={(e) => setFichier(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary disabled:opacity-60"
          />
        </label>
      )}
      <label className="block">
        <span className={etiquette}>{rapport ? "Résumé" : "Activités prévues"}</span>
        <textarea
          rows={rapport ? 3 : 8}
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
          {isPending ? "Envoi…" : existant && !verrouille ? "Remettre à nouveau" : "Remettre"}
        </button>
      </div>
    </form>
  );
}

// ── Pages ────────────────────────────────────────────────────────────────────

/** Planning et rapport du mois : remise (technicien, animateur), visa (superviseur), validation (coordonnateur). */
export function SuiviMensuelPage() {
  const { user } = useAuthStore();
  const roles = user?.roles ?? [];
  const technicien = aAcces(roles, [R.TT, R.ANIM]);
  const superviseur = aAcces(roles, [R.SUP, R.CP, R.RP, R.ADMIN]);
  const [vue, setVue] = useState("attente");

  const { data: miens = [], isLoading: chargeMiens } = useSuivisMiens(technicien);
  const { data: mesProjets = [], isLoading: chargeProjets } = useQuery({
    queryKey: ["suivis-terrain", "mes-projets"],
    queryFn: suivisApi.mesProjets,
    enabled: technicien,
  });
  const { data: equipe = [], isLoading: chargeEquipe } = useSuivisEquipe(superviseur);
  const enAttente = equipe.filter((s) => s.aDecider);
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
                  peutDecider={s.aDecider}
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
            {chargeMiens || chargeProjets ? (
              <Vide>Chargement…</Vide>
            ) : (
              <FormulaireSuivi suivis={miens} projets={mesProjets} />
            )}
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
  if (!membres.length) return <Vide>Personne dans votre équipe pour le moment.</Vide>;
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-100 text-sm">
        <thead className="bg-gray-50">
          <tr>
            {["Membre", "Activités réalisées", "En retard", "Participants", "Planning du mois", "Dernier rapport"].map(
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
        <Carte libelle="Membres" valeur={membres.length} chargement={isLoading} />
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
          libelle="Participants"
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

/** Plannings et rapports validés par le coordonnateur : RAF, RP, SE, suivi-évaluation. */
export function RapportsTerrainPage() {
  const { data: valides = [], isLoading } = useQuery({ queryKey: CLE_VALIDES, queryFn: suivisApi.valides });
  const [type, setType] = useState("RAPPORT");
  const [projet, setProjet] = useState("");
  const projets = [...new Set(valides.map((s) => s.projetCode).filter(Boolean))].sort();
  const liste = valides.filter((s) => (!type || s.type === type) && (!projet || s.projetCode === projet));
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Bloc titre="Rapports de terrain validés">
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 px-4 py-2">
          {[
            ["RAPPORT", "Rapports"],
            ["PLANNING", "Plannings"],
            ["", "Tous"],
          ].map(([code, libelle]) => (
            <button
              key={code || "tous"}
              type="button"
              onClick={() => setType(code)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                type === code ? "bg-primary/10 text-primary" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {libelle}
            </button>
          ))}
          {projets.length > 1 && (
            <select
              value={projet}
              onChange={(e) => setProjet(e.target.value)}
              aria-label="Projet"
              className="ml-auto rounded-md border border-gray-300 px-2 py-1.5 text-xs"
            >
              <option value="">Tous les projets</option>
              {projets.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          )}
        </div>
        {isLoading ? (
          <Vide>Chargement…</Vide>
        ) : liste.length ? (
          <ul className="divide-y divide-gray-100">
            {liste.map((s) => (
              <LigneSuivi
                key={s.id}
                suivi={s}
                avecTechnicien
                sousTitre={[s.projetCode, `validé le ${dateCourte(s.dateDecision)}`]
                  .filter(Boolean)
                  .join(" · ")}
              />
            ))}
          </ul>
        ) : (
          <Vide>Aucun document validé.</Vide>
        )}
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
  const { data: suivis = [], isLoading: chargeSuivis } = useSuivisEquipe();
  const { data: membres = [], isLoading: chargeMembres } = useMembresEquipe();
  const plannings = suivis.filter((s) => s.aDecider && s.type === "PLANNING");
  const rapports = suivis.filter((s) => s.aDecider && s.type === "RAPPORT");
  return (
    <>
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
