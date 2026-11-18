// ─────────────────────────────────────────────────────────────────────────────
// Pôle de l'organigramme déduit du service : le service est choisi dans une liste
// rangée par pôle (lib/services.jsx), le pôle n'a donc pas à être saisi à part.
// ─────────────────────────────────────────────────────────────────────────────

const POLE_DU_SERVICE = {
  "Secrétariat exécutif": "DIRECTION",
  "Suivi-évaluation": "DIRECTION",
  "Administration et finances": "RAF",
  Secrétariat: "RAF",
  Comptabilité: "RAF",
  Logistique: "RAF",
  "Ressources humaines": "RAF",
  Programmes: "PROGRAMMES",
  "Éducation au développement": "RED_CAP_COM",
  Capitalisation: "RED_CAP_COM",
  Communication: "RED_CAP_COM",
};

/** Code du pôle (DIRECTION, RAF, PROGRAMMES, RED_CAP_COM) d'un service, ou null s'il est inconnu. */
export const poleDuService = (service) => POLE_DU_SERVICE[service] ?? null;
