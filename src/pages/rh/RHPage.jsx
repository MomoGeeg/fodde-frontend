import { rhApi } from "@/api/rh.api";
import useAuthStore from "@/stores/auth.store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const STATUT_EMPLOYE_COLORS = {
  ACTIF: "bg-green-100 text-green-700",
  EN_CONGE: "bg-blue-100 text-blue-700",
  SUSPENDU: "bg-orange-100 text-orange-700",
  PARTI: "bg-red-100 text-red-600",
};

const STATUT_EMPLOYE_LABELS = {
  ACTIF: "Actif",
  EN_CONGE: "En congé",
  SUSPENDU: "Suspendu",
  PARTI: "Parti",
};

const STATUT_CONGE_COLORS = {
  EN_ATTENTE: "bg-yellow-100 text-yellow-700",
  VALIDE_N1: "bg-blue-100 text-blue-700",
  APPROUVE: "bg-green-100 text-green-700",
  REJETE: "bg-red-100 text-red-600",
  ANNULE: "bg-gray-100 text-gray-500",
};

const STATUT_CONGE_LABELS = {
  EN_ATTENTE: "En attente",
  VALIDE_N1: "Validé N1",
  APPROUVE: "Approuvé",
  REJETE: "Rejeté",
  ANNULE: "Annulé",
};

const TYPE_CONGE_LABELS = {
  ANNUEL: "Annuel",
  MALADIE: "Maladie",
  MATERNITE: "Maternité",
  PATERNITE: "Paternité",
  SANS_SOLDE: "Sans solde",
  RECUPERATION: "Récupération",
  MISSION: "Mission",
};

function StatusBadge({ statut, labels, colors }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[statut] ?? "bg-gray-100 text-gray-600"}`}
    >
      {labels[statut] ?? statut}
    </span>
  );
}

function OngletBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${active ? "bg-white border border-gray-200 text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
    >
      {children}
    </button>
  );
}

export default function RHPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.roles?.includes("ROLE_ADMIN");
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("employes");

  const { data: employesData, isLoading: loadingEmployes } = useQuery({
    queryKey: ["employes"],
    queryFn: rhApi.getEmployes,
    enabled: tab === "employes",
  });
  const employes = employesData?.data ?? [];

  const { data: congesData, isLoading: loadingConges } = useQuery({
    queryKey: ["conges-en-attente"],
    queryFn: rhApi.getCongesEnAttente,
    enabled: tab === "conges",
  });
  const conges = congesData?.data ?? [];

  const { mutate: changerStatutEmploye, isPending: pendingStatutEmploye } =
    useMutation({
      mutationFn: ({ id, statut }) => rhApi.changerStatutEmploye(id, statut),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["employes"] });
        toast.success("Statut mis à jour");
      },
      onError: (err) => toast.error(err.response?.data?.message ?? "Erreur"),
    });

  const { mutate: validerN1, isPending: pendingN1 } = useMutation({
    mutationFn: (id) => rhApi.validerN1(id, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conges-en-attente"] });
      toast.success("Congé validé (N1)");
    },
    onError: (err) => toast.error(err.response?.data?.message ?? "Erreur"),
  });

  const { mutate: approuverRH, isPending: pendingRH } = useMutation({
    mutationFn: (id) => rhApi.approuverRH(id, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conges-en-attente"] });
      toast.success("Congé approuvé");
    },
    onError: (err) => toast.error(err.response?.data?.message ?? "Erreur"),
  });

  const { mutate: rejeter } = useMutation({
    mutationFn: (id) => rhApi.rejeterConge(id, user.id, ""),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conges-en-attente"] });
      toast.success("Congé rejeté");
    },
    onError: (err) => toast.error(err.response?.data?.message ?? "Erreur"),
  });

  const isPendingAction = pendingStatutEmploye || pendingN1 || pendingRH;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Ressources Humaines
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Gestion des employés et des congés
        </p>
      </div>

      <div className="flex gap-2 rounded-xl bg-gray-100 p-1 w-fit">
        <OngletBtn
          active={tab === "employes"}
          onClick={() => setTab("employes")}
        >
          Employés {employes.length > 0 && `(${employes.length})`}
        </OngletBtn>
        <OngletBtn active={tab === "conges"} onClick={() => setTab("conges")}>
          Congés en attente {conges.length > 0 && `(${conges.length})`}
        </OngletBtn>
      </div>

      {tab === "employes" && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {loadingEmployes ? (
            <div className="divide-y divide-gray-100">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4">
                  <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-36 animate-pulse rounded bg-gray-200" />
                    <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
                  </div>
                  <div className="ml-auto h-6 w-16 animate-pulse rounded-full bg-gray-200" />
                </div>
              ))}
            </div>
          ) : employes.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Users className="mx-auto mb-3 text-gray-300" size={40} />
              <p className="text-sm text-gray-400">Aucun employé trouvé.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Employé
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Matricule
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Poste
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Département
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
                {employes.map((emp) => (
                  <tr
                    key={emp.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">
                          {emp.prenom?.[0]}
                          {emp.nom?.[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {emp.prenom} {emp.nom}
                          </p>
                          <p className="text-xs text-gray-400">
                            {emp.telephone ?? ""}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-gray-600">
                      {emp.matricule}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {emp.poste ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {emp.departement ?? "—"}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge
                        statut={emp.statut}
                        labels={STATUT_EMPLOYE_LABELS}
                        colors={STATUT_EMPLOYE_COLORS}
                      />
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {emp.statut === "ACTIF" && (
                            <button
                              disabled={isPendingAction}
                              onClick={() =>
                                changerStatutEmploye({
                                  id: emp.id,
                                  statut: "SUSPENDU",
                                })
                              }
                              className="rounded-lg border border-orange-100 px-2 py-1 text-xs font-medium text-orange-600 hover:bg-orange-50 disabled:opacity-50 transition-colors"
                            >
                              Suspendre
                            </button>
                          )}
                          {emp.statut === "SUSPENDU" && (
                            <button
                              disabled={isPendingAction}
                              onClick={() =>
                                changerStatutEmploye({
                                  id: emp.id,
                                  statut: "ACTIF",
                                })
                              }
                              className="rounded-lg border border-green-100 px-2 py-1 text-xs font-medium text-green-600 hover:bg-green-50 disabled:opacity-50 transition-colors"
                            >
                              Réactiver
                            </button>
                          )}
                          {emp.statut === "INACTIF" && (
                            <button
                              disabled={isPendingAction}
                              onClick={() =>
                                changerStatutEmploye({
                                  id: emp.id,
                                  statut: "ACTIF",
                                })
                              }
                              className="rounded-lg border border-green-100 px-2 py-1 text-xs font-medium text-green-600 hover:bg-green-50 disabled:opacity-50 transition-colors"
                            >
                              Activer
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "conges" && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {loadingConges ? (
            <div className="divide-y divide-gray-100">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4">
                  <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
                  <div className="ml-auto h-4 w-24 animate-pulse rounded bg-gray-200" />
                </div>
              ))}
            </div>
          ) : conges.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-gray-400">
              Aucune demande de congé en attente.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Motif
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Période
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Nb jours
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
                {conges.map((cg) => (
                  <tr
                    key={cg.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                        {TYPE_CONGE_LABELS[cg.typeConge] ?? cg.typeConge}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {cg.motif ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {cg.dateDebut} → {cg.dateFin}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {cg.nbJours ?? "—"} j
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge
                        statut={cg.statut}
                        labels={STATUT_CONGE_LABELS}
                        colors={STATUT_CONGE_COLORS}
                      />
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {cg.statut === "EN_ATTENTE" && (
                            <button
                              disabled={isPendingAction}
                              onClick={() => validerN1(cg.id)}
                              className="rounded-lg border border-blue-100 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-50 transition-colors"
                            >
                              Valider N1
                            </button>
                          )}
                          {cg.statut === "VALIDE_N1" && (
                            <button
                              disabled={isPendingAction}
                              onClick={() => approuverRH(cg.id)}
                              className="rounded-lg border border-green-100 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-50 disabled:opacity-50 transition-colors"
                            >
                              Approuver RH
                            </button>
                          )}
                          {["EN_ATTENTE", "VALIDE_N1"].includes(cg.statut) && (
                            <button
                              onClick={() => rejeter(cg.id)}
                              className="rounded-lg border border-red-100 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                            >
                              Rejeter
                            </button>
                          )}
                        </div>
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
