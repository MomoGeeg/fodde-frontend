import {
  CATEGORIES_ACQUISITION,
  ETAPES_ACQUISITION,
  STATUTS_ACQUISITION,
  actionsAcquisition,
  creerAcquisition,
  estATraiter,
  useAcquisitions,
} from "@/api/acquisitions";
import { useProjets } from "@/api/depenses";
import Cellule from "@/components/demande/Cellule";
import FicheDemande from "@/components/demande/FicheDemande";
import { CHAMP, CadreFormulaire, Ligne } from "@/components/demande/Formulaire";
import ListeDemandes from "@/components/demande/ListeDemandes";
import { messageErreur } from "@/lib/erreurs";
import { dateCourte, montant } from "@/lib/format";
import useAuthStore from "@/stores/auth.store";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

const COLONNES = [
  {
    titre: "Bien",
    rendu: (a) => <Cellule principal={a.designation} secondaire={CATEGORIES_ACQUISITION[a.categorie] ?? a.categorie} />,
  },
  { titre: "Demandeur", rendu: (a) => <Cellule principal={a.soumisPar} secondaire={dateCourte(a.createdAt)} /> },
  { titre: "Projet", rendu: (a) => a.projetCode },
  { titre: "Valeur", droite: true, rendu: (a) => montant(a.valeur) },
];

export function AcquisitionsPage() {
  const { user } = useAuthStore();
  const { data, isLoading, isError } = useAcquisitions();
  const aTraiter = useCallback((a) => estATraiter(a, user?.roles ?? []), [user]);
  return (
    <ListeDemandes
      demandes={data}
      isLoading={isLoading}
      isError={isError}
      aTraiter={aTraiter}
      statuts={STATUTS_ACQUISITION}
      colonnes={COLONNES}
      texteRecherche={(a) => [a.designation, a.soumisPar, a.projetCode, a.codeActif]}
      lien={(a) => `/acquisitions/${a.id}`}
      placeholder="Bien, demandeur, projet…"
      nouveau={{ label: "Demander un achat", to: "/acquisitions/nouvelle" }}
    />
  );
}

export function AcquisitionFichePage() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const { data = [], isLoading } = useAcquisitions();
  const a = data.find((x) => x.id === id);

  return (
    <FicheDemande
      retour={{ to: "/acquisitions", label: "Acquisitions" }}
      isLoading={isLoading}
      introuvable={!a}
      {...(a && {
        reference: a.codeActif ? `Code actif ${a.codeActif}` : CATEGORIES_ACQUISITION[a.categorie],
        titre: a.designation,
        montant: montant(a.valeur),
        statut: a.statut,
        statuts: STATUTS_ACQUISITION,
        etapes: ETAPES_ACQUISITION,
        arret: a.statut === "REJETEE" ? { titre: "Acquisition rejetée", motif: a.motifRejet } : null,
        actions: actionsAcquisition(a, user?.roles ?? [], user?.id),
        champs: [
          { libelle: "Catégorie", valeur: CATEGORIES_ACQUISITION[a.categorie] ?? a.categorie },
          { libelle: "Projet", valeur: a.projetCode },
          { libelle: "Date d'achat prévue", valeur: dateCourte(a.dateAcquisition) },
          { libelle: "Demandée par", valeur: a.soumisPar },
          { libelle: "Demandée le", valeur: dateCourte(a.createdAt) },
          { libelle: "Justification", valeur: a.justification },
        ],
      })}
    />
  );
}

export function AcquisitionFormPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: projets = [] } = useProjets();
  const [f, setF] = useState({
    designation: "",
    categorie: "EQUIPEMENT",
    projetId: "",
    valeur: "",
    dateAcquisition: new Date().toISOString().slice(0, 10),
    justification: "",
  });
  const [erreurs, setErreurs] = useState({});
  const [envoi, setEnvoi] = useState(false);

  const maj = (cle) => (e) => {
    setF((p) => ({ ...p, [cle]: e.target.value }));
    setErreurs((p) => ({ ...p, [cle]: undefined }));
  };

  const soumettre = async () => {
    const e = {};
    if (!f.designation.trim()) e.designation = "Indiquez le bien à acheter.";
    if (!f.projetId) e.projetId = "Choisissez le projet qui finance l'achat.";
    if (!(Number(f.valeur) > 0)) e.valeur = "Indiquez la valeur estimée.";
    if (!f.dateAcquisition) e.dateAcquisition = "Indiquez la date prévue.";
    if (!f.justification.trim()) e.justification = "Expliquez en une phrase pourquoi cet achat est nécessaire.";
    setErreurs(e);
    if (Object.keys(e).length) return;

    setEnvoi(true);
    try {
      const creee = await creerAcquisition(
        { ...f, designation: f.designation.trim(), justification: f.justification.trim(), valeur: Number(f.valeur) },
        user.id,
      );
      await queryClient.invalidateQueries({ queryKey: ["acquisitions"] });
      toast.success("Demande d'achat envoyée au RAF");
      navigate(`/acquisitions/${creee.id}`);
    } catch (err) {
      toast.error(messageErreur(err));
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <CadreFormulaire
      retour={{ to: "/acquisitions", label: "Acquisitions" }}
      titre="Demander un achat"
      onSoumettre={soumettre}
      libelleSoumettre="Envoyer au RAF"
      envoi={envoi}
    >
      <Ligne libelle="Bien à acheter" erreur={erreurs.designation}>
        <input value={f.designation} onChange={maj("designation")} className={CHAMP} />
      </Ligne>
      <div className="grid gap-4 sm:grid-cols-2">
        <Ligne libelle="Catégorie">
          <select value={f.categorie} onChange={maj("categorie")} className={CHAMP}>
            {Object.entries(CATEGORIES_ACQUISITION).map(([code, label]) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </select>
        </Ligne>
        <Ligne libelle="Projet" erreur={erreurs.projetId}>
          <select value={f.projetId} onChange={maj("projetId")} className={CHAMP}>
            <option value="">Choisir…</option>
            {projets
              .filter((p) => p.statut === "ACTIF")
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.titre}
                </option>
              ))}
          </select>
        </Ligne>
        <Ligne libelle="Valeur estimée (F CFA)" erreur={erreurs.valeur}>
          <input type="number" min="0" inputMode="numeric" value={f.valeur} onChange={maj("valeur")} className={CHAMP} />
        </Ligne>
        <Ligne libelle="Date d'achat prévue" erreur={erreurs.dateAcquisition}>
          <input type="date" value={f.dateAcquisition} onChange={maj("dateAcquisition")} className={CHAMP} />
        </Ligne>
      </div>
      <Ligne libelle="Justification" erreur={erreurs.justification}>
        <textarea value={f.justification} onChange={maj("justification")} rows={3} className={CHAMP} />
      </Ligne>
    </CadreFormulaire>
  );
}
