import { rafApi } from "@/api/raf.api";
import RoleGate from "@/components/shared/RoleGate";
import { SEUIL_APPROBATION_SE } from "@/services/rafService";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowUpRight,
  Check,
  Clock,
  Eye,
  Paperclip,
  Settings,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const fmt = (n) => new Intl.NumberFormat("fr-SN").format(n) + " F";
const fmtDate = (d) => new Date(d).toLocaleDateString("fr-FR");

const STATUT_LABELS = {
  SOUMISE: { label: "Soumise", bg: "bg-blue-100 text-blue-700" },
  EN_APPROBATION_SE: {
    label: "En approbation SE",
    bg: "bg-purple-100 text-purple-700",
  },
};

const MODE_LABELS = {
  ESPECES: "Espèces",
  VIREMENT: "Virement",
  CHEQUE: "Chèque",
};

function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded bg-gray-200 ${className}`} />;
}

// ── Modal générique ────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-gray-100"
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ── Modal détail dépense ───────────────────────────────────
function ModalDetail({ dep, lignes = [], onClose }) {
  const ligne = lignes.find(
    (l) => l.id === dep.ligneBudgetaireId || l.id === dep.ligne_budgetaire_id,
  );
  const solde = ligne
    ? (ligne.prevu ?? 0) - (ligne.depense ?? 0) - (ligne.engage ?? 0)
    : null;
  return (
    <Modal title={`Dépense — ${dep.numeroPiece}`} onClose={onClose}>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
        {[
          ["N° pièce", dep.numeroPiece],
          ["Date", fmtDate(dep.date)],
          ["Libellé", dep.libelle],
          ["Projet", dep.projetCode],
          ["Ligne budgétaire", dep.ligneBudgetaireCode],
          ["Montant", <span className="font-bold">{fmt(dep.montant)}</span>],
          ["Mode paiement", MODE_LABELS[dep.modePaiement] ?? dep.modePaiement],
          ["Bénéficiaire", dep.beneficiaire],
          ["Saisi par", dep.saisiPar],
          ["Statut", dep.statut],
          ["PJ jointe", dep.pieceJustificative ? "✅ Oui" : "❌ Non"],
          ...(solde !== null ? [["Solde ligne", fmt(solde)]] : []),
        ].map(([k, v]) => (
          <div key={k}>
            <dt className="font-medium text-gray-500">{k}</dt>
            <dd className="mt-0.5 text-gray-900">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 flex justify-end">
        <button
          onClick={onClose}
          className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium hover:bg-gray-50"
        >
          Fermer
        </button>
      </div>
    </Modal>
  );
}

// ── Modal confirmation validation ─────────────────────────
function ModalConfirmValider({ dep, onConfirm, onClose, loading }) {
  return (
    <Modal title="Confirmer la validation" onClose={onClose}>
      <p className="text-sm text-gray-700">
        Vous êtes sur le point de <strong>valider</strong> la dépense{" "}
        <strong>{dep.numeroPiece}</strong> d'un montant de{" "}
        <strong className="text-emerald-700">{fmt(dep.montant)}</strong>.
      </p>
      <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 border border-amber-200">
        Cette action est <strong>irréversible</strong>. Le solde de la ligne
        budgétaire <strong>{dep.ligneBudgetaireCode}</strong> sera
        automatiquement mis à jour.
      </p>
      <div className="mt-5 flex justify-end gap-2">
        <button
          onClick={onClose}
          disabled={loading}
          className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium hover:bg-gray-50 disabled:opacity-50"
        >
          Annuler
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? (
            "Validation…"
          ) : (
            <>
              <Check size={13} /> Valider
            </>
          )}
        </button>
      </div>
    </Modal>
  );
}

// ── Modal transmission SE ──────────────────────────────────
function ModalConfirmSE({ dep, onConfirm, onClose, loading }) {
  return (
    <Modal title="Transmettre au Secrétaire Exécutif" onClose={onClose}>
      <p className="text-sm text-gray-700">
        La dépense <strong>{dep.numeroPiece}</strong> ({fmt(dep.montant)})
        dépasse le seuil de <strong>{fmt(SEUIL_APPROBATION_SE)}</strong>.
      </p>
      <p className="mt-2 text-xs text-gray-500">
        Elle sera transmise au SE pour approbation finale. Le statut passera à{" "}
        <em>En approbation SE</em>.
      </p>
      <div className="mt-5 flex justify-end gap-2">
        <button
          onClick={onClose}
          disabled={loading}
          className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium hover:bg-gray-50 disabled:opacity-50"
        >
          Annuler
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? (
            "Transmission…"
          ) : (
            <>
              <ArrowUpRight size={13} /> Transmettre SE
            </>
          )}
        </button>
      </div>
    </Modal>
  );
}

// ── Modal rejet ────────────────────────────────────────────
function ModalRejet({ dep, onConfirm, onClose, loading }) {
  const [motif, setMotif] = useState("");
  return (
    <Modal title="Rejeter la dépense" onClose={onClose}>
      <p className="text-sm text-gray-700">
        Rejet de <strong>{dep.numeroPiece}</strong> ({fmt(dep.montant)}).
      </p>
      <div className="mt-3">
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Motif de rejet <span className="text-red-500">*</span>
        </label>
        <textarea
          value={motif}
          onChange={(e) => setMotif(e.target.value)}
          rows={3}
          placeholder="Indiquez le motif du rejet…"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400 resize-none"
        />
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button
          onClick={onClose}
          disabled={loading}
          className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium hover:bg-gray-50 disabled:opacity-50"
        >
          Annuler
        </button>
        <button
          onClick={() => motif.trim() && onConfirm(motif.trim())}
          disabled={loading || !motif.trim()}
          className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? (
            "Rejet…"
          ) : (
            <>
              <X size={13} /> Rejeter
            </>
          )}
        </button>
      </div>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════
export default function RAFValidationDepenses() {
  const qc = useQueryClient();

  const [filtreProjet, setFiltreProjet] = useState("");
  const [filtreStatut, setFiltreStatut] = useState("");
  const [filtreMontant, setFiltreMontant] = useState(""); // "inf" | "sup"
  const [modal, setModal] = useState(null); // { type, dep }

  const { data: depenses = [], isLoading } = useQuery({
    queryKey: ["raf-depenses"],
    queryFn: rafApi.getDepensesEnAttente,
    staleTime: 5 * 60_000,
  });

  const { data: allLignes = [] } = useQuery({
    queryKey: ["raf-lignes-all"],
    queryFn: () => rafApi.getLignesBudgetaires(),
  });

  const projetsUniq = [...new Set(depenses.map((d) => d.projetCode))];

  const depensesFiltrees = depenses.filter((d) => {
    if (filtreProjet && d.projetCode !== filtreProjet) return false;
    if (filtreStatut && d.statut !== filtreStatut) return false;
    if (filtreMontant === "inf" && d.montant >= SEUIL_APPROBATION_SE)
      return false;
    if (filtreMontant === "sup" && d.montant < SEUIL_APPROBATION_SE)
      return false;
    return true;
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["raf-depenses"] });
    qc.invalidateQueries({ queryKey: ["raf-depenses-count"] });
  };

  const mutValider = useMutation({
    mutationFn: (id) => rafApi.validerDepense(id),
    onSuccess: () => {
      toast.success("Dépense validée avec succès");
      invalidate();
      setModal(null);
    },
    onError: () => toast.error("Erreur lors de la validation"),
  });

  const mutSE = useMutation({
    mutationFn: (id) => rafApi.transmettreAuSE(id),
    onSuccess: () => {
      toast.success("Dépense transmise au SE");
      invalidate();
      setModal(null);
    },
    onError: () => toast.error("Erreur lors de la transmission"),
  });

  const mutRejeter = useMutation({
    mutationFn: ({ id, motif }) => rafApi.rejeterDepense(id, motif),
    onSuccess: () => {
      toast.success("Dépense rejetée");
      invalidate();
      setModal(null);
    },
    onError: () => toast.error("Erreur lors du rejet"),
  });

  // Calcul solde disponible d'une ligne budgétaire
  const getSolde = (ligneBudgetaireId) => {
    const l = allLignes.find((x) => x.id === ligneBudgetaireId);
    return l ? (l.prevu ?? 0) - (l.depense ?? 0) - (l.engage ?? 0) : null;
  };

  return (
    <RoleGate allowedRoles={["ROLE_RAF", "ROLE_SE"]}>
      {/* Bandeau seuil SE */}
      <div className="mb-4 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs text-blue-800">
        <Settings size={14} className="shrink-0" />
        <span>
          Seuil d'approbation SE : <strong>{fmt(SEUIL_APPROBATION_SE)}</strong>{" "}
          — Les dépenses dépassant ce montant doivent être transmises au
          Secrétaire Exécutif pour validation finale.
        </span>
      </div>

      {/* Filtres */}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-[11px] font-medium text-gray-500 mb-1">
            Projet
          </label>
          <select
            value={filtreProjet}
            onChange={(e) => setFiltreProjet(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs focus:border-emerald-400 focus:outline-none"
          >
            <option value="">Tous les projets</option>
            {projetsUniq.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-medium text-gray-500 mb-1">
            Statut
          </label>
          <select
            value={filtreStatut}
            onChange={(e) => setFiltreStatut(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs focus:border-emerald-400 focus:outline-none"
          >
            <option value="">Tous les statuts</option>
            <option value="SOUMISE">Soumise</option>
            <option value="EN_APPROBATION_SE">En approbation SE</option>
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-medium text-gray-500 mb-1">
            Montant
          </label>
          <select
            value={filtreMontant}
            onChange={(e) => setFiltreMontant(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs focus:border-emerald-400 focus:outline-none"
          >
            <option value="">Tous les montants</option>
            <option value="inf">
              ≤ seuil SE ({fmt(SEUIL_APPROBATION_SE)})
            </option>
            <option value="sup">&gt; seuil SE</option>
          </select>
        </div>
        <div className="ml-auto text-xs text-gray-500">
          {depensesFiltrees.length} dépense
          {depensesFiltrees.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Tableau */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-[11px] text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3">N° pièce</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Libellé</th>
                <th className="px-4 py-3">Projet / Ligne</th>
                <th className="px-4 py-3 text-right">Montant</th>
                <th className="px-4 py-3">Mode</th>
                <th className="px-4 py-3">Bénéficiaire</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="animate-pulse rounded bg-gray-200 h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : depensesFiltrees.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-12 text-center text-gray-400"
                  >
                    Aucune dépense en attente
                  </td>
                </tr>
              ) : (
                depensesFiltrees.map((dep) => {
                  const solde = getSolde(dep.ligneBudgetaireId);
                  const soldeInsuffisant =
                    solde !== null && dep.montant > solde;
                  const depasse7j = (dep.joursAttente ?? 0) > 7;
                  const depasse500k = dep.montant >= SEUIL_APPROBATION_SE;
                  const sansPI = !dep.pieceJustificative;
                  const statutStyle = STATUT_LABELS[dep.statut];
                  const canValider =
                    !soldeInsuffisant && !sansPI && dep.statut === "SOUMISE";

                  return (
                    <tr
                      key={dep.id}
                      className={`border-b border-gray-50 hover:bg-gray-50 ${soldeInsuffisant ? "bg-red-50/40" : ""}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-medium text-gray-700">
                            {dep.numeroPiece}
                          </span>
                          {sansPI && (
                            <span title="Pas de pièce justificative">
                              <Paperclip size={11} className="text-red-500" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {fmtDate(dep.date)}
                      </td>
                      <td className="px-4 py-3 max-w-[160px]">
                        <p className="truncate font-medium text-gray-800">
                          {dep.libelle}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {dep.saisiPar}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-mono text-[10px] text-gray-700">
                          {dep.projetCode}
                        </p>
                        <p className="text-[10px] text-gray-500">
                          {dep.ligneBudgetaireCode}
                        </p>
                        {solde !== null && (
                          <p
                            className={`text-[10px] font-medium ${soldeInsuffisant ? "text-red-600" : "text-gray-400"}`}
                          >
                            Solde : {fmt(solde)}
                            {soldeInsuffisant && " ⚠"}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="font-bold text-gray-900 tabular-nums">
                            {fmt(dep.montant)}
                          </span>
                          {depasse500k && (
                            <span className="rounded bg-purple-100 px-1 py-0.5 text-[9px] font-semibold text-purple-700">
                              &gt; seuil SE
                            </span>
                          )}
                          {soldeInsuffisant && (
                            <span className="rounded bg-red-100 px-1 py-0.5 text-[9px] font-semibold text-red-700 flex items-center gap-0.5">
                              <AlertTriangle size={8} /> Solde insuffisant
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {MODE_LABELS[dep.modePaiement] ?? dep.modePaiement}
                      </td>
                      <td className="px-4 py-3 text-gray-700 max-w-[120px]">
                        <p className="truncate">{dep.beneficiaire}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold ${statutStyle?.bg ?? "bg-gray-100 text-gray-600"}`}
                          >
                            {statutStyle?.label ?? dep.statut}
                          </span>
                          {depasse7j && (
                            <span className="inline-flex items-center gap-0.5 rounded bg-orange-100 px-1.5 py-0.5 text-[9px] font-semibold text-orange-700">
                              <Clock size={8} /> {dep.joursAttente}j
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          {/* Voir */}
                          <button
                            onClick={() => setModal({ type: "detail", dep })}
                            title="Voir le détail"
                            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
                          >
                            <Eye size={13} />
                          </button>
                          {/* Valider */}
                          {dep.statut === "SOUMISE" && !depasse500k && (
                            <button
                              onClick={() => setModal({ type: "valider", dep })}
                              disabled={!canValider}
                              title={
                                sansPI
                                  ? "PJ manquante"
                                  : soldeInsuffisant
                                    ? "Solde insuffisant"
                                    : "Valider"
                              }
                              className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <Check size={13} />
                            </button>
                          )}
                          {/* Transmettre SE */}
                          {dep.statut === "SOUMISE" && depasse500k && (
                            <button
                              onClick={() => setModal({ type: "se", dep })}
                              title="Transmettre au SE"
                              className="rounded-lg p-1.5 text-purple-600 hover:bg-purple-50"
                            >
                              <ArrowUpRight size={13} />
                            </button>
                          )}
                          {/* Rejeter */}
                          <button
                            onClick={() => setModal({ type: "rejeter", dep })}
                            title="Rejeter"
                            className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {modal?.type === "detail" && (
        <ModalDetail
          dep={modal.dep}
          lignes={allLignes}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "valider" && (
        <ModalConfirmValider
          dep={modal.dep}
          loading={mutValider.isPending}
          onConfirm={() => mutValider.mutate(modal.dep.id)}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "se" && (
        <ModalConfirmSE
          dep={modal.dep}
          loading={mutSE.isPending}
          onConfirm={() => mutSE.mutate(modal.dep.id)}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "rejeter" && (
        <ModalRejet
          dep={modal.dep}
          loading={mutRejeter.isPending}
          onConfirm={(motif) => mutRejeter.mutate({ id: modal.dep.id, motif })}
          onClose={() => setModal(null)}
        />
      )}
    </RoleGate>
  );
}
