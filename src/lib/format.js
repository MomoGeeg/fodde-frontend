// Espace insécable : « F CFA » ne passe jamais à la ligne seul.
const INSECABLE = " ";

/** Montant lisible : « 1 250 000 F CFA » (ou la devise indiquée). */
export const montant = (n, devise = "XOF") =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(Number(n) || 0) +
  (devise === "XOF" ? `${INSECABLE}F${INSECABLE}CFA` : `${INSECABLE}${devise}`);

/** Date courte : « 06/11/2026 », ou « — » si absente. */
export const dateCourte = (d) => (d ? new Date(d).toLocaleDateString("fr-FR") : "—");
