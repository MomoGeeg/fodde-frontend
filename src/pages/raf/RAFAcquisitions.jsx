import { rafApi } from "@/api/raf.api";
import RoleGate from "@/components/shared/RoleGate";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Package, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const fmt     = (n) => new Intl.NumberFormat("fr-SN").format(n) + " F";
const fmtDate = (d) => new Date(d).toLocaleDateString("fr-FR");

const STATUTS = {
  EN_ATTENTE: { label: "En attente", cls: "bg-orange-100 text-orange-700" },
  VALIDEE:    { label: "Validée",    cls: "bg-green-100 text-green-700"   },
  REJETEE:    { label: "Rejetée",    cls: "bg-red-100 text-red-700"       },
};

const CATEGORIES = {
  EQUIPEMENT:      "Équipement",
  MATERIEL_AGRICOLE: "Matériel agricole",
  MATERIEL_MEDICAL:  "Matériel médical",
  INFORMATIQUE:      "Informatique",
};

function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded bg-gray-200 ${className}`} />;
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100"><X size={16} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function ModalConfirmValider({ acq, onConfirm, onClose, loading }) {
  return (
    <Modal title="Valider l'acquisition" onClose={onClose}>
      <p className="text-sm text-gray-700">
        Vous validez l'acquisition de{" "}
        <strong>{acq.designation}</strong> pour un montant de{" "}
        <strong className="text-emerald-700">{fmt(acq.valeur)}</strong>.
      </p>
      <p className="mt-2 text-xs text-gray-600">
        Projet : <strong>{acq.projetCode}</strong> — soumis par {acq.soumisPar}
      </p>
      <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 border border-amber-200">
        Cette action est <strong>irréversible</strong>. Une dépense d'investissement sera
        automatiquement créée dans le module Financier.
      </p>
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} disabled={loading} className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium hover:bg-gray-50 disabled:opacity-50">
          Annuler
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? "Validation…" : <><Check size={13} /> Valider</>}
        </button>
      </div>
    </Modal>
  );
}

function ModalRejet({ acq, onConfirm, onClose, loading }) {
  const [motif, setMotif] = useState("");
  return (
    <Modal title="Rejeter l'acquisition" onClose={onClose}>
      <p className="text-sm text-gray-700">
        Rejet de l'acquisition <strong>{acq.designation}</strong> ({fmt(acq.valeur)}).
      </p>
      <div className="mt-3">
        <label className="block text-[11px] font-medium text-gray-700 mb-1">
          Motif de rejet <span className="text-red-500">*</span>
        </label>
        <textarea
          value={motif}
          onChange={(e) => setMotif(e.target.value)}
          rows={3}
          placeholder="Indiquez le motif du rejet…"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-red-400 focus:outline-none resize-none"
        />
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button onClick={onClose} disabled={loading} className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium hover:bg-gray-50 disabled:opacity-50">
          Annuler
        </button>
        <button
          onClick={() => motif.trim() && onConfirm(motif.trim())}
          disabled={loading || !motif.trim()}
          className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? "Rejet…" : <><X size={13} /> Rejeter</>}
        </button>
      </div>
    </Modal>
  );
}

export default function RAFAcquisitions() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(null);
  const [filtreStatut, setFiltreStatut] = useState("");

  const { data: acquisitions = [], isLoading } = useQuery({
    queryKey: ["raf-acquisitions"],
    queryFn: rafApi.getAcquisitions,
    staleTime: 5 * 60_000,
  });

  const mutValider = useMutation({
    mutationFn: (id) => rafApi.validerAcquisition(id),
    onSuccess: () => { toast.success("Acquisition validée — dépense d'investissement créée"); qc.invalidateQueries({ queryKey: ["raf-acquisitions"] }); setModal(null); },
    onError:   () => toast.error("Erreur lors de la validation"),
  });

  const mutRejeter = useMutation({
    mutationFn: ({ id, motif }) => rafApi.rejeterAcquisition(id, motif),
    onSuccess: () => { toast.success("Acquisition rejetée"); qc.invalidateQueries({ queryKey: ["raf-acquisitions"] }); setModal(null); },
    onError:   () => toast.error("Erreur lors du rejet"),
  });

  const acqFiltrees = filtreStatut
    ? acquisitions.filter((a) => a.statut === filtreStatut)
    : acquisitions;

  const totalEnAttente = acquisitions
    .filter((a) => a.statut === "EN_ATTENTE")
    .reduce((s, a) => s + a.valeur, 0);

  return (
    <RoleGate allowedRoles={["ROLE_RAF", "ROLE_SE"]}>
      {/* Stats */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total",         value: isLoading ? "…" : acquisitions.length,                                        color: "text-gray-900" },
          { label: "En attente",    value: isLoading ? "…" : acquisitions.filter((a) => a.statut === "EN_ATTENTE").length, color: "text-orange-600" },
          { label: "Valeur totale en attente", value: isLoading ? "…" : fmt(totalEnAttente),                              color: "text-emerald-700" },
          { label: "Validées",      value: isLoading ? "…" : acquisitions.filter((a) => a.statut === "VALIDEE").length,  color: "text-green-700" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-gray-200 bg-white px-4 py-3">
            <p className="text-[10px] text-gray-500">{s.label}</p>
            {isLoading ? (
              <div className="animate-pulse rounded bg-gray-200 h-6 w-16 mt-1" />
            ) : (
              <p className={`text-sm font-bold ${s.color} tabular-nums`}>{s.value}</p>
            )}
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="mb-4 flex items-center gap-3">
        <label className="text-[11px] font-medium text-gray-500">Statut :</label>
        {[
          { value: "",           label: "Tous"       },
          { value: "EN_ATTENTE", label: "En attente" },
          { value: "VALIDEE",    label: "Validées"   },
          { value: "REJETEE",    label: "Rejetées"   },
        ].map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFiltreStatut(opt.value)}
            className={`rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${
              filtreStatut === opt.value
                ? "bg-emerald-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Tableau */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-[11px] text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3">Code actif</th>
                <th className="px-4 py-3">Désignation</th>
                <th className="px-4 py-3">Catégorie</th>
                <th className="px-4 py-3">Projet</th>
                <th className="px-4 py-3 text-right">Valeur</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Soumis par</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      {Array.from({ length: 9 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                      ))}
                    </tr>
                  ))
                : acqFiltrees.length === 0
                ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                        <Package className="mx-auto mb-2 text-gray-300" size={28} />
                        Aucune acquisition à afficher
                      </td>
                    </tr>
                  )
                : acqFiltrees.map((a) => {
                    const st = STATUTS[a.statut];
                    return (
                      <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span className="font-mono text-[11px] text-gray-700">{a.codeActif}</span>
                        </td>
                        <td className="px-4 py-3 max-w-[180px]">
                          <p className="font-medium text-gray-800 truncate">{a.designation}</p>
                          <p className="text-[10px] text-gray-400 truncate">{a.justification}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600">
                            {CATEGORIES[a.categorie] ?? a.categorie}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[11px] text-gray-700">
                            {a.projetCode}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900 tabular-nums">
                          {fmt(a.valeur)}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{fmtDate(a.dateAcquisition)}</td>
                        <td className="px-4 py-3 text-gray-700">{a.soumisPar}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded px-2 py-0.5 text-[11px] font-semibold ${st?.cls ?? "bg-gray-100 text-gray-600"}`}>
                            {st?.label ?? a.statut}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            {a.statut === "EN_ATTENTE" && (
                              <>
                                <button
                                  onClick={() => setModal({ type: "valider", acq: a })}
                                  title="Valider"
                                  className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50"
                                >
                                  <Check size={14} />
                                </button>
                                <button
                                  onClick={() => setModal({ type: "rejeter", acq: a })}
                                  title="Rejeter"
                                  className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                                >
                                  <X size={14} />
                                </button>
                              </>
                            )}
                            {a.statut !== "EN_ATTENTE" && (
                              <span className="text-[10px] text-gray-400">—</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>
      </div>

      {modal?.type === "valider" && (
        <ModalConfirmValider
          acq={modal.acq}
          loading={mutValider.isPending}
          onConfirm={() => mutValider.mutate(modal.acq.id)}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "rejeter" && (
        <ModalRejet
          acq={modal.acq}
          loading={mutRejeter.isPending}
          onConfirm={(motif) => mutRejeter.mutate({ id: modal.acq.id, motif })}
          onClose={() => setModal(null)}
        />
      )}
    </RoleGate>
  );
}
