import { PHOTOS_MAX, activitesTerrainApi, telechargerPieceActivite } from "@/api/animateurs";
import { taille } from "@/api/pieces";
import { messageErreur } from "@/lib/erreurs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, FileSpreadsheet, Image, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

const etiquette = "mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500";
const bouton =
  "inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60";

/**
 * Renseignement d'une activité réalisée : fiche de suivi, liste de présence (CSV, qui donne les
 * participants) et jusqu'à trois photos. En lecture seule pour qui ne la renseigne pas.
 *
 * @param {object} activite     activité (réponse de l'API)
 * @param {boolean} peutModifier responsable, technicien du périmètre ou gestionnaire du projet
 * @param {string[]} cles        requêtes à rafraîchir après un changement
 */
export default function PiecesActivite({ activite, peutModifier, cles = [] }) {
  const queryClient = useQueryClient();
  const [fiche, setFiche] = useState(activite.ficheSuivi ?? "");
  const choixListe = useRef(null);
  const choixPhoto = useRef(null);

  const { data: pieces = [], isLoading } = useQuery({
    queryKey: ["pieces-activite", activite.id],
    queryFn: () => activitesTerrainApi.pieces(activite.id),
  });
  const liste = pieces.find((p) => p.type === "LISTE_PRESENCE");
  const photos = pieces.filter((p) => p.type === "PHOTO");

  const rafraichir = () => {
    queryClient.invalidateQueries({ queryKey: ["pieces-activite", activite.id] });
    cles.forEach((cle) => queryClient.invalidateQueries({ queryKey: cle }));
  };
  const surErreur = (err) => toast.error(messageErreur(err));

  const enregistrerFiche = useMutation({
    mutationFn: () => activitesTerrainApi.ficheSuivi(activite.id, fiche),
    onSuccess: () => {
      rafraichir();
      toast.success("Fiche de suivi enregistrée");
    },
    onError: surErreur,
  });
  const deposerListe = useMutation({
    mutationFn: (fichier) => activitesTerrainApi.listePresence(activite.id, fichier),
    onSuccess: (a) => {
      rafraichir();
      toast.success(
        `Liste enregistrée : ${a.participants} participant${a.participants > 1 ? "s" : ""}` +
          (a.participantsFemmes != null ? `, dont ${a.participantsFemmes} femmes` : ""),
      );
    },
    onError: surErreur,
  });
  const ajouterPhoto = useMutation({
    mutationFn: (fichier) => activitesTerrainApi.ajouterPhoto(activite.id, fichier),
    onSuccess: () => {
      rafraichir();
      toast.success("Photo ajoutée");
    },
    onError: surErreur,
  });
  const retirerPhoto = useMutation({
    mutationFn: (pieceId) => activitesTerrainApi.retirerPhoto(activite.id, pieceId),
    onSuccess: () => {
      rafraichir();
      toast.success("Photo retirée");
    },
    onError: surErreur,
  });
  const realisee = useMutation({
    mutationFn: () => activitesTerrainApi.realisee(activite.id),
    onSuccess: () => {
      rafraichir();
      toast.success("Activité réalisée");
    },
    onError: surErreur,
  });

  const telecharger = (piece) => telechargerPieceActivite(activite.id, piece).catch(surErreur);
  const choisi = (mutation) => (e) => {
    const fichier = e.target.files?.[0];
    e.target.value = "";
    if (fichier) mutation.mutate(fichier);
  };

  const planification = [
    ["Description", activite.description],
    ["Cible", activite.cible],
    ["Participants prévus", activite.participantsPrevus],
    ["Objectifs à atteindre", activite.objectifs],
    ["Indicateurs", activite.indicateurs],
  ].filter(([, v]) => v != null && v !== "");

  return (
    <div className="grid gap-4 px-4 pb-4 lg:grid-cols-3">
      {planification.length > 0 && (
        <dl className="grid gap-3 rounded-md bg-gray-50 p-3 text-sm sm:grid-cols-2 lg:col-span-3">
          {planification.map(([libelle, valeur]) => (
            <div key={libelle}>
              <dt className={etiquette}>{libelle}</dt>
              <dd className="whitespace-pre-line text-gray-800">{valeur}</dd>
            </div>
          ))}
        </dl>
      )}
      <div className="lg:col-span-1">
        <p className={etiquette}>Liste de présence</p>
        {isLoading ? (
          <p className="text-sm text-gray-500">Chargement…</p>
        ) : liste ? (
          <div className="rounded-md border border-gray-200 p-3 text-sm">
            <p className="flex items-center gap-2 font-medium text-gray-900">
              <FileSpreadsheet size={15} className="shrink-0 text-primary" />
              <span className="truncate">{liste.nom}</span>
            </p>
            <p className="mt-1 text-xs text-gray-600">
              {activite.participants ?? 0} participant{activite.participants > 1 ? "s" : ""}
              {activite.participantsFemmes != null && `, dont ${activite.participantsFemmes} femmes`}
            </p>
            <button type="button" onClick={() => telecharger(liste)} className={`${bouton} mt-2`}>
              <Download size={13} /> Télécharger
            </button>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Aucune liste.</p>
        )}
        {peutModifier && (
          <>
            <input ref={choixListe} type="file" accept=".csv,text/csv" hidden onChange={choisi(deposerListe)} />
            <button
              type="button"
              disabled={deposerListe.isPending}
              onClick={() => choixListe.current?.click()}
              className={`${bouton} mt-2`}
            >
              <Upload size={13} />
              {deposerListe.isPending ? "Envoi…" : liste ? "Remplacer la liste" : "Téléverser la liste (CSV)"}
            </button>
          </>
        )}
      </div>

      <div className="lg:col-span-1">
        <p className={etiquette}>
          Photos ({photos.length} sur {PHOTOS_MAX})
        </p>
        {photos.length ? (
          <ul className="space-y-1.5">
            {photos.map((p) => (
              <li key={p.id} className="flex items-center gap-2 rounded-md border border-gray-200 px-2 py-1.5 text-sm">
                <Image size={14} className="shrink-0 text-gray-400" />
                <button
                  type="button"
                  onClick={() => telecharger(p)}
                  className="min-w-0 flex-1 truncate text-left text-gray-800 hover:text-primary"
                >
                  {p.nom}
                </button>
                <span className="shrink-0 text-xs text-gray-400">{taille(p.taille)}</span>
                {peutModifier && (
                  <button
                    type="button"
                    title="Retirer"
                    onClick={() => {
                      if (window.confirm(`Retirer la photo « ${p.nom} » ?`)) retirerPhoto.mutate(p.id);
                    }}
                    className="shrink-0 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          !isLoading && <p className="text-sm text-gray-500">Aucune photo.</p>
        )}
        {peutModifier && photos.length < PHOTOS_MAX && (
          <>
            <input ref={choixPhoto} type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" hidden onChange={choisi(ajouterPhoto)} />
            <button
              type="button"
              disabled={ajouterPhoto.isPending}
              onClick={() => choixPhoto.current?.click()}
              className={`${bouton} mt-2`}
            >
              <Upload size={13} />
              {ajouterPhoto.isPending ? "Envoi…" : "Ajouter une photo"}
            </button>
          </>
        )}
      </div>

      <div className="lg:col-span-1">
        <label className="block">
          <span className={etiquette}>Fiche de suivi</span>
          <textarea
            rows={5}
            value={fiche}
            disabled={!peutModifier}
            onChange={(e) => setFiche(e.target.value)}
            placeholder="Résultats, difficultés, recommandations"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none disabled:bg-gray-50"
          />
        </label>
        {peutModifier && (
          <div className="mt-2 flex flex-wrap justify-end gap-2">
            {activite.statut !== "REALISEE" && activite.statut !== "ANNULEE" && (
              <button type="button" disabled={realisee.isPending} onClick={() => realisee.mutate()} className={bouton}>
                Marquer réalisée
              </button>
            )}
            <button
              type="button"
              disabled={enregistrerFiche.isPending || fiche === (activite.ficheSuivi ?? "")}
              onClick={() => enregistrerFiche.mutate()}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-dark disabled:opacity-60"
            >
              Enregistrer la fiche
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
