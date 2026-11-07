import api from "@/api/axios";
import RoleGate from "@/components/shared/RoleGate";
import useAuthStore from "@/stores/auth.store";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useComptesSansFiche, useCreateEmploye, useEmployes } from "@/api/rh-data";
import { messageErreur } from "@/lib/erreurs";

const TYPES_CONTRAT = ["CDI", "CDD", "CONSULTANT", "VOLONTAIRE", "STAGIAIRE"];
const DEVISES = ["XOF", "EUR", "USD"];

const emptyForm = {
  matricule: "",
  nom: "",
  prenom: "",
  dateNaissance: "",
  lieuNaissance: "",
  nationalite: "",
  telephone: "",
  adresse: "",
  poste: "",
  departement: "",
  superviseurId: "",
  typeContrat: "CDD",
  dateDebutContrat: "",
  dateFinContrat: "",
  salaireBase: "",
  devise: "XOF",
  motifModifSalaire: "",
};

// ── Génération matricule auto ──────────────────────────────
function generateMatricule() {
  const year = new Date().getFullYear();
  const num = String(Math.floor(Math.random() * 999) + 1).padStart(3, "0");
  return `EMP-${year}-${num}`;
}

function FieldError({ msg }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-red-500">{msg}</p>;
}

function FormLabel({ children, required }) {
  return (
    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
      {children} {required && <span className="text-red-500">*</span>}
    </label>
  );
}

function FormInput({
  value,
  onChange,
  type = "text",
  placeholder,
  disabled,
  className = "",
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-green-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400 ${className}`}
    />
  );
}

export default function RHEmployeForm() {
  const { id } = useParams();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const isRH = user?.roles?.some((r) => ["ROLE_RH", "ROLE_ADMIN"].includes(r));
  const isSE = user?.roles?.includes("ROLE_SE");
  const canSeeSalaire = isRH || isSE;

  const { data: allEmployes = [] } = useEmployes();

  const createEmployeMutation = useCreateEmploye();

  const [form, setForm] = useState({
    ...emptyForm,
    matricule: generateMatricule(),
  });
  const [originalSalaire, setOriginalSalaire] = useState(null);
  const [errors, setErrors] = useState({});

  // ── Compte de la personne sur la plateforme (création seulement) ──
  // La fiche naît liée au compte : la personne voit ensuite ses congés.
  const [params] = useSearchParams();
  const { data: comptesSansFiche = [] } = useComptesSansFiche({ enabled: !isEditMode });
  const [userId, setUserId] = useState("");
  const choisirCompte = (idCompte) => {
    setUserId(idCompte);
    const c = comptesSansFiche.find((x) => x.id === idCompte);
    if (!c) return;
    setForm((prev) => ({
      ...prev,
      nom: c.nom ?? prev.nom,
      prenom: c.prenom ?? prev.prenom,
      telephone: prev.telephone || c.telephone || "",
      departement: prev.departement || c.service || "",
    }));
  };
  // Fiche existante, sans compte, au même nom que le compte choisi : risque de doublon.
  const memeTexte = (a, b) => (a ?? "").trim().toLowerCase() === (b ?? "").trim().toLowerCase();
  const doublon = userId
    ? allEmployes.find((e) => !e.userId && memeTexte(e.nom, form.nom) && memeTexte(e.prenom, form.prenom))
    : null;
  // Arrivée depuis « Créer la fiche » d'un compte : on le présélectionne.
  const compteDemande = params.get("compte");
  const [compteApplique, setCompteApplique] = useState(false);
  if (!isEditMode && compteDemande && !compteApplique && comptesSansFiche.some((c) => c.id === compteDemande)) {
    setCompteApplique(true);
    choisirCompte(compteDemande);
  }

  // ── Charger les données en mode édition ──────────────────
  useEffect(() => {
    if (isEditMode) {
      const emp = allEmployes.find((e) => e.id === id);
      if (emp) {
        setForm({
          matricule: emp.matricule,
          nom: emp.nom,
          prenom: emp.prenom,
          dateNaissance: emp.dateNaissance || "",
          lieuNaissance: emp.lieuNaissance || "",
          nationalite: emp.nationalite || "",
          telephone: emp.telephone || "",
          adresse: emp.adresse || "",
          poste: emp.poste,
          departement: emp.departement || "",
          superviseurId: emp.superviseurId || "",
          typeContrat: emp.typeContrat,
          dateDebutContrat: emp.dateDebutContrat || "",
          dateFinContrat: emp.dateFinContrat || "",
          salaireBase: emp.salaireBase?.toString() || "",
          devise: emp.devise || "XOF",
          motifModifSalaire: "",
        });
        setOriginalSalaire(emp.salaireBase?.toString() || "");
      }
    }
  }, [id, isEditMode, allEmployes]);

  const salaireModifie =
    isEditMode &&
    originalSalaire !== null &&
    form.salaireBase !== originalSalaire;

  // ── Superviseurs disponibles ─────────────────────────────
  const superviseurs = allEmployes.filter(
    (e) => e.id !== id && e.statut === "ACTIF",
  );

  // ── Validation ───────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!form.nom.trim()) errs.nom = "Le nom est obligatoire";
    if (!form.prenom.trim()) errs.prenom = "Le prénom est obligatoire";
    if (!form.dateNaissance)
      errs.dateNaissance = "La date de naissance est obligatoire";
    if (!form.nationalite.trim())
      errs.nationalite = "La nationalité est obligatoire";
    if (!form.poste.trim()) errs.poste = "Le poste est obligatoire";
    if (!form.departement.trim())
      errs.departement = "Le service est obligatoire";
    if (!form.typeContrat)
      errs.typeContrat = "Le type de contrat est obligatoire";
    if (!form.dateDebutContrat)
      errs.dateDebutContrat = "La date de début est obligatoire";

    // Date fin obligatoire pour CDD/Consultant/Stagiaire
    if (
      ["CDD", "CONSULTANT", "STAGIAIRE"].includes(form.typeContrat) &&
      !form.dateFinContrat
    ) {
      errs.dateFinContrat =
        "La date de fin est obligatoire pour ce type de contrat";
    }

    if (!form.salaireBase || parseFloat(form.salaireBase) <= 0) {
      errs.salaireBase = "Le salaire doit être supérieur à 0";
    }

    // Motif obligatoire si salaire modifié
    if (salaireModifie && !form.motifModifSalaire.trim()) {
      errs.motifModifSalaire =
        "Un motif est obligatoire pour modifier le salaire (validation SE requise)";
    }

    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error("Veuillez corriger les erreurs du formulaire");
      return;
    }

    try {
      const employePayload = {
        userId: userId || null,
        matricule: form.matricule,
        nom: form.nom,
        prenom: form.prenom,
        dateNaissance: form.dateNaissance || null,
        lieuNaissance: form.lieuNaissance || null,
        nationalite: form.nationalite,
        telephone: form.telephone || null,
        adresse: form.adresse || null,
        poste: form.poste,
        departement: form.departement,
        dateEmbauche: form.dateDebutContrat,
        superviseurId: form.superviseurId || null,
      };

      const employe = await createEmployeMutation.mutateAsync(employePayload);

      const contratPayload = {
        employeId: employe.id,
        typeContrat: form.typeContrat,
        dateDebut: form.dateDebutContrat,
        dateFin: form.dateFinContrat || null,
        salaireBase: parseFloat(form.salaireBase),
        devise: form.devise,
        poste: form.poste,
      };
      await api.post("/api/contrats", contratPayload);

      toast.success("Dossier employé créé avec succès");
      navigate("/rh/employes");
    } catch (err) {
      // Ex. « Ce compte est déjà lié à la fiche de … » renvoyé par le backend
      toast.error(messageErreur(err, "Erreur lors de la création du dossier"));
    }
  };

  const set = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <RoleGate allowedRoles={["ROLE_RH", "ROLE_ADMIN"]}>
      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex items-center gap-4">
          <button
            onClick={() =>
              navigate(isEditMode ? `/rh/employes/${id}` : "/rh/employes")
            }
            className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditMode ? "Modifier le dossier" : "Nouveau dossier employé"}
            </h1>
            <p className="mt-0.5 text-sm text-gray-500">
              {isEditMode
                ? `Modification de ${form.prenom} ${form.nom}`
                : "Remplissez le formulaire pour créer un dossier"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ── Compte sur la plateforme ───────────────── */}
          {!isEditMode && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-3">
              <h2 className="text-base font-semibold text-gray-900 border-b border-gray-100 pb-3">
                Compte sur la plateforme
              </h2>
              <div className="sm:w-1/2">
                <FormLabel>Compte de la personne</FormLabel>
                <select
                  value={userId}
                  onChange={(e) => choisirCompte(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-green-500 focus:outline-none"
                >
                  <option value="">— Pas encore de compte —</option>
                  {comptesSansFiche.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.prenom} {c.nom} — {c.email}
                    </option>
                  ))}
                </select>
                {doublon && (
                  <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    Une fiche au nom de {doublon.prenom} {doublon.nom} existe déjà, sans compte
                    {doublon.matricule ? ` (${doublon.matricule})` : ""}. Pour éviter un doublon, demandez plutôt à
                    l'administrateur de l'associer à ce compte.
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-400">
                  {comptesSansFiche.length > 0
                    ? "Comptes qui n'ont pas encore de fiche. Liée à son compte, la personne voit ses congés et son solde."
                    : "Tous les comptes ont déjà une fiche."}
                </p>
              </div>
            </div>
          )}

          {/* ── Identité ────────────────────────────────── */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-5">
            <h2 className="text-base font-semibold text-gray-900 border-b border-gray-100 pb-3">
              Identité
            </h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <FormLabel>Matricule</FormLabel>
                <FormInput value={form.matricule} disabled />
                <p className="mt-1 text-xs text-gray-400">
                  Généré automatiquement
                </p>
              </div>
              <div /> {/* placeholder grid */}
              <div>
                <FormLabel required>Nom</FormLabel>
                <FormInput
                  value={form.nom}
                  onChange={set("nom")}
                  placeholder="Nom de famille"
                />
                <FieldError msg={errors.nom} />
              </div>
              <div>
                <FormLabel required>Prénom</FormLabel>
                <FormInput
                  value={form.prenom}
                  onChange={set("prenom")}
                  placeholder="Prénom"
                />
                <FieldError msg={errors.prenom} />
              </div>
              <div>
                <FormLabel required>Date de naissance</FormLabel>
                <FormInput
                  type="date"
                  value={form.dateNaissance}
                  onChange={set("dateNaissance")}
                />
                <FieldError msg={errors.dateNaissance} />
              </div>
              <div>
                <FormLabel>Lieu de naissance</FormLabel>
                <FormInput
                  value={form.lieuNaissance}
                  onChange={set("lieuNaissance")}
                  placeholder="Lieu de naissance"
                />
              </div>
              <div>
                <FormLabel required>Nationalité</FormLabel>
                <FormInput
                  value={form.nationalite}
                  onChange={set("nationalite")}
                  placeholder="Ex: Sénégalaise"
                />
                <FieldError msg={errors.nationalite} />
              </div>
              <div>
                <FormLabel>Téléphone</FormLabel>
                <FormInput
                  value={form.telephone}
                  onChange={set("telephone")}
                  placeholder="+221 77 000 00 00"
                />
              </div>
              <div className="sm:col-span-2">
                <FormLabel>Adresse</FormLabel>
                <textarea
                  value={form.adresse}
                  onChange={set("adresse")}
                  rows={2}
                  placeholder="Adresse complète..."
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-green-500 focus:outline-none resize-none"
                />
              </div>
            </div>
          </div>

          {/* ── Poste & Organisation ────────────────────── */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-5">
            <h2 className="text-base font-semibold text-gray-900 border-b border-gray-100 pb-3">
              Poste & Organisation
            </h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <FormLabel required>Poste</FormLabel>
                <FormInput
                  value={form.poste}
                  onChange={set("poste")}
                  placeholder="Intitulé du poste"
                />
                <FieldError msg={errors.poste} />
              </div>
              <div>
                <FormLabel required>Service / Département</FormLabel>
                <FormInput
                  value={form.departement}
                  onChange={set("departement")}
                  placeholder="Ex: Programmes"
                />
                <FieldError msg={errors.departement} />
              </div>
              <div>
                <FormLabel>Supérieur hiérarchique</FormLabel>
                <select
                  value={form.superviseurId}
                  onChange={set("superviseurId")}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-green-500 focus:outline-none"
                >
                  <option value="">— Aucun —</option>
                  {superviseurs.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.prenom} {s.nom} — {s.poste}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ── Contrat ─────────────────────────────────── */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-5">
            <h2 className="text-base font-semibold text-gray-900 border-b border-gray-100 pb-3">
              Contrat
            </h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <FormLabel required>Type de contrat</FormLabel>
                <select
                  value={form.typeContrat}
                  onChange={set("typeContrat")}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-green-500 focus:outline-none"
                >
                  {TYPES_CONTRAT.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <FieldError msg={errors.typeContrat} />
              </div>
              <div>
                <FormLabel required>Date de début</FormLabel>
                <FormInput
                  type="date"
                  value={form.dateDebutContrat}
                  onChange={set("dateDebutContrat")}
                />
                <FieldError msg={errors.dateDebutContrat} />
              </div>
              <div>
                <FormLabel
                  required={["CDD", "CONSULTANT", "STAGIAIRE"].includes(
                    form.typeContrat,
                  )}
                >
                  Date de fin
                </FormLabel>
                <FormInput
                  type="date"
                  value={form.dateFinContrat}
                  onChange={set("dateFinContrat")}
                />
                {form.typeContrat === "CDI" && (
                  <p className="mt-1 text-xs text-gray-400">
                    Optionnel pour un CDI
                  </p>
                )}
                <FieldError msg={errors.dateFinContrat} />
              </div>

              {/* Salaire — visible RH + SE uniquement */}
              {canSeeSalaire && (
                <>
                  <div>
                    <FormLabel required>Salaire brut mensuel</FormLabel>
                    <div className="flex gap-2">
                      <FormInput
                        type="number"
                        value={form.salaireBase}
                        onChange={set("salaireBase")}
                        placeholder="0"
                        className="flex-1"
                      />
                      <select
                        value={form.devise}
                        onChange={set("devise")}
                        className="w-20 rounded-lg border border-gray-200 px-2 py-2 text-sm text-gray-900 focus:border-green-500 focus:outline-none"
                      >
                        {DEVISES.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                    <FieldError msg={errors.salaireBase} />
                  </div>

                  {/* Motif modification salaire */}
                  {salaireModifie && (
                    <div className="sm:col-span-2">
                      <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                        <FormLabel required>
                          Motif de modification du salaire
                        </FormLabel>
                        <textarea
                          value={form.motifModifSalaire}
                          onChange={set("motifModifSalaire")}
                          rows={2}
                          placeholder="Motif obligatoire — nécessite validation du SE..."
                          className="w-full rounded-lg border border-orange-200 px-3 py-2 text-sm text-gray-900 focus:border-orange-400 focus:outline-none resize-none bg-white"
                        />
                        <p className="mt-1 text-xs text-orange-600">
                          ⚠ La modification de salaire sera soumise au SE pour
                          validation.
                        </p>
                        <FieldError msg={errors.motifModifSalaire} />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ── Actions ─────────────────────────────────── */}
          <div className="flex items-center justify-end gap-3 rounded-xl border border-gray-200 bg-white px-6 py-4 shadow-sm">
            <button
              type="button"
              onClick={() =>
                navigate(isEditMode ? `/rh/employes/${id}` : "/rh/employes")
              }
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={createEmployeMutation.isPending}
              className="rounded-lg px-5 py-2 text-sm font-medium text-white disabled:opacity-60 transition-colors"
              style={{
                background: "linear-gradient(135deg, #5A9C3A, #4A7C2F)",
              }}
            >
              {createEmployeMutation.isPending
                ? isEditMode
                  ? "Enregistrement..."
                  : "Création..."
                : isEditMode
                  ? "Enregistrer"
                  : "Créer le dossier"}
            </button>
          </div>
        </form>
      </div>
    </RoleGate>
  );
}
