import {
  Banknote,
  Briefcase,
  CalendarDays,
  CheckSquare,
  ClipboardCheck,
  ClipboardList,
  Database,
  FileArchive,
  FileCheck,
  FileText,
  FolderKanban,
  Home,
  Landmark,
  MapPin,
  Package,
  PieChart,
  Receipt,
  Star,
  Target,
  Truck,
  TriangleAlert,
  UserCog,
  UserPlus,
  Users,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Menu unique de l'application.
// Organisé par sujet (et non par rôle) : chaque entrée liste les rôles qui la
// voient. Les mêmes listes protègent les routes (voir routes/index.jsx), donc
// un rôle ne peut ouvrir que ce que son menu affiche.
// ─────────────────────────────────────────────────────────────────────────────

export const R = {
  ADMIN: "ROLE_ADMIN",
  SE: "ROLE_SE",
  RAF: "ROLE_RAF",
  COMPTABLE: "ROLE_COMPTABLE",
  RH: "ROLE_RH",
  RP: "ROLE_RESPONSABLE_PROGRAMMES",
  CP: "ROLE_CHARGE_PROGRAMME",
  RSE: "ROLE_RESPONSABLE_SE",
  LOG: "ROLE_RESPONSABLE_LOGISTIQUE",
  TT: "ROLE_TECHNICIEN_TERRAIN",
  ANTENNE: "ROLE_ANTENNE",
  COM: "ROLE_CHARGE_COMMUNICATION",
};

/** Groupes de rôles réutilisés par le menu et les routes. */
export const ACCES = {
  projets: [R.SE, R.RAF, R.RP, R.CP, R.RSE],
  depenses: [R.COMPTABLE, R.RAF, R.SE],
  saisieDepenses: [R.COMPTABLE, R.RAF],
  budgetsProjets: [R.COMPTABLE, R.RAF, R.SE, R.RP],
  budgetAnnuel: [R.RAF, R.SE],
  conges: [R.RH, R.RAF, R.SE],
  rapportsFinanciers: [R.RAF, R.SE],
  rh: [R.RH, R.SE],
  employes: [R.RH, R.SE, R.RAF, R.RP],
  suiviEvaluation: [R.RSE, R.CP, R.RP, R.SE, R.RAF],
  validationSE: [R.RSE, R.CP, R.SE],
  direction: [R.SE],
  validationDocuments: [R.SE],
  logistique: [R.LOG, R.RAF, R.SE, R.ADMIN],
  terrain: [R.TT, R.ANTENNE, R.RSE, R.SE],
  administration: [R.ADMIN],
};

export const NAVIGATION = [
  {
    items: [{ label: "Accueil", path: "/", icon: Home, exact: true }],
  },
  {
    titre: "Direction",
    items: [
      { label: "Validations", path: "/secretariat/validations", icon: FileCheck, roles: ACCES.direction },
      { label: "Rapports reçus", path: "/secretariat/rapports", icon: FileText, roles: ACCES.direction },
    ],
  },
  {
    titre: "Projets",
    items: [
      { label: "Projets", path: "/projets", icon: FolderKanban, roles: ACCES.projets },
      { label: "Activités", path: "/activites", icon: CheckSquare, roles: ACCES.projets },
    ],
  },
  {
    titre: "Demandes",
    items: [
      { label: "Dépenses", path: "/finances/depenses", icon: Receipt, roles: ACCES.depenses },
      { label: "Missions", path: "/missions", icon: MapPin },
      { label: "Acquisitions", path: "/acquisitions", icon: Package },
      { label: "Congés", path: "/conges", icon: CalendarDays, roles: ACCES.conges },
    ],
  },
  {
    titre: "Finances",
    items: [
      { label: "Budgets des projets", path: "/finances/budgets", icon: PieChart, roles: ACCES.budgetsProjets },
      { label: "Budget annuel", path: "/raf/budgets", icon: Landmark, roles: ACCES.budgetAnnuel },
      { label: "Rapports financiers", path: "/raf/rapports", icon: Banknote, roles: ACCES.rapportsFinanciers },
    ],
  },
  {
    titre: "Ressources humaines",
    items: [
      { label: "Employés", path: "/rh/employes", icon: Users, roles: ACCES.employes },
      { label: "Évaluations", path: "/rh/evaluations", icon: Star, roles: ACCES.rh },
      { label: "Alertes RH", path: "/rh/alertes", icon: TriangleAlert, roles: ACCES.rh },
    ],
  },
  {
    titre: "Suivi-évaluation",
    items: [
      { label: "Indicateurs", path: "/se/indicateurs", icon: Target, roles: ACCES.suiviEvaluation },
      { label: "Formulaires", path: "/se/formulaires", icon: ClipboardList, roles: ACCES.suiviEvaluation },
      { label: "Validation des données", path: "/se/validation", icon: ClipboardCheck, roles: ACCES.validationSE },
      { label: "Données collectées", path: "/se/donnees", icon: Database, roles: ACCES.suiviEvaluation },
      { label: "Collecte terrain", path: "/terrain", icon: Briefcase, roles: ACCES.terrain },
    ],
  },
  {
    titre: "Documents",
    items: [
      { label: "Documents", path: "/documents", icon: FileArchive, exact: true },
      { label: "Documents à valider", path: "/documents/validation", icon: FileCheck, roles: ACCES.validationDocuments },
    ],
  },
  {
    titre: "Logistique",
    items: [{ label: "Logistique", path: "/logistique", icon: Truck, roles: ACCES.logistique }],
  },
  {
    titre: "Administration",
    items: [
      { label: "Utilisateurs", path: "/admin/utilisateurs", icon: UserCog, roles: ACCES.administration },
      { label: "Employés sans compte", path: "/admin/sans-compte", icon: UserPlus, roles: ACCES.administration },
    ],
  },
];

/** Vrai si l'utilisateur possède au moins un des rôles (ou si aucun rôle n'est exigé). */
export function aAcces(userRoles = [], roles) {
  if (!roles || roles.length === 0) return true;
  return userRoles.some((r) => roles.includes(r));
}

/** Menu filtré pour un utilisateur : sections vides retirées. */
export function menuPour(userRoles = []) {
  return NAVIGATION.map((section) => ({
    ...section,
    items: section.items.filter((item) => aAcces(userRoles, item.roles)),
  })).filter((section) => section.items.length > 0);
}

/** Libellé de la page courante (entrée de menu la plus précise qui correspond). */
export function titrePage(pathname) {
  let meilleur = null;
  for (const section of NAVIGATION) {
    for (const item of section.items) {
      const correspond =
        item.path === "/" ? pathname === "/" : pathname === item.path || pathname.startsWith(item.path + "/");
      if (correspond && (!meilleur || item.path.length > meilleur.path.length)) meilleur = item;
    }
  }
  return meilleur?.label ?? "";
}

/** Libellés lisibles des rôles (affichés sous le nom de l'utilisateur). */
export const LIBELLES_ROLES = {
  ROLE_ADMIN: "Administrateur",
  ROLE_SE: "Secrétaire exécutif",
  ROLE_RAF: "Responsable administratif et financier",
  ROLE_COMPTABLE: "Comptable",
  ROLE_RH: "Ressources humaines",
  ROLE_RESPONSABLE_PROGRAMMES: "Responsable des programmes",
  ROLE_CHARGE_PROGRAMME: "Chargé de programme",
  ROLE_RESPONSABLE_SE: "Responsable suivi-évaluation",
  ROLE_RESPONSABLE_LOGISTIQUE: "Responsable logistique",
  ROLE_TECHNICIEN_TERRAIN: "Technicien terrain",
  ROLE_ANTENNE: "Responsable d'antenne",
  ROLE_CHARGE_COMMUNICATION: "Chargé de communication",
};
