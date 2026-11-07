import BarreActions from "@/components/demande/BarreActions";
import Circuit from "@/components/demande/Circuit";
import HistoriqueDemande from "@/components/demande/HistoriqueDemande";
import StatutBadge from "@/components/demande/StatutBadge";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * Fiche commune à toutes les demandes : en-tête (référence, objet, montant,
 * statut), circuit de validation ou motif d'arrêt, actions, informations.
 *
 * @param {{to, label}} retour
 * @param {{titre, motif}} [arret]  si la demande est rejetée ou annulée
 * @param {{libelle, valeur}[]} champs
 * @param {string} [historique]  route du backend donnant l'historique des validations
 */
export default function FicheDemande({
  retour,
  isLoading,
  introuvable,
  reference,
  titre,
  montant,
  statut,
  statuts,
  etapes,
  arret,
  actions = [],
  champs = [],
  historique,
  children,
}) {
  const lienRetour = (
    <Link to={retour.to} className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
      <ArrowLeft size={16} /> {retour.label}
    </Link>
  );

  if (isLoading) return <p className="text-sm text-gray-500">Chargement…</p>;
  if (introuvable)
    return (
      <div className="space-y-4">
        {lienRetour}
        <p className="text-sm text-gray-600">Demande introuvable.</p>
      </div>
    );

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      {lienRetour}

      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {reference && <p className="text-xs text-gray-500">{reference}</p>}
            <h2 className="mt-0.5 text-lg font-semibold text-gray-900">{titre}</h2>
          </div>
          <div className="text-right">
            {montant && <p className="text-lg font-semibold text-gray-900 tabular-nums">{montant}</p>}
            <StatutBadge statut={statut} statuts={statuts} />
          </div>
        </div>

        <div className="mt-5 border-t border-gray-100 pt-5">
          {arret ? (
            <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-800">
              <p className="font-medium">{arret.titre}</p>
              {arret.motif && <p className="mt-1">Motif : {arret.motif}</p>}
            </div>
          ) : (
            <Circuit etapes={etapes} statut={statut} />
          )}
        </div>

        {actions.length > 0 && (
          <div className="mt-5 border-t border-gray-100 pt-5">
            <BarreActions actions={actions} />
          </div>
        )}
      </div>

      {champs.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {champs.map((c) => (
              <div key={c.libelle}>
                <dt className="text-xs text-gray-500">{c.libelle}</dt>
                <dd className="mt-0.5 whitespace-pre-line text-sm text-gray-900">{c.valeur || "—"}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {/* Contenu propre au type de demande (ex. pièces justificatives d'une dépense) */}
      {children}

      {/* Qui a validé, quand, avec quel motif */}
      {historique && <HistoriqueDemande url={historique} statuts={statuts} />}
    </div>
  );
}
