import { dashboardApi } from "@/api/dashboard.api";
import useAuthStore from "@/stores/auth.store";
import { useQueries } from "@tanstack/react-query";
import { FileArchive, FolderKanban, Users, Wallet } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuthStore();

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

  const [projetsQ, employesQ, documentsQ, depensesQ] = results;
  const isLoading = results.some((r) => r.isLoading);

  const projetsActifs =
    projetsQ.data?.filter((p) => p.statut === "ACTIF").length ?? "—";

  const employesActifs =
    employesQ.data?.filter((e) => e.statut === "ACTIF").length ?? "—";

  const totalDocuments = documentsQ.data?.length ?? "—";

  const totalDepenses =
    depensesQ.data?.total != null
      ? new Intl.NumberFormat("fr-SN").format(depensesQ.data.total) + " F"
      : "—";

  const stats = [
    {
      label: "Projets actifs",
      value: projetsActifs,
      icon: FolderKanban,
      color: "bg-primary/10 text-primary",
    },
    {
      label: "Dépenses du mois",
      value: totalDepenses,
      icon: Wallet,
      color: "bg-warning/10 text-warning",
    },
    {
      label: "Employés actifs",
      value: employesActifs,
      icon: Users,
      color: "bg-info/10 text-info",
    },
    {
      label: "Documents GED",
      value: totalDocuments,
      icon: FileArchive,
      color: "bg-success/10 text-success",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Bienvenue */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="mt-1 text-gray-600">
          Bienvenue, {user?.prenom || "Utilisateur"} ! Voici un aperçu de votre
          espace.
        </p>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-lg ${color}`}
            >
              <Icon size={22} />
            </div>
            <div>
              <p className="text-sm text-gray-600">{label}</p>
              {isLoading ? (
                <div className="mt-1 h-7 w-16 animate-pulse rounded bg-gray-200" />
              ) : (
                <p className="text-xl font-bold text-gray-900">{value}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Placeholder futur contenu */}
      <div className="rounded-xl border border-dashed border-gray-200 bg-white p-12 text-center">
        <p className="text-sm text-gray-400">
          Les graphiques et activités récentes seront intégrés prochainement.
        </p>
      </div>
    </div>
  );
}
