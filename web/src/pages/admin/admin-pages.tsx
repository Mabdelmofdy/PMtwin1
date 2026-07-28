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
export { AdminOpportunityDetailPage } from './marketplace/admin-opportunity-detail-page.tsx'
export { AdminApprovalsPage } from './commercial/admin-approvals-page.tsx'
export { AdminAwardsPage } from './commercial/admin-awards-page.tsx'
export { AdminLegalReviewPage } from './commercial/admin-legal-review-page.tsx'
export { AdminVettingConfigPage } from './onboarding/admin-vetting-config-page.tsx'
export { AdminOnboardingCenterPage } from './onboarding/admin-onboarding-center-page.tsx'

export { AdminFailedCommandsPage } from './system/admin-failed-commands-page.tsx'
export { AdminNegotiationDetailPage } from './commercial/admin-negotiation-detail-page.tsx'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { adminApi } from '@/api/admin.ts'
import { contractsApi } from '@/api/contracts.ts'
import { dealsApi } from '@/api/deals.ts'
import { matchesApi } from '@/api/matches.ts'
import { negotiationsApi } from '@/api/negotiations.ts'
import { opportunitiesApi } from '@/api/opportunities.ts'
import {
  formatUserEmployeeNumber,
  formatUserPresentation,
  looksLikeInternalId,
  safeEnterpriseLabel,
} from '@/lib/enterprise-display.ts'
import { useAdminReactiveList } from '@/hooks/use-admin-reactive-list.ts'
import {
  adminContractSearchText,
  adminDealSearchText,
  adminNegotiationSearchText,
  adminOpportunitySearchText,
  adminPostMatchSearchText,
  buildAdminContractListColumns,
  buildAdminDealListColumns,
  buildAdminNegotiationListColumns,
  buildAdminOpportunityListColumns,
  buildAdminPostMatchListColumns,
} from '@/pages/admin/admin-portal-list-columns.tsx'
import { formatEnterpriseSubjectLine } from '@/domain/admin/read-models/enterprise-subject-adapter.ts'
import { peopleApi } from '@/api/people.ts'
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
import {
  showPublishMatchingAccessDenied,
  showPublishMatchingFeedback,
} from '@/lib/run-publish-matching-feedback.ts'
import { runPublishMatchingUiAction } from '@/lib/run-publish-matching-ui-action.ts'
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
import { denyUnlessAuthorized } from '@/domain/admin/auth/admin-mutation-auth.ts'
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
import { PmBadge, PmButton, PmPage, PmPageHeader, PmPageHeroMetric } from '@/components/ui/pm-index'
import { PmToolbarSurface } from '@/components/ui/pm-toolbar-surface'
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
  const kpiMetrics = useMemo(() => computeAdminVettingKpiMetrics(workflow), [version])
  const [reviewing, setReviewing] = useState<VettingWorkflowEntry | null>(null)
  const canManageVetting = !denyUnlessAuthorized(user?.role, 'admin.vetting.manage')

  useEffect(() => {
    adminApi.syncVettingSla()
  }, [])

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
                label: 'Full Name',
                cell: (entry) => formatUserPresentation(entry.user).fullName,
              },
              {
                id: 'employeeNumber',
                label: 'User Number',
                cell: (entry) => formatUserPresentation(entry.user).employeeNumber,
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
                  const reviewerLabel = reviewedBy
                    ? (() => {
                        const reviewer = peopleApi.get(reviewedBy)
                        return reviewer
                          ? formatUserPresentation(reviewer).fullName
                          : looksLikeInternalId(reviewedBy)
                            ? formatUserEmployeeNumber(reviewedBy)
                            : reviewedBy
                      })()
                    : null
                  if (!reviewNotes && requestedItems.length === 0 && !reviewerLabel) {
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
                      {reviewerLabel ? (
                        <p className={cn(pmTypography.caption)}>Reviewed by {reviewerLabel}</p>
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
                    disabled={
                      !canManageVetting ||
                      entry.user.status === 'active' ||
                      entry.user.status === 'rejected'
                    }
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
          badges={
            canManageVetting ? undefined : (
              <PmBadge tone="warning">Read-only — missing admin.vetting.manage</PmBadge>
            )
          }
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
          const denied = denyUnlessAuthorized(user?.role, 'admin.vetting.manage')
          if (denied) {
            toast.error(denied)
            return
          }
          const partyId = reviewing.activeParty?.id ?? reviewing.user.id
          if (payload.action === 'approve') {
            const result = executeApproveVetting(
              reviewing.user.id,
              partyId,
              reviewerId,
              user?.role,
            )
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
              user?.role,
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
              actorRole: user?.role,
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
  const opps = useAdminReactiveList(() => opportunitiesApi.list())
  const opportunityLabel = productLanguage.label('opportunity')

  return (
    <AdminListPage
      title={productLanguage.plural('opportunity')}
      description="Same opportunity records as the user portal, with platform oversight columns."
      storageKey="opportunities"
      data={opps}
      getRowId={(o) => o.id}
      getRowHref={(o) => `/admin/opportunities/${o.id}`}
      getSearchText={adminOpportunitySearchText}
      searchPlaceholder="Search opportunities…"
      getRowActions={(o) => [
        {
          id: 'open',
          label: 'Open',
          onSelect: () => {
            window.location.assign(`/admin/opportunities/${o.id}`)
          },
        },
        {
          id: 'timeline',
          label: 'Timeline',
          onSelect: () => {
            window.location.assign(`/admin/opportunities/${o.id}`)
          },
        },
        {
          id: 'related',
          label: 'Related Objects',
          onSelect: () => {
            window.location.assign(`/admin/opportunities/${o.id}`)
          },
        },
        {
          id: 'audit',
          label: 'Audit',
          onSelect: () => {
            window.location.assign('/admin/audit')
          },
        },
        {
          id: 'moderate',
          label: 'Moderate',
          onSelect: () => {
            window.location.assign('/admin/moderation')
          },
        },
      ]}
      columns={buildAdminOpportunityListColumns({ opportunityLabel })}
    />
  )
}

export function AdminMatchingPage() {
  const { user } = useAuth()
  const version = useDataStoreVersion()
  const [isRunning, setIsRunning] = useState(false)
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null)
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
  const selectedRun = useMemo(
    () => matchingRuns.find((run) => run.runId === selectedRunId) ?? matchingRuns[0] ?? null,
    [matchingRuns, selectedRunId],
  )
  const diagnostic = selectedRun?.diagnosticSummary

  function handleRunPublishMatching() {
    if (isRunning) return
    setIsRunning(true)

    try {
      const result = runPublishMatchingUiAction({
        userId: user?.id,
        userRole: user?.role,
      })
      if (!result.success) {
        showPublishMatchingAccessDenied(result.message)
        return
      }
      showPublishMatchingFeedback(result)
    } catch (error) {
      toast.error('Matching failed.', {
        description: error instanceof Error ? error.message : 'Unexpected error',
      })
    } finally {
      setIsRunning(false)
    }
  }

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
    { id: 'runId', label: 'Run', cell: (r) => `Run ${formatDate(r.completedAt)}` },
    { id: 'status', label: 'Status', cell: (r) => <AdminStatusBadge status={r.status} /> },
    { id: 'discovered', label: 'Discovered', cell: (r) => String(r.discoveredMatchesCount) },
    { id: 'skipped', label: 'Skipped', cell: (r) => String(r.skippedDuplicatesCount) },
    { id: 'errors', label: 'Errors', cell: (r) => String(r.matchingErrorsCount) },
    {
      id: 'scanned',
      label: 'Scanned',
      cell: (r) => String(r.diagnosticSummary?.scannedCount ?? '—'),
    },
    { id: 'completed', label: 'Completed', cell: (r) => formatDate(r.completedAt) },
    {
      id: 'diagnostics',
      label: 'Diagnostics',
      cell: (r) => (
        <PmButton
          variant="outline"
          size="sm"
          onClick={() => setSelectedRunId(r.runId)}
        >
          View
        </PmButton>
      ),
    },
  ]

  const diagnosticColumns: PmDataTableColumn<
    NonNullable<typeof diagnostic>['candidates'][number]
  >[] = [
    {
      id: 'candidate',
      label: 'Candidate',
      cell: (c) => c.candidateOpportunityId || '—',
    },
    {
      id: 'result',
      label: 'Result',
      cell: (c) => (c.result === 'matched' ? 'PostMatch Created' : 'Rejected'),
    },
    {
      id: 'reason',
      label: 'Reason',
      cell: (c) => c.rejectReason ?? (c.result === 'matched' ? '—' : '—'),
    },
    {
      id: 'score',
      label: 'Score',
      cell: (c) => (c.finalScore != null ? c.finalScore.toFixed(3) : '—'),
    },
    {
      id: 'location',
      label: 'Location',
      cell: (c) =>
        c.locationTier
          ? `${c.locationTier}${c.locationScore != null ? ` (${c.locationScore})` : ''}`
          : '—',
    },
    {
      id: 'failed',
      label: 'Failed checks',
      cell: (c) => (c.failedChecks?.length ? c.failedChecks.join(', ') : '—'),
    },
  ]

  const getOpportunity = (id: string) => opportunitiesApi.get(id)
  const matchColumns = buildAdminPostMatchListColumns({ getOpportunity })

  return (
    <PmPage
      header={
        <PmPageHeader
          label="Admin"
          title="Matching engine"
          description="Publish auto-discovers Need↔Offer matches. Use batch tools only for recovery or backfill."
          metric={<PmPageHeroMetric value={matches.length} label="Matches" />}
          badges={
            <PmBadge tone="muted">{matchingRuns.length} recent runs</PmBadge>
          }
          actions={
            <div className="flex flex-wrap gap-2">
              <PmButton disabled={isRunning} onClick={handleRunPublishMatching}>
                {isRunning ? 'Running matching…' : 'Re-run matching'}
              </PmButton>
              <PmButton
                variant="outline"
                disabled={isRunning}
                onClick={handleRunCircularMatching}
              >
                Re-run circular
              </PmButton>
            </div>
          }
        />
      }
    >
      <div className="space-y-8">
        <section className="space-y-4">
          <PmSectionHeader
            title="Recent matching runs"
            description="Audit trail for publish matching and admin recovery jobs."
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
                description="Matches are created automatically when opportunities are published. Use Re-run matching only for recovery."
              />
            }
          />
        </section>

        <section className="space-y-4">
          <PmSectionHeader
            title="Matching diagnostics"
            description={
              selectedRun
                ? `Run ${formatDate(selectedRun.completedAt)} — scanned ${diagnostic?.scannedCount ?? 0}, eligible ${diagnostic?.eligibleCount ?? 0}, rejected ${diagnostic?.rejectedCount ?? 0}, matched ${diagnostic?.matchedCount ?? 0}.`
                : 'Select a matching run to inspect per-candidate pass/fail reasons.'
            }
          />
          <PmDataTable
            density="compact"
            columns={diagnosticColumns}
            data={diagnostic?.candidates ?? []}
            getRowId={(c) =>
              `${c.candidateOpportunityId || 'candidate'}-${c.result}-${c.rejectReason ?? 'ok'}`
            }
            caption="Matching diagnostics"
            empty={
              <PmTableEmpty
                variant="no-data"
                title="No diagnostics for this run"
                description="Re-run matching to capture per-candidate rejection and score diagnostics."
              />
            }
          />
        </section>

        <section className="space-y-4">
          <PmSectionHeader
            title="Recent matches"
            description="Latest match records. Need↔Offer pairs appear automatically after both opportunities are published."
          />
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
            empty={
              <PmTableEmpty
                variant="no-data"
                title="No matches"
                description="Publish complementary Need and Offer opportunities (different parties). Re-run matching only if a publish pass was missed."
              />
            }
          />
        </section>
      </div>
    </PmPage>
  )
}

export function AdminNegotiationsPage() {
  const { productLanguage } = useProductLanguage()
  const negs = useAdminReactiveList(() => negotiationsApi.list())
  const getOpportunity = (id: string) => opportunitiesApi.get(id)

  return (
    <AdminListPage
      title={productLanguage.plural('negotiation')}
      description={`Same ${productLanguage.plural('negotiation').toLowerCase()} records as the user portal.`}
      storageKey="negotiations"
      data={negs}
      getRowId={(n) => n.id}
      getRowHref={(n) => `/admin/negotiations/${n.id}`}
      getSearchText={(n) => adminNegotiationSearchText(n, getOpportunity)}
      columns={buildAdminNegotiationListColumns({
        negotiationLabel: productLanguage.label('negotiation'),
        getOpportunity,
      })}
    />
  )
}

export function AdminDisputesPage() {
  return (
    <AdminPlannedShell
      title="Disputes"
      description="Dispute resolution"
      plannedMessage="Dispute workflow is not implemented in Demo/UAT. This route is retained for navigation compatibility only."
    />
  )
}

export function AdminDealsPage() {
  const { productLanguage } = useProductLanguage()
  const deals = useAdminReactiveList(() => dealsApi.list())

  return (
    <AdminListPage
      title={productLanguage.plural('commercialAgreement')}
      description={`Same ${productLanguage.plural('commercialAgreement').toLowerCase()} records as the user portal.`}
      storageKey="commercial-agreements"
      data={deals}
      getRowId={(d) => d.id}
      getRowHref={(d) => `/admin/commercial-agreements/${d.id}`}
      getSearchText={adminDealSearchText}
      getRowActions={(d) => [
        {
          id: 'open',
          label: 'Open',
          onSelect: () => {
            window.location.assign(`/admin/commercial-agreements/${d.id}`)
          },
        },
        {
          id: 'approvals',
          label: 'Approvals',
          onSelect: () => {
            window.location.assign('/admin/approvals')
          },
        },
        {
          id: 'award',
          label: 'Award',
          onSelect: () => {
            window.location.assign('/admin/awards')
          },
        },
        {
          id: 'contract',
          label: productLanguage.label('contract'),
          onSelect: () => {
            window.location.assign('/admin/contracts')
          },
        },
        {
          id: 'audit',
          label: 'Audit',
          onSelect: () => {
            window.location.assign('/admin/audit')
          },
        },
      ]}
      columns={buildAdminDealListColumns()}
    />
  )
}

export function AdminContractsPage() {
  const { productLanguage } = useProductLanguage()
  const contracts = useAdminReactiveList(() => contractsApi.list())

  return (
    <AdminListPage
      title={productLanguage.plural('contract')}
      description={`Same ${productLanguage.plural('contract').toLowerCase()} records as the user portal.`}
      storageKey="contracts"
      data={contracts}
      getRowId={(c) => c.id}
      getRowHref={(c) => `/admin/contracts/${c.id}`}
      getSearchText={adminContractSearchText}
      searchPlaceholder="Search contracts…"
      columns={buildAdminContractListColumns({
        contractLabel: productLanguage.label('contract'),
      })}
    />
  )
}

export function AdminConsortiumPage() {
  const consortiumMatches = useAdminReactiveList(() =>
    matchesApi.list().filter((m) => m.matchType.includes('consortium')),
  )
  const getOpportunity = (id: string) => opportunitiesApi.get(id)

  return (
    <AdminListPage
      title="Consortium"
      description="Consortium matches using the same presentation as the user portal."
      storageKey="consortium"
      data={consortiumMatches}
      getRowId={(m) => m.id}
      getSearchText={(m) => adminPostMatchSearchText(m, getOpportunity)}
      columns={buildAdminPostMatchListColumns({ getOpportunity })}
    />
  )
}

export function AdminAuditPage() {
  const logs = useAdminReactiveList(() => adminApi.getAuditLog())

  return (
    <AdminListPage
      title="Audit log"
      description="Compliance and activity trail."
      storageKey="audit"
      data={logs}
      getRowId={(l) => l.id}
      getSearchText={(l) => {
        const actor = l.userId ? peopleApi.get(l.userId) : undefined
        const actorLabel = actor
          ? formatUserPresentation(actor).fullName
          : ''
        return [l.action, actorLabel, l.entityType].filter(Boolean).join(' ')
      }}
      searchPlaceholder="Search audit log…"
      columns={[
        { id: 'action', label: 'Action', cell: (l) => l.action },
        {
          id: 'actor',
          label: 'Actor',
          cell: (l) => {
            if (!l.userId) return 'System'
            const actor = peopleApi.get(l.userId)
            return actor
              ? formatUserPresentation(actor).fullName
              : looksLikeInternalId(l.userId)
                ? formatUserEmployeeNumber(l.userId)
                : 'Platform user'
          },
        },
        {
          id: 'entity',
          label: 'Record',
          cell: (l) => {
            const subject = formatEnterpriseSubjectLine(l.entityType, l.entityId)
            if (subject) return subject
            if (!l.entityType) return '—'
            return safeEnterpriseLabel(
              String(l.entityType).replace(/_/g, ' '),
              'Platform record',
            )
          },
        },
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
  return (
    <AdminPlannedShell
      title="Subscriptions"
      description="Plans and assignments"
      plannedMessage="Subscription billing is not wired in Demo/UAT. Hardcoded plan rows were removed to avoid presenting fake commercial status."
    />
  )
}
