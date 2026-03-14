import useAuthStore from "@/stores/auth.store";
import { Navigate, Outlet, useLocation } from "react-router-dom";

// ROLE_ADMIN restreint à /admin — retiré du module S&E
const SE_ALLOWED_ROLES = [
  "ROLE_RESPONSABLE_SE",
  "ROLE_CHARGE_PROGRAMME",
  "ROLE_TECHNICIEN_TERRAIN",
  "ROLE_RESPONSABLE_PROGRAMMES",
  "ROLE_SE",
  "ROLE_RAF",
];

/**
 * Layout S&E — wrapper de toutes les routes /se/**
 * - Protège l'accès selon les rôles autorisés
 * - Sidebar déléguée au MainLayout (crossfade)
 */
export default function SELayout() {
  const { user, isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const hasAccess = user?.roles?.some((r) => SE_ALLOWED_ROLES.includes(r));
  if (!hasAccess) return <Navigate to="/" replace />;

  // Technicien terrain : accès uniquement à la collecte
  const isTT = user?.roles?.includes("ROLE_TECHNICIEN_TERRAIN");
  if (
    isTT &&
    !location.pathname.startsWith("/se/collecte") &&
    location.pathname !== "/se"
  ) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </div>
    </div>
  );
}
