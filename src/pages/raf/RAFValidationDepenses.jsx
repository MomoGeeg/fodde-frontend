import { rafApi } from "@/api/raf.api";
import RoleGate from "@/components/shared/RoleGate";
import Modal from "@/components/shared/Modal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowUpRight,
  Check,
  CheckCheck,
  Clock,
  Eye,
  Settings,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const SEUIL_SE = 500_000;

const fmt = (n) => new Intl.NumberFormat("fr-SN").format(Number(n ?? 0)) + " F";
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR") : "—";

const STATUT_CONFIG = {
  SOUMISE:           { label: "Soumise",            bg: "bg-blue-100 text-blue-700" },
  VERIFIEE:          { label: "Vérifiée",            bg: "bg-emerald-100 text-emerald-700" },
  EN_APPROBATION_SE: { label: "En approbation SE",  bg: "bg-purple-100 text-purple-700" },
  VALIDEE:           { label: "Validée",             bg: "bg-green-100 text-green-700" },
  REJETEE:           { label: "Rejetée",             bg: "bg-red-100 text-red-700" },
};

const MODE_LABELS = {
  ESPECES: "Espèces",
  VIREMENT: "Virement",
  CHEQUE: "Chèque",
};

function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded bg-gray-200 ${className}`} />;
}

// ── Modal détail dépense ───────────────────────────────────
function ModalDetail({ dep, onClose }) {
  return (
    <Modal title={`Dépense — ${dep.numeroPiece}`} onClose={onClose}>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
        {[
          ["N° pièce",        dep.numeroPiece],
          ["Date",            fmtDate(dep.dateDepense)],
          ["Libellé",         dep.libelle],
          ["Projet",          dep.projetCode ? `${dep.projetCode} — ${dep.projetTitre ?? ""}` : "—"],
          ["Ligne budgétaire",dep.ligneBudgetaireCode ? `${dep.ligneBudgetaireCode} — ${dep.ligneBudgetaireIntitule ?? ""}` : "—"],
          ["Montant",         <span className="font-bold">{fmt(dep.montant)}</span>],
          ["Mode paiement",   MODE_LABELS[dep.modePaiement] ?? dep.modePaiement],
          ["Bénéficiaire",    dep.beneficiaire],
          ["Saisi par",       dep.saisiParNom ?? "—"],
          ["Statut",          STATUT_CONFIG[dep.statut]?.label ?? dep.statut],
          ...(dep.motifRejet ? [["Motif rejet", <span className="text-red-600">{dep.motifRejet}</span>]] : []),
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

// ── Modal confirmation vérification ───────────────────────
function ModalVerifier({ dep, onConfirm, onClose, loading }) {
  return (
    <Modal title="Confirmer la vérification" onClose={onClose}>
      <p className="text-sm text-gray-700">
        Vous allez <strong>vérifier</strong> la dépense{" "}
        <strong>{dep.numeroPiece}</strong> —{" "}
        <strong className="text-emerald-700">{fmt(dep.montant)}</strong>.
      </p>
      <p className="mt-2 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700 border border-blue-200">
        La dépense passera au statut <em>Vérifiée</em>. Vous pourrez ensuite la
        valider ou la transmettre au SE selon le montant.
      </p>
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} disabled={loading}
          className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium hover:bg-gray-50 disabled:opacity-50">
          Annuler
        </button>
        <button onClick={onConfirm} disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
          {loading ? "Vérification…" : <><Check size={13} /> Vérifier</>}
        </button>
      </div>
    </Modal>
  );
}

// ── Modal validation finale ────────────────────────────────
function ModalValider({ dep, onConfirm, onClose, loading }) {
  return (
    <Modal title="Valider la dépense" onClose={onClose}>
      <p className="text-sm text-gray-700">
        Vous allez <strong>valider définitivement</strong> la dépense{" "}
        <strong>{dep.numeroPiece}</strong> —{" "}
        <strong className="text-emerald-700">{fmt(dep.montant)}</strong>.
      </p>
      <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 border border-amber-200">
        Cette action est <strong>irréversible</strong>. Le montant sera imputé sur
        la ligne budgétaire <strong>{dep.ligneBudgetaireCode}</strong>.
      </p>
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} disabled={loading}
          className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium hover:bg-gray-50 disabled:opacity-50">
          Annuler
        </button>
        <button onClick={onConfirm} disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2 text-xs font-semibold text-white hover:bg-green-800 disabled:opacity-50">
          {loading ? "Validation…" : <><CheckCheck size={13} /> Valider</>}
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
        La dépense <strong>{dep.numeroPiece}</strong> ({fmt(dep.montant)}) dépasse
        le seuil de <strong>{fmt(SEUIL_SE)}</strong>.
      </p>
      <p className="mt-2 text-xs text-gray-500">
        Elle sera transmise au SE pour approbation finale. Le statut passera à{" "}
        <em>En approbation SE</em>.
      </p>
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} disabled={loading}
          className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium hover:bg-gray-50 disabled:opacity-50">
          Annuler
        </button>
        <button onClick={onConfirm} disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-700 disabled:opacity-50">
          {loading ? "Transmission…" : <><ArrowUpRight size={13} /> Transmettre SE</>}
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
        <button onClick={onClose} disabled={loading}
          className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium hover:bg-gray-50 disabled:opacity-50">
          Annuler
        </button>
        <button
          onClick={() => motif.trim() && onConfirm(motif.trim())}
          disabled={loading || !motif.trim()}
          className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50">
          {loading ? "Rejet…" : <><X size={13} /> Rejeter</>}
        </button>
      </div>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════
export default function RAFValidationDepenses() {
  const qc = useQueryClient();

  const [filtreStatut, setFiltreStatut] = useState("");
  const [filtreProjet, setFiltreProjet] = useState("");
  const [modal, setModal] = useState(null); // { type, dep }

  // Charger SOUMISE + VERIFIEE (les deux étapes RAF)
  const { data: depSoumises = [], isLoading: l1 } = useQuery({
    queryKey: ["raf-depenses", "SOUMISE"],
    queryFn: () => rafApi.getDepensesEnAttente(),
    staleTime: 2 * 60_000,
  });

  const { data: depVerifiees = [], isLoading: l2 } = useQuery({
    queryKey: ["raf-depenses", "VERIFIEE"],
    queryFn: () => rafApi.getDepensesVerifiees(),
    staleTime: 2 * 60_000,
  });

  const isLoading = l1 || l2;
  const toutesDepenses = [...depSoumises, ...depVerifiees];

  const projetsUniq = [...new Set(toutesDepenses.map((d) => d.projetCode).filter(Boolean))];

  const depensesFiltrees = toutesDepenses.filter((d) => {
    if (filtreStatut && d.statut !== filtreStatut) return false;
    if (filtreProjet && d.projetCode !== filtreProjet) return false;
    return true;
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["raf-depenses"] });
    qc.invalidateQueries({ queryKey: ["raf-depenses-count"] });
  };

  // ── Mutations ──────────────────────────────────────────
  const mutVerifier = useMutation({
    mutationFn: (id) => rafApi.verifierDepense(id),
    onSuccess: () => { toast.success("Dépense vérifiée"); invalidate(); setModal(null); },
    onError: (e) => toast.error(e?.response?.data?.message ?? "Erreur lors de la vérification"),
  });

  const mutValider = useMutation({
    mutationFn: (id) => rafApi.validerDepense(id),
    onSuccess: () => { toast.success("Dépense validée"); invalidate(); setModal(null); },
    onError: (e) => toast.error(e?.response?.data?.message ?? "Erreur lors de la validation"),
  });

  const mutSE = useMutation({
    mutationFn: (id) => rafApi.transmettreAuSE(id),
    onSuccess: () => { toast.success("Dépense transmise au SE"); invalidate(); setModal(null); },
    onError: (e) => toast.error(e?.response?.data?.message ?? "Erreur lors de la transmission"),
  });

  const mutRejeter = useMutation({
    mutationFn: ({ id, motif }) => rafApi.rejeterDepense(id, motif),
    onSuccess: () => { toast.success("Dépense rejetée"); invalidate(); setModal(null); },
    onError: (e) => toast.error(e?.response?.data?.message ?? "Erreur lors du rejet"),
  });

  return (
    <RoleGate allowedRoles={["ROLE_RAF", "ROLE_SE"]}>
      {/* Bandeau workflow */}
      <div className="mb-4 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-800">
        <Settings size={14} className="shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold mb-0.5">Workflow de validation RAF</p>
          <p>
            <span className="rounded bg-blue-200 px-1.5 py-0.5 font-medium">SOUMISE</span>
            {" → "}
            <span className="font-medium">RAF vérifie</span>
            {" → "}
            <span className="rounded bg-emerald-200 px-1.5 py-0.5 font-medium">VÉRIFIÉE</span>
            {" → si montant ≤ "}
            <strong>{fmt(SEUIL_SE)}</strong>
            {" : RAF valide → "}
            <span className="rounded bg-green-200 px-1.5 py-0.5 font-medium">VALIDÉE</span>
            {" · si montant > seuil : RAF transmet → "}
            <span className="rounded bg-purple-200 px-1.5 py-0.5 font-medium">SE</span>
          </p>
        </div>
      </div>

      {/* Filtres */}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-[11px] font-medium text-gray-500 mb-1">Statut</label>
          <select value={filtreStatut} onChange={(e) => setFiltreStatut(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs focus:border-emerald-400 focus:outline-none">
            <option value="">Soumises + Vérifiées</option>
            <option value="SOUMISE">Soumises</option>
            <option value="VERIFIEE">Vérifiées</option>
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-medium text-gray-500 mb-1">Projet</label>
          <select value={filtreProjet} onChange={(e) => setFiltreProjet(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs focus:border-emerald-400 focus:outline-none">
            <option value="">Tous les projets</option>
            {projetsUniq.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="ml-auto text-xs text-gray-500">
          {depensesFiltrees.length} dépense{depensesFiltrees.length !== 1 ? "s" : ""}
          {" · "}
          <span className="text-blue-700 font-medium">{depSoumises.length} soumise{depSoumises.length !== 1 ? "s" : ""}</span>
          {" · "}
          <span className="text-emerald-700 font-medium">{depVerifiees.length} vérifiée{depVerifiees.length !== 1 ? "s" : ""}</span>
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
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                    Aucune dépense en attente de traitement
                  </td>
                </tr>
              ) : (
                depensesFiltrees.map((dep) => {
                  const depasse = Number(dep.montant) >= SEUIL_SE;
                  const depasse7j = (dep.joursAttente ?? 0) > 7;
                  const statutStyle = STATUT_CONFIG[dep.statut];

                  return (
                    <tr key={dep.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="font-mono font-medium text-gray-700">{dep.numeroPiece}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{fmtDate(dep.dateDepense)}</td>
                      <td className="px-4 py-3 max-w-[160px]">
                        <p className="truncate font-medium text-gray-800">{dep.libelle}</p>
                        <p className="text-[10px] text-gray-400">{dep.saisiParNom ?? "—"}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-mono text-[10px] text-gray-700">{dep.projetCode ?? "—"}</p>
                        <p className="text-[10px] text-gray-500">{dep.ligneBudgetaireCode ?? "—"}</p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="font-bold text-gray-900 tabular-nums">{fmt(dep.montant)}</span>
                          {depasse && (
                            <span className="rounded bg-purple-100 px-1 py-0.5 text-[9px] font-semibold text-purple-700">
                              &gt; seuil SE
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
                          <span className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold ${statutStyle?.bg ?? "bg-gray-100 text-gray-600"}`}>
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
                          <button onClick={() => setModal({ type: "detail", dep })}
                            title="Voir le détail"
                            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100">
                            <Eye size={13} />
                          </button>

                          {/* SOUMISE → vérifier */}
                          {dep.statut === "SOUMISE" && (
                            <button onClick={() => setModal({ type: "verifier", dep })}
                              title="Vérifier"
                              className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50">
                              <Check size={13} />
                            </button>
                          )}

                          {/* VERIFIEE → valider (≤ seuil) ou transmettre SE (> seuil) */}
                          {dep.statut === "VERIFIEE" && !depasse && (
                            <button onClick={() => setModal({ type: "valider", dep })}
                              title="Valider définitivement"
                              className="rounded-lg p-1.5 text-green-700 hover:bg-green-50">
                              <CheckCheck size={13} />
                            </button>
                          )}
                          {dep.statut === "VERIFIEE" && depasse && (
                            <button onClick={() => setModal({ type: "se", dep })}
                              title="Transmettre au SE"
                              className="rounded-lg p-1.5 text-purple-600 hover:bg-purple-50">
                              <ArrowUpRight size={13} />
                            </button>
                          )}

                          {/* Rejeter (SOUMISE ou VERIFIEE) */}
                          {(dep.statut === "SOUMISE" || dep.statut === "VERIFIEE") && (
                            <button onClick={() => setModal({ type: "rejeter", dep })}
                              title="Rejeter"
                              className="rounded-lg p-1.5 text-red-500 hover:bg-red-50">
                              <X size={13} />
                            </button>
                          )}
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
      {modal?.type === "detail"   && <ModalDetail dep={modal.dep} onClose={() => setModal(null)} />}
      {modal?.type === "verifier" && (
        <ModalVerifier dep={modal.dep} loading={mutVerifier.isPending}
          onConfirm={() => mutVerifier.mutate(modal.dep.id)}
          onClose={() => setModal(null)} />
      )}
      {modal?.type === "valider"  && (
        <ModalValider dep={modal.dep} loading={mutValider.isPending}
          onConfirm={() => mutValider.mutate(modal.dep.id)}
          onClose={() => setModal(null)} />
      )}
      {modal?.type === "se"       && (
        <ModalConfirmSE dep={modal.dep} loading={mutSE.isPending}
          onConfirm={() => mutSE.mutate(modal.dep.id)}
          onClose={() => setModal(null)} />
      )}
      {modal?.type === "rejeter"  && (
        <ModalRejet dep={modal.dep} loading={mutRejeter.isPending}
          onConfirm={(motif) => mutRejeter.mutate({ id: modal.dep.id, motif })}
          onClose={() => setModal(null)} />
      )}
    </RoleGate>
  );
}
