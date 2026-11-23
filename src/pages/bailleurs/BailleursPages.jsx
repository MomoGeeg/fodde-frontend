import api from "@/api/axios";
import {
  GESTIONNAIRES_BAILLEURS,
  creerBailleur,
  creerFinancement,
  useBailleurs,
  useFinancements,
} from "@/api/bailleurs";
import { depensesValideesSur, nombre, useProjets } from "@/api/budgets";
import { DEVISES } from "@/api/depenses";
import { CHAMP, CadreFormulaire, Ligne } from "@/components/demande/Formulaire";
import Jauge from "@/components/demande/Jauge";
import { messageErreur } from "@/lib/erreurs";
import { dateCourte, montant } from "@/lib/format";
import { aAcces } from "@/lib/navigation";
import useAuthStore from "@/stores/auth.store";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, FileText, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

const periode = (f) =>
  f.dateDebut || f.dateFin ? `${dateCourte(f.dateDebut)} → ${dateCourte(f.dateFin)}` : "Période non précisée";

/** Dépensé (validé) pendant la période de chaque convention, à partir des dépenses de ses projets. */
function useDepenseParConvention(financements) {
  const projetIds = [...new Set(financements.map((f) => f.projetId))];
  const requetes = useQueries({
    queries: projetIds.map((id) => ({
      queryKey: ["depenses", "projet", id],
      queryFn: async () => {
        try {
          const { data } = await api.get(`/api/depenses/projet/${id}`);
          return Array.isArray(data) ? data : [];
        } catch {
          return null; // rôle sans accès au détail des dépenses
        }
      },
      staleTime: 60_000,
    })),
  });
  const parProjet = new Map(projetIds.map((id, i) => [id, requetes[i]?.data]));
  return new Map(
    financements.map((f) => {
      const depenses = parProjet.get(f.projetId);
      if (!depenses) return [f.id, null];
      const total = depensesValideesSur(depenses, f.dateDebut, f.dateFin).reduce((s, d) => s + nombre(d.montant), 0);
      return [f.id, total];
    }),
  );
}

// ── Liste des bailleurs ─────────────────────────────────────────────────────

export function BailleursPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { data: bailleurs = [], isLoading } = useBailleurs();
  const { data: financements = [] } = useFinancements();
  const peutGerer = aAcces(user?.roles ?? [], GESTIONNAIRES_BAILLEURS);

  const parBailleur = useMemo(() => {
    const m = new Map();
    for (const f of financements) {
      const c = m.get(f.bailleurId) ?? { nb: 0, total: 0, projets: new Set() };
      c.nb += 1;
      if (f.devise === "XOF") c.total += nombre(f.montantAccorde);
      c.projets.add(f.projetCode);
      m.set(f.bailleurId, c);
    }
    return m;
  }, [financements]);

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      {peutGerer && (
        <div className="flex justify-end gap-2">
          <Link
            to="/financements/nouveau"
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <Plus size={16} /> Nouvelle convention
          </Link>
          <Link
            to="/bailleurs/nouveau"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-dark"
          >
            <Plus size={16} /> Nouveau bailleur
          </Link>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        {isLoading ? (
          <p className="px-4 py-8 text-center text-sm text-gray-500">Chargement…</p>
        ) : bailleurs.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-gray-500">
            Aucun bailleur enregistré.{peutGerer && " Commencez par « Nouveau bailleur »."}
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {bailleurs.map((b) => {
              const c = parBailleur.get(b.id);
              return (
                <li key={b.id}>
                  <button
                    onClick={() => navigate(`/bailleurs/${b.id}`)}
                    className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-left hover:bg-gray-50"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-gray-900">
                        {b.nom}
                        {b.sigle ? ` (${b.sigle})` : ""}
                      </span>
                      <span className="block text-xs text-gray-500">
                        {[b.pays, c ? `${c.nb} convention${c.nb > 1 ? "s" : ""} · ${[...c.projets].join(", ")}` : "aucune convention"]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </span>
                    <span className="text-sm font-medium text-gray-900 tabular-nums">{c ? montant(c.total) : ""}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

// ── Fiche d'un bailleur ─────────────────────────────────────────────────────

export function BailleurFichePage() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const { data: bailleurs = [], isLoading } = useBailleurs();
  const { data: financements = [] } = useFinancements({ bailleurId: id });
  const depense = useDepenseParConvention(financements);
  const b = bailleurs.find((x) => x.id === id);
  const peutGerer = aAcces(user?.roles ?? [], GESTIONNAIRES_BAILLEURS);

  const retour = (
    <Link to="/bailleurs" className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
      <ArrowLeft size={16} /> Bailleurs
    </Link>
  );
  if (isLoading) return <p className="text-sm text-gray-500">Chargement…</p>;
  if (!b)
    return (
      <div className="space-y-4">
        {retour}
        <p className="text-sm text-gray-600">Bailleur introuvable.</p>
      </div>
    );

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      {retour}
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-gray-900">
          {b.nom}
          {b.sigle ? ` (${b.sigle})` : ""}
        </h2>
        <p className="mt-1 text-sm text-gray-600">{[b.pays, b.contact, b.email].filter(Boolean).join(" · ") || "—"}</p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <h3 className="text-sm font-semibold text-gray-900">Conventions de financement</h3>
          {peutGerer && (
            <Link to={`/financements/nouveau?bailleur=${b.id}`} className="text-xs font-medium text-primary hover:underline">
              Ajouter une convention
            </Link>
          )}
        </div>
        {financements.length === 0 ? (
          <p className="px-4 py-6 text-sm text-gray-500">Aucune convention avec ce bailleur.</p>
        ) : (
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs text-gray-500">
              <tr>
                <th className="px-4 py-2 font-medium">Convention</th>
                <th className="px-4 py-2 text-right font-medium">Accordé</th>
                <th className="px-4 py-2 text-right font-medium">Dépensé</th>
                <th className="w-40 px-4 py-2 font-medium">Consommation</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {financements.map((f) => {
                const d = depense.get(f.id);
                return (
                  <tr key={f.id}>
                    <td className="px-4 py-2.5">
                      <span className="text-gray-900">
                        {f.projetCode} — {f.referenceConvention}
                      </span>
                      <span className="block text-xs text-gray-500">{periode(f)}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{montant(f.montantAccorde, f.devise)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{d == null ? "—" : montant(d, f.devise)}</td>
                    <td className="px-4 py-2.5">
                      {d != null && <Jauge taux={nombre(f.montantAccorde) > 0 ? d / nombre(f.montantAccorde) : 0} />}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <Link
                        to={`/finances/budgets/${f.projetId}?convention=${f.id}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                      >
                        <FileText size={14} /> Rapport
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── Création d'un bailleur ──────────────────────────────────────────────────

export function BailleurFormPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [f, setF] = useState({ nom: "", sigle: "", pays: "", contact: "", email: "" });
  const [erreurs, setErreurs] = useState({});
  const [envoi, setEnvoi] = useState(false);
  const maj = (cle) => (e) => {
    setF((p) => ({ ...p, [cle]: e.target.value }));
    setErreurs((p) => ({ ...p, [cle]: undefined }));
  };

  const soumettre = async () => {
    if (!f.nom.trim()) return setErreurs({ nom: "Indiquez le nom du bailleur." });
    setEnvoi(true);
    try {
      const cree = await creerBailleur(f);
      await queryClient.invalidateQueries({ queryKey: ["bailleurs"] });
      toast.success(`Bailleur « ${cree.nom} » enregistré`);
      navigate(`/bailleurs/${cree.id}`);
    } catch (err) {
      toast.error(messageErreur(err));
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <CadreFormulaire
      retour={{ to: "/bailleurs", label: "Bailleurs" }}
      titre="Nouveau bailleur"
      onSoumettre={soumettre}
      libelleSoumettre="Enregistrer"
      envoi={envoi}
    >
      <div className="grid gap-4 sm:grid-cols-[1fr_10rem]">
        <Ligne libelle="Nom" erreur={erreurs.nom}>
          <input value={f.nom} onChange={maj("nom")} className={CHAMP} maxLength={200} />
        </Ligne>
        <Ligne libelle="Sigle (facultatif)">
          <input value={f.sigle} onChange={maj("sigle")} className={CHAMP} maxLength={20} />
        </Ligne>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Ligne libelle="Pays (facultatif)">
          <input value={f.pays} onChange={maj("pays")} className={CHAMP} maxLength={100} />
        </Ligne>
        <Ligne libelle="Personne de contact (facultatif)">
          <input value={f.contact} onChange={maj("contact")} className={CHAMP} maxLength={200} />
        </Ligne>
      </div>
      <Ligne libelle="E-mail (facultatif)">
        <input type="email" value={f.email} onChange={maj("email")} className={CHAMP} maxLength={255} />
      </Ligne>
    </CadreFormulaire>
  );
}

// ── Création d'une convention de financement ────────────────────────────────

export function FinancementFormPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [params] = useSearchParams();
  const { data: bailleurs = [] } = useBailleurs();
  const { data: projets = [] } = useProjets();
  const [f, setF] = useState({
    bailleurId: params.get("bailleur") ?? "",
    projetId: params.get("projet") ?? "",
    referenceConvention: "",
    montantAccorde: "",
    devise: "XOF",
    dateDebut: "",
    dateFin: "",
    conditionsReporting: "",
  });
  const [erreurs, setErreurs] = useState({});
  const [envoi, setEnvoi] = useState(false);
  const maj = (cle) => (e) => {
    setF((p) => ({ ...p, [cle]: e.target.value }));
    setErreurs((p) => ({ ...p, [cle]: undefined }));
  };

  const soumettre = async () => {
    const e = {};
    if (!f.bailleurId) e.bailleurId = "Choisissez le bailleur.";
    if (!f.projetId) e.projetId = "Choisissez le projet financé.";
    if (!f.referenceConvention.trim()) e.referenceConvention = "Indiquez la référence de la convention.";
    if (!(Number(f.montantAccorde) > 0)) e.montantAccorde = "Indiquez le montant accordé.";
    if (f.dateDebut && f.dateFin && f.dateFin < f.dateDebut) e.dateFin = "La fin doit suivre le début.";
    setErreurs(e);
    if (Object.keys(e).length) return;

    setEnvoi(true);
    try {
      await creerFinancement({
        ...f,
        referenceConvention: f.referenceConvention.trim(),
        montantAccorde: Number(f.montantAccorde),
        dateDebut: f.dateDebut || null,
        dateFin: f.dateFin || null,
        conditionsReporting: f.conditionsReporting.trim() || null,
      });
      await queryClient.invalidateQueries({ queryKey: ["financements"] });
      toast.success("Convention enregistrée");
      navigate(`/bailleurs/${f.bailleurId}`);
    } catch (err) {
      toast.error(messageErreur(err));
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <CadreFormulaire
      retour={{ to: "/bailleurs", label: "Bailleurs" }}
      titre="Nouvelle convention de financement"
      onSoumettre={soumettre}
      libelleSoumettre="Enregistrer"
      envoi={envoi}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Ligne
          libelle="Bailleur"
          erreur={erreurs.bailleurId}
          aide={bailleurs.length === 0 ? "Aucun bailleur : créez-le d'abord depuis la page Bailleurs." : undefined}
        >
          <select value={f.bailleurId} onChange={maj("bailleurId")} className={CHAMP}>
            <option value="">Choisir…</option>
            {bailleurs.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nom}
                {b.sigle ? ` (${b.sigle})` : ""}
              </option>
            ))}
          </select>
        </Ligne>
        <Ligne libelle="Projet financé" erreur={erreurs.projetId}>
          <select value={f.projetId} onChange={maj("projetId")} className={CHAMP}>
            <option value="">Choisir…</option>
            {projets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.titre}
              </option>
            ))}
          </select>
        </Ligne>
      </div>
      <Ligne libelle="Référence de la convention" erreur={erreurs.referenceConvention} aide="Numéro figurant sur l'accord signé.">
        <input value={f.referenceConvention} onChange={maj("referenceConvention")} className={CHAMP} maxLength={100} />
      </Ligne>
      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <Ligne libelle="Montant accordé" erreur={erreurs.montantAccorde}>
          <input type="number" min="0" inputMode="numeric" value={f.montantAccorde} onChange={maj("montantAccorde")} className={CHAMP} />
        </Ligne>
        <Ligne libelle="Devise">
          <select value={f.devise} onChange={maj("devise")} className={CHAMP}>
            {DEVISES.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </Ligne>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Ligne libelle="Début de la convention">
          <input type="date" value={f.dateDebut} onChange={maj("dateDebut")} className={CHAMP} />
        </Ligne>
        <Ligne libelle="Fin de la convention" erreur={erreurs.dateFin}>
          <input type="date" value={f.dateFin} min={f.dateDebut || undefined} onChange={maj("dateFin")} className={CHAMP} />
        </Ligne>
      </div>
      <Ligne libelle="Obligations de rapport (facultatif)" aide="Ex. rapport financier semestriel, rapport final 2 mois après la fin.">
        <textarea value={f.conditionsReporting} onChange={maj("conditionsReporting")} rows={3} className={CHAMP} />
      </Ligne>
    </CadreFormulaire>
  );
}
