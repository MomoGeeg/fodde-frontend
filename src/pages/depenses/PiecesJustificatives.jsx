import {
  FORMATS_PIECE,
  SEUIL_PIECE,
  ajouterPiece,
  peutAjouterPiece,
  peutRetirerPiece,
  pieceExigee,
  retirerPiece,
  taille,
  telechargerPiece,
  usePieces,
  verifierPiece,
} from "@/api/pieces";
import { messageErreur } from "@/lib/erreurs";
import { dateCourte, montant } from "@/lib/format";
import useAuthStore from "@/stores/auth.store";
import { useQueryClient } from "@tanstack/react-query";
import { Download, FileText, ImageIcon, Paperclip, Trash2, TriangleAlert } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

/** Bloc « Pièces justificatives » de la fiche d'une dépense. */
export default function PiecesJustificatives({ depense: d }) {
  const { user } = useAuthStore();
  const roles = user?.roles ?? [];
  const queryClient = useQueryClient();
  const entree = useRef(null);
  const [envoi, setEnvoi] = useState(false);
  const { data: pieces = [], isLoading, isError } = usePieces(d.id);

  const peutAjouter = peutAjouterPiece(d, roles, user?.id);
  const peutRetirer = peutRetirerPiece(d, roles, user?.id);
  const manquante = pieceExigee(d) && pieces.length === 0 && !isLoading;

  const ajouter = async (fichiers) => {
    const liste = [...fichiers];
    const erreur = liste.map(verifierPiece).find(Boolean);
    if (erreur) return toast.error(erreur);
    setEnvoi(true);
    try {
      for (const f of liste) await ajouterPiece(d.id, f);
      toast.success(liste.length > 1 ? `${liste.length} pièces jointes` : "Pièce jointe");
      await queryClient.invalidateQueries({ queryKey: ["pieces", d.id] });
    } catch (err) {
      toast.error(messageErreur(err, "Envoi impossible."));
    } finally {
      setEnvoi(false);
      if (entree.current) entree.current.value = "";
    }
  };

  const retirer = async (piece) => {
    if (!window.confirm(`Retirer « ${piece.nom} » ?`)) return;
    try {
      await retirerPiece(d.id, piece.id);
      await queryClient.invalidateQueries({ queryKey: ["pieces", d.id] });
    } catch (err) {
      toast.error(messageErreur(err, "Retrait impossible."));
    }
  };

  const ouvrir = (piece) => telechargerPiece(d.id, piece).catch((err) => toast.error(messageErreur(err, "Téléchargement impossible.")));

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-900">Pièces justificatives</h3>
        {peutAjouter && (
          <>
            <input
              ref={entree}
              type="file"
              accept={FORMATS_PIECE}
              multiple
              className="hidden"
              onChange={(e) => e.target.files?.length && ajouter(e.target.files)}
            />
            <button
              onClick={() => entree.current?.click()}
              disabled={envoi}
              className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <Paperclip size={14} /> {envoi ? "Envoi…" : "Joindre"}
            </button>
          </>
        )}
      </div>

      {manquante && (
        <p className="flex gap-2 border-b border-amber-100 bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
          <TriangleAlert size={14} className="mt-px shrink-0" />
          Au-delà de {montant(SEUIL_PIECE)}, une facture ou un reçu est obligatoire pour soumettre cette dépense.
        </p>
      )}

      {isLoading ? (
        <p className="px-4 py-4 text-sm text-gray-500">Chargement…</p>
      ) : isError ? (
        <p className="px-4 py-4 text-sm text-gray-500">Pièces non consultables avec votre rôle.</p>
      ) : pieces.length === 0 ? (
        <p className="px-4 py-4 text-sm text-gray-500">Aucune pièce jointe.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {pieces.map((p) => {
            const Icone = p.typeFichier === "pdf" ? FileText : ImageIcon;
            return (
              <li key={p.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <Icone size={18} className="shrink-0 text-gray-400" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-gray-900">{p.nom}</span>
                  <span className="block text-xs text-gray-500">
                    {taille(p.taille)} · ajoutée le {dateCourte(p.createdAt)}
                  </span>
                </span>
                <button onClick={() => ouvrir(p)} className="rounded p-1.5 text-gray-500 hover:bg-gray-100" aria-label={`Télécharger ${p.nom}`}>
                  <Download size={16} />
                </button>
                {peutRetirer && (
                  <button onClick={() => retirer(p)} className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-danger" aria-label={`Retirer ${p.nom}`}>
                    <Trash2 size={16} />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
