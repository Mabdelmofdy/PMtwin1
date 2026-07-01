import { Link, useParams } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { adminApi } from '@/api/admin.ts'
import { dealsApi } from '@/api/deals.ts'
import { matchesApi } from '@/api/matches.ts'
import { negotiationsApi } from '@/api/negotiations.ts'
import { opportunitiesApi } from '@/api/opportunities.ts'
import { peopleApi } from '@/api/people.ts'
import {
  buildReadinessAnalytics,
  createCreatorProfileResolver,
} from '@/domain/readiness-analytics/index.ts'
import { buildMatchingQualityAnalytics } from '@/domain/matching-quality/index.ts'
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
import {
  PmDataTable,
  PmTableEmpty,
  PmTableToolbar,
  type PmDataTableColumn,
} from '@/components/data/pm-data-index'
import {
  PmForm,
  PmFormReadonly,
  PmFormReadonlyField,
  PmFormReadonlySection,
  PmFormSection,
} from '@/components/forms/pm-form-index'
import {
  PmContentCard,
  PmDashboardLayout,
  PmMetricGrid,
  PmPageLayout,
  PmSectionHeader,
  formatPlatformHealthMetric,
} from '@/components/layout/pm-layout-index'
import { PmBadge, PmButton, PmPageHeader, PmPageHeroMetric, PmMoreActions, PmReadinessScoreBadge, PmStatCard, PmMatchScoreBadge } from '@/components/ui/pm-index'
import { resolveOpportunityReadiness } from '@/components/readiness/opportunity-readiness-card'
import { AdminListPage } from '@/pages/admin/admin-list-page'
import { AdminStatusBadge } from '@/pages/admin/admin-display'

export function AdminDashboardPage() {
  const version = useDataStoreVersion()
  const opps = opportunitiesApi.list().length
  const users = peopleApi.listUsers().length
  const matches = matchesApi.list().length
  const pendingVetting = adminApi.getPendingUsers().length

  const readinessAnalytics = useMemo(() => {
    const profiles = peopleApi.listAll().map((person) => ({
      profile: person.profile,
      profileKind: person.profile?.type === 'company' ? 'company' as const : 'individual' as const,
    }))

    return buildReadinessAnalytics({
      profiles,
      opportunities: opportunitiesApi.list(),
      resolveProfileForOpportunity: createCreatorProfileResolver((id) => peopleApi.get(id)),
    })
  }, [version])

  const matchingQuality = useMemo(() => {
    const profiles = peopleApi.listAll().map((person) => ({
      profile: person.profile,
      profileKind: person.profile?.type === 'company' ? 'company' as const : 'individual' as const,
    }))

    return buildMatchingQualityAnalytics({
      profiles,
      opportunities: opportunitiesApi.list(),
      matches: matchesApi.list(),
      negotiations: negotiationsApi.list(),
      deals: dealsApi.list(),
    })
  }, [version])

  const auditEntries = adminApi.getAuditLog().slice(0, 5)
  const platformHealth = formatPlatformHealthMetric(
    readinessAnalytics.profiles.averageScore,
    matchingQuality.averageMatchScore,
  )

  return (
    <PmDashboardLayout
      header={
        <PmPageHeader
          label="Admin"
          title="Command center"
          description="Platform KPIs, queues, and quick actions."
          metric={
            <PmPageHeroMetric value={platformHealth} label="Platform health" />
          }
          badges={
            <>
              <PmBadge tone="success">
                {Math.round(readinessAnalytics.profiles.averageScore)}% readiness
              </PmBadge>
              <PmBadge tone="info">
                {Math.round(matchingQuality.averageMatchScore)}% match quality
              </PmBadge>
              {pendingVetting > 0 ? (
                <PmBadge tone="warning">{pendingVetting} pending vetting</PmBadge>
              ) : null}
            </>
          }
        />
      }
      metrics={
        <PmMetricGrid columns={4}>
          <PmStatCard label="Opportunities" value={opps} dense />
          <PmStatCard label="Users" value={users} dense />
          <PmStatCard label="Post-matches" value={matches} dense />
          <PmStatCard label="Pending vetting" value={pendingVetting} dense />
        </PmMetricGrid>
      }
      quickActions={
        <PmContentCard title="Quick actions">
          <div className="flex flex-wrap items-center gap-2">
            <PmButton size="sm" asChild>
              <Link to="/admin/matching">Run matching</Link>
            </PmButton>
            <PmMoreActions
              label="More admin actions"
              items={[
                { id: 'vetting', label: 'Review vetting', href: '/admin/vetting' },
                { id: 'audit', label: 'View audit log', href: '/admin/audit' },
              ]}
            />
          </div>
        </PmContentCard>
      }
      recentActivity={
        <PmContentCard title="Recent activity">
          {auditEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent audit entries.</p>
          ) : (
            <ul className="space-y-2 text-sm text-muted-foreground">
              {auditEntries.map((a) => (
                <li key={a.id}>
                  {a.action} — {formatDate(a.timestamp)}
                </li>
              ))}
            </ul>
          )}
        </PmContentCard>
      }
    >
      <PmSectionHeader
        title="Matching Readiness Overview"
        description="Readiness quality across profiles and opportunities using current domain evaluators."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <PmContentCard title="Profiles">
          <PmMetricGrid columns={3}>
            <PmStatCard label="Total profiles" value={readinessAnalytics.profiles.total} dense />
            <PmStatCard label="Average score" value={`${Math.round(readinessAnalytics.profiles.averageScore)}%`} dense />
            <PmStatCard label="Ready" value={readinessAnalytics.profiles.ready} dense />
            <PmStatCard label="Needs review" value={readinessAnalytics.profiles.needsReview} dense />
            <PmStatCard label="Incomplete" value={readinessAnalytics.profiles.incomplete} dense />
          </PmMetricGrid>
        </PmContentCard>
        <PmContentCard title="Opportunities">
          <PmMetricGrid columns={3}>
            <PmStatCard label="Total opportunities" value={readinessAnalytics.opportunities.total} dense />
            <PmStatCard label="Average score" value={`${Math.round(readinessAnalytics.opportunities.averageScore)}%`} dense />
            <PmStatCard label="Ready" value={readinessAnalytics.opportunities.ready} dense />
            <PmStatCard label="Needs review" value={readinessAnalytics.opportunities.needsReview} dense />
            <PmStatCard label="Incomplete" value={readinessAnalytics.opportunities.incomplete} dense />
            <PmStatCard label="Draft" value={readinessAnalytics.opportunities.draft} dense />
            <PmStatCard label="Publish blocked" value={readinessAnalytics.opportunities.publishBlocked} dense />
          </PmMetricGrid>
        </PmContentCard>
      </div>

      <PmSectionHeader
        title="Matching Quality Metrics"
        description="Outcome quality across readiness scores, match scores, and collaboration funnel conversion."
        className="mt-6"
      />
      <PmMetricGrid columns={3}>
        <PmStatCard
          label="Average profile readiness"
          value={`${Math.round(matchingQuality.averageProfileReadiness)}%`}
          dense
        />
        <PmStatCard
          label="Average opportunity readiness"
          value={`${Math.round(matchingQuality.averageOpportunityReadiness)}%`}
          dense
        />
        <PmStatCard
          label="Average match score"
          value={`${Math.round(matchingQuality.averageMatchScore)}%`}
          dense
        />
        <PmStatCard
          label="Match acceptance rate"
          value={`${Math.round(matchingQuality.acceptanceRate)}%`}
          hint={`${matchingQuality.acceptedMatches} of ${matchingQuality.totalMatches} matches`}
          dense
        />
        <PmStatCard
          label="Negotiation rate"
          value={`${Math.round(matchingQuality.negotiationRate)}%`}
          hint={`${matchingQuality.negotiationsStarted} negotiations from ${matchingQuality.acceptedMatches} accepted`}
          dense
        />
        <PmStatCard
          label="Deal conversion rate"
          value={`${Math.round(matchingQuality.dealConversionRate)}%`}
          hint={`${matchingQuality.dealsCreated} deals from ${matchingQuality.negotiationsStarted} negotiations`}
          dense
        />
      </PmMetricGrid>
    </PmDashboardLayout>
  )
}

export function AdminReportsPage() {
  const publishedCount = opportunitiesApi.list().filter((o) => o.status === 'published').length

  return (
    <PmPageLayout
      header={
        <PmPageHeader
          label="Admin"
          title="Reports"
          description="Platform analytics and export tools."
          metric={<PmPageHeroMetric value={publishedCount} label="Published opps" />}
        />
      }
    >
      <PmMetricGrid columns={3}>
        <PmStatCard label="New users (30d)" value="12" hint="Demo metric" dense />
        <PmStatCard label="Published opps" value={publishedCount} dense />
        <PmStatCard label="Match rate" value="78%" hint="Demo metric" dense />
      </PmMetricGrid>
    </PmPageLayout>
  )
}

export function AdminHealthPage() {
  const services = ['Data service', 'Matching engine', 'Notifications', 'Auth'] as const

  return (
    <PmPageLayout
      header={
        <PmPageHeader
          label="Admin"
          title="System health"
          description="Service status and data store snapshot."
          metric={<PmPageHeroMetric value={services.length} label="Services" />}
          badges={<PmBadge tone="success">All operational</PmBadge>}
        />
      }
    >
      <PmContentCard title="Services" noPadding>
        <ul className="divide-y divide-border/60">
          {services.map((service) => (
            <li
              key={service}
              className="flex items-center justify-between px-4 py-3 md:px-5"
            >
              <span className="font-medium">{service}</span>
              <AdminStatusBadge status="active" />
            </li>
          ))}
        </ul>
      </PmContentCard>
    </PmPageLayout>
  )
}

export function AdminUsersPage() {
  const users = peopleApi.listAll()

  return (
    <AdminListPage
      title="Users"
      description="Managed accounts after vetting."
      data={users}
      getRowId={(u) => u.id}
      getRowHref={(u) => `/admin/users/${u.id}`}
      getSearchText={(u) =>
        [u.profile?.name, u.email, u.role, u.status].filter(Boolean).join(' ')
      }
      searchPlaceholder="Search users…"
      columns={[
        { id: 'name', label: 'Name', cell: (u) => u.profile?.name ?? u.id },
        { id: 'email', label: 'Email', cell: (u) => u.email },
        { id: 'role', label: 'Role', cell: (u) => u.role },
        {
          id: 'status',
          label: 'Status',
          cell: (u) => <AdminStatusBadge status={u.status} />,
        },
      ]}
    />
  )
}

export function AdminUserDetailPage() {
  const { id } = useParams()
  const user = id ? peopleApi.get(id) : undefined

  return (
    <PmPageLayout
      header={
        <PmPageHeader
          title={user?.profile?.name ?? 'User detail'}
          description={user?.email}
        />
      }
    >
      <PmFormReadonly>
        <PmFormReadonlySection title="Account" description="Admin user inspector — documents, activity, decisions">
          <PmFormReadonlyField label="User ID" value={user?.id} />
          <PmFormReadonlyField label="Email" value={user?.email} />
          <PmFormReadonlyField label="Role" value={user?.role} />
          <PmFormReadonlyField label="Status">
            {user?.status ? <AdminStatusBadge status={user.status} /> : null}
          </PmFormReadonlyField>
          <PmFormReadonlyField label="Created" value={user?.createdAt ? formatDate(user.createdAt) : null} />
        </PmFormReadonlySection>
      </PmFormReadonly>
    </PmPageLayout>
  )
}

export function AdminVettingPage() {
  const pending = adminApi.getPendingUsers()

  return (
    <AdminListPage
      label="Queue"
      title="Vetting"
      description="Pre-approval user queue."
      data={pending}
      getRowId={(u) => u.id}
      getSearchText={(u) => [u.profile?.name, u.email].filter(Boolean).join(' ')}
      searchPlaceholder="Search queue…"
      emptyTitle="No pending users"
      emptyDescription="The vetting queue is empty."
      columns={[
        { id: 'name', label: 'Name', cell: (u) => u.profile?.name ?? u.id },
        { id: 'email', label: 'Email', cell: (u) => u.email },
        { id: 'submitted', label: 'Submitted', cell: (u) => formatDate(u.createdAt) },
      ]}
    />
  )
}

export function AdminOpportunitiesPage() {
  const opps = opportunitiesApi.list()

  return (
    <AdminListPage
      title="Opportunities"
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
    { id: 'type', label: 'Type', cell: (m) => m.matchType },
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
    <PmPageLayout
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
          <PmSectionHeader title="Recent matches" description="Latest post-match records." />
          <PmDataTable
            density="compact"
            columns={matchColumns}
            data={matches.slice(0, 10)}
            getRowId={(m) => m.id}
            caption="Recent matches"
            toolbar={
              <PmTableToolbar className="pm-toolbar-surface rounded-xl px-4 py-3" />
            }
            empty={<PmTableEmpty variant="no-data" title="No matches" />}
          />
        </section>
      </div>
    </PmPageLayout>
  )
}

export function AdminNegotiationsPage() {
  const negs = negotiationsApi.list()

  return (
    <AdminListPage
      title="Negotiations"
      description="Negotiation command center."
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

export function AdminNegotiationDetailPage() {
  return (
    <PmPageLayout
      header={
        <PmPageHeader
          title="Negotiation detail"
          description="Admin inspector with transcript export."
        />
      }
    >
      <PmContentCard>
        <p className="text-sm text-muted-foreground">
          Negotiation inspector — wire transcript export on migration.
        </p>
      </PmContentCard>
    </PmPageLayout>
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
  const deals = dealsApi.list()

  return (
    <AdminListPage
      title="Deals"
      description="All platform deals."
      data={deals}
      getRowId={(d) => d.id}
      getRowHref={(d) => `/admin/deals/${d.id}`}
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
  return (
    <AdminListPage
      title="Contracts"
      description="All platform contracts."
      data={[] as { id: string; status: string }[]}
      getRowId={(c) => c.id}
      emptyTitle="No contracts in seed"
      emptyDescription="Contract records will appear here when available."
      showPagination={false}
      columns={[
        { id: 'id', label: 'ID', cell: (c) => c.id },
        { id: 'status', label: 'Status', cell: (c) => c.status },
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
      description="Consortium deals subset."
      data={consortiumMatches}
      getRowId={(m) => m.id}
      getSearchText={(m) => [m.id, m.matchType].join(' ')}
      columns={[
        { id: 'match', label: 'Match', cell: (m) => m.id },
        { id: 'type', label: 'Type', cell: (m) => m.matchType },
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

export function AdminSettingsPage() {
  return (
    <PmPageLayout
      header={
        <PmPageHeader
          title="Platform settings"
          description="General, branding, security, matching, and feature flags."
        />
      }
    >
      <PmForm onSubmit={(e) => e.preventDefault()} readOnly>
        <PmFormSection
          title="General"
          description="Vertical settings tabs — wire to system_settings."
        >
          <p className="text-sm text-muted-foreground">
            Settings form migration placeholder. Connect fields when backend wiring is ready.
          </p>
        </PmFormSection>
        <PmFormSection title="Security" description="Authentication and access policies.">
          <p className="text-sm text-muted-foreground">Read-only until settings API is connected.</p>
        </PmFormSection>
      </PmForm>
    </PmPageLayout>
  )
}

function AdminPlaceholderPage({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <PmPageLayout
      header={<PmPageHeader title={title} description={description} />}
    >
      <PmTableEmpty variant="no-data" title={`${title} — coming soon`} description={description} />
    </PmPageLayout>
  )
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
