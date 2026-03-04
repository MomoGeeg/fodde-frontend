import { rafApi } from "@/api/raf.api";
import RoleGate from "@/components/shared/RoleGate";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, MapPin, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const fmt     = (n) => new Intl.NumberFormat("fr-SN").format(n) + " F";
const fmtDate = (d) => new Date(d).toLocaleDateString("fr-FR");

const STATUTS = {
  SOUMISE:      { label: "Soumise",       cls: "bg-blue-100 text-blue-700"    },
  APPROUVEE_N1: { label: "Approuvée N+1", cls: "bg-indigo-100 text-indigo-700"},
  VALIDEE_RAF:  { label: "Validée RAF",   cls: "bg-green-100 text-green-700"  },
  REJETEE:      { label: "Rejetée",       cls: "bg-red-100 text-red-700"      },
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

function ModalConfirmValider({ mission, onConfirm, onClose, loading }) {
  return (
    <Modal title="Valider la mission" onClose={onClose}>
      <p className="text-sm text-gray-700">
        Vous êtes sur le point de <strong>valider</strong> la mission de{" "}
        <strong>{mission.employe}</strong> à <strong>{mission.destination}</strong> du{" "}
        {fmtDate(mission.dateDebut)} au {fmtDate(mission.dateFin)}.
      </p>
      <p className="mt-2 text-xs text-gray-500">
        Budget estimé : <strong>{fmt(mission.budgetEstime)}</strong>
      </p>
      <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 border border-amber-200">
        Cette action est <strong>irréversible</strong>. Une ligne de dépense "Frais de mission"
        sera automatiquement créée dans le module Financier.
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

function ModalRejet({ mission, onConfirm, onClose, loading }) {
  const [motif, setMotif] = useState("");
  return (
    <Modal title="Rejeter la mission" onClose={onClose}>
      <p className="text-sm text-gray-700">
        Rejet de la mission de <strong>{mission.employe}</strong> à{" "}
        <strong>{mission.destination}</strong>.
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
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400 resize-none"
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

export default function RAFMissions() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(null);
  const [filtreStatut, setFiltreStatut] = useState("");

  const { data: missions = [], isLoading } = useQuery({
    queryKey: ["raf-missions"],
    queryFn: rafApi.getMissions,
    staleTime: 5 * 60_000,
  });

  const mutValider = useMutation({
    mutationFn: (id) => rafApi.validerMission(id),
    onSuccess: () => { toast.success("Mission validée — dépense créée automatiquement"); qc.invalidateQueries({ queryKey: ["raf-missions"] }); setModal(null); },
    onError:   () => toast.error("Erreur lors de la validation"),
  });

  const mutRejeter = useMutation({
    mutationFn: ({ id, motif }) => rafApi.rejeterMission(id, motif),
    onSuccess: () => { toast.success("Mission rejetée"); qc.invalidateQueries({ queryKey: ["raf-missions"] }); setModal(null); },
    onError:   () => toast.error("Erreur lors du rejet"),
  });

  const missionsFiltrees = filtreStatut
    ? missions.filter((m) => m.statut === filtreStatut)
    : missions;

  const enAttente = missions.filter((m) =>
    ["SOUMISE", "APPROUVEE_N1"].includes(m.statut)
  ).length;

  return (
    <RoleGate allowedRoles={["ROLE_RAF", "ROLE_SE"]}>
      {/* Stats rapides */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total",          value: missions.length,                                          color: "text-gray-900" },
          { label: "En attente RAF", value: enAttente,                                                color: enAttente > 0 ? "text-orange-600" : "text-gray-900" },
          { label: "Validées",       value: missions.filter((m) => m.statut === "VALIDEE_RAF").length, color: "text-emerald-700" },
          { label: "Rejetées",       value: missions.filter((m) => m.statut === "REJETEE").length,    color: "text-red-600" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-gray-200 bg-white px-4 py-3">
            <p className="text-[10px] text-gray-500">{s.label}</p>
            {isLoading ? (
              <div className="animate-pulse rounded bg-gray-200 h-6 w-8 mt-1" />
            ) : (
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            )}
          </div>
        ))}
      </div>

      {/* Filtre */}
      <div className="mb-4 flex items-center gap-3">
        <label className="text-[11px] font-medium text-gray-500">Statut :</label>
        {[
          { value: "",             label: "Tous"          },
          { value: "SOUMISE",      label: "Soumises"      },
          { value: "APPROUVEE_N1", label: "Approuvées N+1"},
          { value: "VALIDEE_RAF",  label: "Validées RAF"  },
          { value: "REJETEE",      label: "Rejetées"      },
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
                <th className="px-4 py-3">Employé</th>
                <th className="px-4 py-3">Projet</th>
                <th className="px-4 py-3">Destination</th>
                <th className="px-4 py-3">Dates</th>
                <th className="px-4 py-3">Motif</th>
                <th className="px-4 py-3 text-right">Budget estimé</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <Skeleton className="h-4 w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                : missionsFiltrees.length === 0
                ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                        <MapPin className="mx-auto mb-2 text-gray-300" size={28} />
                        Aucune mission à afficher
                      </td>
                    </tr>
                  )
                : missionsFiltrees.map((m) => {
                    const st = STATUTS[m.statut];
                    const peutValider = m.statut === "APPROUVEE_N1";
                    const peutRejeter = ["SOUMISE", "APPROUVEE_N1"].includes(m.statut);
                    return (
                      <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-800">{m.employe}</p>
                          <p className="text-[10px] text-gray-400">{m.poste}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[11px] text-gray-700">
                            {m.projetCode}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-800">{m.destination}</td>
                        <td className="px-4 py-3 text-gray-600">
                          <p>{fmtDate(m.dateDebut)}</p>
                          {m.dateDebut !== m.dateFin && (
                            <p className="text-[10px] text-gray-400">→ {fmtDate(m.dateFin)}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 max-w-[160px]">
                          <p className="truncate text-gray-700">{m.motif}</p>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900 tabular-nums">
                          {fmt(m.budgetEstime)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded px-2 py-0.5 text-[11px] font-semibold ${st?.cls ?? "bg-gray-100 text-gray-600"}`}>
                            {st?.label ?? m.statut}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            {peutValider && (
                              <button
                                onClick={() => setModal({ type: "valider", mission: m })}
                                title="Valider la mission"
                                className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50"
                              >
                                <Check size={14} />
                              </button>
                            )}
                            {peutRejeter && (
                              <button
                                onClick={() => setModal({ type: "rejeter", mission: m })}
                                title="Rejeter la mission"
                                className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                              >
                                <X size={14} />
                              </button>
                            )}
                            {!peutValider && !peutRejeter && (
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
          mission={modal.mission}
          loading={mutValider.isPending}
          onConfirm={() => mutValider.mutate(modal.mission.id)}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "rejeter" && (
        <ModalRejet
          mission={modal.mission}
          loading={mutRejeter.isPending}
          onConfirm={(motif) => mutRejeter.mutate({ id: modal.mission.id, motif })}
          onClose={() => setModal(null)}
        />
      )}
    </RoleGate>
  );
}
