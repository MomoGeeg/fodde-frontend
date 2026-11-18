import {
  ETAPES_CONGE,
  STATUTS_CONGE,
  TYPES_CONGE,
  VOIT_TOUS_LES_CONGES,
  actionsConge,
  creerConge,
  estATraiter,
  useConges,
  useEmployesActifs,
  useMaFiche,
} from "@/api/conges";
import Cellule from "@/components/demande/Cellule";
import FicheDemande from "@/components/demande/FicheDemande";
import { CHAMP, CadreFormulaire, Ligne } from "@/components/demande/Formulaire";
import ListeDemandes from "@/components/demande/ListeDemandes";
import { messageErreur } from "@/lib/erreurs";
import { dateCourte } from "@/lib/format";
import { R, aAcces, neCreeRien } from "@/lib/navigation";
import useAuthStore from "@/stores/auth.store";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

const periode = (c) => `${dateCourte(c.dateDebut)} → ${dateCourte(c.dateFin)}`;
const duree = (c) => (c.nbJours != null ? `${c.nbJours} jour${c.nbJours > 1 ? "s" : ""}` : "");

const COLONNES = [
  { titre: "Employé", rendu: (c) => <Cellule principal={c.employeNom} secondaire={c.employePoste} /> },
  { titre: "Congé", rendu: (c) => <Cellule principal={TYPES_CONGE[c.typeConge] ?? c.typeConge} secondaire={c.motif} /> },
  { titre: "Période", rendu: (c) => <Cellule principal={periode(c)} secondaire={duree(c)} /> },
];

export function CongesPage() {
  const { user } = useAuthStore();
  const roles = user?.roles ?? [];
  const { data, isLoading, isError } = useConges();
  const aTraiter = useCallback((c) => estATraiter(c, user?.roles ?? []), [user]);
  const voitTout = aAcces(roles, VOIT_TOUS_LES_CONGES);
  return (
    <div className="space-y-4">
      {!voitTout && <MonSolde />}
      <ListeDemandes
      demandes={data}
      isLoading={isLoading}
      isError={isError}
      aTraiter={aTraiter}
      statuts={STATUTS_CONGE}
      colonnes={COLONNES}
      texteRecherche={(c) => [c.employeNom, TYPES_CONGE[c.typeConge], c.motif]}
      lien={(c) => `/conges/${c.id}`}
      placeholder="Employé, type de congé…"
      tri={(c) => c.dateDebut ?? ""}
      nouveau={neCreeRien(roles) ? null : { label: "Demander un congé", to: "/conges/nouveau" }}
      />
    </div>
  );
}

/** Solde de congés de l'employé connecté. */
function MonSolde() {
  const { data: fiche, isLoading } = useMaFiche();
  if (isLoading) return null;
  return (
    <div className="mx-auto max-w-6xl rounded-lg border border-gray-200 bg-white px-5 py-4 text-sm">
      {fiche ? (
        <p className="text-gray-900">
          Solde de congés annuels :{" "}
          <span className="font-semibold">
            {fiche.soldeConges != null ? `${fiche.soldeConges} jour${fiche.soldeConges > 1 ? "s" : ""}` : "non renseigné"}
          </span>
        </p>
      ) : (
        <p className="text-gray-600">Votre compte n'est lié à aucune fiche employé.</p>
      )}
    </div>
  );
}

export function CongeFichePage() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const { data = [], isLoading } = useConges();
  const { data: maFiche } = useMaFiche();
  const c = data.find((x) => x.id === id);

  return (
    <FicheDemande
      retour={{ to: "/conges", label: "Congés" }}
      isLoading={isLoading}
      introuvable={!c}
      {...(c && {
        historique: `/api/conges/${c.id}/historique`,
        reference: c.employeNom,
        titre: `${TYPES_CONGE[c.typeConge] ?? c.typeConge}, ${duree(c)}`,
        statut: c.statut,
        statuts: STATUTS_CONGE,
        etapes: ETAPES_CONGE,
        arret:
          c.statut === "REJETE" || c.statut === "ANNULE"
            ? { titre: c.statut === "REJETE" ? "Demande rejetée" : "Demande annulée", motif: c.motifRejet }
            : null,
        actions: actionsConge(c, user?.roles ?? [], !!maFiche && maFiche.id === c.employeId),
        champs: [
          { libelle: "Employé", valeur: [c.employeNom, c.employePoste].filter(Boolean).join(", ") },
          { libelle: "Type", valeur: TYPES_CONGE[c.typeConge] ?? c.typeConge },
          { libelle: "Période", valeur: `${periode(c)} (${duree(c)})` },
          { libelle: "Demandée le", valeur: dateCourte(c.createdAt) },
          { libelle: "Validée par les RH le", valeur: c.dateValidationRh ? dateCourte(c.dateValidationRh) : null },
          { libelle: "Approuvée le", valeur: c.dateValidationRaf ? dateCourte(c.dateValidationRaf) : null },
          { libelle: "Motif", valeur: c.motif },
        ],
      })}
    />
  );
}

export function CongeFormPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const estRH = aAcces(user?.roles ?? [], [R.RH]);
  const { data: employes = [] } = useEmployesActifs({ enabled: estRH });
  const { data: maFiche } = useMaFiche();
  // employeId vide = pour soi-même
  const [f, setF] = useState({ employeId: "", typeConge: "ANNUEL", dateDebut: "", dateFin: "", motif: "" });
  const [erreurs, setErreurs] = useState({});
  const [envoi, setEnvoi] = useState(false);
  const pourUnAutre = estRH && f.employeId && f.employeId !== maFiche?.id;
  const employe = pourUnAutre ? employes.find((e) => e.id === f.employeId) : maFiche;

  const maj = (cle) => (e) => {
    setF((p) => ({ ...p, [cle]: e.target.value }));
    setErreurs((p) => ({ ...p, [cle]: undefined }));
  };

  const soumettre = async () => {
    const e = {};
    if (!pourUnAutre && !maFiche) e.employeId = "Votre compte n'est lié à aucune fiche employé.";
    if (!f.dateDebut) e.dateDebut = "Indiquez le premier jour.";
    if (!f.dateFin) e.dateFin = "Indiquez le dernier jour.";
    else if (f.dateDebut && f.dateFin < f.dateDebut) e.dateFin = "Le dernier jour doit suivre le premier.";
    setErreurs(e);
    if (Object.keys(e).length) return;

    setEnvoi(true);
    try {
      const cree = await creerConge({ ...f, employeId: pourUnAutre ? f.employeId : null, motif: f.motif.trim() || null });
      await queryClient.invalidateQueries({ queryKey: ["conges"] });
      toast.success(pourUnAutre ? "Congé enregistré, transmis au RAF" : "Demande envoyée aux RH");
      navigate(`/conges/${cree.id}`);
    } catch (err) {
      // Ex. « Solde de congés insuffisant » renvoyé par le backend
      toast.error(messageErreur(err));
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <CadreFormulaire
      retour={{ to: "/conges", label: "Congés" }}
      titre="Demande de congé"
      onSoumettre={soumettre}
      libelleSoumettre={pourUnAutre ? "Envoyer au RAF" : "Envoyer aux RH"}
      envoi={envoi}
    >
      <Ligne
        libelle={estRH ? "Employé" : "Solde de congés annuels"}
        erreur={erreurs.employeId}
        aide={estRH && employe?.soldeConges != null ? `Solde de congés annuels : ${employe.soldeConges} jour(s)` : undefined}
      >
        {estRH ? (
          <select value={f.employeId} onChange={maj("employeId")} className={CHAMP}>
            <option value="">Moi-même</option>
            {employes
              .filter((e) => e.id !== maFiche?.id)
              .map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nom} {e.prenom}
                  {e.poste ? `, ${e.poste}` : ""}
                </option>
              ))}
          </select>
        ) : (
          <p className="py-2 text-sm font-medium text-gray-900">
            {maFiche?.soldeConges != null ? `${maFiche.soldeConges} jour(s)` : "Non renseigné"}
          </p>
        )}
      </Ligne>
      <Ligne libelle="Type de congé">
        <select value={f.typeConge} onChange={maj("typeConge")} className={CHAMP}>
          {Object.entries(TYPES_CONGE).map(([code, label]) => (
            <option key={code} value={code}>
              {label}
            </option>
          ))}
        </select>
      </Ligne>
      <div className="grid gap-4 sm:grid-cols-2">
        <Ligne libelle="Premier jour" erreur={erreurs.dateDebut}>
          <input type="date" value={f.dateDebut} onChange={maj("dateDebut")} className={CHAMP} />
        </Ligne>
        <Ligne libelle="Dernier jour" erreur={erreurs.dateFin}>
          <input type="date" value={f.dateFin} min={f.dateDebut || undefined} onChange={maj("dateFin")} className={CHAMP} />
        </Ligne>
      </div>
      <Ligne libelle="Motif (facultatif)">
        <textarea value={f.motif} onChange={maj("motif")} rows={2} className={CHAMP} />
      </Ligne>
    </CadreFormulaire>
  );
}
