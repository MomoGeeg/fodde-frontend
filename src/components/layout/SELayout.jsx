import useAuthStore from "@/stores/auth.store";
import { Navigate, Outlet, useLocation } from "react-router-dom";

const SE_ALLOWED_ROLES = [
  "ROLE_RESPONSABLE_SE",
  "ROLE_CHARGE_PROGRAMME",
  "ROLE_TECHNICIEN_TERRAIN",
  "ROLE_RESPONSABLE_PROGRAMMES",
  "ROLE_SE",
  "ROLE_ADMIN",
];

const PAGE_TITLES = {
  "/se/tableau-de-bord": "Tableau de bord S&E",
  "/se/indicateurs": "Indicateurs de performance",
  "/se/indicateurs/nouveau": "Nouvel indicateur",
  "/se/formulaires": "Formulaires de collecte",
  "/se/formulaires/nouveau": "Nouveau formulaire",
  "/se/validation": "File de validation",
};

/**
 * Layout S&E — wrapper de toutes les routes /se/**
 * - Protège l'accès selon les rôles autorisés
 * - Bandeau titre contextuel
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

  // Résoudre le titre selon pathname
  const pageTitle =
    PAGE_TITLES[location.pathname] ??
    (location.pathname.match(/\/se\/indicateurs\/[^/]+$/) &&
    !location.pathname.includes("nouveau")
      ? "Détail de l'indicateur"
      : location.pathname.match(/\/se\/formulaires\/[^/]+$/) &&
          !location.pathname.includes("nouveau")
        ? "Détail du formulaire"
        : location.pathname.startsWith("/se/collecte")
          ? "Saisie terrain"
          : "Suivi-Évaluation");

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-3">
        <h3 className="text-base font-semibold text-gray-900">{pageTitle}</h3>
        <p className="text-xs text-gray-400 mt-0.5">Module Suivi-Évaluation</p>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </div>
    </div>
  );
}
