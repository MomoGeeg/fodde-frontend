import { projetsApi } from "@/api/projets.api";
import { seApi } from "@/api/se.api";
import useAuthStore from "@/stores/auth.store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BarChart3, ChevronDown } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const TYPE_LABELS = { QUANTITATIF: "Quantitatif", QUALITATIF: "Qualitatif" };
const NIVEAU_LABELS = { IMPACT: "Impact", EFFET: "Effet", PRODUIT: "Produit", ACTIVITE: "Activité" };
const STATUT_FORM_COLORS = {
  BROUILLON: "bg-gray-100 text-gray-600",
  PUBLIE: "bg-green-100 text-green-700",
  ARCHIVE: "bg-blue-100 text-blue-700",
};

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

function TauxBar({ value }) {
  const pct = Math.min(100, Math.max(0, value ?? 0));
  const color = pct >= 80 ? "bg-green-500" : pct >= 50 ? "bg-yellow-500" : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 rounded-full bg-gray-200">
        <div className={`h-1.5 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium text-gray-600">{pct.toFixed(0)}%</span>
    </div>
  );
}

export default function SEPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.roles?.includes("ROLE_ADMIN");
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("indicateurs");
  const [selectedProjetId, setSelectedProjetId] = useState("");

  const { data: projetsData } = useQuery({
    queryKey: ["projets"],
    queryFn: projetsApi.getAll,
  });
  const projets = projetsData?.data ?? [];

  const { data: indicateursData, isLoading: loadingInd } = useQuery({
    queryKey: ["indicateurs", selectedProjetId],
    queryFn: () => seApi.getIndicateursByProjet(selectedProjetId),
    enabled: !!selectedProjetId && tab === "indicateurs",
  });
  const indicateurs = indicateursData?.data ?? [];

  const { data: formulairesData, isLoading: loadingForm } = useQuery({
    queryKey: ["formulaires", selectedProjetId],
    queryFn: () => seApi.getFormulairesByProjet(selectedProjetId),
    enabled: !!selectedProjetId && tab === "formulaires",
  });
  const formulaires = formulairesData?.data ?? [];

  const { mutate: publier, isPending } = useMutation({
    mutationFn: (id) => seApi.publierFormulaire(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["formulaires", selectedProjetId] });
      toast.success("Formulaire publié");
    },
    onError: (err) => toast.error(err.response?.data?.message ?? "Erreur"),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Suivi & Évaluation</h1>
        <p className="mt-1 text-sm text-gray-500">Indicateurs et formulaires de collecte par projet</p>
      </div>

      <div className="flex gap-2 rounded-xl bg-gray-100 p-1 w-fit">
        <OngletBtn active={tab === "indicateurs"} onClick={() => setTab("indicateurs")}>Indicateurs</OngletBtn>
        <OngletBtn active={tab === "formulaires"} onClick={() => setTab("formulaires")}>Formulaires</OngletBtn>
      </div>

      {/* Sélecteur projet */}
      <div className="relative w-full max-w-sm">
        <select
          value={selectedProjetId}
          onChange={(e) => setSelectedProjetId(e.target.value)}
          className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 pr-10 text-sm text-gray-700 shadow-sm focus:border-green-500 focus:outline-none"
        >
          <option value="">— Choisir un projet —</option>
          {projets.map((p) => (
            <option key={p.id} value={p.id}>{p.code} — {p.titre}</option>
          ))}
        </select>
        <ChevronDown size={16} className="pointer-events-none absolute right-3 top-3 text-gray-400" />
      </div>

      {selectedProjetId && tab === "indicateurs" && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {loadingInd ? (
            <div className="divide-y divide-gray-100">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4">
                  <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
                  <div className="ml-auto h-4 w-32 animate-pulse rounded bg-gray-200" />
                </div>
              ))}
            </div>
          ) : indicateurs.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <BarChart3 className="mx-auto mb-3 text-gray-300" size={40} />
              <p className="text-sm text-gray-400">Aucun indicateur pour ce projet.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Libellé</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Type / Niveau</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Baseline → Cible</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Réalisation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {indicateurs.map((ind) => (
                  <tr key={ind.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-xs font-mono text-gray-600">{ind.code}</td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">{ind.libelle}</p>
                      <p className="text-xs text-gray-400">{ind.unite}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-gray-600">{TYPE_LABELS[ind.type] ?? ind.type}</p>
                      <p className="text-xs text-gray-400">{NIVEAU_LABELS[ind.niveau] ?? ind.niveau}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {ind.valeurBaseline} → {ind.valeurCible} {ind.unite}
                    </td>
                    <td className="px-6 py-4">
                      <TauxBar value={ind.tauxRealisation} />
                      <p className="text-xs text-gray-400 mt-0.5">
                        Atteint : {ind.valeurAtteinte ?? "—"} {ind.unite}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {selectedProjetId && tab === "formulaires" && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {loadingForm ? (
            <div className="divide-y divide-gray-100">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4">
                  <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
                  <div className="ml-auto h-4 w-24 animate-pulse rounded bg-gray-200" />
                </div>
              ))}
            </div>
          ) : formulaires.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-gray-400">
              Aucun formulaire pour ce projet.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Titre</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Période</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Statut</th>
                  {isAdmin && (
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {formulaires.map((f) => (
                  <tr key={f.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">{f.titre}</p>
                      {f.description && <p className="text-xs text-gray-400 truncate max-w-xs">{f.description}</p>}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {f.dateDebut ?? "—"} → {f.dateFin ?? "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUT_FORM_COLORS[f.statut] ?? "bg-gray-100 text-gray-600"}`}>
                        {f.statut === "BROUILLON" ? "Brouillon" : f.statut === "PUBLIE" ? "Publié" : "Archivé"}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-right">
                        {f.statut === "BROUILLON" && (
                          <button
                            disabled={isPending}
                            onClick={() => publier(f.id)}
                            className="rounded-lg border border-green-100 px-3 py-1 text-xs font-medium text-green-700 hover:bg-green-50 disabled:opacity-50 transition-colors"
                          >
                            Publier
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
