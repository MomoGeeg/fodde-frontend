import { Check, X } from "lucide-react";

/**
 * Circuit de validation d'une demande : étapes franchies, étape en cours, suite.
 * Une demande rejetée ou annulée affiche l'arrêt sur l'étape où elle se trouvait.
 *
 * @param {{code: string, label: string}[]} etapes  dans l'ordre
 * @param {string} statut          statut actuel de la demande
 * @param {string[]} statutsArret  statuts qui interrompent le circuit (ex. REJETEE)
 * @param {string} [etapeArret]    code de l'étape atteinte avant l'arrêt
 */
export default function Circuit({ etapes, statut, statutsArret = [], etapeArret }) {
  const arrete = statutsArret.includes(statut);
  const indexCourant = etapes.findIndex((e) => e.code === (arrete ? etapeArret : statut));

  return (
    <ol className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-0">
      {etapes.map((e, i) => {
        // Le statut actuel est une étape franchie ; la suivante est celle qui attend.
        const franchie = i <= indexCourant;
        const enArret = arrete && i === indexCourant + 1;
        const courante = !arrete && i === indexCourant + 1;
        return (
          <li key={e.code} className="flex items-center gap-2 sm:flex-1 sm:flex-col sm:gap-1.5 sm:text-center">
            <div className="flex items-center sm:w-full">
              <span
                className={`hidden h-px flex-1 sm:block ${i === 0 ? "invisible" : franchie ? "bg-primary" : "bg-gray-200"}`}
              />
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                  franchie
                    ? "border-primary bg-primary text-white"
                    : enArret
                      ? "border-danger bg-danger text-white"
                      : courante
                        ? "border-primary bg-white text-primary"
                        : "border-gray-300 bg-white text-gray-400"
                }`}
              >
                {franchie ? <Check size={13} /> : enArret ? <X size={13} /> : i + 1}
              </span>
              <span
                className={`hidden h-px flex-1 sm:block ${i === etapes.length - 1 ? "invisible" : i < indexCourant ? "bg-primary" : "bg-gray-200"}`}
              />
            </div>
            <span className={`text-xs ${franchie || courante ? "text-gray-900" : enArret ? "text-danger" : "text-gray-500"}`}>
              {enArret ? (statut === "ANNULEE" ? "Annulée" : "Rejetée") : e.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
