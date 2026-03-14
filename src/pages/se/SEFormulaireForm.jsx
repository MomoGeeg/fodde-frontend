import RoleGate from "@/components/shared/RoleGate";
import useAuthStore from "@/stores/auth.store";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Calendar,
  CheckSquare,
  ChevronDown,
  Copy,
  Eye,
  FileText,
  GripVertical,
  Hash,
  List,
  MapPin,
  Paperclip,
  Plus,
  Save,
  Send,
  ToggleLeft,
  Trash2,
  Type,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  createFormulaire,
  createSEHelpers,
  publierFormulaire,
  TYPES_CHAMP,
  useFormulaires,
  useMembres,
  useProjets,
} from "./se-data";

// ── Icônes par type de champ ────────────────────────────────
const TYPE_ICONS = {
  TEXTE: Type,
  NOMBRE: Hash,
  DATE: Calendar,
  SELECT: ChevronDown,
  CHECKBOX: CheckSquare,
  RADIO: List,
  FICHIER: Paperclip,
  GPS: MapPin,
  TOGGLE: ToggleLeft,
};

// ── Champ vide par défaut ──────────────────────────────────
const makeEmptyChamp = (order) => ({
  id: `champ_${Date.now()}_${order}`,
  libelle: "",
  type: "TEXTE",
  obligatoire: false,
  options: [],
  placeholder: "",
  ordre: order,
});

// ════════════════════════════════════════════════════════════
// PAGE 6 — Créateur / Éditeur de formulaire de collecte
// ════════════════════════════════════════════════════════════
function SEFormulaireFormInner() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const isEdit = Boolean(id);

  // Données Supabase
  const { data: projets = [] } = useProjets();
  const { data: membres = [] } = useMembres();
  const { data: formulairesData = [] } = useFormulaires();

  const { getFormulaire, getProjet } = createSEHelpers(
    projets,
    membres,
    [],
    [],
    formulairesData,
    [],
  );

  const existing = isEdit ? getFormulaire(id) : null;

  // ── State général ─────────────────────────────────────────
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [projetId, setProjetId] = useState("");
  const [collecteursIds, setCollecteursIds] = useState([]);
  const [champs, setChamps] = useState([makeEmptyChamp(0)]);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [errors, setErrors] = useState({});

  // Charger les données existantes
  useEffect(() => {
    if (existing) {
      setTitre(existing.titre);
      setDescription(existing.description || "");
      setProjetId(existing.projetId);
      setCollecteursIds(existing.collecteursIds || []);
      setChamps(
        existing.champs?.length
          ? existing.champs.map((c, i) => ({ ...c, ordre: i }))
          : [makeEmptyChamp(0)],
      );
    }
  }, []);

  const isCloture = existing?.statut === "FERME";
  const isPublie = existing?.statut === "PUBLIE";
  const projet = projetId ? getProjet(projetId) : null;

  // ── Collecteurs possibles (TT + CP) ─────────────────────
  const collecteursPossibles = useMemo(() => {
    return membres.filter(
      (m) =>
        m.roles?.includes("ROLE_TECHNICIEN_TERRAIN") ||
        m.roles?.includes("ROLE_CHARGE_PROGRAMME"),
    );
  }, [membres]);

  // ── Validation ───────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!titre.trim()) errs.titre = "Titre requis";
    if (!projetId) errs.projetId = "Projet requis";
    if (champs.length === 0) errs.champs = "Ajoutez au moins un champ";
    champs.forEach((c, i) => {
      if (!c.libelle.trim()) errs[`champ_${i}_libelle`] = "Libellé requis";
      if (
        ["SELECT", "RADIO", "CHECKBOX"].includes(c.type) &&
        (!c.options || c.options.length < 2)
      ) {
        errs[`champ_${i}_options`] = "Min. 2 options requises";
      }
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Actions sur les champs ───────────────────────────────
  const addChamp = () => {
    setChamps((prev) => [...prev, makeEmptyChamp(prev.length)]);
  };

  const removeChamp = (index) => {
    if (champs.length <= 1) return;
    setChamps((prev) => prev.filter((_, i) => i !== index));
  };

  const duplicateChamp = (index) => {
    const original = champs[index];
    const clone = {
      ...original,
      id: `champ_${Date.now()}_dup`,
      libelle: `${original.libelle} (copie)`,
      ordre: champs.length,
    };
    setChamps((prev) => [
      ...prev.slice(0, index + 1),
      clone,
      ...prev.slice(index + 1),
    ]);
  };

  const moveChamp = (index, direction) => {
    const newArr = [...champs];
    const target = index + direction;
    if (target < 0 || target >= newArr.length) return;
    [newArr[index], newArr[target]] = [newArr[target], newArr[index]];
    setChamps(newArr);
  };

  const updateChamp = (index, field, value) => {
    setChamps((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)),
    );
  };

  const updateOption = (champIndex, optIndex, value) => {
    setChamps((prev) =>
      prev.map((c, i) =>
        i === champIndex
          ? {
              ...c,
              options: c.options.map((o, j) => (j === optIndex ? value : o)),
            }
          : c,
      ),
    );
  };

  const addOption = (champIndex) => {
    setChamps((prev) =>
      prev.map((c, i) =>
        i === champIndex ? { ...c, options: [...(c.options || []), ""] } : c,
      ),
    );
  };

  const removeOption = (champIndex, optIndex) => {
    setChamps((prev) =>
      prev.map((c, i) =>
        i === champIndex
          ? { ...c, options: c.options.filter((_, j) => j !== optIndex) }
          : c,
      ),
    );
  };

  // ── Collecteurs toggle ───────────────────────────────────
  const toggleCollecteur = (userId) => {
    setCollecteursIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  // ── Sauvegarde ───────────────────────────────────────────
  const handleSave = async (publish = false) => {
    if (!validate()) {
      toast.error("Corrigez les erreurs avant de sauvegarder");
      return;
    }
    setSaving(true);
    try {
      const payload = { projetId, titre, description: description || null };
      const created = await createFormulaire(payload);
      if (publish) {
        await publierFormulaire(created.id);
      }
      queryClient.invalidateQueries({ queryKey: ["se-formulaires"] });
      toast.success(
        publish
          ? "Formulaire publié avec succès"
          : "Brouillon enregistré avec succès",
      );
      navigate("/se/formulaires");
    } catch (err) {
      const msg =
        err?.response?.data?.erreur ??
        err?.response?.data?.message ??
        "Erreur lors de la sauvegarde";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Retour */}
      <button
        onClick={() => navigate("/se/formulaires")}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft size={16} /> Retour aux formulaires
      </button>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-gray-900">
          {isEdit
            ? isCloture
              ? "Formulaire (lecture seule)"
              : "Modifier le formulaire"
            : "Nouveau formulaire"}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreview(!preview)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
              preview
                ? "border-blue-300 bg-blue-50 text-blue-700"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Eye size={13} />
            {preview ? "Quitter l'aperçu" : "Aperçu"}
          </button>
        </div>
      </div>

      {isCloture && (
        <div className="rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
          <FileText size={16} />
          Ce formulaire est fermé et ne peut plus être modifié.
        </div>
      )}

      {preview ? (
        <PreviewMode
          titre={titre}
          description={description}
          champs={champs}
          projet={projet}
        />
      ) : (
        <>
          {/* Section 1 — Informations générales */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2">
              Informations générales
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Titre du formulaire *
                </label>
                <input
                  type="text"
                  value={titre}
                  onChange={(e) => setTitre(e.target.value)}
                  disabled={isCloture}
                  className={`w-full rounded-xl border px-3 py-2 text-sm focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-100 ${
                    errors.titre ? "border-red-400" : "border-gray-200"
                  }`}
                  placeholder="Ex: Collecte mensuelle WASH"
                />
                {errors.titre && (
                  <p className="mt-1 text-[10px] text-red-500">
                    {errors.titre}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Projet associé *
                </label>
                <select
                  value={projetId}
                  onChange={(e) => setProjetId(e.target.value)}
                  disabled={isCloture || isPublie}
                  className={`w-full rounded-xl border px-3 py-2 text-sm focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-100 ${
                    errors.projetId ? "border-red-400" : "border-gray-200"
                  }`}
                >
                  <option value="">Sélectionner un projet</option>
                  {projets
                    .filter((p) => p.statut !== "CLOTURE")
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} — {p.titre}
                      </option>
                    ))}
                </select>
                {errors.projetId && (
                  <p className="mt-1 text-[10px] text-red-500">
                    {errors.projetId}
                  </p>
                )}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isCloture}
                rows={2}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-100"
                placeholder="Description du formulaire…"
              />
            </div>
          </div>

          {/* Section 2 — Constructeur de champs */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h3 className="text-sm font-semibold text-gray-900">
                Champs du formulaire ({champs.length})
              </h3>
              {!isCloture && (
                <button
                  onClick={addChamp}
                  className="flex items-center gap-1 rounded-lg bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 hover:bg-green-100 transition-colors"
                >
                  <Plus size={12} /> Ajouter un champ
                </button>
              )}
            </div>
            {errors.champs && (
              <p className="text-[10px] text-red-500">{errors.champs}</p>
            )}

            <div className="space-y-3">
              {champs.map((champ, index) => {
                const TypeIcon = TYPE_ICONS[champ.type] || Type;
                const needsOptions = ["SELECT", "RADIO", "CHECKBOX"].includes(
                  champ.type,
                );

                return (
                  <div
                    key={champ.id}
                    className="rounded-xl border border-gray-200 bg-gray-50/50 overflow-hidden"
                  >
                    {/* En-tête du champ */}
                    <div className="flex items-center gap-2 bg-white px-4 py-2.5 border-b border-gray-100">
                      <GripVertical
                        size={14}
                        className="text-gray-300 cursor-grab"
                      />
                      <div className="flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5">
                        <TypeIcon size={10} className="text-gray-500" />
                        <span className="text-[9px] font-bold text-gray-500">
                          #{index + 1}
                        </span>
                      </div>
                      <span className="flex-1 text-xs font-medium text-gray-700 truncate">
                        {champ.libelle || "Nouveau champ"}
                      </span>
                      {!isCloture && (
                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={() => moveChamp(index, -1)}
                            disabled={index === 0}
                            className="rounded p-1 text-gray-400 hover:bg-gray-100 disabled:opacity-30"
                            title="Monter"
                          >
                            <ArrowUp size={12} />
                          </button>
                          <button
                            onClick={() => moveChamp(index, 1)}
                            disabled={index === champs.length - 1}
                            className="rounded p-1 text-gray-400 hover:bg-gray-100 disabled:opacity-30"
                            title="Descendre"
                          >
                            <ArrowDown size={12} />
                          </button>
                          <button
                            onClick={() => duplicateChamp(index)}
                            className="rounded p-1 text-gray-400 hover:bg-gray-100"
                            title="Dupliquer"
                          >
                            <Copy size={12} />
                          </button>
                          <button
                            onClick={() => removeChamp(index)}
                            disabled={champs.length <= 1}
                            className="rounded p-1 text-red-400 hover:bg-red-50 disabled:opacity-30"
                            title="Supprimer"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Corps du champ */}
                    <div className="p-4 space-y-3">
                      <div className="grid gap-3 md:grid-cols-3">
                        {/* Libellé */}
                        <div>
                          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                            Libellé *
                          </label>
                          <input
                            type="text"
                            value={champ.libelle}
                            onChange={(e) =>
                              updateChamp(index, "libelle", e.target.value)
                            }
                            disabled={isCloture}
                            className={`w-full rounded-lg border px-3 py-1.5 text-xs focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-100 ${
                              errors[`champ_${index}_libelle`]
                                ? "border-red-400"
                                : "border-gray-200"
                            }`}
                            placeholder="Nom du champ"
                          />
                          {errors[`champ_${index}_libelle`] && (
                            <p className="mt-0.5 text-[9px] text-red-500">
                              {errors[`champ_${index}_libelle`]}
                            </p>
                          )}
                        </div>

                        {/* Type */}
                        <div>
                          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                            Type de champ
                          </label>
                          <select
                            value={champ.type}
                            onChange={(e) =>
                              updateChamp(index, "type", e.target.value)
                            }
                            disabled={isCloture}
                            className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-100"
                          >
                            {TYPES_CHAMP.map((t) => (
                              <option key={t.value} value={t.value}>
                                {t.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Obligatoire */}
                        <div className="flex items-end gap-2 pb-0.5">
                          <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={champ.obligatoire}
                              onChange={(e) =>
                                updateChamp(
                                  index,
                                  "obligatoire",
                                  e.target.checked,
                                )
                              }
                              disabled={isCloture}
                              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                            />
                            Obligatoire
                          </label>
                        </div>
                      </div>

                      {/* Placeholder */}
                      <div>
                        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                          Placeholder (optionnel)
                        </label>
                        <input
                          type="text"
                          value={champ.placeholder || ""}
                          onChange={(e) =>
                            updateChamp(index, "placeholder", e.target.value)
                          }
                          disabled={isCloture}
                          className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-100"
                          placeholder="Texte d'aide…"
                        />
                      </div>

                      {/* Options (pour SELECT, RADIO, CHECKBOX) */}
                      {needsOptions && (
                        <div>
                          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                            Options (min. 2)
                          </label>
                          {errors[`champ_${index}_options`] && (
                            <p className="mb-1 text-[9px] text-red-500">
                              {errors[`champ_${index}_options`]}
                            </p>
                          )}
                          <div className="space-y-1.5">
                            {(champ.options || []).map((opt, oi) => (
                              <div key={oi} className="flex items-center gap-2">
                                <span className="text-[9px] text-gray-400 w-4 text-right">
                                  {oi + 1}.
                                </span>
                                <input
                                  type="text"
                                  value={opt}
                                  onChange={(e) =>
                                    updateOption(index, oi, e.target.value)
                                  }
                                  disabled={isCloture}
                                  className="flex-1 rounded-lg border border-gray-200 px-2 py-1 text-xs focus:border-green-400 focus:outline-none"
                                  placeholder={`Option ${oi + 1}`}
                                />
                                {!isCloture && (
                                  <button
                                    onClick={() => removeOption(index, oi)}
                                    className="text-red-400 hover:text-red-600"
                                  >
                                    <Trash2 size={10} />
                                  </button>
                                )}
                              </div>
                            ))}
                            {!isCloture && (
                              <button
                                onClick={() => addOption(index)}
                                className="text-[10px] font-medium text-green-600 hover:text-green-800"
                              >
                                + Ajouter une option
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {!isCloture && (
              <button
                onClick={addChamp}
                className="w-full rounded-xl border-2 border-dashed border-gray-300 py-3 text-sm font-medium text-gray-400 hover:border-green-400 hover:text-green-600 transition-colors"
              >
                <Plus size={14} className="inline mr-1 -mt-0.5" />
                Ajouter un champ
              </button>
            )}
          </div>

          {/* Section 3 — Collecteurs assignés */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2">
              Collecteurs assignés
            </h3>
            <p className="text-[10px] text-gray-400">
              Sélectionnez les techniciens terrain ou chargés de programme qui
              pourront remplir ce formulaire.
            </p>
            <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
              {collecteursPossibles.map((m) => {
                const selected = collecteursIds.includes(m.id);
                return (
                  <label
                    key={m.id}
                    className={`flex items-center gap-3 rounded-xl border p-3 text-xs cursor-pointer transition-colors ${
                      selected
                        ? "border-green-300 bg-green-50"
                        : "border-gray-200 hover:bg-gray-50"
                    } ${isCloture ? "opacity-60 pointer-events-none" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleCollecteur(m.id)}
                      disabled={isCloture}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <div>
                      <p className="font-medium text-gray-900">
                        {m.prenom} {m.nom}
                      </p>
                      <p className="text-[9px] text-gray-400">
                        {m.role === "ROLE_TECHNICIEN_TERRAIN"
                          ? "Technicien terrain"
                          : "Chargé de programme"}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          {!isCloture && (
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => handleSave(false)}
                disabled={saving}
                className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
              >
                <Save size={15} />
                {saving ? "Enregistrement…" : "Enregistrer brouillon"}
              </button>
              <button
                onClick={() => handleSave(true)}
                disabled={saving}
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-sm disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg, #5A9C3A, #4A7C2F)",
                }}
              >
                <Send size={15} />
                {saving ? "Publication…" : "Publier le formulaire"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Mode Aperçu ─────────────────────────────────────────────
function PreviewMode({ titre, description, champs, projet }) {
  return (
    <div className="rounded-xl border-2 border-blue-200 bg-blue-50/30 p-6 space-y-5">
      <div className="text-center space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-500">
          Aperçu du formulaire
        </p>
        <h3 className="text-lg font-bold text-gray-900">
          {titre || "Sans titre"}
        </h3>
        {description && <p className="text-xs text-gray-500">{description}</p>}
        {projet && (
          <p className="text-[10px] text-gray-400">
            Projet : {projet.code} — {projet.titre}
          </p>
        )}
      </div>

      <div className="rounded-xl bg-white border border-gray-200 p-5 shadow-sm space-y-4">
        {champs.map((champ, i) => {
          const TypeIcon = TYPE_ICONS[champ.type] || Type;
          return (
            <div key={champ.id} className="space-y-1">
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                <TypeIcon size={13} className="text-gray-400" />
                {champ.libelle || `Champ ${i + 1}`}
                {champ.obligatoire && <span className="text-red-500">*</span>}
              </label>
              {/* Rendu différent selon le type */}
              {champ.type === "TEXTE" && (
                <input
                  type="text"
                  disabled
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-gray-50"
                  placeholder={champ.placeholder || "Saisir du texte…"}
                />
              )}
              {champ.type === "NOMBRE" && (
                <input
                  type="number"
                  disabled
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-gray-50"
                  placeholder={champ.placeholder || "0"}
                />
              )}
              {champ.type === "DATE" && (
                <input
                  type="date"
                  disabled
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-gray-50"
                />
              )}
              {champ.type === "SELECT" && (
                <select
                  disabled
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-gray-50"
                >
                  <option>Sélectionner…</option>
                  {champ.options?.map((o, j) => (
                    <option key={j}>{o}</option>
                  ))}
                </select>
              )}
              {champ.type === "RADIO" && (
                <div className="flex flex-wrap gap-3 pt-1">
                  {(champ.options || ["Option 1"]).map((o, j) => (
                    <label
                      key={j}
                      className="flex items-center gap-1.5 text-xs text-gray-600"
                    >
                      <input
                        type="radio"
                        disabled
                        name={`preview_${champ.id}`}
                        className="text-green-600"
                      />
                      {o || `Option ${j + 1}`}
                    </label>
                  ))}
                </div>
              )}
              {champ.type === "CHECKBOX" && (
                <div className="flex flex-wrap gap-3 pt-1">
                  {(champ.options || ["Option 1"]).map((o, j) => (
                    <label
                      key={j}
                      className="flex items-center gap-1.5 text-xs text-gray-600"
                    >
                      <input
                        type="checkbox"
                        disabled
                        className="rounded text-green-600"
                      />
                      {o || `Option ${j + 1}`}
                    </label>
                  ))}
                </div>
              )}
              {champ.type === "FICHIER" && (
                <div className="flex items-center gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-3 text-xs text-gray-400">
                  <Paperclip size={14} />
                  Cliquer ou glisser un fichier
                </div>
              )}
              {champ.type === "GPS" && (
                <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs text-gray-400">
                  <MapPin size={14} />
                  Capturer la position GPS
                </div>
              )}
              {champ.type === "TOGGLE" && (
                <div className="flex items-center gap-2 pt-1">
                  <div className="h-5 w-9 rounded-full bg-gray-300 relative">
                    <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow" />
                  </div>
                  <span className="text-xs text-gray-400">Non</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Wrapper avec RoleGate
export default function SEFormulaireForm() {
  return (
    <RoleGate allowedRoles={["ROLE_RESPONSABLE_SE", "ROLE_ADMIN"]}>
      <SEFormulaireFormInner />
    </RoleGate>
  );
}
