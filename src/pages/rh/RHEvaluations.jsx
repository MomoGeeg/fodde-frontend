import RoleGate from "@/components/shared/RoleGate";
import useAuthStore from "@/stores/auth.store";
import { Plus, Search, Star, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useEmployes, useEvaluations } from "./rh-data";

// ── Constantes ─────────────────────────────────────────────
const STATUT_COLORS = {
  EN_COURS: "bg-blue-100 text-blue-700",
  COMPLETEE: "bg-green-100 text-green-700",
  SIGNEE: "bg-purple-100 text-purple-700",
  EN_RETARD: "bg-red-100 text-red-700",
};

const CRITERES_LABELS = {
  ponctualite: "Ponctualité et assiduité",
  qualite: "Qualité du travail rendu",
  initiative: "Initiative et autonomie",
  equipe: "Travail en équipe",
  delais: "Respect des délais",
  communication: "Communication",
};

const FILTRES_STATUT = ["TOUS", "EN_COURS", "COMPLETEE", "SIGNEE", "EN_RETARD"];
const ANNEES = [2026, 2025, 2024, 2023];

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("fr-FR") : "—");

function Badge({ statut }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUT_COLORS[statut] ?? "bg-gray-100 text-gray-600"}`}
    >
      {statut?.replace(/_/g, " ")}
    </span>
  );
}

function NoteDisplay({ note }) {
  if (note == null) return <span className="text-xs text-gray-400">—</span>;
  const color =
    note >= 4
      ? "text-green-700"
      : note >= 3
        ? "text-blue-700"
        : note >= 2
          ? "text-orange-600"
          : "text-red-600";
  return (
    <span className={`text-lg font-bold ${color}`}>
      {note.toFixed(1)}
      <span className="text-xs text-gray-400">/5</span>
    </span>
  );
}

// ── Étoiles interactives ───────────────────────────────────
function StarRating({ value, onChange, readOnly = false }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          onClick={() => !readOnly && onChange(n)}
          className={`transition-colors ${readOnly ? "cursor-default" : "cursor-pointer hover:text-yellow-400"}`}
        >
          <Star
            size={16}
            className={
              n <= value ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }
          />
        </button>
      ))}
      <span className="ml-1 text-xs text-gray-500">{value}/5</span>
    </div>
  );
}

// ── Modale formulaire évaluation ───────────────────────────
function EvaluationFormModal({ evaluation, onClose }) {
  const { data: allEmployes = [] } = useEmployes();
  const isNew = !evaluation;
  const [form, setForm] = useState({
    employeId: evaluation?.employeId || "",
    annee: evaluation?.annee || new Date().getFullYear(),
    criteres: evaluation?.criteres || {
      ponctualite: 3,
      qualite: 3,
      initiative: 3,
      equipe: 3,
      delais: 3,
      communication: 3,
    },
    objectifsAtteints: evaluation?.objectifsAtteints || "",
    pointsForts: evaluation?.pointsForts || "",
    axesAmelioration: evaluation?.axesAmelioration || "",
    objectifsFuturs: evaluation?.objectifsFuturs || "",
  });

  const isSignee = evaluation?.statut === "SIGNEE";
  const readOnly = isSignee;

  const noteGlobale =
    Object.values(form.criteres).reduce((s, v) => s + v, 0) /
    Object.values(form.criteres).length;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.employeId && isNew) {
      toast.error("Sélectionnez un employé");
      return;
    }
    toast.success(isNew ? "Évaluation créée" : "Évaluation mise à jour");
    onClose();
  };

  const handleSigner = () => {
    toast.success("Évaluation soumise à l'employé pour signature");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 overflow-y-auto py-8">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">
            {isNew
              ? "Nouvelle évaluation"
              : `Évaluation ${evaluation.annee} — ${evaluation.employeNom}`}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>

        {isSignee && (
          <div className="mb-4 rounded-lg bg-purple-50 border border-purple-200 px-4 py-2 text-xs text-purple-700">
            Cette évaluation est signée et verrouillée en lecture seule.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Employé + Année */}
          {isNew && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase">
                  Employé
                </label>
                <select
                  value={form.employeId}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, employeId: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                >
                  <option value="">— Sélectionner —</option>
                  {allEmployes
                    .filter((e) => e.statut === "ACTIF")
                    .map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.prenom} {emp.nom}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase">
                  Année
                </label>
                <select
                  value={form.annee}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, annee: parseInt(e.target.value) }))
                  }
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                >
                  {ANNEES.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Note globale */}
          <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">
              Note globale (calculée)
            </p>
            <NoteDisplay note={noteGlobale} />
          </div>

          {/* Critères */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Notation par critère
            </p>
            <div className="space-y-3">
              {Object.entries(CRITERES_LABELS).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{label}</span>
                  <StarRating
                    value={form.criteres[key] || 0}
                    readOnly={readOnly}
                    onChange={(val) =>
                      setForm((p) => ({
                        ...p,
                        criteres: { ...p.criteres, [key]: val },
                      }))
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Sections texte */}
          {[
            { key: "objectifsAtteints", label: "Objectifs atteints" },
            { key: "pointsForts", label: "Points forts" },
            { key: "axesAmelioration", label: "Axes d'amélioration" },
            { key: "objectifsFuturs", label: "Objectifs prochaine période" },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase">
                {label}
              </label>
              <textarea
                value={form[key]}
                onChange={(e) =>
                  setForm((p) => ({ ...p, [key]: e.target.value }))
                }
                disabled={readOnly}
                rows={2}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none resize-none disabled:bg-gray-50 disabled:text-gray-400"
              />
            </div>
          ))}

          {/* Actions */}
          {!readOnly && (
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Annuler
              </button>
              {!isNew && evaluation?.statut === "COMPLETEE" && (
                <button
                  type="button"
                  onClick={handleSigner}
                  className="rounded-lg border border-purple-200 bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700 hover:bg-purple-100"
                >
                  Soumettre pour signature
                </button>
              )}
              <button
                type="submit"
                className="rounded-lg px-4 py-2 text-sm font-medium text-white"
                style={{
                  background: "linear-gradient(135deg, #5A9C3A, #4A7C2F)",
                }}
              >
                {isNew ? "Créer" : "Enregistrer"}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// PAGE ÉVALUATIONS
// ══════════════════════════════════════════════════════════
export default function RHEvaluations() {
  const { user } = useAuthStore();
  const isRH = user?.roles?.some((r) => ["ROLE_RH", "ROLE_ADMIN"].includes(r));

  const { data: allEvaluations = [] } = useEvaluations();

  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState("TOUS");
  const [filterAnnee, setFilterAnnee] = useState("TOUS");
  const [modalEval, setModalEval] = useState(null); // null, "new", ou objet évaluation
  const [showModal, setShowModal] = useState(false);

  const evaluations = allEvaluations.filter((e) => {
    const q = search.toLowerCase();
    const matchSearch =
      !search ||
      e.employeNom.toLowerCase().includes(q) ||
      e.service?.toLowerCase().includes(q);
    const matchStatut = filterStatut === "TOUS" || e.statut === filterStatut;
    const matchAnnee =
      filterAnnee === "TOUS" || e.annee === parseInt(filterAnnee);
    return matchSearch && matchStatut && matchAnnee;
  });

  return (
    <RoleGate allowedRoles={["ROLE_RH", "ROLE_SE", "ROLE_ADMIN"]}>
      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Évaluations</h1>
            <p className="mt-1 text-sm text-gray-500">
              {allEvaluations.length} évaluation
              {allEvaluations.length !== 1 ? "s" : ""} au total
            </p>
          </div>
          {isRH && (
            <button
              onClick={() => {
                setModalEval(null);
                setShowModal(true);
              }}
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white transition-colors"
              style={{
                background: "linear-gradient(135deg, #5A9C3A, #4A7C2F)",
              }}
            >
              <Plus size={16} />
              Nouvelle évaluation
            </button>
          )}
        </div>

        {/* Filtres */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
          <div className="relative max-w-sm flex-1">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-2.5 text-gray-400"
            />
            <input
              type="text"
              placeholder="Rechercher par employé, service..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm text-gray-700 shadow-sm focus:border-green-500 focus:outline-none"
            />
          </div>
          <select
            value={filterAnnee}
            onChange={(e) => setFilterAnnee(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600 focus:border-green-500 focus:outline-none"
          >
            <option value="TOUS">Toutes années</option>
            {ANNEES.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <div className="flex flex-wrap gap-1.5">
            {FILTRES_STATUT.map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatut(s)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  filterStatut === s
                    ? "bg-primary text-white"
                    : "border border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                }`}
              >
                {s === "TOUS" ? "Tous" : s.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Tableau */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {evaluations.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Star className="mx-auto mb-3 text-gray-300" size={40} />
              <p className="text-sm text-gray-400">
                Aucune évaluation trouvée.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Employé
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Service
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Année
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Note
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {evaluations.map((ev) => (
                    <tr
                      key={ev.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">
                          {ev.employeNom}
                        </p>
                        <p className="text-xs text-gray-400">
                          évalué par {ev.evaluePar}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {ev.service}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        {ev.annee}
                      </td>
                      <td className="px-6 py-4">
                        <NoteDisplay note={ev.noteGlobale} />
                      </td>
                      <td className="px-6 py-4">
                        <Badge statut={ev.statut} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            setModalEval(ev);
                            setShowModal(true);
                          }}
                          className="rounded-lg border border-gray-200 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          {ev.statut === "SIGNEE" ? "Consulter" : "Modifier"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modale */}
      {showModal && (
        <EvaluationFormModal
          evaluation={modalEval}
          onClose={() => {
            setShowModal(false);
            setModalEval(null);
          }}
        />
      )}
    </RoleGate>
  );
}
