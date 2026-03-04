import useAuthStore from "@/stores/auth.store";
import { Navigate } from "react-router-dom";

/**
 * Garde de rôle — redirige si l'utilisateur n'a pas l'un des rôles requis.
 * @param {string[]} allowedRoles - Rôles autorisés (ex: ["ROLE_RAF", "ROLE_SE"])
 * @param {string}   redirectTo   - Chemin de redirection (défaut : "/")
 */
export default function RoleGate({ allowedRoles, children, redirectTo = "/" }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const hasAccess = user?.roles?.some((r) => allowedRoles.includes(r));
  if (!hasAccess) return <Navigate to={redirectTo} replace />;

  return children;
}
