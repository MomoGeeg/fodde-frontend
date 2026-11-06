import { Construction } from "lucide-react";

/**
 * Affiché à la place d'un module qui n'est pas encore relié au backend.
 * Mieux vaut un message clair que des données fictives qui disparaissent au rechargement.
 */
export default function ModuleEnPreparation({ titre }) {
  return (
    <div className="mx-auto mt-16 max-w-md rounded-xl border border-gray-200 bg-white px-6 py-10 text-center">
      <Construction className="mx-auto mb-3 text-gray-400" size={32} />
      <h1 className="text-base font-semibold text-gray-900">{titre}</h1>
      <p className="mt-2 text-sm text-gray-500">
        Ce module est en préparation. Il sera disponible prochainement.
      </p>
    </div>
  );
}
