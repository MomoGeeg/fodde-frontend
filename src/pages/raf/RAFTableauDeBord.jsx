import { rafApi } from "@/api/raf.api";
import RoleGate from "@/components/shared/RoleGate";
import { useQueries } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Clock,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";

const fmt = (n) => new Intl.NumberFormat("fr-SN").format(n) + " F";
const fmtDate = (d) => new Date(d).toLocaleDateString("fr-FR");

function TauxBar({ taux }) {
  const pct = Math.min(taux, 100);
  const color =
    taux > 90 ? "bg-red-500" : taux > 70 ? "bg-orange-400" : "bg-emerald-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-semibold w-10 text-right ${
        taux > 90 ? "text-red-600" : taux > 70 ? "text-orange-500" : "text-emerald-600"
      }`}>
        {taux.toFixed(1)}%
      </span>
    </div>
  );
}

function AlerteBadge({ niveau }) {
  const styles = {
    CRITIQUE: "bg-red-100 text-red-700 border border-red-200",
    DANGER:   "bg-orange-100 text-orange-700 border border-orange-200",
    WARNING:  "bg-yellow-50 text-yellow-700 border border-yellow-200",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${styles[niveau] ?? ""}`}>
      <AlertTriangle size={9} />
      {niveau}
    </span>
  );
}

function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded bg-gray-200 ${className}`} />;
}

export default function RAFTableauDeBord() {
  const results = useQueries({
    queries: [
      { queryKey: ["raf-projets"],   queryFn: rafApi.getProjets,                staleTime: 5 * 60_000 },
      { queryKey: ["raf-alertes"],   queryFn: rafApi.getAlertes,                staleTime: 5 * 60_000 },
      { queryKey: ["raf-comptes"],   queryFn: rafApi.getComptes,                staleTime: 5 * 60_000 },
      { queryKey: ["raf-avances"],   queryFn: rafApi.getAvancesNonJustifiees,   staleTime: 5 * 60_000 },
      { queryKey: ["raf-depenses-count"], queryFn: rafApi.getDepensesCount,     staleTime: 5 * 60_000 },
      { queryKey: ["raf-evolution"], queryFn: rafApi.getEvolutionTresorerie,    staleTime: 5 * 60_000 },
    ],
  });

  const loading = results.some((r) => r.isLoading);

  const projets  = results[0].data ?? [];
  const alertes  = results[1].data ?? [];
  const comptes  = results[2].data ?? [];
  const avances  = results[3].data ?? [];
  const depCount = results[4].data ?? 0;
  const evolution = results[5].data ?? [];

  // ── KPI calculés ──────────────────────────────────────────
  const totalBudget  = projets.reduce((s, p) => s + p.budget, 0);
  const totalDepense = projets.reduce((s, p) => s + p.depense, 0);
  const tauxGlobal   = totalBudget > 0 ? (totalDepense / totalBudget) * 100 : 0;
  const totalAvances = avances.reduce((s, a) => s + a.montant, 0);
  const projets80    = projets.filter((p) => (p.depense / p.budget) * 100 > 80).length;
  const soldeTresorerie = comptes.reduce((s, c) => s + c.solde, 0);

  // ── KPI cards ─────────────────────────────────────────────
  const kpis = [
    {
      label: "Taux d'exécution global",
      value: loading ? null : `${tauxGlobal.toFixed(1)}%`,
      sub: `${fmt(totalDepense)} dépensés`,
      icon: TrendingUp,
      color: tauxGlobal > 90 ? "text-red-600 bg-red-50" : tauxGlobal > 70 ? "text-orange-500 bg-orange-50" : "text-emerald-600 bg-emerald-50",
    },
    {
      label: "Dépenses en attente",
      value: loading ? null : depCount,
      sub: "dossiers à traiter",
      icon: Clock,
      color: depCount > 5 ? "text-red-600 bg-red-50" : "text-orange-500 bg-orange-50",
    },
    {
      label: "Avances non justifiées",
      value: loading ? null : fmt(totalAvances),
      sub: `${avances.length} avance${avances.length > 1 ? "s" : ""} en cours`,
      icon: Wallet,
      color: "text-amber-600 bg-amber-50",
    },
    {
      label: "Projets dépassant 80%",
      value: loading ? null : projets80,
      sub: "projet(s) en alerte budgétaire",
      icon: TrendingDown,
      color: projets80 > 0 ? "text-red-600 bg-red-50" : "text-emerald-600 bg-emerald-50",
    },
    {
      label: "Position de trésorerie",
      value: loading ? null : fmt(soldeTresorerie),
      sub: `${comptes.length} comptes / caisses`,
      icon: Bell,
      color: "text-sky-600 bg-sky-50",
    },
  ];

  // ── Évolution chart (bar manuel) ──────────────────────────
  const maxSolde = Math.max(...evolution.map((e) => e.solde), 1);

  return (
    <RoleGate allowedRoles={["ROLE_RAF", "ROLE_SE"]}>
      <div className="space-y-6">
        {/* ── KPI Cards ───────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div key={kpi.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                {loading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <Skeleton className="h-6 w-20 mt-2" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                ) : (
                  <>
                    <div className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${kpi.color}`}>
                      <Icon size={18} />
                    </div>
                    <p className="mt-2 text-xl font-bold text-gray-900">{kpi.value}</p>
                    <p className="text-xs text-gray-500">{kpi.label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{kpi.sub}</p>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Ligne 2 : tableau projets + alertes ─────────── */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Taux par projet */}
          <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-3">
              <h4 className="text-sm font-semibold text-gray-800">Taux d'exécution par projet</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
                    <th className="px-5 py-2.5">Code</th>
                    <th className="px-5 py-2.5">Projet</th>
                    <th className="px-5 py-2.5 text-right">Budget</th>
                    <th className="px-5 py-2.5 text-right">Dépensé</th>
                    <th className="px-5 py-2.5 min-w-[180px]">Consommation</th>
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? Array.from({ length: 4 }).map((_, i) => (
                        <tr key={i} className="border-b border-gray-50">
                          {Array.from({ length: 5 }).map((_, j) => (
                            <td key={j} className="px-5 py-3">
                              <Skeleton className="h-4 w-full" />
                            </td>
                          ))}
                        </tr>
                      ))
                    : projets.map((p) => {
                        const taux = (p.depense / p.budget) * 100;
                        const rowBg =
                          taux > 90 ? "bg-red-50/50" : taux > 70 ? "bg-orange-50/50" : "";
                        return (
                          <tr key={p.id} className={`border-b border-gray-50 hover:bg-gray-50 ${rowBg}`}>
                            <td className="px-5 py-3">
                              <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-mono font-medium text-gray-700">
                                {p.code}
                              </span>
                            </td>
                            <td className="px-5 py-3 font-medium text-gray-800 text-xs">{p.titre}</td>
                            <td className="px-5 py-3 text-right text-xs text-gray-600 tabular-nums">{fmt(p.budget)}</td>
                            <td className="px-5 py-3 text-right text-xs font-medium text-gray-800 tabular-nums">{fmt(p.depense)}</td>
                            <td className="px-5 py-3"><TauxBar taux={taux} /></td>
                          </tr>
                        );
                      })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Alertes actives */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm flex flex-col">
            <div className="border-b border-gray-100 px-5 py-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-800">Alertes actives</h4>
              {!loading && alertes.length > 0 && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                  {alertes.length}
                </span>
              )}
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-gray-50 max-h-80">
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="p-4 space-y-1.5">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-3/4" />
                    </div>
                  ))
                : alertes.length === 0
                ? (
                    <div className="flex items-center justify-center h-24 text-sm text-gray-400">
                      Aucune alerte active
                    </div>
                  )
                : alertes.map((a) => (
                    <div key={a.id} className="px-4 py-3">
                      <div className="flex items-start gap-2">
                        <AlertBadge niveau={a.niveau} />
                      </div>
                      <p className="mt-1 text-xs font-medium text-gray-800 leading-snug">{a.message}</p>
                      <p className="mt-0.5 text-[10px] text-gray-500 leading-snug">{a.details}</p>
                    </div>
                  ))}
            </div>
          </div>
        </div>

        {/* ── Ligne 3 : Trésorerie ────────────────────────── */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Comptes */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-800">Position de trésorerie</h4>
              {!loading && (
                <span className="text-xs font-semibold text-emerald-700">
                  Total : {fmt(comptes.reduce((s, c) => s + c.solde, 0))}
                </span>
              )}
            </div>
            <div className="divide-y divide-gray-50">
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between px-5 py-3">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  ))
                : comptes.map((c) => (
                    <div key={c.id} className="flex items-center justify-between px-5 py-3">
                      <div>
                        <p className="text-xs font-medium text-gray-800">{c.nom}</p>
                        <p className="text-[10px] text-gray-400">
                          {c.type === "BANQUE" ? `${c.banque} • ${c.numero}` : "Espèces"} — MàJ {fmtDate(c.derniereMaj)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900 tabular-nums">{fmt(c.solde)}</p>
                        <span className={`text-[10px] font-semibold ${c.type === "BANQUE" ? "text-sky-600" : "text-amber-600"}`}>
                          {c.type}
                        </span>
                      </div>
                    </div>
                  ))}
            </div>
          </div>

          {/* Évolution trésorerie */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-3">
              <h4 className="text-sm font-semibold text-gray-800">Évolution trésorerie — 6 mois glissants</h4>
            </div>
            <div className="px-5 py-4">
              {loading ? (
                <div className="flex items-end gap-2 h-32">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="flex-1" style={{ height: `${40 + i * 10}%` }} />
                  ))}
                </div>
              ) : (
                <div className="flex items-end gap-2 h-36">
                  {evolution.map((e, i) => {
                    const heightPct = (e.solde / maxSolde) * 100;
                    return (
                      <div key={i} className="flex flex-1 flex-col items-center gap-1">
                        <span className="text-[9px] text-gray-500 tabular-nums" title={fmt(e.solde)}>
                          {(e.solde / 1_000_000).toFixed(1)}M
                        </span>
                        <div
                          className="w-full rounded-t bg-emerald-400 hover:bg-emerald-500 transition-colors cursor-default"
                          style={{ height: `${Math.max(heightPct, 5)}%` }}
                          title={`${e.mois} : ${fmt(e.solde)}`}
                        />
                        <span className="text-[9px] text-gray-400 text-center leading-tight">{e.mois}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </RoleGate>
  );
}

// Composant alerteBadge local
function AlertBadge({ niveau }) {
  const styles = {
    CRITIQUE: "bg-red-100 text-red-700",
    DANGER:   "bg-orange-100 text-orange-700",
    WARNING:  "bg-yellow-50 text-yellow-700",
  };
  const icons = { CRITIQUE: "●", DANGER: "▲", WARNING: "!" };
  return (
    <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold ${styles[niveau] ?? ""}`}>
      <span>{icons[niveau]}</span>
      {niveau}
    </span>
  );
}
