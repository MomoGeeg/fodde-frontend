import { gedApi } from "@/api/ged.api";
import { rafApi } from "@/api/raf.api";
import useAuthStore from "@/stores/auth.store";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart2,
  BarChart3,
  Bell,
  Briefcase,
  Calendar,
  CheckSquare,
  ClipboardCheck,
  ClipboardList,
  FileArchive,
  FileText,
  FolderKanban,
  Landmark,
  LayoutDashboard,
  LogOut,
  MapPin,
  Package,
  PieChart,
  Receipt,
  Star,
  TrendingUp,
  UserCog,
  Users,
  Wallet,
} from "lucide-react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

// ── Rôles ayant accès à l'espace RAF ──────────────────────
const RAF_ROLES = ["ROLE_RAF", "ROLE_SE"];

// ── Items de navigation ────────────────────────────────────
const mainNavItems = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard, exact: true },
  { label: "Projets", path: "/projets", icon: FolderKanban },
  { label: "Activités", path: "/activites", icon: CheckSquare },
  { label: "Finances", path: "/finances", icon: Wallet },
  { label: "Suivi-Éval", path: "/se", icon: BarChart3 },
  { label: "Documents", path: "/documents", icon: FileArchive },
];

const adminNavItems = [
  { label: "Utilisateurs", path: "/utilisateurs", icon: UserCog },
];

const rafNavItems = [
  { label: "Tableau de bord", path: "/raf/tableau-de-bord", icon: TrendingUp },
  {
    label: "Validation dépenses",
    path: "/raf/validation-depenses",
    icon: ClipboardCheck,
  },
  { label: "Budgets", path: "/raf/budgets", icon: BarChart2 },
  { label: "Trésorerie", path: "/raf/tresorerie", icon: Landmark },
  { label: "Missions", path: "/raf/missions", icon: MapPin },
  { label: "Acquisitions", path: "/raf/acquisitions", icon: Package },
  { label: "Rapports", path: "/raf/rapports", icon: FileText },
];

const rhNavItemsFull = [
  {
    label: "Tableau de bord",
    path: "/rh/tableau-de-bord",
    icon: LayoutDashboard,
  },
  { label: "Employés", path: "/rh/employes", icon: Users },
  { label: "Congés", path: "/rh/conges", icon: Calendar },
  { label: "Évaluations", path: "/rh/evaluations", icon: Star },
  { label: "Alertes", path: "/rh/alertes", icon: AlertTriangle },
];

// ── Items de navigation Finances ───────────────────────────
const financesNavItemsFull = [
  { label: "Dépenses", path: "/finances/depenses", icon: Receipt },
  { label: "Budgets", path: "/finances/budgets", icon: PieChart },
];

// Vue restreinte pour le RP : budgets uniquement (lecture seule)
const financesNavItemsRP = [
  { label: "Budgets", path: "/finances/budgets", icon: PieChart },
];

// ── Items de navigation S&E ────────────────────────────────
const seNavItems = [
  { label: "Tableau de bord", path: "/se/tableau-de-bord", icon: BarChart3 },
  { label: "Indicateurs", path: "/se/indicateurs", icon: TrendingUp },
  { label: "Formulaires", path: "/se/formulaires", icon: ClipboardList },
  { label: "Validation", path: "/se/validation", icon: ClipboardCheck },
];

// ── Items de navigation GED ────────────────────────────────
const gedNavItems = [
  { label: "Accueil GED", path: "/documents", icon: FileArchive, exact: true },
  { label: "Projets", path: "/documents/projets", icon: FolderKanban },
  { label: "Ressources Humaines", path: "/documents/rh", icon: Users },
  { label: "Institutionnel", path: "/documents/institutionnel", icon: Landmark },
  { label: "Bailleurs", path: "/documents/bailleurs", icon: Briefcase },
  { label: "Communication", path: "/documents/communication", icon: Bell },
  { label: "Validation", path: "/documents/validation", icon: ClipboardCheck },
];

// GED — rôles accès limités (tous peuvent voir la GED, contrôle par page)
const GED_RESTRICTED = {
  "/documents/rh": ["ROLE_RH", "ROLE_SE", "ROLE_ADMIN"],
  "/documents/institutionnel": ["ROLE_SE", "ROLE_ADMIN"],
  "/documents/bailleurs": ["ROLE_RAF", "ROLE_SE", "ROLE_ADMIN"],
  "/documents/communication": ["ROLE_SE", "ROLE_ADMIN"],
  "/documents/validation": ["ROLE_SE", "ROLE_ADMIN", "ROLE_RESPONSABLE_PROGRAMMES"],
};

// S&E — rôles avec accès
const SE_SIDEBAR_ROLES = [
  "ROLE_RESPONSABLE_SE",
  "ROLE_CHARGE_PROGRAMME",
  "ROLE_TECHNICIEN_TERRAIN",
  "ROLE_RESPONSABLE_PROGRAMMES",
  "ROLE_SE",
  "ROLE_ADMIN",
];

// Vue restreinte pour le RP : équipes + disponibilités uniquement
const rhNavItemsRP = [
  {
    label: "Tableau de bord",
    path: "/rh/tableau-de-bord",
    icon: LayoutDashboard,
  },
  { label: "Employés", path: "/rh/employes", icon: Users },
  { label: "Congés", path: "/rh/conges", icon: Calendar },
];

// ── Pied de sidebar partagé ────────────────────────────────
function UserFooter({ user, onLogout }) {
  return (
    <div className="border-t border-black-light p-4 shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-xs font-bold">
          {user?.prenom?.[0] || user?.nom?.[0] || "U"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-medium text-white">
            {user?.prenom || "Utilisateur"} {user?.nom || ""}
          </p>
          <p className="truncate text-xs text-gray-400">
            {user?.roles?.[0] || "Agent"}
          </p>
        </div>
        <button
          onClick={onLogout}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-danger hover:text-white transition-colors"
          title="Déconnexion"
        >
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );
}

// ── Sidebar principale ─────────────────────────────────────
function MainSidebar({
  user,
  isAdmin,
  showRAFItem,
  showRHItem,
  rafBadgeCount,
  onLogout,
}) {
  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
      isActive
        ? "bg-primary text-white"
        : "text-gray-400 hover:bg-black-light hover:text-white"
    }`;

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-6 border-b border-black-light shrink-0">
        <img
          src="/fodde-logo.png"
          alt="FODDE Logo"
          className="h-9 w-9 rounded-lg object-contain"
        />
        <div>
          <h1 className="text-base font-bold leading-tight">ONG FODDE</h1>
          <p className="text-[11px] text-gray-400 leading-tight">Kolda</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {mainNavItems.map(({ label, path, icon: Icon, exact }) => (
          <NavLink key={path} to={path} end={exact} className={navLinkClass}>
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}

        {/* Espace RAF — visible uniquement pour ROLE_RAF et ROLE_SE */}
        {showRAFItem && (
          <NavLink to="/raf/tableau-de-bord" className={navLinkClass}>
            <Briefcase size={18} />
            <span className="flex-1">Espace RAF</span>
            {rafBadgeCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white leading-none">
                {rafBadgeCount}
              </span>
            )}
          </NavLink>
        )}

        {/* Espace RH — visible uniquement pour ROLE_RH, ROLE_SE, ROLE_ADMIN */}
        {showRHItem && (
          <NavLink to="/rh/tableau-de-bord" className={navLinkClass}>
            <ClipboardList size={18} />
            <span className="flex-1">Espace RH</span>
          </NavLink>
        )}

        {/* Section Administration */}
        {isAdmin && (
          <>
            <div className="mx-3 my-2 border-t border-black-light" />
            <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
              Administration
            </p>
            {adminNavItems.map(({ label, path, icon: Icon }) => (
              <NavLink key={path} to={path} className={navLinkClass}>
                <Icon size={18} />
                <span>{label}</span>
              </NavLink>
            ))}
          </>
        )}
      </nav>

      <UserFooter user={user} onLogout={onLogout} />
    </div>
  );
}

// ── Sidebar RAF ────────────────────────────────────────────
function RAFSidebar({
  user,
  depensesCount,
  alertesCritiques,
  onLogout,
  onBack,
  userRole,
}) {
  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
      isActive
        ? "bg-primary text-white"
        : "text-gray-400 hover:bg-black-light hover:text-white"
    }`;

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-6 border-b border-black-light shrink-0">
        <img
          src="/fodde-logo.png"
          alt="FODDE Logo"
          className="h-9 w-9 rounded-lg object-contain"
        />
        <div>
          <h1 className="text-base font-bold leading-tight">ONG FODDE</h1>
          <p className="text-[11px] text-emerald-400 leading-tight">
            Espace RAF
          </p>
        </div>
      </div>

      {/* Bouton Retour — masqué pour ROLE_RAF (c'est sa page d'accueil) */}
      {userRole !== "ROLE_RAF" && (
        <div className="px-3 pt-3 pb-1 shrink-0">
          <button
            onClick={onBack}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-400 hover:bg-black-light hover:text-white transition-colors"
          >
            <ArrowLeft size={15} />
            <span>Retour au tableau de bord</span>
          </button>
        </div>
      )}

      <div className="mx-3 my-1 border-t border-black-light shrink-0" />

      {/* Navigation RAF */}
      <nav className="flex-1 overflow-y-auto py-2 px-3 space-y-1">
        {rafNavItems.map(({ label, path, icon: Icon }) => {
          const isValidation = path === "/raf/validation-depenses";
          const isDashboard = path === "/raf/tableau-de-bord";

          return (
            <NavLink key={path} to={path} className={navLinkClass}>
              <Icon size={18} />
              <span className="flex-1">{label}</span>

              {/* Badge : dépenses en attente */}
              {isValidation && depensesCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white leading-none">
                  {depensesCount}
                </span>
              )}

              {/* Badge : alertes critiques */}
              {isDashboard && alertesCritiques > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white leading-none">
                  <AlertTriangle size={9} />
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <UserFooter user={user} onLogout={onLogout} />
    </div>
  );
}

// ── Sidebar RH ─────────────────────────────────────────────
function RHSidebar({ user, onLogout, onBack, userRole }) {
  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
      isActive
        ? "bg-primary text-white"
        : "text-gray-400 hover:bg-black-light hover:text-white"
    }`;

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-6 border-b border-black-light shrink-0">
        <img
          src="/fodde-logo.png"
          alt="FODDE Logo"
          className="h-9 w-9 rounded-lg object-contain"
        />
        <div>
          <h1 className="text-base font-bold leading-tight">ONG FODDE</h1>
          <p className="text-[11px] text-blue-400 leading-tight">Espace RH</p>
        </div>
      </div>

      {/* Bouton Retour — masqué pour ROLE_RH (c'est sa page d'accueil) */}
      {userRole !== "ROLE_RH" && (
        <div className="px-3 pt-3 pb-1 shrink-0">
          <button
            onClick={onBack}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-400 hover:bg-black-light hover:text-white transition-colors"
          >
            <ArrowLeft size={15} />
            <span>Retour au tableau de bord</span>
          </button>
        </div>
      )}

      <div className="mx-3 my-1 border-t border-black-light shrink-0" />

      {/* Navigation RH */}
      <nav className="flex-1 overflow-y-auto py-2 px-3 space-y-1">
        {(userRole === "ROLE_RESPONSABLE_PROGRAMMES"
          ? rhNavItemsRP
          : rhNavItemsFull
        ).map(({ label, path, icon: Icon }) => (
          <NavLink key={path} to={path} className={navLinkClass}>
            <Icon size={18} />
            <span className="flex-1">{label}</span>
          </NavLink>
        ))}
      </nav>

      <UserFooter user={user} onLogout={onLogout} />
    </div>
  );
}

// ── Sidebar Finances ───────────────────────────────────────
function FinancesSidebar({ user, onLogout, onBack, userRole }) {
  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
      isActive
        ? "bg-primary text-white"
        : "text-gray-400 hover:bg-black-light hover:text-white"
    }`;

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-6 border-b border-black-light shrink-0">
        <img
          src="/fodde-logo.png"
          alt="FODDE Logo"
          className="h-9 w-9 rounded-lg object-contain"
        />
        <div>
          <h1 className="text-base font-bold leading-tight">ONG FODDE</h1>
          <p className="text-[11px] text-amber-400 leading-tight">
            Comptabilité
          </p>
        </div>
      </div>

      {/* Bouton Retour */}
      <div className="px-3 pt-3 pb-1 shrink-0">
        <button
          onClick={onBack}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-400 hover:bg-black-light hover:text-white transition-colors"
        >
          <ArrowLeft size={15} />
          <span>Retour au tableau de bord</span>
        </button>
      </div>

      <div className="mx-3 my-1 border-t border-black-light shrink-0" />

      {/* Navigation Finances */}
      <nav className="flex-1 overflow-y-auto py-2 px-3 space-y-1">
        {(userRole === "ROLE_RESPONSABLE_PROGRAMMES"
          ? financesNavItemsRP
          : financesNavItemsFull
        ).map(({ label, path, icon: Icon }) => (
          <NavLink key={path} to={path} className={navLinkClass}>
            <Icon size={18} />
            <span className="flex-1">{label}</span>
          </NavLink>
        ))}
      </nav>

      <UserFooter user={user} onLogout={onLogout} />
    </div>
  );
}

// ── Sidebar S&E ────────────────────────────────────────────
function SESidebar({ user, onLogout, onBack, userRole }) {
  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
      isActive
        ? "bg-primary text-white"
        : "text-gray-400 hover:bg-black-light hover:text-white"
    }`;

  // Technicien terrain ne voit rien dans la sidebar (il est redirigé vers /se/collecte)
  const isTT = userRole === "ROLE_TECHNICIEN_TERRAIN";
  const isRP = userRole === "ROLE_RESPONSABLE_PROGRAMMES";

  // Filtrer les nav items selon le rôle
  const filteredItems = isTT
    ? [] // TT n'a pas de sidebar nav
    : isRP
      ? seNavItems.filter((i) => i.path !== "/se/validation") // RP pas de validation
      : seNavItems;

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-6 border-b border-black-light shrink-0">
        <img
          src="/fodde-logo.png"
          alt="FODDE Logo"
          className="h-9 w-9 rounded-lg object-contain"
        />
        <div>
          <h1 className="text-base font-bold leading-tight">ONG FODDE</h1>
          <p className="text-[11px] text-cyan-400 leading-tight">
            Suivi-Évaluation
          </p>
        </div>
      </div>

      {/* Bouton Retour */}
      <div className="px-3 pt-3 pb-1 shrink-0">
        <button
          onClick={onBack}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-400 hover:bg-black-light hover:text-white transition-colors"
        >
          <ArrowLeft size={15} />
          <span>Retour au tableau de bord</span>
        </button>
      </div>

      <div className="mx-3 my-1 border-t border-black-light shrink-0" />

      {/* Navigation S&E */}
      <nav className="flex-1 overflow-y-auto py-2 px-3 space-y-1">
        {filteredItems.map(({ label, path, icon: Icon }) => (
          <NavLink key={path} to={path} className={navLinkClass}>
            <Icon size={18} />
            <span className="flex-1">{label}</span>
          </NavLink>
        ))}
        {isTT && (
          <p className="px-3 py-4 text-xs text-gray-500 text-center">
            Accédez aux formulaires de collecte depuis vos notifications.
          </p>
        )}
      </nav>

      <UserFooter user={user} onLogout={onLogout} />
    </div>
  );
}

// ── Sidebar GED ────────────────────────────────────────────
function GEDSidebar({ user, onLogout, onBack, userRoles, validationCount }) {
  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
      isActive
        ? "bg-primary text-white"
        : "text-gray-400 hover:bg-black-light hover:text-white"
    }`;

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-6 border-b border-black-light shrink-0">
        <img src="/fodde-logo.png" alt="FODDE Logo" className="h-9 w-9 rounded-lg object-contain" />
        <div>
          <h1 className="text-base font-bold leading-tight">ONG FODDE</h1>
          <p className="text-[11px] text-emerald-400 leading-tight">Gestion Documentaire</p>
        </div>
      </div>

      {/* Bouton Retour */}
      <div className="px-3 pt-3 pb-1 shrink-0">
        <button
          onClick={onBack}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-400 hover:bg-black-light hover:text-white transition-colors"
        >
          <ArrowLeft size={15} />
          <span>Retour au tableau de bord</span>
        </button>
      </div>

      <div className="mx-3 my-1 border-t border-black-light shrink-0" />

      {/* Navigation GED */}
      <nav className="flex-1 overflow-y-auto py-2 px-3 space-y-1">
        {gedNavItems.map(({ label, path, icon: Icon, exact }) => {
          const restrictedRoles = GED_RESTRICTED[path];
          const accessible = !restrictedRoles || userRoles?.some((r) => restrictedRoles.includes(r));
          const isValidation = path === "/documents/validation";

          if (!accessible) {
            return (
              <div key={path} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-600 opacity-40 cursor-not-allowed">
                <Icon size={18} />
                <span className="flex-1">{label}</span>
                <FileArchive size={13} className="opacity-50" />
              </div>
            );
          }

          return (
            <NavLink key={path} to={path} end={exact} className={navLinkClass}>
              <Icon size={18} />
              <span className="flex-1">{label}</span>
              {isValidation && validationCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-yellow-500 px-1 text-[10px] font-bold text-white leading-none">
                  {validationCount}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <UserFooter user={user} onLogout={onLogout} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// Layout principal — sidebar contextuelle
// ══════════════════════════════════════════════════════════
export default function MainLayout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const isRAFSpace = location.pathname.startsWith("/raf");
  const isRHSpace = location.pathname.startsWith("/rh");
  const isFinancesSpace = location.pathname.startsWith("/finances");
  const isSESpace = location.pathname.startsWith("/se");
  const isGEDSpace = location.pathname.startsWith("/documents");
  const isAdmin = user?.roles?.includes("ROLE_ADMIN");
  const showRAFItem = user?.roles?.some((r) => RAF_ROLES.includes(r));
  const showRHItem = user?.roles?.some((r) =>
    [
      "ROLE_RH",
      "ROLE_SE",
      "ROLE_ADMIN",
      "ROLE_RESPONSABLE_PROGRAMMES",
    ].includes(r),
  );

  const handleLogout = () => {
    logout();
    navigate("/login");
  };
  const handleBack = () => navigate("/");

  // Badges (activés si RAF/SE ou si on est déjà dans l'espace RAF)
  const enableBadges = isRAFSpace || showRAFItem;
  const enableGEDBadges = isGEDSpace;

  const { data: depensesCount = 0 } = useQuery({
    queryKey: ["raf-depenses-count"],
    queryFn: rafApi.getDepensesCount,
    staleTime: 60_000,
    refetchInterval: 60_000,
    enabled: enableBadges,
  });

  const { data: alertes = [] } = useQuery({
    queryKey: ["raf-alertes"],
    queryFn: rafApi.getAlertes,
    staleTime: 60_000,
    refetchInterval: 60_000,
    enabled: isRAFSpace,
  });

  const alertesCritiques = alertes.filter((a) =>
    ["CRITIQUE", "DANGER"].includes(a.niveau),
  ).length;

  const { data: gedValidationCount = 0 } = useQuery({
    queryKey: ["ged", "validation-count"],
    queryFn: gedApi.getValidationCount,
    staleTime: 60_000,
    refetchInterval: 60_000,
    enabled: enableGEDBadges,
  });

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ── Sidebar contextuelle avec crossfade 200ms ──────── */}
      <aside className="relative w-64 shrink-0 overflow-hidden bg-black-fodde text-white">
        {/* Sidebar principale */}
        <div
          className={`absolute inset-0 flex flex-col transition-opacity duration-200 ${
            !isRAFSpace && !isRHSpace && !isFinancesSpace && !isSESpace && !isGEDSpace
              ? "opacity-100 z-10"
              : "opacity-0 pointer-events-none z-0"
          }`}
        >
          <MainSidebar
            user={user}
            isAdmin={isAdmin}
            showRAFItem={showRAFItem}
            showRHItem={showRHItem}
            rafBadgeCount={depensesCount}
            onLogout={handleLogout}
          />
        </div>

        {/* Sidebar RAF */}
        <div
          className={`absolute inset-0 flex flex-col transition-opacity duration-200 ${
            isRAFSpace
              ? "opacity-100 z-10"
              : "opacity-0 pointer-events-none z-0"
          }`}
        >
          <RAFSidebar
            user={user}
            userRole={user?.roles?.[0]}
            depensesCount={depensesCount}
            alertesCritiques={alertesCritiques}
            onLogout={handleLogout}
            onBack={handleBack}
          />
        </div>

        {/* Sidebar RH */}
        <div
          className={`absolute inset-0 flex flex-col transition-opacity duration-200 ${
            isRHSpace ? "opacity-100 z-10" : "opacity-0 pointer-events-none z-0"
          }`}
        >
          <RHSidebar
            user={user}
            userRole={user?.roles?.[0]}
            onLogout={handleLogout}
            onBack={handleBack}
          />
        </div>

        {/* Sidebar Finances */}
        <div
          className={`absolute inset-0 flex flex-col transition-opacity duration-200 ${
            isFinancesSpace
              ? "opacity-100 z-10"
              : "opacity-0 pointer-events-none z-0"
          }`}
        >
          <FinancesSidebar
            user={user}
            userRole={user?.roles?.[0]}
            onLogout={handleLogout}
            onBack={handleBack}
          />
        </div>

        {/* Sidebar S&E */}
        <div
          className={`absolute inset-0 flex flex-col transition-opacity duration-200 ${
            isSESpace ? "opacity-100 z-10" : "opacity-0 pointer-events-none z-0"
          }`}
        >
          <SESidebar
            user={user}
            userRole={user?.roles?.[0]}
            onLogout={handleLogout}
            onBack={handleBack}
          />
        </div>

        {/* Sidebar GED */}
        <div
          className={`absolute inset-0 flex flex-col transition-opacity duration-200 ${
            isGEDSpace ? "opacity-100 z-10" : "opacity-0 pointer-events-none z-0"
          }`}
        >
          <GEDSidebar
            user={user}
            userRoles={user?.roles}
            onLogout={handleLogout}
            onBack={handleBack}
            validationCount={gedValidationCount}
          />
        </div>
      </aside>

      {/* ── Contenu principal ──────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 shadow-sm shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">
            {isRAFSpace
              ? "Espace RAF"
              : isRHSpace
                ? "Espace RH"
                : isFinancesSpace
                  ? "Gestion Financière"
                  : isSESpace
                    ? "Suivi-Évaluation"
                    : isGEDSpace
                      ? "Gestion Documentaire"
                      : "Tableau de bord"}
          </h2>
          <div className="flex items-center gap-4">
            <button className="relative rounded-lg p-2 text-gray-600 hover:bg-gray-100">
              <Bell size={20} />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger" />
            </button>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-xs font-bold">
                {user?.prenom?.[0] || user?.nom?.[0] || "U"}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-900">
                  {user?.prenom || "Utilisateur"} {user?.nom || ""}
                </p>
                <p className="text-xs text-gray-600">
                  {user?.roles?.[0] || "Agent"}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Zone de contenu — scrolling géré par RAFLayout dans l'espace RAF */}
        <main
          className={`flex-1 bg-gray-50 ${isRAFSpace || isRHSpace || isFinancesSpace || isSESpace || isGEDSpace ? "overflow-hidden" : "overflow-y-auto p-6"}`}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
