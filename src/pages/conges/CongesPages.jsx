import {
  ETAPES_CONGE,
  STATUTS_CONGE,
  TYPES_CONGE,
  actionsConge,
  creerConge,
  estATraiter,
  useConges,
  useEmployesActifs,
} from "@/api/conges";
import Cellule from "@/components/demande/Cellule";
import FicheDemande from "@/components/demande/FicheDemande";
import { CHAMP, CadreFormulaire, Ligne } from "@/components/demande/Formulaire";
import ListeDemandes from "@/components/demande/ListeDemandes";
import { messageErreur } from "@/lib/erreurs";
import { dateCourte } from "@/lib/format";
import { R, aAcces } from "@/lib/navigation";
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
  return (
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
      nouveau={aAcces(roles, [R.RH]) ? { label: "Enregistrer un congé", to: "/conges/nouveau" } : null}
    />
  );
}

export function CongeFichePage() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const { data = [], isLoading } = useConges();
  const c = data.find((x) => x.id === id);

  return (
    <FicheDemande
      retour={{ to: "/conges", label: "Congés" }}
      isLoading={isLoading}
      introuvable={!c}
      {...(c && {
        historique: `/api/conges/${c.id}/historique`,
        reference: c.employeNom,
        titre: `${TYPES_CONGE[c.typeConge] ?? c.typeConge} — ${duree(c)}`,
        statut: c.statut,
        statuts: STATUTS_CONGE,
        etapes: ETAPES_CONGE,
        arret:
          c.statut === "REJETE" || c.statut === "ANNULE"
            ? { titre: c.statut === "REJETE" ? "Demande rejetée" : "Demande annulée", motif: c.motifRejet }
            : null,
        actions: actionsConge(c, user?.roles ?? [], user?.id),
        champs: [
          { libelle: "Employé", valeur: [c.employeNom, c.employePoste].filter(Boolean).join(" — ") },
          { libelle: "Type", valeur: TYPES_CONGE[c.typeConge] ?? c.typeConge },
          { libelle: "Période", valeur: `${periode(c)} (${duree(c)})` },
          { libelle: "Enregistrée le", valeur: dateCourte(c.createdAt) },
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
  const { data: employes = [] } = useEmployesActifs();
  const [f, setF] = useState({ employeId: "", typeConge: "ANNUEL", dateDebut: "", dateFin: "", motif: "" });
  const [erreurs, setErreurs] = useState({});
  const [envoi, setEnvoi] = useState(false);
  const employe = employes.find((e) => e.id === f.employeId);

  const maj = (cle) => (e) => {
    setF((p) => ({ ...p, [cle]: e.target.value }));
    setErreurs((p) => ({ ...p, [cle]: undefined }));
  };

  const soumettre = async () => {
    const e = {};
    if (!f.employeId) e.employeId = "Choisissez l'employé.";
    if (!f.dateDebut) e.dateDebut = "Indiquez le premier jour.";
    if (!f.dateFin) e.dateFin = "Indiquez le dernier jour.";
    else if (f.dateDebut && f.dateFin < f.dateDebut) e.dateFin = "Le dernier jour doit suivre le premier.";
    setErreurs(e);
    if (Object.keys(e).length) return;

    setEnvoi(true);
    try {
      const cree = await creerConge({ ...f, motif: f.motif.trim() || null });
      await queryClient.invalidateQueries({ queryKey: ["conges"] });
      toast.success("Demande de congé enregistrée, en attente du RAF");
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
      titre="Enregistrer une demande de congé"
      onSoumettre={soumettre}
      libelleSoumettre="Envoyer au RAF"
      envoi={envoi}
    >
      <Ligne
        libelle="Employé"
        erreur={erreurs.employeId}
        aide={employe?.soldeConges != null ? `Solde de congés annuels : ${employe.soldeConges} jour(s)` : undefined}
      >
        <select value={f.employeId} onChange={maj("employeId")} className={CHAMP}>
          <option value="">Choisir…</option>
          {employes.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nom} {e.prenom}
              {e.poste ? ` — ${e.poste}` : ""}
            </option>
          ))}
        </select>
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
