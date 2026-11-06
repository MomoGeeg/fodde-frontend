// ─────────────────────────────────────────────────────────────────────────────
// Export de tableaux en fichier lisible par Excel (CSV séparé par « ; »,
// encodé en UTF-8 avec BOM : Excel en français l'ouvre directement, accents
// compris). Aucune dépendance.
// ─────────────────────────────────────────────────────────────────────────────

const cellule = (v) => {
  if (v === null || v === undefined) return "";
  if (typeof v === "number") return String(v).replace(".", ","); // décimales à la française
  const s = String(v);
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/**
 * Télécharge un fichier .csv composé de plusieurs blocs (titre, tableau…).
 * @param {string} nomFichier sans extension
 * @param {(string|number)[][]} lignes  chaque ligne est un tableau de cellules ; [] = ligne vide
 */
export function telechargerCsv(nomFichier, lignes) {
  const contenu = "﻿" + lignes.map((l) => l.map(cellule).join(";")).join("\r\n");
  const url = URL.createObjectURL(new Blob([contenu], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${nomFichier.replace(/[^\w-]+/g, "_")}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
