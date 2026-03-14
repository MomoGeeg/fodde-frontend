import useAuthStore from "@/stores/auth.store";
import {
  AlertTriangle,
  Calendar,
  Check,
  FileText,
  Plus,
  Search,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  useApprouverCongeRAF,
  useConges,
  useCreateConge,
  useEmployes,
  useRejeterConge,
} from "./rh-data";

// ── Constantes ─────────────────────────────────────────────
const STATUT_COLORS = {
  EN_ATTENTE: "bg-yellow-100 text-yellow-700",
  APPROUVE: "bg-green-100 text-green-700",
  REJETE: "bg-red-100 text-red-600",
  ANNULE: "bg-gray-100 text-gray-500",
};

const TYPE_CONGE_LABELS = {
  ANNUEL: "Congé annuel",
  MALADIE: "Congé maladie",
  MATERNITE: "Congé maternité",
  PATERNITE: "Congé paternité",
  SANS_SOLDE: "Sans solde",
  RECUPERATION: "Récupération",
  MISSION: "Mission / Déplacement",
};

const TYPE_CONGE_RULES = {
  ANNUEL: { decompte: "Solde annuel", validation: "N+1 + RH" },
  MALADIE: { decompte: "Non (si justif.)", validation: "RH + justificatif" },
  MATERNITE: { decompte: "Non décompté", validation: "RH + SE" },
  PATERNITE: { decompte: "Non décompté", validation: "RH + SE" },
  SANS_SOLDE: { decompte: "Non décompté", validation: "RH + SE" },
  RECUPERATION: { decompte: "Solde récup.", validation: "N+1" },
  MISSION: { decompte: "Pas un congé", validation: "N+1 + RAF" },
};

const TYPES = [
  "TOUS",
  "ANNUEL",
  "MALADIE",
  "MATERNITE",
  "PATERNITE",
  "SANS_SOLDE",
  "RECUPERATION",
  "MISSION",
];
const STATUTS = ["TOUS", "EN_ATTENTE", "APPROUVE", "REJETE", "ANNULE"];

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

// ── Modale nouvelle demande ────────────────────────────────
function NouvelleDemandeModal({ onClose }) {
  const { user } = useAuthStore();
  const { data: allEmployes = [] } = useEmployes();
  const [form, setForm] = useState({
    typeConge: "ANNUEL",
    dateDebut: "",
    dateFin: "",
    motif: "",
    employeId: "",
  });
  const [errors, setErrors] = useState({});

  const empLinked = allEmployes.find((e) => e.userId === user?.id);
  const isRHSansFiche = !empLinked;
  const emp = empLinked ?? allEmployes.find((e) => e.id === form.employeId);

  const [justificatifFile, setJustificatifFile] = useState(null);
  const fileInputRef = useRef(null);

  const validate = () => {
    const errs = {};
    if (isRHSansFiche && !form.employeId) errs.employeId = "Sélectionnez un employé";
    if (!form.dateDebut) errs.dateDebut = "Obligatoire";
    if (!form.dateFin) errs.dateFin = "Obligatoire";
    if (form.dateDebut && form.dateFin && form.dateFin <= form.dateDebut) {
      errs.dateFin = "Doit être après la date de début";
    }
    if (!form.motif.trim()) errs.motif = "Le motif est obligatoire";

    // Vérif solde
    if (form.typeConge === "ANNUEL" && emp) {
      const debut = new Date(form.dateDebut);
      const fin = new Date(form.dateFin);
      const nbJours = Math.ceil((fin - debut) / (1000 * 60 * 60 * 24));
      if (nbJours > emp.soldeConges) {
        errs.solde = `Solde insuffisant : ${emp.soldeConges} jours disponibles, ${nbJours} demandés`;
      }
    }
    if (form.typeConge === "RECUPERATION" && emp) {
      const debut = new Date(form.dateDebut);
      const fin = new Date(form.dateFin);
      const nbJours = Math.ceil((fin - debut) / (1000 * 60 * 60 * 24));
      if (nbJours > emp.soldeRecuperation) {
        errs.solde = `Solde récup. insuffisant : ${emp.soldeRecuperation} jours disponibles`;
      }
    }
    return errs;
  };

  const { mutate: createConge, isPending: creating } = useCreateConge();

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    createConge(
      {
        employeId: emp?.id,
        typeConge: form.typeConge,
        dateDebut: form.dateDebut,
        dateFin: form.dateFin,
        motif: form.motif,
        justificatifUrl: justificatifFile?.name || null,
      },
      {
        onSuccess: () => {
          toast.success("Demande enregistrée — soumise au RAF pour validation");
          onClose();
        },
        onError: (err) => {
          const msg =
            err?.response?.data?.erreur ||
            err?.response?.data?.message ||
            err?.message ||
            "Erreur lors de la soumission";
          toast.error(msg);
        },
      },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">
            Nouvelle demande de congé
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        {emp && (
          <div className="mb-4 rounded-lg bg-gray-50 px-4 py-2 text-xs text-gray-600">
            Solde annuel : <strong>{emp.soldeConges}j</strong> · Récupération :{" "}
            <strong>{emp.soldeRecuperation}j</strong>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Sélecteur employé — visible uniquement si l'utilisateur n'a pas de fiche employé */}
          {isRHSansFiche && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase">
                Employé concerné
              </label>
              <select
                value={form.employeId}
                onChange={(e) =>
                  setForm((p) => ({ ...p, employeId: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
              >
                <option value="">— Sélectionner un employé —</option>
                {allEmployes
                  .filter((e) => e.statut === "ACTIF")
                  .map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.prenom} {e.nom} — {e.poste}
                    </option>
                  ))}
              </select>
              {errors.employeId && (
                <p className="mt-1 text-xs text-red-500">{errors.employeId}</p>
              )}
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase">
              Type de congé
            </label>
            <select
              value={form.typeConge}
              onChange={(e) =>
                setForm((p) => ({ ...p, typeConge: e.target.value }))
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
            >
              {Object.entries(TYPE_CONGE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[10px] text-gray-400">
              Validation : {TYPE_CONGE_RULES[form.typeConge]?.validation} ·
              Décompte : {TYPE_CONGE_RULES[form.typeConge]?.decompte}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase">
                Date début
              </label>
              <input
                type="date"
                value={form.dateDebut}
                onChange={(e) =>
                  setForm((p) => ({ ...p, dateDebut: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
              />
              {errors.dateDebut && (
                <p className="mt-1 text-xs text-red-500">{errors.dateDebut}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase">
                Date fin
              </label>
              <input
                type="date"
                value={form.dateFin}
                onChange={(e) =>
                  setForm((p) => ({ ...p, dateFin: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
              />
              {errors.dateFin && (
                <p className="mt-1 text-xs text-red-500">{errors.dateFin}</p>
              )}
            </div>
          </div>

          {errors.solde && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <AlertTriangle
                size={14}
                className="mt-0.5 text-red-500 shrink-0"
              />
              <p className="text-xs text-red-700">{errors.solde}</p>
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase">
              Motif
            </label>
            <textarea
              value={form.motif}
              onChange={(e) =>
                setForm((p) => ({ ...p, motif: e.target.value }))
              }
              rows={2}
              placeholder="Décrivez le motif de votre demande..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none resize-none"
            />
            {errors.motif && (
              <p className="mt-1 text-xs text-red-500">{errors.motif}</p>
            )}
          </div>

          {/* Justificatif — optionnel pour tous les types */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase">
              Justificatif <span className="font-normal normal-case text-gray-400">(optionnel)</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={(e) => setJustificatifFile(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors w-full justify-center ${
                justificatifFile
                  ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                  : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              <FileText size={13} />
              {justificatifFile ? `✓ ${justificatifFile.name}` : "Joindre un justificatif (PDF, image)"}
            </button>
            {justificatifFile && (
              <button
                type="button"
                onClick={() => setJustificatifFile(null)}
                className="mt-1 text-[10px] text-gray-400 hover:text-red-400 w-full text-center"
              >
                Supprimer le fichier
              </button>
            )}
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={creating}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              style={{
                background: "linear-gradient(135deg, #5A9C3A, #4A7C2F)",
              }}
            >
              {creating ? "Envoi..." : "Soumettre la demande"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Modale de rejet ────────────────────────────────────────
function RejetModal({ conge, onClose, onConfirm }) {
  const [motif, setMotif] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-bold text-gray-900 mb-3">
          Rejeter la demande
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Congé de <strong>{conge.employeNom}</strong> —{" "}
          {TYPE_CONGE_LABELS[conge.typeConge]}
        </p>
        <textarea
          value={motif}
          onChange={(e) => setMotif(e.target.value)}
          rows={3}
          placeholder="Motif du rejet (obligatoire)..."
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-red-400 focus:outline-none resize-none mb-4"
        />
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={() => {
              if (!motif.trim()) {
                toast.error("Le motif est obligatoire");
                return;
              }
              onConfirm(motif);
            }}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Confirmer le rejet
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// PAGE CONGÉS
// ══════════════════════════════════════════════════════════
export default function RHConges() {
  const { user } = useAuthStore();
  const isRH  = user?.roles?.some((r) => ["ROLE_RH", "ROLE_ADMIN"].includes(r));
  const isSE  = user?.roles?.includes("ROLE_SE");
  const isRP  = user?.roles?.includes("ROLE_RESPONSABLE_PROGRAMMES");
  const isRAF = user?.roles?.includes("ROLE_RAF");
  const canSeeAll = isRH || isSE || isRP || isRAF;
  const isReadOnly = isRP; // RP = lecture seule (disponibilités uniquement)

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("TOUS");
  const [filterStatut, setFilterStatut] = useState("TOUS");
  const [showModal, setShowModal] = useState(false);
  const [rejetConge, setRejetConge] = useState(null);

  const { data: rawConges = [] } = useConges();
  const { data: allEmployes = [] } = useEmployes();

  // Enrichir les congés avec le nom et le service de l'employé
  const fetchedConges = rawConges.map((c) => {
    const emp = allEmployes.find((e) => e.id === c.employeId);
    return {
      ...c,
      employeNom: emp ? `${emp.prenom} ${emp.nom}` : c.employeId ?? "—",
      service: emp?.departement ?? "—",
    };
  });

  const { mutate: approuverRH } = useApprouverCongeRAF();
  const { mutate: rejeterConge } = useRejeterConge();

  // Employé lié au compte connecté (peut être null si l'utilisateur n'est pas un employé)
  const monEmploye = allEmployes.find((e) => e.userId === user?.id);

  // Données filtrées — pour le RP : uniquement les congés approuvés
  const allConges = isRP
    ? fetchedConges.filter((c) => c.statut === "APPROUVE")
    : canSeeAll
      ? fetchedConges
      : fetchedConges.filter((c) => c.employeId === monEmploye?.id);

  const conges = allConges.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch =
      !search ||
      c.employeNom.toLowerCase().includes(q) ||
      c.service?.toLowerCase().includes(q);
    const matchType = filterType === "TOUS" || c.typeConge === filterType;
    const matchStatut = filterStatut === "TOUS" || c.statut === filterStatut;
    return matchSearch && matchType && matchStatut;
  });

  // Alerte chevauchement service
  const chevauchements = fetchedConges.filter(
    (c) => c.statut === "APPROUVE" && c.service === "Programmes",
  );
  const showChevauchement = chevauchements.length > 1;

  const handleApprouverRH = (id) => {
    approuverRH(
      { id, validateurId: user?.id },
      {
        onSuccess: () => toast.success("Congé approuvé"),
        onError: (err) =>
          toast.error(err?.response?.data?.erreur || err?.response?.data?.message || "Erreur lors de l'approbation"),
      },
    );
  };

  const handleRejeter = (motif) => {
    rejeterConge(
      { id: rejetConge.id, validateurId: user?.id, motif },
      {
        onSuccess: () => toast.success("Demande rejetée"),
        onError: (err) =>
          toast.error(err?.response?.data?.erreur || err?.response?.data?.message || "Erreur lors du rejet"),
      },
    );
    setRejetConge(null);
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isRP ? "Disponibilités des équipes" : isRAF ? "Validation des congés" : "Gestion des congés"}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {isRP
              ? `${allConges.length} congé${allConges.length !== 1 ? "s" : ""} approuvé${allConges.length !== 1 ? "s" : ""}`
              : `${allConges.length} demande${allConges.length !== 1 ? "s" : ""} au total`}
          </p>
        </div>
        {!isReadOnly && !isRAF && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white transition-colors"
            style={{ background: "linear-gradient(135deg, #5A9C3A, #4A7C2F)" }}
          >
            <Plus size={16} />
            Nouvelle demande
          </button>
        )}
      </div>

      {/* Demandes à traiter — visible RH et RAF */}
      {(isRH || isRAF) && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {[
            {
              label: "En attente RAF",
              count: fetchedConges.filter((c) => c.statut === "EN_ATTENTE")
                .length,
              color: "bg-yellow-100 text-yellow-700",
            },
            {
              label: "Approuvés",
              count: fetchedConges.filter((c) => c.statut === "APPROUVE")
                .length,
              color: "bg-green-100 text-green-700",
            },
            {
              label: "Rejetés",
              count: fetchedConges.filter((c) => c.statut === "REJETE").length,
              color: "bg-red-100 text-red-700",
            },
          ].map(({ label, count, color }) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <span
                className={`inline-flex h-10 w-10 items-center justify-center rounded-lg text-lg font-bold ${color}`}
              >
                {count}
              </span>
              <p className="text-sm text-gray-600">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Workflow visuel — masqué pour le RP */}
      {!isRP && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Workflow de validation
          </p>
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <span className="rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-600">
              RH soumet
            </span>
            <span className="text-gray-300">→</span>
            <span className="rounded-full bg-yellow-100 px-3 py-1 font-medium text-yellow-700">
              En attente RAF
            </span>
            <span className="text-gray-300">→</span>
            <span className="rounded-full bg-emerald-100 px-3 py-1 font-medium text-emerald-700">
              Approuvée ✓
            </span>
            <span className="text-gray-400 text-[10px] ml-1">ou</span>
            <span className="rounded-full bg-red-100 px-3 py-1 font-medium text-red-600">
              Rejetée ✗
            </span>
          </div>
          {isRAF && (
            <p className="mt-2 text-[11px] text-blue-700 bg-blue-50 rounded-lg px-3 py-1.5">
              En tant que RAF, vous êtes le seul validateur des demandes de congé.
            </p>
          )}
        </div>
      )}

      {/* Alerte chevauchement — masquée pour le RP */}
      {!isRP && showChevauchement && (
        <div className="flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 px-5 py-4">
          <AlertTriangle
            size={16}
            className="mt-0.5 shrink-0 text-orange-500"
          />
          <div>
            <p className="text-sm font-semibold text-orange-800">
              Attention — chevauchement de congés dans le service Programmes
            </p>
            <p className="mt-0.5 text-xs text-orange-600">
              Plusieurs membres du même service sont en congé simultanément.
            </p>
          </div>
        </div>
      )}

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
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600 focus:border-green-500 focus:outline-none"
        >
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t === "TOUS" ? "Tous types" : TYPE_CONGE_LABELS[t]}
            </option>
          ))}
        </select>
        {!isRP && (
          <select
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600 focus:border-green-500 focus:outline-none"
          >
            {STATUTS.map((s) => (
              <option key={s} value={s}>
                {s === "TOUS" ? "Tous statuts" : s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Tableau */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {conges.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Calendar className="mx-auto mb-3 text-gray-300" size={40} />
            <p className="text-sm text-gray-400">Aucune demande de congé.</p>
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
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Dates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Jours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Motif
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Approuvé RAF
                  </th>
                  {isRAF && (
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {conges.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">
                        {c.employeNom}
                      </p>
                      <p className="text-xs text-gray-400">{c.service}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                        {TYPE_CONGE_LABELS[c.typeConge] ?? c.typeConge}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {fmtDate(c.dateDebut)} → {fmtDate(c.dateFin)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {c.nbJours}j
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-600 max-w-[200px] truncate">
                      {c.motif}
                    </td>
                    <td className="px-6 py-4">
                      <Badge statut={c.statut} />
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {c.valideParRaf ? "✓" : "—"}
                    </td>
                    {isRAF && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {c.statut === "EN_ATTENTE" ? (
                            <>
                              <button
                                onClick={() => handleApprouverRH(c.id)}
                                className="rounded-lg border border-green-100 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-50 transition-colors"
                              >
                                <Check size={12} className="inline mr-0.5" />
                                Approuver
                              </button>
                              <button
                                onClick={() => setRejetConge(c)}
                                className="rounded-lg border border-red-100 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                              >
                                Rejeter
                              </button>
                            </>
                          ) : (
                            <span className="text-[10px] text-gray-300">—</span>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modales */}
      {showModal && (
        <NouvelleDemandeModal onClose={() => setShowModal(false)} />
      )}
      {rejetConge && (
        <RejetModal
          conge={rejetConge}
          onClose={() => setRejetConge(null)}
          onConfirm={handleRejeter}
        />
      )}
    </div>
  );
}
