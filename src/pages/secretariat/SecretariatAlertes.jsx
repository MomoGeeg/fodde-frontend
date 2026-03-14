import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, CheckCircle2, ExternalLink, CheckCheck } from "lucide-react";
import {
  useAlertesSE,
  useMarquerAlerteLue,
  useMarquerToutesLues,
} from "@/api/secretariat.api";

// ── Filtres ───────────────────────────────────────────────────────────────────
const NIVEAUX = ["TOUS", "CRITIQUE", "URGENT", "WARNING"];
const MODULES = ["TOUS", "PROJETS", "FINANCES", "RH", "SE", "GED"];

function NiveauBadge({ niveau }) {
  const map = {
    CRITIQUE: "bg-red-100 text-red-800 border-red-200",
    URGENT:   "bg-orange-100 text-orange-800 border-orange-200",
    WARNING:  "bg-yellow-100 text-yellow-800 border-yellow-200",
  };
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${map[niveau] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
      {niveau}
    </span>
  );
}

function NiveauDot({ niveau }) {
  const map = {
    CRITIQUE: "bg-red-500",
    URGENT:   "bg-orange-500",
    WARNING:  "bg-yellow-400",
  };
  return <span className={`h-2 w-2 rounded-full shrink-0 ${map[niveau] ?? "bg-gray-300"}`} />;
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SecretariatAlertes() {
  const navigate = useNavigate();
  const { data: alertes = [], isLoading } = useAlertesSE();
  const { mutate: marquerLue } = useMarquerAlerteLue();
  const { mutate: marquerToutesLues, isPending: clearing } = useMarquerToutesLues();

  const [niveauFilter, setNiveauFilter] = useState("TOUS");
  const [moduleFilter, setModuleFilter] = useState("TOUS");
  const [showLues, setShowLues] = useState(false);

  const filtered = alertes.filter((a) => {
    if (!showLues && a.lue) return false;
    if (niveauFilter !== "TOUS" && a.niveau !== niveauFilter) return false;
    if (moduleFilter !== "TOUS" && a.module !== moduleFilter) return false;
    return true;
  });

  const nonLuesCount = alertes.filter((a) => !a.lue).length;
  const critiquesCount = alertes.filter((a) => a.niveau === "CRITIQUE" && !a.lue).length;

  return (
    <div className="space-y-5">
      {/* Bannière récapitulatif */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Alertes non lues", value: nonLuesCount, color: "bg-gray-900 text-white" },
          { label: "Critiques", value: critiquesCount, color: "bg-red-500 text-white" },
          { label: "Urgentes", value: alertes.filter((a) => a.niveau === "URGENT" && !a.lue).length, color: "bg-orange-500 text-white" },
        ].map(({ label, value, color }) => (
          <div key={label} className={`rounded-2xl p-4 ${color}`}>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm opacity-80">{label}</p>
          </div>
        ))}
      </div>

      {/* Barre de contrôle */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Filtre niveau */}
          <div className="flex gap-1 rounded-xl border border-gray-100 bg-white p-1">
            {NIVEAUX.map((n) => (
              <button
                key={n}
                onClick={() => setNiveauFilter(n)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  niveauFilter === n
                    ? "bg-gray-900 text-white"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {n}
              </button>
            ))}
          </div>

          {/* Filtre module */}
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="rounded-xl border border-gray-100 bg-white px-3 py-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            {MODULES.map((m) => (
              <option key={m} value={m}>{m === "TOUS" ? "Tous les modules" : m}</option>
            ))}
          </select>

          {/* Afficher lues */}
          <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-600">
            <input
              type="checkbox"
              checked={showLues}
              onChange={(e) => setShowLues(e.target.checked)}
              className="rounded border-gray-300"
            />
            Afficher les alertes lues
          </label>
        </div>

        {nonLuesCount > 0 && (
          <button
            onClick={() => marquerToutesLues()}
            disabled={clearing}
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            <CheckCheck size={15} />
            {clearing ? "Traitement…" : "Tout marquer comme lu"}
          </button>
        )}
      </div>

      {/* Liste alertes */}
      {isLoading ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center text-sm text-gray-400">
          Chargement…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center">
          <CheckCircle2 size={32} className="mx-auto mb-3 text-green-400" />
          <p className="text-sm font-medium text-gray-700">
            Aucune alerte{niveauFilter !== "TOUS" || moduleFilter !== "TOUS" ? " correspondant aux filtres" : ""}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((a) => (
            <div
              key={a.id}
              className={`rounded-2xl border bg-white p-4 transition-opacity ${
                a.lue ? "opacity-50" : ""
              } ${
                a.niveau === "CRITIQUE"
                  ? "border-red-200"
                  : a.niveau === "URGENT"
                  ? "border-orange-200"
                  : "border-gray-100"
              }`}
            >
              <div className="flex items-start gap-3">
                <NiveauDot niveau={a.niveau} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <NiveauBadge niveau={a.niveau} />
                    <span className="text-xs text-gray-400">{a.module}</span>
                    <span className="text-xs text-gray-300">·</span>
                    <span className="text-xs text-gray-400">
                      {new Date(a.date).toLocaleDateString("fr-SN")}
                    </span>
                    {a.lue && (
                      <span className="text-xs text-green-600 font-medium">Lu</span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{a.titre}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{a.description}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => navigate(a.lien)}
                    className="rounded-lg p-1.5 hover:bg-gray-100 text-gray-400 hover:text-gray-700"
                    title="Accéder à la ressource"
                  >
                    <ExternalLink size={15} />
                  </button>
                  {!a.lue && (
                    <button
                      onClick={() => marquerLue(a.id)}
                      className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                    >
                      Marquer lu
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {filtered.length > 0 && (
        <p className="text-xs text-gray-400">
          {filtered.length} alerte{filtered.length > 1 ? "s" : ""} affichée{filtered.length > 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
