import { STATUTS_DEPENSE, dateCourte, estATraiter, montant, useDepenses } from "@/api/depenses";
import Cellule from "@/components/demande/Cellule";
import ListeDemandes from "@/components/demande/ListeDemandes";
import { R, aAcces } from "@/lib/navigation";
import useAuthStore from "@/stores/auth.store";
import { useCallback } from "react";

const COLONNES = [
  { titre: "Pièce", rendu: (d) => <Cellule principal={d.numeroPiece} secondaire={dateCourte(d.dateDepense)} /> },
  {
    titre: "Libellé",
    rendu: (d) => (
      <Cellule principal={d.libelle} secondaire={`${d.beneficiaire}${d.saisiParNom ? ` · saisie par ${d.saisiParNom}` : ""}`} />
    ),
  },
  { titre: "Projet", rendu: (d) => <Cellule principal={d.projetCode} secondaire={d.ligneBudgetaireCode} /> },
  { titre: "Montant", droite: true, rendu: (d) => montant(d.montant, d.devise) },
];

const texteRecherche = (d) => [d.numeroPiece, d.libelle, d.beneficiaire, d.saisiParNom, d.projetCode];
const lien = (d) => `/finances/depenses/${d.id}`;

export default function DepensesPage() {
  const { user } = useAuthStore();
  const { data, isLoading, isError } = useDepenses();
  const aTraiter = useCallback((d) => estATraiter(d, user?.roles ?? [], user?.id), [user]);

  return (
    <ListeDemandes
      demandes={data}
      isLoading={isLoading}
      isError={isError}
      aTraiter={aTraiter}
      statuts={STATUTS_DEPENSE}
      colonnes={COLONNES}
      texteRecherche={texteRecherche}
      lien={lien}
      placeholder="N° de pièce, libellé, bénéficiaire, projet…"
      nouveau={
        aAcces(user?.roles ?? [], [R.COMPTABLE, R.RAF]) ? { label: "Nouvelle dépense", to: "/finances/depenses/nouvelle" } : null
      }
    />
  );
}
