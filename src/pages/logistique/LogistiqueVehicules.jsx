import {
  useVehicules,
  useCreerVehicule,
  useModifierVehicule,
} from "@/api/logistique.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  Car,
  CheckCircle,
  Pencil,
  Plus,
} from "lucide-react";
import { useState } from "react";

const CARBURANTS = [
  { value: "ESSENCE", label: "Essence" },
  { value: "DIESEL", label: "Diesel" },
  { value: "HYBRIDE", label: "Hybride" },
  { value: "ELECTRIQUE", label: "Électrique" },
];

const ETATS = [
  { value: "BON", label: "Bon" },
  { value: "MOYEN", label: "Moyen" },
  { value: "A_REVISER", label: "À réviser" },
  { value: "HORS_SERVICE", label: "Hors service" },
];

const ETAT_COLOR = {
  BON: "bg-green-100 text-green-700",
  MOYEN: "bg-yellow-100 text-yellow-700",
  A_REVISER: "bg-orange-100 text-orange-700",
  HORS_SERVICE: "bg-red-100 text-red-700",
};

export default function LogistiqueVehicules() {
  const { data: vehicules = [], isLoading } = useVehicules();
  const creerVehicule = useCreerVehicule();
  const modifierVehicule = useModifierVehicule();

  const [showModal, setShowModal] = useState(false);
  const [editVehicule, setEditVehicule] = useState(null);

  const alertes = vehicules.filter(
    (v) => v.alerteAssurance || v.alerteVisite || v.alerteKilometrage
  );

  const handleSave = async (data) => {
    if (editVehicule) {
      await modifierVehicule.mutateAsync({ id: editVehicule.id, data });
    } else {
      await creerVehicule.mutateAsync(data);
    }
    setShowModal(false);
    setEditVehicule(null);
  };

  const handleEdit = (v) => {
    setEditVehicule(v);
    setShowModal(true);
  };

  return (
    <div className="space-y-5">
      {/* Bandeau alertes */}
      {alertes.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-center gap-3">
          <AlertTriangle size={18} className="text-red-500 shrink-0" />
          <p className="text-sm text-red-700">
            <span className="font-semibold">{alertes.length} véhicule(s)</span> nécessitent
            une attention immédiate (assurance, visite technique ou kilométrage).
          </p>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{vehicules.length} véhicule(s) au total</p>
        <Button
          size="sm"
          onClick={() => { setEditVehicule(null); setShowModal(true); }}
          className="gap-2"
        >
          <Plus size={15} /> Nouveau véhicule
        </Button>
      </div>

      {/* Grille cartes */}
      {isLoading ? (
        <div className="text-center py-12 text-sm text-gray-400">Chargement…</div>
      ) : vehicules.length === 0 ? (
        <div className="text-center py-12">
          <Car size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-400">Aucun véhicule enregistré</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {vehicules.map((v) => (
            <VehiculeCard key={v.id} vehicule={v} onEdit={() => handleEdit(v)} />
          ))}
        </div>
      )}

      {showModal && (
        <VehiculeModal
          initial={editVehicule}
          onClose={() => { setShowModal(false); setEditVehicule(null); }}
          onSave={handleSave}
          loading={creerVehicule.isPending || modifierVehicule.isPending}
        />
      )}
    </div>
  );
}

function VehiculeCard({ vehicule: v, onEdit }) {
  const hasAlerte = v.alerteAssurance || v.alerteVisite || v.alerteKilometrage;

  return (
    <div
      className={`bg-white rounded-xl border shadow-sm overflow-hidden ${
        hasAlerte ? "border-red-300" : "border-gray-200"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          {hasAlerte ? (
            <AlertTriangle size={16} className="text-red-500" />
          ) : (
            <CheckCircle size={16} className="text-green-500" />
          )}
          <span className="font-semibold text-gray-900">{v.immatriculation}</span>
        </div>
        <div className="flex items-center gap-1">
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              ETAT_COLOR[v.etat] ?? "bg-gray-100 text-gray-600"
            }`}
          >
            {ETATS.find((e) => e.value === v.etat)?.label ?? v.etat}
          </span>
          <button
            onClick={onEdit}
            className="ml-1 p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
          >
            <Pencil size={13} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-2">
        <p className="text-sm font-medium text-gray-800">
          {v.marque} {v.modele} {v.annee ? `(${v.annee})` : ""}
        </p>
        <p className="text-xs text-gray-500">
          Carburant : {CARBURANTS.find((c) => c.value === v.typeCarburant)?.label ?? v.typeCarburant}
        </p>
        <p className="text-xs text-gray-500">
          Kilométrage :{" "}
          <span className={v.alerteKilometrage ? "font-semibold text-orange-600" : ""}>
            {v.kilometrageActuel?.toLocaleString("fr-SN")} km
          </span>
          {v.kilometrageRevision && (
            <span className="text-gray-400"> / seuil {v.kilometrageRevision?.toLocaleString("fr-SN")} km</span>
          )}
        </p>

        {/* Alertes */}
        <div className="space-y-1 pt-1">
          {v.alerteAssurance && (
            <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
              <AlertTriangle size={11} />
              Assurance expire dans{" "}
              <span className="font-semibold">
                {v.joursAvantAssurance < 0
                  ? `${Math.abs(v.joursAvantAssurance)}j (expirée)`
                  : `${v.joursAvantAssurance}j`}
              </span>
            </div>
          )}
          {v.alerteVisite && (
            <div className="flex items-center gap-1.5 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
              <AlertTriangle size={11} />
              Visite technique dans{" "}
              <span className="font-semibold">
                {v.joursAvantVisite < 0
                  ? `${Math.abs(v.joursAvantVisite)}j (expirée)`
                  : `${v.joursAvantVisite}j`}
              </span>
            </div>
          )}
          {v.alerteKilometrage && (
            <div className="flex items-center gap-1.5 text-xs text-yellow-700 bg-yellow-50 px-2 py-1 rounded">
              <AlertTriangle size={11} />
              Révision kilométrique requise
            </div>
          )}
        </div>

        {/* Dates */}
        <div className="pt-1 grid grid-cols-2 gap-2 text-xs text-gray-400 border-t border-gray-100 mt-2">
          <div>
            <p className="font-medium text-gray-500">Assurance</p>
            <p>{v.dateExpirationAssurance || "—"}</p>
          </div>
          <div>
            <p className="font-medium text-gray-500">Visite technique</p>
            <p>{v.dateVisiteTechnique || "—"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function VehiculeModal({ initial, onClose, onSave, loading }) {
  const [form, setForm] = useState({
    immatriculation: initial?.immatriculation ?? "",
    marque: initial?.marque ?? "",
    modele: initial?.modele ?? "",
    annee: initial?.annee ?? "",
    kilometrageActuel: initial?.kilometrageActuel ?? "",
    kilometrageRevision: initial?.kilometrageRevision ?? "",
    etat: initial?.etat ?? "BON",
    typeCarburant: initial?.typeCarburant ?? "DIESEL",
    dateExpirationAssurance: initial?.dateExpirationAssurance ?? "",
    dateVisiteTechnique: initial?.dateVisiteTechnique ?? "",
    notes: initial?.notes ?? "",
  });

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      annee: form.annee ? Number(form.annee) : null,
      kilometrageActuel: form.kilometrageActuel ? Number(form.kilometrageActuel) : 0,
      kilometrageRevision: form.kilometrageRevision ? Number(form.kilometrageRevision) : null,
      dateExpirationAssurance: form.dateExpirationAssurance || null,
      dateVisiteTechnique: form.dateVisiteTechnique || null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between shrink-0">
          <h2 className="text-base font-semibold text-gray-900">
            {initial ? "Modifier le véhicule" : "Nouveau véhicule"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">×</button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">Immatriculation *</label>
            <Input
              value={form.immatriculation}
              onChange={(e) => set("immatriculation", e.target.value.toUpperCase())}
              placeholder="Ex: DK-7823-AB"
              required
              className="h-9 text-sm font-mono"
              disabled={!!initial}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Marque *</label>
              <Input value={form.marque} onChange={(e) => set("marque", e.target.value)} required className="h-9 text-sm" placeholder="Toyota" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Modèle</label>
              <Input value={form.modele} onChange={(e) => set("modele", e.target.value)} className="h-9 text-sm" placeholder="Land Cruiser" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Année</label>
              <Input type="number" value={form.annee} onChange={(e) => set("annee", e.target.value)} className="h-9 text-sm" placeholder="2022" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">État</label>
              <Select value={form.etat} onValueChange={(v) => set("etat", v)}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ETATS.map((e) => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Carburant</label>
              <Select value={form.typeCarburant} onValueChange={(v) => set("typeCarburant", v)}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CARBURANTS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Km actuel</label>
              <Input type="number" value={form.kilometrageActuel} onChange={(e) => set("kilometrageActuel", e.target.value)} className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Km révision (seuil)</label>
              <Input type="number" value={form.kilometrageRevision} onChange={(e) => set("kilometrageRevision", e.target.value)} className="h-9 text-sm" placeholder="ex: 100000" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Expir. assurance</label>
              <Input type="date" value={form.dateExpirationAssurance} onChange={(e) => set("dateExpirationAssurance", e.target.value)} className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Visite technique</label>
              <Input type="date" value={form.dateVisiteTechnique} onChange={(e) => set("dateVisiteTechnique", e.target.value)} className="h-9 text-sm" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={2}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </form>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>Annuler</Button>
          <Button size="sm" onClick={handleSubmit} disabled={loading || !form.immatriculation || !form.marque}>
            {loading ? "Enregistrement…" : initial ? "Enregistrer" : "Créer"}
          </Button>
        </div>
      </div>
    </div>
  );
}
