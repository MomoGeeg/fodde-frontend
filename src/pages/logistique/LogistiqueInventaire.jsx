import {
  useBiens,
  useCreerBien,
  useModifierBien,
  useMettreHorsService,
} from "@/api/logistique.api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Box, Pencil, Plus, PowerOff, Search } from "lucide-react";
import { useState } from "react";

const CATEGORIES = [
  { value: "INFORMATIQUE", label: "Informatique" },
  { value: "MOBILIER", label: "Mobilier" },
  { value: "EQUIPEMENT_TERRAIN", label: "Équipement terrain" },
  { value: "ELECTROMENAGER", label: "Électroménager" },
  { value: "MATERIEL_MEDICAL", label: "Matériel médical" },
  { value: "MATERIEL_AGRICOLE", label: "Matériel agricole" },
  { value: "VEHICULE_LEGER", label: "Véhicule léger" },
  { value: "AUTRE", label: "Autre" },
];

const ETATS = [
  { value: "NEUF", label: "Neuf" },
  { value: "BON_ETAT", label: "Bon état" },
  { value: "USE", label: "Usagé" },
  { value: "EN_REPARATION", label: "En réparation" },
  { value: "HORS_SERVICE", label: "Hors service" },
];

const ETAT_COLOR = {
  NEUF: "bg-emerald-100 text-emerald-700",
  BON_ETAT: "bg-green-100 text-green-700",
  USE: "bg-yellow-100 text-yellow-700",
  EN_REPARATION: "bg-orange-100 text-orange-700",
  HORS_SERVICE: "bg-red-100 text-red-700",
};

const CAT_COLOR = {
  INFORMATIQUE: "bg-blue-100 text-blue-700",
  MOBILIER: "bg-purple-100 text-purple-700",
  EQUIPEMENT_TERRAIN: "bg-amber-100 text-amber-700",
  ELECTROMENAGER: "bg-cyan-100 text-cyan-700",
  MATERIEL_MEDICAL: "bg-pink-100 text-pink-700",
  MATERIEL_AGRICOLE: "bg-lime-100 text-lime-700",
  VEHICULE_LEGER: "bg-indigo-100 text-indigo-700",
  AUTRE: "bg-gray-100 text-gray-700",
};

export default function LogistiqueInventaire() {
  const { data: biens = [], isLoading } = useBiens();
  const creerBien = useCreerBien();
  const modifierBien = useModifierBien();
  const mettreHorsService = useMettreHorsService();

  const [search, setSearch] = useState("");
  const [filtreEtat, setFiltreEtat] = useState("TOUS");
  const [filtreCategorie, setFiltreCategorie] = useState("TOUTES");
  const [showModal, setShowModal] = useState(false);
  const [editBien, setEditBien] = useState(null);

  const biensFiltrés = biens.filter((b) => {
    const matchSearch =
      !search ||
      b.designation?.toLowerCase().includes(search.toLowerCase()) ||
      b.codeActif?.toLowerCase().includes(search.toLowerCase()) ||
      b.marque?.toLowerCase().includes(search.toLowerCase());
    const matchEtat = filtreEtat === "TOUS" || b.etat === filtreEtat;
    const matchCat = filtreCategorie === "TOUTES" || b.categorie === filtreCategorie;
    return matchSearch && matchEtat && matchCat;
  });

  const handleSave = async (formData) => {
    if (editBien) {
      await modifierBien.mutateAsync({ id: editBien.id, data: formData });
    } else {
      await creerBien.mutateAsync(formData);
    }
    setShowModal(false);
    setEditBien(null);
  };

  const handleEdit = (bien) => {
    setEditBien(bien);
    setShowModal(true);
  };

  const handleHorsService = (id) => {
    if (confirm("Marquer ce bien comme Hors service ? Cette action ne peut pas être annulée.")) {
      mettreHorsService.mutate(id);
    }
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            className="pl-9 h-9 text-sm"
            placeholder="Rechercher par désignation, code, marque…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filtreCategorie} onValueChange={setFiltreCategorie}>
          <SelectTrigger className="h-9 text-sm w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TOUTES">Toutes catégories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filtreEtat} onValueChange={setFiltreEtat}>
          <SelectTrigger className="h-9 text-sm w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TOUS">Tous états</SelectItem>
            {ETATS.map((e) => (
              <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          onClick={() => { setEditBien(null); setShowModal(true); }}
          className="gap-2 shrink-0"
        >
          <Plus size={15} /> Nouveau bien
        </Button>
      </div>

      {/* Compteur */}
      <p className="text-xs text-gray-500">
        {biensFiltrés.length} équipement(s) affiché(s)
      </p>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-12 text-sm text-gray-400">Chargement…</div>
      ) : biensFiltrés.length === 0 ? (
        <div className="text-center py-12">
          <Box size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-400">Aucun équipement trouvé</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Code</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Désignation</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Catégorie</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Localisation</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Valeur</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">État</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {biensFiltrés.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{b.codeActif}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 truncate max-w-48">{b.designation}</p>
                    {(b.marque || b.modele) && (
                      <p className="text-xs text-gray-400">{[b.marque, b.modele].filter(Boolean).join(" ")}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CAT_COLOR[b.categorie] ?? "bg-gray-100 text-gray-600"}`}>
                      {CATEGORIES.find((c) => c.value === b.categorie)?.label ?? b.categorie}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 hidden lg:table-cell truncate max-w-36">
                    {b.localisationActuelle || "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 hidden lg:table-cell">
                    {b.valeurAcquisition
                      ? new Intl.NumberFormat("fr-SN").format(b.valeurAcquisition) + " F"
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ETAT_COLOR[b.etat] ?? "bg-gray-100 text-gray-600"}`}>
                      {ETATS.find((e) => e.value === b.etat)?.label ?? b.etat}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleEdit(b)}
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-900"
                        title="Modifier"
                      >
                        <Pencil size={14} />
                      </button>
                      {b.etat !== "HORS_SERVICE" && (
                        <button
                          onClick={() => handleHorsService(b.id)}
                          className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600"
                          title="Mettre hors service"
                        >
                          <PowerOff size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal ajout/édition */}
      {showModal && (
        <BienModal
          initial={editBien}
          onClose={() => { setShowModal(false); setEditBien(null); }}
          onSave={handleSave}
          loading={creerBien.isPending || modifierBien.isPending}
        />
      )}
    </div>
  );
}

function BienModal({ initial, onClose, onSave, loading }) {
  const [form, setForm] = useState({
    designation: initial?.designation ?? "",
    categorie: initial?.categorie ?? "",
    marque: initial?.marque ?? "",
    modele: initial?.modele ?? "",
    numeroSerie: initial?.numeroSerie ?? "",
    etat: initial?.etat ?? "BON_ETAT",
    valeurAcquisition: initial?.valeurAcquisition ?? "",
    dateAcquisition: initial?.dateAcquisition ?? "",
    localisationActuelle: initial?.localisationActuelle ?? "",
    notes: initial?.notes ?? "",
  });

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      valeurAcquisition: form.valeurAcquisition ? Number(form.valeurAcquisition) : null,
      dateAcquisition: form.dateAcquisition || null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between shrink-0">
          <h2 className="text-base font-semibold text-gray-900">
            {initial ? "Modifier l'équipement" : "Nouvel équipement"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">Désignation *</label>
            <Input
              value={form.designation}
              onChange={(e) => set("designation", e.target.value)}
              placeholder="Ex: Ordinateur portable Dell"
              required
              className="h-9 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Catégorie *</label>
              <Select value={form.categorie} onValueChange={(v) => set("categorie", v)} required>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Choisir…" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">État</label>
              <Select value={form.etat} onValueChange={(v) => set("etat", v)}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ETATS.map((e) => (
                    <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Marque</label>
              <Input value={form.marque} onChange={(e) => set("marque", e.target.value)} className="h-9 text-sm" placeholder="Ex: Dell" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Modèle</label>
              <Input value={form.modele} onChange={(e) => set("modele", e.target.value)} className="h-9 text-sm" placeholder="Ex: XPS 15" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Numéro de série</label>
              <Input value={form.numeroSerie} onChange={(e) => set("numeroSerie", e.target.value)} className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Valeur d'acquisition (F)</label>
              <Input type="number" value={form.valeurAcquisition} onChange={(e) => set("valeurAcquisition", e.target.value)} className="h-9 text-sm" placeholder="0" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Date d'acquisition</label>
              <Input type="date" value={form.dateAcquisition} onChange={(e) => set("dateAcquisition", e.target.value)} className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Localisation actuelle</label>
              <Input value={form.localisationActuelle} onChange={(e) => set("localisationActuelle", e.target.value)} className="h-9 text-sm" placeholder="Ex: Bureau – Kolda" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={2}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Notes complémentaires…"
            />
          </div>
        </form>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={loading || !form.designation || !form.categorie}>
            {loading ? "Enregistrement…" : initial ? "Enregistrer" : "Créer"}
          </Button>
        </div>
      </div>
    </div>
  );
}
