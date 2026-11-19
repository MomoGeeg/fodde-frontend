import { indicateursPerimetreApi } from "@/api/perimetres";
import { messageErreur } from "@/lib/erreurs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

// ─────────────────────────────────────────────────────────────────────────────
// Indicateurs du projet relevés sur un périmètre : dernière valeur, cible du
// projet, nombre de relevés, et saisie d'une nouvelle valeur pour ceux qui le
// peuvent (technicien, superviseur, chef de projet, RP, suivi-évaluation).
// ─────────────────────────────────────────────────────────────────────────────

const nombre = (n) => (n == null ? "" : new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(n));
const date = (d) => (d ? new Date(d).toLocaleDateString("fr-FR") : "");
const aujourdhui = () => new Date().toISOString().slice(0, 10);

function Saisie({ perimetreId, indicateur, onFermer }) {
  const queryClient = useQueryClient();
  const [valeur, setValeur] = useState("");
  const [jour, setJour] = useState(aujourdhui());
  const [commentaire, setCommentaire] = useState("");
  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      indicateursPerimetreApi.enregistrer(perimetreId, {
        indicateurId: indicateur.indicateurId,
        dateMesure: jour,
        valeur: Number(valeur),
        commentaire: commentaire.trim() || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["indicateurs-perimetre"] });
      toast.success("Valeur enregistrée");
      onFermer();
    },
    onError: (err) => toast.error(messageErreur(err)),
  });
  const champ = "rounded-md border border-gray-300 px-2 py-1 text-sm";
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (valeur === "") {
          toast.error("Indiquez la valeur");
          return;
        }
        mutate();
      }}
      className="flex flex-wrap items-end gap-3 bg-gray-50 px-4 py-3"
    >
      <label className="text-xs text-gray-500">
        Valeur{indicateur.unite ? ` (${indicateur.unite})` : ""}
        <input
          type="number"
          min="0"
          step="any"
          value={valeur}
          onChange={(e) => setValeur(e.target.value)}
          className={`${champ} mt-1 block w-28`}
        />
      </label>
      <label className="text-xs text-gray-500">
        Date
        <input
          type="date"
          max={aujourdhui()}
          value={jour}
          onChange={(e) => setJour(e.target.value)}
          className={`${champ} mt-1 block`}
        />
      </label>
      <label className="min-w-48 flex-1 text-xs text-gray-500">
        Commentaire
        <input value={commentaire} onChange={(e) => setCommentaire(e.target.value)} className={`${champ} mt-1 block w-full`} />
      </label>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-60"
      >
        {isPending ? "Enregistrement…" : "Enregistrer"}
      </button>
      <button type="button" onClick={onFermer} className="px-2 py-1.5 text-sm text-gray-500 hover:text-gray-700">
        Annuler
      </button>
    </form>
  );
}

/** Tableau des indicateurs d'un périmètre (données de /api/perimetres/{id}/indicateurs). */
export default function IndicateursPerimetre({ donnees }) {
  const [enSaisie, setEnSaisie] = useState(null);
  if (!donnees.indicateurs.length) {
    return <p className="px-4 py-4 text-sm text-gray-500">Aucun indicateur défini pour ce projet.</p>;
  }
  return (
    <ul className="divide-y divide-gray-100">
      {donnees.indicateurs.map((i) => (
        <li key={i.indicateurId}>
          <div className="flex items-center gap-3 px-4 py-3 text-sm">
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium text-gray-900">{i.libelle}</span>
              <span className="block truncate text-xs text-gray-500">
                {[i.code, i.valeurCible != null && `cible du projet ${nombre(i.valeurCible)} ${i.unite ?? ""}`]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </span>
            <span className="shrink-0 text-right">
              {i.derniereValeur != null ? (
                <>
                  <span className="block font-semibold tabular-nums text-gray-900">
                    {nombre(i.derniereValeur)} {i.unite ?? ""}
                  </span>
                  <span className="block text-xs text-gray-500">
                    le {date(i.derniereDate)}, {i.nbMesures} relevé{i.nbMesures > 1 ? "s" : ""}
                  </span>
                </>
              ) : (
                <span className="text-xs text-gray-400">Pas encore relevé</span>
              )}
            </span>
            {donnees.peutSaisir && enSaisie !== i.indicateurId && (
              <button
                onClick={() => setEnSaisie(i.indicateurId)}
                className="shrink-0 rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
              >
                Saisir
              </button>
            )}
          </div>
          {enSaisie === i.indicateurId && (
            <Saisie perimetreId={donnees.perimetreId} indicateur={i} onFermer={() => setEnSaisie(null)} />
          )}
        </li>
      ))}
    </ul>
  );
}
