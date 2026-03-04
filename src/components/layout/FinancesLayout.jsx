import useAuthStore from "@/stores/auth.store";
import { Navigate, Outlet, useLocation } from "react-router-dom";

const FINANCES_ALLOWED_ROLES = [
  "ROLE_COMPTABLE",
  "ROLE_RAF",
  "ROLE_SE",
  "ROLE_ADMIN",
  "ROLE_RESPONSABLE_PROGRAMMES",
];

const PAGE_TITLES = {
  "/finances/depenses": "Liste des dépenses",
  "/finances/depenses/nouvelle": "Nouvelle dépense",
  "/finances/budgets": "Suivi budgétaire consolidé",
};

/**
 * Layout Finances — wrapper de toutes les routes /finances/**
 * - Protège l'accès selon les rôles autorisés
 * - Redirige le RP vers budgets (pas d'accès dépenses/trésorerie)
 * - Bandeau titre contextuel
 * - Sidebar déléguée au MainLayout (crossfade)
 */
export default function FinancesLayout() {
  const { user, isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const hasAccess = user?.roles?.some((r) =>
    FINANCES_ALLOWED_ROLES.includes(r),
  );
  if (!hasAccess) return <Navigate to="/" replace />;

  // RP : accès uniquement aux budgets (lecture seule)
  const isRP = user?.roles?.includes("ROLE_RESPONSABLE_PROGRAMMES");
  if (isRP && location.pathname.startsWith("/finances/depenses")) {
    return <Navigate to="/finances/budgets" replace />;
  }

  // Résoudre le titre selon pathname
  const pageTitle =
    PAGE_TITLES[location.pathname] ??
    (location.pathname.match(/\/finances\/depenses\/[^/]+$/) &&
    !location.pathname.includes("nouvelle")
      ? "Détail de la dépense"
      : location.pathname.match(/\/finances\/budgets\/[^/]+$/)
        ? "Structure budgétaire du projet"
        : "Gestion Financière");

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-3">
        <h3 className="text-base font-semibold text-gray-900">{pageTitle}</h3>
        <p className="text-xs text-gray-400 mt-0.5">
          Module Comptabilité & Finances
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </div>
    </div>
  );
}
