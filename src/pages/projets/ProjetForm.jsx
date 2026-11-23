import api from "@/api/axios";
import { useBailleurs } from "@/api/bailleurs";
import { projetsApi } from "@/api/projets.api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

const DEVISES = ["XOF", "EUR", "USD"];

const emptyForm = {
  code: "",
  titre: "",
  description: "",
  objectifGeneral: "",
  zoneGeographique: "",
  bailleur: "",
  dateDebut: "",
  dateFin: "",
  budgetTotal: "",
  devise: "XOF",
  chefProjetId: "",
};

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

export default function ProjetForm() {
  const { id } = useParams();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState(emptyForm);
  const [resultats, setResultats] = useState([""]);
  const [errors, setErrors] = useState({});

  // Comptes actifs : le chargé de projet est choisi parmi les chargés de programme.
  const { data: personnes = [] } = useQuery({
    queryKey: ["projets", "personnes"],
    queryFn: () =>
      api
        .get("/api/projets/personnes")
        .then((r) => (Array.isArray(r.data) ? r.data : [])),
  });
  const charges = personnes.filter((p) =>
    p.roles?.includes("ROLE_CHARGE_PROGRAMME"),
  );
  const { data: bailleurs = [] } = useBailleurs();

  const { data: projetData, isLoading: loadingProjet } = useQuery({
    queryKey: ["projet", id],
    queryFn: () => projetsApi.getById(id),
    enabled: isEditMode,
  });

  useEffect(() => {
    if (projetData) {
      const p = projetData;
      setForm({
        code: p.code ?? "",
        titre: p.titre ?? "",
        description: p.description ?? "",
        objectifGeneral: p.objectifGeneral ?? "",
        zoneGeographique: p.zoneGeographique ?? "",
        bailleur: p.bailleur ?? "",
        dateDebut: p.dateDebut ?? "",
        dateFin: p.dateFin ?? "",
        budgetTotal: p.budgetTotal?.toString() ?? "",
        devise: p.devise ?? "XOF",
        chefProjetId: p.chefProjetId ?? "",
      });
    }
  }, [projetData]);

  const { mutate: creer, isPending: creating } = useMutation({
    mutationFn: projetsApi.create,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["projets"] });
      const msg =
        res.statut === "EN_VALIDATION"
          ? "Projet soumis à validation avec succès"
          : "Projet enregistré comme brouillon";
      toast.success(msg);
      navigate(`../${res.id}`, { relative: "path" });
    },
    onError: (err) => toast.error(err.message ?? "Erreur lors de la création"),
  });

  const { mutate: modifier, isPending: updating } = useMutation({
    mutationFn: (data) => projetsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projet", id] });
      queryClient.invalidateQueries({ queryKey: ["projets"] });
      toast.success("Projet mis à jour");
      navigate(-1);
    },
    onError: (err) =>
      toast.error(err.message ?? "Erreur lors de la mise à jour"),
  });

  const isPending = creating || updating;
  const [submitMode, setSubmitMode] = useState("BROUILLON");

  const validate = () => {
    const errs = {};
    if (!form.titre.trim()) errs.titre = "Le titre est obligatoire";
    if (!form.description.trim())
      errs.description = "La description est obligatoire";
    if (!form.objectifGeneral.trim())
      errs.objectifGeneral = "L'objectif général est obligatoire";
    if (!form.zoneGeographique.trim())
      errs.zoneGeographique = "La zone géographique est obligatoire";
    if (!form.bailleur.trim()) errs.bailleur = "Le bailleur est obligatoire";
    if (!form.dateDebut) errs.dateDebut = "La date de début est obligatoire";
    if (!form.dateFin) {
      errs.dateFin = "La date de fin est obligatoire";
    } else if (form.dateDebut && form.dateFin <= form.dateDebut) {
      errs.dateFin = "La date de fin doit être postérieure à la date de début";
    }
    if (
      !isEditMode &&
      (!form.budgetTotal || parseFloat(form.budgetTotal) <= 0)
    ) {
      errs.budgetTotal = "Le budget doit être supérieur à 0";
    }
    if (!form.chefProjetId)
      errs.chefProjetId = "Le chargé de projet est obligatoire";
    if (!isEditMode && resultats.filter((r) => r.trim()).length === 0) {
      errs.resultats = "Au moins un résultat attendu est obligatoire";
    }
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error("Veuillez corriger les erreurs du formulaire");
      return;
    }

    const payload = {
      titre: form.titre.trim(),
      description: form.description.trim(),
      objectifGeneral: form.objectifGeneral.trim(),
      zoneGeographique: form.zoneGeographique.trim(),
      bailleur: form.bailleur.trim(),
      dateDebut: form.dateDebut,
      dateFin: form.dateFin,
      budgetTotal: parseFloat(form.budgetTotal),
      devise: form.devise,
      chefProjetId: form.chefProjetId,
      resultats: isEditMode
        ? undefined
        : resultats.map((r) => r.trim()).filter(Boolean),
    };

    if (isEditMode) {
      modifier(payload);
    } else {
      creer({ ...payload, statut: submitMode });
    }
  };

  const set = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const addResultat = () => setResultats((prev) => [...prev, ""]);
  const updateResultat = (i, val) =>
    setResultats((prev) => prev.map((r, idx) => (idx === i ? val : r)));
  const removeResultat = (i) =>
    setResultats((prev) => prev.filter((_, idx) => idx !== i));

  if (isEditMode && loadingProjet) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-10 animate-pulse rounded-lg bg-gray-200"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditMode ? "Modifier le projet" : "Nouveau projet"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identification */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-5">
          <h2 className="text-base font-semibold text-gray-900 border-b border-gray-100 pb-3">
            Identification
          </h2>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {isEditMode && (
              <div>
                <FormLabel>Code projet</FormLabel>
                <FormInput value={form.code} disabled />
              </div>
            )}

            <div>
              <FormLabel required>Devise</FormLabel>
              <select
                value={form.devise}
                onChange={set("devise")}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-green-500 focus:outline-none"
              >
                {DEVISES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <FormLabel required>Titre du projet</FormLabel>
              <FormInput
                value={form.titre}
                onChange={set("titre")}
                placeholder="Titre complet du projet"
              />
              <FieldError msg={errors.titre} />
            </div>

            <div className="sm:col-span-2">
              <FormLabel required>Description</FormLabel>
              <textarea
                value={form.description}
                onChange={set("description")}
                rows={3}
                placeholder="Description détaillée du projet..."
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-green-500 focus:outline-none resize-none"
              />
              <FieldError msg={errors.description} />
            </div>

            <div className="sm:col-span-2">
              <FormLabel required>Objectif général</FormLabel>
              <textarea
                value={form.objectifGeneral}
                onChange={set("objectifGeneral")}
                rows={2}
                placeholder="Objectif général du projet..."
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-green-500 focus:outline-none resize-none"
              />
              <FieldError msg={errors.objectifGeneral} />
            </div>

            <div>
              <FormLabel required>Zone géographique</FormLabel>
              <FormInput
                value={form.zoneGeographique}
                onChange={set("zoneGeographique")}
                placeholder="Ex: Kolda, Sédhiou, Ziguinchor"
              />
              <FieldError msg={errors.zoneGeographique} />
            </div>

            <div>
              <FormLabel required>Bailleur de fonds</FormLabel>
              <input
                list="liste-bailleurs"
                value={form.bailleur}
                onChange={set("bailleur")}
                placeholder="Ex: Union Européenne, USAID, AFD"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-green-500 focus:outline-none"
              />
              <datalist id="liste-bailleurs">
                {bailleurs.map((b) => (
                  <option key={b.id} value={b.nom} />
                ))}
              </datalist>
              <FieldError msg={errors.bailleur} />
            </div>
          </div>
        </div>

        {/* Planification & Budget */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-5">
          <h2 className="text-base font-semibold text-gray-900 border-b border-gray-100 pb-3">
            Planification & Budget
          </h2>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <FormLabel required>Date de début</FormLabel>
              <FormInput
                type="date"
                value={form.dateDebut}
                onChange={set("dateDebut")}
              />
              <FieldError msg={errors.dateDebut} />
            </div>

            <div>
              <FormLabel required>Date de fin</FormLabel>
              <FormInput
                type="date"
                value={form.dateFin}
                onChange={set("dateFin")}
                className={
                  form.dateFin &&
                  form.dateDebut &&
                  form.dateFin <= form.dateDebut
                    ? "border-red-300"
                    : ""
                }
              />
              <FieldError msg={errors.dateFin} />
            </div>

            <div>
              <FormLabel required>Budget total</FormLabel>
              <FormInput
                type="number"
                value={form.budgetTotal}
                onChange={set("budgetTotal")}
                placeholder="0"
                disabled={isEditMode}
              />
              <FieldError msg={errors.budgetTotal} />
            </div>
          </div>
        </div>

        {/* Résultats attendus */}
        {!isEditMode && (
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-base font-semibold text-gray-900 border-b border-gray-100 pb-3">
              Résultats attendus <span className="text-red-500">*</span>
            </h2>

            <div className="space-y-2">
              {resultats.map((r, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {i + 1}
                  </span>
                  <input
                    type="text"
                    value={r}
                    onChange={(e) => updateResultat(i, e.target.value)}
                    placeholder={`Résultat attendu ${i + 1}...`}
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-green-500 focus:outline-none"
                  />
                  {resultats.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeResultat(i)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addResultat}
              className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary-dark transition-colors"
            >
              <Plus size={14} />
              Ajouter un résultat
            </button>
            <FieldError msg={errors.resultats} />
          </div>
        )}

        {/* Chargé de projet */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-5">
          <h2 className="text-base font-semibold text-gray-900 border-b border-gray-100 pb-3">
            Chargé de projet
          </h2>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <FormLabel required>Chargé de projet</FormLabel>
              <select
                value={form.chefProjetId}
                onChange={set("chefProjetId")}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-green-500 focus:outline-none"
              >
                <option value="">Choisir</option>
                {charges.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nom}
                  </option>
                ))}
              </select>
              <FieldError msg={errors.chefProjetId} />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 rounded-xl border border-gray-200 bg-white px-6 py-4 shadow-sm">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          {!isEditMode && (
            <button
              type="submit"
              disabled={isPending}
              onClick={() => setSubmitMode("BROUILLON")}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 transition-colors"
            >
              {isPending && submitMode === "BROUILLON"
                ? "Enregistrement..."
                : "Enregistrer comme brouillon"}
            </button>
          )}
          <button
            type="submit"
            disabled={isPending}
            onClick={() =>
              setSubmitMode(isEditMode ? "BROUILLON" : "EN_VALIDATION")
            }
            className="rounded-lg px-5 py-2 text-sm font-medium text-white disabled:opacity-60 transition-colors"
            style={{ background: "linear-gradient(135deg, #5A9C3A, #4A7C2F)" }}
          >
            {isPending
              ? isEditMode
                ? "Enregistrement..."
                : "Soumission..."
              : isEditMode
                ? "Enregistrer"
                : "Soumettre à validation"}
          </button>
        </div>
      </form>
    </div>
  );
}
