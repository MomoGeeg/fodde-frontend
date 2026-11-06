import {
  MODES_PAIEMENT,
  STATUTS_DEPENSE,
  actionsDepense,
  dateCourte,
  etapesCircuit,
  montant,
  useDepense,
  useLignesBudgetaires,
} from "@/api/depenses";
import BarreActions from "@/components/demande/BarreActions";
import Circuit from "@/components/demande/Circuit";
import StatutBadge from "@/components/demande/StatutBadge";
import useAuthStore from "@/stores/auth.store";
import { ArrowLeft } from "lucide-react";
import { Link, useParams } from "react-router-dom";

function Champ({ libelle, children }) {
  return (
    <div>
      <dt className="text-xs text-gray-500">{libelle}</dt>
      <dd className="mt-0.5 text-sm text-gray-900">{children || "—"}</dd>
    </div>
  );
}

/** Fiche d'une dépense : informations, circuit de validation, actions possibles. */
export default function DepenseFichePage() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const { data: d, isLoading, isError } = useDepense(id);
  const { data: lignes = [] } = useLignesBudgetaires(d?.projetId);

  const retour = (
    <Link to="/finances/depenses" className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
      <ArrowLeft size={16} /> Dépenses
    </Link>
  );

  if (isLoading) return <p className="text-sm text-gray-500">Chargement…</p>;
  if (isError || !d)
    return (
      <div className="space-y-4">
        {retour}
        <p className="text-sm text-gray-600">Dépense introuvable.</p>
      </div>
    );

  const ligne = lignes.find((l) => l.id === d.ligneBudgetaireId);
  const arretee = d.statut === "REJETEE" || d.statut === "ANNULEE";
  const actions = actionsDepense(d, user?.roles ?? [], user?.id);

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      {retour}

      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs text-gray-500">{d.numeroPiece}</p>
            <h2 className="mt-0.5 text-lg font-semibold text-gray-900">{d.libelle}</h2>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold text-gray-900 tabular-nums">{montant(d.montant, d.devise)}</p>
            <StatutBadge statut={d.statut} statuts={STATUTS_DEPENSE} />
          </div>
        </div>

        <div className="mt-5 border-t border-gray-100 pt-5">
          {arretee ? (
            <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-800">
              <p className="font-medium">{d.statut === "REJETEE" ? "Dépense rejetée" : "Dépense annulée"}</p>
              {d.motifRejet && <p className="mt-1">Motif : {d.motifRejet}</p>}
            </div>
          ) : (
            <Circuit etapes={etapesCircuit(d)} statut={d.statut} />
          )}
        </div>

        {actions.length > 0 && (
          <div className="mt-5 border-t border-gray-100 pt-5">
            <BarreActions actions={actions} />
          </div>
        )}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Champ libelle="Bénéficiaire">{d.beneficiaire}</Champ>
          <Champ libelle="Mode de paiement">{MODES_PAIEMENT[d.modePaiement] ?? d.modePaiement}</Champ>
          <Champ libelle="Date de la dépense">{dateCourte(d.dateDepense)}</Champ>
          <Champ libelle="Projet">
            {d.projetCode}
            {d.projetTitre ? ` — ${d.projetTitre}` : ""}
          </Champ>
          <Champ libelle="Ligne budgétaire">
            {d.ligneBudgetaireCode}
            {d.ligneBudgetaireIntitule ? ` — ${d.ligneBudgetaireIntitule}` : ""}
          </Champ>
          <Champ libelle="Solde disponible sur la ligne">
            {ligne?.soldeDisponible != null ? montant(ligne.soldeDisponible, d.devise) : null}
          </Champ>
          <Champ libelle="Saisie par">{d.saisiParNom}</Champ>
          <Champ libelle="Saisie le">{dateCourte(d.createdAt)}</Champ>
        </dl>
      </div>
    </div>
  );
}
