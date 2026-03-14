import { useMesRapports, useSoumettreRapport } from "@/api/terrain.api";
import {
  CheckCircle,
  Clock,
  FileText,
  Plus,
  XCircle,
} from "lucide-react";
import { useState } from "react";

const TYPES_RAPPORT = [
  { value: "HEBDOMADAIRE", label: "Hebdomadaire" },
  { value: "MENSUEL",      label: "Mensuel" },
  { value: "PONCTUEL",     label: "Ponctuel / Événement" },
];

const STATUT_CONFIG = {
  SOUMIS:   { label: "Soumis",   color: "bg-blue-100 text-blue-700",   icon: Clock },
  VALIDE:   { label: "Validé",   color: "bg-green-100 text-green-700", icon: CheckCircle },
  REJETE:   { label: "Rejeté",   color: "bg-red-100 text-red-700",     icon: XCircle },
  BROUILLON:{ label: "Brouillon",color: "bg-gray-100 text-gray-600",   icon: FileText },
};

export default function TerrainRapports() {
  const { data: rapports = [], isLoading } = useMesRapports();
  const soumettre = useSoumettreRapport();
  const [showModal, setShowModal] = useState(false);

  const handleSave = async (data) => {
    await soumettre.mutateAsync(data);
    setShowModal(false);
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">{rapports.length} rapport(s)</p>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus size={15} />
          Nouveau rapport
        </button>
      </div>

      {/* Liste */}
      {isLoading ? (
        <div className="text-center py-12 text-sm text-gray-400">Chargement…</div>
      ) : rapports.length === 0 ? (
        <div className="text-center py-12">
          <FileText size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-400">Aucun rapport soumis</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-3 text-sm text-primary font-medium hover:underline"
          >
            Soumettre mon premier rapport
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {rapports.map((r) => {
            const meta = STATUT_CONFIG[r.statut] ?? STATUT_CONFIG.BROUILLON;
            const Icon = meta.icon;
            return (
              <div key={r.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                        {TYPES_RAPPORT.find((t) => t.value === r.type)?.label ?? r.type}
                      </span>
                      <span className="text-xs text-gray-400">{r.projetCode}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900">{r.titre}</h3>
                    {r.periode && (
                      <p className="text-xs text-gray-400 mt-0.5">Période : {r.periode}</p>
                    )}
                  </div>
                  <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${meta.color}`}>
                    <Icon size={12} />
                    {meta.label}
                  </span>
                </div>

                {r.contenu && (
                  <p className="text-xs text-gray-500 line-clamp-2 mt-2 border-t border-gray-50 pt-2">
                    {r.contenu}
                  </p>
                )}

                <p className="text-xs text-gray-400 mt-2">
                  Soumis le {new Date(r.dateCreation).toLocaleDateString("fr-FR")}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal nouveau rapport */}
      {showModal && (
        <RapportModal
          onClose={() => setShowModal(false)}
          onSave={handleSave}
          loading={soumettre.isPending}
        />
      )}
    </div>
  );
}

function RapportModal({ onClose, onSave, loading }) {
  const [form, setForm] = useState({
    titre: "",
    type: "HEBDOMADAIRE",
    periode: "",
    projetCode: "",
    contenu: "",
  });

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const valid = form.titre.trim() && form.type && form.contenu.trim();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!valid) return;
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between shrink-0">
          <h2 className="text-base font-semibold text-gray-900">Nouveau rapport d'activité</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">×</button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">Titre *</label>
            <input
              value={form.titre}
              onChange={(e) => set("titre", e.target.value)}
              required
              className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Ex: Rapport hebdomadaire S11 2026"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Type *</label>
              <select
                value={form.type}
                onChange={(e) => set("type", e.target.value)}
                className="w-full h-9 text-sm border border-gray-300 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {TYPES_RAPPORT.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Code projet</label>
              <input
                value={form.projetCode}
                onChange={(e) => set("projetCode", e.target.value)}
                className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="PROJ-2024-001"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">Période couverte</label>
            <input
              value={form.periode}
              onChange={(e) => set("periode", e.target.value)}
              className="w-full h-9 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Ex: 10/03/2026 – 16/03/2026"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">Contenu du rapport *</label>
            <textarea
              value={form.contenu}
              onChange={(e) => set("contenu", e.target.value)}
              rows={5}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Décrivez les activités réalisées, observations, difficultés rencontrées…"
            />
          </div>
        </form>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="h-9 px-4 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !valid}
            className="h-9 px-4 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {loading ? "Envoi…" : "Soumettre"}
          </button>
        </div>
      </div>
    </div>
  );
}
