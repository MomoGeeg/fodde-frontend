import { rafApi } from "@/api/raf.api";
import api from "@/api/axios";
import useAuthStore from "@/stores/auth.store";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart2,
  BarChart3,
  Bell,
  Box,
  Briefcase,
  Building2,
  Calendar,
  CheckSquare,
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  Database,
  Clock,
  FileArchive,
  FileText,
  FolderKanban,
  Landmark,
  LayoutDashboard,
  LogOut,
  MapPin,
  Mountain,
  Package,
  PieChart,
  Receipt,
  Star,
  TrendingUp,
  Truck,
  UserCog,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

// ── Rôles ayant accès à l'espace RAF ──────────────────────
const RAF_ROLES = ["ROLE_RAF", "ROLE_SE"];

// ── Rôles ayant accès au module Terrain ────────────────────
const TERRAIN_ROLES = [
  "ROLE_TECHNICIEN_TERRAIN",
  "ROLE_ANTENNE",
];

// ── Rôles ayant accès au module Logistique ─────────────────
const LOGISTIQUE_ROLES = [
  "ROLE_RESPONSABLE_LOGISTIQUE",
  "ROLE_RAF",
  "ROLE_SE",
  "ROLE_ADMIN",
];

// ── Items de navigation (avec rôles restreints) ────────────
const ALL_NAV_ITEMS = [
  { label: "Dashboard",   path: "/",          icon: LayoutDashboard, exact: true },
  { label: "Projets",     path: "/projets",    icon: FolderKanban },
  { label: "Activités",   path: "/activites",  icon: CheckSquare },
  {
    label: "Finances", path: "/finances", icon: Wallet,
    roles: ["ROLE_RAF", "ROLE_SE", "ROLE_ADMIN", "ROLE_COMPTABLE", "ROLE_RESPONSABLE_PROGRAMMES"],
  },
  {
    label: "Suivi-Éval", path: "/se", icon: BarChart3,
    roles: ["ROLE_SE", "ROLE_ADMIN", "ROLE_RESPONSABLE_SE", "ROLE_CHARGE_PROGRAMME",
            "ROLE_TECHNICIEN_TERRAIN", "ROLE_RESPONSABLE_PROGRAMMES"],
  },
  { label: "Documents",   path: "/documents",  icon: FileArchive },
];

const adminNavItems = [
  { label: "Utilisateurs", path: "/admin/utilisateurs", icon: UserCog },
  { label: "Employés sans compte", path: "/admin/sans-compte", icon: UserPlus },
];

const secretariatNavItems = [
  {
    label: "Tableau de bord",
    path: "/secretariat",
    icon: LayoutDashboard,
    exact: true,
  },
  { label: "Validations", path: "/secretariat/validations", icon: Clock },
  { label: "Alertes", path: "/secretariat/alertes", icon: AlertTriangle },
  { label: "Rapports", path: "/secretariat/rapports", icon: FileText },
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
// Vue COMPTABLE : dashboard + saisie + budgets (lecture)
const financesNavItemsComptable = [
  { label: "Tableau de bord", path: "/finances/tableau-de-bord", icon: LayoutDashboard },
  { label: "Mes dépenses", path: "/finances/depenses", icon: Receipt },
  { label: "Budgets", path: "/finances/budgets", icon: PieChart },
];

// Vue RAF/SE/Admin : dashboard + dépenses + budgets
const financesNavItemsFull = [
  { label: "Tableau de bord", path: "/finances/tableau-de-bord", icon: LayoutDashboard },
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
  { label: "Données terrain", path: "/se/donnees", icon: Database },
  { label: "Documents", path: "/se/documents", icon: FileText },
];

// ── Items de navigation GED ────────────────────────────────
const gedNavItems = [
  { label: "Tous les documents", path: "/documents", icon: FileText, exact: true },
  { label: "File de validation",  path: "/documents/validation", icon: ClipboardCheck, roleRequired: "ROLE_SE" },
];

// ── Items de navigation Terrain ───────────────────────────
const terrainNavItems = [
  { label: "Tableau de bord", path: "/terrain",           icon: LayoutDashboard, exact: true },
  { label: "Collecte de données", path: "/terrain/collecte", icon: ClipboardList },
  { label: "Mes rapports",    path: "/terrain/rapports",  icon: FileText },
];

// ── Items de navigation Logistique ────────────────────────
const logistiqueNavItems = [
  { label: "Tableau de bord", path: "/logistique", icon: LayoutDashboard, exact: true },
  { label: "Inventaire", path: "/logistique/inventaire", icon: Box },
  { label: "Véhicules", path: "/logistique/vehicules", icon: Truck },
  { label: "Mouvements", path: "/logistique/mouvements", icon: ClipboardList },
];

// ── Items de navigation RP ──────────────────────────────
const rpNavItems = [
  { label: "Projets",      path: "/rp/projets",            icon: FolderKanban },
  { label: "Activités",    path: "/rp/activites",          icon: CheckSquare },
  { label: "Budgets",      path: "/rp/budgets",            icon: PieChart },
  { label: "Suivi-Éval",   path: "/rp/se/tableau-de-bord", icon: BarChart3 },
  { label: "Équipe",       path: "/rp/employes",           icon: Users },
  { label: "Documents",    path: "/rp/documents",          icon: FileArchive },
];

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
  showSecretariatItem,
  showLogistiqueItem,
  rafBadgeCount,
  secretariatBadgeCount,
  alertesBadgeCount,
  onLogout,
}) {
  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
      isActive
        ? "bg-primary text-white"
        : "text-gray-400 hover:bg-black-light hover:text-white"
    }`;

  const userRoles = user?.roles ?? [];
  const visibleNavItems = ALL_NAV_ITEMS.filter(
    ({ roles }) => !roles || roles.some((r) => userRoles.includes(r))
  );

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
        {visibleNavItems.map(({ label, path, icon: Icon, exact }) => (
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

        {/* Espace RH — visible pour ROLE_RH, ROLE_SE, ROLE_RESPONSABLE_PROGRAMMES */}
        {showRHItem && (
          <NavLink to="/rh/tableau-de-bord" className={navLinkClass}>
            <ClipboardList size={18} />
            <span className="flex-1">Espace RH</span>
          </NavLink>
        )}

        {/* Module Logistique — visible pour ROLE_RESPONSABLE_LOGISTIQUE et superviseurs */}
        {showLogistiqueItem && (
          <NavLink to="/logistique" className={navLinkClass}>
            <Truck size={18} />
            <span className="flex-1">Logistique</span>
          </NavLink>
        )}

        {/* Espace Direction — visible uniquement pour ROLE_SE */}
        {showSecretariatItem && (
          <NavLink to="/secretariat" className={navLinkClass}>
            <Building2 size={18} />
            <span className="flex-1">Espace Direction</span>
            {(secretariatBadgeCount > 0 || alertesBadgeCount > 0) && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-500 px-1 text-[10px] font-bold text-white leading-none">
                {secretariatBadgeCount + alertesBadgeCount}
              </span>
            )}
          </NavLink>
        )}

        {/* Section Administration — visible uniquement pour ROLE_ADMIN */}
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

// ── Section déroulante RAF ─────────────────────────────────
function RAFSection({ label, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-1 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-500 hover:text-gray-300 transition-colors"
      >
        <span className="flex-1 text-left">{label}</span>
        <ChevronDown
          size={12}
          className={`transition-transform duration-200 ${open ? "rotate-0" : "-rotate-90"}`}
        />
      </button>
      {open && <div className="space-y-0.5">{children}</div>}
    </div>
  );
}

// ── Navigation RAF (séparée pour utiliser useState) ─────────
function RAFNav({ navLinkClass, depensesCount, alertesCritiques }) {
  return (
    <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
      {/* Dashboard */}
      <NavLink to="/raf/tableau-de-bord" className={navLinkClass}>
        <LayoutDashboard size={18} />
        <span className="flex-1">Dashboard</span>
        {alertesCritiques > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white leading-none">
            <AlertTriangle size={9} />
          </span>
        )}
      </NavLink>

      {/* ── Gestion financière ── */}
      <RAFSection label="Gestion financière">
        <NavLink to="/raf/validation-depenses" className={navLinkClass}>
          <ClipboardCheck size={18} />
          <span className="flex-1">Validation dépenses</span>
          {depensesCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white leading-none">
              {depensesCount}
            </span>
          )}
        </NavLink>
        <NavLink to="/raf/budgets" className={navLinkClass}>
          <BarChart2 size={18} />
          <span className="flex-1">Budgets</span>
        </NavLink>
        <NavLink to="/raf/tresorerie" className={navLinkClass}>
          <Landmark size={18} />
          <span className="flex-1">Trésorerie</span>
        </NavLink>
        <NavLink to="/raf/missions" className={navLinkClass}>
          <MapPin size={18} />
          <span className="flex-1">Missions</span>
        </NavLink>
        <NavLink to="/raf/acquisitions" className={navLinkClass}>
          <Package size={18} />
          <span className="flex-1">Acquisitions</span>
        </NavLink>
        <NavLink to="/raf/rapports" className={navLinkClass}>
          <FileText size={18} />
          <span className="flex-1">Rapports</span>
        </NavLink>
      </RAFSection>

      {/* ── Gestion RH ── */}
      <RAFSection label="Gestion RH">
        <NavLink to="/rh/employes" className={navLinkClass}>
          <Users size={18} />
          <span className="flex-1">Employés</span>
        </NavLink>
        <NavLink to="/rh/conges" className={navLinkClass}>
          <Calendar size={18} />
          <span className="flex-1">Congés</span>
        </NavLink>
      </RAFSection>

      {/* ── Autres modules ── */}
      <RAFSection label="Autres modules" defaultOpen={false}>
        <NavLink to="/projets" className={navLinkClass}>
          <FolderKanban size={18} />
          <span className="flex-1">Projets</span>
        </NavLink>
        <NavLink to="/se/tableau-de-bord" className={navLinkClass}>
          <BarChart3 size={18} />
          <span className="flex-1">Suivi-Éval</span>
        </NavLink>
        <NavLink to="/logistique" className={navLinkClass}>
          <Truck size={18} />
          <span className="flex-1">Logistique</span>
        </NavLink>
        <NavLink to="/documents" className={navLinkClass}>
          <FileArchive size={18} />
          <span className="flex-1">Documents</span>
        </NavLink>
      </RAFSection>
    </nav>
  );
}

// ── Sidebar RAF (unifiée) ───────────────────────────────────
function RAFSidebar({
  user,
  depensesCount,
  alertesCritiques,
  onLogout,
  onBack,
  userRoles,
}) {
  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
      isActive
        ? "bg-primary text-white"
        : "text-gray-400 hover:bg-black-light hover:text-white"
    }`;

  const isPureRAF =
    userRoles?.includes("ROLE_RAF") &&
    !userRoles?.includes("ROLE_SE") &&
    !userRoles?.includes("ROLE_ADMIN");

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

      {/* Bouton Retour — visible uniquement pour ROLE_SE visitant l'espace RAF */}
      {!isPureRAF && (
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

      {/* Navigation unifiée RAF */}
      <RAFNav
        navLinkClass={navLinkClass}
        depensesCount={depensesCount}
        alertesCritiques={alertesCritiques}
      />

      <UserFooter user={user} onLogout={onLogout} />
    </div>
  );
}

// ── Sidebar RH ─────────────────────────────────────────────
function RHSidebar({ user, onLogout, onBack, userRoles }) {
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
      {!userRoles?.includes("ROLE_RH") && (
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
        {(userRoles?.includes("ROLE_RESPONSABLE_PROGRAMMES") &&
        !userRoles?.includes("ROLE_RH") &&
        !userRoles?.includes("ROLE_SE") &&
        !userRoles?.includes("ROLE_ADMIN")
          ? rhNavItemsRP
          : rhNavItemsFull
        ).map(({ label, path, icon: Icon }) => (
          <NavLink key={path} to={path} className={navLinkClass}>
            <Icon size={18} />
            <span className="flex-1">{label}</span>
          </NavLink>
        ))}

        {/* Accès documents */}
        <div className="mx-0 mt-3 mb-1 border-t border-black-light" />
        <p className="px-1 py-1 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
          Autres
        </p>
        <NavLink to="/mes-documents" className={navLinkClass}>
          <FileArchive size={18} />
          <span className="flex-1">Documents</span>
        </NavLink>
      </nav>

      <UserFooter user={user} onLogout={onLogout} />
    </div>
  );
}

// ── Sidebar Finances ───────────────────────────────────────
function FinancesSidebar({ user, onLogout, onBack, userRoles }) {
  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
      isActive
        ? "bg-primary text-white"
        : "text-gray-400 hover:bg-black-light hover:text-white"
    }`;

  const isPureComptable =
    userRoles?.includes("ROLE_COMPTABLE") &&
    !userRoles?.includes("ROLE_RAF") &&
    !userRoles?.includes("ROLE_SE") &&
    !userRoles?.includes("ROLE_ADMIN");

  const isRP =
    userRoles?.includes("ROLE_RESPONSABLE_PROGRAMMES") &&
    !userRoles?.includes("ROLE_RAF") &&
    !userRoles?.includes("ROLE_SE") &&
    !userRoles?.includes("ROLE_ADMIN") &&
    !userRoles?.includes("ROLE_COMPTABLE");

  const navItems = isPureComptable
    ? financesNavItemsComptable
    : isRP
      ? financesNavItemsRP
      : financesNavItemsFull;

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

      {/* Bouton Retour — masqué pour le COMPTABLE pur */}
      {!isPureComptable && (
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

      {/* Navigation Finances */}
      <nav className="flex-1 overflow-y-auto py-2 px-3 space-y-1">
        {navItems.map(({ label, path, icon: Icon }) => (
          <NavLink key={path} to={path} end={path === "/finances/depenses"} className={navLinkClass}>
            <Icon size={18} />
            <span className="flex-1">{label}</span>
          </NavLink>
        ))}

        {/* Accès documents */}
        <div className="mx-0 mt-3 mb-1 border-t border-black-light" />
        <NavLink to="/finances/documents" className={navLinkClass}>
          <FileArchive size={18} />
          <span className="flex-1">Documents</span>
        </NavLink>
      </nav>

      <UserFooter user={user} onLogout={onLogout} />
    </div>
  );
}

// ── Sidebar S&E ────────────────────────────────────────────
function SESidebar({ user, onLogout, onBack, userRoles, isPureSE }) {
  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
      isActive
        ? "bg-primary text-white"
        : "text-gray-400 hover:bg-black-light hover:text-white"
    }`;

  // Technicien terrain ne voit rien dans la sidebar (il est redirigé vers /se/collecte)
  const isTT = userRoles?.includes("ROLE_TECHNICIEN_TERRAIN");
  const isRP =
    userRoles?.includes("ROLE_RESPONSABLE_PROGRAMMES") &&
    !userRoles?.includes("ROLE_SE") &&
    !userRoles?.includes("ROLE_ADMIN") &&
    !userRoles?.includes("ROLE_RESPONSABLE_SE");

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

      {/* Bouton Retour — masqué pour les utilisateurs dont /se est l'espace d'accueil */}
      {!isPureSE && (
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

  const isSE =
    userRoles?.includes("ROLE_SE") || userRoles?.includes("ROLE_ADMIN");

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
            Gestion Documentaire
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

      {/* Navigation GED */}
      <nav className="flex-1 overflow-y-auto py-2 px-3 space-y-1">
        {gedNavItems.map(({ label, path, icon: Icon, exact, roleRequired }) => {
          if (roleRequired && !userRoles?.includes(roleRequired)) return null;
          const isValidation = path === "/documents/validation";
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

// ── Sidebar Responsable des Programmes ─────────────────────
function RPSidebar({ user, onLogout }) {
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
          <p className="text-[11px] text-teal-400 leading-tight">
            Responsable Programmes
          </p>
        </div>
      </div>

      <div className="mx-3 mt-3 mb-1 border-t border-black-light shrink-0" />

      {/* Navigation RP */}
      <nav className="flex-1 overflow-y-auto py-2 px-3 space-y-1">
        {rpNavItems.map(({ label, path, icon: Icon }) => (
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

// ── Sidebar Administration ──────────────────────────────────
function AdminSidebar({ user, onLogout, sansCompteCount }) {
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
          <p className="text-[11px] text-orange-400 leading-tight">
            Administration
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <NavLink to="/admin/utilisateurs" className={navLinkClass}>
          <UserCog size={18} />
          <span className="flex-1">Utilisateurs</span>
        </NavLink>
        <NavLink to="/admin/sans-compte" className={navLinkClass}>
          <UserPlus size={18} />
          <span className="flex-1">Employés sans compte</span>
          {sansCompteCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white leading-none">
              {sansCompteCount}
            </span>
          )}
        </NavLink>
      </nav>

      <UserFooter user={user} onLogout={onLogout} />
    </div>
  );
}

// ── Sidebar Secrétariat Exécutif ───────────────────────────
function SecretariatSidebar({
  user,
  onLogout,
  onBack,
  validationsCount,
  alertesCount,
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
          <p className="text-[11px] text-indigo-400 leading-tight">
            Secrétariat Exécutif
          </p>
        </div>
      </div>

      <div className="mx-3 mt-3 mb-1 border-t border-black-light shrink-0" />

      {/* Navigation Secrétariat */}
      <nav className="flex-1 overflow-y-auto py-2 px-3 space-y-1">
        {secretariatNavItems.map(({ label, path, icon: Icon, exact }) => {
          const isValidations = path === "/secretariat/validations";
          const isAlertes = path === "/secretariat/alertes";

          return (
            <NavLink key={path} to={path} end={exact} className={navLinkClass}>
              <Icon size={18} />
              <span className="flex-1">{label}</span>
              {isValidations && validationsCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-violet-500 px-1 text-[10px] font-bold text-white leading-none">
                  {validationsCount}
                </span>
              )}
              {isAlertes && alertesCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white leading-none">
                  {alertesCount}
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

// ── Sidebar Terrain ────────────────────────────────────────
function TerrainSidebar({ user, onLogout }) {
  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
      isActive
        ? "bg-primary text-white"
        : "text-gray-400 hover:bg-black-light hover:text-white"
    }`;

  const isAntenne = user?.roles?.includes("ROLE_ANTENNE");

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
          <p className="text-[11px] text-lime-400 leading-tight">
            {isAntenne ? "Antenne Terrain" : "Agent Terrain"}
          </p>
        </div>
      </div>

      <div className="mx-3 mt-3 mb-1 border-t border-black-light shrink-0" />

      {/* Navigation Terrain */}
      <nav className="flex-1 overflow-y-auto py-2 px-3 space-y-1">
        {terrainNavItems.map(({ label, path, icon: Icon, exact }) => (
          <NavLink key={path} to={path} end={exact} className={navLinkClass}>
            <Icon size={18} />
            <span className="flex-1">{label}</span>
          </NavLink>
        ))}

        {/* Documents perso */}
        <div className="mx-0 mt-3 mb-1 border-t border-black-light" />
        <NavLink to="/mes-documents" className={navLinkClass}>
          <FileArchive size={18} />
          <span className="flex-1">Mes documents</span>
        </NavLink>
      </nav>

      <UserFooter user={user} onLogout={onLogout} />
    </div>
  );
}

// ── Sidebar Logistique ─────────────────────────────────────
function LogistiqueSidebar({ user, onLogout, onBack, userRoles }) {
  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
      isActive
        ? "bg-primary text-white"
        : "text-gray-400 hover:bg-black-light hover:text-white"
    }`;

  const isPure =
    userRoles?.includes("ROLE_RESPONSABLE_LOGISTIQUE") &&
    !userRoles?.includes("ROLE_RAF") &&
    !userRoles?.includes("ROLE_SE") &&
    !userRoles?.includes("ROLE_ADMIN");

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
          <p className="text-[11px] text-yellow-400 leading-tight">Logistique</p>
        </div>
      </div>

      {/* Bouton Retour — masqué pour le responsable logistique pur */}
      {!isPure && (
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

      {/* Navigation Logistique */}
      <nav className="flex-1 overflow-y-auto py-2 px-3 space-y-1">
        {logistiqueNavItems.map(({ label, path, icon: Icon, exact }) => (
          <NavLink key={path} to={path} end={exact} className={navLinkClass}>
            <Icon size={18} />
            <span className="flex-1">{label}</span>
          </NavLink>
        ))}
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
  const isAdminSpace = location.pathname.startsWith("/admin");
  const isSecretariatSpace = location.pathname.startsWith("/secretariat");
  const isRPSpace = location.pathname.startsWith("/rp");
  const isLogistiqueSpace = location.pathname.startsWith("/logistique");
  const isTerrainSpace = location.pathname.startsWith("/terrain");

  const isAdmin = user?.roles?.includes("ROLE_ADMIN");
  const showRAFItem = user?.roles?.some((r) => RAF_ROLES.includes(r));
  const showLogistiqueItem = user?.roles?.some((r) => LOGISTIQUE_ROLES.includes(r));

  // Terrain pur : la sidebar Terrain reste affichée (TT n'a accès qu'à /terrain)
  const isPureTerrain = user?.roles?.some((r) => TERRAIN_ROLES.includes(r)) &&
    !user?.roles?.includes("ROLE_SE") &&
    !user?.roles?.includes("ROLE_RAF") &&
    !user?.roles?.includes("ROLE_ADMIN") &&
    !user?.roles?.includes("ROLE_RESPONSABLE_SE");
  const showTerrainSidebar = isPureTerrain ? true : isTerrainSpace;

  // RAF pur : la sidebar RAF reste affichée sur tous les modules qu'il visite
  const isPureRAF =
    user?.roles?.includes("ROLE_RAF") &&
    !user?.roles?.includes("ROLE_SE") &&
    !user?.roles?.includes("ROLE_ADMIN");
  const showRAFSidebar = isPureRAF
    ? !isAdminSpace && !isSecretariatSpace && !isLogistiqueSpace
    : isRAFSpace;

  // Logistique pur
  const isPureLogistique =
    user?.roles?.includes("ROLE_RESPONSABLE_LOGISTIQUE") &&
    !user?.roles?.includes("ROLE_RAF") &&
    !user?.roles?.includes("ROLE_SE") &&
    !user?.roles?.includes("ROLE_ADMIN");
  const showLogistiqueSidebar = isPureLogistique
    ? !isAdminSpace && !isSecretariatSpace
    : isLogistiqueSpace;

  // S&E pur (Responsable SE ou Chargé de programme sans rôle SE/Admin/RAF)
  const isPureSE =
    (user?.roles?.includes("ROLE_RESPONSABLE_SE") ||
      user?.roles?.includes("ROLE_CHARGE_PROGRAMME")) &&
    !user?.roles?.includes("ROLE_SE") &&
    !user?.roles?.includes("ROLE_ADMIN") &&
    !user?.roles?.includes("ROLE_RAF");
  const showSESidebar = isPureSE
    ? !isAdminSpace && !isSecretariatSpace
    : isSESpace && !isPureRAF;

  // RH pur : la sidebar RH reste affichée sur tous les modules qu'il visite
  const isPureRH =
    user?.roles?.includes("ROLE_RH") &&
    !user?.roles?.includes("ROLE_SE") &&
    !user?.roles?.includes("ROLE_ADMIN") &&
    !user?.roles?.includes("ROLE_RAF");
  const showRHSidebar = isPureRH
    ? !isAdminSpace && !isSecretariatSpace && !showRAFSidebar
    : isRHSpace && !isPureRAF && !isPureSE;

  // ROLE_ADMIN retiré — admin n'accède plus au module RH
  const showRHItem = user?.roles?.some((r) =>
    ["ROLE_RH", "ROLE_SE", "ROLE_RESPONSABLE_PROGRAMMES"].includes(r),
  );
  const showSecretariatItem = user?.roles?.includes("ROLE_SE");

  const handleLogout = () => {
    logout();
    navigate("/login");
  };
  const handleBack = () => navigate("/");

  // Badges (activés si RAF/SE ou si on est déjà dans l'espace RAF)
  const enableBadges = isRAFSpace || showRAFItem;
  const enableGEDBadges = isGEDSpace;
  const enableSecretariatBadges = showSecretariatItem;
  const enableAdminBadges = isAdmin;

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
    enabled: showRAFSidebar,
  });

  const alertesCritiques = alertes.filter((a) =>
    ["CRITIQUE", "DANGER"].includes(a.niveau),
  ).length;

  const isSERole = user?.roles?.includes("ROLE_SE") || user?.roles?.includes("ROLE_ADMIN");
  const { data: gedEnValidation = [] } = useQuery({
    queryKey: ["documents", "en-validation"],
    queryFn: () => api.get("/api/documents/en-validation").then((r) => r.data),
    staleTime: 60_000,
    refetchInterval: 60_000,
    enabled: enableGEDBadges && isSERole,
  });
  const gedValidationCount = gedEnValidation.length;

  // Badges Secrétariat
  const { data: secretariatValidations = [] } = useQuery({
    queryKey: ["secretariat", "validations"],
    queryFn: async () => {
      const { secretariatApi } = await import("@/api/secretariat.api");
      return secretariatApi.getValidations();
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
    enabled: enableSecretariatBadges,
  });
  const { data: secretariatAlertes = [] } = useQuery({
    queryKey: ["secretariat", "alertes", "non-lues"],
    queryFn: async () => {
      const { secretariatApi } = await import("@/api/secretariat.api");
      return secretariatApi.getAlertesNonLues();
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
    enabled: enableSecretariatBadges,
  });
  const secretariatValidationsCount = secretariatValidations.length;
  const secretariatAlertesCount = secretariatAlertes.length;

  // Badge Admin (employés sans compte)
  const { data: sansCompteCount = 0 } = useQuery({
    queryKey: ["admin", "sans-compte-count"],
    queryFn: async () => {
      const adminApi = (await import("@/api/admin.api")).default;
      return adminApi.getEmployesSansCompte().length;
    },
    staleTime: 60_000,
    enabled: enableAdminBadges,
  });

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ── Sidebar contextuelle (rendu exclusif) ───────────── */}
      <aside className="w-64 shrink-0 overflow-hidden bg-black-fodde text-white">
        {showTerrainSidebar ? (
          <TerrainSidebar
            user={user}
            onLogout={handleLogout}
          />
        ) : isRPSpace ? (
          <RPSidebar
            user={user}
            onLogout={handleLogout}
          />
        ) : showLogistiqueSidebar ? (
          <LogistiqueSidebar
            user={user}
            userRoles={user?.roles}
            onLogout={handleLogout}
            onBack={handleBack}
          />
        ) : isSecretariatSpace ? (
          <SecretariatSidebar
            user={user}
            onLogout={handleLogout}
            onBack={handleBack}
            validationsCount={secretariatValidationsCount}
            alertesCount={secretariatAlertesCount}
          />
        ) : showRAFSidebar ? (
          <RAFSidebar
            user={user}
            userRoles={user?.roles}
            depensesCount={depensesCount}
            alertesCritiques={alertesCritiques}
            onLogout={handleLogout}
            onBack={handleBack}
          />
        ) : showRHSidebar ? (
          <RHSidebar
            user={user}
            userRoles={user?.roles}
            onLogout={handleLogout}
            onBack={handleBack}
          />
        ) : isFinancesSpace ? (
          <FinancesSidebar
            user={user}
            userRoles={user?.roles}
            onLogout={handleLogout}
            onBack={handleBack}
          />
        ) : showSESidebar ? (
          <SESidebar
            user={user}
            userRoles={user?.roles}
            isPureSE={isPureSE}
            onLogout={handleLogout}
            onBack={handleBack}
          />
        ) : isGEDSpace && !isPureRAF ? (
          <GEDSidebar
            user={user}
            userRoles={user?.roles}
            onLogout={handleLogout}
            onBack={handleBack}
            validationCount={gedValidationCount}
          />
        ) : isAdminSpace ? (
          <AdminSidebar
            user={user}
            onLogout={handleLogout}
            sansCompteCount={sansCompteCount}
          />
        ) : (
          <MainSidebar
            user={user}
            isAdmin={isAdmin}
            showRAFItem={showRAFItem}
            showRHItem={showRHItem}
            showSecretariatItem={showSecretariatItem}
            showLogistiqueItem={showLogistiqueItem}
            rafBadgeCount={depensesCount}
            secretariatBadgeCount={secretariatValidationsCount}
            alertesBadgeCount={secretariatAlertesCount}
            onLogout={handleLogout}
          />
        )}
      </aside>

      {/* ── Contenu principal ──────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 shadow-sm shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">
            {isAdminSpace
              ? "Administration"
              : showTerrainSidebar
                ? "Espace Terrain"
                : isRPSpace
                  ? "Espace Programmes"
                  : isSecretariatSpace
                  ? "Espace Direction"
                  : showLogistiqueSidebar
                  ? "Logistique"
                  : showRAFSidebar
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
          className={`flex-1 bg-gray-50 ${isRAFSpace || isRHSpace || isFinancesSpace || isSESpace || isGEDSpace || isAdminSpace || isSecretariatSpace || isRPSpace || isLogistiqueSpace || isTerrainSpace ? "overflow-hidden" : "overflow-y-auto p-6"}`}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
