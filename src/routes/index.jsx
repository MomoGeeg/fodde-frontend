import AppLayout from "@/components/layout/AppLayout";
import RequireRole from "@/components/shared/RequireRole";
import { ACCES } from "@/lib/navigation";
import AccueilPage from "@/pages/accueil/AccueilPage";
import ActivitesList from "@/pages/activites/ActivitesList";
import AdminEmployesSansCompte from "@/pages/admin/AdminEmployesSansCompte";
import AdminUserForm from "@/pages/admin/AdminUserForm";
import AdminUsersPage from "@/pages/admin/AdminUsersPage";
import LoginPage from "@/pages/auth/LoginPage";
import DocumentDetail from "@/pages/documents/DocumentDetail";
import DocumentsPage from "@/pages/documents/DocumentsPage";
import DocumentValidationPage from "@/pages/documents/DocumentValidationPage";
import BudgetProjetDetail from "@/pages/finances/BudgetProjetDetail";
import BudgetsList from "@/pages/finances/BudgetsList";
import DepenseDetail from "@/pages/finances/DepenseDetail";
import DepensesList from "@/pages/finances/DepensesList";
import ProjetDetail from "@/pages/projets/ProjetDetail";
import ProjetForm from "@/pages/projets/ProjetForm";
import ProjetsList from "@/pages/projets/ProjetsList";
import RAFAcquisitions from "@/pages/raf/RAFAcquisitions";
import RAFBudgets from "@/pages/raf/RAFBudgets";
import RAFMissions from "@/pages/raf/RAFMissions";
import RAFRapports from "@/pages/raf/RAFRapports";
import RAFValidationDepenses from "@/pages/raf/RAFValidationDepenses";
import RHAlertes from "@/pages/rh/RHAlertes";
import RHConges from "@/pages/rh/RHConges";
import RHEmployeDetail from "@/pages/rh/RHEmployeDetail";
import RHEmployeForm from "@/pages/rh/RHEmployeForm";
import RHEmployesList from "@/pages/rh/RHEmployesList";
import RHEvaluations from "@/pages/rh/RHEvaluations";
import SECollecte from "@/pages/se/SECollecte";
import SEDonnees from "@/pages/se/SEDonnees";
import SEFormulaireForm from "@/pages/se/SEFormulaireForm";
import SEFormulairesList from "@/pages/se/SEFormulairesList";
import SEIndicateurDetail from "@/pages/se/SEIndicateurDetail";
import SEIndicateurForm from "@/pages/se/SEIndicateurForm";
import SEIndicateursList from "@/pages/se/SEIndicateursList";
import SEValidation from "@/pages/se/SEValidation";
import SecretariatRapports from "@/pages/secretariat/SecretariatRapports";
import SecretariatValidations from "@/pages/secretariat/SecretariatValidations";
import ModuleEnPreparation from "@/pages/shared/ModuleEnPreparation";
import useAuthStore from "@/stores/auth.store";
import { BrowserRouter, Navigate, Route, Routes, useParams } from "react-router-dom";

function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

/** Garde de rôle pour un groupe de routes. */
const Acces = ({ roles }) => <RequireRole roles={roles} />;

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <AppLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<AccueilPage />} />

          {/* ── Direction (Secrétaire exécutif) ─────────────── */}
          <Route element={<Acces roles={ACCES.direction} />}>
            <Route path="secretariat/validations" element={<SecretariatValidations />} />
            <Route path="secretariat/rapports" element={<SecretariatRapports />} />
          </Route>

          {/* ── Projets ─────────────────────────────────────── */}
          <Route element={<Acces roles={ACCES.projets} />}>
            <Route path="projets" element={<ProjetsList />} />
            <Route path="projets/nouveau" element={<ProjetForm />} />
            <Route path="projets/:id" element={<ProjetDetail />} />
            <Route path="projets/:id/edit" element={<ProjetForm />} />
            <Route path="activites" element={<ActivitesList />} />
          </Route>

          {/* ── Finances ────────────────────────────────────── */}
          <Route element={<Acces roles={ACCES.depenses} />}>
            <Route path="finances/depenses" element={<DepensesList />} />
            <Route path="finances/depenses/:id" element={<DepenseDetail />} />
          </Route>
          <Route element={<Acces roles={ACCES.budgetsProjets} />}>
            <Route path="finances/budgets" element={<BudgetsList />} />
            <Route path="finances/budgets/:projet_id" element={<BudgetProjetDetail />} />
          </Route>
          <Route element={<Acces roles={ACCES.validationDepenses} />}>
            <Route path="raf/validation-depenses" element={<RAFValidationDepenses />} />
          </Route>
          <Route element={<Acces roles={ACCES.budgetAnnuel} />}>
            <Route path="raf/budgets" element={<RAFBudgets />} />
            <Route path="raf/tresorerie" element={<ModuleEnPreparation titre="Trésorerie" />} />
          </Route>
          <Route element={<Acces roles={ACCES.missionsAchats} />}>
            <Route path="raf/missions" element={<RAFMissions />} />
            <Route path="raf/acquisitions" element={<RAFAcquisitions />} />
          </Route>
          <Route element={<Acces roles={ACCES.rapportsFinanciers} />}>
            <Route path="raf/rapports" element={<RAFRapports />} />
          </Route>

          {/* ── Ressources humaines ─────────────────────────── */}
          <Route element={<Acces roles={ACCES.employes} />}>
            <Route path="rh/employes" element={<RHEmployesList />} />
            <Route path="rh/employes/:id" element={<RHEmployeDetail />} />
          </Route>
          <Route element={<Acces roles={ACCES.rh} />}>
            <Route path="rh/employes/nouveau" element={<RHEmployeForm />} />
            <Route path="rh/employes/:id/edit" element={<RHEmployeForm />} />
            <Route path="rh/conges" element={<RHConges />} />
            <Route path="rh/evaluations" element={<RHEvaluations />} />
            <Route path="rh/alertes" element={<RHAlertes />} />
          </Route>

          {/* ── Suivi-évaluation ────────────────────────────── */}
          <Route element={<Acces roles={ACCES.suiviEvaluation} />}>
            <Route path="se" element={<Navigate to="/se/indicateurs" replace />} />
            <Route path="se/indicateurs" element={<SEIndicateursList />} />
            <Route path="se/indicateurs/nouveau" element={<SEIndicateurForm />} />
            <Route path="se/indicateurs/:id" element={<SEIndicateurDetail />} />
            <Route path="se/indicateurs/:id/edit" element={<SEIndicateurForm />} />
            <Route path="se/formulaires" element={<SEFormulairesList />} />
            <Route path="se/formulaires/nouveau" element={<SEFormulaireForm />} />
            <Route path="se/formulaires/:id" element={<SEFormulaireForm />} />
            <Route path="se/collecte/:formulaire_id" element={<SECollecte />} />
            <Route path="se/donnees" element={<SEDonnees />} />
          </Route>
          <Route element={<Acces roles={ACCES.validationSE} />}>
            <Route path="se/validation" element={<SEValidation />} />
          </Route>
          <Route element={<Acces roles={ACCES.terrain} />}>
            <Route path="terrain/*" element={<ModuleEnPreparation titre="Collecte terrain" />} />
          </Route>

          {/* ── Documents (tous les utilisateurs) ───────────── */}
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="documents/:id" element={<DocumentDetail />} />
          <Route element={<Acces roles={ACCES.validationDocuments} />}>
            <Route path="documents/validation" element={<DocumentValidationPage />} />
          </Route>

          {/* ── Logistique ──────────────────────────────────── */}
          <Route element={<Acces roles={ACCES.logistique} />}>
            <Route path="logistique/*" element={<ModuleEnPreparation titre="Logistique" />} />
          </Route>

          {/* ── Administration ──────────────────────────────── */}
          <Route element={<Acces roles={ACCES.administration} />}>
            <Route path="admin" element={<Navigate to="/admin/utilisateurs" replace />} />
            <Route path="admin/utilisateurs" element={<AdminUsersPage />} />
            <Route path="admin/utilisateurs/nouveau" element={<AdminUserForm />} />
            <Route path="admin/utilisateurs/:id/edit" element={<AdminUserForm />} />
            <Route path="admin/sans-compte" element={<AdminEmployesSansCompte />} />
          </Route>

          {/* Anciennes adresses (favoris, liens d'alertes) */}
          <Route path="mes-documents" element={<Navigate to="/documents" replace />} />
          <Route path="finances/documents" element={<Navigate to="/documents" replace />} />
          <Route path="secretariat/documents/:id" element={<AncienDocument />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

/** /secretariat/documents/:id → /documents/:id */
function AncienDocument() {
  const { id } = useParams();
  return <Navigate to={`/documents/${id}`} replace />;
}
