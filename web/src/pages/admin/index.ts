/**
 * Admin pages barrel — preferred import path.
 * `admin-pages.tsx` also re-exports for compatibility with existing imports.
 */

export { AdminPlannedShell } from './admin-planned-shell.tsx'

export { AdminExecutivePage, AdminDashboardPage } from './command-center/admin-executive-page.tsx'
export { AdminOperationsPage } from './command-center/admin-operations-page.tsx'
export { AdminRiskPage } from './command-center/admin-risk-page.tsx'
export { AdminMyQueuePage } from './command-center/admin-my-queue-page.tsx'
export { AdminInboxPage } from './inbox/admin-inbox-page.tsx'
export { AdminSearchPage } from './search/admin-search-page.tsx'
export { AdminExplorerPage } from './explorer/admin-explorer-page.tsx'
export { AdminWorkspacePage } from './workspaces/admin-workspace-page.tsx'
export { AdminHealthPage } from './system/admin-health-page.tsx'
export { AdminEnvironmentsPage } from './system/admin-environments-page.tsx'
export { AdminFeatureFlagsPage } from './system/admin-feature-flags-page.tsx'
export { AdminDataQualityPage } from './system/admin-data-quality-page.tsx'
export { AdminFailedCommandsPage } from './system/admin-failed-commands-page.tsx'
export { AdminNegotiationDetailPage } from './commercial/admin-negotiation-detail-page.tsx'
export { AdminPartiesPage } from './identity/admin-parties-page.tsx'
export { AdminPartyDetailPage } from './identity/admin-party-detail-page.tsx'
export { AdminMembershipsPage } from './identity/admin-memberships-page.tsx'
export { AdminRolesPage } from './identity/admin-roles-page.tsx'
export { AdminUsersPage } from './identity/admin-users-page.tsx'
export { AdminUserDetailPage } from './identity/admin-user-detail-page.tsx'
export { AdminTaxonomyPage } from './marketplace/admin-taxonomy-page.tsx'
export { AdminPostMatchesPage } from './marketplace/admin-post-matches-page.tsx'
export { AdminMatchingQualityPage } from './marketplace/admin-matching-quality-page.tsx'
export { AdminModerationPage } from './marketplace/admin-moderation-page.tsx'
export { AdminOpportunityDetailPage } from './marketplace/admin-opportunity-detail-page.tsx'
export { AdminApprovalsPage } from './commercial/admin-approvals-page.tsx'
export { AdminAwardsPage } from './commercial/admin-awards-page.tsx'
export { AdminLegalReviewPage } from './commercial/admin-legal-review-page.tsx'
export { AdminVettingConfigPage } from './onboarding/admin-vetting-config-page.tsx'
export { AdminSettingsPage } from './platform/admin-settings-page.tsx'
export { AdminReportsPage } from './reports/admin-reports-page.tsx'

export {
  AdminVettingPage,
  AdminOpportunitiesPage,
  AdminMatchingPage,
  AdminNegotiationsPage,
  AdminDisputesPage,
  AdminDealsPage,
  AdminContractsPage,
  AdminConsortiumPage,
  AdminAuditPage,
  AdminSkillsPage,
  AdminCollaborationModelsPage,
  AdminSiteContentPage,
  AdminSubscriptionsPage,
} from './admin-pages.tsx'
