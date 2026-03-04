import { rafApi } from "@/api/raf.api";
import RoleGate from "@/components/shared/RoleGate";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  Download,
  FileBarChart2,
  FileSpreadsheet,
  FileText,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const fmtDate = (d) => new Date(d).toLocaleDateString("fr-FR");

const TYPES_RAPPORT = [
  {
    value: "EXECUTION_BUDGETAIRE",
    label: "Rapport d'exécution budgétaire",
    desc: "Budget vs réalisé par projet",
    icon: FileBarChart2,
  },
  {
    value: "RAPPORT_BAILLEUR",
    label: "Rapport bailleur",
    desc: "Format paramétrable par bailleur",
    icon: FileText,
  },
  {
    value: "GRAND_LIVRE",
    label: "Grand livre des dépenses",
    desc: "Toutes les dépenses sur la période",
    icon: FileSpreadsheet,
  },
  {
    value: "CAISSE_ANTENNES",
    label: "Rapport de caisse antennes",
    desc: "Dépenses des antennes locales",
    icon: Archive,
  },
];

const TYPE_LABEL_MAP = Object.fromEntries(
  TYPES_RAPPORT.map((t) => [t.value, t.label]),
);

const BAILLEURS = ["Union Européenne", "AFD", "USAID", "UNICEF"];

function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded bg-gray-200 ${className}`} />;
}

export default function RAFRapports() {
  const qc = useQueryClient();

  const [form, setForm] = useState({
    type: "",
    dateDebut: "",
    dateFin: "",
    projetCode: "",
    bailleur: "",
    format: "PDF",
  });
  const [preview, setPreview] = useState(null);

  const { data: rapports = [], isLoading } = useQuery({
    queryKey: ["raf-rapports"],
    queryFn: rafApi.getRapports,
    staleTime: 5 * 60_000,
  });

  const { data: projetsRAF = [] } = useQuery({
    queryKey: ["raf-projets"],
    queryFn: rafApi.getProjets,
  });

  const mutGenerer = useMutation({
    mutationFn: () =>
      rafApi.genererRapport({
        type: form.type,
        typeLabel: TYPE_LABEL_MAP[form.type] ?? form.type,
        periode: `${form.dateDebut} → ${form.dateFin}`,
        projetCode: form.projetCode || "Tous projets",
        bailleur: form.bailleur || undefined,
        format: form.format,
      }),
    onSuccess: (rapport) => {
      toast.success("Rapport généré et archivé en GED");
      qc.invalidateQueries({ queryKey: ["raf-rapports"] });
      setPreview(rapport);
    },
    onError: () => toast.error("Erreur lors de la génération"),
  });

  const isFormValid =
    form.type &&
    form.dateDebut &&
    form.dateFin &&
    (form.type !== "RAPPORT_BAILLEUR" || form.bailleur);

  const typeSelectionne = TYPES_RAPPORT.find((t) => t.value === form.type);

  return (
    <RoleGate allowedRoles={["ROLE_RAF", "ROLE_SE"]}>
      <div className="space-y-5">
        {/* ── Formulaire de génération ─────────────────────── */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-3">
            <h4 className="text-sm font-semibold text-gray-800">
              Générer un rapport
            </h4>
          </div>
          <div className="p-5">
            {/* Sélection du type */}
            <div className="mb-5">
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Type de rapport <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {TYPES_RAPPORT.map((t) => {
                  const Icon = t.icon;
                  const selected = form.type === t.value;
                  return (
                    <button
                      key={t.value}
                      onClick={() => {
                        setForm((f) => ({ ...f, type: t.value }));
                        setPreview(null);
                      }}
                      className={`flex flex-col items-start gap-1 rounded-lg border px-3 py-3 text-left transition-colors ${
                        selected
                          ? "border-emerald-400 bg-emerald-50 text-emerald-800"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      <Icon
                        size={16}
                        className={
                          selected ? "text-emerald-600" : "text-gray-400"
                        }
                      />
                      <span className="text-[11px] font-semibold leading-tight">
                        {t.label}
                      </span>
                      <span className="text-[10px] text-gray-400 leading-tight">
                        {t.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Paramètres */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              <div>
                <label className="block text-[11px] font-medium text-gray-700 mb-1">
                  Date début <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={form.dateDebut}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, dateDebut: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-emerald-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-700 mb-1">
                  Date fin <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={form.dateFin}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, dateFin: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-emerald-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-700 mb-1">
                  Projet
                </label>
                <select
                  value={form.projetCode}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, projetCode: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-emerald-400 focus:outline-none"
                >
                  <option value="">Tous les projets</option>
                  {projetsRAF.map((p) => (
                    <option key={p.id} value={p.code}>
                      {p.code} — {p.titre}
                    </option>
                  ))}
                </select>
              </div>

              {form.type === "RAPPORT_BAILLEUR" && (
                <div>
                  <label className="block text-[11px] font-medium text-gray-700 mb-1">
                    Bailleur <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.bailleur}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, bailleur: e.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-emerald-400 focus:outline-none"
                  >
                    <option value="">Choisir un bailleur…</option>
                    {BAILLEURS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-medium text-gray-700 mb-1">
                  Format
                </label>
                <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                  {["PDF", "Excel"].map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => setForm((f) => ({ ...f, format: fmt }))}
                      className={`flex-1 py-2 text-xs font-medium transition-colors ${
                        form.format === fmt
                          ? "bg-emerald-600 text-white"
                          : "bg-white text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => mutGenerer.mutate()}
                disabled={!isFormValid || mutGenerer.isPending}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {mutGenerer.isPending ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Génération en
                    cours…
                  </>
                ) : (
                  <>
                    <FileBarChart2 size={15} /> Générer le rapport
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── Prévisualisation ─────────────────────────────── */}
        {preview && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 uppercase">
                    Généré
                  </span>
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600 uppercase flex items-center gap-1">
                    <Archive size={9} /> Archivé GED
                  </span>
                </div>
                <h5 className="text-sm font-semibold text-emerald-800">
                  {preview.typeLabel}
                </h5>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Période : {preview.periode} | Projet : {preview.projetCode} |
                  Format : {preview.format}
                </p>
                <p className="text-[11px] text-emerald-600 mt-0.5">
                  Taille estimée : {preview.taille} — Généré le{" "}
                  {fmtDate(preview.dateGeneration)}
                </p>
              </div>
              <div className="flex gap-2">
                <button className="flex items-center gap-1.5 rounded-lg bg-white border border-emerald-300 px-3 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-100">
                  <Download size={13} /> Télécharger {preview.format}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Historique ───────────────────────────────────── */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-gray-100 px-5 py-3 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-800">
              Historique des rapports
            </h4>
            <span className="text-xs text-gray-400">
              {rapports.length} rapport{rapports.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-[11px] text-gray-500 uppercase tracking-wide">
                  <th className="px-5 py-2.5">Type</th>
                  <th className="px-5 py-2.5">Période</th>
                  <th className="px-5 py-2.5">Projet</th>
                  <th className="px-5 py-2.5">Généré le</th>
                  <th className="px-5 py-2.5">Généré par</th>
                  <th className="px-5 py-2.5">Format</th>
                  <th className="px-5 py-2.5">GED</th>
                  <th className="px-5 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i} className="border-b border-gray-50">
                        {Array.from({ length: 8 }).map((_, j) => (
                          <td key={j} className="px-5 py-3">
                            <Skeleton className="h-4 w-full" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : rapports.map((r) => (
                      <tr
                        key={r.id}
                        className="border-b border-gray-50 hover:bg-gray-50"
                      >
                        <td className="px-5 py-3 font-medium text-gray-800">
                          {r.typeLabel}
                        </td>
                        <td className="px-5 py-3 text-gray-600">{r.periode}</td>
                        <td className="px-5 py-3">
                          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-mono text-gray-700">
                            {r.projetCode}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-gray-600">
                          {fmtDate(r.dateGeneration)}
                        </td>
                        <td className="px-5 py-3 text-gray-600">
                          {r.generePar}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold ${
                              r.format === "PDF"
                                ? "bg-red-50 text-red-700"
                                : "bg-green-50 text-green-700"
                            }`}
                          >
                            {r.format === "PDF" ? (
                              <FileText size={9} />
                            ) : (
                              <FileSpreadsheet size={9} />
                            )}
                            {r.format}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          {r.archive && (
                            <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                              <Archive size={9} /> GED
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <button
                            className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-[11px] font-medium text-gray-600 hover:bg-gray-100"
                            title="Télécharger"
                          >
                            <Download size={11} />
                          </button>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </RoleGate>
  );
}
