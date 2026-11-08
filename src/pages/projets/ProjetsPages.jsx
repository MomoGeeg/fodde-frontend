import { FREQUENCES, NIVEAUX, TYPES, creerIndicateur, valeur } from "@/api/indicateurs";
import {
  CATEGORIES_BUDGET,
  CREATEURS_PROJET,
  ETAPES_PROJET,
  STATUTS_PROJET,
  actionsProjet,
  ajouterMembre,
  ajouterObjectif,
  ajouterResultat,
  creerActivite,
  creerProjet,
  enregistrerBudget,
  modifierProjet,
  modifierResultat,
  projetATraiter,
  retirerMembre,
  supprimerActivite,
  supprimerObjectif,
  supprimerResultat,
  useMontage,
  usePersonnes,
  useProjetsListe,
} from "@/api/projets";
import Cellule from "@/components/demande/Cellule";
import FicheDemande from "@/components/demande/FicheDemande";
import { CHAMP, CadreFormulaire, Ligne } from "@/components/demande/Formulaire";
import ListeDemandes from "@/components/demande/ListeDemandes";
import { messageErreur } from "@/lib/erreurs";
import { dateCourte, montant } from "@/lib/format";
import { LIBELLES_ROLES, R, aAcces } from "@/lib/navigation";
import useAuthStore from "@/stores/auth.store";
import { useQueryClient } from "@tanstack/react-query";
import { Check, CircleAlert, Info, Pencil, Plus, Trash2, X } from "lucide-react";
import { useCallback, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

const periode = (p) => `${dateCourte(p.dateDebut)} → ${dateCourte(p.dateFin)}`;

// ═════════════════════════════════════════════════════════════════════════════
// Liste
// ═════════════════════════════════════════════════════════════════════════════

const COLONNES = [
  { titre: "Projet", rendu: (p) => <Cellule principal={p.titre} secondaire={p.code} /> },
  { titre: "Chef de projet", rendu: (p) => <Cellule principal={p.chefProjetNom ?? "—"} secondaire={p.zoneGeographique} /> },
  { titre: "Période", rendu: (p) => periode(p) },
  { titre: "Budget", droite: true, rendu: (p) => (Number(p.budgetTotal) > 0 ? montant(p.budgetTotal, p.devise) : "—") },
];

export function ProjetsPage() {
  const { user } = useAuthStore();
  const roles = user?.roles ?? [];
  const { data, isLoading, isError } = useProjetsListe();
  const aTraiter = useCallback((p) => projetATraiter(p, roles, user?.id), [roles, user]);
  return (
    <ListeDemandes
      demandes={data}
      isLoading={isLoading}
      isError={isError}
      aTraiter={aTraiter}
      statuts={STATUTS_PROJET}
      colonnes={COLONNES}
      texteRecherche={(p) => [p.titre, p.code, p.zoneGeographique, p.chefProjetNom, p.responsableNom]}
      lien={(p) => `/projets/${p.id}`}
      placeholder="Titre, code, zone, chef de projet…"
      nouveau={aAcces(roles, CREATEURS_PROJET) ? { label: "Nouveau projet", to: "/projets/nouveau" } : undefined}
    />
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Fiche (création et modification)
// ═════════════════════════════════════════════════════════════════════════════

export function ProjetFormPage() {
  const { id } = useParams();
  const { data: m, isLoading } = useMontage(id);
  if (id && isLoading) return <p className="text-sm text-gray-500">Chargement…</p>;
  return <FormulaireProjet key={id ?? "nouveau"} projet={m?.projet} />;
}

function FormulaireProjet({ projet }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { data: personnes = [] } = usePersonnes();
  const [f, setF] = useState(() => ({
    code: projet?.code ?? "",
    titre: projet?.titre ?? "",
    objectifGeneral: projet?.objectifGeneral ?? "",
    description: projet?.description ?? "",
    zoneGeographique: projet?.zoneGeographique ?? "",
    dateDebut: projet?.dateDebut ?? "",
    dateFin: projet?.dateFin ?? "",
    devise: projet?.devise ?? "XOF",
    chefProjetId: projet?.chefProjetId ?? "",
    responsableId: projet?.responsableId ?? user?.id ?? "",
  }));
  const [erreurs, setErreurs] = useState({});
  const [envoi, setEnvoi] = useState(false);
  const maj = (cle) => (e) => {
    setF((p) => ({ ...p, [cle]: e.target.value }));
    setErreurs((p) => ({ ...p, [cle]: undefined }));
  };
  // Chargés de programme d'abord : ce sont eux qui conduisent les projets.
  const candidatsChef = [...personnes].sort(
    (a, b) => Number(b.roles.includes(R.CP)) - Number(a.roles.includes(R.CP)),
  );

  const soumettre = async () => {
    const e = {};
    if (!f.titre.trim()) e.titre = "Indiquez le titre du projet.";
    if (!f.dateDebut) e.dateDebut = "Indiquez la date de début.";
    if (!f.dateFin) e.dateFin = "Indiquez la date de fin.";
    else if (f.dateDebut && f.dateFin < f.dateDebut) e.dateFin = "La fin doit suivre le début.";
    setErreurs(e);
    if (Object.keys(e).length) return;
    setEnvoi(true);
    try {
      const payload = {
        ...f,
        code: f.code.trim() || null,
        titre: f.titre.trim(),
        chefProjetId: f.chefProjetId || null,
        responsableId: f.responsableId || null,
      };
      const p = projet ? await modifierProjet(projet.id, payload) : await creerProjet(payload);
      await queryClient.invalidateQueries({ queryKey: ["projets"] });
      toast.success(projet ? "Fiche enregistrée" : "Projet créé : complétez le cadre logique et le budget");
      navigate(`/projets/${p.id}`);
    } catch (err) {
      toast.error(messageErreur(err));
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <CadreFormulaire
      retour={projet ? { to: `/projets/${projet.id}`, label: projet.titre } : { to: "/projets", label: "Projets" }}
      titre={projet ? "Modifier la fiche du projet" : "Nouveau projet"}
      onSoumettre={soumettre}
      libelleSoumettre={projet ? "Enregistrer" : "Créer le projet"}
      envoi={envoi}
    >
      <Ligne libelle="Titre" erreur={erreurs.titre}>
        <input value={f.titre} onChange={maj("titre")} className={CHAMP} />
      </Ligne>
      <Ligne libelle="Objectif général" aide="Le changement durable auquel le projet contribue.">
        <textarea value={f.objectifGeneral} onChange={maj("objectifGeneral")} rows={2} className={CHAMP} />
      </Ligne>
      <Ligne libelle="Description (facultatif)">
        <textarea value={f.description} onChange={maj("description")} rows={3} className={CHAMP} />
      </Ligne>
      <div className="grid gap-4 sm:grid-cols-2">
        <Ligne libelle="Zone d'intervention">
          <input value={f.zoneGeographique} onChange={maj("zoneGeographique")} placeholder="Ex. Kolda, Vélingara" className={CHAMP} />
        </Ligne>
        <Ligne libelle="Code (facultatif)" aide={projet ? undefined : "Attribué automatiquement s'il est vide."}>
          <input value={f.code} onChange={maj("code")} disabled={!!projet} placeholder="PROJ-AAAA-NNN" className={CHAMP} />
        </Ligne>
        <Ligne libelle="Début" erreur={erreurs.dateDebut}>
          <input type="date" value={f.dateDebut} onChange={maj("dateDebut")} className={CHAMP} />
        </Ligne>
        <Ligne libelle="Fin" erreur={erreurs.dateFin}>
          <input type="date" value={f.dateFin} min={f.dateDebut} onChange={maj("dateFin")} className={CHAMP} />
        </Ligne>
        <Ligne libelle="Chef de projet" aide="Il complète le cadre logique avec vous et suivra l'exécution.">
          <select value={f.chefProjetId} onChange={maj("chefProjetId")} className={CHAMP}>
            <option value="">À désigner</option>
            {candidatsChef.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nom}
                {p.roles.includes(R.CP) ? " — chargé de programme" : ""}
              </option>
            ))}
          </select>
        </Ligne>
        <Ligne libelle="Devise">
          <select value={f.devise} onChange={maj("devise")} className={CHAMP}>
            <option value="XOF">F CFA</option>
            <option value="EUR">Euro</option>
            <option value="USD">Dollar</option>
          </select>
        </Ligne>
      </div>
      {!projet && (
        <p className="rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-600">
          Le budget se saisit ensuite, ligne par ligne, dans l'onglet Budget du projet.
        </p>
      )}
    </CadreFormulaire>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Fiche projet
// ═════════════════════════════════════════════════════════════════════════════

const ONGLETS = [
  { cle: "cadre", label: "Cadre logique" },
  { cle: "budget", label: "Budget" },
  { cle: "equipe", label: "Équipe" },
];

export function ProjetFichePage() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const roles = user?.roles ?? [];
  const { data: m, isLoading, isError } = useMontage(id);
  const [onglet, setOnglet] = useState("cadre");
  const p = m?.projet;

  return (
    <FicheDemande
      retour={{ to: "/projets", label: "Projets" }}
      isLoading={isLoading}
      introuvable={isError || !p}
      {...(p && {
        historique: `/api/projets/${p.id}/historique`,
        reference: `${p.code}${p.zoneGeographique ? ` · ${p.zoneGeographique}` : ""}`,
        titre: p.titre,
        montant: Number(p.budgetTotal) > 0 ? montant(p.budgetTotal, p.devise) : null,
        statut: p.statut,
        statuts: STATUTS_PROJET,
        etapes: ETAPES_PROJET,
        actions: actionsProjet(m, roles),
        champs: [
          { libelle: "Période", valeur: periode(p) },
          { libelle: "Responsable", valeur: p.responsableNom },
          { libelle: "Chef de projet", valeur: p.chefProjetNom ?? "À désigner" },
          { libelle: "Objectif général", valeur: p.objectifGeneral },
          { libelle: "Description", valeur: p.description },
        ],
      })}
    >
      {m && (
        <>
          {p.statut === "BROUILLON" && p.motifRenvoi && (
            <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <CircleAlert size={18} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Projet renvoyé en montage</p>
                <p className="mt-0.5">{p.motifRenvoi}</p>
              </div>
            </div>
          )}
          {p.statut === "BROUILLON" && <BlocControles m={m} />}
          {m.peutModifier && (
            <div className="flex justify-end">
              <Link
                to={`/projets/${p.id}/modifier`}
                className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Pencil size={14} /> Modifier la fiche
              </Link>
            </div>
          )}
          <div className="rounded-lg border border-gray-200 bg-white">
            <div className="flex gap-1 border-b border-gray-200 px-3">
              {ONGLETS.map((o) => (
                <button
                  key={o.cle}
                  onClick={() => setOnglet(o.cle)}
                  className={`-mb-px border-b-2 px-3 py-2.5 text-sm ${
                    onglet === o.cle ? "border-primary font-medium text-gray-900" : "border-transparent text-gray-500 hover:text-gray-800"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
            <div className="p-5">
              {onglet === "cadre" && <OngletCadre m={m} />}
              {onglet === "budget" && <OngletBudget key={m.budget.map((l) => l.id).join()} m={m} />}
              {onglet === "equipe" && <OngletEquipe m={m} roles={roles} userId={user?.id} />}
            </div>
          </div>
        </>
      )}
    </FicheDemande>
  );
}

/** Rechargement de la fiche après une modification. */
function useRecharger(id) {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["projets", id, "montage"] });
}

/** Exécute un appel, affiche l'erreur éventuelle, recharge la fiche. */
function useAppel(id) {
  const recharger = useRecharger(id);
  return async (appel, succes) => {
    try {
      await appel();
      await recharger();
      if (succes) toast.success(succes);
      return true;
    } catch (err) {
      toast.error(messageErreur(err));
      return false;
    }
  };
}

function BlocControles({ m }) {
  const bloquants = m.controles.filter((c) => c.bloquant);
  const prets = bloquants.filter((c) => c.ok).length;
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-900">Avant de soumettre</h3>
        <span className="text-xs text-gray-500">
          {prets} / {bloquants.length} points prêts
        </span>
      </div>
      <ul className="mt-3 grid gap-1.5 text-sm sm:grid-cols-2">
        {m.controles.map((c) => (
          <li key={c.libelle} className="flex items-start gap-2">
            {c.ok ? (
              <Check size={16} className="mt-0.5 shrink-0 text-primary" />
            ) : c.bloquant ? (
              <X size={16} className="mt-0.5 shrink-0 text-danger" />
            ) : (
              <Info size={16} className="mt-0.5 shrink-0 text-amber-600" />
            )}
            <span className={c.ok ? "text-gray-700" : c.bloquant ? "text-gray-900" : "text-amber-800"}>
              {c.libelle}
              {!c.bloquant && !c.ok ? " (à compléter, sans bloquer)" : ""}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Cadre logique ─────────────────────────────────────────────────────────────

function OngletCadre({ m }) {
  const id = m.projet.id;
  const appel = useAppel(id);
  const edit = m.peutModifier;
  const [nouvelObjectif, setNouvelObjectif] = useState("");
  const [nouveauResultat, setNouveauResultat] = useState({ libelle: "", objectifId: "" });
  const sansResultat = m.activites.filter((a) => !a.resultatId);
  const numero = (o) => m.objectifs.findIndex((x) => x.id === o) + 1;

  return (
    <div className="space-y-6">
      <section>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Objectif général</h4>
        <p className="mt-1 text-sm text-gray-900">{m.projet.objectifGeneral || "À renseigner dans la fiche du projet."}</p>
      </section>

      <section>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Objectifs spécifiques</h4>
        {m.objectifs.length === 0 && <p className="mt-1 text-sm text-gray-500">Aucun objectif spécifique (facultatif).</p>}
        <ol className="mt-2 space-y-1 text-sm">
          {m.objectifs.map((o, i) => (
            <li key={o.id} className="flex items-start gap-2">
              <span className="font-medium text-gray-500">OS{i + 1}</span>
              <span className="flex-1 text-gray-900">{o.libelle}</span>
              {edit && (
                <BoutonSupprimer
                  titre="Retirer l'objectif"
                  onClick={() => appel(() => supprimerObjectif(id, o.id), "Objectif retiré")}
                />
              )}
            </li>
          ))}
        </ol>
        {edit && (
          <AjoutEnLigne
            valeur={nouvelObjectif}
            setValeur={setNouvelObjectif}
            placeholder="Nouvel objectif spécifique"
            onAjouter={async () => {
              if (await appel(() => ajouterObjectif(id, { libelle: nouvelObjectif.trim() }))) setNouvelObjectif("");
            }}
          />
        )}
      </section>

      <section className="space-y-4">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Résultats attendus, activités et indicateurs</h4>
        {m.resultats.length === 0 && <p className="text-sm text-gray-500">Ajoutez au moins un résultat attendu.</p>}
        {m.resultats.map((r, i) => (
          <CarteResultat key={r.id} m={m} r={r} n={i + 1} numeroObjectif={numero} />
        ))}
        {edit && (
          <div className="rounded-md border border-dashed border-gray-300 p-3">
            <div className="grid gap-2 sm:grid-cols-[1fr_12rem_auto]">
              <input
                value={nouveauResultat.libelle}
                onChange={(e) => setNouveauResultat((x) => ({ ...x, libelle: e.target.value }))}
                placeholder="Nouveau résultat attendu (ex. 300 ménages ont accès à l'eau potable)"
                className={CHAMP}
              />
              <select
                value={nouveauResultat.objectifId}
                onChange={(e) => setNouveauResultat((x) => ({ ...x, objectifId: e.target.value }))}
                className={CHAMP}
                aria-label="Objectif spécifique"
              >
                <option value="">Sans objectif spécifique</option>
                {m.objectifs.map((o, j) => (
                  <option key={o.id} value={o.id}>
                    OS{j + 1}
                  </option>
                ))}
              </select>
              <button
                disabled={!nouveauResultat.libelle.trim()}
                onClick={async () => {
                  const ok = await appel(() =>
                    ajouterResultat(id, { libelle: nouveauResultat.libelle.trim(), objectifId: nouveauResultat.objectifId || null }),
                  );
                  if (ok) setNouveauResultat({ libelle: "", objectifId: "" });
                }}
                className="inline-flex items-center justify-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
              >
                <Plus size={15} /> Ajouter le résultat
              </button>
            </div>
          </div>
        )}
        {sansResultat.length > 0 && (
          <div className="rounded-md border border-gray-200 p-4">
            <p className="text-sm font-medium text-gray-900">Activités sans résultat</p>
            <ListeActivites m={m} activites={sansResultat} />
          </div>
        )}
      </section>
    </div>
  );
}

function CarteResultat({ m, r, n, numeroObjectif }) {
  const id = m.projet.id;
  const appel = useAppel(id);
  const edit = m.peutModifier;
  const activites = m.activites.filter((a) => a.resultatId === r.id);
  const indicateurs = m.indicateurs.filter((i) => i.resultatId === r.id);
  const [ajout, setAjout] = useState(null); // "activite" | "indicateur"

  return (
    <div className="rounded-md border border-gray-200">
      <div className="flex flex-wrap items-start gap-2 border-b border-gray-100 bg-gray-50 px-4 py-3">
        <span className="text-sm font-semibold text-gray-500">R{n}</span>
        <span className="flex-1 text-sm font-medium text-gray-900">{r.libelle}</span>
        {r.objectifId && <span className="rounded-full bg-white px-2 py-0.5 text-[11px] text-gray-600">OS{numeroObjectif(r.objectifId)}</span>}
        {edit && m.objectifs.length > 0 && (
          <select
            value={r.objectifId ?? ""}
            onChange={(e) => appel(() => modifierResultat(id, r.id, { libelle: r.libelle, objectifId: e.target.value || null }))}
            className="rounded border border-gray-200 bg-white px-1.5 py-0.5 text-xs"
            aria-label="Rattacher à un objectif"
          >
            <option value="">Sans OS</option>
            {m.objectifs.map((o, j) => (
              <option key={o.id} value={o.id}>
                OS{j + 1}
              </option>
            ))}
          </select>
        )}
        {edit && <BoutonSupprimer titre="Retirer le résultat" onClick={() => appel(() => supprimerResultat(id, r.id), "Résultat retiré")} />}
      </div>
      <div className="grid gap-4 p-4 lg:grid-cols-2">
        <div>
          <p className="text-xs font-semibold text-gray-500">Activités</p>
          {activites.length === 0 ? <p className="mt-1 text-sm text-gray-400">Aucune activité.</p> : <ListeActivites m={m} activites={activites} />}
          {edit &&
            (ajout === "activite" ? (
              <FormActivite m={m} resultatId={r.id} fermer={() => setAjout(null)} />
            ) : (
              <BoutonAjout onClick={() => setAjout("activite")}>Ajouter une activité</BoutonAjout>
            ))}
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500">Indicateurs</p>
          {indicateurs.length === 0 ? (
            <p className="mt-1 text-sm text-gray-400">Aucun indicateur.</p>
          ) : (
            <ul className="mt-1 space-y-1 text-sm">
              {indicateurs.map((i) => (
                <li key={i.id}>
                  <span className="text-gray-900">{i.libelle}</span>
                  <span className="text-gray-500">
                    {" "}
                    — de {valeur(i.valeurBaseline, i.unite)} à {valeur(i.valeurCible, i.unite)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {edit &&
            (ajout === "indicateur" ? (
              <FormIndicateur m={m} resultatId={r.id} fermer={() => setAjout(null)} />
            ) : (
              <BoutonAjout onClick={() => setAjout("indicateur")}>Ajouter un indicateur</BoutonAjout>
            ))}
        </div>
      </div>
    </div>
  );
}

function ListeActivites({ m, activites }) {
  const appel = useAppel(m.projet.id);
  return (
    <ul className="mt-1 divide-y divide-gray-100 text-sm">
      {activites.map((a) => (
        <li key={a.id} className="flex items-start gap-2 py-1.5">
          <div className="flex-1">
            <p className="text-gray-900">{a.titre}</p>
            <p className="text-xs text-gray-500">
              {dateCourte(a.datePrevuDebut)} → {dateCourte(a.datePrevuFin)}
              {a.responsableNom ? ` · ${a.responsableNom}` : ""}
              {Number(a.budgetAlloue) > 0 ? ` · ${montant(a.budgetAlloue, m.projet.devise)}` : ""}
            </p>
          </div>
          {m.peutModifier && (
            <BoutonSupprimer titre="Retirer l'activité" onClick={() => appel(() => supprimerActivite(a.id), "Activité retirée")} />
          )}
        </li>
      ))}
    </ul>
  );
}

function FormActivite({ m, resultatId, fermer }) {
  const appel = useAppel(m.projet.id);
  const membres = m.equipe;
  const [f, setF] = useState({ titre: "", datePrevuDebut: m.projet.dateDebut, datePrevuFin: m.projet.dateDebut, responsableId: "", budgetAlloue: "" });
  const maj = (cle) => (e) => setF((x) => ({ ...x, [cle]: e.target.value }));
  const enregistrer = async () => {
    if (!f.titre.trim()) return toast.error("Indiquez l'activité.");
    const ok = await appel(
      () =>
        creerActivite({
          projetId: m.projet.id,
          resultatId,
          titre: f.titre.trim(),
          datePrevuDebut: f.datePrevuDebut,
          datePrevuFin: f.datePrevuFin,
          responsableId: f.responsableId || null,
          budgetAlloue: f.budgetAlloue === "" ? null : Number(f.budgetAlloue),
        }),
      "Activité ajoutée",
    );
    if (ok) fermer();
  };
  return (
    <div className="mt-2 space-y-2 rounded-md border border-gray-200 p-3">
      <input value={f.titre} onChange={maj("titre")} placeholder="Activité (ex. Former 100 maraîchers)" className={CHAMP} />
      <div className="grid grid-cols-2 gap-2">
        <input type="date" value={f.datePrevuDebut} min={m.projet.dateDebut} max={m.projet.dateFin} onChange={maj("datePrevuDebut")} className={CHAMP} aria-label="Début prévu" />
        <input type="date" value={f.datePrevuFin} min={f.datePrevuDebut} max={m.projet.dateFin} onChange={maj("datePrevuFin")} className={CHAMP} aria-label="Fin prévue" />
        <select value={f.responsableId} onChange={maj("responsableId")} className={CHAMP} aria-label="Responsable">
          <option value="">Responsable…</option>
          {membres.map((p) => (
            <option key={p.userId} value={p.userId}>
              {p.nom}
            </option>
          ))}
        </select>
        <input type="number" min="0" value={f.budgetAlloue} onChange={maj("budgetAlloue")} placeholder="Budget (facultatif)" className={CHAMP} />
      </div>
      <p className="text-xs text-gray-500">Responsable choisi dans l'équipe du projet (onglet Équipe).</p>
      <BoutonsForm onAnnuler={fermer} onEnregistrer={enregistrer} />
    </div>
  );
}

function FormIndicateur({ m, resultatId, fermer }) {
  const appel = useAppel(m.projet.id);
  const [f, setF] = useState({ libelle: "", unite: "", valeurBaseline: "0", valeurCible: "", niveau: "PRODUIT", type: "QUANTITATIF", frequenceCollecte: "TRIMESTRIELLE" });
  const maj = (cle) => (e) => setF((x) => ({ ...x, [cle]: e.target.value }));
  const enregistrer = async () => {
    if (!f.libelle.trim()) return toast.error("Indiquez l'indicateur.");
    const ok = await appel(
      () =>
        creerIndicateur({
          projetId: m.projet.id,
          resultatId,
          libelle: f.libelle.trim(),
          unite: f.unite.trim() || null,
          valeurBaseline: f.valeurBaseline === "" ? null : Number(f.valeurBaseline),
          valeurCible: f.valeurCible === "" ? null : Number(f.valeurCible),
          niveau: f.niveau,
          type: f.type,
          frequenceCollecte: f.frequenceCollecte,
        }),
      "Indicateur ajouté",
    );
    if (ok) fermer();
  };
  return (
    <div className="mt-2 space-y-2 rounded-md border border-gray-200 p-3">
      <input value={f.libelle} onChange={maj("libelle")} placeholder="Indicateur (ex. Nombre de maraîchers formés)" className={CHAMP} />
      <div className="grid grid-cols-3 gap-2">
        <input value={f.unite} onChange={maj("unite")} placeholder="Unité" className={CHAMP} />
        <input type="number" value={f.valeurBaseline} onChange={maj("valeurBaseline")} placeholder="Départ" aria-label="Valeur de départ" className={CHAMP} />
        <input type="number" value={f.valeurCible} onChange={maj("valeurCible")} placeholder="Cible" aria-label="Valeur cible" className={CHAMP} />
        <select value={f.niveau} onChange={maj("niveau")} className={CHAMP} aria-label="Niveau">
          {Object.entries(NIVEAUX).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select value={f.type} onChange={maj("type")} className={CHAMP} aria-label="Type">
          {Object.entries(TYPES).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select value={f.frequenceCollecte} onChange={maj("frequenceCollecte")} className={CHAMP} aria-label="Fréquence de collecte">
          {Object.entries(FREQUENCES).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>
      <BoutonsForm onAnnuler={fermer} onEnregistrer={enregistrer} />
    </div>
  );
}

// ── Budget ────────────────────────────────────────────────────────────────────

function OngletBudget({ m }) {
  const p = m.projet;
  const appel = useAppel(p.id);
  const edit = m.peutModifier;
  const [lignes, setLignes] = useState(() =>
    m.budget.map((l) => ({ ...l, montant: String(l.montant), financementId: l.financementId ?? "" })),
  );
  const [envoi, setEnvoi] = useState(false);
  const total = lignes.reduce((s, l) => s + (Number(l.montant) || 0), 0);
  const parRubrique = Object.entries(CATEGORIES_BUDGET)
    .map(([k, label]) => ({ label, montant: lignes.filter((l) => l.categorie === k).reduce((s, l) => s + (Number(l.montant) || 0), 0) }))
    .filter((r) => r.montant > 0);
  const majLigne = (i, cle) => (e) => setLignes((ls) => ls.map((l, j) => (j === i ? { ...l, [cle]: e.target.value } : l)));

  const enregistrer = async () => {
    setEnvoi(true);
    await appel(
      () =>
        enregistrerBudget(
          p.id,
          lignes.map((l) => ({
            code: l.code?.trim() || null,
            intitule: l.intitule?.trim(),
            categorie: l.categorie,
            montant: Number(l.montant),
            financementId: l.financementId || null,
          })),
        ),
      "Budget enregistré",
    );
    setEnvoi(false);
  };

  if (!edit) {
    return m.budget.length === 0 ? (
      <p className="text-sm text-gray-500">Aucun budget prévisionnel.</p>
    ) : (
      <TableauBudget m={m} />
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">
        Budget sur toute la durée du projet. Chaque année, le RAF en tirera l'allocation du budget annuel.
      </p>
      <div className="space-y-2">
        {lignes.map((l, i) => (
          <div key={i} className="grid grid-cols-2 gap-2 sm:grid-cols-[5rem_1fr_11rem_9rem_11rem_auto]">
            <input value={l.code ?? ""} onChange={majLigne(i, "code")} placeholder="Code" className={CHAMP} />
            <input value={l.intitule ?? ""} onChange={majLigne(i, "intitule")} placeholder="Intitulé" className={CHAMP} />
            <select value={l.categorie} onChange={majLigne(i, "categorie")} className={CHAMP} aria-label="Rubrique">
              {Object.entries(CATEGORIES_BUDGET).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
            <input type="number" min="0" value={l.montant} onChange={majLigne(i, "montant")} placeholder="Montant" aria-label="Montant" className={CHAMP} />
            <select value={l.financementId} onChange={majLigne(i, "financementId")} className={CHAMP} aria-label="Convention">
              <option value="">Convention…</option>
              {m.financements.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.bailleurNom ?? "Bailleur"} {f.referenceConvention ? `— ${f.referenceConvention}` : ""}
                </option>
              ))}
            </select>
            <BoutonSupprimer titre="Retirer la ligne" onClick={() => setLignes((ls) => ls.filter((_, j) => j !== i))} />
          </div>
        ))}
      </div>
      <BoutonAjout onClick={() => setLignes((ls) => [...ls, { code: "", intitule: "", categorie: "ACTIVITES", montant: "", financementId: "" }])}>
        Ajouter une ligne
      </BoutonAjout>
      <div className="flex flex-wrap items-end justify-between gap-3 border-t border-gray-100 pt-3">
        <div className="text-sm">
          <p className="font-semibold text-gray-900">Total : {montant(total, p.devise)}</p>
          <p className="text-gray-600">
            Conventions des bailleurs : {montant(m.totalFinancements, p.devise)}
            {m.financements.length === 0 && " (aucune convention : le RAF les enregistre dans Bailleurs)"}
          </p>
          {parRubrique.length > 0 && (
            <p className="mt-1 text-xs text-gray-500">{parRubrique.map((r) => `${r.label} ${montant(r.montant, p.devise)}`).join(" · ")}</p>
          )}
        </div>
        <button
          onClick={enregistrer}
          disabled={envoi}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-60"
        >
          {envoi ? "Enregistrement…" : "Enregistrer le budget"}
        </button>
      </div>
    </div>
  );
}

function TableauBudget({ m }) {
  const p = m.projet;
  const convention = (id) => m.financements.find((f) => f.id === id);
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-xs text-gray-500">
          <th className="pb-2 font-medium">Ligne</th>
          <th className="pb-2 font-medium">Rubrique</th>
          <th className="pb-2 font-medium">Convention</th>
          <th className="pb-2 text-right font-medium">Montant</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {m.budget.map((l) => (
          <tr key={l.id}>
            <td className="py-1.5">
              {l.code ? <span className="text-gray-500">{l.code} </span> : null}
              {l.intitule}
            </td>
            <td className="py-1.5">{CATEGORIES_BUDGET[l.categorie]}</td>
            <td className="py-1.5 text-gray-600">{convention(l.financementId)?.bailleurNom ?? "—"}</td>
            <td className="py-1.5 text-right tabular-nums">{montant(l.montant, p.devise)}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr className="font-semibold">
          <td className="pt-2" colSpan={3}>
            Total
          </td>
          <td className="pt-2 text-right tabular-nums">{montant(p.budgetTotal, p.devise)}</td>
        </tr>
      </tfoot>
    </table>
  );
}

// ── Équipe ────────────────────────────────────────────────────────────────────

function OngletEquipe({ m, roles, userId }) {
  const p = m.projet;
  const appel = useAppel(p.id);
  const gestion =
    (aAcces(roles, [R.RP, R.ADMIN]) || userId === p.chefProjetId) && !["CLOTURE", "ARCHIVE"].includes(p.statut);
  const { data: personnes = [] } = usePersonnes(gestion);
  const [choix, setChoix] = useState("");
  const libres = personnes.filter((x) => !m.equipe.some((e) => e.userId === x.id));
  const libelleRoles = (rs) => rs.map((r) => LIBELLES_ROLES[r] ?? r).join(", ");

  return (
    <div className="space-y-3">
      <ul className="divide-y divide-gray-100 text-sm">
        {m.equipe.map((e) => (
          <li key={e.userId} className="flex flex-wrap items-center gap-2 py-2">
            <span className="font-medium text-gray-900">{e.nom}</span>
            <span className="text-gray-500">{libelleRoles(e.roles)}</span>
            {e.chefProjet && <span className="rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700">Chef de projet</span>}
            {e.userId === p.responsableId && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-700">Responsable</span>}
            {gestion && !e.chefProjet && e.userId !== p.responsableId && (
              <span className="ml-auto">
                <BoutonSupprimer titre="Retirer de l'équipe" onClick={() => appel(() => retirerMembre(p.id, e.userId), "Membre retiré")} />
              </span>
            )}
          </li>
        ))}
      </ul>
      {gestion && (
        <div className="flex flex-wrap gap-2">
          <select value={choix} onChange={(e) => setChoix(e.target.value)} className={`${CHAMP} sm:w-80`} aria-label="Personne à ajouter">
            <option value="">Ajouter une personne…</option>
            {libres.map((x) => (
              <option key={x.id} value={x.id}>
                {x.nom} — {libelleRoles(x.roles)}
              </option>
            ))}
          </select>
          <button
            disabled={!choix}
            onClick={async () => {
              if (await appel(() => ajouterMembre(p.id, choix), "Membre ajouté")) setChoix("");
            }}
            className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
          >
            Ajouter
          </button>
        </div>
      )}
      <p className="text-xs text-gray-500">L'équipe regroupe les comptes de la plateforme : ils voient le projet dans « Mes projets ».</p>
    </div>
  );
}

// ── Petits composants ────────────────────────────────────────────────────────

function BoutonSupprimer({ titre, onClick }) {
  return (
    <button type="button" onClick={onClick} title={titre} aria-label={titre} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-danger">
      <Trash2 size={15} />
    </button>
  );
}

function BoutonAjout({ onClick, children }) {
  return (
    <button type="button" onClick={onClick} className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
      <Plus size={15} /> {children}
    </button>
  );
}

function BoutonsForm({ onAnnuler, onEnregistrer }) {
  return (
    <div className="flex justify-end gap-2">
      <button type="button" onClick={onAnnuler} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
        Annuler
      </button>
      <button type="button" onClick={onEnregistrer} className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-dark">
        Enregistrer
      </button>
    </div>
  );
}

function AjoutEnLigne({ valeur: v, setValeur, placeholder, onAjouter }) {
  return (
    <div className="mt-2 flex gap-2">
      <input value={v} onChange={(e) => setValeur(e.target.value)} placeholder={placeholder} className={CHAMP} />
      <button
        disabled={!v.trim()}
        onClick={onAjouter}
        className="inline-flex shrink-0 items-center gap-1 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
      >
        <Plus size={15} /> Ajouter
      </button>
    </div>
  );
}
