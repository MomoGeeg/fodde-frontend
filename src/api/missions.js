// ─────────────────────────────────────────────────────────────────────────────
// Missions, d'après l'organisation de l'ONG :
//   demandeur → supérieur direct (accord) → logistique (véhicule, chauffeur)
//   → RAF (équipe, budget, validation) → SE (au-delà du seuil ou sur demande)
//   → comptabilité (fonds débloqués : avance au chef de mission) → prête.
// Les étapes sans objet sont sautées par le backend.
// ─────────────────────────────────────────────────────────────────────────────
import api from "@/api/axios";
import { R, aAcces } from "@/lib/navigation";
import useAuthStore from "@/stores/auth.store";
import { useQuery } from "@tanstack/react-query";

export const STATUTS_MISSION = {
  SOUMISE: { label: "Chez le supérieur", ton: "info" },
  APPROUVEE_N1: { label: "À organiser (logistique)", ton: "info" },
  ORGANISEE: { label: "Chez le RAF", ton: "info" },
  EN_VALIDATION_SE: { label: "Chez le SE", ton: "attention" },
  VALIDEE: { label: "Fonds à débloquer", ton: "attention" },
  PRETE: { label: "Prête", ton: "succes" },
  REJETEE: { label: "Rejetée", ton: "danger" },
  ANNULEE: { label: "Annulée", ton: "neutre" },
  VALIDEE_RAF: { label: "Validée (ancien circuit)", ton: "succes" },
};

export const CATEGORIES_FRAIS = {
  PER_DIEM: "Per diem",
  HEBERGEMENT: "Hébergement",
  CARBURANT: "Carburant",
  TRANSPORT: "Transport",
  AUTRE: "Autre",
};

/** L'ordre de mission existe une fois la mission validée. */
export const ORDRE_DISPONIBLE = ["VALIDEE", "PRETE", "VALIDEE_RAF"];

const EN_COURS = ["SOUMISE", "APPROUVEE_N1", "ORGANISEE", "EN_VALIDATION_SE", "VALIDEE"];

/** Le backend filtre : toutes pour les rôles de gestion, sinon celles qui concernent l'utilisateur. */
export function useMissions() {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: ["missions"],
    queryFn: async () => {
      const { data } = await api.get("/api/missions");
      return Array.isArray(data) ? data : [];
    },
    enabled: !!user,
    staleTime: 30_000,
  });
}

/** Agents, chauffeurs et véhicules libres sur la période. */
export function useDisponibilites(debut, fin, missionId) {
  return useQuery({
    queryKey: ["missions", "disponibilites", debut, fin, missionId ?? null],
    queryFn: async () => {
      const { data } = await api.get("/api/missions/disponibilites", { params: { debut, fin, missionId } });
      return data;
    },
    enabled: !!debut && !!fin && fin >= debut,
    staleTime: 15_000,
  });
}

export const creerMission = (payload) => api.post("/api/missions", payload).then((r) => r.data);
export const organiserMission = (id, payload) => api.patch(`/api/missions/${id}/organiser`, payload).then((r) => r.data);
export const preparerMission = (id, payload) => api.put(`/api/missions/${id}/preparation`, payload).then((r) => r.data);

const besoinLogistique = (m) => m.besoinVehicule || !!m.besoinsMateriel?.trim();

/**
 * Étapes du circuit de cette mission. Chaque étape porte le statut atteint après elle,
 * comme l'attend le composant Circuit.
 */
export function etapesMission(m) {
  if (m.statut === "VALIDEE_RAF") {
    return [
      { code: "SOUMISE", label: "Demandée" },
      { code: "VALIDEE_RAF", label: "Validée par le RAF" },
    ];
  }
  const log = besoinLogistique(m);
  const avecFrais = Number(m.budgetEstime) > 0;
  const apresValidation = avecFrais ? "VALIDEE" : "PRETE";
  const apresN1 = log ? "APPROUVEE_N1" : "ORGANISEE";
  const etapes = [{ code: m.n1Id ? "SOUMISE" : apresN1, label: "Demandée" }];
  if (m.n1Id) etapes.push({ code: apresN1, label: `Accord de ${m.n1Nom ?? "son supérieur"}` });
  if (log) etapes.push({ code: "ORGANISEE", label: "Véhicule et chauffeur" });
  etapes.push({ code: m.validationSeRequise ? "EN_VALIDATION_SE" : apresValidation, label: "Validation du RAF" });
  if (m.validationSeRequise) etapes.push({ code: apresValidation, label: "Validation du SE" });
  if (avecFrais) etapes.push({ code: "PRETE", label: "Fonds débloqués" });
  return etapes;
}

/** Ce qui attend l'utilisateur sur cette mission. */
export function estATraiter(m, roles, userId) {
  switch (m.statut) {
    case "SOUMISE":
      return m.n1Id === userId;
    case "APPROUVEE_N1":
      return aAcces(roles, [R.LOG]);
    case "ORGANISEE":
      return aAcces(roles, [R.RAF]);
    case "EN_VALIDATION_SE":
      return aAcces(roles, [R.SE]);
    case "VALIDEE":
      return aAcces(roles, [R.COMPTABLE]);
    default:
      return false;
  }
}

const rejet = (m, qui) => ({
  cle: "rejeter",
  label: "Rejeter",
  style: "danger",
  motif: true,
  confirmation: `Rejeter cette mission ? Le motif sera visible par ${qui}.`,
  executer: async (motif) => {
    await api.patch(`/api/missions/${m.id}/rejeter`, { motif });
    return "Mission rejetée";
  },
});

/**
 * Décisions de la barre d'actions. L'organisation (logistique) et la préparation (RAF)
 * se font dans des formulaires sur la fiche.
 */
export function actionsMission(m, roles, userId) {
  const actions = [];
  const raf = aAcces(roles, [R.RAF]);
  const admin = aAcces(roles, [R.ADMIN]);

  if (m.statut === "SOUMISE" && (m.n1Id === userId || admin)) {
    actions.push(
      {
        cle: "accord",
        label: "Donner mon accord",
        style: "principal",
        confirmation: "Donner votre accord ? La mission passera à l'organisation.",
        executer: async () => {
          await api.patch(`/api/missions/${m.id}/approuver-n1`);
          return "Accord enregistré";
        },
      },
      rejet(m, "le demandeur"),
    );
  }
  if (m.statut === "ORGANISEE" && (raf || admin)) {
    const versSe = m.validationSeRequise;
    actions.push({
      cle: "valider",
      label: "Valider la mission",
      style: "principal",
      confirmation: versSe
        ? "Valider l'équipe et le budget enregistrés ? La mission ira ensuite au Secrétaire exécutif."
        : Number(m.budgetEstime) > 0
          ? "Valider l'équipe et le budget enregistrés ? La comptabilité débloquera ensuite les fonds."
          : "Valider la mission sans frais ? L'ordre de mission sera aussitôt disponible.",
      executer: async () => {
        await api.patch(`/api/missions/${m.id}/valider`);
        return "Mission validée";
      },
    });
  }
  if ((m.statut === "APPROUVEE_N1" || m.statut === "ORGANISEE") && (raf || admin)) {
    actions.push(rejet(m, "le demandeur"));
  }
  if (m.statut === "EN_VALIDATION_SE" && aAcces(roles, [R.SE, R.ADMIN])) {
    actions.push(
      {
        cle: "valider-se",
        label: "Valider la mission",
        style: "principal",
        confirmation: "Valider cette mission ? La comptabilité débloquera ensuite les fonds.",
        executer: async () => {
          await api.patch(`/api/missions/${m.id}/valider-se`);
          return "Mission validée";
        },
      },
      rejet(m, "le demandeur et le RAF"),
    );
  }
  if (m.statut === "VALIDEE" && aAcces(roles, [R.COMPTABLE, R.RAF, R.ADMIN])) {
    actions.push({
      cle: "fonds",
      label: "Débloquer les fonds",
      style: "principal",
      confirmation:
        "Débloquer les fonds ? Une avance du montant du budget sera enregistrée au nom du chef de mission, à justifier au retour.",
      executer: async () => {
        await api.patch(`/api/missions/${m.id}/debloquer-fonds`);
        return "Fonds débloqués : avance enregistrée";
      },
    });
  }
  if (EN_COURS.includes(m.statut) && (m.demandeurId === userId || raf || admin)) {
    actions.push({
      cle: "annuler",
      label: "Annuler la mission",
      style: "secondaire",
      motif: true,
      confirmation: "Annuler cette mission ? Les personnes et le véhicule seront libérés.",
      executer: async (motif) => {
        await api.patch(`/api/missions/${m.id}/annuler`, { motif });
        return "Mission annulée";
      },
    });
  }
  return actions;
}

/** Numéro au format international pour WhatsApp (Sénégal par défaut : 9 chiffres → +221). */
export function numeroWhatsApp(telephone) {
  if (!telephone) return null;
  let n = telephone.replace(/[^\d+]/g, "");
  if (n.startsWith("+")) n = n.slice(1);
  else if (n.startsWith("00")) n = n.slice(2);
  if (n.length === 9) n = "221" + n;
  return n.length >= 10 ? n : null;
}

const jj = (d) => (d ? new Date(d).toLocaleDateString("fr-FR") : "");

/** Message de l'ordre de mission, prêt à envoyer. */
export function messageOrdreMission(m, destinataire) {
  const equipe = (m.participants ?? []).map((p) => `- ${p.nom}${p.chef ? " (chef de mission)" : ""}`).join("\n");
  const lignes = [
    `Bonjour ${destinataire},`,
    "",
    "FODDE — Ordre de mission",
    `Destination : ${m.destination}`,
    `Du ${jj(m.dateDebut)} au ${jj(m.dateFin)} (${m.nbJours} jour${m.nbJours > 1 ? "s" : ""})`,
    `Objet : ${m.motif}`,
  ];
  if (m.projetCode) lignes.push(`Projet : ${m.projetCode}`);
  if (equipe) lignes.push("Équipe :", equipe);
  if (m.vehiculeLibelle) lignes.push(`Véhicule : ${m.vehiculeLibelle}`);
  if (m.chauffeurNom) lignes.push(`Chauffeur : ${m.chauffeurNom}`);
  return lignes.join("\n");
}
