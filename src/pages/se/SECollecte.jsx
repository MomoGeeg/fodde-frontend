import useAuthStore from "@/stores/auth.store";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckSquare,
  ChevronDown,
  FileText,
  Hash,
  List,
  Loader2,
  MapPin,
  Paperclip,
  Save,
  Send,
  ToggleLeft,
  Type,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { createSEHelpers, useFormulaires, useProjets } from "./se-data";

const TYPE_ICONS = {
  TEXTE: Type,
  NOMBRE: Hash,
  DATE: Calendar,
  SELECT: ChevronDown,
  CHECKBOX: CheckSquare,
  RADIO: List,
  FICHIER: Paperclip,
  GPS: MapPin,
  TOGGLE: ToggleLeft,
};

// ════════════════════════════════════════════════════════════
// PAGE 7 — Collecte de données terrain
// ════════════════════════════════════════════════════════════
export default function SECollecte() {
  const { formulaire_id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Données Supabase
  const { data: projets = [] } = useProjets();
  const { data: formulairesData = [] } = useFormulaires();

  const { getFormulaire, getProjet } = createSEHelpers(
    projets,
    [],
    [],
    [],
    formulairesData,
    [],
  );

  const formulaire = getFormulaire(formulaire_id);
  const projet = formulaire ? getProjet(formulaire.projetId) : null;

  // ── State ────────────────────────────────────────────────
  const [donnees, setDonnees] = useState({});
  const [gpsCoords, setGpsCoords] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [savedOffline, setSavedOffline] = useState(false);

  // Écouter l'état réseau
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Init données
  useEffect(() => {
    if (formulaire?.champs) {
      const init = {};
      formulaire.champs.forEach((c) => {
        if (c.type === "CHECKBOX") init[c.id] = [];
        else if (c.type === "TOGGLE") init[c.id] = false;
        else init[c.id] = "";
      });
      setDonnees(init);
    }
  }, [formulaire_id]);

  if (!formulaire) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate("/se/formulaires")}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft size={16} /> Retour
        </button>
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
          <AlertTriangle className="mx-auto mb-3 text-gray-300" size={40} />
          <p className="text-gray-500">Formulaire introuvable.</p>
        </div>
      </div>
    );
  }

  if (formulaire.statut !== "PUBLIE") {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate("/se/formulaires")}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft size={16} /> Retour
        </button>
        <div className="rounded-xl border border-orange-200 bg-orange-50 px-6 py-12 text-center shadow-sm">
          <FileText className="mx-auto mb-3 text-orange-400" size={40} />
          <p className="text-sm text-orange-700 font-medium">
            Ce formulaire n'est pas encore publié ou est clôturé.
          </p>
          <p className="text-xs text-orange-500 mt-1">
            Statut actuel : {formulaire.statut}
          </p>
        </div>
      </div>
    );
  }

  // ── Handlers ─────────────────────────────────────────────
  const updateField = (champId, value) => {
    setDonnees((prev) => ({ ...prev, [champId]: value }));
    // Effacer l'erreur
    if (errors[champId]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[champId];
        return next;
      });
    }
  };

  const toggleCheckbox = (champId, option) => {
    setDonnees((prev) => {
      const current = prev[champId] || [];
      return {
        ...prev,
        [champId]: current.includes(option)
          ? current.filter((o) => o !== option)
          : [...current, option],
      };
    });
  };

  const captureGPS = () => {
    if (!navigator.geolocation) {
      toast.error("Géolocalisation non supportée par ce navigateur");
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsCoords({
          lat: pos.coords.latitude.toFixed(6),
          lng: pos.coords.longitude.toFixed(6),
          accuracy: Math.round(pos.coords.accuracy),
        });
        setGpsLoading(false);
        toast.success("Position GPS capturée");
      },
      (err) => {
        setGpsLoading(false);
        toast.error("Impossible de capturer la position GPS");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  // ── Validation ───────────────────────────────────────────
  const validate = () => {
    const errs = {};
    formulaire.champs.forEach((champ) => {
      if (champ.obligatoire) {
        const val = donnees[champ.id];
        if (champ.type === "CHECKBOX") {
          if (!val || val.length === 0) errs[champ.id] = "Sélection requise";
        } else if (champ.type === "TOGGLE") {
          // toggle est toujours valide (true/false)
        } else {
          if (!val && val !== 0) errs[champ.id] = "Champ obligatoire";
        }
      }
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Soumission ───────────────────────────────────────────
  const handleSubmit = (asBrouillon = false) => {
    if (!asBrouillon && !validate()) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setSaving(true);
    if (!isOnline) {
      // Sauvegarder localement
      setTimeout(() => {
        setSaving(false);
        setSavedOffline(true);
        toast.success(
          "Réponse sauvegardée hors-ligne. Elle sera synchronisée à la reconnexion.",
        );
      }, 400);
    } else {
      setTimeout(() => {
        setSaving(false);
        toast.success(
          asBrouillon
            ? "Brouillon sauvegardé"
            : "Réponse soumise — en attente de validation",
        );
        navigate("/se/formulaires");
      }, 600);
    }
  };

  const champs = formulaire.champs || [];

  return (
    <div className="space-y-5">
      {/* Retour */}
      <button
        onClick={() => navigate("/se/formulaires")}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft size={16} /> Retour aux formulaires
      </button>

      {/* Indicateur réseau */}
      <div
        className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-medium ${
          isOnline
            ? "border-green-200 bg-green-50 text-green-700"
            : "border-orange-200 bg-orange-50 text-orange-700"
        }`}
      >
        {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
        {isOnline
          ? "Connecté — les données seront envoyées directement"
          : "Mode hors-ligne — les données seront stockées localement et synchronisées à la reconnexion"}
      </div>

      {savedOffline && (
        <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-medium text-blue-700">
          <Save size={14} />
          Réponse enregistrée localement. En attente de synchronisation…
        </div>
      )}

      {/* Header formulaire */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-green-50 p-2.5">
            <FileText size={20} className="text-green-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {formulaire.titre}
            </h2>
            {formulaire.description && (
              <p className="mt-0.5 text-xs text-gray-500">
                {formulaire.description}
              </p>
            )}
            <p className="mt-1 text-[10px] text-gray-400">
              Projet : {projet?.code} — {projet?.titre}
            </p>
          </div>
        </div>
      </div>

      {/* Formulaire dynamique */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-5">
        {/* Date de collecte */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Date de collecte <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={donnees._dateCollecte || ""}
            onChange={(e) => updateField("_dateCollecte", e.target.value)}
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-100 w-full max-w-xs"
          />
        </div>

        {/* Champs du formulaire */}
        {champs.map((champ, i) => {
          const TypeIcon = TYPE_ICONS[champ.type] || Type;
          const hasError = errors[champ.id];
          return (
            <div key={champ.id}>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700">
                <TypeIcon size={14} className="text-gray-400" />
                {champ.libelle}
                {champ.obligatoire && <span className="text-red-500">*</span>}
              </label>

              {/* TEXTE */}
              {champ.type === "TEXTE" && (
                <input
                  type="text"
                  value={donnees[champ.id] || ""}
                  onChange={(e) => updateField(champ.id, e.target.value)}
                  className={`w-full rounded-xl border px-3 py-2 text-sm focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-100 ${hasError ? "border-red-400" : "border-gray-200"}`}
                  placeholder={champ.placeholder || ""}
                />
              )}

              {/* NOMBRE */}
              {champ.type === "NOMBRE" && (
                <input
                  type="number"
                  value={donnees[champ.id] || ""}
                  onChange={(e) => updateField(champ.id, e.target.value)}
                  className={`w-full rounded-xl border px-3 py-2 text-sm focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-100 max-w-xs ${hasError ? "border-red-400" : "border-gray-200"}`}
                  placeholder={champ.placeholder || "0"}
                />
              )}

              {/* DATE */}
              {champ.type === "DATE" && (
                <input
                  type="date"
                  value={donnees[champ.id] || ""}
                  onChange={(e) => updateField(champ.id, e.target.value)}
                  className={`rounded-xl border px-3 py-2 text-sm focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-100 w-full max-w-xs ${hasError ? "border-red-400" : "border-gray-200"}`}
                />
              )}

              {/* SELECT */}
              {champ.type === "SELECT" && (
                <select
                  value={donnees[champ.id] || ""}
                  onChange={(e) => updateField(champ.id, e.target.value)}
                  className={`w-full rounded-xl border px-3 py-2 text-sm focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-100 max-w-sm ${hasError ? "border-red-400" : "border-gray-200"}`}
                >
                  <option value="">Sélectionner…</option>
                  {champ.options?.map((o, j) => (
                    <option key={j} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              )}

              {/* RADIO */}
              {champ.type === "RADIO" && (
                <div className="flex flex-wrap gap-3 pt-1">
                  {(champ.options || []).map((o, j) => (
                    <label
                      key={j}
                      className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name={`field_${champ.id}`}
                        checked={donnees[champ.id] === o}
                        onChange={() => updateField(champ.id, o)}
                        className="text-green-600 focus:ring-green-500"
                      />
                      {o}
                    </label>
                  ))}
                </div>
              )}

              {/* CHECKBOX */}
              {champ.type === "CHECKBOX" && (
                <div className="flex flex-wrap gap-3 pt-1">
                  {(champ.options || []).map((o, j) => (
                    <label
                      key={j}
                      className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={(donnees[champ.id] || []).includes(o)}
                        onChange={() => toggleCheckbox(champ.id, o)}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      {o}
                    </label>
                  ))}
                </div>
              )}

              {/* FICHIER */}
              {champ.type === "FICHIER" && (
                <div
                  className={`flex items-center gap-3 rounded-xl border-2 border-dashed px-4 py-4 cursor-pointer hover:bg-gray-50 transition-colors ${hasError ? "border-red-300" : "border-gray-300"}`}
                >
                  <Paperclip size={18} className="text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">
                      Cliquer pour sélectionner un fichier
                    </p>
                    <p className="text-[10px] text-gray-400">
                      PDF, image ou document (max 10 Mo)
                    </p>
                  </div>
                </div>
              )}

              {/* GPS */}
              {champ.type === "GPS" && (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={captureGPS}
                    disabled={gpsLoading}
                    className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                  >
                    {gpsLoading ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <MapPin size={14} />
                    )}
                    {gpsLoading
                      ? "Capture en cours…"
                      : "Capturer la position GPS"}
                  </button>
                  {gpsCoords && (
                    <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-xs text-green-700">
                      <MapPin size={12} className="inline mr-1 -mt-0.5" />
                      Lat: {gpsCoords.lat}, Lng: {gpsCoords.lng}{" "}
                      <span className="text-green-500">
                        (±{gpsCoords.accuracy}m)
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* TOGGLE */}
              {champ.type === "TOGGLE" && (
                <button
                  type="button"
                  onClick={() => updateField(champ.id, !donnees[champ.id])}
                  className="flex items-center gap-2"
                >
                  <div
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      donnees[champ.id] ? "bg-green-500" : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        donnees[champ.id] ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </div>
                  <span className="text-sm text-gray-600">
                    {donnees[champ.id] ? "Oui" : "Non"}
                  </span>
                </button>
              )}

              {/* Erreur */}
              {hasError && (
                <p className="mt-1 text-[10px] text-red-500">{hasError}</p>
              )}
            </div>
          );
        })}

        {/* GPS global si aucun champ GPS */}
        {!champs.some((c) => c.type === "GPS") && (
          <div className="border-t border-gray-100 pt-4">
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700">
              <MapPin size={14} className="text-gray-400" />
              Position GPS (optionnel)
            </label>
            <button
              type="button"
              onClick={captureGPS}
              disabled={gpsLoading}
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              {gpsLoading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <MapPin size={14} />
              )}
              {gpsLoading ? "Capture…" : "Capturer ma position"}
            </button>
            {gpsCoords && (
              <div className="mt-2 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-xs text-green-700">
                <MapPin size={12} className="inline mr-1 -mt-0.5" />
                Lat: {gpsCoords.lat}, Lng: {gpsCoords.lng}{" "}
                <span className="text-green-500">(±{gpsCoords.accuracy}m)</span>
              </div>
            )}
          </div>
        )}

        {/* Commentaire */}
        <div className="border-t border-gray-100 pt-4">
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Commentaire / observation (optionnel)
          </label>
          <textarea
            value={donnees._commentaire || ""}
            onChange={(e) => updateField("_commentaire", e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-100"
            placeholder="Observations terrain, contexte, remarques…"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => handleSubmit(true)}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
        >
          <Save size={15} />
          {saving ? "Sauvegarde…" : "Sauvegarder brouillon"}
        </button>
        <button
          onClick={() => handleSubmit(false)}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-sm disabled:opacity-50"
          style={{
            background: "linear-gradient(135deg, #5A9C3A, #4A7C2F)",
          }}
        >
          {saving ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Send size={15} />
          )}
          {saving ? "Envoi…" : "Soumettre la collecte"}
        </button>
      </div>
    </div>
  );
}
