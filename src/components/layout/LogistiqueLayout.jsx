import useAuthStore from "@/stores/auth.store";
import { Navigate, Outlet, useLocation } from "react-router-dom";

const LOGISTIQUE_ALLOWED_ROLES = [
  "ROLE_RESPONSABLE_LOGISTIQUE",
  "ROLE_SE",
  "ROLE_RAF",
  "ROLE_ADMIN",
];

const PAGE_TITLES = {
  "/logistique":              "Tableau de bord logistique",
  "/logistique/inventaire":   "Inventaire des équipements",
  "/logistique/vehicules":    "Parc de véhicules",
  "/logistique/mouvements":   "Journal des mouvements",
};

export default function LogistiqueLayout() {
  const { user, isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const hasAccess = user?.roles?.some((r) => LOGISTIQUE_ALLOWED_ROLES.includes(r));
  if (!hasAccess) return <Navigate to="/" replace />;

  const pageTitle = PAGE_TITLES[location.pathname] ?? "Espace Logistique";

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-3">
        <h3 className="text-base font-semibold text-gray-900">{pageTitle}</h3>
        <p className="text-xs text-gray-400 mt-0.5">
          Responsable Logistique · Administration
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </div>
    </div>
  );
}
