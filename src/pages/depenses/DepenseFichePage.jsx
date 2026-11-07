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
import FicheDemande from "@/components/demande/FicheDemande";
import PiecesJustificatives from "@/pages/depenses/PiecesJustificatives";
import useAuthStore from "@/stores/auth.store";
import { useParams } from "react-router-dom";

const suffixe = (code, libelle) => (code ? `${code}${libelle ? ` — ${libelle}` : ""}` : null);

/** Fiche d'une dépense : informations, circuit de validation, actions possibles. */
export default function DepenseFichePage() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const { data: d, isLoading, isError } = useDepense(id);
  const { data: lignes = [] } = useLignesBudgetaires(d?.projetId);
  const ligne = lignes.find((l) => l.id === d?.ligneBudgetaireId);

  return (
    <FicheDemande
      retour={{ to: "/finances/depenses", label: "Dépenses" }}
      isLoading={isLoading}
      introuvable={isError || !d}
      {...(d && {
        historique: `/api/depenses/${d.id}/historique`,
        reference: d.numeroPiece,
        titre: d.libelle,
        montant: montant(d.montant, d.devise),
        statut: d.statut,
        statuts: STATUTS_DEPENSE,
        etapes: etapesCircuit(d),
        arret:
          d.statut === "REJETEE" || d.statut === "ANNULEE"
            ? { titre: d.statut === "REJETEE" ? "Dépense rejetée" : "Dépense annulée", motif: d.motifRejet }
            : null,
        actions: actionsDepense(d, user?.roles ?? [], user?.id),
        champs: [
          { libelle: "Bénéficiaire", valeur: d.beneficiaire },
          { libelle: "Mode de paiement", valeur: MODES_PAIEMENT[d.modePaiement] ?? d.modePaiement },
          { libelle: "Date de la dépense", valeur: dateCourte(d.dateDepense) },
          { libelle: "Projet", valeur: suffixe(d.projetCode, d.projetTitre) },
          { libelle: "Ligne budgétaire", valeur: suffixe(d.ligneBudgetaireCode, d.ligneBudgetaireIntitule) },
          {
            libelle: "Solde disponible sur la ligne",
            valeur: ligne?.soldeDisponible != null ? montant(ligne.soldeDisponible, d.devise) : null,
          },
          { libelle: "Saisie par", valeur: d.saisiParNom },
          { libelle: "Saisie le", valeur: dateCourte(d.createdAt) },
        ],
      })}
    >
      {d && <PiecesJustificatives depense={d} />}
    </FicheDemande>
  );
}
