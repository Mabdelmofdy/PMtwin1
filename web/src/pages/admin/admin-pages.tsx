/**
 * Legacy admin pages still hosted here + compatibility re-exports.
 * Prefer imports from '@/pages/admin' or specific page modules.
 */

export { AdminDashboardPage, AdminExecutivePage } from './command-center/admin-executive-page.tsx'
export { AdminReportsPage } from './reports/admin-reports-page.tsx'
export { AdminHealthPage } from './system/admin-health-page.tsx'
export { AdminUsersPage } from './identity/admin-users-page.tsx'
export { AdminUserDetailPage } from './identity/admin-user-detail-page.tsx'
export { AdminSettingsPage } from './platform/admin-settings-page.tsx'
export { AdminOperationsPage } from './command-center/admin-operations-page.tsx'
export { AdminRiskPage } from './command-center/admin-risk-page.tsx'
export { AdminMyQueuePage } from './command-center/admin-my-queue-page.tsx'
export { AdminInboxPage } from './inbox/admin-inbox-page.tsx'
export { AdminSearchPage } from './search/admin-search-page.tsx'
export { AdminExplorerPage } from './explorer/admin-explorer-page.tsx'
export { AdminWorkspacePage } from './workspaces/admin-workspace-page.tsx'
export { AdminEnvironmentsPage } from './system/admin-environments-page.tsx'
export { AdminFeatureFlagsPage } from './system/admin-feature-flags-page.tsx'
export { AdminDataQualityPage } from './system/admin-data-quality-page.tsx'
export { AdminPartiesPage } from './identity/admin-parties-page.tsx'
export { AdminPartyDetailPage } from './identity/admin-party-detail-page.tsx'
export { AdminMembershipsPage } from './identity/admin-memberships-page.tsx'
export { AdminRolesPage } from './identity/admin-roles-page.tsx'
export { AdminTaxonomyPage } from './marketplace/admin-taxonomy-page.tsx'
export { AdminPostMatchesPage } from './marketplace/admin-post-matches-page.tsx'
export { AdminMatchingQualityPage } from './marketplace/admin-matching-quality-page.tsx'
export { AdminModerationPage } from './marketplace/admin-moderation-page.tsx'
export { AdminApprovalsPage } from './commercial/admin-approvals-page.tsx'
export { AdminAwardsPage } from './commercial/admin-awards-page.tsx'
export { AdminLegalReviewPage } from './commercial/admin-legal-review-page.tsx'
export { AdminVettingConfigPage } from './onboarding/admin-vetting-config-page.tsx'

export { AdminFailedCommandsPage } from './system/admin-failed-commands-page.tsx'
export { AdminNegotiationDetailPage } from './commercial/admin-negotiation-detail-page.tsx'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { adminApi } from '@/api/admin.ts'
import { contractsApi } from '@/api/contracts.ts'
import { dealsApi } from '@/api/deals.ts'
import { matchesApi } from '@/api/matches.ts'
import { negotiationsApi } from '@/api/negotiations.ts'
import { opportunitiesApi } from '@/api/opportunities.ts'
import { resolvePostMatchTopologyLabel } from '@/lib/collaboration-taxonomy-display.ts'
import { useDataStoreVersion } from '@/hooks/use-data-store'
import { formatDate } from '@/lib/format'
import {
  parseMatchingRunAuditDetails,
  isMatchingRunAuditEntry,
} from '@/services/matching/matching-run-audit.ts'
import {
  showCircularMatchingAccessDenied,
  showCircularMatchingFeedback,
} from '@/lib/run-circular-matching-feedback.ts'
import { runCircularMatchingUiAction } from '@/lib/run-circular-matching-ui-action.ts'
import { useAuth } from '@/providers/auth-provider.tsx'
import { VettingReviewDialog } from '@/components/admin/vetting-review-dialog.tsx'
import { VettingSlaBadge } from '@/components/admin/vetting-sla-badge.tsx'
import {
  AdminVettingKpiStrip,
  computeAdminVettingKpiMetrics,
} from '@/components/admin/admin-vetting-kpi-strip.tsx'
import type { VettingWorkflowEntry } from '@/lib/vetting-admin-workflow.ts'
import {
  executeApproveVetting,
  executeRejectVetting,
  executeRequestVettingClarification,
} from '@/domain/admin/commands/vetting-admin-commands.ts'
import {
  PmDataTable,
  PmTableEmpty,
  PmTableToolbar,
  type PmDataTableColumn,
} from '@/components/data/pm-data-index'
import {
  PmContentCard,
  PmSectionHeader,
} from '@/components/layout/pm-layout-index'
import { PmBadge, PmButton, PmPage, PmPageHeader, PmPageHeroMetric, PmReadinessScoreBadge, PmMatchScoreBadge } from '@/components/ui/pm-index'
import { PmToolbarSurface } from '@/components/ui/pm-toolbar-surface'
import { resolveOpportunityReadiness } from '@/components/readiness/opportunity-readiness-card'
import { AdminListPage } from '@/pages/admin/admin-list-page'
import { AdminStatusBadge } from '@/pages/admin/admin-display'
import { pmTypography } from '@/tokens'
import { cn } from '@/lib/utils'
import { useProductLanguage } from '@/providers/product-language-provider.tsx'
import { AdminPlannedShell } from '@/pages/admin/admin-planned-shell.tsx'

export function AdminVettingPage() {
  const { user } = useAuth()
  const version = useDataStoreVersion()
  const workflow = useMemo(() => adminApi.getVettingWorkflow(), [version])
  const kpiMetrics = useMemo(() => computeAdminVettingKpiMetrics(workflow), [workflow])
  const [reviewing, setReviewing] = useState<VettingWorkflowEntry | null>(null)

  const reviewerId = user?.id ?? 'admin'

  function renderQueueTable(
    title: string,
    description: string,
    entries: readonly VettingWorkflowEntry[],
    emptyTitle: string,
    history = false,
  ) {
    return (
      <PmContentCard
        title={title}
        description={description}
        className={history ? 'mb-4 opacity-90' : 'mb-4'}
      >
        {entries.length === 0 ? (
          <PmTableEmpty title={emptyTitle} />
        ) : (
          <PmDataTable
            data={entries}
            getRowId={(entry) => entry.user.id}
            columns={[
              {
                id: 'name',
                label: 'Name',
                cell: (entry) => entry.user.profile?.name ?? entry.user.id,
              },
              { id: 'email', label: 'Email', cell: (entry) => entry.user.email },
              {
                id: 'status',
                label: 'Status',
                cell: (entry) => <AdminStatusBadge status={entry.user.status} />,
              },
              {
                id: 'sla',
                label: 'SLA',
                cell: (entry) => (
                  <VettingSlaBadge status={entry.slaStatus} user={entry.user} />
                ),
              },
              {
                id: 'review',
                label: 'Review',
                cell: (entry) => {
                  const vetting = entry.user.profile?.vetting
                  const reviewNotes = vetting?.reviewNotes ?? vetting?.reason
                  const requestedItems = vetting?.requestedChanges ?? vetting?.requestedItems ?? []
                  const reviewedBy = vetting?.reviewedBy ?? vetting?.reviewerId
                  if (!reviewNotes && requestedItems.length === 0 && !reviewedBy) {
                    return '—'
                  }
                  return (
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {reviewNotes ? <p>{reviewNotes}</p> : null}
                      {requestedItems.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {requestedItems.map((item) => (
                            <PmBadge key={item} tone="warning" size="sm">
                              {item}
                            </PmBadge>
                          ))}
                        </div>
                      ) : null}
                      {reviewedBy ? (
                        <p className={cn(pmTypography.caption)}>Reviewed by {reviewedBy}</p>
                      ) : null}
                    </div>
                  )
                },
              },
              {
                id: 'actions',
                label: 'Actions',
                cell: (entry) => (
                  <PmButton
                    size="sm"
                    onClick={() => setReviewing(entry)}
                    disabled={entry.user.status === 'active' || entry.user.status === 'rejected'}
                  >
                    Review
                  </PmButton>
                ),
              },
            ]}
          />
        )}
      </PmContentCard>
    )
  }

  return (
    <PmPage
      header={
        <PmPageHeader
          label="Queue"
          title="Vetting"
          description="Pre-approval user workflow — pending, changes requested, resubmitted, and history."
        />
      }
    >
      <AdminVettingKpiStrip metrics={kpiMetrics} />
      {renderQueueTable(
        'Pending review',
        'New submissions awaiting first admin review.',
        workflow.pending,
        'No pending users',
      )}
      {renderQueueTable(
        'Changes requested',
        'Users asked to update profile or documents.',
        workflow.changes_requested,
        'No change requests',
      )}
      {renderQueueTable(
        'Resubmitted',
        'Users who resubmitted after requested changes.',
        workflow.resubmitted,
        'No resubmissions',
      )}
      {renderQueueTable(
        'Approved / rejected history',
        'Completed vetting decisions.',
        workflow.history,
        'No vetting history yet',
        true,
      )}

      <VettingReviewDialog
        open={Boolean(reviewing)}
        onOpenChange={(open) => {
          if (!open) setReviewing(null)
        }}
        userLabel={reviewing?.user.profile?.name ?? reviewing?.user.email ?? 'User'}
        onSubmit={(payload) => {
          if (!reviewing) return
          const partyId = reviewing.activeParty?.id ?? reviewing.user.id
          if (payload.action === 'approve') {
            const result = executeApproveVetting(reviewing.user.id, partyId, reviewerId)
            if (!result.ok) {
              toast.error(result.error ?? 'Approve failed')
              return
            }
            toast.success('Vetting approved')
          } else if (payload.action === 'reject') {
            const result = executeRejectVetting(
              reviewing.user.id,
              partyId,
              reviewerId,
              payload.reviewNotes,
            )
            if (!result.ok) {
              toast.error(result.error ?? 'Reject failed')
              return
            }
            toast.success('Vetting rejected')
          } else {
            if (!payload.reviewNotes || payload.requestedItems.length === 0) {
              toast.error('Review notes and requested items are required.')
              return
            }
            const result = executeRequestVettingClarification({
              userId: reviewing.user.id,
              partyId,
              reviewerId,
              reason: payload.reviewNotes,
              requestedItems: payload.requestedItems,
              dueDate: payload.dueDate,
            })
            if (!result.ok) {
              toast.error(result.error ?? 'Request failed')
              return
            }
            toast.success('Changes requested')
          }
          setReviewing(null)
        }}
      />
    </PmPage>
  )
}

export function AdminOpportunitiesPage() {
  const { productLanguage } = useProductLanguage()
  const opps = opportunitiesApi.list()

  return (
    <AdminListPage
      title={productLanguage.plural('opportunity')}
      description="Platform opportunity oversight."
      data={opps}
      getRowId={(o) => o.id}
      getSearchText={(o) => [o.title, o.status, o.location].filter(Boolean).join(' ')}
      searchPlaceholder="Search opportunities…"
      columns={[
        { id: 'title', label: 'Title', cell: (o) => o.title },
        {
          id: 'status',
          label: 'Status',
          cell: (o) => <AdminStatusBadge status={o.status} entity="opportunity" />,
        },
        { id: 'location', label: 'Location', cell: (o) => o.location },
        {
          id: 'readiness',
          label: 'Readiness',
          cell: (o) => {
            const readiness = resolveOpportunityReadiness(o)
            return (
              <PmReadinessScoreBadge
                score={readiness.score}
                variant="admin"
                explanation={{
                  missingRequired: readiness.missingRequired,
                  missingRecommended: readiness.missingRecommended,
                }}
              />
            )
          },
        },
        { id: 'updated', label: 'Updated', cell: (o) => formatDate(o.updatedAt) },
      ]}
    />
  )
}

export function AdminMatchingPage() {
  const { user } = useAuth()
  const version = useDataStoreVersion()
  const [isRunning, setIsRunning] = useState(false)
  const matches = useMemo(() => matchesApi.list(), [version])
  const matchingRuns = useMemo(
    () =>
      adminApi
        .getAuditLog()
        .filter(isMatchingRunAuditEntry)
        .map((entry) => parseMatchingRunAuditDetails(entry))
        .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
        .slice(0, 10),
    [version],
  )

  function handleRunCircularMatching() {
    if (isRunning) return
    setIsRunning(true)

    try {
      const result = runCircularMatchingUiAction({
        userId: user?.id,
        userRole: user?.role,
      })
      if (!result.success) {
        showCircularMatchingAccessDenied(result.message)
        return
      }
      showCircularMatchingFeedback(result)
    } catch (error) {
      toast.error('Circular matching failed.', {
        description: error instanceof Error ? error.message : 'Unexpected error',
      })
    } finally {
      setIsRunning(false)
    }
  }

  const runColumns: PmDataTableColumn<(typeof matchingRuns)[number]>[] = [
    { id: 'runId', label: 'Run ID', cell: (r) => r.runId },
    { id: 'status', label: 'Status', cell: (r) => <AdminStatusBadge status={r.status} /> },
    { id: 'discovered', label: 'Discovered', cell: (r) => String(r.discoveredMatchesCount) },
    { id: 'skipped', label: 'Skipped', cell: (r) => String(r.skippedDuplicatesCount) },
    { id: 'errors', label: 'Errors', cell: (r) => String(r.matchingErrorsCount) },
    { id: 'completed', label: 'Completed', cell: (r) => formatDate(r.completedAt) },
  ]

  const matchColumns: PmDataTableColumn<(typeof matches)[number]>[] = [
    { id: 'id', label: 'ID', cell: (m) => m.id },
    { id: 'type', label: 'Type', cell: (m) => resolvePostMatchTopologyLabel(m) },
    { id: 'score', label: 'Score', cell: (m) => (
      <PmMatchScoreBadge
        score={m.matchScore}
        variant="tooltip"
        breakdown={m.payload?.breakdown ?? m.matchCriteria}
      />
    ) },
    {
      id: 'status',
      label: 'Status',
      cell: (m) => <AdminStatusBadge status={m.status} entity="match" />,
    },
  ]

  return (
    <PmPage
      header={
        <PmPageHeader
          label="Admin"
          title="Matching engine"
          description="Run matching, review queues, and diagnostics."
          metric={<PmPageHeroMetric value={matches.length} label="Matches" />}
          badges={
            <PmBadge tone="muted">{matchingRuns.length} recent runs</PmBadge>
          }
          actions={
            <PmButton disabled={isRunning} onClick={handleRunCircularMatching}>
              {isRunning ? 'Running circular matching…' : 'Run circular matching'}
            </PmButton>
          }
        />
      }
    >
      <div className="space-y-8">
        <section className="space-y-4">
          <PmSectionHeader
            title="Recent matching runs"
            description="Audit trail for manual circular matching jobs."
          />
          <PmDataTable
            density="compact"
            columns={runColumns}
            data={matchingRuns}
            getRowId={(r) => r.runId}
            caption="Recent matching runs"
            empty={
              <PmTableEmpty
                variant="no-data"
                title="No matching runs yet"
                description="Run circular matching to populate the audit trail."
              />
            }
          />
        </section>

        <section className="space-y-4">
          <PmSectionHeader title="Recent matches" description="Latest match records." />
          <PmDataTable
            density="compact"
            columns={matchColumns}
            data={matches.slice(0, 10)}
            getRowId={(m) => m.id}
            caption="Recent matches"
            toolbar={
              <PmToolbarSurface>
                <PmTableToolbar />
              </PmToolbarSurface>
            }
            empty={<PmTableEmpty variant="no-data" title="No matches" />}
          />
        </section>
      </div>
    </PmPage>
  )
}

export function AdminNegotiationsPage() {
  const { productLanguage } = useProductLanguage()
  const negs = negotiationsApi.list()

  return (
    <AdminListPage
      title={productLanguage.plural('negotiation')}
      description={`${productLanguage.label('negotiation')} command center.`}
      data={negs}
      getRowId={(n) => n.id}
      getRowHref={(n) => `/admin/negotiations/${n.id}`}
      getSearchText={(n) => [n.id, n.status].filter(Boolean).join(' ')}
      columns={[
        { id: 'id', label: 'ID', cell: (n) => n.id },
        {
          id: 'status',
          label: 'Status',
          cell: (n) => (
            <AdminStatusBadge status={n.status ?? 'pending'} entity="negotiation" />
          ),
        },
        { id: 'updated', label: 'Updated', cell: (n) => formatDate(n.updatedAt) },
      ]}
    />
  )
}

export function AdminDisputesPage() {
  return (
    <AdminListPage
      title="Disputes"
      description="Dispute resolution queue."
      data={[] as { id: string; status: string }[]}
      getRowId={(d) => d.id}
      emptyTitle="No disputes in seed"
      emptyDescription="Dispute queue is empty in the current dataset."
      showPagination={false}
      columns={[
        { id: 'id', label: 'ID', cell: (d) => d.id },
        { id: 'status', label: 'Status', cell: (d) => d.status },
      ]}
    />
  )
}

export function AdminDealsPage() {
  const { productLanguage } = useProductLanguage()
  const deals = dealsApi.list()

  return (
    <AdminListPage
      title={productLanguage.plural('commercialAgreement')}
      description="All platform commercial agreements."
      data={deals}
      getRowId={(d) => d.id}
      getRowHref={(d) => `/admin/commercial-agreements/${d.id}`}
      getSearchText={(d) => [d.id, d.status].filter(Boolean).join(' ')}
      columns={[
        { id: 'id', label: 'ID', cell: (d) => d.id },
        {
          id: 'status',
          label: 'Status',
          cell: (d) => (
            <AdminStatusBadge status={d.status ?? 'pending'} entity="deal" />
          ),
        },
      ]}
    />
  )
}

export function AdminContractsPage() {
  const { productLanguage } = useProductLanguage()
  const contracts = contractsApi.list()

  return (
    <AdminListPage
      title={productLanguage.plural('contract')}
      description="All platform contracts."
      data={contracts}
      getRowId={(c) => c.id}
      getRowHref={(c) => `/admin/contracts/${c.id}`}
      getSearchText={(c) => [c.id, c.status, c.paymentMode].filter(Boolean).join(' ')}
      searchPlaceholder="Search contracts…"
      columns={[
        { id: 'id', label: 'ID', cell: (c) => c.id },
        {
          id: 'paymentMode',
          label: 'Payment mode',
          cell: (c) => c.paymentMode ?? '—',
        },
        {
          id: 'status',
          label: 'Status',
          cell: (c) => <AdminStatusBadge status={c.status} entity="contract" />,
        },
      ]}
    />
  )
}

export function AdminConsortiumPage() {
  const consortiumMatches = matchesApi.list().filter((m) =>
    m.matchType.includes('consortium'),
  )

  return (
    <AdminListPage
      title="Consortium"
      description="Consortium commercial agreements subset."
      data={consortiumMatches}
      getRowId={(m) => m.id}
      getSearchText={(m) => [m.id, m.matchType].join(' ')}
      columns={[
        { id: 'match', label: 'Match', cell: (m) => m.id },
        { id: 'type', label: 'Type', cell: (m) => resolvePostMatchTopologyLabel(m) },
      ]}
    />
  )
}

export function AdminAuditPage() {
  const logs = adminApi.getAuditLog()

  return (
    <AdminListPage
      title="Audit log"
      description="Compliance and activity trail."
      data={logs}
      getRowId={(l) => l.id}
      getSearchText={(l) => [l.action, l.userId].filter(Boolean).join(' ')}
      searchPlaceholder="Search audit log…"
      columns={[
        { id: 'action', label: 'Action', cell: (l) => l.action },
        { id: 'actor', label: 'Actor', cell: (l) => l.userId ?? '—' },
        { id: 'time', label: 'Time', cell: (l) => formatDate(l.timestamp) },
      ]}
    />
  )
}

function AdminPlaceholderPage({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return <AdminPlannedShell title={title} description={description} />
}

export function AdminSkillsPage() {
  return (
    <AdminPlaceholderPage
      title="Skills catalog"
      description="Canonical skills and lookup editor."
    />
  )
}

export function AdminCollaborationModelsPage() {
  return (
    <AdminPlaceholderPage
      title="Collaboration models"
      description="Enable and order platform collaboration models."
    />
  )
}

export function AdminSiteContentPage() {
  return (
    <AdminPlaceholderPage
      title="Site content"
      description="CMS for public marketing pages."
    />
  )
}

export function AdminSubscriptionsPage() {
  const rows = [
    { id: 'professional', plan: 'Professional', status: 'Active' },
    { id: 'enterprise', plan: 'Enterprise', status: 'Active' },
  ] as const

  return (
    <AdminListPage
      title="Subscriptions"
      description="Plans and assignments (POC)."
      data={rows}
      getRowId={(r) => r.id}
      showPagination={false}
      columns={[
        { id: 'plan', label: 'Plan', cell: (r) => r.plan },
        {
          id: 'status',
          label: 'Status',
          cell: (r) => <AdminStatusBadge status={r.status.toLowerCase()} />,
        },
      ]}
    />
  )
}
