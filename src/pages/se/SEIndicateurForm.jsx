import RoleGate from "@/components/shared/RoleGate";
import { ArrowLeft, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  createSEHelpers,
  FREQUENCES_COLLECTE,
  UNITES_MESURE,
  useIndicateurs,
  useMembres,
  useProjets,
} from "./se-data";

// ════════════════════════════════════════════════════════════
// PAGE — Création / Édition d'un indicateur
// ════════════════════════════════════════════════════════════
export default function SEIndicateurForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  // Données Supabase
  const { data: projets = [] } = useProjets();
  const { data: membres = [] } = useMembres();
  const { data: indicateursData = [] } = useIndicateurs();

  const { getIndicateur, getNextIndicateurCode } = createSEHelpers(
    projets,
    membres,
    indicateursData,
    [],
    [],
    [],
  );

  const [form, setForm] = useState({
    code: "",
    libelle: "",
    unite: "NOMBRE",
    valeurReference: "",
    valeurCible: "",
    frequence: "MENSUELLE",
    sourceVerification: "",
    projetId: "",
    responsableCollecteId: "",
    resultatAttendu: "",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit) {
      const ind = getIndicateur(id);
      if (ind) {
        setForm({
          code: ind.code,
          libelle: ind.libelle,
          unite: ind.unite,
          valeurReference: String(ind.valeurReference),
          valeurCible: String(ind.valeurCible),
          frequence: ind.frequence,
          sourceVerification: ind.sourceVerification,
          projetId: ind.projetId,
          responsableCollecteId: ind.responsableCollecteId,
          resultatAttendu: ind.resultatAttendu || "",
        });
      }
    } else {
      setForm((f) => ({ ...f, code: getNextIndicateurCode() }));
    }
  }, [id, isEdit, indicateursData]);

  const set = (field, val) => {
    setForm((f) => ({ ...f, [field]: val }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: null }));
  };

  const validate = () => {
    const errs = {};
    if (!form.libelle.trim()) errs.libelle = "Libellé obligatoire";
    if (!form.valeurCible || Number(form.valeurCible) <= 0)
      errs.valeurCible = "Valeur cible obligatoire et > 0";
    if (!form.projetId) errs.projetId = "Projet obligatoire";
    if (!form.responsableCollecteId)
      errs.responsableCollecteId = "Responsable de collecte obligatoire";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success(
        isEdit
          ? "Indicateur modifié avec succès"
          : "Indicateur créé avec succès",
      );
      navigate("/se/indicateurs");
    }, 600);
  };

  // Collecteurs possibles (techniciens terrain + chargés programme)
  const collecteurs = membres.filter((m) =>
    ["ROLE_TECHNICIEN_TERRAIN", "ROLE_CHARGE_PROGRAMME"].includes(m.role),
  );

  return (
    <RoleGate allowedRoles={["ROLE_RESPONSABLE_SE", "ROLE_ADMIN"]}>
      <div className="space-y-5 max-w-3xl">
        {/* Retour */}
        <button
          onClick={() => navigate("/se/indicateurs")}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft size={16} /> Retour aux indicateurs
        </button>

        {/* Titre */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? "Modifier l'indicateur" : "Nouvel indicateur"}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {isEdit
              ? `Modification de ${form.code}`
              : "Remplissez tous les champs obligatoires *"}
          </p>
        </div>

        {/* Formulaire */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-5">
          {/* Code (auto-généré) */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Code indicateur
            </label>
            <input
              type="text"
              value={form.code}
              disabled
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
            />
            <p className="mt-1 text-[11px] text-gray-400">Auto-généré</p>
          </div>

          {/* Libellé */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Libellé *
            </label>
            <input
              type="text"
              value={form.libelle}
              onChange={(e) => set("libelle", e.target.value)}
              placeholder="Ex. : Nombre de bénéficiaires formés"
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none ${
                errors.libelle
                  ? "border-red-300 focus:border-red-500"
                  : "border-gray-200 focus:border-green-500"
              }`}
            />
            {errors.libelle && (
              <p className="mt-1 text-xs text-red-500">{errors.libelle}</p>
            )}
          </div>

          {/* Unité + Fréquence (row) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Unité de mesure *
              </label>
              <select
                value={form.unite}
                onChange={(e) => set("unite", e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
              >
                {UNITES_MESURE.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Fréquence de collecte *
              </label>
              <select
                value={form.frequence}
                onChange={(e) => set("frequence", e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
              >
                {FREQUENCES_COLLECTE.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Baseline + Cible */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Valeur de référence (baseline)
              </label>
              <input
                type="number"
                value={form.valeurReference}
                onChange={(e) => set("valeurReference", e.target.value)}
                placeholder="0"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Valeur cible *
              </label>
              <input
                type="number"
                value={form.valeurCible}
                onChange={(e) => set("valeurCible", e.target.value)}
                placeholder="Ex. : 500"
                min="1"
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none ${
                  errors.valeurCible
                    ? "border-red-300 focus:border-red-500"
                    : "border-gray-200 focus:border-green-500"
                }`}
              />
              {errors.valeurCible && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.valeurCible}
                </p>
              )}
            </div>
          </div>

          {/* Projet associé */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Projet associé *
            </label>
            <select
              value={form.projetId}
              onChange={(e) => set("projetId", e.target.value)}
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none ${
                errors.projetId
                  ? "border-red-300 focus:border-red-500"
                  : "border-gray-200 focus:border-green-500"
              }`}
            >
              <option value="">— Sélectionner un projet —</option>
              {projets
                .filter((p) => p.statut !== "CLOTURE")
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} — {p.titre}
                  </option>
                ))}
            </select>
            {errors.projetId && (
              <p className="mt-1 text-xs text-red-500">{errors.projetId}</p>
            )}
          </div>

          {/* Responsable collecte */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Responsable de collecte *
            </label>
            <select
              value={form.responsableCollecteId}
              onChange={(e) => set("responsableCollecteId", e.target.value)}
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none ${
                errors.responsableCollecteId
                  ? "border-red-300 focus:border-red-500"
                  : "border-gray-200 focus:border-green-500"
              }`}
            >
              <option value="">— Sélectionner —</option>
              {collecteurs.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.prenom} {m.nom} ({m.role.replace("ROLE_", "")})
                </option>
              ))}
            </select>
            {errors.responsableCollecteId && (
              <p className="mt-1 text-xs text-red-500">
                {errors.responsableCollecteId}
              </p>
            )}
          </div>

          {/* Source de vérification */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Source de vérification
            </label>
            <input
              type="text"
              value={form.sourceVerification}
              onChange={(e) => set("sourceVerification", e.target.value)}
              placeholder="Ex. : Registres de formation, photos, rapports..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
            />
          </div>

          {/* Résultat attendu lié */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Résultat attendu lié
            </label>
            <input
              type="text"
              value={form.resultatAttendu}
              onChange={(e) => set("resultatAttendu", e.target.value)}
              placeholder="Ex. : R1 — Meilleure gouvernance communautaire"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={() => navigate("/se/indicateurs")}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #5A9C3A, #4A7C2F)" }}
          >
            {saving ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Save size={15} />
            )}
            {isEdit ? "Enregistrer" : "Créer l'indicateur"}
          </button>
        </div>
      </div>
    </RoleGate>
  );
}
