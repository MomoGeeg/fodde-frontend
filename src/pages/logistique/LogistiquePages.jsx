import { useProjets } from "@/api/depenses";
import {
  CARBURANTS,
  CATEGORIES_MATERIEL,
  CATEGORIE_DEPUIS_ACQUISITION,
  ETATS,
  TYPES_MOUVEMENT,
  creerMateriel,
  creerVehicule,
  enregistrerDepart,
  enregistrerMouvement,
  enregistrerRetour,
  modifierMateriel,
  modifierVehicule,
  mouvementsPossibles,
  peutSaisir,
  useAcquisitionsAInventorier,
  useMateriel,
  useMateriels,
  useMouvements,
  usePersonnes,
  useSorties,
  useVehicule,
  useVehicules,
} from "@/api/logistique";
import api from "@/api/axios";
import Cellule from "@/components/demande/Cellule";
import { CHAMP, CadreFormulaire, Ligne } from "@/components/demande/Formulaire";
import StatutBadge from "@/components/demande/StatutBadge";
import { messageErreur } from "@/lib/erreurs";
import { telechargerCsv } from "@/lib/export";
import { dateCourte, montant } from "@/lib/format";
import useAuthStore from "@/stores/auth.store";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, Download, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

// ── Petits outils ────────────────────────────────────────────────────────────

const km = (n) => (n == null ? "—" : `${new Intl.NumberFormat("fr-FR").format(n)} km`);
const dateHeure = (d) =>
  d ? new Date(d).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }).replace(" ", " à ") : "—";
const maintenantLocal = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};
const vide = (v) => (v === "" || v === undefined ? null : v);
const nombre = (v) => (v === "" || v == null ? null : Number(v));

function Retour({ to, label }) {
  return (
    <Link to={to} className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
      <ArrowLeft size={16} /> {label}
    </Link>
  );
}

function Champs({ champs }) {
  return (
    <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {champs.map((c) => (
        <div key={c.libelle}>
          <dt className="text-xs text-gray-500">{c.libelle}</dt>
          <dd className="mt-0.5 whitespace-pre-line text-sm text-gray-900">{c.valeur || "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Fenêtre de saisie simple : titre, contenu, bouton de validation. */
function Fenetre({ titre, children, onValider, onFermer, libelle = "Enregistrer", envoi }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" role="dialog" aria-modal="true">
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          onValider();
        }}
        className="w-full max-w-md space-y-4 rounded-lg bg-white p-5 shadow-lg"
      >
        <h2 className="text-base font-semibold text-gray-900">{titre}</h2>
        {children}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onFermer} disabled={envoi} className="rounded-md px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
            Annuler
          </button>
          <button type="submit" disabled={envoi} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50">
            {envoi ? "Envoi…" : libelle}
          </button>
        </div>
      </form>
    </div>
  );
}

function ChoixPersonne({ valeur, onChange, vide: texteVide = "— Personne —" }) {
  const { data: personnes = [] } = usePersonnes();
  return (
    <select value={valeur} onChange={onChange} className={CHAMP}>
      <option value="">{texteVide}</option>
      {personnes.map((p) => (
        <option key={p.id} value={p.id}>
          {p.nom}
        </option>
      ))}
    </select>
  );
}

function ChoixProjet({ valeur, onChange }) {
  const { data: projets = [] } = useProjets();
  return (
    <select value={valeur} onChange={onChange} className={CHAMP}>
      <option value="">— Aucun projet —</option>
      {projets.map((p) => (
        <option key={p.id} value={p.id}>
          {p.code} — {p.titre}
        </option>
      ))}
    </select>
  );
}

const affecteA = (x) => [x.responsableNom, x.projetCode].filter(Boolean).join(" · ") || null;

// ═════════════════════════════════════════════════════════════════════════════
// Page principale : onglets Matériel / Véhicules
// ═════════════════════════════════════════════════════════════════════════════

export function LogistiquePage() {
  const [params, setParams] = useSearchParams();
  const onglet = params.get("onglet") === "vehicules" ? "vehicules" : "materiel";
  const { data: materiels = [], isLoading: chargeM, isError: erreurM } = useMateriels();
  const { data: vehicules = [], isLoading: chargeV, isError: erreurV } = useVehicules();
  const enAlerte = vehicules.filter((v) => v.alertes?.length).length;

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="flex rounded-md border border-gray-200 bg-white p-0.5 text-sm sm:w-fit">
        {[
          ["materiel", `Matériel (${materiels.length})`],
          ["vehicules", `Véhicules (${vehicules.length})${enAlerte ? ` · ${enAlerte} alerte${enAlerte > 1 ? "s" : ""}` : ""}`],
        ].map(([v, label]) => (
          <button
            key={v}
            onClick={() => setParams(v === "vehicules" ? { onglet: v } : {}, { replace: true })}
            className={`flex-1 rounded px-3 py-1.5 sm:flex-none ${onglet === v ? "bg-primary text-white" : "text-gray-700 hover:bg-gray-50"}`}
          >
            {label}
          </button>
        ))}
      </div>
      {onglet === "materiel" ? (
        <ListeMateriel materiels={materiels} isLoading={chargeM} isError={erreurM} />
      ) : (
        <ListeVehicules vehicules={vehicules} isLoading={chargeV} isError={erreurV} />
      )}
    </div>
  );
}

function BarreOutils({ recherche, setRecherche, placeholder, filtre, nouveau, onExporter }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-0 flex-1">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-md border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-primary focus:outline-none"
        />
      </div>
      {filtre}
      <button onClick={onExporter} className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
        <Download size={15} /> Excel
      </button>
      {nouveau && (
        <Link to={nouveau.to} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-dark">
          <Plus size={15} /> {nouveau.label}
        </Link>
      )}
    </div>
  );
}

function Tableau({ colonnes, lignes, lien, vide, isLoading, isError }) {
  const navigate = useNavigate();
  if (isLoading) return <p className="text-sm text-gray-500">Chargement…</p>;
  if (isError) return <p className="text-sm text-danger">Chargement impossible.</p>;
  if (!lignes.length) return <p className="rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">{vide}</p>;
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs text-gray-500">
          <tr>
            {colonnes.map((c) => (
              <th key={c.titre} className="px-4 py-2 font-medium">
                {c.titre}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {lignes.map((l) => (
            <tr key={l.id} onClick={() => navigate(lien(l))} className="cursor-pointer hover:bg-gray-50">
              {colonnes.map((c) => (
                <td key={c.titre} className="px-4 py-2.5 align-top">
                  {c.rendu(l)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Matériel ────────────────────────────────────────────────────────────────

function ListeMateriel({ materiels, isLoading, isError }) {
  const { user } = useAuthStore();
  const saisie = peutSaisir(user?.roles ?? []);
  const [recherche, setRecherche] = useState("");
  const [etat, setEtat] = useState("");

  const affiches = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return materiels
      .filter((m) => (etat ? m.etat === etat : m.etat !== "HORS_SERVICE"))
      .filter(
        (m) =>
          !q ||
          [m.codeActif, m.designation, m.marqueModele, m.numeroSerie, m.responsableNom, m.projetCode, m.localisation].some((v) =>
            v?.toLowerCase().includes(q),
          ),
      );
  }, [materiels, recherche, etat]);

  const exporter = () =>
    telechargerCsv(`inventaire-materiel-${new Date().toISOString().slice(0, 10)}`, [
      ["Inventaire du matériel — FODDE", `au ${new Date().toLocaleDateString("fr-FR")}`],
      [],
      ["Code", "Désignation", "Catégorie", "Marque / modèle", "N° de série", "État", "Valeur (F CFA)", "Acquis le", "Projet", "Affecté à", "Localisation"],
      ...affiches.map((m) => [
        m.codeActif,
        m.designation,
        CATEGORIES_MATERIEL[m.categorie] ?? m.categorie,
        m.marqueModele,
        m.numeroSerie,
        ETATS[m.etat]?.label ?? m.etat,
        m.valeurAcquisition != null ? Number(m.valeurAcquisition) : null,
        m.dateAcquisition ? dateCourte(m.dateAcquisition) : null,
        m.projetCode,
        m.responsableNom,
        m.localisation,
      ]),
    ]);

  return (
    <div className="space-y-4">
      {saisie && <AcquisitionsAInventorier />}
      <BarreOutils
        recherche={recherche}
        setRecherche={setRecherche}
        placeholder="Code, désignation, personne, projet…"
        onExporter={exporter}
        nouveau={saisie ? { label: "Ajouter un bien", to: "/logistique/materiels/nouveau" } : null}
        filtre={
          <select value={etat} onChange={(e) => setEtat(e.target.value)} className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm">
            <option value="">En service</option>
            {Object.entries(ETATS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        }
      />
      <Tableau
        isLoading={isLoading}
        isError={isError}
        lignes={affiches}
        lien={(m) => `/logistique/materiels/${m.id}`}
        vide={materiels.length ? "Aucun bien ne correspond." : "L'inventaire est vide."}
        colonnes={[
          { titre: "Code", rendu: (m) => <span className="font-mono text-xs text-gray-700">{m.codeActif}</span> },
          { titre: "Bien", rendu: (m) => <Cellule principal={m.designation} secondaire={CATEGORIES_MATERIEL[m.categorie]} /> },
          { titre: "Affecté à", rendu: (m) => <Cellule principal={affecteA(m) ?? "—"} secondaire={m.localisation} /> },
          { titre: "Valeur", rendu: (m) => (m.valeurAcquisition != null ? <span className="tabular-nums">{montant(m.valeurAcquisition)}</span> : "—") },
          { titre: "État", rendu: (m) => <StatutBadge statut={m.etat} statuts={ETATS} /> },
        ]}
      />
    </div>
  );
}

function AcquisitionsAInventorier() {
  const { data: acquisitions = [] } = useAcquisitionsAInventorier(true);
  if (!acquisitions.length) return null;
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <p className="text-sm font-medium text-amber-900">
        {acquisitions.length} acquisition{acquisitions.length > 1 ? "s" : ""} validée{acquisitions.length > 1 ? "s" : ""} à entrer dans l'inventaire
      </p>
      <ul className="mt-2 divide-y divide-amber-100 rounded-md bg-white">
        {acquisitions.map((a) => (
          <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
            <span className="text-gray-900">
              {a.designation} <span className="text-xs text-gray-500">· {montant(a.valeur)} · {a.projetCode}</span>
            </span>
            <Link to={`/logistique/materiels/nouveau?acquisition=${a.id}`} className="rounded-md border border-primary px-3 py-1 text-xs font-medium text-primary hover:bg-green-50">
              Ajouter à l'inventaire
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MaterielFichePage() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const saisie = peutSaisir(user?.roles ?? []);
  const { data: m, isLoading, isError } = useMateriel(id);
  const { data: mouvements = [] } = useMouvements(id);
  const [mouvement, setMouvement] = useState(null);

  if (isLoading) return <p className="text-sm text-gray-500">Chargement…</p>;
  if (isError || !m)
    return (
      <div className="space-y-4">
        <Retour to="/logistique" label="Logistique" />
        <p className="text-sm text-gray-600">Bien introuvable.</p>
      </div>
    );

  const possibles = saisie ? mouvementsPossibles(m) : [];

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <Retour to="/logistique" label="Logistique" />
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-xs text-gray-500">{m.codeActif}</p>
            <h2 className="mt-0.5 text-lg font-semibold text-gray-900">{m.designation}</h2>
            <p className="text-sm text-gray-600">
              {[m.responsableNom ? `Affecté à ${m.responsableNom}` : "Non affecté à une personne", m.projetCode && `projet ${m.projetCode}`, m.localisation]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <div className="text-right">
            {m.valeurAcquisition != null && <p className="text-lg font-semibold tabular-nums text-gray-900">{montant(m.valeurAcquisition)}</p>}
            <StatutBadge statut={m.etat} statuts={ETATS} />
          </div>
        </div>
        {saisie && (
          <div className="mt-5 flex flex-wrap gap-2 border-t border-gray-100 pt-5">
            {possibles.map((t) => (
              <button
                key={t}
                onClick={() => setMouvement(t)}
                className={`rounded-md px-3 py-1.5 text-sm ${
                  t === "AFFECTATION" || (t === "RETOUR" && !possibles.includes("AFFECTATION"))
                    ? "bg-primary font-medium text-white hover:bg-primary-dark"
                    : t === "MISE_HORS_SERVICE"
                      ? "border border-red-200 text-danger hover:bg-red-50"
                      : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {t === "INVENTAIRE" ? "Constat d'inventaire" : TYPES_MOUVEMENT[t]}
              </button>
            ))}
            <Link to={`/logistique/materiels/${m.id}/modifier`} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
              Modifier la fiche
            </Link>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <Champs
          champs={[
            { libelle: "Catégorie", valeur: CATEGORIES_MATERIEL[m.categorie] },
            { libelle: "Marque / modèle", valeur: m.marqueModele },
            { libelle: "N° de série", valeur: m.numeroSerie },
            { libelle: "Acquis le", valeur: m.dateAcquisition ? dateCourte(m.dateAcquisition) : null },
            { libelle: "Projet", valeur: m.projetCode },
            { libelle: "Localisation", valeur: m.localisation },
            { libelle: "Origine", valeur: m.acquisitionId ? "Acquisition validée" : "Saisie directe" },
            { libelle: "Remarques", valeur: m.notes },
          ]}
        />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-gray-900">Historique</h3>
        {mouvements.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">Aucun mouvement.</p>
        ) : (
          <ol className="mt-3 space-y-3 border-l border-gray-200 pl-4">
            {mouvements.map((x) => (
              <li key={x.id} className="relative">
                <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-gray-400" />
                <p className="text-sm text-gray-900">
                  <span className="font-medium">{TYPES_MOUVEMENT[x.type]}</span>
                  {x.type === "AFFECTATION" && affecteA(x) && <> à {affecteA(x)}</>}
                  {x.etatAvant !== x.etatApres && x.etatApres && (
                    <span className="text-gray-600">
                      {" "}
                      · {x.etatAvant ? `${ETATS[x.etatAvant]?.label ?? x.etatAvant} → ` : ""}
                      {ETATS[x.etatApres]?.label ?? x.etatApres}
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-500">
                  le {dateCourte(x.date)}
                  {x.saisiPar && ` · saisi par ${x.saisiPar}`}
                </p>
                {x.notes && <p className="mt-1 whitespace-pre-line text-sm text-gray-700">{x.notes}</p>}
              </li>
            ))}
          </ol>
        )}
      </div>

      {mouvement && <FenetreMouvement materiel={m} type={mouvement} onFermer={() => setMouvement(null)} />}
    </div>
  );
}

function FenetreMouvement({ materiel, type, onFermer }) {
  const queryClient = useQueryClient();
  const aujourdhui = new Date().toISOString().slice(0, 10);
  const depuisReparation = type === "RETOUR" && materiel.etat === "EN_REPARATION";
  const [f, setF] = useState({
    date: aujourdhui,
    responsableId: "",
    projetId: materiel.projetId ?? "",
    localisation: "",
    etatApres: type === "RETOUR" && !depuisReparation ? materiel.etat : type === "INVENTAIRE" ? materiel.etat : "",
    notes: "",
  });
  const [envoi, setEnvoi] = useState(false);
  const maj = (cle) => (e) => setF((p) => ({ ...p, [cle]: e.target.value }));

  const valider = async () => {
    if (type === "AFFECTATION" && !f.responsableId && !f.projetId) return toast.error("Choisissez la personne ou le projet.");
    if ((depuisReparation || type === "INVENTAIRE") && !f.etatApres) return toast.error("Indiquez l'état du bien.");
    if (type === "MISE_HORS_SERVICE" && !f.notes.trim()) return toast.error("Indiquez la raison.");
    setEnvoi(true);
    try {
      await enregistrerMouvement(materiel.id, {
        type,
        date: f.date || null,
        responsableId: type === "AFFECTATION" ? vide(f.responsableId) : null,
        projetId: type === "AFFECTATION" ? vide(f.projetId) : null,
        localisation: vide(f.localisation.trim()),
        etatApres: ["RETOUR", "INVENTAIRE"].includes(type) ? vide(f.etatApres) : null,
        notes: vide(f.notes.trim()),
      });
      await queryClient.invalidateQueries({ queryKey: ["logistique"] });
      toast.success(`${TYPES_MOUVEMENT[type]} enregistré${type === "AFFECTATION" || type === "RETOUR" || type === "INVENTAIRE" ? "" : "e"}`);
      onFermer();
    } catch (err) {
      toast.error(messageErreur(err));
    } finally {
      setEnvoi(false);
    }
  };

  const etatsChoix = Object.entries(ETATS).filter(([k]) => k !== "HORS_SERVICE" && k !== "EN_REPARATION");

  return (
    <Fenetre
      titre={`${type === "INVENTAIRE" ? "Constat d'inventaire" : TYPES_MOUVEMENT[type]} — ${materiel.codeActif}`}
      onValider={valider}
      onFermer={onFermer}
      envoi={envoi}
      libelle={type === "MISE_HORS_SERVICE" ? "Mettre hors service" : "Enregistrer"}
    >
      {type === "AFFECTATION" && (
        <>
          <Ligne libelle="Affecté à">
            <ChoixPersonne valeur={f.responsableId} onChange={maj("responsableId")} />
          </Ligne>
          <Ligne libelle="Projet">
            <ChoixProjet valeur={f.projetId} onChange={maj("projetId")} />
          </Ligne>
        </>
      )}
      {["RETOUR", "INVENTAIRE"].includes(type) && (
        <Ligne libelle={type === "RETOUR" ? "État au retour" : "État constaté"}>
          <select value={f.etatApres} onChange={maj("etatApres")} className={CHAMP}>
            <option value="">— Choisir —</option>
            {etatsChoix.map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </Ligne>
      )}
      {type !== "MISE_HORS_SERVICE" && (
        <Ligne libelle="Localisation" aide={type === "RETOUR" ? "Par défaut : Magasin" : undefined}>
          <input value={f.localisation} onChange={maj("localisation")} className={CHAMP} placeholder={type === "REPARATION" ? "Atelier, garage…" : "Bureau Kolda, antenne…"} />
        </Ligne>
      )}
      <Ligne libelle="Date">
        <input type="date" value={f.date} max={aujourdhui} onChange={maj("date")} className={CHAMP} />
      </Ligne>
      <Ligne libelle={type === "MISE_HORS_SERVICE" ? "Raison (panne, perte, vol…)" : "Remarques"}>
        <textarea value={f.notes} onChange={maj("notes")} rows={2} className={CHAMP} />
      </Ligne>
      {type === "MISE_HORS_SERVICE" && (
        <p className="text-xs text-gray-500">Le bien restera dans l'inventaire, mais plus aucun mouvement ne sera possible.</p>
      )}
    </Fenetre>
  );
}

export function MaterielFormPage() {
  const { id } = useParams();
  const enModification = !!id;
  const [params] = useSearchParams();
  const acquisitionId = enModification ? null : params.get("acquisition");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: existant } = useMateriel(id);
  const { data: acquisition } = useQuery({
    queryKey: ["acquisitions", "toutes"],
    queryFn: () => api.get("/api/acquisitions").then((r) => (Array.isArray(r.data) ? r.data : [])),
    enabled: !!acquisitionId,
    select: (liste) => liste.find((a) => a.id === acquisitionId),
  });

  const initial = { codeActif: "", designation: "", categorie: "", marqueModele: "", numeroSerie: "", valeurAcquisition: "", dateAcquisition: "", notes: "", etat: "BON_ETAT", localisation: "", projetId: "", responsableId: "" };
  const [f, setF] = useState(initial);
  const [rempli, setRempli] = useState(false);
  const [erreurs, setErreurs] = useState({});
  const [envoi, setEnvoi] = useState(false);

  // Préremplissage (fiche existante ou acquisition validée), une seule fois.
  if (!rempli && enModification && existant) {
    setRempli(true);
    setF({ ...initial, ...Object.fromEntries(Object.entries(existant).map(([k, v]) => [k, v ?? ""])) });
  }
  if (!rempli && acquisition) {
    setRempli(true);
    setF((p) => ({
      ...p,
      codeActif: acquisition.codeActif ?? "",
      designation: acquisition.designation ?? "",
      categorie: CATEGORIE_DEPUIS_ACQUISITION[acquisition.categorie] ?? "",
      valeurAcquisition: acquisition.valeur ?? "",
      dateAcquisition: acquisition.dateAcquisition ?? "",
      projetId: acquisition.projetId ?? "",
      etat: "NEUF",
    }));
  }

  const maj = (cle) => (e) => {
    setF((p) => ({ ...p, [cle]: e.target.value }));
    setErreurs((p) => ({ ...p, [cle]: undefined }));
  };

  const soumettre = async () => {
    const e = {};
    if (!f.designation.trim()) e.designation = "La désignation est obligatoire.";
    if (!f.categorie) e.categorie = "Choisissez la catégorie.";
    if (f.valeurAcquisition !== "" && Number(f.valeurAcquisition) < 0) e.valeurAcquisition = "Valeur négative.";
    setErreurs(e);
    if (Object.keys(e).length) return;

    const payload = {
      codeActif: vide(String(f.codeActif).trim()),
      designation: f.designation.trim(),
      categorie: f.categorie,
      marqueModele: vide(f.marqueModele.trim()),
      numeroSerie: vide(f.numeroSerie.trim()),
      valeurAcquisition: nombre(f.valeurAcquisition),
      dateAcquisition: vide(f.dateAcquisition),
      notes: vide(f.notes.trim()),
      ...(enModification
        ? {}
        : { etat: f.etat, localisation: vide(f.localisation.trim()), projetId: vide(f.projetId), responsableId: vide(f.responsableId), acquisitionId }),
    };
    setEnvoi(true);
    try {
      const r = enModification ? await modifierMateriel(id, payload) : await creerMateriel(payload);
      await queryClient.invalidateQueries({ queryKey: ["logistique"] });
      toast.success(enModification ? "Fiche mise à jour" : `Bien ${r.codeActif} ajouté à l'inventaire`);
      navigate(`/logistique/materiels/${r.id}`);
    } catch (err) {
      toast.error(messageErreur(err));
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <CadreFormulaire
      retour={enModification ? { to: `/logistique/materiels/${id}`, label: "Fiche du bien" } : { to: "/logistique", label: "Logistique" }}
      titre={enModification ? "Modifier la fiche" : acquisitionId ? "Ajouter à l'inventaire une acquisition validée" : "Ajouter un bien à l'inventaire"}
      onSoumettre={soumettre}
      libelleSoumettre={enModification ? "Enregistrer" : "Ajouter à l'inventaire"}
      envoi={envoi}
    >
      {acquisitionId && !acquisition && <p className="text-sm text-gray-500">Chargement de l'acquisition…</p>}
      <Ligne libelle="Désignation" erreur={erreurs.designation}>
        <input value={f.designation} onChange={maj("designation")} className={CHAMP} placeholder="Ordinateur portable, motopompe…" />
      </Ligne>
      <div className="grid gap-4 sm:grid-cols-2">
        <Ligne libelle="Catégorie" erreur={erreurs.categorie}>
          <select value={f.categorie} onChange={maj("categorie")} className={CHAMP}>
            <option value="">— Choisir —</option>
            {Object.entries(CATEGORIES_MATERIEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </Ligne>
        <Ligne libelle="Code actif" aide={enModification ? undefined : "Laissez vide pour un code automatique (MAT-2026-…)"}>
          <input value={f.codeActif} onChange={maj("codeActif")} className={CHAMP} />
        </Ligne>
        <Ligne libelle="Marque / modèle">
          <input value={f.marqueModele} onChange={maj("marqueModele")} className={CHAMP} />
        </Ligne>
        <Ligne libelle="N° de série">
          <input value={f.numeroSerie} onChange={maj("numeroSerie")} className={CHAMP} />
        </Ligne>
        <Ligne libelle="Valeur d'acquisition (F CFA)" erreur={erreurs.valeurAcquisition}>
          <input type="number" min="0" value={f.valeurAcquisition} onChange={maj("valeurAcquisition")} className={CHAMP} />
        </Ligne>
        <Ligne libelle="Date d'acquisition">
          <input type="date" value={f.dateAcquisition} onChange={maj("dateAcquisition")} className={CHAMP} />
        </Ligne>
      </div>
      {!enModification && (
        <div className="grid gap-4 border-t border-gray-100 pt-4 sm:grid-cols-2">
          <Ligne libelle="État">
            <select value={f.etat} onChange={maj("etat")} className={CHAMP}>
              {Object.entries(ETATS)
                .filter(([k]) => k !== "HORS_SERVICE")
                .map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
            </select>
          </Ligne>
          <Ligne libelle="Localisation">
            <input value={f.localisation} onChange={maj("localisation")} className={CHAMP} placeholder="Magasin, bureau Kolda…" />
          </Ligne>
          <Ligne libelle="Projet">
            <ChoixProjet valeur={f.projetId} onChange={maj("projetId")} />
          </Ligne>
          <Ligne libelle="Affecté à" aide="Facultatif : sinon le bien reste au magasin.">
            <ChoixPersonne valeur={f.responsableId} onChange={maj("responsableId")} />
          </Ligne>
        </div>
      )}
      {enModification && (
        <p className="text-xs text-gray-500">L'état et l'affectation se changent depuis la fiche (affectation, retour, réparation…), pour garder l'historique.</p>
      )}
      <Ligne libelle="Remarques">
        <textarea value={f.notes} onChange={maj("notes")} rows={2} className={CHAMP} />
      </Ligne>
    </CadreFormulaire>
  );
}

// ── Véhicules ───────────────────────────────────────────────────────────────

function Alertes({ alertes }) {
  if (!alertes?.length) return null;
  return (
    <ul className="space-y-0.5">
      {alertes.map((a) => (
        <li key={a.code} className={`flex items-center gap-1 text-xs ${a.code.endsWith("_PROCHE") ? "text-amber-700" : "text-danger"}`}>
          <AlertTriangle size={12} /> {a.libelle}
        </li>
      ))}
    </ul>
  );
}

function ListeVehicules({ vehicules, isLoading, isError }) {
  const { user } = useAuthStore();
  const saisie = peutSaisir(user?.roles ?? []);
  const [recherche, setRecherche] = useState("");
  const affiches = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return vehicules.filter(
      (v) => !q || [v.immatriculation, v.marqueModele, v.conducteurHabituelNom, v.projetCode].some((x) => x?.toLowerCase().includes(q)),
    );
  }, [vehicules, recherche]);

  const exporter = () =>
    telechargerCsv(`parc-vehicules-${new Date().toISOString().slice(0, 10)}`, [
      ["Parc de véhicules — FODDE", `au ${new Date().toLocaleDateString("fr-FR")}`],
      [],
      ["Immatriculation", "Marque / modèle", "Année", "Carburant", "Kilométrage", "Révision à (km)", "Assurance jusqu'au", "Visite technique", "État", "Projet", "Conducteur habituel", "Alertes"],
      ...affiches.map((v) => [
        v.immatriculation,
        v.marqueModele,
        v.annee,
        CARBURANTS[v.typeCarburant] ?? v.typeCarburant,
        v.kilometrageActuel,
        v.kilometrageRevision,
        v.dateExpirationAssurance ? dateCourte(v.dateExpirationAssurance) : null,
        v.dateVisiteTechnique ? dateCourte(v.dateVisiteTechnique) : null,
        ETATS[v.etat]?.label ?? v.etat,
        v.projetCode,
        v.conducteurHabituelNom,
        (v.alertes ?? []).map((a) => a.libelle).join(" ; "),
      ]),
    ]);

  return (
    <div className="space-y-4">
      <BarreOutils
        recherche={recherche}
        setRecherche={setRecherche}
        placeholder="Immatriculation, modèle, conducteur…"
        onExporter={exporter}
        nouveau={saisie ? { label: "Ajouter un véhicule", to: "/logistique/vehicules/nouveau" } : null}
      />
      <Tableau
        isLoading={isLoading}
        isError={isError}
        lignes={affiches}
        lien={(v) => `/logistique/vehicules/${v.id}`}
        vide={vehicules.length ? "Aucun véhicule ne correspond." : "Aucun véhicule enregistré."}
        colonnes={[
          { titre: "Véhicule", rendu: (v) => <Cellule principal={v.immatriculation} secondaire={v.marqueModele} /> },
          { titre: "Kilométrage", rendu: (v) => <span className="tabular-nums">{km(v.kilometrageActuel)}</span> },
          { titre: "Conducteur · projet", rendu: (v) => [v.conducteurHabituelNom, v.projetCode].filter(Boolean).join(" · ") || "—" },
          { titre: "Alertes", rendu: (v) => <Alertes alertes={v.alertes} /> },
          {
            titre: "État",
            rendu: (v) =>
              v.sortieEnCoursId ? (
                <StatutBadge statut="SORTIE" statuts={{ SORTIE: { label: "En sortie", ton: "info" } }} />
              ) : (
                <StatutBadge statut={v.etat} statuts={ETATS} />
              ),
          },
        ]}
      />
    </div>
  );
}

export function VehiculeFichePage() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const saisie = peutSaisir(user?.roles ?? []);
  const { data: v, isLoading, isError } = useVehicule(id);
  const { data: sorties = [] } = useSorties(id);
  const [fenetre, setFenetre] = useState(null);

  if (isLoading) return <p className="text-sm text-gray-500">Chargement…</p>;
  if (isError || !v)
    return (
      <div className="space-y-4">
        <Retour to="/logistique?onglet=vehicules" label="Véhicules" />
        <p className="text-sm text-gray-600">Véhicule introuvable.</p>
      </div>
    );

  const enCours = sorties.find((s) => s.id === v.sortieEnCoursId);
  const disponible = !v.sortieEnCoursId && !["HORS_SERVICE", "EN_REPARATION"].includes(v.etat);
  const totalKm = sorties.reduce((t, s) => t + (s.distance ?? 0), 0);

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <Retour to="/logistique?onglet=vehicules" label="Véhicules" />
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-gray-500">{v.marqueModele}</p>
            <h2 className="mt-0.5 text-lg font-semibold text-gray-900">{v.immatriculation}</h2>
            {enCours && (
              <p className="text-sm text-blue-700">
                En sortie vers {enCours.destination} avec {enCours.conducteurNom}, depuis le {dateHeure(enCours.dateDepart)}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold tabular-nums text-gray-900">{km(v.kilometrageActuel)}</p>
            <StatutBadge statut={v.etat} statuts={ETATS} />
          </div>
        </div>
        {v.alertes?.length > 0 && (
          <div className="mt-4 rounded-md bg-amber-50 px-4 py-3">
            <Alertes alertes={v.alertes} />
          </div>
        )}
        {saisie && (
          <div className="mt-5 flex flex-wrap gap-2 border-t border-gray-100 pt-5">
            {enCours ? (
              <button onClick={() => setFenetre("retour")} className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-dark">
                Enregistrer le retour
              </button>
            ) : (
              disponible && (
                <button onClick={() => setFenetre("depart")} className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-dark">
                  Nouvelle sortie
                </button>
              )
            )}
            <Link to={`/logistique/vehicules/${v.id}/modifier`} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
              Modifier la fiche
            </Link>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <Champs
          champs={[
            { libelle: "Année", valeur: v.annee },
            { libelle: "Carburant", valeur: CARBURANTS[v.typeCarburant] },
            { libelle: "Prochaine révision", valeur: v.kilometrageRevision != null ? km(v.kilometrageRevision) : null },
            { libelle: "Assurance jusqu'au", valeur: v.dateExpirationAssurance ? dateCourte(v.dateExpirationAssurance) : null },
            { libelle: "Visite technique jusqu'au", valeur: v.dateVisiteTechnique ? dateCourte(v.dateVisiteTechnique) : null },
            { libelle: "Projet", valeur: v.projetCode },
            { libelle: "Conducteur habituel", valeur: v.conducteurHabituelNom },
            { libelle: "Remarques", valeur: v.notes },
          ]}
        />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-sm font-semibold text-gray-900">Carnet de bord</h3>
          {sorties.length > 0 && <p className="text-xs text-gray-500">{sorties.length} sortie{sorties.length > 1 ? "s" : ""} · {km(totalKm)} parcourus</p>}
        </div>
        {sorties.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">Aucune sortie enregistrée.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-gray-500">
                <tr>
                  <th className="py-1.5 pr-3 font-medium">Départ</th>
                  <th className="py-1.5 pr-3 font-medium">Conducteur</th>
                  <th className="py-1.5 pr-3 font-medium">Destination · motif</th>
                  <th className="py-1.5 pr-3 font-medium">Retour</th>
                  <th className="py-1.5 text-right font-medium">Distance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sorties.map((s) => (
                  <tr key={s.id} className="align-top">
                    <td className="py-2 pr-3">
                      <Cellule principal={dateHeure(s.dateDepart)} secondaire={km(s.kmDepart)} />
                    </td>
                    <td className="py-2 pr-3">{s.conducteurNom ?? "—"}</td>
                    <td className="py-2 pr-3">
                      <Cellule principal={s.destination} secondaire={[s.motif, s.projetCode].filter(Boolean).join(" · ")} />
                    </td>
                    <td className="py-2 pr-3">
                      {s.dateRetour ? <Cellule principal={dateHeure(s.dateRetour)} secondaire={s.etatRetour} /> : <span className="text-blue-700">En cours</span>}
                    </td>
                    <td className="py-2 text-right tabular-nums">{s.distance != null ? km(s.distance) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {fenetre === "depart" && <FenetreDepart vehicule={v} onFermer={() => setFenetre(null)} />}
      {fenetre === "retour" && enCours && <FenetreRetour sortie={enCours} onFermer={() => setFenetre(null)} />}
    </div>
  );
}

function FenetreDepart({ vehicule, onFermer }) {
  const queryClient = useQueryClient();
  const [f, setF] = useState({
    conducteurId: vehicule.conducteurHabituelId ?? "",
    destination: "",
    motif: "",
    projetId: vehicule.projetId ?? "",
    kmDepart: vehicule.kilometrageActuel ?? 0,
    dateDepart: maintenantLocal(),
  });
  const [envoi, setEnvoi] = useState(false);
  const maj = (cle) => (e) => setF((p) => ({ ...p, [cle]: e.target.value }));

  const valider = async () => {
    if (!f.conducteurId) return toast.error("Choisissez le conducteur.");
    if (!f.destination.trim()) return toast.error("Indiquez la destination.");
    if (Number(f.kmDepart) < (vehicule.kilometrageActuel ?? 0)) return toast.error(`Le compteur ne peut pas être sous ${km(vehicule.kilometrageActuel)}.`);
    setEnvoi(true);
    try {
      await enregistrerDepart(vehicule.id, {
        conducteurId: f.conducteurId,
        destination: f.destination.trim(),
        motif: vide(f.motif.trim()),
        projetId: vide(f.projetId),
        kmDepart: nombre(f.kmDepart),
        dateDepart: f.dateDepart ? `${f.dateDepart}:00` : null,
      });
      await queryClient.invalidateQueries({ queryKey: ["logistique"] });
      toast.success("Départ enregistré");
      onFermer();
    } catch (err) {
      toast.error(messageErreur(err));
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <Fenetre titre={`Nouvelle sortie — ${vehicule.immatriculation}`} onValider={valider} onFermer={onFermer} envoi={envoi}>
      <Ligne libelle="Conducteur">
        <ChoixPersonne valeur={f.conducteurId} onChange={maj("conducteurId")} vide="— Choisir —" />
      </Ligne>
      <Ligne libelle="Destination">
        <input value={f.destination} onChange={maj("destination")} className={CHAMP} placeholder="Vélingara, Médina Yoro Foulah…" />
      </Ligne>
      <Ligne libelle="Motif">
        <input value={f.motif} onChange={maj("motif")} className={CHAMP} placeholder="Supervision, distribution…" />
      </Ligne>
      <Ligne libelle="Projet">
        <ChoixProjet valeur={f.projetId} onChange={maj("projetId")} />
      </Ligne>
      <div className="grid gap-4 sm:grid-cols-2">
        <Ligne libelle="Compteur au départ (km)">
          <input type="number" min={vehicule.kilometrageActuel ?? 0} value={f.kmDepart} onChange={maj("kmDepart")} className={CHAMP} />
        </Ligne>
        <Ligne libelle="Départ">
          <input type="datetime-local" value={f.dateDepart} onChange={maj("dateDepart")} className={CHAMP} />
        </Ligne>
      </div>
    </Fenetre>
  );
}

function FenetreRetour({ sortie, onFermer }) {
  const queryClient = useQueryClient();
  const [f, setF] = useState({ kmRetour: "", dateRetour: maintenantLocal(), etatRetour: "" });
  const [envoi, setEnvoi] = useState(false);
  const maj = (cle) => (e) => setF((p) => ({ ...p, [cle]: e.target.value }));

  const valider = async () => {
    if (f.kmRetour === "") return toast.error("Indiquez le compteur au retour.");
    if (Number(f.kmRetour) < sortie.kmDepart) return toast.error(`Le compteur ne peut pas être sous ${km(sortie.kmDepart)} (départ).`);
    setEnvoi(true);
    try {
      await enregistrerRetour(sortie.id, {
        kmRetour: Number(f.kmRetour),
        dateRetour: f.dateRetour ? `${f.dateRetour}:00` : null,
        etatRetour: vide(f.etatRetour.trim()),
      });
      await queryClient.invalidateQueries({ queryKey: ["logistique"] });
      toast.success("Retour enregistré, kilométrage mis à jour");
      onFermer();
    } catch (err) {
      toast.error(messageErreur(err));
    } finally {
      setEnvoi(false);
    }
  };

  const distance = f.kmRetour !== "" ? Number(f.kmRetour) - sortie.kmDepart : null;

  return (
    <Fenetre titre="Retour du véhicule" onValider={valider} onFermer={onFermer} envoi={envoi}>
      <p className="text-sm text-gray-600">
        Parti vers {sortie.destination} avec {sortie.conducteurNom}, le {dateHeure(sortie.dateDepart)}, compteur à {km(sortie.kmDepart)}.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Ligne libelle="Compteur au retour (km)" aide={distance != null && distance >= 0 ? `${km(distance)} parcourus` : undefined}>
          <input type="number" min={sortie.kmDepart} value={f.kmRetour} onChange={maj("kmRetour")} className={CHAMP} autoFocus />
        </Ligne>
        <Ligne libelle="Retour">
          <input type="datetime-local" value={f.dateRetour} onChange={maj("dateRetour")} className={CHAMP} />
        </Ligne>
      </div>
      <Ligne libelle="Remarques au retour">
        <input value={f.etatRetour} onChange={maj("etatRetour")} className={CHAMP} placeholder="RAS, plein à faire, rayure…" />
      </Ligne>
    </Fenetre>
  );
}

export function VehiculeFormPage() {
  const { id } = useParams();
  const enModification = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: existant } = useVehicule(id);
  const initial = { immatriculation: "", marqueModele: "", annee: "", kilometrageActuel: "0", kilometrageRevision: "", etat: "BON_ETAT", projetId: "", conducteurHabituelId: "", dateExpirationAssurance: "", dateVisiteTechnique: "", typeCarburant: "DIESEL", notes: "" };
  const [f, setF] = useState(initial);
  const [rempli, setRempli] = useState(false);
  const [erreurs, setErreurs] = useState({});
  const [envoi, setEnvoi] = useState(false);

  if (!rempli && enModification && existant) {
    setRempli(true);
    setF({ ...initial, ...Object.fromEntries(Object.keys(initial).map((k) => [k, existant[k] ?? ""])) });
  }

  const maj = (cle) => (e) => {
    setF((p) => ({ ...p, [cle]: e.target.value }));
    setErreurs((p) => ({ ...p, [cle]: undefined }));
  };

  const soumettre = async () => {
    const e = {};
    if (!f.immatriculation.trim()) e.immatriculation = "L'immatriculation est obligatoire.";
    if (!f.marqueModele.trim()) e.marqueModele = "Indiquez la marque et le modèle.";
    if (f.kilometrageActuel !== "" && Number(f.kilometrageActuel) < 0) e.kilometrageActuel = "Kilométrage négatif.";
    if (enModification && existant && Number(f.kilometrageActuel) < existant.kilometrageActuel)
      e.kilometrageActuel = `Le kilométrage ne peut pas reculer (actuel : ${km(existant.kilometrageActuel)}).`;
    setErreurs(e);
    if (Object.keys(e).length) return;

    const payload = {
      immatriculation: f.immatriculation.trim(),
      marqueModele: f.marqueModele.trim(),
      annee: nombre(f.annee),
      kilometrageActuel: nombre(f.kilometrageActuel),
      kilometrageRevision: nombre(f.kilometrageRevision),
      etat: f.etat,
      projetId: vide(f.projetId),
      conducteurHabituelId: vide(f.conducteurHabituelId),
      dateExpirationAssurance: vide(f.dateExpirationAssurance),
      dateVisiteTechnique: vide(f.dateVisiteTechnique),
      typeCarburant: vide(f.typeCarburant),
      notes: vide(String(f.notes).trim()),
    };
    setEnvoi(true);
    try {
      const r = enModification ? await modifierVehicule(id, payload) : await creerVehicule(payload);
      await queryClient.invalidateQueries({ queryKey: ["logistique"] });
      toast.success(enModification ? "Fiche mise à jour" : `Véhicule ${r.immatriculation} ajouté`);
      navigate(`/logistique/vehicules/${r.id}`);
    } catch (err) {
      toast.error(messageErreur(err));
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <CadreFormulaire
      retour={enModification ? { to: `/logistique/vehicules/${id}`, label: "Fiche du véhicule" } : { to: "/logistique?onglet=vehicules", label: "Véhicules" }}
      titre={enModification ? "Modifier le véhicule" : "Ajouter un véhicule"}
      onSoumettre={soumettre}
      libelleSoumettre={enModification ? "Enregistrer" : "Ajouter"}
      envoi={envoi}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Ligne libelle="Immatriculation" erreur={erreurs.immatriculation}>
          <input value={f.immatriculation} onChange={maj("immatriculation")} className={CHAMP} placeholder="DK 1234 AB" />
        </Ligne>
        <Ligne libelle="Marque et modèle" erreur={erreurs.marqueModele}>
          <input value={f.marqueModele} onChange={maj("marqueModele")} className={CHAMP} placeholder="Toyota Hilux" />
        </Ligne>
        <Ligne libelle="Année">
          <input type="number" value={f.annee} onChange={maj("annee")} className={CHAMP} />
        </Ligne>
        <Ligne libelle="Carburant">
          <select value={f.typeCarburant} onChange={maj("typeCarburant")} className={CHAMP}>
            {Object.entries(CARBURANTS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </Ligne>
        <Ligne libelle="Kilométrage actuel" erreur={erreurs.kilometrageActuel} aide={enModification ? "Mis à jour automatiquement au retour de chaque sortie." : undefined}>
          <input type="number" min="0" value={f.kilometrageActuel} onChange={maj("kilometrageActuel")} className={CHAMP} />
        </Ligne>
        <Ligne libelle="Prochaine révision à (km)">
          <input type="number" min="0" value={f.kilometrageRevision} onChange={maj("kilometrageRevision")} className={CHAMP} />
        </Ligne>
        <Ligne libelle="Assurance valable jusqu'au">
          <input type="date" value={f.dateExpirationAssurance} onChange={maj("dateExpirationAssurance")} className={CHAMP} />
        </Ligne>
        <Ligne libelle="Visite technique valable jusqu'au">
          <input type="date" value={f.dateVisiteTechnique} onChange={maj("dateVisiteTechnique")} className={CHAMP} />
        </Ligne>
        <Ligne libelle="État">
          <select value={f.etat} onChange={maj("etat")} className={CHAMP}>
            {Object.entries(ETATS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </Ligne>
        <Ligne libelle="Projet">
          <ChoixProjet valeur={f.projetId} onChange={maj("projetId")} />
        </Ligne>
        <Ligne libelle="Conducteur habituel">
          <ChoixPersonne valeur={f.conducteurHabituelId} onChange={maj("conducteurHabituelId")} />
        </Ligne>
      </div>
      <Ligne libelle="Remarques">
        <textarea value={f.notes} onChange={maj("notes")} rows={2} className={CHAMP} />
      </Ligne>
    </CadreFormulaire>
  );
}
