import { TYPES_ACTIVITE, activitesTerrainApi } from "@/api/animateurs";
import { messageErreur } from "@/lib/erreurs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

// ─────────────────────────────────────────────────────────────────────────────
// Planification d'une activité par un agent de terrain : le technicien et le
// superviseur sur leurs périmètres, l'animateur sur ses projets actifs.
// L'activité revient à celui qui la planifie.
// ─────────────────────────────────────────────────────────────────────────────

const champ = "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none";
const etiquette = "mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500";

const VIDE = {
  rattachement: "",
  type: "ACTIVITE",
  titre: "",
  description: "",
  lieu: "",
  cible: "",
  participantsPrevus: "",
  datePrevuDebut: "",
  datePrevuFin: "",
  objectifs: "",
  indicateurs: "",
};

function Champ({ libelle, requis, large, children }) {
  return (
    <label className={large ? "sm:col-span-2" : undefined}>
      <span className={etiquette}>
        {libelle} {requis && <span className="text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}

/**
 * @param perimetres périmètres suivis (technicien ou superviseur)
 * @param projets projets actifs de l'animateur
 */
export default function FormulairePlanification({ perimetres = [], projets = [], onFermer }) {
  const queryClient = useQueryClient();
  const choix = [
    ...perimetres.map((p) => ({ valeur: `pe:${p.id}`, libelle: `${p.nom}, ${p.village}`, projetId: p.projetId, perimetreId: p.id, lieu: p.village })),
    ...projets
      .filter((p) => p.statut === "ACTIF")
      .map((p) => ({ valeur: `pr:${p.id}`, libelle: `${p.code}, ${p.titre}`, projetId: p.id, perimetreId: null, lieu: "" })),
  ];
  const [form, setForm] = useState({ ...VIDE, rattachement: choix.length === 1 ? choix[0].valeur : "" });
  const maj = (cle) => (e) => setForm((f) => ({ ...f, [cle]: e.target.value }));
  const rattache = choix.find((c) => c.valeur === form.rattachement);

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      activitesTerrainApi.creer({
        projetId: rattache.projetId,
        perimetreId: rattache.perimetreId,
        type: form.type,
        titre: form.titre.trim(),
        description: form.description.trim() || null,
        lieu: form.lieu.trim() || rattache.lieu || null,
        cible: form.cible.trim() || null,
        participantsPrevus: form.participantsPrevus === "" ? null : Number(form.participantsPrevus),
        datePrevuDebut: form.datePrevuDebut,
        datePrevuFin: form.datePrevuFin || form.datePrevuDebut,
        objectifs: form.objectifs.trim() || null,
        indicateurs: form.indicateurs.trim() || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["terrain", "activites"] });
      toast.success("Activité planifiée");
      onFermer();
    },
    onError: (err) => toast.error(messageErreur(err)),
  });

  const soumettre = (e) => {
    e.preventDefault();
    if (!rattache || !form.titre.trim() || !form.datePrevuDebut) {
      toast.error(`${perimetres.length ? "Le périmètre" : "Le projet"}, le titre et la date de début sont obligatoires`);
      return;
    }
    if (form.datePrevuFin && form.datePrevuFin < form.datePrevuDebut) {
      toast.error("La date de fin doit suivre la date de début");
      return;
    }
    if (form.participantsPrevus !== "" && !(Number(form.participantsPrevus) >= 0)) {
      toast.error("Le nombre de participants doit être positif");
      return;
    }
    mutate();
  };

  return (
    <form onSubmit={soumettre} className="space-y-4 border-b border-gray-100 bg-gray-50/50 p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Champ libelle={perimetres.length ? "Périmètre" : "Projet"} requis>
          <select value={form.rattachement} onChange={maj("rattachement")} className={champ}>
            <option value="">Choisir</option>
            {choix.map((c) => (
              <option key={c.valeur} value={c.valeur}>
                {c.libelle}
              </option>
            ))}
          </select>
        </Champ>
        <Champ libelle="Type">
          <select value={form.type} onChange={maj("type")} className={champ}>
            {Object.entries(TYPES_ACTIVITE).map(([code, libelle]) => (
              <option key={code} value={code}>
                {libelle}
              </option>
            ))}
          </select>
        </Champ>
        <Champ libelle="Titre" requis large>
          <input value={form.titre} onChange={maj("titre")} className={champ} />
        </Champ>
        <Champ libelle="Description" large>
          <textarea value={form.description} onChange={maj("description")} rows={2} className={champ} />
        </Champ>
        <Champ libelle="Lieu">
          <input
            value={form.lieu}
            onChange={maj("lieu")}
            placeholder={rattache?.lieu || "Village, quartier, école"}
            className={champ}
          />
        </Champ>
        <Champ libelle="Cible">
          <input value={form.cible} onChange={maj("cible")} placeholder="Femmes du groupement, élèves" className={champ} />
        </Champ>
        <Champ libelle="Nombre de participants">
          <input
            type="number"
            min="0"
            inputMode="numeric"
            value={form.participantsPrevus}
            onChange={maj("participantsPrevus")}
            className={champ}
          />
        </Champ>
        <div className="grid grid-cols-2 gap-4">
          <Champ libelle="Début" requis>
            <input type="date" value={form.datePrevuDebut} onChange={maj("datePrevuDebut")} className={champ} />
          </Champ>
          <Champ libelle="Fin">
            <input
              type="date"
              value={form.datePrevuFin}
              min={form.datePrevuDebut}
              onChange={maj("datePrevuFin")}
              className={champ}
            />
          </Champ>
        </div>
        <Champ libelle="Objectifs à atteindre" large>
          <textarea value={form.objectifs} onChange={maj("objectifs")} rows={2} className={champ} />
        </Champ>
        <Champ libelle="Indicateurs" large>
          <textarea
            value={form.indicateurs}
            onChange={maj("indicateurs")}
            rows={2}
            placeholder="Nombre de femmes formées, planches repiquées"
            className={champ}
          />
        </Champ>
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onFermer} className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700">
          Annuler
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-60"
        >
          {isPending ? "Enregistrement…" : "Planifier"}
        </button>
      </div>
    </form>
  );
}
