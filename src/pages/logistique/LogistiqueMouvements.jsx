import {
  useMouvements,
  useEnregistrerMouvement,
  useBiens,
  useVehicules,
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
import { ArrowRight, Plus, Search } from "lucide-react";
import { useState } from "react";

const TYPES_MOUVEMENT = [
  { value: "AFFECTATION", label: "Affectation", color: "bg-blue-100 text-blue-700" },
  { value: "RETOUR", label: "Retour", color: "bg-gray-100 text-gray-700" },
  { value: "TRANSFERT", label: "Transfert", color: "bg-purple-100 text-purple-700" },
  { value: "MAINTENANCE", label: "Maintenance", color: "bg-orange-100 text-orange-700" },
  { value: "MISE_AU_REBUT", label: "Mise au rebut", color: "bg-red-100 text-red-700" },
];

export default function LogistiqueMouvements() {
  const { data: mouvements = [], isLoading } = useMouvements();
  const enregistrerMouvement = useEnregistrerMouvement();
  const [search, setSearch] = useState("");
  const [filtreType, setFiltreType] = useState("TOUS");
  const [showModal, setShowModal] = useState(false);

  const mouvFiltres = mouvements.filter((m) => {
    const txt = search.toLowerCase();
    const matchSearch =
      !txt ||
      m.bienDesignation?.toLowerCase().includes(txt) ||
      m.bienCodeActif?.toLowerCase().includes(txt) ||
      m.vehiculeImmatriculation?.toLowerCase().includes(txt) ||
      m.motif?.toLowerCase().includes(txt) ||
      m.localisationArrivee?.toLowerCase().includes(txt);
    const matchType = filtreType === "TOUS" || m.type === filtreType;
    return matchSearch && matchType;
  });

  const handleSave = async (data) => {
    await enregistrerMouvement.mutateAsync(data);
    setShowModal(false);
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            className="pl-9 h-9 text-sm"
            placeholder="Rechercher par bien, véhicule, motif…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filtreType} onValueChange={setFiltreType}>
          <SelectTrigger className="h-9 text-sm w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TOUS">Tous les types</SelectItem>
            {TYPES_MOUVEMENT.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" onClick={() => setShowModal(true)} className="gap-2 shrink-0">
          <Plus size={15} /> Enregistrer un mouvement
        </Button>
      </div>

      <p className="text-xs text-gray-500">{mouvFiltres.length} mouvement(s)</p>

      {/* Liste */}
      {isLoading ? (
        <div className="text-center py-12 text-sm text-gray-400">Chargement…</div>
      ) : mouvFiltres.length === 0 ? (
        <div className="text-center py-12">
          <ArrowRight size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-400">Aucun mouvement enregistré</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Bien / Véhicule</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Trajet</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Motif</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mouvFiltres.map((m) => {
                const typeMeta = TYPES_MOUVEMENT.find((t) => t.value === m.type);
                return (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {m.dateMouvement ? new Date(m.dateMouvement).toLocaleDateString("fr-FR") : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeMeta?.color ?? "bg-gray-100 text-gray-600"}`}>
                        {typeMeta?.label ?? m.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {m.bienDesignation ? (
                        <div>
                          <p className="font-medium text-gray-900 truncate max-w-48">{m.bienDesignation}</p>
                          <p className="text-xs text-gray-400 font-mono">{m.bienCodeActif}</p>
                        </div>
                      ) : m.vehiculeImmatriculation ? (
                        <p className="font-medium text-gray-900 font-mono">{m.vehiculeImmatriculation}</p>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {m.localisationDepart || m.localisationArrivee ? (
                        <div className="flex items-center gap-1 text-xs text-gray-500 max-w-64">
                          <span className="truncate">{m.localisationDepart || "—"}</span>
                          <ArrowRight size={11} className="shrink-0 text-gray-300" />
                          <span className="truncate">{m.localisationArrivee || "—"}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 hidden md:table-cell max-w-48 truncate">
                      {m.motif || "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <MouvementModal
          onClose={() => setShowModal(false)}
          onSave={handleSave}
          loading={enregistrerMouvement.isPending}
        />
      )}
    </div>
  );
}

function MouvementModal({ onClose, onSave, loading }) {
  const { data: biens = [] } = useBiens();
  const { data: vehicules = [] } = useVehicules();

  const [cible, setCible] = useState("bien"); // "bien" | "vehicule"
  const [form, setForm] = useState({
    type: "",
    bienId: "",
    vehiculeId: "",
    localisationDepart: "",
    localisationArrivee: "",
    dateMouvement: new Date().toISOString().slice(0, 10),
    motif: "",
    notes: "",
  });

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      bienId: cible === "bien" ? form.bienId || null : null,
      vehiculeId: cible === "vehicule" ? form.vehiculeId || null : null,
    });
  };

  const biensActifs = biens.filter((b) => b.etat !== "HORS_SERVICE");
  const vehuculesActifs = vehicules.filter((v) => v.etat !== "HORS_SERVICE");

  const valid = form.type && form.dateMouvement && (
    (cible === "bien" && form.bienId) || (cible === "vehicule" && form.vehiculeId)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between shrink-0">
          <h2 className="text-base font-semibold text-gray-900">Enregistrer un mouvement</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">×</button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Type mouvement */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">Type de mouvement *</label>
            <Select value={form.type} onValueChange={(v) => set("type", v)} required>
              <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Choisir…" /></SelectTrigger>
              <SelectContent>
                {TYPES_MOUVEMENT.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cible */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">Concerne *</label>
            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
              {["bien", "vehicule"].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCible(c)}
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    cible === c ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {c === "bien" ? "Équipement" : "Véhicule"}
                </button>
              ))}
            </div>
          </div>

          {cible === "bien" ? (
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Équipement *</label>
              <Select value={form.bienId} onValueChange={(v) => set("bienId", v)}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Choisir un bien…" /></SelectTrigger>
                <SelectContent>
                  {biensActifs.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.codeActif} — {b.designation}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Véhicule *</label>
              <Select value={form.vehiculeId} onValueChange={(v) => set("vehiculeId", v)}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Choisir un véhicule…" /></SelectTrigger>
                <SelectContent>
                  {vehuculesActifs.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.immatriculation} — {v.marque} {v.modele}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">Date *</label>
            <Input
              type="date"
              value={form.dateMouvement}
              onChange={(e) => set("dateMouvement", e.target.value)}
              required
              className="h-9 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Localisation départ</label>
              <Input value={form.localisationDepart} onChange={(e) => set("localisationDepart", e.target.value)} className="h-9 text-sm" placeholder="Ex: Magasin central" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Localisation arrivée</label>
              <Input value={form.localisationArrivee} onChange={(e) => set("localisationArrivee", e.target.value)} className="h-9 text-sm" placeholder="Ex: Antenne Vélingara" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">Motif</label>
            <Input value={form.motif} onChange={(e) => set("motif", e.target.value)} className="h-9 text-sm" placeholder="Motif du mouvement" />
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
          <Button size="sm" onClick={handleSubmit} disabled={loading || !valid}>
            {loading ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      </div>
    </div>
  );
}
