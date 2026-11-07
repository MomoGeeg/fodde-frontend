import api from "@/api/axios";
import { useQuery } from "@tanstack/react-query";

const dateHeure = (d) =>
  new Date(d).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }).replace(" ", " à ");

/**
 * Historique d'une demande : chaque étape du circuit, qui l'a franchie, quand,
 * avec quel motif. Les demandes traitées avant la mise en place de l'historique
 * n'ont pas toujours l'auteur ni la date : on l'indique au lieu d'inventer.
 *
 * @param {string} url      route du backend, ex. `/api/depenses/{id}/historique`
 * @param {object} statuts  libellés des statuts (STATUTS_DEPENSE…)
 */
export default function HistoriqueDemande({ url, statuts }) {
  const { data: etapes = [], isLoading, isError } = useQuery({
    queryKey: ["historique", url],
    queryFn: () => api.get(url).then((r) => (Array.isArray(r.data) ? r.data : [])),
    enabled: !!url,
    staleTime: 30_000,
  });

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <h3 className="text-sm font-semibold text-gray-900">Historique</h3>
      {isLoading ? (
        <p className="mt-3 text-sm text-gray-500">Chargement…</p>
      ) : isError ? (
        <p className="mt-3 text-sm text-gray-500">Historique indisponible.</p>
      ) : etapes.length === 0 ? (
        <p className="mt-3 text-sm text-gray-500">Aucune étape enregistrée.</p>
      ) : (
        <ol className="mt-3 space-y-3 border-l border-gray-200 pl-4">
          {etapes.map((e, i) => {
            const libelle = e.statutAvant ? (statuts?.[e.statutApres]?.label ?? e.statutApres) : "Demande créée";
            const ton = statuts?.[e.statutApres]?.ton;
            return (
              <li key={i} className="relative">
                <span
                  className={`absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full ${
                    ton === "danger" ? "bg-danger" : ton === "succes" ? "bg-primary" : "bg-gray-400"
                  }`}
                />
                <p className="text-sm text-gray-900">
                  <span className="font-medium">{libelle}</span>
                  {e.auteurNom ? <> par {e.auteurNom}</> : <span className="text-gray-500"> (auteur non enregistré)</span>}
                </p>
                <p className="text-xs text-gray-500">
                  {e.date ? `le ${dateHeure(e.date)}` : "date non enregistrée"}
                  {e.reconstituee && " · reconstitué (avant l'historique)"}
                </p>
                {e.motif && <p className="mt-1 whitespace-pre-line text-sm text-gray-700">Motif : {e.motif}</p>}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
