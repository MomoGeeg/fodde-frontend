import { useProjets } from "@/api/budgets";
import {
  FREQUENCES,
  GESTIONNAIRES_INDICATEURS,
  NIVEAUX,
  ORDRE_NIVEAUX,
  TYPES,
  creerIndicateur,
  mettreAJourValeur,
  taux,
  useIndicateur,
  useIndicateurs,
  valeur,
} from "@/api/indicateurs";
import { CHAMP, CadreFormulaire, Ligne } from "@/components/demande/Formulaire";
import Jauge from "@/components/demande/Jauge";
import { messageErreur } from "@/lib/erreurs";
import { telechargerCsv } from "@/lib/export";
import { dateCourte } from "@/lib/format";
import { aAcces } from "@/lib/navigation";
import useAuthStore from "@/stores/auth.store";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, FileSpreadsheet, Plus, Printer, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

const aujourdhui = () => new Date().toISOString().slice(0, 10);
const trier = (a, b) =>
  ORDRE_NIVEAUX.indexOf(a.niveau) - ORDRE_NIVEAUX.indexOf(b.niveau) || (a.code ?? "").localeCompare(b.code ?? "");

// ── Liste et rapport ─────────────────────────────────────────────────────────

/**
 * Indicateurs, filtrables par projet. Pour un projet donné, la page sert de
 * rapport de résultats : export Excel et impression (PDF).
 */
export function IndicateursPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const projetId = params.get("projet") ?? "";
  const [recherche, setRecherche] = useState("");
  const { data: indicateurs = [], isLoading, isError } = useIndicateurs();
  const { data: projets = [] } = useProjets();
  const projet = projets.find((p) => p.id === projetId);
  const codeProjet = useMemo(() => new Map(projets.map((p) => [p.id, p.code])), [projets]);
  const peutGerer = aAcces(user?.roles ?? [], GESTIONNAIRES_INDICATEURS);

  const affiches = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return indicateurs
      .filter((i) => !projetId || i.projetId === projetId)
      .filter((i) => !q || [i.code, i.libelle].some((v) => v?.toLowerCase().includes(q)))
      .sort((a, b) => (codeProjet.get(a.projetId) ?? "").localeCompare(codeProjet.get(b.projetId) ?? "") || trier(a, b));
  }, [indicateurs, projetId, recherche, codeProjet]);

  const exporter = () => {
    const titre = projet ? `${projet.code} — ${projet.titre}` : "Tous les projets";
    telechargerCsv(`Indicateurs_${projet?.code ?? "tous"}_${aujourdhui()}`, [
      ["ONG FODDE — Suivi des indicateurs"],
      ["Projet", titre],
      ["Édité le", dateCourte(aujourdhui())],
      [],
      ["Projet", "Code", "Indicateur", "Niveau", "Unité", "Valeur de départ", "Cible", "Valeur atteinte", "Taux de réalisation", "Fréquence", "Source de vérification"],
      ...affiches.map((i) => [
        codeProjet.get(i.projetId) ?? "",
        i.code,
        i.libelle,
        NIVEAUX[i.niveau] ?? i.niveau,
        i.unite,
        i.valeurBaseline,
        i.valeurCible,
        i.valeurAtteinte,
        `${Math.round(taux(i) * 100)} %`,
        FREQUENCES[i.frequenceCollecte] ?? i.frequenceCollecte,
        i.sourceVerification,
      ]),
    ]);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="hidden print:block">
        <p className="text-sm font-semibold">ONG FODDE — Suivi des indicateurs</p>
        <p className="text-xs">
          {projet ? `${projet.code} — ${projet.titre}` : "Tous les projets"} · édité le {dateCourte(aujourdhui())}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <select
          value={projetId}
          onChange={(e) => setParams(e.target.value ? { projet: e.target.value } : {}, { replace: true })}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm sm:w-auto"
          aria-label="Projet"
        >
          <option value="">Tous les projets</option>
          {projets.map((p) => (
            <option key={p.id} value={p.id}>
              {p.code} — {p.titre}
            </option>
          ))}
        </select>
        <label className="relative min-w-48 flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Code ou libellé…"
            className="w-full rounded-md border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm focus:border-primary focus:outline-none"
          />
        </label>
        <div className="flex gap-2">
          <button
            onClick={exporter}
            disabled={!affiches.length}
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <FileSpreadsheet size={16} /> Excel
          </button>
          <button
            onClick={() => window.print()}
            disabled={!affiches.length}
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <Printer size={16} /> PDF
          </button>
          {peutGerer && (
            <Link
              to={`/se/indicateurs/nouveau${projetId ? `?projet=${projetId}` : ""}`}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-dark"
            >
              <Plus size={16} /> Nouvel indicateur
            </Link>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white print:overflow-visible">
        {isLoading ? (
          <p className="px-4 py-8 text-center text-sm text-gray-500">Chargement…</p>
        ) : isError ? (
          <p className="px-4 py-8 text-center text-sm text-danger">Impossible de charger les indicateurs.</p>
        ) : affiches.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-gray-500">
            Aucun indicateur{projet ? " pour ce projet" : ""}.
            {peutGerer && " Créez-en un avec « Nouvel indicateur »."}
          </p>
        ) : (
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs text-gray-500">
              <tr>
                <th className="px-4 py-2 font-medium">Indicateur</th>
                {!projetId && <th className="px-4 py-2 font-medium">Projet</th>}
                <th className="px-4 py-2 text-right font-medium">Départ</th>
                <th className="px-4 py-2 text-right font-medium">Cible</th>
                <th className="px-4 py-2 text-right font-medium">Atteint</th>
                <th className="w-44 px-4 py-2 font-medium">Réalisation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {affiches.map((i) => (
                <tr key={i.id} onClick={() => navigate(`/se/indicateurs/${i.id}`)} className="cursor-pointer hover:bg-gray-50">
                  <td className="px-4 py-2.5">
                    <span className="text-gray-900">
                      {i.code} — {i.libelle}
                    </span>
                    <span className="block text-xs text-gray-500">
                      {NIVEAUX[i.niveau] ?? i.niveau}
                      {i.frequenceCollecte ? ` · ${FREQUENCES[i.frequenceCollecte] ?? i.frequenceCollecte}` : ""}
                    </span>
                  </td>
                  {!projetId && <td className="whitespace-nowrap px-4 py-2.5 text-gray-700">{codeProjet.get(i.projetId)}</td>}
                  <td className="px-4 py-2.5 text-right tabular-nums">{valeur(i.valeurBaseline, i.unite)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{valeur(i.valeurCible, i.unite)}</td>
                  <td className="px-4 py-2.5 text-right font-medium tabular-nums">{valeur(i.valeurAtteinte, i.unite)}</td>
                  <td className="px-4 py-2.5">
                    <Jauge taux={taux(i)} mode="realisation" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── Fiche ───────────────────────────────────────────────────────────────────

export function IndicateurFichePage() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { data: i, isLoading, isError } = useIndicateur(id);
  const { data: projets = [] } = useProjets();
  const [nouvelle, setNouvelle] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const peutGerer = aAcces(user?.roles ?? [], GESTIONNAIRES_INDICATEURS);

  const retour = (
    <Link to="/se/indicateurs" className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
      <ArrowLeft size={16} /> Indicateurs
    </Link>
  );
  if (isLoading) return <p className="text-sm text-gray-500">Chargement…</p>;
  if (isError || !i)
    return (
      <div className="space-y-4">
        {retour}
        <p className="text-sm text-gray-600">Indicateur introuvable.</p>
      </div>
    );

  const projet = projets.find((p) => p.id === i.projetId);

  const enregistrer = async (e) => {
    e.preventDefault();
    if (nouvelle === "" || Number.isNaN(Number(nouvelle))) return toast.error("Indiquez une valeur numérique.");
    setEnvoi(true);
    try {
      await mettreAJourValeur(i.id, Number(nouvelle));
      await queryClient.invalidateQueries({ queryKey: ["indicateurs"] });
      setNouvelle("");
      toast.success("Valeur atteinte mise à jour");
    } catch (err) {
      toast.error(messageErreur(err, "Mise à jour impossible."));
    } finally {
      setEnvoi(false);
    }
  };

  const champs = [
    ["Projet", projet ? `${projet.code} — ${projet.titre}` : null],
    ["Niveau", NIVEAUX[i.niveau] ?? i.niveau],
    ["Type", TYPES[i.type] ?? i.type],
    ["Unité", i.unite],
    ["Fréquence de collecte", FREQUENCES[i.frequenceCollecte] ?? i.frequenceCollecte],
    ["Source de vérification", i.sourceVerification],
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      {retour}
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <p className="text-xs text-gray-500">{i.code}</p>
        <h2 className="mt-0.5 text-lg font-semibold text-gray-900">{i.libelle}</h2>

        <div className="mt-5 grid grid-cols-3 gap-3 border-t border-gray-100 pt-5 text-center">
          {[
            ["Départ", valeur(i.valeurBaseline, i.unite)],
            ["Cible", valeur(i.valeurCible, i.unite)],
            ["Atteint", valeur(i.valeurAtteinte, i.unite)],
          ].map(([l, v]) => (
            <div key={l}>
              <p className="text-xs text-gray-500">{l}</p>
              <p className="mt-1 text-base font-semibold text-gray-900 tabular-nums">{v}</p>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <Jauge taux={taux(i)} mode="realisation" />
        </div>

        {peutGerer && (
          <form onSubmit={enregistrer} className="mt-5 flex flex-col gap-2 border-t border-gray-100 pt-5 sm:flex-row sm:items-end">
            <label className="block flex-1 text-sm">
              <span className="text-gray-700">Nouvelle valeur atteinte{i.unite ? ` (${i.unite})` : ""}</span>
              <input
                type="number"
                step="any"
                inputMode="decimal"
                value={nouvelle}
                onChange={(e) => setNouvelle(e.target.value)}
                className={CHAMP}
              />
            </label>
            <button
              type="submit"
              disabled={envoi}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
            >
              {envoi ? "Envoi…" : "Enregistrer"}
            </button>
          </form>
        )}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {champs.map(([l, v]) => (
            <div key={l}>
              <dt className="text-xs text-gray-500">{l}</dt>
              <dd className="mt-0.5 text-sm text-gray-900">{v || "—"}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

// ── Création ────────────────────────────────────────────────────────────────

export function IndicateurFormPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [params] = useSearchParams();
  const { data: projets = [] } = useProjets();
  const [f, setF] = useState({
    projetId: params.get("projet") ?? "",
    code: "",
    libelle: "",
    niveau: "PRODUIT",
    type: "QUANTITATIF",
    unite: "",
    valeurBaseline: "0",
    valeurCible: "",
    frequenceCollecte: "TRIMESTRIELLE",
    sourceVerification: "",
  });
  const [erreurs, setErreurs] = useState({});
  const [envoi, setEnvoi] = useState(false);

  const maj = (cle) => (e) => {
    setF((p) => ({ ...p, [cle]: e.target.value }));
    setErreurs((p) => ({ ...p, [cle]: undefined }));
  };

  const soumettre = async () => {
    const e = {};
    if (!f.projetId) e.projetId = "Choisissez le projet.";
    if (!f.code.trim()) e.code = "Indiquez un code unique (ex. IND-01).";
    if (!f.libelle.trim()) e.libelle = "Décrivez ce que mesure l'indicateur.";
    if (f.type === "QUANTITATIF" && !(Number(f.valeurCible) > 0)) e.valeurCible = "Indiquez la cible.";
    setErreurs(e);
    if (Object.keys(e).length) return;

    setEnvoi(true);
    try {
      const cree = await creerIndicateur({
        ...f,
        code: f.code.trim(),
        libelle: f.libelle.trim(),
        unite: f.unite.trim() || null,
        sourceVerification: f.sourceVerification.trim() || null,
        valeurBaseline: f.valeurBaseline === "" ? null : Number(f.valeurBaseline),
        valeurCible: f.valeurCible === "" ? null : Number(f.valeurCible),
      });
      await queryClient.invalidateQueries({ queryKey: ["indicateurs"] });
      toast.success(`Indicateur ${cree.code} créé`);
      navigate(`/se/indicateurs/${cree.id}`);
    } catch (err) {
      toast.error(messageErreur(err));
    } finally {
      setEnvoi(false);
    }
  };

  const select = (cle, options) => (
    <select value={f[cle]} onChange={maj(cle)} className={CHAMP}>
      {Object.entries(options).map(([code, label]) => (
        <option key={code} value={code}>
          {label}
        </option>
      ))}
    </select>
  );

  return (
    <CadreFormulaire
      retour={{ to: "/se/indicateurs", label: "Indicateurs" }}
      titre="Nouvel indicateur"
      onSoumettre={soumettre}
      libelleSoumettre="Créer l'indicateur"
      envoi={envoi}
    >
      <Ligne libelle="Projet" erreur={erreurs.projetId}>
        <select value={f.projetId} onChange={maj("projetId")} className={CHAMP}>
          <option value="">Choisir…</option>
          {projets.map((p) => (
            <option key={p.id} value={p.id}>
              {p.code} — {p.titre}
            </option>
          ))}
        </select>
      </Ligne>
      <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
        <Ligne libelle="Code" erreur={erreurs.code}>
          <input value={f.code} onChange={maj("code")} className={CHAMP} maxLength={30} />
        </Ligne>
        <Ligne libelle="Ce que mesure l'indicateur" erreur={erreurs.libelle}>
          <input value={f.libelle} onChange={maj("libelle")} className={CHAMP} />
        </Ligne>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Ligne libelle="Niveau">{select("niveau", NIVEAUX)}</Ligne>
        <Ligne libelle="Type">{select("type", TYPES)}</Ligne>
        <Ligne libelle="Fréquence">{select("frequenceCollecte", FREQUENCES)}</Ligne>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Ligne libelle="Unité" aide="ex. ménages, %, km">
          <input value={f.unite} onChange={maj("unite")} className={CHAMP} maxLength={50} />
        </Ligne>
        <Ligne libelle="Valeur de départ">
          <input type="number" step="any" value={f.valeurBaseline} onChange={maj("valeurBaseline")} className={CHAMP} />
        </Ligne>
        <Ligne libelle="Cible" erreur={erreurs.valeurCible}>
          <input type="number" step="any" value={f.valeurCible} onChange={maj("valeurCible")} className={CHAMP} />
        </Ligne>
      </div>
      <Ligne libelle="Source de vérification (facultatif)" aide="Où trouver la preuve : rapports de collecte, registres…">
        <input value={f.sourceVerification} onChange={maj("sourceVerification")} className={CHAMP} />
      </Ligne>
    </CadreFormulaire>
  );
}
