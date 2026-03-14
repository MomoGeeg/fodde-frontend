import {
  CheckCircle2,
  Clock,
  Database,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Search,
  Trash2,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";

// ── Constantes statuts ────────────────────────────────────────────────────────
const STATUTS = [
  { value: "VALIDEE",    label: "Validée",     cls: "bg-green-100 text-green-700" },
  { value: "EN_ATTENTE", label: "En attente",  cls: "bg-yellow-100 text-yellow-700" },
  { value: "PRE_VALIDEE",label: "Pré-validée", cls: "bg-blue-100 text-blue-700" },
  { value: "REJETEE",    label: "Rejetée",     cls: "bg-red-100 text-red-700" },
];

const fmtDate = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt)) return String(d);
  return dt.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
};

const STORAGE_KEY = "se-donnees-importees";

function loadFromStorage() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]"); }
  catch { return []; }
}
function saveToStorage(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ── Détection automatique colonnes ────────────────────────────────────────────
function detectColumns(headers) {
  const find = (candidates) =>
    headers.find((h) => candidates.some((c) => h.toLowerCase().includes(c.toLowerCase()))) ?? null;
  return {
    indicateur: find(["indicateur", "ind", "code", "libellé", "libelle", "nom"]),
    date:       find(["date", "periode", "période", "mois"]),
    valeur:     find(["valeur", "value", "résultat", "resultat", "mesure", "donnée", "donnee"]),
    unite:      find(["unité", "unite", "unit"]),
    statut:     find(["statut", "status", "état", "etat"]),
    notes:      find(["note", "commentaire", "observation", "remarque"]),
    projet:     find(["projet", "project"]),
    collecteur: find(["collecteur", "agent", "responsable"]),
  };
}

function normalizeRow(row, mapping, rowIndex, fileName) {
  const get = (col) => (col && row[col] !== undefined ? String(row[col]).trim() : "");
  return {
    _id:          `${fileName}-${rowIndex}-${Date.now()}`,
    _source:      fileName,
    indicateur:   get(mapping.indicateur) || `Ligne ${rowIndex + 1}`,
    dateCollecte: get(mapping.date),
    valeur:       get(mapping.valeur),
    unite:        get(mapping.unite),
    statut:       get(mapping.statut) || "IMPORTEE",
    notes:        get(mapping.notes),
    projet:       get(mapping.projet),
    collecteur:   get(mapping.collecteur),
  };
}

// ── Composants UI ─────────────────────────────────────────────────────────────
function StatutBadge({ statut }) {
  const s = STATUTS.find((x) => x.value === statut);
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${s ? s.cls : "bg-gray-100 text-gray-500"}`}>
      {s ? s.label : statut || "—"}
    </span>
  );
}

function StatCard({ label, value, icon: Icon, colorClass }) {
  return (
    <div className={`flex items-center gap-3 rounded-xl border p-4 ${colorClass}`}>
      <div className="rounded-lg bg-white/60 p-2"><Icon size={18} /></div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-[10px] font-medium">{label}</p>
      </div>
    </div>
  );
}

// ── Modal aperçu avant import ─────────────────────────────────────────────────
function ImportPreviewModal({ preview, fileName, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900">Aperçu des données</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              <span className="font-medium text-gray-600">{fileName}</span> —{" "}
              {preview.length} ligne{preview.length > 1 ? "s" : ""} détectée{preview.length > 1 ? "s" : ""}
            </p>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-auto p-5">
          <div className="rounded-xl border border-gray-200 overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {["Indicateur","Projet","Date","Valeur","Unité","Collecteur","Statut","Notes"].map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {preview.slice(0, 20).map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium text-gray-800 max-w-[160px] truncate">{row.indicateur}</td>
                    <td className="px-3 py-2 text-gray-500">{row.projet || "—"}</td>
                    <td className="px-3 py-2 text-gray-500">{fmtDate(row.dateCollecte)}</td>
                    <td className="px-3 py-2 font-bold text-gray-900">{row.valeur}</td>
                    <td className="px-3 py-2 text-gray-400">{row.unite || "—"}</td>
                    <td className="px-3 py-2 text-gray-500">{row.collecteur || "—"}</td>
                    <td className="px-3 py-2"><StatutBadge statut={row.statut} /></td>
                    <td className="px-3 py-2 text-gray-400 max-w-[120px] truncate">{row.notes || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {preview.length > 20 && (
            <p className="mt-2 text-center text-xs text-gray-400">
              Aperçu limité à 20 lignes sur {preview.length}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 px-5 py-4 shrink-0">
          <button onClick={onCancel} className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
            Annuler
          </button>
          <button
            onClick={() => onConfirm(preview)}
            className="flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-medium text-white shadow-sm"
            style={{ background: "linear-gradient(135deg, #5A9C3A, #4A7C2F)" }}
          >
            <CheckCircle2 size={15} />
            Importer {preview.length} ligne{preview.length > 1 ? "s" : ""}
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// PAGE — Données terrain
// ════════════════════════════════════════════════════════════
export default function SEDonnees() {
  const fileInputRef = useRef(null);

  const [donnees, setDonnees]       = useState(() => loadFromStorage());
  const [preview, setPreview]       = useState(null);
  const [importError, setImportError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const [search, setSearch]             = useState("");
  const [filterStatut, setFilterStatut] = useState("all");
  const [filterSource, setFilterSource] = useState("all");
  const [showFilters, setShowFilters]   = useState(false);

  const sources = useMemo(() => [...new Set(donnees.map((d) => d._source))], [donnees]);

  const total     = donnees.length;
  const validees  = donnees.filter((d) => d.statut === "VALIDEE").length;
  const enAttente = donnees.filter((d) => ["EN_ATTENTE","PRE_VALIDEE","IMPORTEE"].includes(d.statut)).length;
  const rejetees  = donnees.filter((d) => d.statut === "REJETEE").length;

  const donneesFiltrees = useMemo(() => {
    let list = [...donnees];
    if (filterSource !== "all") list = list.filter((d) => d._source === filterSource);
    if (filterStatut !== "all") list = list.filter((d) => d.statut === filterStatut);
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter((d) =>
        d.indicateur?.toLowerCase().includes(s) ||
        d.projet?.toLowerCase().includes(s) ||
        d.collecteur?.toLowerCase().includes(s) ||
        d._source?.toLowerCase().includes(s),
      );
    }
    return list;
  }, [donnees, filterSource, filterStatut, search]);

  const activeFilters = [filterStatut, filterSource].filter((f) => f !== "all").length;

  // ── Parsing ────────────────────────────────────────────────
  const parseFile = useCallback((file) => {
    setImportError("");
    const name = file.name;
    const ext  = name.split(".").pop().toLowerCase();
    if (!["xlsx","xls","csv","ods"].includes(ext)) {
      setImportError("Format non supporté. Utilisez Excel (.xlsx, .xls), CSV ou ODS.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb   = XLSX.read(new Uint8Array(e.target.result), { type: "array", cellDates: true });
        const ws   = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
        if (rows.length === 0) { setImportError("Le fichier ne contient aucune donnée."); return; }
        const mapping = detectColumns(Object.keys(rows[0]));
        setPreview({ rows: rows.map((r, i) => normalizeRow(r, mapping, i, name)), fileName: name });
      } catch {
        setImportError("Impossible de lire le fichier. Vérifiez qu'il n'est pas corrompu.");
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files?.[0]) parseFile(e.target.files[0]);
    e.target.value = "";
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) parseFile(file);
  }, [parseFile]);

  const handleConfirmImport = (rows) => {
    const newData = [...donnees, ...rows];
    setDonnees(newData); saveToStorage(newData); setPreview(null);
  };

  const handleDeleteSource = (source) => {
    const newData = donnees.filter((d) => d._source !== source);
    setDonnees(newData); saveToStorage(newData);
    if (filterSource === source) setFilterSource("all");
  };

  const handleClearAll = () => {
    setDonnees([]); saveToStorage([]); setFilterSource("all"); setFilterStatut("all");
  };

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(
      donneesFiltrees.map(({ _id, _source, ...r }) => ({
        Indicateur: r.indicateur, Projet: r.projet,
        "Date collecte": r.dateCollecte, Valeur: r.valeur, Unité: r.unite,
        Statut: r.statut, Collecteur: r.collecteur, Notes: r.notes, Source: _source,
      })),
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Données terrain");
    XLSX.writeFile(wb, "donnees-terrain.xlsx");
  };

  return (
    <>
      {preview && (
        <ImportPreviewModal
          preview={preview.rows}
          fileName={preview.fileName}
          onConfirm={handleConfirmImport}
          onCancel={() => setPreview(null)}
        />
      )}

      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Données terrain</h1>
            <p className="mt-1 text-sm text-gray-500">
              Import et consultation des données collectées (Excel, CSV)
            </p>
          </div>
          <div className="flex items-center gap-2">
            {donnees.length > 0 && (
              <button onClick={handleExport} className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 shadow-sm hover:bg-gray-50">
                <Download size={13} /> Exporter
              </button>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-sm"
              style={{ background: "linear-gradient(135deg, #5A9C3A, #4A7C2F)" }}
            >
              <Upload size={15} /> Importer un fichier
            </button>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv,.ods" className="hidden" onChange={handleFileChange} />
          </div>
        </div>

        {/* Erreur */}
        {importError && (
          <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <XCircle size={16} className="text-red-500 shrink-0" />
            <p className="text-sm text-red-700">{importError}</p>
            <button onClick={() => setImportError("")} className="ml-auto text-red-400 hover:text-red-600"><X size={14} /></button>
          </div>
        )}

        {/* Zone de drop initiale */}
        {donnees.length === 0 && (
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer rounded-2xl border-2 border-dashed p-14 text-center transition-colors ${
              isDragging ? "border-green-400 bg-green-50" : "border-gray-300 bg-gray-50 hover:border-green-300 hover:bg-green-50/50"
            }`}
          >
            <FileSpreadsheet className="mx-auto mb-4 text-gray-300" size={52} />
            <p className="text-sm font-semibold text-gray-600">Glisser-déposer ou cliquer pour importer</p>
            <p className="mt-1 text-xs text-gray-400">Formats : Excel (.xlsx, .xls), CSV, ODS</p>
            <p className="mt-3 text-[11px] text-gray-400 max-w-sm mx-auto">
              Le fichier doit contenir des colonnes pour l'indicateur, la date et la valeur. Les colonnes projet, statut, collecteur et notes sont optionnelles.
            </p>
          </div>
        )}

        {donnees.length > 0 && (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard label="Total lignes" value={total}     icon={Database}     colorClass="border-gray-200 bg-gray-50 text-gray-700" />
              <StatCard label="Validées"      value={validees}  icon={CheckCircle2} colorClass="border-green-200 bg-green-50 text-green-700" />
              <StatCard label="En attente"    value={enAttente} icon={Clock}        colorClass="border-orange-200 bg-orange-50 text-orange-700" />
              <StatCard label="Rejetées"      value={rejetees}  icon={XCircle}      colorClass="border-red-200 bg-red-50 text-red-700" />
            </div>

            {/* Sources */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-gray-400">Fichiers importés :</span>
              {sources.map((src) => (
                <span key={src} className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 pl-2.5 pr-1.5 py-0.5 text-[11px] font-medium text-blue-700">
                  <FileText size={11} />
                  {src}
                  <button onClick={() => handleDeleteSource(src)} title="Supprimer ce fichier" className="ml-0.5 rounded-full p-0.5 hover:bg-blue-200 text-blue-500">
                    <X size={10} />
                  </button>
                </span>
              ))}
              <button onClick={handleClearAll} className="ml-auto flex items-center gap-1 text-xs text-red-500 hover:text-red-700">
                <Trash2 size={12} /> Tout supprimer
              </button>
            </div>

            {/* Recherche + filtres */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                <input
                  type="text"
                  placeholder="Rechercher un indicateur, projet…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm shadow-sm focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-100"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium shadow-sm transition-colors ${
                  showFilters || activeFilters ? "border-green-300 bg-green-50 text-green-700" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Filter size={13} /> Filtres
                {activeFilters > 0 && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-green-600 text-[9px] text-white">{activeFilters}</span>
                )}
              </button>
              <span className="text-xs text-gray-400">
                {donneesFiltrees.length} ligne{donneesFiltrees.length !== 1 ? "s" : ""}
              </span>
            </div>

            {showFilters && (
              <div className="flex flex-wrap gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-gray-400">Statut</label>
                  <select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs focus:border-green-400 focus:ring-2 focus:ring-green-100">
                    <option value="all">Tous les statuts</option>
                    {STATUTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    <option value="IMPORTEE">Importée (sans statut)</option>
                  </select>
                </div>
                {sources.length > 1 && (
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-gray-400">Source</label>
                    <select value={filterSource} onChange={(e) => setFilterSource(e.target.value)}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs focus:border-green-400 focus:ring-2 focus:ring-green-100">
                      <option value="all">Tous les fichiers</option>
                      {sources.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                )}
                {activeFilters > 0 && (
                  <div className="flex items-end">
                    <button onClick={() => { setFilterStatut("all"); setFilterSource("all"); }} className="text-xs text-red-500 hover:text-red-700">Réinitialiser</button>
                  </div>
                )}
              </div>
            )}

            {/* Tableau */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left">
                    {["Indicateur","Projet","Date collecte","Valeur","Collecteur","Statut","Source"].map((h) => (
                      <th key={h} className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {donneesFiltrees.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-sm text-gray-400">
                        Aucune donnée correspondant aux filtres.
                      </td>
                    </tr>
                  ) : (
                    donneesFiltrees.map((row) => (
                      <tr key={row._id} className="border-t border-gray-100 hover:bg-blue-50/30 transition-colors">
                        <td className="px-4 py-2.5">
                          <p className="text-xs font-medium text-gray-800 max-w-[220px] truncate">{row.indicateur}</p>
                          {row.notes && <p className="text-[10px] text-gray-400 mt-0.5 max-w-[220px] truncate">{row.notes}</p>}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-gray-500">{row.projet || "—"}</td>
                        <td className="px-4 py-2.5 text-xs text-gray-500">{fmtDate(row.dateCollecte)}</td>
                        <td className="px-4 py-2.5 text-center">
                          <span className="text-sm font-bold text-gray-900">{row.valeur}</span>
                          {row.unite && <span className="ml-1 text-[10px] text-gray-400">{row.unite}</span>}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-gray-500">{row.collecteur || "—"}</td>
                        <td className="px-4 py-2.5"><StatutBadge statut={row.statut} /></td>
                        <td className="px-4 py-2.5">
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] text-blue-600 max-w-[130px] truncate">
                            <FileSpreadsheet size={10} />
                            {row._source}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Zone drop secondaire */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`cursor-pointer rounded-xl border-2 border-dashed px-6 py-4 text-center transition-colors ${
                isDragging ? "border-green-400 bg-green-50" : "border-gray-200 hover:border-green-300 hover:bg-green-50/30"
              }`}
            >
              <p className="text-xs text-gray-400">
                <Upload size={12} className="inline mr-1 -mt-0.5" />
                Ajouter un autre fichier Excel ou CSV
              </p>
            </div>
          </>
        )}
      </div>
    </>
  );
}
