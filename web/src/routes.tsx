import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppShell } from '@/components/layout/app-shell'
import { PublicLayout } from '@/components/layout/public-layout'
import { DashboardPage } from '@/pages/dashboard-page'
import {
  CollaborationModelsPage,
  CollaborationWizardPage,
  FindPage,
  HomePage,
  KnowledgeBasePage,
  WorkflowPage,
} from '@/pages/public/marketing-pages'
import {
  ForgotPasswordPage,
  LoginPage,
  RegisterPage,
  ResetPasswordPage,
} from '@/pages/public/auth-pages'
import {
  OpportunityCreatePage,
  OpportunityEditPage,
  OpportunityMapPage,
  OpportunitiesPage,
} from '@/pages/workspace/opportunities-pages'
import { OpportunityDetailPage } from '@/pages/workspace/opportunity-detail-page'
import {
  MatchDetailPage,
  MatchesPage,
  NegotiationDetailPage,
  PipelinePage,
} from '@/pages/workspace/pipeline-pages'
import {
  ContractDetailPage,
  ContractsPage,
  DealDetailPage,
  DealRatePage,
  DealsPage,
} from '@/pages/workspace/deals-pages'
import {
  MessagesPage,
  NotificationsPage,
  PeoplePage,
  PersonProfilePage,
  ProfilePage,
  SettingsPage,
} from '@/pages/workspace/people-pages'
import {
  AdminAuditPage,
  AdminCollaborationModelsPage,
  AdminConsortiumPage,
  AdminContractsPage,
  AdminDashboardPage,
  AdminDealsPage,
  AdminDisputesPage,
  AdminHealthPage,
  AdminMatchingPage,
  AdminNegotiationDetailPage,
  AdminNegotiationsPage,
  AdminOpportunitiesPage,
  AdminReportsPage,
  AdminSettingsPage,
  AdminSiteContentPage,
  AdminSkillsPage,
  AdminSubscriptionsPage,
  AdminUserDetailPage,
  AdminUsersPage,
  AdminVettingPage,
} from '@/pages/admin/admin-pages'

export function AppRoutes() {
  return (
    <Routes>
      {/* Public marketing & auth */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/find" element={<FindPage />} />
        <Route path="/workflow" element={<WorkflowPage />} />
        <Route path="/knowledge-base" element={<KnowledgeBasePage />} />
        <Route path="/collaboration-wizard" element={<CollaborationWizardPage />} />
        <Route path="/collaboration-models" element={<CollaborationModelsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      {/* Authenticated portal + admin (shared shell) */}
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/company-dashboard" element={<DashboardPage />} />

        <Route path="/opportunities" element={<OpportunitiesPage />} />
        <Route path="/opportunities/map" element={<OpportunityMapPage />} />
        <Route path="/opportunities/create" element={<OpportunityCreatePage />} />
        <Route path="/opportunities/:id/edit" element={<OpportunityEditPage />} />
        <Route path="/opportunities/:id" element={<OpportunityDetailPage />} />

        <Route path="/pipeline" element={<PipelinePage />} />
        <Route path="/pipeline/:tab" element={<PipelinePage />} />

        <Route path="/matches" element={<MatchesPage />} />
        <Route path="/matches/:id" element={<MatchDetailPage />} />

        <Route path="/negotiations/:id" element={<NegotiationDetailPage />} />

        <Route path="/deals" element={<DealsPage />} />
        <Route path="/deals/:id/rate" element={<DealRatePage />} />
        <Route path="/deals/:id" element={<DealDetailPage />} />

        <Route path="/contracts" element={<ContractsPage />} />
        <Route path="/contracts/:id" element={<ContractDetailPage />} />

        <Route path="/people" element={<PeoplePage />} />
        <Route path="/people/:id" element={<PersonProfilePage />} />

        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/messages/:id" element={<MessagesPage />} />

        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />

        {/* Admin */}
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/admin/reports" element={<AdminReportsPage />} />
        <Route path="/admin/health" element={<AdminHealthPage />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/admin/people" element={<AdminUsersPage />} />
        <Route path="/admin/users/:id" element={<AdminUserDetailPage />} />
        <Route path="/admin/people/:id" element={<AdminUserDetailPage />} />
        <Route path="/admin/vetting" element={<AdminVettingPage />} />
        <Route path="/admin/opportunities" element={<AdminOpportunitiesPage />} />
        <Route path="/admin/matching" element={<AdminMatchingPage />} />
        <Route path="/admin/negotiations" element={<AdminNegotiationsPage />} />
        <Route path="/admin/negotiations/:id" element={<AdminNegotiationDetailPage />} />
        <Route path="/admin/disputes" element={<AdminDisputesPage />} />
        <Route path="/admin/deals" element={<AdminDealsPage />} />
        <Route path="/admin/deals/:id" element={<DealDetailPage />} />
        <Route path="/admin/contracts" element={<AdminContractsPage />} />
        <Route path="/admin/contracts/:id" element={<ContractDetailPage />} />
        <Route path="/admin/consortium" element={<AdminConsortiumPage />} />
        <Route path="/admin/audit" element={<AdminAuditPage />} />
        <Route path="/admin/settings" element={<AdminSettingsPage />} />
        <Route path="/admin/skills" element={<AdminSkillsPage />} />
        <Route path="/admin/collaboration-models" element={<AdminCollaborationModelsPage />} />
        <Route path="/admin/site-content" element={<AdminSiteContentPage />} />
        <Route path="/admin/subscriptions" element={<AdminSubscriptionsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
