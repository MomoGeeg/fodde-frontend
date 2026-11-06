import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

/** Classe des champs de saisie des formulaires de demande. */
export const CHAMP =
  "mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none disabled:bg-gray-50";

/** Un champ avec son libellé et son message d'erreur. */
export function Ligne({ libelle, erreur, aide, children }) {
  return (
    <label className="block text-sm">
      <span className="text-gray-700">{libelle}</span>
      {children}
      {aide && !erreur && <span className="mt-1 block text-xs text-gray-500">{aide}</span>}
      {erreur && <span className="mt-1 block text-xs text-danger">{erreur}</span>}
    </label>
  );
}

/**
 * Cadre commun des formulaires de demande : lien de retour, titre, champs,
 * bouton principal (et bouton secondaire facultatif).
 */
export function CadreFormulaire({ retour, titre, children, onSoumettre, libelleSoumettre, secondaire, envoi }) {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link to={retour.to} className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
        <ArrowLeft size={16} /> {retour.label}
      </Link>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSoumettre();
        }}
        className="space-y-4 rounded-lg border border-gray-200 bg-white p-5"
        noValidate
      >
        <h2 className="text-base font-semibold text-gray-900">{titre}</h2>
        {children}
        <div className="flex flex-col-reverse gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
          {secondaire && (
            <button
              type="button"
              onClick={secondaire.onClick}
              disabled={envoi}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {secondaire.label}
            </button>
          )}
          <button
            type="submit"
            disabled={envoi}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
          >
            {envoi ? "Envoi…" : libelleSoumettre}
          </button>
        </div>
      </form>
    </div>
  );
}
