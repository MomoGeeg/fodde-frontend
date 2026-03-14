import { changerStatutDepense, creerDepense } from "@/api/finances.api";
import api from "@/api/axios";
import useAuthStore from "@/stores/auth.store";
import {
  FileUp,
  Info,
  Lock,
  Save,
  Send,
  Shield,
  User,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  DEVISES,
  MODES_PAIEMENT,
  SEUIL_APPROBATION_SE,

  useLignesParProjet,
  useProjetsFinances,
} from "./finances-data";

const fmtMontant = (n, devise = "XOF") =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: devise,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

// ════════════════════════════════════════════════════════════
// MODAL — Saisie d'une dépense
// Props : open (bool), onClose (fn), onSuccess (fn optionnel)
// ════════════════════════════════════════════════════════════
export default function DepenseFormModal({ open, onClose, onSuccess }) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  // Données React Query
  const { data: allProjets = [] } = useProjetsFinances();
  const { data: employes = [] } = useQuery({
    queryKey: ["employes"],
    queryFn: () => api.get("/api/employes").then((r) => r.data),
    staleTime: 5 * 60_000,
  });
  const [projetId, setProjetId] = useState("");
  const { data: lignes = [], isLoading: loadingLignes, isError: errorLignes } = useLignesParProjet(projetId);

  // Projets actifs ou suspendus (un projet suspendu peut encore recevoir des dépenses)
  const projets = useMemo(
    () => allProjets.filter((p) => ["ACTIF", "SUSPENDU"].includes(p.statut)),
    [allProjets],
  );

  // Employés actifs triés par nom
  const employesActifs = useMemo(
    () =>
      employes
        .filter((e) => e.statut === "ACTIF")
        .sort((a, b) => `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`)),
    [employes],
  );

  // Champs du formulaire
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [libelle, setLibelle] = useState("");
  const [montant, setMontant] = useState("");
  const [devise, setDevise] = useState("XOF");
  const [tauxChange, setTauxChange] = useState("");
  const [ligneId, setLigneId] = useState("");
  const [modePaiement, setModePaiement] = useState("");
  // Bénéficiaire : "EMPLOYE" | "EXTERNE"
  const [beneficiaireType, setBeneficiaireType] = useState("EXTERNE");
  const [beneficiaireEmployeId, setBeneficiaireEmployeId] = useState("");
  const [beneficiaire, setBeneficiaire] = useState("");
  const [justificatif, setJustificatif] = useState(null);

  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  // Réinitialisation à l'ouverture
  useEffect(() => {
    if (open) {
      setProjetId("");
      setDate(new Date().toISOString().split("T")[0]);
      setLibelle("");
      setMontant("");
      setDevise("XOF");
      setTauxChange("");
      setLigneId("");
      setModePaiement("");
      setBeneficiaireType("EXTERNE");
      setBeneficiaireEmployeId("");
      setBeneficiaire("");
      setJustificatif(null);
      setErrors({});
      setSubmitted(false);
      setSaving(false);
    }
  }, [open]);

  // Ligne sélectionnée
  const ligneSelected = lignes.find((l) => l.id === ligneId);
  const soldeDisponible = ligneSelected
    ? (ligneSelected.soldeDisponible != null
        ? Number(ligneSelected.soldeDisponible)
        : ligneSelected.prevu - ligneSelected.depense)
    : null;

  const needTauxChange = devise !== "XOF";
  const montantNum = parseFloat(montant) || 0;
  const tauxNum = parseFloat(tauxChange) || 0;
  const montantXOF = devise === "XOF" ? montantNum : Math.round(montantNum * tauxNum);

  // Réinitialiser ligne si projet change
  useEffect(() => {
    setLigneId("");
  }, [projetId]);

  // Nom du bénéficiaire résolu (employé ou texte libre)
  const beneficiaireLabel = useMemo(() => {
    if (beneficiaireType === "EMPLOYE") {
      const emp = employesActifs.find((e) => e.id === beneficiaireEmployeId);
      return emp ? `${emp.prenom} ${emp.nom}` : "";
    }
    return beneficiaire.trim();
  }, [beneficiaireType, beneficiaireEmployeId, beneficiaire, employesActifs]);

  // Validation en temps réel après première soumission
  useEffect(() => {
    if (submitted) validate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, libelle, montant, devise, tauxChange, projetId, ligneId, modePaiement, beneficiaireType, beneficiaireEmployeId, beneficiaire, submitted]);

  const validate = (isSubmit = false) => {
    const errs = {};
    if (!date) errs.date = "Date obligatoire";
    if (!libelle.trim()) errs.libelle = "Libellé obligatoire";
    if (!montantNum || montantNum <= 0) errs.montant = "Montant obligatoire et > 0";
    if (!projetId) errs.projetId = "Projet obligatoire";
    if (!ligneId) errs.ligneId = "Ligne budgétaire obligatoire";
    if (!modePaiement) errs.modePaiement = "Mode de paiement obligatoire";
    if (beneficiaireType === "EMPLOYE" && !beneficiaireEmployeId)
      errs.beneficiaire = "Sélectionnez un employé";
    if (beneficiaireType === "EXTERNE" && !beneficiaire.trim())
      errs.beneficiaire = "Bénéficiaire obligatoire";
    if (needTauxChange && (!tauxNum || tauxNum <= 0))
      errs.tauxChange = "Taux de change obligatoire";

    if (isSubmit) {
      if (soldeDisponible !== null && montantXOF > soldeDisponible)
        errs.montant = `Montant dépasse le solde disponible (${fmtMontant(soldeDisponible)})`;
      if (ligneSelected?.gele) errs.ligneId = "Ligne budgétaire gelée";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const buildPayload = () => ({
    ligneBudgetaireId: ligneId,
    projetId,
    libelle: libelle.trim(),
    montant: montantNum,
    devise,
    modePaiement,
    beneficiaire: beneficiaireLabel,
    dateDepense: date,
  });

  const afterSave = () => {
    queryClient.invalidateQueries({ queryKey: ["fin-depenses"] });
    onSuccess?.();
    onClose();
  };

  const handleBrouillon = async () => {
    setSubmitted(true);
    const errs = {};
    if (!date) errs.date = "Date obligatoire";
    if (!libelle.trim()) errs.libelle = "Libellé obligatoire";
    if (!montantNum || montantNum <= 0) errs.montant = "Montant obligatoire et > 0";
    if (!projetId) errs.projetId = "Projet obligatoire";
    if (!ligneId) errs.ligneId = "Ligne budgétaire obligatoire";
    if (!modePaiement) errs.modePaiement = "Mode de paiement obligatoire";
    if (beneficiaireType === "EMPLOYE" && !beneficiaireEmployeId)
      errs.beneficiaire = "Sélectionnez un employé";
    if (beneficiaireType === "EXTERNE" && !beneficiaire.trim())
      errs.beneficiaire = "Bénéficiaire obligatoire";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    try {
      const depense = await creerDepense(buildPayload(), user.id);
      toast.success(`Brouillon enregistré — ${depense.numeroPiece}`);
      afterSave();
    } catch (err) {
      toast.error(err?.response?.data?.erreur ?? "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handleSoumettre = async () => {
    setSubmitted(true);
    if (!validate(true)) {
      toast.error("Veuillez corriger les erreurs avant de soumettre");
      return;
    }

    setSaving(true);
    try {
      const depense = await creerDepense(buildPayload(), user.id);
      await changerStatutDepense(depense.id, "SOUMISE", user.id);
      toast.success(`Dépense soumise — ${depense.numeroPiece} → RAF notifié`);
      afterSave();
    } catch (err) {
      toast.error(err?.response?.data?.erreur ?? "Erreur lors de la soumission");
    } finally {
      setSaving(false);
    }
  };

  const fieldClass = (name) =>
    `w-full rounded-lg border ${errors[name] ? "border-red-400 bg-red-50" : "border-gray-200"} px-3 py-2 text-sm focus:border-green-500 focus:outline-none`;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={!saving ? onClose : undefined}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* En-tête */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Nouvelle dépense</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Saisie par {user?.prenom} {user?.nom}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40"
          >
            <X size={18} />
          </button>
        </div>

        {/* Formulaire */}
        <div className="px-6 py-5 space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Date */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                Date de dépense *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={fieldClass("date")}
              />
              {errors.date && <p className="mt-1 text-xs text-red-500">{errors.date}</p>}
            </div>

            {/* Projet */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                Projet *
              </label>
              <select
                value={projetId}
                onChange={(e) => setProjetId(e.target.value)}
                className={fieldClass("projetId")}
              >
                <option value="">— Sélectionner —</option>
                {projets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} — {p.titre}
                  </option>
                ))}
              </select>
              {errors.projetId && (
                <p className="mt-1 text-xs text-red-500">{errors.projetId}</p>
              )}
            </div>

            {/* Libellé */}
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                Libellé *
              </label>
              <input
                type="text"
                value={libelle}
                onChange={(e) => setLibelle(e.target.value)}
                placeholder="Description de la dépense"
                className={fieldClass("libelle")}
              />
              {errors.libelle && (
                <p className="mt-1 text-xs text-red-500">{errors.libelle}</p>
              )}
            </div>

            {/* Ligne budgétaire */}
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                Ligne budgétaire *
              </label>
              <select
                value={ligneId}
                onChange={(e) => setLigneId(e.target.value)}
                disabled={!projetId || loadingLignes}
                className={fieldClass("ligneId")}
              >
                <option value="">
                  {!projetId
                    ? "Sélectionnez d'abord un projet"
                    : loadingLignes
                      ? "Chargement..."
                      : errorLignes
                        ? "Erreur de chargement — réessayez"
                        : lignes.length === 0
                          ? "Aucune ligne budgétaire — le RAF doit créer une allocation pour ce projet"
                          : "— Sélectionner une ligne —"}
                </option>
                {lignes.map((l) => (
                  <option key={l.id} value={l.id} disabled={l.gele}>
                    {l.code} — {l.intitule}
                    {l.gele ? " 🔒 Gelée" : ""}
                  </option>
                ))}
              </select>
              {errors.ligneId && (
                <p className="mt-1 text-xs text-red-500">{errors.ligneId}</p>
              )}
              {ligneSelected && (
                <div
                  className={`mt-2 flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${
                    ligneSelected.gele
                      ? "bg-gray-100 text-gray-500"
                      : soldeDisponible > 0
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-700"
                  }`}
                >
                  {ligneSelected.gele ? (
                    <><Lock size={12} /> Ligne gelée — imputation impossible</>
                  ) : (
                    <>
                      <Info size={12} />
                      Solde disponible :{" "}
                      <span className="font-semibold">{fmtMontant(soldeDisponible)}</span>
                      {montantXOF > 0 && soldeDisponible !== null && montantXOF > soldeDisponible && (
                        <span className="ml-2 font-bold text-red-600">
                          ⚠ Dépassement de {fmtMontant(montantXOF - soldeDisponible)}
                        </span>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Montant */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                Montant *
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={montant}
                onChange={(e) => setMontant(e.target.value)}
                placeholder="0"
                className={fieldClass("montant")}
              />
              {errors.montant && (
                <p className="mt-1 text-xs text-red-500">{errors.montant}</p>
              )}
              {montantXOF > SEUIL_APPROBATION_SE && (
                <div className="mt-1 flex items-center gap-1 text-[10px] text-purple-600">
                  <Shield size={10} /> Montant &gt; seuil SE — approbation SE requise
                </div>
              )}
            </div>

            {/* Devise + Taux */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="mb-1 block text-xs font-semibold text-gray-600">
                  Devise
                </label>
                <select
                  value={devise}
                  onChange={(e) => setDevise(e.target.value)}
                  className={fieldClass("devise")}
                >
                  {DEVISES.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              {needTauxChange && (
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-semibold text-gray-600">
                    Taux de change *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    value={tauxChange}
                    onChange={(e) => setTauxChange(e.target.value)}
                    placeholder="ex: 655.957"
                    className={fieldClass("tauxChange")}
                  />
                  {errors.tauxChange && (
                    <p className="mt-1 text-xs text-red-500">{errors.tauxChange}</p>
                  )}
                </div>
              )}
            </div>

            {needTauxChange && montantXOF > 0 && (
              <div className="sm:col-span-2 rounded-lg bg-blue-50 px-4 py-2 text-sm text-blue-700">
                <span className="font-semibold">Montant converti :</span>{" "}
                {fmtMontant(montantXOF)}
              </div>
            )}

            {/* Mode de paiement */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                Mode de paiement *
              </label>
              <select
                value={modePaiement}
                onChange={(e) => setModePaiement(e.target.value)}
                className={fieldClass("modePaiement")}
              >
                <option value="">— Sélectionner —</option>
                {MODES_PAIEMENT.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
              {errors.modePaiement && (
                <p className="mt-1 text-xs text-red-500">{errors.modePaiement}</p>
              )}
            </div>

            {/* Bénéficiaire */}
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                Bénéficiaire *
              </label>
              {/* Toggle type */}
              <div className="mb-2 flex rounded-lg border border-gray-200 overflow-hidden text-xs font-medium">
                <button
                  type="button"
                  onClick={() => { setBeneficiaireType("EXTERNE"); setBeneficiaireEmployeId(""); }}
                  className={`flex-1 py-1.5 transition-colors ${
                    beneficiaireType === "EXTERNE"
                      ? "bg-gray-700 text-white"
                      : "bg-white text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  Externe / fournisseur
                </button>
                <button
                  type="button"
                  onClick={() => { setBeneficiaireType("EMPLOYE"); setBeneficiaire(""); }}
                  className={`flex-1 flex items-center justify-center gap-1 py-1.5 transition-colors ${
                    beneficiaireType === "EMPLOYE"
                      ? "bg-gray-700 text-white"
                      : "bg-white text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <User size={11} /> Employé interne
                </button>
              </div>
              {beneficiaireType === "EXTERNE" ? (
                <input
                  type="text"
                  value={beneficiaire}
                  onChange={(e) => setBeneficiaire(e.target.value)}
                  placeholder="Nom du fournisseur, prestataire…"
                  className={fieldClass("beneficiaire")}
                />
              ) : (
                <select
                  value={beneficiaireEmployeId}
                  onChange={(e) => setBeneficiaireEmployeId(e.target.value)}
                  className={fieldClass("beneficiaire")}
                >
                  <option value="">— Sélectionner un employé —</option>
                  {employesActifs.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.nom} {e.prenom}
                      {e.poste ? ` — ${e.poste}` : ""}
                    </option>
                  ))}
                </select>
              )}
              {errors.beneficiaire && (
                <p className="mt-1 text-xs text-red-500">{errors.beneficiaire}</p>
              )}
            </div>

            {/* Pièce justificative */}
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                Pièce justificative{" "}
                <span className="text-gray-400 font-normal">(optionnelle)</span>
              </label>
              <div
                className={`flex items-center gap-3 rounded-lg border-2 border-dashed px-4 py-3 transition-colors ${
                  errors.justificatif
                    ? "border-red-300 bg-red-50"
                    : justificatif
                      ? "border-green-300 bg-green-50"
                      : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <FileUp
                  size={18}
                  className={justificatif ? "text-green-500" : "text-gray-400"}
                />
                {justificatif ? (
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-700">{justificatif.name}</p>
                    <p className="text-xs text-green-500">
                      {(justificatif.size / 1024).toFixed(0)} Ko
                    </p>
                  </div>
                ) : (
                  <label className="flex-1 cursor-pointer">
                    <p className="text-sm text-gray-500">
                      Cliquer pour joindre un fichier (PDF, image)
                    </p>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => setJustificatif(e.target.files?.[0] || null)}
                    />
                  </label>
                )}
                {justificatif && (
                  <button
                    onClick={() => setJustificatif(null)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Supprimer
                  </button>
                )}
              </div>
              {errors.justificatif && (
                <p className="mt-1 text-xs text-red-500">{errors.justificatif}</p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4 sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={handleBrouillon}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <Save size={14} />
            {saving ? "Enregistrement..." : "Brouillon"}
          </button>
          <button
            onClick={handleSoumettre}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #5A9C3A, #4A7C2F)" }}
          >
            <Send size={14} />
            {saving ? "Soumission..." : "Soumettre"}
          </button>
        </div>
      </div>
    </div>
  );
}
