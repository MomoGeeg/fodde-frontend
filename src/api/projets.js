// ─────────────────────────────────────────────────────────────────────────────
// Projets : montage (cadre logique, budget prévisionnel, équipe) et validation.
//   RP crée le projet en brouillon et désigne un chef de projet ; ensemble ils montent
//   le cadre logique et le budget → le RP soumet → le RAF vérifie le budget
//   → le SE valide : le projet devient actif. RAF et SE peuvent renvoyer avec un motif.
// ─────────────────────────────────────────────────────────────────────────────
import api from "@/api/axios";
import { R, aAcces } from "@/lib/navigation";
import { useQuery } from "@tanstack/react-query";

export const STATUTS_PROJET = {
  BROUILLON: { label: "En montage", ton: "neutre" },
  EN_VALIDATION: { label: "Chez le RAF", ton: "info" },
  EN_VALIDATION_SE: { label: "Chez le SE", ton: "attention" },
  ACTIF: { label: "Actif", ton: "succes" },
  SUSPENDU: { label: "Suspendu", ton: "danger" },
  EN_CLOTURE: { label: "En clôture", ton: "attention" },
  CLOTURE: { label: "Clôturé", ton: "neutre" },
  ARCHIVE: { label: "Archivé", ton: "neutre" },
};

export const CATEGORIES_BUDGET = {
  PERSONNEL: "Personnel",
  DEPLACEMENTS: "Déplacements",
  EQUIPEMENT: "Équipement",
  ACTIVITES: "Activités de terrain",
  FONCTIONNEMENT: "Fonctionnement",
  FRAIS_ADMINISTRATIFS: "Frais administratifs",
  AUTRE: "Autre",
};

/** Peuvent créer un projet. */
export const CREATEURS_PROJET = [R.RP, R.ADMIN];

export function useProjetsListe() {
  return useQuery({
    queryKey: ["projets"],
    queryFn: async () => {
      const { data } = await api.get("/api/projets");
      return Array.isArray(data) ? data : [];
    },
    staleTime: 30_000,
  });
}

/** Tout le projet en un appel : fiche, cadre logique, activités, indicateurs, budget, équipe, contrôles. */
export function useMontage(id) {
  return useQuery({
    queryKey: ["projets", id, "montage"],
    queryFn: async () => (await api.get(`/api/projets/${id}/montage`)).data,
    enabled: !!id,
    retry: false,
  });
}

/** Comptes actifs (RP, CP, admin) pour choisir chef de projet, équipe et responsables. */
export function usePersonnes(actif = true) {
  return useQuery({
    queryKey: ["projets", "personnes"],
    queryFn: async () => (await api.get("/api/projets/personnes")).data ?? [],
    enabled: actif,
    staleTime: 5 * 60_000,
  });
}

const donnees = (r) => r.data;
export const creerProjet = (p) => api.post("/api/projets", p).then(donnees);
export const modifierProjet = (id, p) => api.put(`/api/projets/${id}`, p).then(donnees);

export const ajouterObjectif = (id, p) => api.post(`/api/projets/${id}/objectifs`, p).then(donnees);
export const modifierObjectif = (id, oid, p) => api.put(`/api/projets/${id}/objectifs/${oid}`, p).then(donnees);
export const supprimerObjectif = (id, oid) => api.delete(`/api/projets/${id}/objectifs/${oid}`);

export const ajouterResultat = (id, p) => api.post(`/api/projets/${id}/resultats`, p).then(donnees);
export const modifierResultat = (id, rid, p) => api.put(`/api/projets/${id}/resultats/${rid}`, p).then(donnees);
export const supprimerResultat = (id, rid) => api.delete(`/api/projets/${id}/resultats/${rid}`);

export const creerActivite = (p) => api.post("/api/activites", p).then(donnees);
export const modifierActivite = (aid, p) => api.put(`/api/activites/${aid}`, p).then(donnees);
export const supprimerActivite = (aid) => api.delete(`/api/activites/${aid}`);

export const enregistrerBudget = (id, lignes) => api.put(`/api/projets/${id}/budget`, { lignes }).then(donnees);

export const ajouterMembre = (id, userId) => api.post(`/api/projets/${id}/equipe`, { userId });
export const retirerMembre = (id, userId) => api.delete(`/api/projets/${id}/equipe/${userId}`);

/** Étapes du circuit ; chaque étape porte le statut atteint après elle (composant Circuit). */
export const ETAPES_PROJET = [
  { code: "BROUILLON", label: "Montage" },
  { code: "EN_VALIDATION", label: "Soumis par le RP" },
  { code: "EN_VALIDATION_SE", label: "Budget vérifié (RAF)" },
  { code: "ACTIF", label: "Validé (SE)" },
];

/** Ce qui attend l'utilisateur sur ce projet. */
export function projetATraiter(p, roles, userId) {
  if (p.statut === "EN_VALIDATION") return aAcces(roles, [R.RAF]);
  if (p.statut === "EN_VALIDATION_SE") return aAcces(roles, [R.SE]);
  if (p.statut === "BROUILLON") return !!p.motifRenvoi && (p.responsableId === userId || p.chefProjetId === userId);
  return false;
}

/** Décisions de la barre d'actions selon l'étape et le rôle. */
export function actionsProjet(m, roles) {
  const p = m.projet;
  const actions = [];
  const renvoi = (qui) => ({
    cle: "renvoyer",
    label: "Renvoyer en montage",
    style: "danger",
    motif: true,
    confirmation: `Renvoyer le projet en montage ? Le motif sera visible par ${qui}.`,
    executer: async (motif) => {
      await api.patch(`/api/projets/${p.id}/renvoyer`, { motif });
      return "Projet renvoyé en montage";
    },
  });

  if (p.statut === "BROUILLON" && m.peutModifier) {
    const pret = m.controles.every((c) => !c.bloquant || c.ok);
    actions.push({
      cle: "soumettre",
      label: "Soumettre pour validation",
      style: "principal",
      desactive: !pret,
      aide: "Complétez d'abord les points de la liste « Avant de soumettre ».",
      confirmation: "Soumettre le projet ? Le RAF vérifiera le budget, puis le SE le validera. Il ne sera plus modifiable sauf renvoi.",
      executer: async () => {
        await api.patch(`/api/projets/${p.id}/soumettre`);
        return "Projet soumis au RAF";
      },
    });
  }
  if (p.statut === "EN_VALIDATION" && aAcces(roles, [R.RAF, R.ADMIN])) {
    actions.push(
      {
        cle: "verifier",
        label: "Budget vérifié",
        style: "principal",
        confirmation: "Confirmer que le budget est correct ? Le projet ira au Secrétaire exécutif.",
        executer: async () => {
          await api.patch(`/api/projets/${p.id}/verifier-budget`);
          return "Budget vérifié : projet transmis au SE";
        },
      },
      renvoi("le RP et le chef de projet"),
    );
  }
  if (p.statut === "EN_VALIDATION_SE" && aAcces(roles, [R.SE, R.ADMIN])) {
    actions.push(
      {
        cle: "valider",
        label: "Valider le projet",
        style: "principal",
        confirmation: "Valider le projet ? Il devient actif : les activités peuvent démarrer.",
        executer: async () => {
          await api.patch(`/api/projets/${p.id}/valider`);
          return "Projet validé : il est actif";
        },
      },
      renvoi("le RP, le chef de projet et le RAF"),
    );
  }
  return actions;
}
