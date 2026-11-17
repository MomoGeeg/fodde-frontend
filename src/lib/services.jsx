// ─────────────────────────────────────────────────────────────────────────────
// Services de l'ONG, d'après l'organigramme, regroupés par pôle.
// Utilisés pour le service d'un compte (admin) et d'une fiche employé (RH) :
// la même liste garde les deux cohérents (le compte créé depuis une fiche
// reprend le service de la fiche).
// ─────────────────────────────────────────────────────────────────────────────

const SERVICES = [
  { pole: "Direction", services: ["Secrétariat exécutif", "Suivi-évaluation"] },
  {
    pole: "Administration et finances",
    services: ["Administration et finances", "Secrétariat", "Comptabilité", "Logistique", "Ressources humaines"],
  },
  { pole: "Programmes", services: ["Programmes"] },
  { pole: "RED / CAP / COM", services: ["Éducation au développement", "Capitalisation", "Communication"] },
];

const CONNUS = new Set(SERVICES.flatMap((g) => g.services));

/**
 * Options d'une liste déroulante de services. Une valeur déjà enregistrée qui
 * n'est pas dans la liste (saisie libre d'avant) reste proposée pour ne pas la perdre.
 */
export function OptionsServices({ valeur }) {
  return (
    <>
      <option value="">Choisir…</option>
      {valeur && !CONNUS.has(valeur) && <option value={valeur}>{valeur}</option>}
      {SERVICES.map((g) => (
        <optgroup key={g.pole} label={g.pole}>
          {g.services.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </optgroup>
      ))}
    </>
  );
}
