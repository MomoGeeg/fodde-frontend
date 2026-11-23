import api from "@/api/axios";
import { useBailleurs } from "@/api/bailleurs";
import { projetsApi } from "@/api/projets.api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

const DEVISES = ["XOF", "EUR", "USD"];

const ETAPES = ["Identification", "Budget et résultats"];
const CHAMPS_ETAPE_1 = [
  "titre",
  "description",
  "objectifGeneral",
  "zoneGeographique",
  "bailleur",
  "chefProjetId",
];

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

const CHAMP =
  "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-green-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400";

function FieldError({ msg }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-red-500">{msg}</p>;
}

function FormLabel({ children, required }) {
  return (
    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
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
      className={`${CHAMP} ${className}`}
    />
  );
}

function Etapes({ etape }) {
  return (
    <ol className="flex items-center gap-3">
      {ETAPES.map((libelle, i) => {
        const n = i + 1;
        const faite = n < etape;
        const active = n === etape;
        return (
          <li key={libelle} className="flex items-center gap-3">
            {i > 0 && <span className="h-px w-10 bg-gray-300" />}
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                faite || active
                  ? "bg-primary text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {faite ? <Check size={14} /> : n}
            </span>
            <span
              className={`text-sm font-medium ${active ? "text-gray-900" : "text-gray-500"}`}
            >
              {libelle}
            </span>
          </li>
        );
      })}
    </ol>
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
  const [etape, setEtape] = useState(1);

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
    if (!form.chefProjetId)
      errs.chefProjetId = "Le chargé de projet est obligatoire";
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
    if (!isEditMode && resultats.filter((r) => r.trim()).length === 0) {
      errs.resultats = "Au moins un résultat attendu est obligatoire";
    }
    return errs;
  };

  const erreursEtape1 = (errs) =>
    Object.fromEntries(
      Object.entries(errs).filter(([k]) => CHAMPS_ETAPE_1.includes(k)),
    );

  const suivant = () => {
    const errs = erreursEtape1(validate());
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error("Veuillez corriger les erreurs du formulaire");
      return;
    }
    setEtape(2);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (etape === 1) {
      suivant();
      return;
    }
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      if (Object.keys(erreursEtape1(errs)).length > 0) setEtape(1);
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
    <div className="space-y-4">
      {/* En-tête */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditMode ? "Modifier le projet" : "Nouveau projet"}
          </h1>
        </div>
        <Etapes etape={etape} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-gray-200 bg-white shadow-sm"
      >
        {etape === 1 && (
          <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-3">
            {isEditMode && (
              <div>
                <FormLabel>Code projet</FormLabel>
                <FormInput value={form.code} disabled />
              </div>
            )}

            <div className={isEditMode ? "sm:col-span-2" : "sm:col-span-3"}>
              <FormLabel required>Titre du projet</FormLabel>
              <FormInput
                value={form.titre}
                onChange={set("titre")}
                placeholder="Titre complet du projet"
              />
              <FieldError msg={errors.titre} />
            </div>

            <div className="sm:col-span-3">
              <FormLabel required>Description</FormLabel>
              <textarea
                value={form.description}
                onChange={set("description")}
                rows={3}
                placeholder="Description détaillée du projet"
                className={`${CHAMP} resize-none`}
              />
              <FieldError msg={errors.description} />
            </div>

            <div className="sm:col-span-3">
              <FormLabel required>Objectif général</FormLabel>
              <textarea
                value={form.objectifGeneral}
                onChange={set("objectifGeneral")}
                rows={2}
                placeholder="Objectif général du projet"
                className={`${CHAMP} resize-none`}
              />
              <FieldError msg={errors.objectifGeneral} />
            </div>

            <div>
              <FormLabel required>Zone géographique</FormLabel>
              <FormInput
                value={form.zoneGeographique}
                onChange={set("zoneGeographique")}
                placeholder="Ex : Kolda, Sédhiou, Ziguinchor"
              />
              <FieldError msg={errors.zoneGeographique} />
            </div>

            <div>
              <FormLabel required>Bailleur de fonds</FormLabel>
              <input
                list="liste-bailleurs"
                value={form.bailleur}
                onChange={set("bailleur")}
                placeholder="Ex : Union Européenne, USAID, AFD"
                className={CHAMP}
              />
              <datalist id="liste-bailleurs">
                {bailleurs.map((b) => (
                  <option key={b.id} value={b.nom} />
                ))}
              </datalist>
              <FieldError msg={errors.bailleur} />
            </div>

            <div>
              <FormLabel required>Chargé de projet</FormLabel>
              <select
                value={form.chefProjetId}
                onChange={set("chefProjetId")}
                className={CHAMP}
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
        )}

        {etape === 2 && (
          <div className="space-y-5 p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
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

              <div>
                <FormLabel required>Devise</FormLabel>
                <select
                  value={form.devise}
                  onChange={set("devise")}
                  className={CHAMP}
                >
                  {DEVISES.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {!isEditMode && (
              <div className="space-y-2">
                <FormLabel required>Résultats attendus</FormLabel>
                <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                  {resultats.map((r, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {i + 1}
                      </span>
                      <input
                        type="text"
                        value={r}
                        onChange={(e) => updateResultat(i, e.target.value)}
                        placeholder={`Résultat attendu ${i + 1}`}
                        className={`${CHAMP} flex-1`}
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
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
          {etape === 1 ? (
            <>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="rounded-lg px-5 py-2 text-sm font-medium text-white transition-colors"
                style={{
                  background: "linear-gradient(135deg, #5A9C3A, #4A7C2F)",
                }}
              >
                Suivant
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setEtape(1)}
                className="mr-auto rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Précédent
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
                style={{
                  background: "linear-gradient(135deg, #5A9C3A, #4A7C2F)",
                }}
              >
                {isPending
                  ? isEditMode
                    ? "Enregistrement..."
                    : "Soumission..."
                  : isEditMode
                    ? "Enregistrer"
                    : "Soumettre à validation"}
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}
