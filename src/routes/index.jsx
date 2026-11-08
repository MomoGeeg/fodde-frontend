import AppLayout from "@/components/layout/AppLayout";
import RequireRole from "@/components/shared/RequireRole";
import { ACCES, R } from "@/lib/navigation";
import AccueilPage from "@/pages/accueil/AccueilPage";
import { BailleurFichePage, BailleurFormPage, BailleursPage, FinancementFormPage } from "@/pages/bailleurs/BailleursPages";
import { IndicateurFichePage, IndicateurFormPage, IndicateursPage } from "@/pages/indicateurs/IndicateursPages";
import { GESTIONNAIRES_INDICATEURS } from "@/api/indicateurs";
import { AcquisitionFichePage, AcquisitionFormPage, AcquisitionsPage } from "@/pages/acquisitions/AcquisitionsPages";
import { CongeFichePage, CongeFormPage, CongesPage } from "@/pages/conges/CongesPages";
import { MissionFichePage, MissionFormPage, MissionsPage, OrdreMissionPage } from "@/pages/missions/MissionsPages";
import ActivitesList from "@/pages/activites/ActivitesList";
import AdminEmployesSansCompte from "@/pages/admin/AdminEmployesSansCompte";
import AdminUserForm from "@/pages/admin/AdminUserForm";
import AdminUsersPage from "@/pages/admin/AdminUsersPage";
import LoginPage from "@/pages/auth/LoginPage";
import DocumentDetail from "@/pages/documents/DocumentDetail";
import DocumentsPage from "@/pages/documents/DocumentsPage";
import DocumentValidationPage from "@/pages/documents/DocumentValidationPage";
import BudgetProjetPage from "@/pages/budgets/BudgetProjetPage";
import BudgetsPage from "@/pages/budgets/BudgetsPage";
import DepenseFichePage from "@/pages/depenses/DepenseFichePage";
import DepenseFormPage from "@/pages/depenses/DepenseFormPage";
import DepensesPage from "@/pages/depenses/DepensesPage";
import ProjetDetail from "@/pages/projets/ProjetDetail";
import ProjetForm from "@/pages/projets/ProjetForm";
import ProjetsList from "@/pages/projets/ProjetsList";
import RAFBudgets from "@/pages/raf/RAFBudgets";
import OrganigrammePage from "@/pages/rh/OrganigrammePage";
import RHAlertes from "@/pages/rh/RHAlertes";
import RHEmployeDetail from "@/pages/rh/RHEmployeDetail";
import RHEmployeForm from "@/pages/rh/RHEmployeForm";
import RHEmployesList from "@/pages/rh/RHEmployesList";
import RHEvaluations from "@/pages/rh/RHEvaluations";
import SecretariatRapports from "@/pages/secretariat/SecretariatRapports";
import SecretariatValidations from "@/pages/secretariat/SecretariatValidations";
import {
  LogistiquePage,
  MaterielFichePage,
  MaterielFormPage,
  VehiculeFichePage,
  VehiculeFormPage,
} from "@/pages/logistique/LogistiquePages";
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
            <Route path="finances/depenses" element={<DepensesPage />} />
            <Route path="finances/depenses/:id" element={<DepenseFichePage />} />
          </Route>
          <Route element={<Acces roles={ACCES.budgetsProjets} />}>
            <Route path="finances/budgets" element={<BudgetsPage />} />
            <Route path="finances/budgets/:projet_id" element={<BudgetProjetPage />} />
          </Route>
          <Route element={<Acces roles={ACCES.saisieDepenses} />}>
            <Route path="finances/depenses/nouvelle" element={<DepenseFormPage />} />
          </Route>
          <Route element={<Acces roles={ACCES.budgetsProjets} />}>
            <Route path="bailleurs" element={<BailleursPage />} />
            <Route path="bailleurs/:id" element={<BailleurFichePage />} />
          </Route>
          <Route element={<Acces roles={[R.RAF, R.SE, R.ADMIN]} />}>
            <Route path="bailleurs/nouveau" element={<BailleurFormPage />} />
            <Route path="financements/nouveau" element={<FinancementFormPage />} />
          </Route>
          <Route element={<Acces roles={ACCES.budgetAnnuel} />}>
            <Route path="raf/budgets" element={<RAFBudgets />} />
            <Route path="raf/tresorerie" element={<ModuleEnPreparation titre="Trésorerie" />} />
          </Route>

          {/* ── Demandes ouvertes à tous : missions, achats, congés (chacun voit les siens) ── */}
          <Route path="missions" element={<MissionsPage />} />
          <Route path="missions/nouvelle" element={<MissionFormPage />} />
          <Route path="missions/:id" element={<MissionFichePage />} />
          <Route path="missions/:id/ordre" element={<OrdreMissionPage />} />
          <Route path="acquisitions" element={<AcquisitionsPage />} />
          <Route path="acquisitions/nouvelle" element={<AcquisitionFormPage />} />
          <Route path="acquisitions/:id" element={<AcquisitionFichePage />} />
          <Route path="conges" element={<CongesPage />} />
          <Route path="conges/:id" element={<CongeFichePage />} />
          <Route element={<Acces roles={[R.RH]} />}>
            <Route path="conges/nouveau" element={<CongeFormPage />} />
          </Route>

          {/* ── Ressources humaines ─────────────────────────── */}
          <Route path="organigramme" element={<OrganigrammePage />} />
          <Route element={<Acces roles={ACCES.employes} />}>
            <Route path="rh/employes" element={<RHEmployesList />} />
            <Route path="rh/employes/:id" element={<RHEmployeDetail />} />
          </Route>
          <Route element={<Acces roles={ACCES.rh} />}>
            <Route path="rh/employes/nouveau" element={<RHEmployeForm />} />
            <Route path="rh/employes/:id/edit" element={<RHEmployeForm />} />
            <Route path="rh/evaluations" element={<RHEvaluations />} />
            <Route path="rh/alertes" element={<RHAlertes />} />
          </Route>

          {/* ── Suivi-évaluation ────────────────────────────── */}
          <Route element={<Acces roles={ACCES.suiviEvaluation} />}>
            <Route path="se" element={<Navigate to="/se/indicateurs" replace />} />
            <Route path="se/indicateurs" element={<IndicateursPage />} />
            <Route path="se/indicateurs/:id" element={<IndicateurFichePage />} />
            <Route path="se/indicateurs/:id/edit" element={<AncienneModification />} />
          </Route>
          <Route element={<Acces roles={GESTIONNAIRES_INDICATEURS} />}>
            <Route path="se/indicateurs/nouveau" element={<IndicateurFormPage />} />
          </Route>

          {/* ── Documents (tous les utilisateurs) ───────────── */}
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="documents/:id" element={<DocumentDetail />} />
          <Route element={<Acces roles={ACCES.validationDocuments} />}>
            <Route path="documents/validation" element={<DocumentValidationPage />} />
          </Route>

          {/* ── Logistique ──────────────────────────────────── */}
          <Route element={<Acces roles={ACCES.logistique} />}>
            <Route path="logistique" element={<LogistiquePage />} />
            <Route path="logistique/materiels/:id" element={<MaterielFichePage />} />
            <Route path="logistique/vehicules/:id" element={<VehiculeFichePage />} />
          </Route>
          <Route element={<Acces roles={ACCES.saisieLogistique} />}>
            <Route path="logistique/materiels/nouveau" element={<MaterielFormPage />} />
            <Route path="logistique/materiels/:id/modifier" element={<MaterielFormPage />} />
            <Route path="logistique/vehicules/nouveau" element={<VehiculeFormPage />} />
            <Route path="logistique/vehicules/:id/modifier" element={<VehiculeFormPage />} />
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
          <Route path="raf/validation-depenses" element={<Navigate to="/finances/depenses" replace />} />
          <Route path="raf/missions" element={<Navigate to="/missions" replace />} />
          <Route path="raf/rapports" element={<Navigate to="/finances/budgets" replace />} />
          {/* La collecte de terrain se fait désormais avec KoboCollect */}
          {["se/formulaires/*", "se/collecte/*", "se/donnees", "se/validation", "terrain/*"].map((p) => (
            <Route key={p} path={p} element={<Navigate to="/se/indicateurs" replace />} />
          ))}
          <Route path="raf/acquisitions" element={<Navigate to="/acquisitions" replace />} />
          <Route path="rh/conges" element={<Navigate to="/conges" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

/** Le backend ne permet pas de modifier un indicateur : retour à sa fiche. */
function AncienneModification() {
  const { id } = useParams();
  return <Navigate to={`/se/indicateurs/${id}`} replace />;
}

/** /secretariat/documents/:id → /documents/:id */
function AncienDocument() {
  const { id } = useParams();
  return <Navigate to={`/documents/${id}`} replace />;
}
