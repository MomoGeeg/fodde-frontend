import RoleGate from "@/components/shared/RoleGate";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  createIndicateur,
  mettreAJourValeurIndicateur,
} from "@/services/seService";
import {
  FREQUENCES_COLLECTE,
  UNITES_MESURE,
  useIndicateurById,
  useIndicateurs,
  useMembres,
  useProjets,
  getNextIndicateurCode,
} from "./se-data";

const TYPES_INDICATEUR = [
  { value: "QUANTITATIF", label: "Quantitatif" },
  { value: "QUALITATIF", label: "Qualitatif" },
];

const NIVEAUX_INDICATEUR = [
  { value: "IMPACT", label: "Impact" },
  { value: "EFFET", label: "Effet" },
  { value: "PRODUIT", label: "Produit" },
  { value: "ACTIVITE", label: "Activité" },
];

// ════════════════════════════════════════════════════════════
// PAGE — Création / Édition d'un indicateur
// ════════════════════════════════════════════════════════════
export default function SEIndicateurForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const { data: projets = [] } = useProjets();
  const { data: membres = [] } = useMembres();
  const { data: indicateursData = [] } = useIndicateurs();
  const { data: indicateurExistant } = useIndicateurById(id);

  const [form, setForm] = useState({
    code: "",
    libelle: "",
    type: "QUANTITATIF",
    niveau: "PRODUIT",
    unite: "NOMBRE",
    valeurBaseline: "",
    valeurCible: "",
    frequenceCollecte: "MENSUELLE",
    sourceVerification: "",
    projetId: "",
    responsableId: "",
  });
  // Champ séparé pour la mise à jour en mode édition
  const [valeurAtteinte, setValeurAtteinte] = useState("");
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Charger les données existantes (mode édition)
  useEffect(() => {
    if (isEdit && indicateurExistant) {
      setForm({
        code: indicateurExistant.code,
        libelle: indicateurExistant.libelle,
        type: indicateurExistant.type ?? "QUANTITATIF",
        niveau: indicateurExistant.niveau ?? "PRODUIT",
        unite: indicateurExistant.unite ?? "NOMBRE",
        valeurBaseline: String(indicateurExistant.valeurBaseline ?? ""),
        valeurCible: String(indicateurExistant.valeurCible ?? ""),
        frequenceCollecte: indicateurExistant.frequenceCollecte ?? "MENSUELLE",
        sourceVerification: indicateurExistant.sourceVerification ?? "",
        projetId: String(indicateurExistant.projetId ?? ""),
        responsableId: String(indicateurExistant.responsableId ?? ""),
      });
      setValeurAtteinte(String(indicateurExistant.valeurAtteinte ?? ""));
    } else if (!isEdit && indicateursData.length > 0) {
      setForm((f) => ({ ...f, code: getNextIndicateurCode(indicateursData) }));
    }
  }, [id, isEdit, indicateurExistant, indicateursData.length]);

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
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (isEdit) {
      // Mode édition : mise à jour valeur atteinte uniquement
      if (valeurAtteinte === "" || isNaN(Number(valeurAtteinte))) {
        toast.error("Valeur atteinte invalide");
        return;
      }
      setSaving(true);
      try {
        await mettreAJourValeurIndicateur(id, Number(valeurAtteinte));
        queryClient.invalidateQueries({ queryKey: ["se-indicateur", id] });
        queryClient.invalidateQueries({ queryKey: ["se-indicateurs"] });
        toast.success("Valeur atteinte mise à jour");
        navigate(`/se/indicateurs/${id}`);
      } catch (err) {
        toast.error(err?.response?.data?.erreur ?? "Erreur lors de la mise à jour");
      } finally {
        setSaving(false);
      }
      return;
    }

    // Mode création
    if (!validate()) return;
    setSaving(true);
    try {
      await createIndicateur({
        projetId: form.projetId,
        code: form.code,
        libelle: form.libelle,
        type: form.type,
        niveau: form.niveau,
        unite: form.unite,
        valeurBaseline: form.valeurBaseline ? Number(form.valeurBaseline) : null,
        valeurCible: Number(form.valeurCible),
        frequenceCollecte: form.frequenceCollecte,
        sourceVerification: form.sourceVerification || null,
        responsableId: form.responsableId || null,
      });
      queryClient.invalidateQueries({ queryKey: ["se-indicateurs"] });
      toast.success("Indicateur créé avec succès");
      navigate("/se/indicateurs");
    } catch (err) {
      toast.error(err?.response?.data?.erreur ?? "Erreur lors de la création");
    } finally {
      setSaving(false);
    }
  };

  // Responsables possibles (tous les utilisateurs actifs)
  const responsables = membres.filter((m) =>
    m.roles?.some((r) =>
      ["ROLE_SE", "ROLE_CHARGE_PROGRAMME", "ROLE_RESPONSABLE_PROGRAMMES", "ROLE_ADMIN"].includes(r)
    )
  );

  return (
    <RoleGate allowedRoles={["ROLE_RESPONSABLE_SE"]}>
      <div className="space-y-5 max-w-3xl">
        {/* Retour */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft size={16} /> Retour aux indicateurs
        </button>

        {/* Titre */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? "Mettre à jour l'indicateur" : "Nouvel indicateur"}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {isEdit
              ? `Mise à jour de la valeur atteinte — ${form.code}`
              : "Remplissez tous les champs obligatoires *"}
          </p>
        </div>

        {/* ── Mode édition : formulaire simplifié ── */}
        {isEdit ? (
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-5">
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div><span className="font-semibold">Code :</span> {form.code}</div>
              <div><span className="font-semibold">Libellé :</span> {form.libelle}</div>
              <div><span className="font-semibold">Valeur cible :</span> {form.valeurCible}</div>
              <div><span className="font-semibold">Baseline :</span> {form.valeurBaseline || "—"}</div>
            </div>
            <hr className="border-gray-100" />
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Valeur atteinte *
              </label>
              <input
                type="number"
                value={valeurAtteinte}
                onChange={(e) => setValeurAtteinte(e.target.value)}
                placeholder="Saisir la valeur réellement atteinte"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
              />
              <p className="mt-1 text-[11px] text-gray-400">
                Le taux d'atteinte sera recalculé automatiquement.
              </p>
            </div>
          </div>
        ) : (
          /* ── Mode création : formulaire complet ── */
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

            {/* Type + Niveau */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Type *
                </label>
                <select
                  value={form.type}
                  onChange={(e) => set("type", e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                >
                  {TYPES_INDICATEUR.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Niveau *
                </label>
                <select
                  value={form.niveau}
                  onChange={(e) => set("niveau", e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                >
                  {NIVEAUX_INDICATEUR.map((n) => (
                    <option key={n.value} value={n.value}>{n.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Unité + Fréquence */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Unité de mesure
                </label>
                <select
                  value={form.unite}
                  onChange={(e) => set("unite", e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                >
                  {UNITES_MESURE.map((u) => (
                    <option key={u.value} value={u.value}>{u.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Fréquence de collecte
                </label>
                <select
                  value={form.frequenceCollecte}
                  onChange={(e) => set("frequenceCollecte", e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                >
                  {FREQUENCES_COLLECTE.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
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
                  value={form.valeurBaseline}
                  onChange={(e) => set("valeurBaseline", e.target.value)}
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
                  <p className="mt-1 text-xs text-red-500">{errors.valeurCible}</p>
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
                  .filter((p) => p.statut !== "CLOTURE" && p.statut !== "ARCHIVE")
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
                Responsable de collecte
              </label>
              <select
                value={form.responsableId}
                onChange={(e) => set("responsableId", e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
              >
                <option value="">— Sélectionner (optionnel) —</option>
                {responsables.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.prenom} {m.nom}
                  </option>
                ))}
              </select>
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
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={() => navigate(-1)}
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
            {isEdit ? "Mettre à jour" : "Créer l'indicateur"}
          </button>
        </div>
      </div>
    </RoleGate>
  );
}
