import useAuthStore from "@/stores/auth.store";
import { Navigate, Outlet, useLocation } from "react-router-dom";

const PAGE_TITLES = {
  "/documents": "Tous les documents",
  "/documents/validation": "File de validation",
};

/**
 * Layout GED — wrapper de toutes les routes /documents/**
 * - Protège l'accès (authentification requise)
 * - Affiche un bandeau titre contextuel
 * - Délègue le rendu de la sidebar au MainLayout (crossfade automatique)
 */
export default function GEDLayout() {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Déterminer le titre de page
  const exactTitle = PAGE_TITLES[location.pathname];
  const parentKey = Object.keys(PAGE_TITLES).find(
    (k) => k !== "/documents" && location.pathname.startsWith(k)
  );
  const pageTitle = exactTitle ?? (parentKey ? PAGE_TITLES[parentKey] : "Gestion documentaire");

  return (
    <div className="flex flex-col h-full">
      {/* Bandeau titre */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-3">
        <h3 className="text-base font-semibold text-gray-900">{pageTitle}</h3>
        <p className="text-xs text-gray-400 mt-0.5">
          Module 5 — Gestion Électronique des Documents
        </p>
      </div>

      {/* Zone de contenu scrollable */}
      <div className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </div>
    </div>
  );
}
