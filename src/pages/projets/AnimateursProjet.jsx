import { animateursApi } from "@/api/animateurs";
import { messageErreur } from "@/lib/erreurs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, UserMinus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

/** Animateurs du projet : le chef de projet ou le RP les affecte et les retire. */
export default function AnimateursProjet({ projet, peutGerer }) {
  const queryClient = useQueryClient();
  const [choix, setChoix] = useState("");
  const cle = ["animateurs", projet.id];

  const { data: animateurs = [], isLoading } = useQuery({
    queryKey: cle,
    queryFn: () => animateursApi.duProjet(projet.id),
  });
  const { data: disponibles = [] } = useQuery({
    queryKey: ["animateurs-disponibles"],
    queryFn: animateursApi.disponibles,
    enabled: peutGerer,
  });
  const libres = disponibles.filter((d) => !animateurs.some((a) => a.id === d.id));

  const affecter = useMutation({
    mutationFn: () => animateursApi.affecter(projet.id, choix),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cle });
      setChoix("");
      toast.success("Animateur ajouté au projet");
    },
    onError: (err) => toast.error(messageErreur(err)),
  });
  const retirer = useMutation({
    mutationFn: (id) => animateursApi.retirer(projet.id, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cle });
      toast.success("Animateur retiré du projet");
    },
    onError: (err) => toast.error(messageErreur(err)),
  });

  return (
    <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 px-4 py-3">
        <h3 className="mr-auto text-sm font-semibold text-gray-800">Animateurs ({animateurs.length})</h3>
        {peutGerer && libres.length > 0 && (
          <>
            <select
              value={choix}
              onChange={(e) => setChoix(e.target.value)}
              className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs focus:border-green-500 focus:outline-none"
            >
              <option value="">Choisir un animateur</option>
              {libres.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nom}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={!choix || affecter.isPending}
              onClick={() => affecter.mutate()}
              className="flex items-center gap-1 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-50"
            >
              <Plus size={13} /> Ajouter
            </button>
          </>
        )}
      </div>
      {isLoading ? (
        <p className="px-4 py-6 text-sm text-gray-400">Chargement...</p>
      ) : animateurs.length ? (
        <ul className="divide-y divide-gray-100">
          {animateurs.map((a) => (
            <li key={a.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
              <span className="flex-1 text-gray-800">{a.nom}</span>
              {peutGerer && (
                <button
                  type="button"
                  title="Retirer du projet"
                  onClick={() => {
                    if (window.confirm(`Retirer ${a.nom} du projet ? Ses activités restent.`)) retirer.mutate(a.id);
                  }}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                >
                  <UserMinus size={14} />
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-4 py-6 text-sm text-gray-400">Aucun animateur sur ce projet.</p>
      )}
    </section>
  );
}
