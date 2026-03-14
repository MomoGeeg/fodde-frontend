import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  XCircle,
  Clock,
  FolderOpen,
  Wallet,
  ExternalLink,
  X,
} from "lucide-react";
import {
  useValidationsSE,
  useApprouverProjet,
  useRejeterProjet,
  useApprouverDepense,
  useRejeterDepense,
  useValiderAllocation,
  useRejeterAllocation,
} from "@/api/secretariat.api";

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat("fr-SN").format(n) + " F";

function TypeBadge({ type }) {
  const config = {
    PROJET:  { cls: "bg-indigo-100 text-indigo-700",  label: "Projet" },
    DEPENSE: { cls: "bg-amber-100 text-amber-700",    label: "Dépense" },
    ALLOCATION: { cls: "bg-emerald-100 text-emerald-700", label: "Allocation" },
  };
  const { cls, label } = config[type] ?? { cls: "bg-gray-100 text-gray-700", label: type };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}

function PrioriteBadge({ priorite }) {
  if (!priorite) return null;
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        priorite === "HAUTE"
          ? "bg-red-100 text-red-700"
          : "bg-gray-100 text-gray-600"
      }`}
    >
      {priorite}
    </span>
  );
}

// ── Modale action (approuver / rejeter) ──────────────────────────────────────
function ActionModal({ item, action, onClose, onConfirm }) {
  const [commentaire, setCommentaire] = useState("");
  const isRejet = action === "rejeter";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-2">
            {isRejet ? (
              <XCircle size={18} className="text-red-500" />
            ) : (
              <CheckCircle2 size={18} className="text-green-500" />
            )}
            <h3 className="text-base font-semibold text-gray-900">
              {isRejet ? "Rejeter" : "Approuver"}{" "}
              {item.type === "PROJET" ? "la demande de projet" : item.type === "ALLOCATION" ? "l'allocation" : "la dépense"}
            </h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-100 text-gray-400">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-xs text-gray-500 mb-0.5">{item.reference}</p>
            <p className="text-sm font-medium text-gray-900">{item.titre}</p>
            <p className="text-xs text-gray-500 mt-1">Soumis par {item.soumetteur}</p>
            {item.montant && (
              <p className="text-sm font-semibold text-gray-900 mt-1">{fmt(item.montant)}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {isRejet ? (
                <span>Motif du rejet <span className="text-red-500">*</span></span>
              ) : (
                "Commentaire (optionnel)"
              )}
            </label>
            <textarea
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder={
                isRejet
                  ? "Expliquez la raison du rejet…"
                  : "Ajouter un commentaire d'approbation…"
              }
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              onClick={() => {
                if (isRejet && !commentaire.trim()) return;
                onConfirm(commentaire);
              }}
              disabled={isRejet && !commentaire.trim()}
              className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${
                isRejet ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"
              }`}
            >
              {isRejet ? "Confirmer le rejet" : "Confirmer l'approbation"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Ligne de validation ───────────────────────────────────────────────────────
function ValidationRow({ item, onApprouver, onRejeter }) {
  const navigate = useNavigate();

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <TypeBadge type={item.type} />
            <span className="text-xs font-medium text-gray-500">{item.reference}</span>
            <PrioriteBadge priorite={item.priorite} />
          </div>
          <p className="text-sm font-semibold text-gray-900">{item.titre}</p>
          <p className="text-xs text-gray-500 mt-1">
            Soumis par <span className="font-medium text-gray-700">{item.soumetteur}</span>
            {" · "}
            {new Date(item.dateSoumission).toLocaleDateString("fr-SN")}
          </p>
          {item.description && (
            <p className="text-xs text-gray-400 mt-1 line-clamp-2">{item.description}</p>
          )}
          {item.montant && (
            <p className="mt-2 text-base font-bold text-gray-900">{fmt(item.montant)}</p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Lien vers la ressource */}
          <button
            onClick={() => {
              if (item.type === "PROJET") navigate(`/projets/${item.projetId}`);
              else if (item.type === "DEPENSE") navigate(`/finances/depenses/${item.depenseId}`);
              else if (item.type === "ALLOCATION") navigate(`/projets/${item.projetId}`);
            }}
            className="rounded-lg p-2 hover:bg-gray-100 text-gray-400 hover:text-gray-700"
            title="Voir le projet associé"
          >
            <ExternalLink size={16} />
          </button>
          {/* Rejeter */}
          <button
            onClick={() => onRejeter(item)}
            className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
          >
            <XCircle size={15} />
            Rejeter
          </button>
          {/* Approuver */}
          <button
            onClick={() => onApprouver(item)}
            className="flex items-center gap-1.5 rounded-xl bg-green-500 px-3 py-2 text-sm font-semibold text-white hover:bg-green-600"
          >
            <CheckCircle2 size={15} />
            Approuver
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────
const TABS = [
  { key: "tout",    label: "Tout" },
  { key: "PROJET",  label: "Projets" },
  { key: "DEPENSE", label: "Dépenses" },
  { key: "ALLOCATION", label: "Allocations" },
];

export default function SecretariatValidations() {
  const { data: validations = [], isLoading } = useValidationsSE();
  const { mutate: approuverProjet } = useApprouverProjet();
  const { mutate: rejeterProjet } = useRejeterProjet();
  const { mutate: approuverDepense } = useApprouverDepense();
  const { mutate: rejeterDepense } = useRejeterDepense();
  const { mutate: validerAllocation } = useValiderAllocation();
  const { mutate: rejeterAllocation } = useRejeterAllocation();

  const [activeTab, setActiveTab] = useState("tout");
  const [modal, setModal] = useState(null); // { item, action }

  const filtered =
    activeTab === "tout"
      ? validations
      : validations.filter((v) => v.type === activeTab);

  const handleConfirm = (commentaire) => {
    const { item, action } = modal;
    const isApprouver = action === "approuver";

    if (item.type === "PROJET") {
      if (isApprouver) approuverProjet({ id: item.id, commentaire });
      else rejeterProjet({ id: item.id, commentaire });
    } else if (item.type === "ALLOCATION") {
      if (isApprouver) validerAllocation({ id: item.id });
      else rejeterAllocation({ id: item.id, motif: commentaire });
    } else {
      if (isApprouver) approuverDepense(item.id);
      else rejeterDepense({ id: item.id, motif: commentaire });
    }
    setModal(null);
  };

  const projetsCount  = validations.filter((v) => v.type === "PROJET").length;
  const depensesCount = validations.filter((v) => v.type === "DEPENSE").length;
  const budgetsCount  = validations.filter((v) => v.type === "ALLOCATION").length;

  return (
    <div className="space-y-5">
      {/* Onglets */}
      <div className="flex items-center gap-1 rounded-xl border border-gray-100 bg-white p-1 w-fit">
        {TABS.map((t) => {
          const count = t.key === "PROJET" ? projetsCount : t.key === "DEPENSE" ? depensesCount : t.key === "ALLOCATION" ? budgetsCount : validations.length;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === t.key
                  ? "bg-indigo-600 text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {t.label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${
                  activeTab === t.key ? "bg-indigo-500 text-white" : "bg-gray-100 text-gray-600"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Liste */}
      {isLoading ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center text-sm text-gray-400">
          Chargement…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center">
          <CheckCircle2 size={32} className="mx-auto mb-3 text-green-400" />
          <p className="text-sm font-medium text-gray-700">
            Aucune validation en attente
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Vous êtes à jour sur toutes les approbations.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((v) => (
            <ValidationRow
              key={v.id}
              item={v}
              onApprouver={(item) => setModal({ item, action: "approuver" })}
              onRejeter={(item) => setModal({ item, action: "rejeter" })}
            />
          ))}
        </div>
      )}

      {/* Modale */}
      {modal && (
        <ActionModal
          item={modal.item}
          action={modal.action}
          onClose={() => setModal(null)}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  );
}
