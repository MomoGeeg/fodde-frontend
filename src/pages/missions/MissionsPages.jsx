import { useProjets } from "@/api/depenses";
import { STATUTS_MISSION, actionsMission, creerMission, estATraiter, etapesMission, useMissions } from "@/api/missions";
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

const periode = (m) => `${dateCourte(m.dateDebut)} → ${dateCourte(m.dateFin)}`;

const COLONNES = [
  { titre: "Mission", rendu: (m) => <Cellule principal={m.destination} secondaire={periode(m)} /> },
  { titre: "Objet", rendu: (m) => <Cellule principal={m.motif} secondaire={m.employeNom} /> },
  { titre: "Projet", rendu: (m) => m.projetCode },
  { titre: "Budget estimé", droite: true, rendu: (m) => montant(m.budgetEstime) },
];

export function MissionsPage() {
  const { user } = useAuthStore();
  const { data, isLoading, isError } = useMissions();
  const aTraiter = useCallback((m) => estATraiter(m, user?.roles ?? [], user?.id), [user]);
  return (
    <ListeDemandes
      demandes={data}
      isLoading={isLoading}
      isError={isError}
      aTraiter={aTraiter}
      statuts={STATUTS_MISSION}
      colonnes={COLONNES}
      texteRecherche={(m) => [m.destination, m.motif, m.employeNom, m.projetCode]}
      lien={(m) => `/missions/${m.id}`}
      placeholder="Destination, objet, employé, projet…"
      nouveau={{ label: "Demander une mission", to: "/missions/nouvelle" }}
    />
  );
}

export function MissionFichePage() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const { data = [], isLoading } = useMissions();
  const m = data.find((x) => x.id === id);
  const jours = m ? Math.round((new Date(m.dateFin) - new Date(m.dateDebut)) / 86_400_000) + 1 : 0;

  return (
    <FicheDemande
      retour={{ to: "/missions", label: "Missions" }}
      isLoading={isLoading}
      introuvable={!m}
      {...(m && {
        reference: `Mission de ${m.employeNom ?? "—"}`,
        titre: `${m.destination} — ${m.motif}`,
        montant: montant(m.budgetEstime),
        statut: m.statut,
        statuts: STATUTS_MISSION,
        etapes: etapesMission(m),
        arret: m.statut === "REJETEE" ? { titre: "Mission rejetée", motif: m.motifRejet } : null,
        actions: actionsMission(m, user?.roles ?? [], user?.id),
        champs: [
          { libelle: "Employé", valeur: m.employeNom },
          { libelle: "Projet", valeur: m.projetCode },
          { libelle: "Destination", valeur: m.destination },
          { libelle: "Période", valeur: `${periode(m)} (${jours} jour${jours > 1 ? "s" : ""})` },
          { libelle: "Budget estimé", valeur: montant(m.budgetEstime) },
          { libelle: "Demandée le", valeur: dateCourte(m.createdAt) },
          { libelle: "Objet de la mission", valeur: m.motif },
        ],
      })}
    />
  );
}

const aujourdhui = () => new Date().toISOString().slice(0, 10);

export function MissionFormPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: projets = [] } = useProjets();
  const [f, setF] = useState({ projetId: "", destination: "", dateDebut: "", dateFin: "", motif: "", budgetEstime: "" });
  const [erreurs, setErreurs] = useState({});
  const [envoi, setEnvoi] = useState(false);

  const maj = (cle) => (e) => {
    setF((p) => ({ ...p, [cle]: e.target.value }));
    setErreurs((p) => ({ ...p, [cle]: undefined }));
  };

  const soumettre = async () => {
    const e = {};
    if (!f.projetId) e.projetId = "Choisissez le projet qui finance la mission.";
    if (!f.destination.trim()) e.destination = "Indiquez la destination.";
    if (!f.dateDebut) e.dateDebut = "Indiquez la date de départ.";
    if (!f.dateFin) e.dateFin = "Indiquez la date de retour.";
    else if (f.dateDebut && f.dateFin < f.dateDebut) e.dateFin = "Le retour doit suivre le départ.";
    if (!f.motif.trim()) e.motif = "Indiquez l'objet de la mission.";
    if (!(Number(f.budgetEstime) >= 0) || f.budgetEstime === "") e.budgetEstime = "Indiquez le budget estimé (0 si aucun frais).";
    setErreurs(e);
    if (Object.keys(e).length) return;

    setEnvoi(true);
    try {
      const creee = await creerMission(
        { ...f, destination: f.destination.trim(), motif: f.motif.trim(), budgetEstime: Number(f.budgetEstime), employeId: user.id },
        user.id,
      );
      await queryClient.invalidateQueries({ queryKey: ["missions"] });
      toast.success("Demande de mission envoyée");
      navigate(`/missions/${creee.id}`);
    } catch (err) {
      toast.error(messageErreur(err));
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <CadreFormulaire
      retour={{ to: "/missions", label: "Missions" }}
      titre="Demander une mission"
      onSoumettre={soumettre}
      libelleSoumettre="Envoyer la demande"
      envoi={envoi}
    >
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
      <Ligne libelle="Destination" erreur={erreurs.destination}>
        <input value={f.destination} onChange={maj("destination")} className={CHAMP} />
      </Ligne>
      <div className="grid gap-4 sm:grid-cols-2">
        <Ligne libelle="Départ" erreur={erreurs.dateDebut}>
          <input type="date" value={f.dateDebut} min={aujourdhui()} onChange={maj("dateDebut")} className={CHAMP} />
        </Ligne>
        <Ligne libelle="Retour" erreur={erreurs.dateFin}>
          <input type="date" value={f.dateFin} min={f.dateDebut || aujourdhui()} onChange={maj("dateFin")} className={CHAMP} />
        </Ligne>
      </div>
      <Ligne libelle="Objet de la mission" erreur={erreurs.motif}>
        <textarea value={f.motif} onChange={maj("motif")} rows={3} className={CHAMP} />
      </Ligne>
      <Ligne libelle="Budget estimé (F CFA)" erreur={erreurs.budgetEstime} aide="Transport, hébergement et per diem.">
        <input type="number" min="0" inputMode="numeric" value={f.budgetEstime} onChange={maj("budgetEstime")} className={CHAMP} />
      </Ligne>
    </CadreFormulaire>
  );
}
