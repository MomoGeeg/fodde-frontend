import {
  CATEGORIES_ACQUISITION,
  STATUTS_ACQUISITION,
  actionsAcquisition,
  creerAcquisition,
  estATraiter,
  etapesAcquisition,
  useAcquisitions,
  useProjetsPilotes,
} from "@/api/acquisitions";
import { peutSaisir, useMateriels } from "@/api/logistique";
import Cellule from "@/components/demande/Cellule";
import FicheDemande from "@/components/demande/FicheDemande";
import { CHAMP, CadreFormulaire, Ligne } from "@/components/demande/Formulaire";
import ListeDemandes from "@/components/demande/ListeDemandes";
import { messageErreur } from "@/lib/erreurs";
import { dateCourte, montant } from "@/lib/format";
import { perimetresApi } from "@/api/perimetres";
import useAuthStore from "@/stores/auth.store";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

const COLONNES = [
  {
    titre: "Bien",
    rendu: (a) => <Cellule principal={a.designation} secondaire={CATEGORIES_ACQUISITION[a.categorie] ?? a.categorie} />,
  },
  { titre: "Demandeur", rendu: (a) => <Cellule principal={a.soumisPar} secondaire={dateCourte(a.createdAt)} /> },
  { titre: "Projet", rendu: (a) => <Cellule principal={a.projetCode} secondaire={a.perimetreNom} /> },
  { titre: "Valeur", droite: true, rendu: (a) => montant(a.valeur) },
];

export function AcquisitionsPage() {
  const { user } = useAuthStore();
  const { data, isLoading, isError } = useAcquisitions();
  const { data: pilotes = [] } = useProjetsPilotes();
  const aTraiter = useCallback((a) => estATraiter(a, user?.roles ?? []), [user]);
  return (
    <ListeDemandes
      demandes={data}
      isLoading={isLoading}
      isError={isError}
      aTraiter={aTraiter}
      statuts={STATUTS_ACQUISITION}
      colonnes={COLONNES}
      texteRecherche={(a) => [a.designation, a.soumisPar, a.projetCode, a.perimetreNom, a.codeActif]}
      lien={(a) => `/acquisitions/${a.id}`}
      placeholder="Bien, demandeur, projet…"
      nouveau={pilotes.length ? { label: "Lancer un achat", to: "/acquisitions/nouvelle" } : null}
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
        historique: `/api/acquisitions/${a.id}/historique`,
        reference: a.codeActif ?`Code actif ${a.codeActif}` : CATEGORIES_ACQUISITION[a.categorie],
        titre: a.designation,
        montant: montant(a.valeur),
        statut: a.statut,
        statuts: STATUTS_ACQUISITION,
        etapes: etapesAcquisition(a),
        arret: a.statut === "REJETEE" ? { titre: "Acquisition rejetée", motif: a.motifRejet } : null,
        actions: actionsAcquisition(a, user?.roles ?? [], user?.id),
        champs: [
          { libelle: "Catégorie", valeur: CATEGORIES_ACQUISITION[a.categorie] ?? a.categorie },
          { libelle: "Projet", valeur: a.projetCode },
          ...(a.perimetreNom ? [{ libelle: "Périmètre", valeur: a.perimetreNom }] : []),
          { libelle: "Date d'achat prévue", valeur: dateCourte(a.dateAcquisition) },
          { libelle: "Demandée par", valeur: a.soumisPar },
          { libelle: "Demandée le", valeur: dateCourte(a.createdAt) },
          { libelle: "Justification", valeur: a.justification },
        ],
      })}
    >
      {a?.statut === "VALIDEE" && peutSaisir(user?.roles ?? []) && <LienInventaire acquisition={a} />}
    </FicheDemande>
  );
}

/** Acquisition validée : l'ajouter à l'inventaire, ou ouvrir le bien qui en vient. */
function LienInventaire({ acquisition }) {
  const { data: materiels, isLoading } = useMateriels();
  if (isLoading) return null;
  const bien = materiels?.find((m) => m.acquisitionId === acquisition.id);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-5">
      <p className="text-sm text-gray-700">
        {bien ? `Dans l'inventaire sous le code ${bien.codeActif}.` : "Acquisition validée : pas encore dans l'inventaire."}
      </p>
      <Link
        to={bien ? `/logistique/materiels/${bien.id}` : `/logistique/materiels/nouveau?acquisition=${acquisition.id}`}
        className={
          bien
            ? "rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            : "rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-dark"
        }
      >
        {bien ? "Voir dans l'inventaire" : "Ajouter à l'inventaire"}
      </Link>
    </div>
  );
}

export function AcquisitionFormPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: projets = [] } = useProjetsPilotes();
  const [f, setF] = useState({
    designation: "",
    categorie: "EQUIPEMENT",
    projetId: "",
    perimetreId: "",
    valeur: "",
    dateAcquisition: new Date().toISOString().slice(0, 10),
    justification: "",
  });
  const { data: perimetres = [] } = useQuery({
    queryKey: ["perimetres", "projet", f.projetId],
    queryFn: () => perimetresApi.parProjet(f.projetId),
    enabled: !!f.projetId,
  });
  const [erreurs, setErreurs] = useState({});
  const [envoi, setEnvoi] = useState(false);

  const maj = (cle) => (e) => {
    const valeur = e.target.value;
    setF((p) => ({ ...p, [cle]: valeur, ...(cle === "projetId" && { perimetreId: "" }) }));
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
        {
          ...f,
          perimetreId: f.perimetreId || null,
          designation: f.designation.trim(),
          justification: f.justification.trim(),
          valeur: Number(f.valeur),
        },
        user.id,
      );
      await queryClient.invalidateQueries({ queryKey: ["acquisitions"] });
      toast.success("Achat envoyé au RAF");
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
      titre="Lancer un achat"
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
            {projets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} · {p.titre}
              </option>
            ))}
          </select>
        </Ligne>
        {perimetres.length > 0 && (
          <Ligne libelle="Périmètre">
            <select value={f.perimetreId} onChange={maj("perimetreId")} className={CHAMP}>
              <option value="">Aucun</option>
              {perimetres.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nom}, {p.village}
                </option>
              ))}
            </select>
          </Ligne>
        )}
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
