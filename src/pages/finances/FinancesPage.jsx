import { financesApi } from "@/api/finances.api";
import { projetsApi } from "@/api/projets.api";
import useAuthStore from "@/stores/auth.store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Wallet } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const STATUT_DEPENSE_COLORS = {
  BROUILLON: "bg-gray-100 text-gray-600",
  SOUMISE: "bg-blue-100 text-blue-700",
  VERIFIEE: "bg-yellow-100 text-yellow-700",
  EN_APPROBATION_SE: "bg-orange-100 text-orange-700",
  VALIDEE: "bg-green-100 text-green-700",
  REJETEE: "bg-red-100 text-red-600",
  ANNULEE: "bg-gray-100 text-gray-400",
};

const STATUT_DEPENSE_LABELS = {
  BROUILLON: "Brouillon",
  SOUMISE: "Soumise",
  VERIFIEE: "Vérifiée",
  EN_APPROBATION_SE: "Approbation SE",
  VALIDEE: "Validée",
  REJETEE: "Rejetée",
  ANNULEE: "Annulée",
};

const STATUT_AVANCE_LABELS = {
  EN_COURS: "En cours",
  PARTIELLEMENT_JUSTIFIEE: "Part. justifiée",
  SOLDEE: "Soldée",
};

const TRANSITIONS_DEPENSE = {
  BROUILLON: ["SOUMISE"],
  SOUMISE: ["VERIFIEE", "REJETEE"],
  VERIFIEE: ["EN_APPROBATION_SE", "REJETEE"],
  EN_APPROBATION_SE: ["VALIDEE", "REJETEE"],
};

function StatusBadge({ statut, labels, colors }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[statut] ?? "bg-gray-100 text-gray-600"}`}>
      {labels[statut] ?? statut}
    </span>
  );
}

function ProjetSelector({ projets, value, onChange }) {
  return (
    <div className="relative w-full max-w-sm">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 pr-10 text-sm text-gray-700 shadow-sm focus:border-green-500 focus:outline-none"
      >
        <option value="">— Choisir un projet —</option>
        {projets.map((p) => (
          <option key={p.id} value={p.id}>{p.code} — {p.titre}</option>
        ))}
      </select>
      <ChevronDown size={16} className="pointer-events-none absolute right-3 top-3 text-gray-400" />
    </div>
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

export default function FinancesPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.roles?.includes("ROLE_ADMIN");
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("depenses");
  const [selectedProjetId, setSelectedProjetId] = useState("");

  const { data: projetsData } = useQuery({
    queryKey: ["projets"],
    queryFn: projetsApi.getAll,
  });
  const projets = projetsData?.data ?? [];

  const { data: depensesData, isLoading: loadingDepenses } = useQuery({
    queryKey: ["depenses", selectedProjetId],
    queryFn: () => financesApi.getDepensesByProjet(selectedProjetId),
    enabled: !!selectedProjetId && tab === "depenses",
  });
  const depenses = depensesData?.data ?? [];

  const { data: avancesData, isLoading: loadingAvances } = useQuery({
    queryKey: ["avances", selectedProjetId],
    queryFn: () => financesApi.getAvancesByProjet(selectedProjetId),
    enabled: !!selectedProjetId && tab === "avances",
  });
  const avances = avancesData?.data ?? [];

  const { mutate: changerStatutDepense, isPending } = useMutation({
    mutationFn: ({ id, statut }) =>
      financesApi.changerStatutDepense(id, statut, user.userId, ""),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["depenses", selectedProjetId] });
      toast.success("Statut de la dépense mis à jour");
    },
    onError: (err) => toast.error(err.response?.data?.message ?? "Erreur"),
  });

  const { mutate: annuler } = useMutation({
    mutationFn: (id) => financesApi.annulerDepense(id, "Annulé par admin", user.userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["depenses", selectedProjetId] });
      toast.success("Dépense annulée");
    },
    onError: (err) => toast.error(err.response?.data?.message ?? "Erreur"),
  });

  const totalDepenses = depenses.reduce((sum, d) => sum + (d.montant ?? 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Finances</h1>
        <p className="mt-1 text-sm text-gray-500">Dépenses et avances par projet</p>
      </div>

      {/* Onglets */}
      <div className="flex gap-2 rounded-xl bg-gray-100 p-1 w-fit">
        <OngletBtn active={tab === "depenses"} onClick={() => setTab("depenses")}>Dépenses</OngletBtn>
        <OngletBtn active={tab === "avances"} onClick={() => setTab("avances")}>Avances</OngletBtn>
      </div>

      <ProjetSelector projets={projets} value={selectedProjetId} onChange={setSelectedProjetId} />

      {selectedProjetId && tab === "depenses" && (
        <div className="space-y-3">
          {depenses.length > 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 shadow-sm w-fit">
              <Wallet size={16} className="text-orange-500" />
              <span className="text-sm text-gray-600">Total :</span>
              <span className="text-sm font-bold text-gray-900">
                {new Intl.NumberFormat("fr-SN").format(totalDepenses)} F
              </span>
            </div>
          )}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            {loadingDepenses ? (
              <div className="divide-y divide-gray-100">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-6 py-4">
                    <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                    <div className="ml-auto h-4 w-24 animate-pulse rounded bg-gray-200" />
                  </div>
                ))}
              </div>
            ) : depenses.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-gray-400">Aucune dépense pour ce projet.</div>
            ) : (
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">N° Pièce</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Libellé</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Bénéficiaire</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Montant</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Statut</th>
                    {isAdmin && (
                      <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {depenses.map((dep) => (
                    <tr key={dep.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-xs font-mono text-gray-600">{dep.numeroPiece}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{dep.libelle}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{dep.beneficiaire ?? "—"}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {new Intl.NumberFormat("fr-SN").format(dep.montant)} {dep.devise}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">{dep.dateDepense}</td>
                      <td className="px-6 py-4">
                        <StatusBadge statut={dep.statut} labels={STATUT_DEPENSE_LABELS} colors={STATUT_DEPENSE_COLORS} />
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {(TRANSITIONS_DEPENSE[dep.statut] ?? []).map((nextStatut) => (
                              <button
                                key={nextStatut}
                                disabled={isPending}
                                onClick={() => changerStatutDepense({ id: dep.id, statut: nextStatut })}
                                className="rounded-lg border border-gray-200 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                              >
                                {STATUT_DEPENSE_LABELS[nextStatut]}
                              </button>
                            ))}
                            {["BROUILLON", "SOUMISE"].includes(dep.statut) && (
                              <button
                                onClick={() => annuler(dep.id)}
                                className="rounded-lg border border-red-100 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                              >
                                Annuler
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
        </div>
      )}

      {selectedProjetId && tab === "avances" && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {loadingAvances ? (
            <div className="divide-y divide-gray-100">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4">
                  <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                  <div className="ml-auto h-4 w-24 animate-pulse rounded bg-gray-200" />
                </div>
              ))}
            </div>
          ) : avances.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-gray-400">Aucune avance pour ce projet.</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Motif</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Montant</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Justifié</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Date octroi</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {avances.map((av) => (
                  <tr key={av.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900">{av.motif}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {new Intl.NumberFormat("fr-SN").format(av.montant)} F
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {av.montantJustifie != null
                        ? new Intl.NumberFormat("fr-SN").format(av.montantJustifie) + " F"
                        : "—"}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">{av.dateOctroi}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                        {STATUT_AVANCE_LABELS[av.statut] ?? av.statut}
                      </span>
                    </td>
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
