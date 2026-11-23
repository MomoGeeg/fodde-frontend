import api from "@/api/axios";
import { projetsApi } from "@/api/projets.api";
import { LIBELLES_ROLES } from "@/lib/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const tableau = (r) => (Array.isArray(r.data) ? r.data : []);
const libelles = (roles = []) => roles.map((r) => LIBELLES_ROLES[r] ?? r).join(", ");

/** Équipe du projet : le chargé de projet (ou le RP) la constitue. */
export default function TabEquipe({ projet, peutGerer }) {
  const queryClient = useQueryClient();
  const [choix, setChoix] = useState("");

  const { data: equipe = [], isLoading } = useQuery({
    queryKey: ["projet", projet.id, "equipe"],
    queryFn: () => api.get(`/api/projets/${projet.id}/montage`).then((r) => r.data?.equipe ?? []),
  });
  const { data: personnes = [] } = useQuery({
    queryKey: ["projets", "personnes"],
    queryFn: () => api.get("/api/projets/personnes").then(tableau),
    enabled: peutGerer,
  });

  const rafraichir = () => queryClient.invalidateQueries({ queryKey: ["projet", projet.id, "equipe"] });
  const ajouter = useMutation({
    mutationFn: (userId) => projetsApi.ajouterMembre(projet.id, userId),
    onSuccess: () => {
      setChoix("");
      rafraichir();
      toast.success("Membre ajouté à l'équipe");
    },
    onError: (e) => toast.error(e.response?.data?.message ?? e.message ?? "Ajout impossible"),
  });
  const retirer = useMutation({
    mutationFn: (userId) => projetsApi.retirerMembre(projet.id, userId),
    onSuccess: () => {
      rafraichir();
      toast.success("Membre retiré de l'équipe");
    },
    onError: (e) => toast.error(e.response?.data?.message ?? e.message ?? "Retrait impossible"),
  });

  const dansEquipe = new Set(equipe.map((m) => m.userId));
  const disponibles = personnes.filter((p) => !dansEquipe.has(p.id));
  const fixe = (m) => m.chefProjet || m.userId === projet.responsableId;

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-6 py-4">
        <h3 className="text-sm font-semibold text-gray-700">Équipe du projet ({equipe.length})</h3>
        {peutGerer && (
          <form
            className="flex flex-wrap items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (choix) ajouter.mutate(choix);
            }}
          >
            <select
              value={choix}
              onChange={(e) => setChoix(e.target.value)}
              className="w-64 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-green-500 focus:outline-none"
            >
              <option value="">Choisir un membre</option>
              {disponibles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nom}
                  {p.roles?.length ? ` (${libelles(p.roles)})` : ""}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={!choix || ajouter.isPending}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
            >
              <Plus size={15} />
              Ajouter
            </button>
          </form>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3 p-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-5 w-64 animate-pulse rounded bg-gray-200" />
          ))}
        </div>
      ) : equipe.length === 0 ? (
        <p className="px-6 py-8 text-center text-sm text-gray-400">Aucun membre</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {equipe.map((m) => (
            <li key={m.userId} className="flex items-center gap-4 px-6 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {m.nom}
                  {m.chefProjet && (
                    <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      Chargé de projet
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-500">{libelles(m.roles)}</p>
              </div>
              {peutGerer && !fixe(m) && (
                <button
                  type="button"
                  onClick={() => retirer.mutate(m.userId)}
                  disabled={retirer.isPending}
                  title="Retirer de l'équipe"
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
