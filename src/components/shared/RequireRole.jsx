import { aAcces } from "@/lib/navigation";
import useAuthStore from "@/stores/auth.store";
import { Navigate, Outlet } from "react-router-dom";

/**
 * Protège un groupe de routes : sans l'un des rôles demandés, retour à l'accueil.
 * Les rôles viennent de ACCES (lib/navigation.js), comme le menu.
 */
export default function RequireRole({ roles, children }) {
  const { user } = useAuthStore();
  if (!aAcces(user?.roles ?? [], roles)) return <Navigate to="/" replace />;
  return children ?? <Outlet />;
}
