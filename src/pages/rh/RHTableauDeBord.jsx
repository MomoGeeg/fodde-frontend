import RoleGate from "@/components/shared/RoleGate";
import useAuthStore from "@/stores/auth.store";
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  Clock,
  FileText,
  UserCheck,
  UserMinus,
  Users,
} from "lucide-react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  joursRestants,
  urgenceContrat,
  useConges,
  useEmployes,
  useEvaluations,
} from "./rh-data";

// ── Helpers ────────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat("fr-SN").format(n);
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("fr-FR") : "—");

function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded bg-gray-200 ${className}`} />;
}

// ── Constantes visuelles ───────────────────────────────────
const STATUT_EMP_COLORS = {
  ACTIF: "bg-green-500",
  EN_CONGE: "bg-blue-500",
  SUSPENDU: "bg-orange-500",
  PARTI: "bg-gray-400",
};

const TYPE_CONTRAT_COLORS = {
  CDI: "bg-emerald-500",
  CDD: "bg-sky-500",
  CONSULTANT: "bg-violet-500",
  VOLONTAIRE: "bg-amber-500",
  STAGIAIRE: "bg-pink-500",
};

const TYPE_CONGE_COLORS = {
  ANNUEL: "bg-blue-100 text-blue-700",
  MALADIE: "bg-red-100 text-red-700",
  MATERNITE: "bg-pink-100 text-pink-700",
  PATERNITE: "bg-indigo-100 text-indigo-700",
  SANS_SOLDE: "bg-gray-100 text-gray-700",
  RECUPERATION: "bg-amber-100 text-amber-700",
  MISSION: "bg-violet-100 text-violet-700",
};

const URGENCE_STYLES = {
  CRITIQUE: "bg-red-100 text-red-700 border-red-200",
  DANGER: "bg-orange-100 text-orange-700 border-orange-200",
  WARNING: "bg-yellow-50 text-yellow-700 border-yellow-200",
};

// ── KPI Card ───────────────────────────────────────────────
function KpiCard({ label, value, sub, icon: Icon, color }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div
        className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${color}`}
      >
        <Icon size={18} />
      </div>
      <p className="mt-2 text-xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
      {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Répartition donut-like bar ─────────────────────────────
function RepartitionBar({ data, colors, total }) {
  return (
    <div className="space-y-2">
      {data.map(({ label, count }) => {
        const pct = total > 0 ? (count / total) * 100 : 0;
        return (
          <div key={label} className="flex items-center gap-3">
            <span className="w-28 text-xs text-gray-600 truncate">{label}</span>
            <div className="flex-1 h-2.5 rounded-full bg-gray-100 overflow-hidden">
              <div
                className={`h-full rounded-full ${colors[label] ?? "bg-gray-400"} transition-all`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-8 text-right text-xs font-semibold text-gray-700">
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// PAGE PRINCIPALE
// ══════════════════════════════════════════════════════════
export default function RHTableauDeBord() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const isRP = user?.roles?.includes("ROLE_RESPONSABLE_PROGRAMMES");
  const isFullRH = user?.roles?.some((r) =>
    ["ROLE_RH", "ROLE_SE", "ROLE_ADMIN"].includes(r),
  );

  // ── Calculs KPI ────────────────────────────────────────
  const { data: employes = [] } = useEmployes();
  const { data: conges = [] } = useConges();
  const { data: evaluations = [] } = useEvaluations();

  const effectifActif = employes.filter((e) => e.statut === "ACTIF").length;
  const enConge = employes.filter((e) => e.statut === "EN_CONGE").length;

  // typeContrat et dateFinContrat viennent du contrat actif enrichi dans EmployeResponse
  const contratsCDD = employes.filter(
    (e) =>
      ["CDD", "CONSULTANT", "STAGIAIRE"].includes(e.typeContrat) &&
      e.dateFinContrat,
  );
  const cdd30 = contratsCDD.filter((e) => {
    const j = joursRestants(e.dateFinContrat);
    return j !== null && j <= 30 && j > 0;
  }).length;
  const cdd60 = contratsCDD.filter((e) => {
    const j = joursRestants(e.dateFinContrat);
    return j !== null && j <= 60 && j > 30;
  }).length;
  const cdd90 = contratsCDD.filter((e) => {
    const j = joursRestants(e.dateFinContrat);
    return j !== null && j <= 90 && j > 60;
  }).length;

  // EN_RETARD n'existe pas dans le backend — EN_COURS + SOUMISE = non complétées
  const evalNonCompletees = evaluations.filter((e) =>
    ["EN_COURS", "SOUMISE"].includes(e.statut),
  ).length;

  const congesEnAttente = conges.filter((c) =>
    ["EN_ATTENTE", "VALIDE_N1"].includes(c.statut),
  ).length;

  // ── Répartitions ───────────────────────────────────────
  const repartStatut = useMemo(() => {
    const map = {};
    employes.forEach((e) => {
      map[e.statut] = (map[e.statut] || 0) + 1;
    });
    return Object.entries(map).map(([label, count]) => ({ label, count }));
  }, [employes]);

  const repartContrat = useMemo(() => {
    const map = {};
    employes.forEach((e) => {
      map[e.typeContrat] = (map[e.typeContrat] || 0) + 1;
    });
    return Object.entries(map).map(([label, count]) => ({ label, count }));
  }, [employes]);

  const repartService = useMemo(() => {
    const map = {};
    employes.forEach((e) => {
      const s = e.departement || "Non défini";
      map[s] = (map[s] || 0) + 1;
    });
    return Object.entries(map)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);
  }, [employes]);

  // ── Absences 30j glissants ─────────────────────────────
  const absences30j = useMemo(() => {
    const now = new Date();
    const in30 = new Date(now);
    in30.setDate(in30.getDate() + 30);
    return conges
      .filter((c) => {
        if (c.statut !== "APPROUVE") return false;
        const deb = new Date(c.dateDebut);
        const fin = new Date(c.dateFin);
        return deb <= in30 && fin >= now;
      })
      .map((c) => {
        const emp = employes.find((e) => e.id === c.employeId);
        return {
          ...c,
          employeNom: emp ? `${emp.prenom} ${emp.nom}` : "—",
          service: emp?.departement ?? "—",
          dateSoumission: c.createdAt,
          typeColor: TYPE_CONGE_COLORS[c.typeConge] ?? "bg-gray-100 text-gray-600",
        };
      });
  }, [conges, employes]);

  // ── Alertes actives ────────────────────────────────────
  const alertesContrats = contratsCDD
    .map((e) => ({
      ...e,
      jours: joursRestants(e.dateFinContrat),
      urgence: urgenceContrat(e.dateFinContrat),
    }))
    .filter((e) => e.urgence)
    .sort((a, b) => a.jours - b.jours);

  // EN_RETARD n'existe pas → on utilise SOUMISE comme indicateur d'éval. à traiter
  const alertesEval = evaluations.filter((e) => e.statut === "SOUMISE").map((e) => {
    const emp = employes.find((emp) => emp.id === e.employeId);
    return { ...e, employeNom: emp ? `${emp.prenom} ${emp.nom}` : "—", annee: e.periode };
  });

  const alertesConges = conges.filter((c) => {
    if (!["EN_ATTENTE", "VALIDE_N1"].includes(c.statut)) return false;
    const soumis = c.createdAt ?? c.dateSoumission;
    const diff = Math.ceil(
      (new Date() - new Date(soumis)) / (1000 * 60 * 60 * 24),
    );
    return diff > 3;
  }).map((c) => {
    const emp = employes.find((e) => e.id === c.employeId);
    return {
      ...c,
      employeNom: emp ? `${emp.prenom} ${emp.nom}` : "—",
      dateSoumission: c.createdAt,
    };
  });

  return (
    <RoleGate
      allowedRoles={[
        "ROLE_RH",
        "ROLE_SE",
        "ROLE_ADMIN",
        "ROLE_RESPONSABLE_PROGRAMMES",
      ]}
    >
      <div className="space-y-6">
        {/* ── Titre ─────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isRP ? "Équipes & Disponibilités" : "Tableau de bord RH"}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {isRP
              ? "Membres des équipes projet et leur disponibilité"
              : "Vue d'ensemble du capital humain du FODDE"}
          </p>
        </div>

        {/* ── KPIs ──────────────────────────────────────── */}
        <div
          className={`grid grid-cols-2 gap-3 ${isRP ? "lg:grid-cols-3" : "lg:grid-cols-5"}`}
        >
          <KpiCard
            label="Effectif actif"
            value={effectifActif}
            sub={`${employes.length} au total`}
            icon={Users}
            color="text-emerald-600 bg-emerald-50"
          />
          <KpiCard
            label="En congé aujourd'hui"
            value={enConge}
            icon={Calendar}
            color="text-blue-600 bg-blue-50"
          />
          {!isRP && (
            <KpiCard
              label="CDD à échéance"
              value={`${cdd30}`}
              sub={`30j: ${cdd30} · 60j: ${cdd60} · 90j: ${cdd90}`}
              icon={Clock}
              color={
                cdd30 > 0
                  ? "text-red-600 bg-red-50"
                  : "text-orange-500 bg-orange-50"
              }
            />
          )}
          {!isRP && (
            <KpiCard
              label="Éval. non complétées"
              value={evalNonCompletees}
              icon={FileText}
              color={
                evalNonCompletees > 0
                  ? "text-orange-500 bg-orange-50"
                  : "text-emerald-600 bg-emerald-50"
              }
            />
          )}
          <KpiCard
            label="Congés en attente"
            value={congesEnAttente}
            icon={UserMinus}
            color={
              congesEnAttente > 0
                ? "text-amber-600 bg-amber-50"
                : "text-emerald-600 bg-emerald-50"
            }
          />
        </div>

        {/* ── Répartitions (masquées pour RP) ──────── */}
        {!isRP && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Par statut */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-800 mb-4">
                Par statut
              </h3>
              <RepartitionBar
                data={repartStatut}
                colors={STATUT_EMP_COLORS}
                total={employes.length}
              />
            </div>

            {/* Par type de contrat */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-800 mb-4">
                Par type de contrat
              </h3>
              <RepartitionBar
                data={repartContrat}
                colors={TYPE_CONTRAT_COLORS}
                total={employes.length}
              />
            </div>

            {/* Par service */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-800 mb-4">
                Par service
              </h3>
              <div className="space-y-2">
                {repartService.map(({ label, count }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between"
                  >
                    <span className="text-xs text-gray-600 truncate max-w-[180px]">
                      {label}
                    </span>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Calendrier absences 30j ───────────────────── */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
            <h3 className="text-sm font-semibold text-gray-800">
              Absences planifiées (30 jours glissants)
            </h3>
            <button
              onClick={() => navigate("/rh/conges")}
              className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-dark transition-colors"
            >
              Voir tout <ArrowRight size={12} />
            </button>
          </div>
          <div className="p-5">
            {absences30j.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                Aucune absence planifiée dans les 30 prochains jours.
              </p>
            ) : (
              <div className="space-y-2">
                {absences30j.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center gap-3 rounded-lg border border-gray-100 px-4 py-2.5"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                      {a.employeNom
                        ?.split(" ")
                        .map((w) => w[0])
                        .join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {a.employeNom}
                      </p>
                      <p className="text-xs text-gray-500">{a.service}</p>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium ${a.typeColor}`}
                    >
                      {a.typeConge}
                    </span>
                    <span className="text-xs text-gray-500">
                      {fmtDate(a.dateDebut)} → {fmtDate(a.dateFin)}
                    </span>
                    <span className="text-xs font-semibold text-gray-700">
                      {a.nbJours}j
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Alertes RH actives (masquées pour RP) ──── */}
        {!isRP && (
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <AlertTriangle size={14} className="text-orange-500" />
                Alertes RH actives
              </h3>
              <button
                onClick={() => navigate("/rh/alertes")}
                className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-dark transition-colors"
              >
                Voir toutes <ArrowRight size={12} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Contrats à échéance */}
              {alertesContrats.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Contrats à échéance
                  </p>
                  <div className="space-y-1.5">
                    {alertesContrats.slice(0, 3).map((e) => (
                      <div
                        key={e.id}
                        className={`flex items-center justify-between rounded-lg border px-4 py-2 ${URGENCE_STYLES[e.urgence]}`}
                      >
                        <div className="flex items-center gap-2">
                          <AlertTriangle size={13} />
                          <span className="text-xs font-medium">
                            {e.prenom} {e.nom} — {e.typeContrat}
                          </span>
                        </div>
                        <span className="text-xs font-bold">
                          {e.jours}j restants
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Évaluations en retard */}
              {alertesEval.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Évaluations à valider
                  </p>
                  <div className="space-y-1.5">
                    {alertesEval.map((e) => (
                      <div
                        key={e.id}
                        className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-2"
                      >
                        <span className="text-xs font-medium text-red-700">
                          {e.employeNom} — {e.annee}
                        </span>
                        <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-700">
                          À VALIDER
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Congés en attente > 3 jours */}
              {alertesConges.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Congés en attente {">"}3 jours
                  </p>
                  <div className="space-y-1.5">
                    {alertesConges.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50 px-4 py-2"
                      >
                        <span className="text-xs font-medium text-orange-700">
                          {c.employeNom} — {c.typeConge}
                        </span>
                        <span className="text-xs text-orange-600">
                          soumis le {fmtDate(c.dateSoumission)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {alertesContrats.length === 0 &&
                alertesEval.length === 0 &&
                alertesConges.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">
                    <UserCheck
                      className="mx-auto mb-2 text-emerald-400"
                      size={28}
                    />
                    Aucune alerte RH active.
                  </p>
                )}
            </div>
          </div>
        )}
      </div>
    </RoleGate>
  );
}
