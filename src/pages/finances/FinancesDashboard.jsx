import useAuthStore from "@/stores/auth.store";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  PlusCircle,
  Receipt,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDepenses, useProjetsFinances } from "./finances-data";
import DepenseFormModal from "./DepenseForm";

const fmtMontant = (n) =>
  new Intl.NumberFormat("fr-SN").format(Math.round(n)) + " F";

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

function KPICard({ label, value, icon: Icon, color = "gray", sub }) {
  const colors = {
    gray: "border-gray-200 bg-white text-gray-900",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    green: "border-green-200 bg-green-50 text-green-700",
    orange: "border-orange-200 bg-orange-50 text-orange-700",
    red: "border-red-200 bg-red-50 text-red-700",
  };
  const iconColors = {
    gray: "text-gray-400",
    blue: "text-blue-400",
    green: "text-green-500",
    orange: "text-orange-500",
    red: "text-red-500",
  };
  return (
    <div className={`rounded-xl border px-5 py-4 shadow-sm ${colors[color]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider opacity-60">
            {label}
          </p>
          <p className={`mt-1 text-2xl font-bold`}>{value}</p>
          {sub && <p className="mt-0.5 text-xs opacity-60">{sub}</p>}
        </div>
        <Icon size={22} className={`mt-1 ${iconColors[color]}`} />
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// PAGE — Tableau de bord Finances / Comptabilité
// ════════════════════════════════════════════════════════════
export default function FinancesDashboard() {
  const { user } = useAuthStore();
  const [showModal, setShowModal] = useState(false);
  const isComptable =
    user?.roles?.includes("ROLE_COMPTABLE") &&
    !user?.roles?.some((r) => ["ROLE_RAF", "ROLE_SE", "ROLE_ADMIN"].includes(r));

  const { data: depenses = [], isLoading: loadingDep } = useDepenses();
  const { data: projets = [], isLoading: loadingProjets } = useProjetsFinances();

  // ── KPIs ─────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = depenses.reduce((s, d) => s + d.montantXOF, 0);
    const soumises = depenses.filter((d) => d.statut === "SOUMISE").length;
    const enAttenteSE = depenses.filter(
      (d) => d.statut === "EN_APPROBATION_SE",
    ).length;
    const validees = depenses.filter((d) => d.statut === "VALIDEE").length;
    const rejetees = depenses.filter((d) => d.statut === "REJETEE").length;
    const brouillons = depenses.filter((d) => d.statut === "BROUILLON").length;
    return { total, soumises, enAttenteSE, validees, rejetees, brouillons };
  }, [depenses]);

  // Dernières dépenses (5 max)
  const dernieres = useMemo(
    () =>
      [...depenses]
        .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
        .slice(0, 5),
    [depenses],
  );

  // Projets actifs
  const projetsActifs = useMemo(
    () => projets.filter((p) => p.statut === "ACTIF"),
    [projets],
  );

  const STATUT_COLORS = {
    BROUILLON: "bg-gray-100 text-gray-600",
    SOUMISE: "bg-blue-100 text-blue-700",
    VERIFIEE: "bg-indigo-100 text-indigo-700",
    EN_APPROBATION_SE: "bg-orange-100 text-orange-700",
    VALIDEE: "bg-green-100 text-green-700",
    REJETEE: "bg-red-100 text-red-700",
    ANNULEE: "bg-gray-200 text-gray-400",
  };
  const STATUT_LABELS = {
    BROUILLON: "Brouillon",
    SOUMISE: "Soumise",
    VERIFIEE: "Vérifiée",
    EN_APPROBATION_SE: "Approbation SE",
    VALIDEE: "Validée",
    REJETEE: "Rejetée",
    ANNULEE: "Annulée",
  };

  const isLoading = loadingDep || loadingProjets;

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Tableau de bord
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Bonjour, {user?.prenom} {user?.nom}
            {isComptable && " — Espace Comptabilité"}
          </p>
        </div>
        {isComptable && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white shadow-sm"
            style={{ background: "linear-gradient(135deg, #5A9C3A, #4A7C2F)" }}
          >
            <PlusCircle size={16} />
            Nouvelle dépense
          </button>
        )}
      </div>

      {/* ── KPIs ──────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-xl border border-gray-200 bg-gray-100"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          <KPICard
            label="Total dépenses"
            value={fmtMontant(stats.total)}
            icon={Receipt}
            color="gray"
          />
          <KPICard
            label="Brouillons"
            value={stats.brouillons}
            icon={Clock}
            color="gray"
            sub="À soumettre"
          />
          <KPICard
            label="Soumises"
            value={stats.soumises}
            icon={TrendingUp}
            color="blue"
            sub="En attente RAF"
          />
          <KPICard
            label="Attente SE"
            value={stats.enAttenteSE}
            icon={AlertTriangle}
            color="orange"
            sub="Approbation requise"
          />
          <KPICard
            label="Validées"
            value={stats.validees}
            icon={CheckCircle}
            color="green"
          />
          <KPICard
            label="Rejetées"
            value={stats.rejetees}
            icon={XCircle}
            color="red"
            sub="À corriger"
          />
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        {/* ── Dernières dépenses ────────────────────────── */}
        <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
            <h3 className="text-sm font-semibold text-gray-900">
              {isComptable ? "Mes dernières dépenses" : "Dernières dépenses"}
            </h3>
            <Link
              to="/finances/depenses"
              className="text-xs font-medium text-green-600 hover:text-green-800"
            >
              Tout voir →
            </Link>
          </div>

          {isLoading ? (
            <div className="divide-y divide-gray-100">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="px-5 py-3">
                  <div className="h-4 w-2/3 animate-pulse rounded bg-gray-100" />
                  <div className="mt-1 h-3 w-1/3 animate-pulse rounded bg-gray-100" />
                </div>
              ))}
            </div>
          ) : dernieres.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-gray-400">
              Aucune dépense enregistrée.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {dernieres.map((dep) => (
                <Link
                  key={dep.id}
                  to={`/finances/depenses/${dep.id}`}
                  className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {dep.libelle}
                    </p>
                    <p className="text-xs text-gray-400">
                      {dep.numeroPiece} · {fmtDate(dep.date)} ·{" "}
                      {dep.projetCode ?? dep.projetTitre}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-gray-900">
                      {fmtMontant(dep.montantXOF)}
                    </p>
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUT_COLORS[dep.statut] ?? "bg-gray-100 text-gray-500"}`}
                    >
                      {STATUT_LABELS[dep.statut] ?? dep.statut}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ── Projets actifs ────────────────────────────── */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-gray-100 px-5 py-3">
            <h3 className="text-sm font-semibold text-gray-900">
              Projets actifs ({projetsActifs.length})
            </h3>
          </div>

          {isLoading ? (
            <div className="divide-y divide-gray-100">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="px-5 py-3">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-gray-100" />
                  <div className="mt-1 h-3 w-1/2 animate-pulse rounded bg-gray-100" />
                </div>
              ))}
            </div>
          ) : projetsActifs.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-gray-400">
              Aucun projet actif.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {projetsActifs.map((p) => (
                <Link
                  key={p.id}
                  to={`/finances/budgets/${p.id}`}
                  className="block px-5 py-3 hover:bg-gray-50 transition-colors"
                >
                  <p className="text-xs font-mono font-medium text-gray-400">
                    {p.code}
                  </p>
                  <p className="text-sm font-medium text-gray-900 leading-snug truncate">
                    {p.titre}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Budget : {fmtMontant(p.budgetTotal ?? 0)}{" "}
                    {p.devise ?? "XOF"}
                  </p>
                </Link>
              ))}
            </div>
          )}

          {isComptable && (
            <div className="border-t border-gray-100 px-5 py-3">
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 text-xs font-medium text-green-600 hover:text-green-800"
              >
                <PlusCircle size={14} />
                Saisir une nouvelle dépense
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Alerte dépenses rejetées ──────────────────────── */}
      {stats.rejetees > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4">
          <div className="flex items-center gap-3">
            <XCircle size={18} className="text-red-500 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-800">
                {stats.rejetees} dépense{stats.rejetees > 1 ? "s" : ""} rejetée
                {stats.rejetees > 1 ? "s" : ""}
              </p>
              <p className="text-xs text-red-600 mt-0.5">
                Consultez le motif et corrigez avant de resoumettre.
              </p>
            </div>
            <Link
              to="/finances/depenses"
              className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
            >
              Voir
            </Link>
          </div>
        </div>
      )}

      {/* Modal nouvelle dépense */}
      <DepenseFormModal
        open={showModal}
        onClose={() => setShowModal(false)}
      />
    </div>
  );
}
