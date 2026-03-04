import { activitesApi } from "@/api/activites.api";
import { projetsApi } from "@/api/projets.api";
import useAuthStore from "@/stores/auth.store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckSquare, ChevronDown } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const STATUT_COLORS = {
  PLANIFIEE: "bg-gray-100 text-gray-600",
  EN_COURS: "bg-blue-100 text-blue-700",
  REALISEE: "bg-green-100 text-green-700",
  ANNULEE: "bg-red-100 text-red-600",
  EN_RETARD: "bg-orange-100 text-orange-700",
};

const STATUT_LABELS = {
  PLANIFIEE: "Planifiée",
  EN_COURS: "En cours",
  REALISEE: "Réalisée",
  ANNULEE: "Annulée",
  EN_RETARD: "En retard",
};

function StatusBadge({ statut }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUT_COLORS[statut] ?? "bg-gray-100 text-gray-600"}`}
    >
      {STATUT_LABELS[statut] ?? statut}
    </span>
  );
}

function ProgressBar({ value }) {
  const pct = Math.min(100, Math.max(0, value ?? 0));
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 rounded-full bg-gray-200">
        <div
          className="h-1.5 rounded-full bg-green-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-gray-500">{pct}%</span>
    </div>
  );
}

export default function ActivitesList() {
  const { user } = useAuthStore();
  const isAdmin = user?.roles?.includes("ROLE_ADMIN");
  const queryClient = useQueryClient();
  const [selectedProjetId, setSelectedProjetId] = useState("");

  const { data: projetsData } = useQuery({
    queryKey: ["projets"],
    queryFn: projetsApi.getAll,
  });
  const projets = projetsData ?? [];

  const {
    data: activitesData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["activites", selectedProjetId],
    queryFn: () => activitesApi.getByProjet(selectedProjetId),
    enabled: !!selectedProjetId,
  });
  const activites = activitesData ?? [];

  const { mutate: demarrer, isPending } = useMutation({
    mutationFn: (id) => activitesApi.demarrer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["activites", selectedProjetId],
      });
      toast.success("Activité démarrée");
    },
    onError: (err) => toast.error(err.message ?? "Erreur"),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Activités</h1>
        <p className="mt-1 text-sm text-gray-500">
          Sélectionnez un projet pour voir ses activités
        </p>
      </div>

      {/* Sélecteur de projet */}
      <div className="relative w-full max-w-sm">
        <select
          value={selectedProjetId}
          onChange={(e) => setSelectedProjetId(e.target.value)}
          className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 pr-10 text-sm text-gray-700 shadow-sm focus:border-green-500 focus:outline-none"
        >
          <option value="">— Choisir un projet —</option>
          {projets.map((p) => (
            <option key={p.id} value={p.id}>
              {p.code} — {p.titre}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-3 top-3 text-gray-400"
        />
      </div>

      {/* Table des activités */}
      {selectedProjetId && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="divide-y divide-gray-100">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4">
                  <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
                  <div className="ml-auto h-4 w-24 animate-pulse rounded bg-gray-200" />
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="px-6 py-12 text-center text-sm text-red-500">
              Erreur lors du chargement.
            </div>
          ) : activites.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <CheckSquare className="mx-auto mb-3 text-gray-300" size={40} />
              <p className="text-sm text-gray-400">
                Aucune activité pour ce projet.
              </p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Titre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Période prévue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Avancement
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Statut
                  </th>
                  {isAdmin && (
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {activites.map((act) => (
                  <tr
                    key={act.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">
                        {act.titre}
                      </p>
                      {act.description && (
                        <p className="text-xs text-gray-400 truncate max-w-xs">
                          {act.description}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {act.datePrevuDebut} → {act.datePrevuFin}
                    </td>
                    <td className="px-6 py-4">
                      <ProgressBar value={act.tauxAvancement} />
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge statut={act.statut} />
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-right">
                        {act.statut === "PLANIFIEE" && (
                          <button
                            disabled={isPending}
                            onClick={() => demarrer(act.id)}
                            className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50 transition-colors"
                          >
                            Démarrer
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
