import { dashboardApi } from "@/api/dashboard.api";
import { rafApi } from "@/api/raf.api";
import useAuthStore from "@/stores/auth.store";
import { useQueries, useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  BarChart3,
  Briefcase,
  CheckSquare,
  ClipboardCheck,
  ClipboardList,
  FileArchive,
  FolderKanban,
  Receipt,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { Link } from "react-router-dom";

const fmt = (n) =>
  n != null ? new Intl.NumberFormat("fr-SN").format(n) + " F" : "—";

const pct = (depense, budget) =>
  budget > 0 ? Math.round((depense / budget) * 100) : 0;

function KpiCard({ label, value, icon: Icon, color, loading }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-lg ${color}`}
      >
        <Icon size={22} />
      </div>
      <div>
        <p className="text-sm text-gray-600">{label}</p>
        {loading ? (
          <div className="mt-1 h-7 w-16 animate-pulse rounded bg-gray-200" />
        ) : (
          <p className="text-xl font-bold text-gray-900">{value ?? "—"}</p>
        )}
      </div>
    </div>
  );
}

function QuickAction({ to, label, icon: Icon }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
    >
      <Icon size={16} className="text-gray-500" />
      {label}
    </Link>
  );
}

// ─── Vue SE / Admin ────────────────────────────────────────────────────────────
function DashboardSE({ projets, employes, depensesMois, alertes, loading }) {
  const actifs = projets?.filter((p) => p.statut === "ACTIF").length ?? 0;
  const enValidation =
    projets?.filter((p) => p.statut === "EN_VALIDATION").length ?? 0;
  const effectif = employes?.length ?? 0;
  const alertesCritiques =
    alertes?.filter((a) => a.niveau === "CRITIQUE").length ?? 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Projets actifs"
          value={actifs}
          icon={FolderKanban}
          color="bg-green-100 text-green-700"
          loading={loading}
        />
        <KpiCard
          label="En validation"
          value={enValidation}
          icon={ClipboardCheck}
          color="bg-yellow-100 text-yellow-700"
          loading={loading}
        />
        <KpiCard
          label="Effectif actif"
          value={effectif}
          icon={Users}
          color="bg-blue-100 text-blue-700"
          loading={loading}
        />
        <KpiCard
          label="Dépenses du mois"
          value={fmt(depensesMois?.total)}
          icon={Wallet}
          color="bg-orange-100 text-orange-700"
          loading={loading}
        />
      </div>

      {alertesCritiques > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle size={16} className="shrink-0" />
          <span>
            <strong>{alertesCritiques} alerte(s) critique(s)</strong> nécessitent
            votre attention.
          </span>
          <Link
            to="/raf/tableau-de-bord"
            className="ml-auto font-medium underline"
          >
            Voir
          </Link>
        </div>
      )}

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-700">
          Accès rapides
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <QuickAction to="/projets" label="Projets" icon={FolderKanban} />
          <QuickAction
            to="/raf/validation-depenses"
            label="Valider dépenses"
            icon={Receipt}
          />
          <QuickAction to="/rh/tableau-de-bord" label="RH" icon={Users} />
          <QuickAction
            to="/se/tableau-de-bord"
            label="S&E"
            icon={BarChart3}
          />
          <QuickAction to="/raf/tresorerie" label="Trésorerie" icon={Wallet} />
          <QuickAction
            to="/documents"
            label="GED"
            icon={FileArchive}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Vue RAF ───────────────────────────────────────────────────────────────────
function DashboardRAF({
  projets,
  depensesMois,
  depensesEnAttente,
  avances,
  loading,
}) {
  const depAttente = depensesEnAttente?.length ?? 0;
  const avancesCount = avances?.length ?? 0;

  const totalBudget =
    projets?.reduce((s, p) => s + (p.budget_total ?? 0), 0) ?? 0;
  const totalDepense =
    projets?.reduce((s, p) => s + (p.montant_depense ?? 0), 0) ?? 0;
  const txExecution = pct(totalDepense, totalBudget);

  const projetsAlerte =
    projets?.filter(
      (p) =>
        (p.budget_total ?? 0) > 0 &&
        pct(p.montant_depense ?? 0, p.budget_total) >= 80,
    ).length ?? 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Dépenses à valider"
          value={depAttente}
          icon={ClipboardList}
          color="bg-yellow-100 text-yellow-700"
          loading={loading}
        />
        <KpiCard
          label="Dépenses du mois"
          value={fmt(depensesMois?.total)}
          icon={Wallet}
          color="bg-green-100 text-green-700"
          loading={loading}
        />
        <KpiCard
          label="Avances non justifiées"
          value={avancesCount}
          icon={AlertTriangle}
          color="bg-red-100 text-red-700"
          loading={loading}
        />
        <KpiCard
          label="Projets ≥ 80 %"
          value={projetsAlerte}
          icon={TrendingUp}
          color="bg-orange-100 text-orange-700"
          loading={loading}
        />
      </div>

      {/* Taux d'exécution global */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <p className="mb-2 text-sm font-semibold text-gray-700">
          Taux d'exécution budgétaire global
        </p>
        <div className="flex items-center gap-4">
          <div className="h-4 flex-1 overflow-hidden rounded-full bg-gray-100">
            <div
              className={`h-full rounded-full transition-all ${
                txExecution >= 80
                  ? "bg-red-500"
                  : txExecution >= 60
                    ? "bg-yellow-500"
                    : "bg-green-500"
              }`}
              style={{ width: `${Math.min(txExecution, 100)}%` }}
            />
          </div>
          <span className="w-12 text-right text-sm font-bold text-gray-800">
            {loading ? "…" : `${txExecution} %`}
          </span>
        </div>
        <p className="mt-1 text-xs text-gray-400">
          {fmt(totalDepense)} / {fmt(totalBudget)}
        </p>
      </div>

      {/* Par projet */}
      {!loading && projets && projets.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-3">
            <p className="text-sm font-semibold text-gray-700">
              Exécution par projet
            </p>
          </div>
          <div className="divide-y divide-gray-50">
            {projets.slice(0, 5).map((p) => {
              const tx = pct(p.montant_depense ?? 0, p.budget_total ?? 0);
              return (
                <div key={p.id} className="flex items-center gap-4 px-5 py-3">
                  <span className="w-24 truncate font-mono text-xs text-gray-500">
                    {p.code}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={`h-full rounded-full ${
                        tx >= 80
                          ? "bg-red-400"
                          : tx >= 60
                            ? "bg-yellow-400"
                            : "bg-green-400"
                      }`}
                      style={{ width: `${Math.min(tx, 100)}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-xs font-bold text-gray-700">
                    {tx} %
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-700">
          Accès rapides
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <QuickAction
            to="/raf/validation-depenses"
            label="Valider dépenses"
            icon={CheckSquare}
          />
          <QuickAction to="/raf/tresorerie" label="Trésorerie" icon={Wallet} />
          <QuickAction
            to="/raf/budgets"
            label="Budgets"
            icon={BarChart3}
          />
          <QuickAction
            to="/raf/missions"
            label="Missions"
            icon={Briefcase}
          />
          <QuickAction
            to="/raf/acquisitions"
            label="Acquisitions"
            icon={ClipboardList}
          />
          <QuickAction
            to="/raf/rapports"
            label="Rapports"
            icon={FileArchive}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Vue RP ────────────────────────────────────────────────────────────────────
function DashboardRP({ projets, loading }) {
  const actifs = projets?.filter((p) => p.statut === "ACTIF").length ?? 0;
  const enRetard =
    projets?.filter((p) => p.statut === "ACTIF" && p.en_retard).length ?? 0;
  const brouillons =
    projets?.filter((p) => p.statut === "BROUILLON").length ?? 0;
  const enCloture =
    projets?.filter((p) => p.statut === "EN_CLOTURE").length ?? 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Projets actifs"
          value={actifs}
          icon={FolderKanban}
          color="bg-green-100 text-green-700"
          loading={loading}
        />
        <KpiCard
          label="En retard"
          value={enRetard}
          icon={AlertTriangle}
          color="bg-red-100 text-red-700"
          loading={loading}
        />
        <KpiCard
          label="Brouillons"
          value={brouillons}
          icon={ClipboardList}
          color="bg-gray-100 text-gray-600"
          loading={loading}
        />
        <KpiCard
          label="En clôture"
          value={enCloture}
          icon={CheckSquare}
          color="bg-blue-100 text-blue-700"
          loading={loading}
        />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-700">
          Accès rapides
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <QuickAction to="/projets" label="Mes projets" icon={FolderKanban} />
          <QuickAction
            to="/se/tableau-de-bord"
            label="S&E"
            icon={BarChart3}
          />
          <QuickAction
            to="/finances/budgets"
            label="Budgets"
            icon={Wallet}
          />
          <QuickAction
            to="/documents/projets"
            label="Documents projets"
            icon={FileArchive}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Vue RH ────────────────────────────────────────────────────────────────────
function DashboardRH({ employes, loading }) {
  const actifs = employes?.length ?? 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Employés actifs"
          value={actifs}
          icon={Users}
          color="bg-green-100 text-green-700"
          loading={loading}
        />
        <KpiCard
          label="Congés en cours"
          value="—"
          icon={ClipboardList}
          color="bg-blue-100 text-blue-700"
          loading={loading}
        />
        <KpiCard
          label="Évaluations en attente"
          value="—"
          icon={ClipboardCheck}
          color="bg-yellow-100 text-yellow-700"
          loading={loading}
        />
        <KpiCard
          label="Alertes RH"
          value="—"
          icon={AlertTriangle}
          color="bg-red-100 text-red-700"
          loading={loading}
        />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-700">
          Accès rapides
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <QuickAction to="/rh/employes" label="Employés" icon={Users} />
          <QuickAction
            to="/rh/conges"
            label="Congés"
            icon={ClipboardList}
          />
          <QuickAction
            to="/rh/evaluations"
            label="Évaluations"
            icon={CheckSquare}
          />
          <QuickAction
            to="/rh/alertes"
            label="Alertes RH"
            icon={AlertTriangle}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Vue générale (fallback) ───────────────────────────────────────────────────
function DashboardGeneral({ projets, employes, documents, depensesMois, loading }) {
  const stats = [
    {
      label: "Projets actifs",
      value: projets?.filter((p) => p.statut === "ACTIF").length ?? "—",
      icon: FolderKanban,
      color: "bg-primary/10 text-primary",
    },
    {
      label: "Dépenses du mois",
      value: fmt(depensesMois?.total),
      icon: Wallet,
      color: "bg-warning/10 text-warning",
    },
    {
      label: "Employés actifs",
      value: employes?.length ?? "—",
      icon: Users,
      color: "bg-info/10 text-info",
    },
    {
      label: "Documents GED",
      value: documents?.length ?? "—",
      icon: FileArchive,
      color: "bg-success/10 text-success",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map(({ label, value, icon, color }) => (
        <KpiCard
          key={label}
          label={label}
          value={value}
          icon={icon}
          color={color}
          loading={loading}
        />
      ))}
    </div>
  );
}

// ─── Page principale ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuthStore();
  const roles = user?.roles ?? [];

  const isSE =
    roles.includes("ROLE_SE") || roles.includes("ROLE_ADMIN");
  const isRAF = !isSE && roles.includes("ROLE_RAF");
  const isRP =
    !isSE && !isRAF && roles.includes("ROLE_RESPONSABLE_PROGRAMMES");
  const isRH = !isSE && !isRAF && !isRP && roles.includes("ROLE_RH");

  const results = useQueries({
    queries: [
      { queryKey: ["projets"], queryFn: () => dashboardApi.getProjets() },
      { queryKey: ["employes"], queryFn: () => dashboardApi.getEmployes() },
      { queryKey: ["documents"], queryFn: () => dashboardApi.getDocuments() },
      {
        queryKey: ["depenses-mois"],
        queryFn: () => dashboardApi.getDepensesMoisCourant(),
      },
    ],
  });

  const rafProjets = useQuery({
    queryKey: ["raf", "projets"],
    queryFn: () => rafApi.getProjets(),
    enabled: isRAF,
  });
  const rafAlertes = useQuery({
    queryKey: ["raf", "alertes"],
    queryFn: () => rafApi.getAlertes(),
    enabled: isSE || isRAF,
  });
  const rafDepensesEnAttente = useQuery({
    queryKey: ["raf", "depenses-attente"],
    queryFn: () => rafApi.getDepensesEnAttente(),
    enabled: isRAF,
  });
  const rafAvances = useQuery({
    queryKey: ["raf", "avances"],
    queryFn: () => rafApi.getAvancesNonJustifiees(),
    enabled: isRAF,
  });

  const [projetsQ, employesQ, documentsQ, depensesQ] = results;
  const isLoading = results.some((r) => r.isLoading);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="mt-1 text-gray-600">
          Bienvenue, {user?.prenom || "Utilisateur"} ! Voici un aperçu de votre
          espace.
        </p>
      </div>

      {isSE && (
        <DashboardSE
          projets={projetsQ.data}
          employes={employesQ.data}
          depensesMois={depensesQ.data}
          alertes={rafAlertes.data}
          loading={isLoading}
        />
      )}

      {isRAF && (
        <DashboardRAF
          projets={rafProjets.data ?? projetsQ.data}
          depensesMois={depensesQ.data}
          depensesEnAttente={rafDepensesEnAttente.data}
          avances={rafAvances.data}
          loading={isLoading || rafProjets.isLoading}
        />
      )}

      {isRP && (
        <DashboardRP projets={projetsQ.data} loading={isLoading} />
      )}

      {isRH && (
        <DashboardRH employes={employesQ.data} loading={isLoading} />
      )}

      {!isSE && !isRAF && !isRP && !isRH && (
        <DashboardGeneral
          projets={projetsQ.data}
          employes={employesQ.data}
          documents={documentsQ.data}
          depensesMois={depensesQ.data}
          loading={isLoading}
        />
      )}
    </div>
  );
}
