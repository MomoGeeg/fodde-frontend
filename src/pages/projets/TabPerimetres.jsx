import { indicateursPerimetreApi, perimetresApi } from "@/api/perimetres";
import IndicateursPerimetre from "@/components/perimetres/IndicateursPerimetre";
import AnimateursProjet from "./AnimateursProjet";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BarChart3, Edit, LocateFixed, Plus, Trash2, X } from "lucide-react";
import { Fragment, useState } from "react";
import { toast } from "sonner";

const VIDE = {
  nom: "",
  village: "",
  commune: "",
  departement: "",
  superficieHa: "",
  technicienId: "",
  superviseurId: "",
  latitude: "",
  longitude: "",
  cultures: "",
};

const nombreOuNull = (v) => (v === "" || v == null ? null : parseFloat(String(v).replace(",", ".")));

const champ =
  "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none";
const etiquette =
  "mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500";

function Champ({ label, requis, children }) {
  return (
    <div>
      <label className={etiquette}>
        {label} {requis && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

/** Indicateurs d'un périmètre, chargés à l'ouverture de sa ligne. */
function LigneIndicateurs({ perimetreId }) {
  const { data, isLoading } = useQuery({
    queryKey: ["indicateurs-perimetre", perimetreId],
    queryFn: () => indicateursPerimetreApi.duPerimetre(perimetreId),
  });
  if (isLoading || !data) {
    return <p className="px-4 py-4 text-sm text-gray-500">Chargement…</p>;
  }
  return <IndicateursPerimetre donnees={data} />;
}

/** Onglet Périmètres de la fiche projet. */
export default function TabPerimetres({ projet, peutGerer }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(null);
  const [enEdition, setEnEdition] = useState(null);
  const [ouvert, setOuvert] = useState(null);

  const { data: perimetres = [], isLoading } = useQuery({
    queryKey: ["perimetres", projet.id],
    queryFn: () => perimetresApi.parProjet(projet.id),
  });
  const { data: intervenants } = useQuery({
    queryKey: ["perimetres-intervenants"],
    queryFn: perimetresApi.intervenants,
    enabled: peutGerer,
  });
  const techniciens = intervenants?.techniciens ?? [];
  const superviseurs = intervenants?.superviseurs ?? [];

  const rafraichir = () =>
    queryClient.invalidateQueries({ queryKey: ["perimetres", projet.id] });

  const { mutate: enregistrer, isPending } = useMutation({
    mutationFn: (data) =>
      enEdition
        ? perimetresApi.modifier(enEdition, data)
        : perimetresApi.creer(data),
    onSuccess: () => {
      rafraichir();
      toast.success(enEdition ? "Périmètre modifié" : "Périmètre créé");
      fermer();
    },
    onError: (err) => toast.error(err.message ?? "Erreur"),
  });

  const { mutate: supprimer } = useMutation({
    mutationFn: perimetresApi.supprimer,
    onSuccess: () => {
      rafraichir();
      toast.success("Périmètre supprimé");
    },
    onError: (err) => toast.error(err.message ?? "Erreur"),
  });

  const fermer = () => {
    setForm(null);
    setEnEdition(null);
  };

  const ouvrir = (p) => {
    setEnEdition(p?.id ?? null);
    setForm(
      p
        ? {
            nom: p.nom ?? "",
            village: p.village ?? "",
            commune: p.commune ?? "",
            departement: p.departement ?? "",
            superficieHa: p.superficieHa ?? "",
            technicienId: p.technicienId ?? "",
            superviseurId: p.superviseurId ?? "",
            latitude: p.latitude ?? "",
            longitude: p.longitude ?? "",
            cultures: (p.cultures ?? []).join(", "),
          }
        : VIDE,
    );
  };

  const maj = (cle) => (e) => setForm((f) => ({ ...f, [cle]: e.target.value }));

  const [localisation, setLocalisation] = useState(false);
  const maPosition = () => {
    if (!navigator.geolocation) {
      toast.error("La géolocalisation n'est pas disponible sur cet appareil");
      return;
    }
    setLocalisation(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setForm((f) => ({ ...f, latitude: coords.latitude.toFixed(6), longitude: coords.longitude.toFixed(6) }));
        setLocalisation(false);
      },
      () => {
        toast.error("Position introuvable : autorisez la localisation ou saisissez les coordonnées");
        setLocalisation(false);
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  const soumettre = (e) => {
    e.preventDefault();
    if (!form.nom.trim() || !form.village.trim()) {
      toast.error("Le nom et le village sont obligatoires");
      return;
    }
    const latitude = nombreOuNull(form.latitude);
    const longitude = nombreOuNull(form.longitude);
    if ((latitude == null) !== (longitude == null) || Number.isNaN(latitude) || Number.isNaN(longitude)) {
      toast.error("Indiquez la latitude et la longitude, ou aucune des deux");
      return;
    }
    enregistrer({
      projetId: projet.id,
      nom: form.nom.trim(),
      village: form.village.trim(),
      commune: form.commune.trim() || null,
      departement: form.departement.trim() || null,
      superficieHa:
        form.superficieHa === "" ? null : parseFloat(form.superficieHa),
      technicienId: form.technicienId || null,
      superviseurId: form.superviseurId || null,
      latitude,
      longitude,
      cultures: form.cultures.split(",").map((c) => c.trim()).filter(Boolean),
    });
  };

  const confirmerSuppression = (p) => {
    if (window.confirm(`Supprimer le périmètre « ${p.nom} » ?`))
      supprimer(p.id);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {perimetres.length} périmètre{perimetres.length !== 1 ? "s" : ""}
        </p>
        {peutGerer && !form && (
          <button
            onClick={() => ouvrir(null)}
            className="flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 transition-colors"
          >
            <Plus size={13} />
            Ajouter un périmètre
          </button>
        )}
      </div>

      {form && (
        <form
          onSubmit={soumettre}
          className="rounded-xl border border-green-100 bg-white p-5 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800">
              {enEdition ? "Modifier le périmètre" : "Nouveau périmètre"}
            </h3>
            <button
              type="button"
              onClick={fermer}
              className="rounded p-1 text-gray-400 hover:bg-gray-100"
            >
              <X size={15} />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Champ label="Nom" requis>
              <input value={form.nom} onChange={maj("nom")} className={champ} />
            </Champ>
            <Champ label="Village" requis>
              <input
                value={form.village}
                onChange={maj("village")}
                className={champ}
              />
            </Champ>
            <Champ label="Commune">
              <input
                value={form.commune}
                onChange={maj("commune")}
                className={champ}
              />
            </Champ>
            <Champ label="Département">
              <input
                value={form.departement}
                onChange={maj("departement")}
                className={champ}
              />
            </Champ>
            <Champ label="Superficie (ha)">
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.superficieHa}
                onChange={maj("superficieHa")}
                className={champ}
              />
            </Champ>
            <Champ label="Cultures">
              <input
                value={form.cultures}
                onChange={maj("cultures")}
                placeholder="Oignon, tomate, chou"
                className={champ}
              />
            </Champ>
            <Champ label="Latitude">
              <input
                inputMode="decimal"
                value={form.latitude}
                onChange={maj("latitude")}
                placeholder="12.678912"
                className={champ}
              />
            </Champ>
            <Champ label="Longitude">
              <div className="flex gap-2">
                <input
                  inputMode="decimal"
                  value={form.longitude}
                  onChange={maj("longitude")}
                  placeholder="-14.002100"
                  className={champ}
                />
                <button
                  type="button"
                  onClick={maPosition}
                  disabled={localisation}
                  title="Utiliser ma position"
                  className="flex shrink-0 items-center gap-1 rounded-lg border border-gray-200 px-2.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-60"
                >
                  <LocateFixed size={14} />
                  {localisation ? "…" : "Ma position"}
                </button>
              </div>
            </Champ>
            <Champ label="Technicien">
              <select
                value={form.technicienId}
                onChange={maj("technicienId")}
                className={champ}
              >
                <option value="">Non affecté</option>
                {techniciens.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nom}
                  </option>
                ))}
              </select>
            </Champ>
            <Champ label="Superviseur">
              <select
                value={form.superviseurId}
                onChange={maj("superviseurId")}
                className={champ}
              >
                <option value="">Non affecté</option>
                {superviseurs.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nom}
                  </option>
                ))}
              </select>
            </Champ>
          </div>
          <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
            <button
              type="button"
              onClick={fermer}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg px-4 py-1.5 text-xs font-medium text-white disabled:opacity-60"
              style={{
                background: "linear-gradient(135deg, #5A9C3A, #4A7C2F)",
              }}
            >
              {isPending ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="px-6 py-10 text-center text-sm text-gray-400">
            Chargement...
          </div>
        ) : perimetres.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-gray-400">
            Aucun périmètre pour ce projet.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {[
                  "Périmètre",
                  "Localisation",
                  "Superficie",
                  "Technicien",
                  "Superviseur",
                  "Activités",
                  "",
                ].map((t) => (
                  <th
                    key={t}
                    className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                  >
                    {t}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {perimetres.map((p) => (
                <Fragment key={p.id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-3">
                      <p className="text-sm font-medium text-gray-900">
                        {p.nom}
                      </p>
                      <p className="text-xs text-gray-400">
                        {[p.village, ...(p.cultures ?? [])].join(" · ")}
                      </p>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {[p.commune, p.departement].filter(Boolean).join(", ") ||
                        "Non renseigné"}
                      {p.latitude != null && (
                        <p className="text-xs tabular-nums text-gray-400">
                          {Number(p.latitude).toFixed(5)}, {Number(p.longitude).toFixed(5)}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {p.superficieHa != null
                        ? `${new Intl.NumberFormat("fr-SN").format(p.superficieHa)} ha`
                        : ""}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-700">
                      {p.technicienNom ?? "Non affecté"}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-700">
                      {p.superviseurNom ?? "Non affecté"}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {p.nbActivites}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() =>
                            setOuvert(ouvert === p.id ? null : p.id)
                          }
                          title="Indicateurs"
                          className={`rounded-lg p-1.5 hover:bg-gray-100 hover:text-gray-700 ${
                            ouvert === p.id ? "text-primary" : "text-gray-400"
                          }`}
                        >
                          <BarChart3 size={14} />
                        </button>
                        {peutGerer && (
                          <>
                            <button
                              onClick={() => ouvrir(p)}
                              title="Modifier"
                              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => confirmerSuppression(p)}
                              title="Supprimer"
                              className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {perimetres.some((p) => p.id === ouvert) && (
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-800">
              Indicateurs : {perimetres.find((p) => p.id === ouvert).nom}
            </h3>
            <button
              onClick={() => setOuvert(null)}
              className="rounded p-1 text-gray-400 hover:bg-gray-100"
            >
              <X size={15} />
            </button>
          </div>
          <LigneIndicateurs perimetreId={ouvert} />
        </section>
      )}

      <AnimateursProjet projet={projet} peutGerer={peutGerer} />
    </div>
  );
}
