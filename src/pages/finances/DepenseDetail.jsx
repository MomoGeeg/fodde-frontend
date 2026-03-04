import useAuthStore from "@/stores/auth.store";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Clock,
  Download,
  Edit3,
  Eye,
  FileText,
  Send,
  Shield,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  createFinanceHelpers,
  MODE_PAIEMENT_LABELS,
  SEUIL_APPROBATION_SE,
  STATUT_COLORS,
  STATUTS_DEPENSE,
  useDepenseById,
  useLignesBudgetaires,
  useProjetsFinances,
} from "./finances-data";

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "—";

const fmtMontant = (n, devise = "XOF") =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: devise,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

// ── Timeline steps mapping ─────────────────────────────────
const ETAPE_CONFIG = {
  BROUILLON: { color: "gray", icon: Edit3, label: "Brouillon" },
  SOUMISE: { color: "blue", icon: Send, label: "Soumise" },
  VERIFIEE: { color: "indigo", icon: Eye, label: "Vérifiée" },
  EN_APPROBATION_SE: { color: "orange", icon: Shield, label: "Approbation SE" },
  VALIDEE: { color: "green", icon: Check, label: "Validée" },
  REJETEE: { color: "red", icon: X, label: "Rejetée" },
  ANNULEE: { color: "gray", icon: Trash2, label: "Annulée" },
};

const COLOR_MAP = {
  gray: {
    dot: "bg-gray-400",
    line: "bg-gray-200",
    bg: "bg-gray-50",
    text: "text-gray-700",
  },
  blue: {
    dot: "bg-blue-500",
    line: "bg-blue-200",
    bg: "bg-blue-50",
    text: "text-blue-700",
  },
  indigo: {
    dot: "bg-indigo-500",
    line: "bg-indigo-200",
    bg: "bg-indigo-50",
    text: "text-indigo-700",
  },
  orange: {
    dot: "bg-orange-500",
    line: "bg-orange-200",
    bg: "bg-orange-50",
    text: "text-orange-700",
  },
  green: {
    dot: "bg-green-500",
    line: "bg-green-200",
    bg: "bg-green-50",
    text: "text-green-700",
  },
  red: {
    dot: "bg-red-500",
    line: "bg-red-200",
    bg: "bg-red-50",
    text: "text-red-700",
  },
};

// ── Modale de confirmation ─────────────────────────────────
function ConfirmModal({
  title,
  message,
  motifRequired,
  confirmLabel,
  confirmColor,
  onClose,
  onConfirm,
}) {
  const [motif, setMotif] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        <p className="mt-2 text-sm text-gray-500">{message}</p>
        {motifRequired && (
          <textarea
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            placeholder="Motif obligatoire..."
            rows={3}
            className="mt-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
          />
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={() => {
              if (motifRequired && !motif.trim()) {
                toast.error("Le motif est obligatoire");
                return;
              }
              onConfirm(motif);
            }}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${confirmColor}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// PAGE — Détail d'une dépense
// ════════════════════════════════════════════════════════════
export default function DepenseDetail() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Données React Query
  const { data: depense } = useDepenseById(id);
  const { data: allProjets = [] } = useProjetsFinances();
  const { data: allLignes = [] } = useLignesBudgetaires();
  const helpers = useMemo(
    () => createFinanceHelpers(allProjets, allLignes, []),
    [allProjets, allLignes],
  );

  // Rôles
  const isComptable = user?.roles?.includes("ROLE_COMPTABLE");
  const isRAF = user?.roles?.some((r) =>
    ["ROLE_RAF", "ROLE_ADMIN"].includes(r),
  );
  const isSE = user?.roles?.includes("ROLE_SE");
  const isRP = user?.roles?.includes("ROLE_RESPONSABLE_PROGRAMMES");

  // Dialogs
  const [modal, setModal] = useState(null);

  if (!depense) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate("/finances/depenses")}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft size={16} /> Retour
        </button>
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
          <AlertTriangle className="mx-auto mb-3 text-gray-300" size={40} />
          <p className="text-gray-500">Dépense introuvable.</p>
        </div>
      </div>
    );
  }

  const projet = helpers.getProjet(depense.projetId);
  const ligne = helpers.getLigne(depense.ligneBudgetaireId);
  const solde = helpers.getSoldeDisponible(depense.ligneBudgetaireId);
  const statut = depense.statut;

  // ── Actions handlers (mock) ────────────────────────────
  const doAction = (action, motif = "") => {
    toast.success(
      `Action "${action}" effectuée sur ${depense.numeroPiece}${motif ? ` — motif: ${motif}` : ""}`,
    );
    setModal(null);
    navigate("/finances/depenses");
  };

  // ── Déterminer les actions disponibles ─────────────────
  const actions = useMemo(() => {
    const list = [];
    if (isComptable) {
      if (statut === "BROUILLON") {
        list.push({
          key: "modifier",
          label: "Modifier",
          icon: Edit3,
          color: "bg-blue-600 hover:bg-blue-700",
          action: () => toast.info("Redirection vers le formulaire d'édition"),
        });
        list.push({
          key: "soumettre",
          label: "Soumettre",
          icon: Send,
          color: "bg-green-600 hover:bg-green-700",
          action: () => doAction("Soumise"),
        });
        list.push({
          key: "supprimer",
          label: "Supprimer",
          icon: Trash2,
          color: "bg-red-600 hover:bg-red-700",
          needConfirm: true,
          confirmTitle: "Supprimer le brouillon ?",
          confirmMsg: "Cette action est irréversible.",
          confirmMotif: false,
          confirmLabel: "Supprimer",
          confirmColor: "bg-red-600",
        });
      }
      if (statut === "REJETEE") {
        list.push({
          key: "resoumettre",
          label: "Corriger et resoumettre",
          icon: Send,
          color: "bg-blue-600 hover:bg-blue-700",
          action: () => doAction("Corrigée et resoumise"),
        });
      }
    }
    if (isRAF) {
      if (statut === "SOUMISE") {
        list.push({
          key: "valider",
          label: "Valider",
          icon: Check,
          color: "bg-green-600 hover:bg-green-700",
          needConfirm: true,
          confirmTitle: "Valider cette dépense ?",
          confirmMsg: `Montant: ${fmtMontant(depense.montantXOF)} — cette action est définitive.`,
          confirmMotif: false,
          confirmLabel: "Confirmer la validation",
          confirmColor: "bg-green-600",
        });
        list.push({
          key: "rejeter",
          label: "Rejeter",
          icon: X,
          color: "bg-red-600 hover:bg-red-700",
          needConfirm: true,
          confirmTitle: "Rejeter cette dépense ?",
          confirmMsg: "Le comptable sera notifié. Un motif est obligatoire.",
          confirmMotif: true,
          confirmLabel: "Rejeter",
          confirmColor: "bg-red-600",
        });
        if (depense.montantXOF > SEUIL_APPROBATION_SE) {
          list.push({
            key: "transmettre_se",
            label: "Transmettre au SE",
            icon: Shield,
            color: "bg-orange-600 hover:bg-orange-700",
            needConfirm: true,
            confirmTitle: "Transmettre au SE ?",
            confirmMsg: `Montant > ${fmtMontant(SEUIL_APPROBATION_SE)} — validation SE requise.`,
            confirmMotif: false,
            confirmLabel: "Transmettre",
            confirmColor: "bg-orange-600",
          });
        }
      }
      if (statut === "VALIDEE") {
        list.push({
          key: "annuler",
          label: "Annuler la dépense",
          icon: Trash2,
          color: "bg-red-600 hover:bg-red-700",
          needConfirm: true,
          confirmTitle: "Annuler cette dépense validée ?",
          confirmMsg:
            "Le montant sera libéré sur la ligne budgétaire. Motif obligatoire.",
          confirmMotif: true,
          confirmLabel: "Confirmer l'annulation",
          confirmColor: "bg-red-600",
        });
      }
    }
    if (isSE && statut === "EN_APPROBATION_SE") {
      list.push({
        key: "approuver",
        label: "Approuver",
        icon: Check,
        color: "bg-green-600 hover:bg-green-700",
        needConfirm: true,
        confirmTitle: "Approuver cette dépense ?",
        confirmMsg: `Montant: ${fmtMontant(depense.montantXOF)} — le solde de la ligne sera mis à jour.`,
        confirmMotif: false,
        confirmLabel: "Approuver",
        confirmColor: "bg-green-600",
      });
      list.push({
        key: "rejeter_se",
        label: "Rejeter",
        icon: X,
        color: "bg-red-600 hover:bg-red-700",
        needConfirm: true,
        confirmTitle: "Rejeter cette dépense ?",
        confirmMsg: "La dépense sera renvoyée au comptable. Motif obligatoire.",
        confirmMotif: true,
        confirmLabel: "Rejeter",
        confirmColor: "bg-red-600",
      });
    }
    return list;
  }, [statut, isComptable, isRAF, isSE, depense]);

  const statutLabel =
    STATUTS_DEPENSE.find((s) => s.value === statut)?.label ?? statut;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Retour */}
      <button
        onClick={() => navigate("/finances/depenses")}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft size={16} /> Retour à la liste
      </button>

      {/* ── Entête ──────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-gray-900">
                {depense.numeroPiece}
              </h2>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUT_COLORS[statut]}`}
              >
                {statutLabel}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500">{depense.libelle}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">
              {fmtMontant(depense.montant, depense.devise)}
            </p>
            {depense.devise !== "XOF" && (
              <p className="text-xs text-gray-400">
                ≈ {fmtMontant(depense.montantXOF)} (taux: {depense.tauxChange})
              </p>
            )}
          </div>
        </div>

        {/* Détails */}
        <div className="mt-6 grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3 lg:grid-cols-4">
          <Field label="Date" value={fmtDate(depense.date)} />
          <Field label="Projet" value={`${projet?.code} — ${projet?.titre}`} />
          <Field
            label="Ligne budgétaire"
            value={`${ligne?.code} — ${ligne?.intitule}`}
          />
          <Field
            label="Solde disponible"
            value={fmtMontant(solde)}
            valueClass={solde < 0 ? "text-red-600" : "text-green-600"}
          />
          <Field label="Devise" value={depense.devise} />
          <Field
            label="Mode de paiement"
            value={MODE_PAIEMENT_LABELS[depense.modePaiement]}
          />
          <Field label="Bénéficiaire" value={depense.beneficiaire} />
          <Field label="Saisi par" value={depense.saisiPar} />
        </div>
      </div>

      {/* ── Pièce justificative ─────────────────────────── */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">
          Pièce justificative
        </h3>
        {depense.justificatif ? (
          <div className="flex items-center gap-4 rounded-lg bg-gray-50 px-4 py-3">
            <FileText size={24} className="text-green-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {depense.justificatif.nom}
              </p>
              <p className="text-xs text-gray-400">
                {(depense.justificatif.taille / 1024).toFixed(0)} Ko —{" "}
                {depense.justificatif.type}
              </p>
            </div>
            <button className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100">
              <Eye size={12} /> Aperçu
            </button>
            <button className="flex items-center gap-1 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100">
              <Download size={12} /> Télécharger
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-lg bg-yellow-50 px-4 py-3">
            <AlertTriangle size={16} className="text-yellow-500" />
            <p className="text-sm text-yellow-700">
              Aucune pièce justificative jointe
            </p>
          </div>
        )}
      </div>

      {/* ── Timeline de validation ──────────────────────── */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-5">
          Historique de validation
        </h3>
        <div className="space-y-0">
          {depense.historique.map((h, i) => {
            const cfg = ETAPE_CONFIG[h.etape] ?? ETAPE_CONFIG.BROUILLON;
            const colors = COLOR_MAP[cfg.color];
            const Icon = cfg.icon;
            const isLast = i === depense.historique.length - 1;

            return (
              <div key={i} className="flex gap-4">
                {/* Dot + line */}
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${colors.dot} text-white`}
                  >
                    <Icon size={14} />
                  </div>
                  {!isLast && <div className={`w-0.5 flex-1 ${colors.line}`} />}
                </div>
                {/* Content */}
                <div
                  className={`mb-6 flex-1 rounded-lg px-4 py-3 ${colors.bg}`}
                >
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-semibold ${colors.text}`}>
                      {cfg.label}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {fmtDate(h.date)}
                    </p>
                  </div>
                  <p className="mt-0.5 text-xs text-gray-600">Par {h.par}</p>
                  {h.commentaire && (
                    <p className="mt-1.5 text-xs italic text-gray-500">
                      « {h.commentaire} »
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Prochaines étapes attendues (visuel) */}
        {!["VALIDEE", "ANNULEE", "REJETEE"].includes(statut) && (
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
            <Clock size={12} />
            <span>
              Prochaine étape :{" "}
              {statut === "BROUILLON" && "Soumission par le comptable"}
              {statut === "SOUMISE" && "Vérification par le RAF"}
              {statut === "VERIFIEE" && "Validation RAF ou transmission SE"}
              {statut === "EN_APPROBATION_SE" && "Approbation par le SE"}
            </span>
          </div>
        )}
      </div>

      {/* ── Actions ─────────────────────────────────────── */}
      {actions.length > 0 && (
        <div className="flex flex-wrap items-center justify-end gap-2">
          {actions.map((a) => {
            const Icon = a.icon;
            return (
              <button
                key={a.key}
                onClick={() => {
                  if (a.needConfirm) {
                    setModal(a);
                  } else if (a.action) {
                    a.action();
                  }
                }}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors ${a.color}`}
              >
                <Icon size={14} />
                {a.label}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Modale de confirmation ──────────────────────── */}
      {modal && (
        <ConfirmModal
          title={modal.confirmTitle}
          message={modal.confirmMsg}
          motifRequired={modal.confirmMotif}
          confirmLabel={modal.confirmLabel}
          confirmColor={modal.confirmColor}
          onClose={() => setModal(null)}
          onConfirm={(motif) => doAction(modal.key, motif)}
        />
      )}
    </div>
  );
}

// ── Composant utilitaire ───────────────────────────────────
function Field({ label, value, valueClass = "text-gray-900" }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
        {label}
      </p>
      <p className={`mt-0.5 text-sm font-medium ${valueClass}`}>{value}</p>
    </div>
  );
}
