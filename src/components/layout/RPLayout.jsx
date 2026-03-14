import useAuthStore from "@/stores/auth.store";
import { Navigate, Outlet } from "react-router-dom";

const RP_ALLOWED_ROLES = ["ROLE_RESPONSABLE_PROGRAMMES", "ROLE_SE", "ROLE_ADMIN"];

export default function RPLayout() {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const hasAccess = user?.roles?.some((r) => RP_ALLOWED_ROLES.includes(r));
  if (!hasAccess) return <Navigate to="/" replace />;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </div>
    </div>
  );
}
