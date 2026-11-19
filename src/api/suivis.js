import api from "@/api/axios";

// ─────────────────────────────────────────────────────────────────────────────
// Suivi mensuel du terrain : le technicien remet son planning et son rapport
// du mois, le superviseur de ses périmètres les valide ou les renvoie à revoir.
// ─────────────────────────────────────────────────────────────────────────────

export const TYPES_SUIVI = {
  PLANNING: "Planning",
  RAPPORT: "Rapport",
};

export const STATUTS_SUIVI = {
  SOUMIS: { label: "À valider", ton: "info" },
  VALIDE: { label: "Validé", ton: "succes" },
  A_REVOIR: { label: "À revoir", ton: "danger" },
};

export const suivisApi = {
  miens: () => api.get("/api/suivis-terrain/miens").then((r) => r.data),
  equipe: () => api.get("/api/suivis-terrain/equipe").then((r) => r.data),
  membres: () => api.get("/api/suivis-terrain/equipe/membres").then((r) => r.data),
  soumettre: (data) => api.post("/api/suivis-terrain", data).then((r) => r.data),
  decider: (id, valide, commentaire) =>
    api.patch(`/api/suivis-terrain/${id}/decision`, { valide, commentaire }).then((r) => r.data),
};

/** Mois au format AAAA-MM, décalé de `ecart` mois par rapport au mois courant. */
export function moisDecale(ecart = 0) {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + ecart);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** « novembre 2026 » à partir de « 2026-11 ». */
export function libelleMois(mois) {
  if (!mois) return "";
  const [annee, m] = mois.split("-").map(Number);
  return new Date(annee, m - 1, 1).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}
