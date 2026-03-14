import AdminLayout from "@/components/layout/AdminLayout";
import FinancesLayout from "@/components/layout/FinancesLayout";
import GEDLayout from "@/components/layout/GEDLayout";
import LogistiqueLayout from "@/components/layout/LogistiqueLayout";
import TerrainLayout from "@/components/layout/TerrainLayout";
import MainLayout from "@/components/layout/MainLayout";
import RAFLayout from "@/components/layout/RAFLayout";
import RHLayout from "@/components/layout/RHLayout";
import RPLayout from "@/components/layout/RPLayout";
import SELayout from "@/components/layout/SELayout";
import SecretariatLayout from "@/components/layout/SecretariatLayout";
import ActivitesList from "@/pages/activites/ActivitesList";
import AdminEmployesSansCompte from "@/pages/admin/AdminEmployesSansCompte";
import AdminUserForm from "@/pages/admin/AdminUserForm";
import AdminUsersPage from "@/pages/admin/AdminUsersPage";
import LoginPage from "@/pages/auth/LoginPage";
import DashboardPage from "@/pages/dashboard/DashboardPage";
import BudgetProjetDetail from "@/pages/finances/BudgetProjetDetail";
import BudgetsList from "@/pages/finances/BudgetsList";
import DepenseDetail from "@/pages/finances/DepenseDetail";
import DepensesList from "@/pages/finances/DepensesList";
import FinancesDashboard from "@/pages/finances/FinancesDashboard";
import DocumentDetail from "@/pages/documents/DocumentDetail";
import DocumentsPage from "@/pages/documents/DocumentsPage";
import DocumentValidationPage from "@/pages/documents/DocumentValidationPage";
import ProjetDetail from "@/pages/projets/ProjetDetail";
import ProjetForm from "@/pages/projets/ProjetForm";
import ProjetsList from "@/pages/projets/ProjetsList";
import TerrainCollecte from "@/pages/terrain/TerrainCollecte";
import TerrainDashboard from "@/pages/terrain/TerrainDashboard";
import TerrainRapports from "@/pages/terrain/TerrainRapports";
import LogistiqueDashboard from "@/pages/logistique/LogistiqueDashboard";
import LogistiqueInventaire from "@/pages/logistique/LogistiqueInventaire";
import LogistiqueMouvements from "@/pages/logistique/LogistiqueMouvements";
import LogistiqueVehicules from "@/pages/logistique/LogistiqueVehicules";
import RAFAcquisitions from "@/pages/raf/RAFAcquisitions";
import RAFBudgets from "@/pages/raf/RAFBudgets";
import RAFMissions from "@/pages/raf/RAFMissions";
import RAFRapports from "@/pages/raf/RAFRapports";
import RAFTableauDeBord from "@/pages/raf/RAFTableauDeBord";
import RAFTresorerie from "@/pages/raf/RAFTresorerie";
import RAFValidationDepenses from "@/pages/raf/RAFValidationDepenses";
import RHAlertes from "@/pages/rh/RHAlertes";
import RHConges from "@/pages/rh/RHConges";
import RHEmployeDetail from "@/pages/rh/RHEmployeDetail";
import RHEmployeForm from "@/pages/rh/RHEmployeForm";
import RHEmployesList from "@/pages/rh/RHEmployesList";
import RHEvaluations from "@/pages/rh/RHEvaluations";
import RHTableauDeBord from "@/pages/rh/RHTableauDeBord";
import MesDocumentsPage from "@/pages/shared/MesDocumentsPage";
import SECollecte from "@/pages/se/SECollecte";
import SEFormulaireForm from "@/pages/se/SEFormulaireForm";
import SEFormulairesList from "@/pages/se/SEFormulairesList";
import SEIndicateurDetail from "@/pages/se/SEIndicateurDetail";
import SEIndicateurForm from "@/pages/se/SEIndicateurForm";
import SEIndicateursList from "@/pages/se/SEIndicateursList";
import SEDonnees from "@/pages/se/SEDonnees";
import SETableauDeBord from "@/pages/se/SETableauDeBord";
import SEValidation from "@/pages/se/SEValidation";
import SecretariatAlertes from "@/pages/secretariat/SecretariatAlertes";
import SecretariatDashboard from "@/pages/secretariat/SecretariatDashboard";
import SecretariatRapports from "@/pages/secretariat/SecretariatRapports";
import SecretariatValidations from "@/pages/secretariat/SecretariatValidations";
import useAuthStore from "@/stores/auth.store";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

function PrivateRoute({ children }) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const roles = user?.roles ?? [];

  // Ne rediriger que si on est sur "/" pour éviter les boucles
  if (location.pathname !== "/") return children;

  // ROLE_SE → Secrétariat Exécutif
  if (roles.includes("ROLE_SE") && !roles.includes("ROLE_ADMIN")) {
    return <Navigate to="/secretariat" replace />;
  }

  // ROLE_RESPONSABLE_SE (sans SE ni Admin) → Espace Suivi-Éval
  if (
    roles.includes("ROLE_RESPONSABLE_SE") &&
    !roles.includes("ROLE_SE") &&
    !roles.includes("ROLE_ADMIN")
  ) {
    return <Navigate to="/se/tableau-de-bord" replace />;
  }

  // ROLE_CHARGE_PROGRAMME (sans SE ni Admin ni RP) → Espace Suivi-Éval
  if (
    roles.includes("ROLE_CHARGE_PROGRAMME") &&
    !roles.includes("ROLE_SE") &&
    !roles.includes("ROLE_ADMIN") &&
    !roles.includes("ROLE_RESPONSABLE_PROGRAMMES")
  ) {
    return <Navigate to="/se/tableau-de-bord" replace />;
  }

  // ROLE_RESPONSABLE_PROGRAMMES (sans SE ni Admin) → Espace RP
  if (
    roles.includes("ROLE_RESPONSABLE_PROGRAMMES") &&
    !roles.includes("ROLE_SE") &&
    !roles.includes("ROLE_RAF") &&
    !roles.includes("ROLE_ADMIN")
  ) {
    return <Navigate to="/rp/projets" replace />;
  }

  // ROLE_TECHNICIEN_TERRAIN / ROLE_ANTENNE → Espace Terrain
  if (
    (roles.includes("ROLE_TECHNICIEN_TERRAIN") || roles.includes("ROLE_ANTENNE")) &&
    !roles.includes("ROLE_SE") &&
    !roles.includes("ROLE_RAF") &&
    !roles.includes("ROLE_ADMIN") &&
    !roles.includes("ROLE_RESPONSABLE_SE")
  ) {
    return <Navigate to="/terrain" replace />;
  }

  // ROLE_RESPONSABLE_LOGISTIQUE (sans autre rôle métier) → Logistique
  if (
    roles.includes("ROLE_RESPONSABLE_LOGISTIQUE") &&
    !roles.includes("ROLE_RAF") &&
    !roles.includes("ROLE_SE") &&
    !roles.includes("ROLE_ADMIN")
  ) {
    return <Navigate to="/logistique" replace />;
  }

  // ROLE_RAF (sans SE ni Admin) → Espace RAF
  if (
    roles.includes("ROLE_RAF") &&
    !roles.includes("ROLE_SE") &&
    !roles.includes("ROLE_ADMIN")
  ) {
    return <Navigate to="/raf/tableau-de-bord" replace />;
  }

  // ROLE_COMPTABLE (sans autre rôle) → Finances
  if (
    roles.includes("ROLE_COMPTABLE") &&
    !roles.includes("ROLE_SE") &&
    !roles.includes("ROLE_RAF") &&
    !roles.includes("ROLE_ADMIN")
  ) {
    return <Navigate to="/finances/tableau-de-bord" replace />;
  }

  // ROLE_ADMIN (sans rôle métier) → Administration
  if (
    roles.includes("ROLE_ADMIN") &&
    !roles.includes("ROLE_SE") &&
    !roles.includes("ROLE_RAF") &&
    !roles.includes("ROLE_RH")
  ) {
    return <Navigate to="/admin/utilisateurs" replace />;
  }

  return children;
}

/** Redirige /finances selon le rôle */
function FinancesIndexRedirect() {
  const { user } = useAuthStore();
  const roles = user?.roles ?? [];
  if (roles.includes("ROLE_RESPONSABLE_PROGRAMMES") && !roles.includes("ROLE_COMPTABLE")) {
    return <Navigate to="/finances/budgets" replace />;
  }
  if (roles.includes("ROLE_COMPTABLE")) {
    return <Navigate to="/finances/tableau-de-bord" replace />;
  }
  return <Navigate to="/finances/depenses" replace />;
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <MainLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<DashboardPage />} />

          {/* Module Projets & Programmes */}
          <Route path="projets" element={<ProjetsList />} />
          <Route path="projets/nouveau" element={<ProjetForm />} />
          <Route path="projets/:id" element={<ProjetDetail />} />
          <Route path="projets/:id/edit" element={<ProjetForm />} />

          {/* Autres modules */}
          <Route path="activites" element={<ActivitesList />} />

          {/* ── Page documents simplifiée (COMPTABLE / RH) ─── */}
          <Route path="mes-documents" element={<MesDocumentsPage />} />

          {/* ── Module Administration ────────────────────────── */}
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="utilisateurs" replace />} />
            <Route path="utilisateurs" element={<AdminUsersPage />} />
            <Route path="utilisateurs/nouveau" element={<AdminUserForm />} />
            <Route path="utilisateurs/:id/edit" element={<AdminUserForm />} />
            <Route path="sans-compte" element={<AdminEmployesSansCompte />} />
          </Route>

          {/* ── Module Secrétariat Exécutif ──────────────────── */}
          <Route path="secretariat" element={<SecretariatLayout />}>
            <Route index element={<SecretariatDashboard />} />
            <Route path="validations" element={<SecretariatValidations />} />
            <Route path="alertes" element={<SecretariatAlertes />} />
            <Route path="rapports" element={<SecretariatRapports />} />
            <Route path="documents/:id" element={<DocumentDetail />} />
            {/* Vues internes SE (projets, employes) */}
            <Route path="projets" element={<ProjetsList />} />
            <Route path="projets/:id" element={<ProjetDetail />} />
            <Route path="employes" element={<RHEmployesList />} />
            <Route path="employes/:id" element={<RHEmployeDetail />} />
          </Route>

          {/* ── Module Responsable des Programmes ───────────── */}
          <Route path="rp" element={<RPLayout />}>
            <Route index element={<Navigate to="projets" replace />} />
            {/* Projets */}
            <Route path="projets" element={<ProjetsList />} />
            <Route path="projets/nouveau" element={<ProjetForm />} />
            <Route path="projets/:id" element={<ProjetDetail />} />
            <Route path="projets/:id/edit" element={<ProjetForm />} />
            {/* Activités */}
            <Route path="activites" element={<ActivitesList />} />
            {/* Budgets (lecture) */}
            <Route path="budgets" element={<BudgetsList />} />
            <Route path="budgets/:projet_id" element={<BudgetProjetDetail />} />
            {/* Suivi-Éval */}
            <Route path="se/tableau-de-bord" element={<SETableauDeBord />} />
            <Route path="se/indicateurs" element={<SEIndicateursList />} />
            <Route path="se/indicateurs/:id" element={<SEIndicateurDetail />} />
            <Route path="se/formulaires" element={<SEFormulairesList />} />
            <Route path="se/formulaires/:id" element={<SEFormulaireForm />} />
            {/* Équipe */}
            <Route path="employes" element={<RHEmployesList />} />
            <Route path="employes/:id" element={<RHEmployeDetail />} />
            {/* Documents */}
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="documents/:id" element={<DocumentDetail />} />
          </Route>

          {/* ── Module Documents (GED) ──────────────────────── */}
          <Route path="documents" element={<GEDLayout />}>
            <Route index element={<DocumentsPage />} />
            <Route path="validation" element={<DocumentValidationPage />} />
            <Route path=":id" element={<DocumentDetail />} />
          </Route>

          {/* ── Module S&E ──────────────────────────────────── */}
          <Route path="se" element={<SELayout />}>
            <Route
              index
              element={<Navigate to="/se/tableau-de-bord" replace />}
            />
            <Route path="tableau-de-bord" element={<SETableauDeBord />} />
            <Route path="indicateurs" element={<SEIndicateursList />} />
            <Route path="indicateurs/nouveau" element={<SEIndicateurForm />} />
            <Route path="indicateurs/:id" element={<SEIndicateurDetail />} />
            <Route path="indicateurs/:id/edit" element={<SEIndicateurForm />} />
            <Route path="formulaires" element={<SEFormulairesList />} />
            <Route path="formulaires/nouveau" element={<SEFormulaireForm />} />
            <Route path="formulaires/:id" element={<SEFormulaireForm />} />
            <Route path="collecte/:formulaire_id" element={<SECollecte />} />
            <Route path="validation" element={<SEValidation />} />
            <Route path="donnees" element={<SEDonnees />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="documents/:id" element={<DocumentDetail />} />
          </Route>

          {/* ── Module Finances (Comptabilité) ──────────────── */}
          <Route path="finances" element={<FinancesLayout />}>
            <Route index element={<FinancesIndexRedirect />} />
            <Route path="tableau-de-bord" element={<FinancesDashboard />} />
            <Route path="depenses" element={<DepensesList />} />
            <Route path="depenses/:id" element={<DepenseDetail />} />
            <Route path="budgets" element={<BudgetsList />} />
            <Route path="budgets/:projet_id" element={<BudgetProjetDetail />} />
            <Route path="documents" element={<MesDocumentsPage />} />
          </Route>

          {/* ── Module RH ───────────────────────────────────── */}
          <Route path="rh" element={<RHLayout />}>
            <Route
              index
              element={<Navigate to="/rh/tableau-de-bord" replace />}
            />
            <Route path="tableau-de-bord" element={<RHTableauDeBord />} />
            <Route path="employes" element={<RHEmployesList />} />
            <Route path="employes/nouveau" element={<RHEmployeForm />} />
            <Route path="employes/:id" element={<RHEmployeDetail />} />
            <Route path="employes/:id/edit" element={<RHEmployeForm />} />
            <Route path="conges" element={<RHConges />} />
            <Route path="evaluations" element={<RHEvaluations />} />
            <Route path="alertes" element={<RHAlertes />} />
          </Route>

          {/* ── Module Terrain ──────────────────────────────── */}
          <Route path="terrain" element={<TerrainLayout />}>
            <Route index element={<TerrainDashboard />} />
            <Route path="collecte" element={<TerrainCollecte />} />
            <Route path="rapports" element={<TerrainRapports />} />
          </Route>

          {/* ── Module Logistique ───────────────────────────── */}
          <Route path="logistique" element={<LogistiqueLayout />}>
            <Route index element={<LogistiqueDashboard />} />
            <Route path="inventaire" element={<LogistiqueInventaire />} />
            <Route path="vehicules" element={<LogistiqueVehicules />} />
            <Route path="mouvements" element={<LogistiqueMouvements />} />
          </Route>

          {/* ── Module RAF ──────────────────────────────────── */}
          <Route path="raf" element={<RAFLayout />}>
            <Route
              index
              element={<Navigate to="/raf/tableau-de-bord" replace />}
            />
            <Route path="tableau-de-bord" element={<RAFTableauDeBord />} />
            <Route
              path="validation-depenses"
              element={<RAFValidationDepenses />}
            />
            <Route path="budgets" element={<RAFBudgets />} />
            <Route path="tresorerie" element={<RAFTresorerie />} />
            <Route path="missions" element={<RAFMissions />} />
            <Route path="acquisitions" element={<RAFAcquisitions />} />
            <Route path="rapports" element={<RAFRapports />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
