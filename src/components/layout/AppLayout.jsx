import { LIBELLES_ROLES, menuPour, titrePage } from "@/lib/navigation";
import useAuthStore from "@/stores/auth.store";
import { LogOut, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

/**
 * Mise en page unique de l'application : un menu par sujet, filtré selon les
 * rôles de l'utilisateur, un en-tête avec le titre de la page, et la page.
 * Sur mobile, le menu s'ouvre par-dessus le contenu.
 */
export default function AppLayout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOuvert, setMenuOuvert] = useState(false);

  const roles = user?.roles ?? [];
  const sections = menuPour(roles);
  const titre = titrePage(location.pathname);

  // Fermer le menu mobile après chaque navigation
  useEffect(() => {
    setMenuOuvert(false); // eslint-disable-line react-hooks/set-state-in-effect
  }, [location.pathname]);

  const seDeconnecter = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const libelleRole = roles.map((r) => LIBELLES_ROLES[r]).filter(Boolean).join(", ");

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Fond sombre derrière le menu mobile */}
      {menuOuvert && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setMenuOuvert(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Menu latéral ───────────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-black-fodde text-gray-300 transition-transform lg:static lg:translate-x-0 ${
          menuOuvert ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 px-4">
          <div className="flex items-center gap-2">
            <img src="/fodde-logo.png" alt="" className="h-7 w-7 rounded" />
            <span className="text-sm font-semibold text-white">ONG FODDE</span>
          </div>
          <button
            className="rounded p-1 text-gray-400 hover:text-white lg:hidden"
            onClick={() => setMenuOuvert(false)}
            aria-label="Fermer le menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3">
          {sections.map((section, i) => (
            <div key={section.titre ?? i} className="mb-3">
              {section.titre && (
                <p className="mb-1 px-3 text-[11px] font-medium uppercase tracking-wide text-gray-500">
                  {section.titre}
                </p>
              )}
              {section.items.map(({ label, path, icon: Icon, exact }) => (
                <NavLink
                  key={path}
                  to={path}
                  end={exact}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                      isActive ? "bg-primary text-white" : "hover:bg-white/5 hover:text-white"
                    }`
                  }
                >
                  <Icon size={16} className="shrink-0" />
                  <span className="truncate">{label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-white/10 p-3">
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
              {(user?.prenom?.[0] ?? "") + (user?.nom?.[0] ?? "")}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-white">
                {user?.prenom} {user?.nom}
              </p>
              <p className="truncate text-xs text-gray-500" title={libelleRole}>
                {libelleRole}
              </p>
            </div>
            <button
              onClick={seDeconnecter}
              className="rounded p-1.5 text-gray-400 hover:bg-white/5 hover:text-white"
              title="Se déconnecter"
              aria-label="Se déconnecter"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Contenu ───────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-gray-200 bg-white px-4 lg:px-6">
          <button
            className="rounded p-1.5 text-gray-600 hover:bg-gray-100 lg:hidden"
            onClick={() => setMenuOuvert(true)}
            aria-label="Ouvrir le menu"
          >
            <Menu size={20} />
          </button>
          <h1 className="truncate text-base font-semibold text-gray-900">{titre}</h1>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
