import { useState } from "react";

/**
 * Confirmation d'une action sur une demande, avec motif facultatif ou obligatoire.
 * onConfirmer(motif) peut être asynchrone ; la modale reste ouverte pendant l'appel.
 */
export default function ModaleConfirmation({ titre, message, motifObligatoire, libelleBouton, danger, enCours, onConfirmer, onFermer }) {
  const [motif, setMotif] = useState("");
  const motifManquant = motifObligatoire && !motif.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-lg">
        <h2 className="text-base font-semibold text-gray-900">{titre}</h2>
        {message && <p className="mt-2 text-sm text-gray-600">{message}</p>}
        {motifObligatoire && (
          <label className="mt-4 block text-sm">
            <span className="text-gray-700">Motif</span>
            <textarea
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              rows={3}
              autoFocus
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </label>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onFermer} disabled={enCours} className="rounded-md px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
            Retour
          </button>
          <button
            onClick={() => onConfirmer(motif.trim())}
            disabled={enCours || motifManquant}
            className={`rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${danger ? "bg-danger hover:bg-red-700" : "bg-primary hover:bg-primary-dark"}`}
          >
            {enCours ? "Envoi…" : libelleBouton}
          </button>
        </div>
      </div>
    </div>
  );
}
