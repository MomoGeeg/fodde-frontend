import useAuthStore from "@/stores/auth.store";
import { Navigate, Outlet, useLocation } from "react-router-dom";

const ADMIN_ALLOWED_ROLES = ["ROLE_ADMIN"];

const PAGE_TITLES = {
  "/admin/utilisateurs":        "Gestion des utilisateurs",
  "/admin/utilisateurs/nouveau": "Créer un compte utilisateur",
  "/admin/sans-compte":         "Employés sans compte utilisateur",
};

/**
 * Layout Administration — wrapper de toutes les routes /admin/**
 * - Protège l'accès : seul ROLE_ADMIN est autorisé
 * - Affiche un bandeau titre contextuel
 * - Délègue le rendu de la sidebar au MainLayout (AdminSidebar)
 */
export default function AdminLayout() {
  const { user, isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const hasAccess = user?.roles?.some((r) => ADMIN_ALLOWED_ROLES.includes(r));
  if (!hasAccess) return <Navigate to="/" replace />;

  // Normalise les paths avec /edit
  const basePath = location.pathname.replace(/\/[^/]+\/edit$/, "/edit");
  const pageTitle =
    PAGE_TITLES[location.pathname] ??
    (location.pathname.includes("/edit") ? "Modifier le compte" : "Administration");

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-3">
        <h3 className="text-base font-semibold text-gray-900">{pageTitle}</h3>
        <p className="text-xs text-gray-400 mt-0.5">
          Administrateur Système · Gestion des accès et comptes utilisateurs
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </div>
    </div>
  );
}
