import useAuthStore from "@/stores/auth.store";
import { Navigate, Outlet, useLocation } from "react-router-dom";

const TERRAIN_ALLOWED_ROLES = [
  "ROLE_TECHNICIEN_TERRAIN",
  "ROLE_ANTENNE",
  "ROLE_RESPONSABLE_SE",
  "ROLE_SE",
  "ROLE_ADMIN",
];

const PAGE_TITLES = {
  "/terrain":            "Tableau de bord terrain",
  "/terrain/collecte":   "Formulaires de collecte",
  "/terrain/rapports":   "Mes rapports d'activité",
};

export default function TerrainLayout() {
  const { user, isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const hasAccess = user?.roles?.some((r) => TERRAIN_ALLOWED_ROLES.includes(r));
  if (!hasAccess) return <Navigate to="/" replace />;

  const pageTitle = PAGE_TITLES[location.pathname] ?? "Espace Terrain";

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-3">
        <h3 className="text-base font-semibold text-gray-900">{pageTitle}</h3>
        <p className="text-xs text-gray-400 mt-0.5">
          Agent de Terrain · Collecte &amp; Rapports
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </div>
    </div>
  );
}
