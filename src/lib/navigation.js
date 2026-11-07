import {
  Handshake,
  CalendarDays,
  CheckSquare,
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
  rh: [R.RH, R.SE],
  employes: [R.RH, R.SE, R.RAF, R.RP],
  suiviEvaluation: [R.RSE, R.CP, R.RP, R.SE, R.RAF],
  direction: [R.SE],
  validationDocuments: [R.SE],
  logistique: [R.LOG, R.RAF, R.SE, R.ADMIN],
  saisieLogistique: [R.LOG, R.ADMIN],
  administration: [R.ADMIN],
};

// ─────────────────────────────────────────────────────────────────────────────
// Ce que chaque métier voit dans son menu : seulement ce dont il a besoin au
// quotidien. C'est plus étroit que les droits d'accès (ACCES) : une page hors
// menu reste ouverte depuis un lien (accueil, fiche…) si le rôle y a droit.
// `menu` absent = tout le monde ; `menu: []` = personne (module pas prêt).
// ─────────────────────────────────────────────────────────────────────────────
export const MENU = {
  direction: [R.SE],
  projets: [R.SE, R.RAF, R.RP, R.CP, R.RSE],
  activites: [R.RP, R.CP],
  depenses: [R.COMPTABLE, R.RAF, R.SE],
  budgetsProjets: [R.COMPTABLE, R.RAF, R.SE, R.RP],
  budgetAnnuel: [R.RAF],
  bailleurs: [R.RAF, R.SE],
  employes: [R.RH, R.SE, R.RP],
  rhSeulement: [R.RH],
  indicateurs: [R.RSE, R.CP, R.RP, R.SE],
  documentsAValider: [R.SE],
  administration: [R.ADMIN],
  logistique: [R.LOG, R.RAF, R.SE],
  pasPret: [],
};

export const NAVIGATION = [
  {
    items: [{ label: "Accueil", path: "/", icon: Home, exact: true }],
  },
  {
    titre: "Direction",
    items: [
      { label: "Validations", path: "/secretariat/validations", icon: FileCheck, menu: MENU.direction },
      { label: "Rapports reçus", path: "/secretariat/rapports", icon: FileText, menu: MENU.direction },
    ],
  },
  {
    titre: "Demandes",
    items: [
      { label: "Dépenses", path: "/finances/depenses", icon: Receipt, menu: MENU.depenses },
      { label: "Missions", path: "/missions", icon: MapPin },
      { label: "Acquisitions", path: "/acquisitions", icon: Package },
      { label: "Congés", path: "/conges", icon: CalendarDays },
    ],
  },
  {
    titre: "Projets et budgets",
    items: [
      { label: "Projets", path: "/projets", icon: FolderKanban, menu: MENU.projets },
      { label: "Activités", path: "/activites", icon: CheckSquare, menu: MENU.activites },
      { label: "Suivi budgétaire", path: "/finances/budgets", icon: PieChart, menu: MENU.budgetsProjets },
      { label: "Budget annuel", path: "/raf/budgets", icon: Landmark, menu: MENU.budgetAnnuel },
      { label: "Bailleurs", path: "/bailleurs", icon: Handshake, menu: MENU.bailleurs },
      { label: "Trésorerie", path: "/raf/tresorerie", icon: Landmark, menu: MENU.pasPret },
    ],
  },
  {
    titre: "Équipe",
    items: [
      { label: "Employés", path: "/rh/employes", icon: Users, menu: MENU.employes },
      { label: "Évaluations", path: "/rh/evaluations", icon: Star, menu: MENU.rhSeulement },
      { label: "Alertes RH", path: "/rh/alertes", icon: TriangleAlert, menu: MENU.rhSeulement },
    ],
  },
  {
    titre: "Suivi-évaluation",
    items: [
      { label: "Indicateurs", path: "/se/indicateurs", icon: Target, menu: MENU.indicateurs },
    ],
  },
  {
    titre: "Administration",
    items: [
      { label: "Utilisateurs", path: "/admin/utilisateurs", icon: UserCog, menu: MENU.administration },
      { label: "Comptes et fiches", path: "/admin/sans-compte", icon: UserPlus, menu: MENU.administration },
    ],
  },
  {
    items: [
      { label: "Documents", path: "/documents", icon: FileArchive, exact: true },
      { label: "Documents à valider", path: "/documents/validation", icon: FileCheck, menu: MENU.documentsAValider },
      { label: "Logistique", path: "/logistique", icon: Truck, menu: MENU.logistique },
    ],
  },
];

/** Vrai si l'utilisateur possède au moins un des rôles (ou si aucun rôle n'est exigé). */
export function aAcces(userRoles = [], roles) {
  if (!roles || roles.length === 0) return true;
  return userRoles.some((r) => roles.includes(r));
}

/** Vrai si l'entrée doit figurer dans le menu de cet utilisateur. */
const dansMenu = (userRoles, item) => !item.menu || userRoles.some((r) => item.menu.includes(r));

/** Menu de l'utilisateur, selon son métier : sections vides retirées. */
export function menuPour(userRoles = []) {
  return NAVIGATION.map((section) => ({
    ...section,
    items: section.items.filter((item) => dansMenu(userRoles, item)),
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
