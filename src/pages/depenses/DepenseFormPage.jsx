import {
  DEVISES,
  MODES_PAIEMENT,
  SEUIL_APPROBATION_SE,
  creerDepense,
  montant,
  useLignesBudgetaires,
  useProjets,
} from "@/api/depenses";
import api from "@/api/axios";
import useAuthStore from "@/stores/auth.store";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

const aujourdhui = () => new Date().toISOString().slice(0, 10);

const VIDE = {
  projetId: "",
  ligneBudgetaireId: "",
  libelle: "",
  montant: "",
  devise: "XOF",
  modePaiement: "ESPECES",
  beneficiaire: "",
  dateDepense: aujourdhui(),
};

const champ = "mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none";

function Ligne({ libelle, erreur, children }) {
  return (
    <label className="block text-sm">
      <span className="text-gray-700">{libelle}</span>
      {children}
      {erreur && <span className="mt-1 block text-xs text-danger">{erreur}</span>}
    </label>
  );
}

/** Saisie d'une dépense : enregistrée en brouillon ou soumise directement au RAF. */
export default function DepenseFormPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [f, setF] = useState(VIDE);
  const [erreurs, setErreurs] = useState({});
  const [envoi, setEnvoi] = useState(false);

  const { data: projets = [] } = useProjets();
  const { data: lignes = [], isLoading: chargementLignes } = useLignesBudgetaires(f.projetId);
  const projetsOuverts = projets.filter((p) => p.statut !== "CLOTURE" && p.statut !== "SUSPENDU");
  const ligne = lignes.find((l) => l.id === f.ligneBudgetaireId);
  const solde = ligne?.soldeDisponible != null ? Number(ligne.soldeDisponible) : null;
  const montantSaisi = Number(f.montant) || 0;

  const maj = (cle) => (e) => {
    const valeur = e.target.value;
    setF((prev) => ({ ...prev, [cle]: valeur, ...(cle === "projetId" ? { ligneBudgetaireId: "" } : {}) }));
    setErreurs((prev) => ({ ...prev, [cle]: undefined }));
  };

  const verifier = () => {
    const e = {};
    if (!f.projetId) e.projetId = "Choisissez un projet.";
    if (!f.ligneBudgetaireId) e.ligneBudgetaireId = "Choisissez une ligne budgétaire.";
    else if (ligne?.estGelee) e.ligneBudgetaireId = "Cette ligne est gelée.";
    if (!f.libelle.trim()) e.libelle = "Indiquez l'objet de la dépense.";
    if (montantSaisi <= 0) e.montant = "Indiquez un montant positif.";
    else if (solde != null && montantSaisi > solde) e.montant = `Dépasse le solde disponible (${montant(solde, f.devise)}).`;
    if (!f.beneficiaire.trim()) e.beneficiaire = "Indiquez le bénéficiaire.";
    if (!f.dateDepense) e.dateDepense = "Indiquez la date.";
    setErreurs(e);
    return Object.keys(e).length === 0;
  };

  const enregistrer = async (soumettre) => {
    if (!verifier()) return;
    setEnvoi(true);
    const erreur = (err, defaut) => err?.response?.data?.erreur || err?.response?.data?.message || defaut;
    let creee;
    try {
      creee = await creerDepense(
        { ...f, libelle: f.libelle.trim(), beneficiaire: f.beneficiaire.trim(), montant: montantSaisi },
        user.id,
      );
    } catch (err) {
      toast.error(erreur(err, "Enregistrement impossible."));
      setEnvoi(false);
      return;
    }
    if (soumettre) {
      try {
        await api.patch(`/api/depenses/${creee.id}/statut`, { statut: "SOUMISE", userId: user.id });
        toast.success(`Dépense ${creee.numeroPiece} soumise au RAF`);
      } catch (err) {
        // Le brouillon existe : on l'ouvre pour que l'utilisateur puisse le soumettre de nouveau.
        toast.error(`Brouillon ${creee.numeroPiece} enregistré, mais la soumission a échoué : ${erreur(err, "réessayez depuis la fiche.")}`);
      }
    } else {
      toast.success(`Brouillon ${creee.numeroPiece} enregistré`);
    }
    await queryClient.invalidateQueries({ queryKey: ["depenses"] });
    navigate(`/finances/depenses/${creee.id}`);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link to="/finances/depenses" className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
        <ArrowLeft size={16} /> Dépenses
      </Link>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          enregistrer(true);
        }}
        className="space-y-4 rounded-lg border border-gray-200 bg-white p-5"
        noValidate
      >
        <h2 className="text-base font-semibold text-gray-900">Nouvelle dépense</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <Ligne libelle="Projet" erreur={erreurs.projetId}>
            <select value={f.projetId} onChange={maj("projetId")} className={champ}>
              <option value="">Choisir…</option>
              {projetsOuverts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.titre}
                </option>
              ))}
            </select>
          </Ligne>
          <Ligne libelle="Ligne budgétaire" erreur={erreurs.ligneBudgetaireId}>
            <select value={f.ligneBudgetaireId} onChange={maj("ligneBudgetaireId")} className={champ} disabled={!f.projetId}>
              <option value="">
                {!f.projetId ? "Choisir d'abord un projet" : chargementLignes ? "Chargement…" : lignes.length ? "Choisir…" : "Aucune ligne pour ce projet"}
              </option>
              {lignes.map((l) => (
                <option key={l.id} value={l.id} disabled={l.estGelee}>
                  {l.code} — {l.intitule}
                  {l.estGelee ? " (gelée)" : ""}
                </option>
              ))}
            </select>
            {solde != null && (
              <span className="mt-1 block text-xs text-gray-500">Solde disponible : {montant(solde, f.devise)}</span>
            )}
          </Ligne>
        </div>

        <Ligne libelle="Objet de la dépense" erreur={erreurs.libelle}>
          <input value={f.libelle} onChange={maj("libelle")} className={champ} maxLength={255} />
        </Ligne>

        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <Ligne libelle="Montant" erreur={erreurs.montant}>
            <input type="number" min="0" step="1" inputMode="numeric" value={f.montant} onChange={maj("montant")} className={champ} />
          </Ligne>
          <Ligne libelle="Devise">
            <select value={f.devise} onChange={maj("devise")} className={champ}>
              {DEVISES.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </Ligne>
        </div>
        {montantSaisi > SEUIL_APPROBATION_SE && (
          <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Au-delà de {montant(SEUIL_APPROBATION_SE)}, la dépense devra aussi être approuvée par le Secrétaire exécutif.
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Ligne libelle="Bénéficiaire" erreur={erreurs.beneficiaire}>
            <input value={f.beneficiaire} onChange={maj("beneficiaire")} className={champ} />
          </Ligne>
          <Ligne libelle="Mode de paiement">
            <select value={f.modePaiement} onChange={maj("modePaiement")} className={champ}>
              {Object.entries(MODES_PAIEMENT).map(([code, label]) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </select>
          </Ligne>
          <Ligne libelle="Date de la dépense" erreur={erreurs.dateDepense}>
            <input type="date" value={f.dateDepense} onChange={maj("dateDepense")} className={champ} max={aujourdhui()} />
          </Ligne>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => enregistrer(false)}
            disabled={envoi}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Enregistrer le brouillon
          </button>
          <button
            type="submit"
            disabled={envoi}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
          >
            {envoi ? "Envoi…" : "Soumettre au RAF"}
          </button>
        </div>
      </form>
    </div>
  );
}
