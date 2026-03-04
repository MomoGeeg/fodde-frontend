import RoleGate from "@/components/shared/RoleGate";
import useAuthStore from "@/stores/auth.store";
import {
  ArrowLeft,
  FileUp,
  Info,
  Lock,
  Save,
  Send,
  Shield,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  createFinanceHelpers,
  DEVISES,
  MODES_PAIEMENT,
  nextNumeroPiece,
  SEUIL_APPROBATION_SE,
  SEUIL_PIECE_JUSTIFICATIVE,
  useLignesBudgetaires,
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
// PAGE — Saisie d'une dépense
// ════════════════════════════════════════════════════════════
export default function DepenseForm() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Données React Query
  const { data: allProjets = [] } = useProjetsFinances();
  const { data: allLignes = [] } = useLignesBudgetaires();
  const helpers = useMemo(
    () => createFinanceHelpers(allProjets, allLignes, []),
    [allProjets, allLignes],
  );

  // Numéro auto
  const [numeroPiece] = useState(() => nextNumeroPiece());

  // Champs du formulaire
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [libelle, setLibelle] = useState("");
  const [montant, setMontant] = useState("");
  const [devise, setDevise] = useState("XOF");
  const [tauxChange, setTauxChange] = useState("");
  const [projetId, setProjetId] = useState("");
  const [ligneId, setLigneId] = useState("");
  const [modePaiement, setModePaiement] = useState("");
  const [beneficiaire, setBeneficiaire] = useState("");
  const [justificatif, setJustificatif] = useState(null);

  // Erreurs de validation
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  // Projets accessibles au comptable (EN_COURS uniquement)
  const projets = useMemo(
    () => allProjets.filter((p) => p.statut === "EN_COURS"),
    [allProjets],
  );

  // Lignes budgétaires du projet sélectionné
  const lignes = useMemo(
    () => (projetId ? helpers.getLignesForProjet(projetId) : []),
    [helpers, projetId],
  );

  // Projet et ligne sélectionnés
  const projet = helpers.getProjet(projetId);
  const ligneSelected = lignes.find((l) => l.id === ligneId);
  const soldeDisponible = ligneId ? helpers.getSoldeDisponible(ligneId) : null;

  // Besoin d'un taux de change ?
  const needTauxChange = devise !== "XOF" && projetId;

  // Montant converti en XOF
  const montantNum = parseFloat(montant) || 0;
  const tauxNum = parseFloat(tauxChange) || 0;
  const montantXOF =
    devise === "XOF" ? montantNum : Math.round(montantNum * tauxNum);

  // Réinitialiser ligne quand le projet change
  useEffect(() => {
    setLigneId("");
  }, [projetId]);

  // ── Validation temps réel ──────────────────────────────
  useEffect(() => {
    if (!submitted) return;
    validate();
  }, [
    date,
    libelle,
    montant,
    devise,
    tauxChange,
    projetId,
    ligneId,
    modePaiement,
    beneficiaire,
    justificatif,
    submitted,
  ]);

  const validate = (isSubmit = false) => {
    const errs = {};
    if (!date) errs.date = "Date obligatoire";
    if (!libelle.trim()) errs.libelle = "Libellé obligatoire";
    if (!montantNum || montantNum <= 0)
      errs.montant = "Montant obligatoire et > 0";
    if (!projetId) errs.projetId = "Projet obligatoire";
    if (!ligneId) errs.ligneId = "Ligne budgétaire obligatoire";
    if (!modePaiement) errs.modePaiement = "Mode de paiement obligatoire";
    if (!beneficiaire.trim()) errs.beneficiaire = "Bénéficiaire obligatoire";
    if (needTauxChange && (!tauxNum || tauxNum <= 0))
      errs.tauxChange = "Taux de change obligatoire";

    // Règles bloquantes pour la soumission
    if (isSubmit) {
      if (soldeDisponible !== null && montantXOF > soldeDisponible)
        errs.montant = `Montant dépasse le solde disponible (${fmtMontant(soldeDisponible)})`;
      if (montantXOF > SEUIL_PIECE_JUSTIFICATIVE && !justificatif)
        errs.justificatif = `Pièce justificative obligatoire (montant > ${fmtMontant(SEUIL_PIECE_JUSTIFICATIVE)})`;
      if (projet && ["SUSPENDU", "CLOTURE"].includes(projet.statut))
        errs.projetId = `Impossible — projet ${projet.statut.toLowerCase()}`;
      if (ligneSelected?.gele) errs.ligneId = "Ligne budgétaire gelée";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleBrouillon = () => {
    setSubmitted(true);
    const errs = {};
    if (!date) errs.date = "Date obligatoire";
    if (!libelle.trim()) errs.libelle = "Libellé obligatoire";
    if (!montantNum || montantNum <= 0)
      errs.montant = "Montant obligatoire et > 0";
    if (!projetId) errs.projetId = "Projet obligatoire";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    toast.success("Brouillon enregistré — " + numeroPiece);
    navigate("/finances/depenses");
  };

  const handleSoumettre = () => {
    setSubmitted(true);
    if (!validate(true)) {
      toast.error("Veuillez corriger les erreurs avant de soumettre");
      return;
    }
    toast.success("Dépense soumise — " + numeroPiece + " → RAF notifié");
    navigate("/finances/depenses");
  };

  const fieldClass = (name) =>
    `w-full rounded-lg border ${errors[name] ? "border-red-400 bg-red-50" : "border-gray-200"} px-3 py-2 text-sm focus:border-green-500 focus:outline-none`;

  return (
    <RoleGate allowedRoles={["ROLE_COMPTABLE", "ROLE_ADMIN"]}>
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Retour */}
        <button
          onClick={() => navigate("/finances/depenses")}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft size={16} />
          Retour à la liste
        </button>

        {/* Entête */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Nouvelle dépense
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Saisie par {user?.prenom} {user?.nom}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase text-gray-400">
                N° pièce
              </p>
              <p className="text-lg font-mono font-bold text-green-700">
                {numeroPiece}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
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
              {errors.date && (
                <p className="mt-1 text-xs text-red-500">{errors.date}</p>
              )}
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
                disabled={!projetId}
                className={fieldClass("ligneId")}
              >
                <option value="">
                  {projetId
                    ? "— Sélectionner une ligne —"
                    : "Sélectionnez d'abord un projet"}
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
              {/* Solde disponible en temps réel */}
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
                    <>
                      <Lock size={12} /> Ligne gelée — imputation impossible
                    </>
                  ) : (
                    <>
                      <Info size={12} />
                      Solde disponible :{" "}
                      <span className="font-semibold">
                        {fmtMontant(soldeDisponible)}
                      </span>
                      {montantXOF > 0 && montantXOF > soldeDisponible && (
                        <span className="ml-2 text-red-600 font-bold">
                          ⚠ Dépassement de{" "}
                          {fmtMontant(montantXOF - soldeDisponible)}
                        </span>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Montant + Devise */}
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
                  <Shield size={10} /> Montant &gt; seuil SE (
                  {fmtMontant(SEUIL_APPROBATION_SE)}) — approbation SE requise
                </div>
              )}
            </div>
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
                    <option key={d} value={d}>
                      {d}
                    </option>
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
                    <p className="mt-1 text-xs text-red-500">
                      {errors.tauxChange}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Montant converti */}
            {needTauxChange && montantXOF > 0 && (
              <div className="sm:col-span-2 rounded-lg bg-blue-50 px-4 py-2.5 text-sm text-blue-700">
                <span className="font-semibold">Montant converti :</span>{" "}
                {fmtMontant(montantXOF)}
              </div>
            )}

            {/* Mode paiement */}
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
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              {errors.modePaiement && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.modePaiement}
                </p>
              )}
            </div>

            {/* Bénéficiaire */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                Bénéficiaire *
              </label>
              <input
                type="text"
                value={beneficiaire}
                onChange={(e) => setBeneficiaire(e.target.value)}
                placeholder="Nom du bénéficiaire"
                className={fieldClass("beneficiaire")}
              />
              {errors.beneficiaire && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.beneficiaire}
                </p>
              )}
            </div>

            {/* Pièce justificative */}
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                Pièce justificative{" "}
                {montantXOF > SEUIL_PIECE_JUSTIFICATIVE && (
                  <span className="text-red-500">* obligatoire</span>
                )}
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
                  size={20}
                  className={justificatif ? "text-green-500" : "text-gray-400"}
                />
                {justificatif ? (
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-700">
                      {justificatif.name}
                    </p>
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
                      onChange={(e) =>
                        setJustificatif(e.target.files?.[0] || null)
                      }
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
                <p className="mt-1 text-xs text-red-500">
                  {errors.justificatif}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Actions ───────────────────────────────────── */}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={() => navigate("/finances/depenses")}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={handleBrouillon}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Save size={15} />
            Enregistrer en brouillon
          </button>
          <button
            onClick={handleSoumettre}
            className="flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-medium text-white transition-colors"
            style={{ background: "linear-gradient(135deg, #5A9C3A, #4A7C2F)" }}
          >
            <Send size={15} />
            Soumettre
          </button>
        </div>
      </div>
    </RoleGate>
  );
}
