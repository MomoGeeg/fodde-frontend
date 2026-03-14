import { activitesProjetApi, projetsApi } from "@/api/projets.api";
import { usersApi } from "@/api/users.api";
import useAuthStore from "@/stores/auth.store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Archive,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Edit,
  FileArchive,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Send,
  Shield,
  X,
} from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

// ─── Constantes ────────────────────────────────────────────────────────────
const STATUT_COLORS = {
  BROUILLON: "bg-gray-100 text-gray-600",
  EN_VALIDATION: "bg-yellow-100 text-yellow-700",
  ACTIF: "bg-green-100 text-green-700",
  SUSPENDU: "bg-orange-100 text-orange-700",
  EN_CLOTURE: "bg-blue-100 text-blue-700",
  CLOTURE: "bg-purple-100 text-purple-700",
  ARCHIVE: "bg-gray-100 text-gray-400",
};

const STATUT_LABELS = {
  BROUILLON: "Brouillon",
  EN_VALIDATION: "En validation",
  ACTIF: "Actif",
  SUSPENDU: "Suspendu",
  EN_CLOTURE: "En clôture",
  CLOTURE: "Clôturé",
  ARCHIVE: "Archivé",
};

const ACTIVITE_STATUT_COLORS = {
  PLANIFIEE: "bg-gray-100 text-gray-600",
  EN_COURS: "bg-blue-100 text-blue-700",
  REALISEE: "bg-green-100 text-green-700",
  ANNULEE: "bg-red-100 text-red-600",
  EN_RETARD: "bg-orange-100 text-orange-700",
};

const ACTIVITE_STATUT_LABELS = {
  PLANIFIEE: "Planifiée",
  EN_COURS: "En cours",
  REALISEE: "Réalisée",
  ANNULEE: "Annulée",
  EN_RETARD: "En retard",
};

const WORKFLOW_STEPS = [
  { key: "BROUILLON", label: "Brouillon", icon: Edit },
  { key: "EN_VALIDATION", label: "En validation", icon: Clock },
  { key: "ACTIF", label: "Actif", icon: Play },
  { key: "EN_CLOTURE", label: "En clôture", icon: Archive },
  { key: "CLOTURE", label: "Clôturé", icon: CheckCircle2 },
];

const STEP_ORDER = WORKFLOW_STEPS.map((s) => s.key);

const INTERACTIONS = [
  {
    event: "Projet approuvé",
    module: "Financier",
    action: "Création de la structure budgétaire",
    statuts: ["ACTIF", "EN_CLOTURE", "CLOTURE"],
    color: "bg-yellow-50 text-yellow-700 border-yellow-100",
  },
  {
    event: "Activité planifiée",
    module: "Communication",
    action: "Ajout au calendrier commun",
    statuts: ["ACTIF", "EN_CLOTURE", "CLOTURE"],
    color: "bg-blue-50 text-blue-700 border-blue-100",
  },
  {
    event: "Équipe affectée",
    module: "Utilisateurs",
    action: "Droits d'accès accordés aux membres",
    statuts: ["ACTIF", "SUSPENDU", "EN_CLOTURE", "CLOTURE"],
    color: "bg-green-50 text-green-700 border-green-100",
  },
  {
    event: "Projet en clôture",
    module: "GED",
    action: "Dossier de clôture créé",
    statuts: ["EN_CLOTURE", "CLOTURE"],
    color: "bg-purple-50 text-purple-700 border-purple-100",
  },
  {
    event: "Activité en retard",
    module: "Communication",
    action: "Alerte Responsable + SE",
    statuts: ["ACTIF", "SUSPENDU", "EN_CLOTURE"],
    color: "bg-orange-50 text-orange-700 border-orange-100",
  },
  {
    event: "Projet clôturé",
    module: "GED + Financier",
    action: "Archivage + gel des lignes budgétaires",
    statuts: ["CLOTURE", "ARCHIVE"],
    color: "bg-gray-50 text-gray-700 border-gray-200",
  },
  {
    event: "Budget dépassé",
    module: "RAF",
    action: "Alerte immédiate RAF et SE",
    statuts: ["ACTIF", "SUSPENDU", "EN_CLOTURE"],
    color: "bg-red-50 text-red-700 border-red-100",
  },
];

// ─── Petits composants réutilisables ──────────────────────────────────────
function StatusBadge({ statut }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUT_COLORS[statut] ?? "bg-gray-100 text-gray-600"}`}
    >
      {STATUT_LABELS[statut] ?? statut}
    </span>
  );
}

function ActiviteStatusBadge({ statut, isLate }) {
  const effectiveStatut =
    isLate && statut !== "REALISEE" && statut !== "ANNULEE"
      ? "EN_RETARD"
      : statut;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ACTIVITE_STATUT_COLORS[effectiveStatut] ?? "bg-gray-100 text-gray-600"}`}
    >
      {ACTIVITE_STATUT_LABELS[effectiveStatut] ?? effectiveStatut}
    </span>
  );
}

function ProgressBar({ value, className = "" }) {
  const pct = Math.min(100, Math.max(0, value ?? 0));
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="h-1.5 w-28 rounded-full bg-gray-200">
        <div
          className="h-1.5 rounded-full bg-green-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-gray-500">{pct}%</span>
    </div>
  );
}

function OngletBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-white border border-gray-200 text-gray-900 shadow-sm"
          : "text-gray-500 hover:text-gray-700"
      }`}
    >
      {children}
    </button>
  );
}

function InfoRow({ label, children }) {
  return (
    <div className="py-3 border-b border-gray-100 last:border-0">
      <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
        {label}
      </dt>
      <dd className="text-sm text-gray-800">{children ?? "—"}</dd>
    </div>
  );
}

// ─── Onglet Infos générales ───────────────────────────────────────────────
function TabInfos({ projet, users }) {
  const responsable = users.find((u) => u.id === projet.responsableId);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Identification
        </h3>
        <dl>
          <InfoRow label="Code projet">
            <span className="font-mono font-semibold text-primary">
              {projet.code}
            </span>
          </InfoRow>
          <InfoRow label="Titre">{projet.titre}</InfoRow>
          <InfoRow label="Zone géographique">{projet.zoneGeographique}</InfoRow>
          <InfoRow label="Statut">
            <StatusBadge statut={projet.statut} />
          </InfoRow>
        </dl>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Planification & Budget
        </h3>
        <dl>
          <InfoRow label="Période">
            {projet.dateDebut} → {projet.dateFin}
          </InfoRow>
          <InfoRow label="Budget total">
            <span className="font-semibold text-gray-900">
              {projet.budgetTotal != null
                ? new Intl.NumberFormat("fr-SN").format(projet.budgetTotal) +
                  " " +
                  (projet.devise ?? "")
                : "—"}
            </span>
          </InfoRow>
          <InfoRow label="Responsable">
            {responsable
              ? `${responsable.prenom} ${responsable.nom}`
              : (projet.responsableId ?? "—")}
          </InfoRow>
          <InfoRow label="Créé le">
            {projet.createdAt
              ? new Date(projet.createdAt).toLocaleDateString("fr-SN", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })
              : "—"}
          </InfoRow>
        </dl>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Description & Objectifs
        </h3>
        <dl>
          <InfoRow label="Description">
            <span className="whitespace-pre-wrap leading-relaxed">
              {projet.description}
            </span>
          </InfoRow>
          <InfoRow label="Objectif général">
            <span className="whitespace-pre-wrap leading-relaxed">
              {projet.objectifGeneral}
            </span>
          </InfoRow>
        </dl>
      </div>
    </div>
  );
}

// ─── Onglet Activités ─────────────────────────────────────────────────────
function TabActivites({ projet, activites, users, canManage, isSuspendu }) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [showForm, setShowForm] = useState(false);
  const [parentIdForm, setParentIdForm] = useState("");
  const [expanded, setExpanded] = useState({});
  const [form, setForm] = useState({
    titre: "",
    description: "",
    datePrevuDebut: "",
    datePrevuFin: "",
    budgetAlloue: "",
    parentId: "",
  });

  const today = new Date();

  const isLate = (act) =>
    act.datePrevuFin &&
    new Date(act.datePrevuFin) < today &&
    act.statut !== "REALISEE" &&
    act.statut !== "ANNULEE";

  const parents = activites.filter((a) => !a.parentId);
  const getSubs = (parentId) =>
    activites.filter((a) => a.parentId === parentId);

  const budgetCumul = activites.reduce(
    (acc, a) => acc + (parseFloat(a.budgetAlloue) || 0),
    0,
  );
  const budgetDepasse =
    projet.budgetTotal && budgetCumul > parseFloat(projet.budgetTotal);

  const { mutate: creerActivite, isPending: creating } = useMutation({
    mutationFn: activitesProjetApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activites", projet.id] });
      toast.success("Activité créée");
      setShowForm(false);
      setForm({
        titre: "",
        description: "",
        datePrevuDebut: "",
        datePrevuFin: "",
        budgetAlloue: "",
        parentId: "",
      });
    },
    onError: (err) => toast.error(err.message ?? "Erreur"),
  });

  const { mutate: demarrer, isPending: starting } = useMutation({
    mutationFn: (id) => activitesProjetApi.demarrer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activites", projet.id] });
      toast.success("Activité démarrée");
    },
    onError: (err) => toast.error(err.message ?? "Erreur"),
  });

  const { mutate: mettreAJour, isPending: updating } = useMutation({
    mutationFn: ({ id, taux, statut }) =>
      activitesProjetApi.mettreAJourAvancement(id, taux, statut),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activites", projet.id] });
      toast.success("Avancement mis à jour");
    },
    onError: (err) => toast.error(err.message ?? "Erreur"),
  });

  const handleSubmitActivite = (e) => {
    e.preventDefault();
    if (!form.titre.trim()) {
      toast.error("Le titre est obligatoire");
      return;
    }
    if (!form.datePrevuDebut || !form.datePrevuFin) {
      toast.error("Les dates sont obligatoires");
      return;
    }
    creerActivite({
      projetId: projet.id,
      parentId: form.parentId || undefined,
      titre: form.titre.trim(),
      description: form.description.trim() || undefined,
      datePrevuDebut: form.datePrevuDebut,
      datePrevuFin: form.datePrevuFin,
      budgetAlloue: form.budgetAlloue
        ? parseFloat(form.budgetAlloue)
        : undefined,
    });
  };

  const ActiviteRow = ({ act, isSubActivite = false }) => {
    const late = isLate(act);
    const subs = getSubs(act.id);
    const isExpanded = expanded[act.id];

    return (
      <>
        <tr
          className={`transition-colors hover:bg-gray-50 ${isSubActivite ? "bg-gray-50/50" : ""}`}
        >
          <td className="px-6 py-3">
            <div
              className={`flex items-center gap-2 ${isSubActivite ? "pl-6" : ""}`}
            >
              {!isSubActivite && subs.length > 0 && (
                <button
                  onClick={() =>
                    setExpanded((prev) => ({
                      ...prev,
                      [act.id]: !prev[act.id],
                    }))
                  }
                  className="rounded p-0.5 text-gray-400 hover:bg-gray-200 transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown size={14} />
                  ) : (
                    <ChevronRight size={14} />
                  )}
                </button>
              )}
              {isSubActivite && <span className="text-gray-300">└</span>}
              <div>
                <p
                  className={`text-sm font-medium text-gray-900 ${isSubActivite ? "text-xs" : ""}`}
                >
                  {act.titre}
                </p>
                {act.description && (
                  <p className="max-w-xs truncate text-xs text-gray-400">
                    {act.description}
                  </p>
                )}
              </div>
            </div>
          </td>
          <td className="px-6 py-3 text-xs text-gray-500">
            {act.datePrevuDebut} → {act.datePrevuFin}
            {act.dateReelDebut && (
              <p className="text-xs text-green-600">
                Réel : {act.dateReelDebut} → {act.dateReelFin ?? "…"}
              </p>
            )}
          </td>
          <td className="px-6 py-3 text-sm text-gray-600">
            {act.budgetAlloue != null
              ? new Intl.NumberFormat("fr-SN").format(act.budgetAlloue)
              : "—"}
          </td>
          <td className="px-6 py-3">
            <ProgressBar value={act.tauxAvancement} />
          </td>
          <td className="px-6 py-3">
            <ActiviteStatusBadge statut={act.statut} isLate={late} />
          </td>
          <td className="px-6 py-3 text-right">
            {!isSuspendu && (
              <div className="flex items-center justify-end gap-1">
                {act.statut === "PLANIFIEE" && (
                  <button
                    disabled={starting}
                    onClick={() => demarrer(act.id)}
                    className="rounded-lg bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50 transition-colors"
                  >
                    Démarrer
                  </button>
                )}
                {act.statut === "EN_COURS" && (
                  <button
                    disabled={updating}
                    onClick={() =>
                      mettreAJour({ id: act.id, statut: "REALISEE", taux: 100 })
                    }
                    className="rounded-lg bg-green-50 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-50 transition-colors"
                  >
                    Terminer
                  </button>
                )}
                {canManage && !isSubActivite && (
                  <button
                    type="button"
                    onClick={() => {
                      setParentIdForm(act.id);
                      setForm((f) => ({ ...f, parentId: act.id }));
                      setShowForm(true);
                    }}
                    className="rounded-lg border border-gray-200 px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-50 transition-colors"
                    title="Ajouter une sous-activité"
                  >
                    + Sous-act.
                  </button>
                )}
              </div>
            )}
          </td>
        </tr>
        {isExpanded &&
          subs.map((sub) => (
            <ActiviteRow key={sub.id} act={sub} isSubActivite />
          ))}
      </>
    );
  };

  return (
    <div className="space-y-4">
      {/* Alerte budget */}
      {budgetDepasse && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-3">
          <AlertTriangle size={16} className="shrink-0 text-red-500" />
          <p className="text-sm font-medium text-red-700">
            Budget cumulé des activités (
            {new Intl.NumberFormat("fr-SN").format(budgetCumul)}) dépasse le
            budget total du projet. Veuillez revoir les allocations.
          </p>
        </div>
      )}

      {/* Projet suspendu */}
      {isSuspendu && (
        <div className="flex items-center gap-3 rounded-xl border border-orange-200 bg-orange-50 px-5 py-3">
          <Pause size={16} className="shrink-0 text-orange-500" />
          <p className="text-sm text-orange-700">
            Ce projet est suspendu. Aucune modification des activités n'est
            possible.
          </p>
        </div>
      )}

      {/* En-tête tableau activités */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {activites.length} activité{activites.length !== 1 ? "s" : ""} —
          Budget cumulé :{" "}
          <span
            className={`font-medium ${budgetDepasse ? "text-red-600" : "text-gray-700"}`}
          >
            {new Intl.NumberFormat("fr-SN").format(budgetCumul)}{" "}
            {projet.devise ?? ""}
          </span>
        </p>
        {canManage && !isSuspendu && (
          <button
            onClick={() => {
              setForm((f) => ({ ...f, parentId: "" }));
              setParentIdForm("");
              setShowForm(!showForm);
            }}
            className="flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 transition-colors"
          >
            {showForm ? <X size={13} /> : <Plus size={13} />}
            {showForm ? "Annuler" : "Ajouter une activité"}
          </button>
        )}
      </div>

      {/* Formulaire d'ajout */}
      {showForm && (
        <form
          onSubmit={handleSubmitActivite}
          className="rounded-xl border border-green-100 bg-white p-5 shadow-sm space-y-4"
        >
          <h3 className="text-sm font-semibold text-gray-800">
            {form.parentId ? "Nouvelle sous-activité" : "Nouvelle activité"}
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Titre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.titre}
                onChange={(e) =>
                  setForm((f) => ({ ...f, titre: e.target.value }))
                }
                placeholder="Titre de l'activité..."
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={2}
                className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Date début <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.datePrevuDebut}
                onChange={(e) =>
                  setForm((f) => ({ ...f, datePrevuDebut: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Date fin <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.datePrevuFin}
                onChange={(e) =>
                  setForm((f) => ({ ...f, datePrevuFin: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Budget alloué
              </label>
              <input
                type="number"
                value={form.budgetAlloue}
                onChange={(e) =>
                  setForm((f) => ({ ...f, budgetAlloue: e.target.value }))
                }
                placeholder="0"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
              />
            </div>
            {!form.parentId && (
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Activité parente (optionnel)
                </label>
                <select
                  value={form.parentId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, parentId: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                >
                  <option value="">— Aucune (activité principale) —</option>
                  {parents.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.titre}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={creating}
              className="rounded-lg px-4 py-1.5 text-xs font-medium text-white disabled:opacity-60"
              style={{
                background: "linear-gradient(135deg, #5A9C3A, #4A7C2F)",
              }}
            >
              {creating ? "Création..." : "Créer"}
            </button>
          </div>
        </form>
      )}

      {/* Tableau activités */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {activites.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm text-gray-400">
              Aucune activité pour ce projet.
            </p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Activité
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Période
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Budget
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Avancement
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
              {parents.map((act) => (
                <ActiviteRow key={act.id} act={act} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Onglet Avancement ─────────────────────────────────────────────────────
function TabAvancement({
  projet,
  activites,
  onChangerStatut,
  isPending,
  isSE,
  isRP,
  isRAF,
}) {
  const navigate = useNavigate();
  const [showRejetForm, setShowRejetForm] = useState(false);
  const [commentaire, setCommentaire] = useState("");
  const [showProlonger, setShowProlonger] = useState(false);
  const [nouvelleDateFin, setNouvelleDateFin] = useState("");
  const [justification, setJustification] = useState("");

  const queryClient = useQueryClient();
  const { id } = useParams();

  const { mutate: prolonger, isPending: prolongeant } = useMutation({
    mutationFn: () =>
      projetsApi.prolongerDateFin(id, nouvelleDateFin, justification),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projet", id] });
      toast.success("Date de fin prolongée");
      setShowProlonger(false);
    },
    onError: (err) => toast.error(err.message ?? "Erreur"),
  });

  const currentIdx = STEP_ORDER.indexOf(
    projet.statut === "SUSPENDU" ? "ACTIF" : projet.statut,
  );

  const budgetTotal = activites.reduce(
    (acc, a) => acc + (parseFloat(a.budgetAlloue) || 0),
    0,
  );
  const tauxGlobal =
    budgetTotal > 0
      ? Math.round(
          activites.reduce(
            (acc, a) =>
              acc + (parseFloat(a.budgetAlloue) || 0) * (a.tauxAvancement ?? 0),
            0,
          ) / budgetTotal,
        )
      : activites.length > 0
        ? Math.round(
            activites.reduce((acc, a) => acc + (a.tauxAvancement ?? 0), 0) /
              activites.length,
          )
        : 0;

  const stats = [
    {
      label: "Planifiées",
      count: activites.filter((a) => a.statut === "PLANIFIEE").length,
      color: "text-gray-600",
    },
    {
      label: "En cours",
      count: activites.filter((a) => a.statut === "EN_COURS").length,
      color: "text-blue-600",
    },
    {
      label: "Réalisées",
      count: activites.filter((a) => a.statut === "REALISEE").length,
      color: "text-green-600",
    },
    {
      label: "En retard",
      count: activites.filter((a) => {
        return (
          a.datePrevuFin &&
          new Date(a.datePrevuFin) < new Date() &&
          a.statut !== "REALISEE" &&
          a.statut !== "ANNULEE"
        );
      }).length,
      color: "text-orange-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Timeline workflow */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-6 text-sm font-semibold text-gray-700">
          Cycle de vie du projet
        </h3>

        {/* Statut suspendu — bandeau */}
        {projet.statut === "SUSPENDU" && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-orange-50 border border-orange-200 px-4 py-2.5">
            <Pause size={15} className="text-orange-500" />
            <span className="text-sm font-medium text-orange-700">
              Projet suspendu — en attente de réactivation
            </span>
          </div>
        )}

        <div className="flex items-center gap-0">
          {WORKFLOW_STEPS.map((step, idx) => {
            const isPast = idx < currentIdx;
            const isCurrent = idx === currentIdx;
            const Icon = step.icon;
            const isLast = idx === WORKFLOW_STEPS.length - 1;

            return (
              <div key={step.key} className="flex flex-1 items-center">
                <div className="flex flex-col items-center gap-1.5 min-w-0">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all ${
                      isPast
                        ? "border-primary bg-primary text-white"
                        : isCurrent
                          ? "border-primary bg-white text-primary shadow-md ring-2 ring-primary/20"
                          : "border-gray-200 bg-white text-gray-300"
                    }`}
                  >
                    <Icon size={16} />
                  </div>
                  <span
                    className={`text-center text-xs font-medium leading-tight px-1 ${
                      isCurrent
                        ? "text-primary font-semibold"
                        : isPast
                          ? "text-gray-500"
                          : "text-gray-300"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {!isLast && (
                  <div
                    className={`flex-1 h-0.5 mx-1 ${
                      idx < currentIdx ? "bg-primary" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Taux global + stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-gray-700">
            Avancement global
          </h3>
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 shrink-0">
              <svg className="h-20 w-20 -rotate-90" viewBox="0 0 36 36">
                <circle
                  cx="18"
                  cy="18"
                  r="15.9"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="3"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15.9"
                  fill="none"
                  stroke="#4a7c2f"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${tauxGlobal} ${100 - tauxGlobal}`}
                  strokeDashoffset="0"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-base font-bold text-primary">
                {tauxGlobal}%
              </span>
            </div>
            <div className="space-y-2">
              {stats.map((s) => (
                <div key={s.label} className="flex items-center gap-2 text-sm">
                  <span className={`font-semibold ${s.color}`}>{s.count}</span>
                  <span className="text-gray-500">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-400">
            Calculé automatiquement (moyenne pondérée par budget)
          </p>
        </div>

        {/* Actions selon rôle et statut */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-gray-700">
            Actions disponibles
          </h3>
          <div className="space-y-3">
            {/* BROUILLON → Soumettre (RP, RAF) */}
            {projet.statut === "BROUILLON" && (isRP || isRAF) && (
              <button
                disabled={isPending}
                onClick={() => onChangerStatut("EN_VALIDATION")}
                className="flex w-full items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50 transition-colors"
              >
                <Send size={15} />
                Soumettre à validation
              </button>
            )}

            {/* EN_VALIDATION → Approuver (SE) */}
            {projet.statut === "EN_VALIDATION" && isSE && (
              <>
                <button
                  disabled={isPending}
                  onClick={() => onChangerStatut("ACTIF")}
                  className="flex w-full items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-sm font-medium text-green-700 hover:bg-green-100 disabled:opacity-50 transition-colors"
                >
                  <CheckCircle2 size={15} />
                  Approuver le projet
                </button>
                <button
                  disabled={isPending}
                  onClick={() => setShowRejetForm(true)}
                  className="flex w-full items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors"
                >
                  <X size={15} />
                  Rejeter
                </button>
              </>
            )}

            {/* ACTIF → Suspendre (SE) */}
            {projet.statut === "ACTIF" && isSE && (
              <button
                disabled={isPending}
                onClick={() => onChangerStatut("SUSPENDU")}
                className="flex w-full items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm font-medium text-orange-700 hover:bg-orange-100 disabled:opacity-50 transition-colors"
              >
                <Pause size={15} />
                Suspendre le projet
              </button>
            )}

            {/* SUSPENDU → Réactiver (SE) */}
            {projet.statut === "SUSPENDU" && isSE && (
              <button
                disabled={isPending}
                onClick={() => onChangerStatut("ACTIF")}
                className="flex w-full items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-sm font-medium text-green-700 hover:bg-green-100 disabled:opacity-50 transition-colors"
              >
                <RefreshCw size={15} />
                Réactiver le projet
              </button>
            )}

            {/* EN_CLOTURE → Voir GED */}
            {projet.statut === "EN_CLOTURE" && (
              <button
                onClick={() => navigate("/documents")}
                className="flex w-full items-center gap-2 rounded-lg border border-purple-200 bg-purple-50 px-4 py-2.5 text-sm font-medium text-purple-700 hover:bg-purple-100 transition-colors"
              >
                <FileArchive size={15} />
                Déposer le rapport de clôture (GED)
              </button>
            )}

            {/* Prolonger date (SE) */}
            {["ACTIF", "SUSPENDU"].includes(projet.statut) && isSE && (
              <button
                onClick={() => setShowProlonger(!showProlonger)}
                className="flex w-full items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <Edit size={15} />
                Prolonger la date de fin
              </button>
            )}

            {projet.statut === "CLOTURE" && (
              <p className="text-sm text-gray-400 text-center py-2">
                Projet clôturé — lecture seule
              </p>
            )}

            {!isRP &&
              !isRAF &&
              !isSE &&
              ![
                "BROUILLON",
                "EN_VALIDATION",
                "ACTIF",
                "SUSPENDU",
                "EN_CLOTURE",
              ].includes(projet.statut) && (
                <p className="text-sm text-gray-400 text-center py-2">
                  Aucune action disponible
                </p>
              )}
          </div>

          {/* Formulaire rejet */}
          {showRejetForm && (
            <div className="mt-4 space-y-3 rounded-lg border border-red-100 bg-red-50 p-4">
              <p className="text-xs font-semibold text-red-700">
                Commentaire de rejet obligatoire :
              </p>
              <textarea
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                rows={2}
                placeholder="Motif du rejet..."
                className="w-full resize-none rounded-lg border border-red-200 bg-white px-3 py-2 text-sm focus:border-red-400 focus:outline-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowRejetForm(false);
                    setCommentaire("");
                  }}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-white"
                >
                  Annuler
                </button>
                <button
                  disabled={!commentaire.trim() || isPending}
                  onClick={() => {
                    if (!commentaire.trim()) {
                      toast.error("Le commentaire est obligatoire");
                      return;
                    }
                    onChangerStatut("BROUILLON", commentaire);
                    setShowRejetForm(false);
                    setCommentaire("");
                  }}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  Confirmer le rejet
                </button>
              </div>
            </div>
          )}

          {/* Formulaire prolonger */}
          {showProlonger && (
            <div className="mt-4 space-y-3 rounded-lg border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs font-semibold text-gray-700">
                Prolonger la date de fin :
              </p>
              <div>
                <label className="mb-1 block text-xs text-gray-500">
                  Nouvelle date de fin
                </label>
                <input
                  type="date"
                  value={nouvelleDateFin}
                  min={projet.dateFin}
                  onChange={(e) => setNouvelleDateFin(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">
                  Justification
                </label>
                <textarea
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  rows={2}
                  className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowProlonger(false)}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-white"
                >
                  Annuler
                </button>
                <button
                  disabled={
                    !nouvelleDateFin || !justification.trim() || prolongeant
                  }
                  onClick={() => prolonger()}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                  style={{
                    background: "linear-gradient(135deg, #5A9C3A, #4A7C2F)",
                  }}
                >
                  {prolongeant ? "Enregistrement..." : "Prolonger"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Onglet Interactions ───────────────────────────────────────────────────
function TabInteractions({ projet }) {
  const actives = INTERACTIONS.filter((i) => i.statuts.includes(projet.statut));
  const futures = INTERACTIONS.filter(
    (i) => !i.statuts.includes(projet.statut),
  );

  return (
    <div className="space-y-6">
      {actives.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-gray-100 bg-gray-50 px-6 py-3">
            <h3 className="text-sm font-semibold text-gray-700">
              Interactions actives
            </h3>
            <p className="text-xs text-gray-400">
              Événements déclenchés depuis ce projet
            </p>
          </div>
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Événement
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Module
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Action déclenchée
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {actives.map((inter) => (
                <tr
                  key={inter.event}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-3 text-sm font-medium text-gray-900">
                    {inter.event}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${inter.color}`}
                    >
                      {inter.module}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-600">
                    {inter.action}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {futures.length > 0 && (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-dashed border-gray-100 px-6 py-3">
            <h3 className="text-sm font-semibold text-gray-400">
              Interactions futures
            </h3>
            <p className="text-xs text-gray-300">
              Se déclencheront aux prochaines étapes
            </p>
          </div>
          <table className="min-w-full divide-y divide-gray-100">
            <tbody className="divide-y divide-gray-100">
              {futures.map((inter) => (
                <tr key={inter.event}>
                  <td className="px-6 py-3 text-sm text-gray-300">
                    {inter.event}
                  </td>
                  <td className="px-6 py-3">
                    <span className="inline-flex items-center rounded-full border border-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-300">
                      {inter.module}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-300">
                    {inter.action}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Page principale ProjetDetail ─────────────────────────────────────────
export default function ProjetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState("infos");

  const isSE =
    user?.roles?.includes("ROLE_SE") || user?.roles?.includes("ROLE_ADMIN");
  const isRP = user?.roles?.includes("ROLE_RESPONSABLE_PROGRAMMES");
  const isRAF = user?.roles?.includes("ROLE_RAF");
  const isCP = user?.roles?.includes("ROLE_CHARGE_PROGRAMME");
  const isAdmin = user?.roles?.includes("ROLE_ADMIN");

  const canManage = isRP || isAdmin;
  const canAct = isRP || isRAF || isSE || isAdmin;

  const {
    data: projetData,
    isLoading: loadingProjet,
    isError,
  } = useQuery({
    queryKey: ["projet", id],
    queryFn: () => projetsApi.getById(id),
  });
  const projet = projetData;

  const { data: activitesData, isLoading: loadingActivites } = useQuery({
    queryKey: ["activites", id],
    queryFn: () => activitesProjetApi.getByProjet(id),
    enabled: !!id,
  });
  const activites = activitesData ?? [];

  const { data: usersData } = useQuery({
    queryKey: ["users-actifs"],
    queryFn: usersApi.getActifs,
  });
  const users = usersData ?? [];

  const { mutate: changerStatut, isPending: changingStatut } = useMutation({
    mutationFn: (body) => projetsApi.changerStatut(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projet", id] });
      queryClient.invalidateQueries({ queryKey: ["projets"] });
      toast.success("Statut mis à jour avec succès");
    },
    onError: (err) =>
      toast.error(err.message ?? "Erreur lors du changement de statut"),
  });

  const handleChangerStatut = (statut, commentaire = null) => {
    changerStatut({
      statut,
      validateurId: user?.id,
      commentaire: commentaire ?? undefined,
    });
  };

  const isJ30 = () => {
    if (!projet || projet.statut !== "ACTIF") return false;
    const fin = new Date(projet.dateFin);
    const diff = Math.ceil((fin - new Date()) / (1000 * 60 * 60 * 24));
    return diff >= 0 && diff <= 30;
  };

  if (loadingProjet) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 animate-pulse rounded bg-gray-200" />
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-5 animate-pulse rounded bg-gray-200"
                style={{ width: `${70 - i * 10}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError || !projet) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm text-red-600">
          Projet introuvable ou erreur lors du chargement.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="mt-3 text-sm font-medium text-red-700 hover:underline"
        >
          Retour à la liste
        </button>
      </div>
    );
  }

  const isSuspendu = projet.statut === "SUSPENDU";
  const isReadOnly = ["CLOTURE", "ARCHIVE"].includes(projet.statut);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => navigate(-1)}
          className="mt-1 rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 transition-colors shrink-0"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <span className="font-mono text-sm font-semibold text-primary">
              {projet.code}
            </span>
            <StatusBadge statut={projet.statut} />
            {isSuspendu && (
              <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                <Pause size={11} /> Suspendu
              </span>
            )}
            {isReadOnly && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                <Shield size={11} /> Lecture seule
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-gray-900 leading-snug">
            {projet.titre}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {projet.zoneGeographique ?? ""}
          </p>
        </div>
        {canManage && !isReadOnly && (
          <button
            onClick={() => navigate("edit")}
            className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors shrink-0"
          >
            <Edit size={15} />
            Modifier
          </button>
        )}
      </div>

      {/* Commentaire de rejet visible RP/RAF */}
      {projet.statut === "BROUILLON" && projet.commentaire_validation && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4">
          <X size={16} className="mt-0.5 shrink-0 text-red-500" />
          <div>
            <p className="text-sm font-semibold text-red-800">
              Projet rejeté — modifications requises
            </p>
            <p className="mt-0.5 text-sm text-red-700">
              {projet.commentaire_validation}
            </p>
          </div>
        </div>
      )}

      {/* Alerte J-30 */}
      {isJ30() && (
        <div className="flex items-center gap-3 rounded-xl border border-orange-200 bg-orange-50 px-5 py-3">
          <AlertTriangle size={16} className="shrink-0 text-orange-500" />
          <p className="text-sm font-medium text-orange-800">
            Ce projet arrive à échéance dans moins de 30 jours ({projet.dateFin}
            ). Vérifiez l'avancement et préparez la clôture.
          </p>
        </div>
      )}

      {/* Onglets */}
      <div className="flex gap-2 rounded-xl bg-gray-100 p-1 w-fit">
        <OngletBtn
          active={activeTab === "infos"}
          onClick={() => setActiveTab("infos")}
        >
          Infos générales
        </OngletBtn>
        <OngletBtn
          active={activeTab === "activites"}
          onClick={() => setActiveTab("activites")}
        >
          Activités {activites.length > 0 && `(${activites.length})`}
        </OngletBtn>
        <OngletBtn
          active={activeTab === "avancement"}
          onClick={() => setActiveTab("avancement")}
        >
          Avancement
        </OngletBtn>
        <OngletBtn
          active={activeTab === "interactions"}
          onClick={() => setActiveTab("interactions")}
        >
          Interactions
        </OngletBtn>
      </div>

      {/* Contenu des onglets */}
      {activeTab === "infos" && <TabInfos projet={projet} users={users} />}

      {activeTab === "activites" &&
        (loadingActivites ? (
          <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white shadow-sm">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4">
                <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
                <div className="ml-auto h-4 w-24 animate-pulse rounded bg-gray-200" />
              </div>
            ))}
          </div>
        ) : (
          <TabActivites
            projet={projet}
            activites={activites}
            users={users}
            canManage={canManage || isCP}
            isSuspendu={isSuspendu}
          />
        ))}

      {activeTab === "avancement" && (
        <TabAvancement
          projet={projet}
          activites={activites}
          onChangerStatut={handleChangerStatut}
          isPending={changingStatut}
          isSE={isSE}
          isRP={isRP}
          isRAF={isRAF}
        />
      )}

      {activeTab === "interactions" && <TabInteractions projet={projet} />}
    </div>
  );
}
