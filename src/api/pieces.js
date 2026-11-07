// ─────────────────────────────────────────────────────────────────────────────
// Pièces justificatives d'une dépense (facture, reçu…).
// Le backend refuse la soumission sans pièce au-delà du seuil.
// ─────────────────────────────────────────────────────────────────────────────
import api from "@/api/axios";
import { R, aAcces } from "@/lib/navigation";
import { useQuery } from "@tanstack/react-query";

/** Doit correspondre à app.depenses.seuil-piece-justificative côté backend. */
export const SEUIL_PIECE = 100_000;
export const FORMATS_PIECE = ".pdf,.jpg,.jpeg,.png";
export const TAILLE_MAX_PIECE = 10 * 1024 * 1024;

const STATUTS_AJOUT = ["BROUILLON", "REJETEE", "SOUMISE", "VERIFIEE", "EN_APPROBATION_SE"];
const STATUTS_RETRAIT = ["BROUILLON", "REJETEE"];

export const pieceExigee = (d) => Number(d?.montant) > SEUIL_PIECE;

export const peutAjouterPiece = (d, roles, userId) =>
  STATUTS_AJOUT.includes(d.statut) && (d.saisiParId === userId || aAcces(roles, [R.COMPTABLE, R.RAF, R.ADMIN]));

export const peutRetirerPiece = (d, roles, userId) =>
  STATUTS_RETRAIT.includes(d.statut) && (d.saisiParId === userId || aAcces(roles, [R.RAF, R.ADMIN]));

/** Message d'erreur local avant envoi (format, taille), ou null si le fichier convient. */
export function verifierPiece(fichier) {
  const ext = fichier.name.split(".").pop()?.toLowerCase();
  if (!["pdf", "jpg", "jpeg", "png"].includes(ext)) return `« ${fichier.name} » : format non accepté (PDF, JPG ou PNG).`;
  if (fichier.size > TAILLE_MAX_PIECE) return `« ${fichier.name} » : fichier trop volumineux (10 Mo maximum).`;
  return null;
}

export function usePieces(depenseId) {
  return useQuery({
    queryKey: ["pieces", depenseId],
    queryFn: async () => {
      const { data } = await api.get(`/api/depenses/${depenseId}/pieces`);
      return Array.isArray(data) ? data : [];
    },
    enabled: !!depenseId,
  });
}

export function ajouterPiece(depenseId, fichier) {
  const corps = new FormData();
  corps.append("fichier", fichier);
  return api.post(`/api/depenses/${depenseId}/pieces`, corps).then((r) => r.data);
}

export const retirerPiece = (depenseId, pieceId) => api.delete(`/api/depenses/${depenseId}/pieces/${pieceId}`);

/** Télécharge la pièce sous son nom d'origine. */
export async function telechargerPiece(depenseId, piece) {
  const { data } = await api.get(`/api/depenses/${depenseId}/pieces/${piece.id}/fichier`, { responseType: "blob" });
  const url = URL.createObjectURL(data);
  const a = document.createElement("a");
  a.href = url;
  a.download = piece.nom;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export const taille = (octets) =>
  octets == null ? "" : octets < 1024 * 1024 ? `${Math.max(1, Math.round(octets / 1024))} Ko` : `${(octets / 1024 / 1024).toFixed(1)} Mo`;
