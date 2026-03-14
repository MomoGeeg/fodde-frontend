import useAuthStore from "@/stores/auth.store";
import { Navigate, Outlet } from "react-router-dom";

const SECRETARIAT_ALLOWED_ROLES = ["ROLE_SE"];

/**
 * Layout Secrétariat Exécutif — wrapper de toutes les routes /secretariat/**
 * - Protège l'accès : seul ROLE_SE est autorisé
 * - Pas de sous-bandeau (le header MainLayout + sidebar suffisent)
 */
export default function SecretariatLayout() {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const hasAccess = user?.roles?.some((r) => SECRETARIAT_ALLOWED_ROLES.includes(r));
  if (!hasAccess) return <Navigate to="/" replace />;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </div>
    </div>
  );
}
