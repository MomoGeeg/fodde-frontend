import { rafApi } from "@/api/raf.api";
import RoleGate from "@/components/shared/RoleGate";
import { useQueries } from "@tanstack/react-query";
import { AlertTriangle, Banknote, Building2, Clock } from "lucide-react";

const fmt    = (n) => new Intl.NumberFormat("fr-SN").format(n) + " F";
const fmtDate = (d) => new Date(d).toLocaleDateString("fr-FR");

function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded bg-gray-200 ${className}`} />;
}

function SectionCard({ title, children }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-gray-100 px-5 py-3">
        <h4 className="text-sm font-semibold text-gray-800">{title}</h4>
      </div>
      {children}
    </div>
  );
}

export default function RAFTresorerie() {
  const results = useQueries({
    queries: [
      { queryKey: ["raf-comptes"],     queryFn: rafApi.getComptes,               staleTime: 5 * 60_000 },
      { queryKey: ["raf-evolution"],   queryFn: rafApi.getEvolutionTresorerie,   staleTime: 5 * 60_000 },
      { queryKey: ["raf-decaissements"], queryFn: rafApi.getDecaissements,       staleTime: 5 * 60_000 },
      { queryKey: ["raf-avances"],     queryFn: rafApi.getAvancesNonJustifiees,  staleTime: 5 * 60_000 },
    ],
  });

  const loading = results.some((r) => r.isLoading);
  const comptes     = results[0].data ?? [];
  const evolution   = results[1].data ?? [];
  const decaissements = results[2].data ?? [];
  const avances     = results[3].data ?? [];

  const totalTresorerie = comptes.reduce((s, c) => s + c.solde, 0);
  const maxSolde = Math.max(...evolution.map((e) => e.solde), 1);

  const STATUT_DECAISSEMENT = {
    ATTENDU:   { label: "Attendu",   cls: "bg-blue-100 text-blue-700"    },
    RECU:      { label: "Reçu",      cls: "bg-green-100 text-green-700"  },
    EN_RETARD: { label: "En retard", cls: "bg-red-100 text-red-700"      },
  };

  return (
    <RoleGate allowedRoles={["ROLE_RAF", "ROLE_SE"]}>
      <div className="space-y-5">
        {/* Solde total */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-6 py-4 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white">
            <Banknote size={22} />
          </div>
          <div>
            <p className="text-xs text-emerald-700 font-medium">Solde total toutes caisses & comptes</p>
            {loading ? (
              <Skeleton className="h-8 w-40 mt-1" />
            ) : (
              <p className="text-2xl font-bold text-emerald-800 tabular-nums">{fmt(totalTresorerie)}</p>
            )}
            <p className="text-[11px] text-emerald-600 mt-0.5">{comptes.length} compte{comptes.length !== 1 ? "s" : ""} / caisses actifs</p>
          </div>
        </div>

        {/* Comptes et caisses + Évolution */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Comptes */}
          <SectionCard title="Comptes bancaires et caisses">
            <div className="divide-y divide-gray-50">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between px-5 py-3.5">
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-44" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                      <Skeleton className="h-5 w-24" />
                    </div>
                  ))
                : comptes.map((c) => (
                    <div key={c.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                          c.type === "BANQUE" ? "bg-sky-100 text-sky-600" : "bg-amber-100 text-amber-600"
                        }`}>
                          {c.type === "BANQUE" ? <Building2 size={14} /> : <Banknote size={14} />}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-800">{c.nom}</p>
                          <p className="text-[10px] text-gray-400">
                            {c.type === "BANQUE" ? `${c.banque} • ${c.numero}` : "Espèces"} — MàJ {fmtDate(c.derniereMaj)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900 tabular-nums">{fmt(c.solde)}</p>
                        <span className={`text-[10px] font-semibold ${
                          c.type === "BANQUE" ? "text-sky-600" : "text-amber-600"
                        }`}>{c.type}</span>
                      </div>
                    </div>
                  ))}
            </div>
          </SectionCard>

          {/* Évolution */}
          <SectionCard title="Évolution de la trésorerie — 6 mois glissants">
            <div className="px-5 py-5">
              {loading ? (
                <div className="flex items-end gap-2 h-40">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="flex-1" style={{ height: `${30 + i * 10}%` }} />
                  ))}
                </div>
              ) : (
                <div className="flex items-end gap-2 h-44">
                  {evolution.map((e, i) => {
                    const h = (e.solde / maxSolde) * 100;
                    const isLast = i === evolution.length - 1;
                    return (
                      <div key={i} className="flex flex-1 flex-col items-center gap-1">
                        <span className="text-[9px] text-gray-500 tabular-nums">
                          {(e.solde / 1_000_000).toFixed(1)}M
                        </span>
                        <div
                          className={`w-full rounded-t transition-colors cursor-default ${
                            isLast ? "bg-emerald-500 hover:bg-emerald-600" : "bg-emerald-300 hover:bg-emerald-400"
                          }`}
                          style={{ height: `${Math.max(h, 4)}%` }}
                          title={`${e.mois} : ${fmt(e.solde)}`}
                        />
                        <span className="text-[9px] text-gray-400 text-center leading-tight">{e.mois}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </SectionCard>
        </div>

        {/* Décaissements bailleurs */}
        <SectionCard title="Prochains décaissements bailleurs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-[11px] text-gray-500 uppercase tracking-wide">
                  <th className="px-5 py-2.5">Projet</th>
                  <th className="px-5 py-2.5">Bailleur</th>
                  <th className="px-5 py-2.5 text-right">Montant attendu</th>
                  <th className="px-5 py-2.5">Date prévue</th>
                  <th className="px-5 py-2.5">Statut</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i} className="border-b border-gray-50">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <td key={j} className="px-5 py-3">
                            <Skeleton className="h-4 w-full" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : decaissements.map((d) => {
                      const st = STATUT_DECAISSEMENT[d.statut] ?? {};
                      return (
                        <tr key={d.id} className={`border-b border-gray-50 hover:bg-gray-50 ${d.statut === "EN_RETARD" ? "bg-red-50/40" : ""}`}>
                          <td className="px-5 py-3">
                            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-mono font-medium text-gray-700">
                              {d.projetCode}
                            </span>
                          </td>
                          <td className="px-5 py-3 font-medium text-gray-800">{d.bailleur}</td>
                          <td className="px-5 py-3 text-right font-bold text-gray-900 tabular-nums">{fmt(d.montant)}</td>
                          <td className="px-5 py-3 text-gray-600">{fmtDate(d.datePrevue)}</td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold ${st.cls ?? ""}`}>
                              {d.statut === "EN_RETARD" && <AlertTriangle size={10} />}
                              {st.label ?? d.statut}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
              </tbody>
            </table>
          </div>
        </SectionCard>

        {/* Avances non justifiées */}
        <SectionCard title="Avances non justifiées">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-[11px] text-gray-500 uppercase tracking-wide">
                  <th className="px-5 py-2.5">Bénéficiaire</th>
                  <th className="px-5 py-2.5">Projet</th>
                  <th className="px-5 py-2.5 text-right">Montant</th>
                  <th className="px-5 py-2.5">Date avance</th>
                  <th className="px-5 py-2.5">Jours écoulés</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i} className="border-b border-gray-50">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <td key={j} className="px-5 py-3">
                            <Skeleton className="h-4 w-full" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : avances.map((a) => {
                      const enRetard = a.joursEcoules > 30;
                      return (
                        <tr key={a.id} className={`border-b border-gray-50 hover:bg-gray-50 ${enRetard ? "bg-red-50/40" : ""}`}>
                          <td className="px-5 py-3">
                            <p className="font-medium text-gray-800">{a.beneficiaire}</p>
                            <p className="text-[10px] text-gray-400">{a.poste}</p>
                          </td>
                          <td className="px-5 py-3">
                            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-mono text-gray-700">
                              {a.projetCode}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right font-bold text-gray-900 tabular-nums">{fmt(a.montant)}</td>
                          <td className="px-5 py-3 text-gray-600">{fmtDate(a.dateAvance)}</td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold ${
                              enRetard ? "bg-red-100 text-red-700" : "bg-amber-50 text-amber-700"
                            }`}>
                              {enRetard && <AlertTriangle size={10} />}
                              <Clock size={9} /> {a.joursEcoules} j
                            </span>
                          </td>
                        </tr>
                      );
                    })}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>
    </RoleGate>
  );
}
