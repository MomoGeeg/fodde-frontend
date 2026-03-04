import FinancesLayout from "@/components/layout/FinancesLayout";
import GEDLayout from "@/components/layout/GEDLayout";
import MainLayout from "@/components/layout/MainLayout";
import RAFLayout from "@/components/layout/RAFLayout";
import RHLayout from "@/components/layout/RHLayout";
import SELayout from "@/components/layout/SELayout";
import ActivitesList from "@/pages/activites/ActivitesList";
import LoginPage from "@/pages/auth/LoginPage";
import DashboardPage from "@/pages/dashboard/DashboardPage";
import BudgetProjetDetail from "@/pages/finances/BudgetProjetDetail";
import BudgetsList from "@/pages/finances/BudgetsList";
import DepenseDetail from "@/pages/finances/DepenseDetail";
import DepenseForm from "@/pages/finances/DepenseForm";
import DepensesList from "@/pages/finances/DepensesList";
import GEDBailleursPage from "@/pages/ged/GEDBailleursPage";
import GEDCommunicationPage from "@/pages/ged/GEDCommunicationPage";
import GEDDocumentDetail from "@/pages/ged/GEDDocumentDetail";
import GEDHomePage from "@/pages/ged/GEDHomePage";
import GEDInstitutionnelPage from "@/pages/ged/GEDInstitutionnelPage";
import GEDProjetDossier from "@/pages/ged/GEDProjetDossier";
import GEDProjetsPage from "@/pages/ged/GEDProjetsPage";
import GEDRHPage from "@/pages/ged/GEDRHPage";
import GEDValidationPage from "@/pages/ged/GEDValidationPage";
import ProjetDetail from "@/pages/projets/ProjetDetail";
import ProjetForm from "@/pages/projets/ProjetForm";
import ProjetsList from "@/pages/projets/ProjetsList";
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
import SECollecte from "@/pages/se/SECollecte";
import SEFormulaireForm from "@/pages/se/SEFormulaireForm";
import SEFormulairesList from "@/pages/se/SEFormulairesList";
import SEIndicateurDetail from "@/pages/se/SEIndicateurDetail";
import SEIndicateurForm from "@/pages/se/SEIndicateurForm";
import SEIndicateursList from "@/pages/se/SEIndicateursList";
import SETableauDeBord from "@/pages/se/SETableauDeBord";
import SEValidation from "@/pages/se/SEValidation";
import UsersPage from "@/pages/utilisateurs/UsersPage";
import useAuthStore from "@/stores/auth.store";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

/** Redirige /finances → budgets pour RP, dépenses pour les autres */
function FinancesIndexRedirect() {
  const { user } = useAuthStore();
  const isRP = user?.roles?.includes("ROLE_RESPONSABLE_PROGRAMMES");
  return (
    <Navigate to={isRP ? "/finances/budgets" : "/finances/depenses"} replace />
  );
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
          <Route path="utilisateurs" element={<UsersPage />} />

          {/* ── Module GED ──────────────────────────────────── */}
          <Route path="documents" element={<GEDLayout />}>
            <Route index element={<GEDHomePage />} />
            <Route path="projets" element={<GEDProjetsPage />} />
            <Route path="projets/:projet_id" element={<GEDProjetDossier />} />
            <Route path="rh" element={<GEDRHPage />} />
            <Route path="institutionnel" element={<GEDInstitutionnelPage />} />
            <Route path="bailleurs" element={<GEDBailleursPage />} />
            <Route path="communication" element={<GEDCommunicationPage />} />
            <Route path="validation" element={<GEDValidationPage />} />
            <Route path=":id" element={<GEDDocumentDetail />} />
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
          </Route>

          {/* ── Module Finances (Comptabilité) ──────────────── */}
          <Route path="finances" element={<FinancesLayout />}>
            <Route index element={<FinancesIndexRedirect />} />
            <Route path="depenses" element={<DepensesList />} />
            <Route path="depenses/nouvelle" element={<DepenseForm />} />
            <Route path="depenses/:id" element={<DepenseDetail />} />
            <Route path="budgets" element={<BudgetsList />} />
            <Route path="budgets/:projet_id" element={<BudgetProjetDetail />} />
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
