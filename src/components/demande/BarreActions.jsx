import ModaleConfirmation from "@/components/demande/ModaleConfirmation";
import { messageErreur } from "@/lib/erreurs";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

const STYLES = {
  principal: "bg-primary text-white hover:bg-primary-dark",
  secondaire: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
  danger: "border border-red-200 bg-white text-danger hover:bg-red-50",
};


/**
 * Boutons d'action d'une demande. Chaque action peut demander une confirmation
 * et un motif ; après succès, les données sont rechargées.
 * @param {{cle,label,style,motif,confirmation,executer,desactive,aide}[]} actions
 *   desactive : bouton grisé (aide = raison affichée au survol)
 */
export default function BarreActions({ actions }) {
  const queryClient = useQueryClient();
  const [ouverte, setOuverte] = useState(null);
  const [enCours, setEnCours] = useState(false);

  if (!actions.length) return null;

  const lancer = async (action, motif) => {
    setEnCours(true);
    try {
      const message = await action.executer(motif);
      toast.success(message);
      setOuverte(null);
      await queryClient.invalidateQueries();
    } catch (err) {
      toast.error(messageErreur(err, "Action impossible. Réessayez."));
    } finally {
      setEnCours(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {actions.map((a) => (
          <button
            key={a.cle}
            disabled={enCours || a.desactive}
            title={a.desactive ? a.aide : undefined}
            onClick={() => (a.confirmation || a.motif ? setOuverte(a) : lancer(a))}
            className={`rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50 ${STYLES[a.style] ?? STYLES.secondaire}`}
          >
            {a.label}
          </button>
        ))}
      </div>
      {ouverte && (
        <ModaleConfirmation
          titre={ouverte.label}
          message={ouverte.confirmation}
          motifObligatoire={ouverte.motif}
          libelleBouton={ouverte.label}
          danger={ouverte.style === "danger"}
          enCours={enCours}
          onConfirmer={(motif) => lancer(ouverte, motif)}
          onFermer={() => setOuverte(null)}
        />
      )}
    </>
  );
}
