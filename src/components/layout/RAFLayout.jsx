import useAuthStore from "@/stores/auth.store";
import { Navigate, Outlet, useLocation } from "react-router-dom";

const RAF_ALLOWED_ROLES = ["ROLE_RAF", "ROLE_SE"];

const PAGE_TITLES = {
  "/raf/tableau-de-bord":     "Tableau de bord financier",
  "/raf/validation-depenses": "Validation des dépenses",
  "/raf/budgets":             "Gestion budgétaire consolidée",
  "/raf/tresorerie":          "Position de trésorerie",
  "/raf/missions":            "Frais de mission",
  "/raf/acquisitions":        "Acquisitions matériel",
  "/raf/rapports":            "Rapports financiers",
};

/**
 * Layout RAF — wrapper de toutes les routes /raf/**
 * - Protège l'accès : seuls ROLE_RAF et ROLE_SE sont autorisés
 * - Affiche un bandeau titre contextuel
 * - Délègue le rendu de la sidebar au MainLayout (qui bascule automatiquement)
 */
export default function RAFLayout() {
  const { user, isAuthenticated } = useAuthStore();
  const location = useLocation();

  // Garde d'authentification
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Garde de rôle — redirection vers le dashboard si non autorisé
  const hasAccess = user?.roles?.some((r) => RAF_ALLOWED_ROLES.includes(r));
  if (!hasAccess) return <Navigate to="/" replace />;

  const pageTitle = PAGE_TITLES[location.pathname] ?? "Espace RAF";

  return (
    <div className="flex flex-col h-full">
      {/* Bandeau titre de la page */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-3">
        <h3 className="text-base font-semibold text-gray-900">{pageTitle}</h3>
        <p className="text-xs text-gray-400 mt-0.5">
          Responsable Administratif & Financier · Secrétaire Exécutif
        </p>
      </div>

      {/* Zone de contenu scrollable */}
      <div className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </div>
    </div>
  );
}
