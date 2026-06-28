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
import { PageHeader, StatCard, StatusBadge } from '@/components/shared/page-primitives'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

function AdminTablePage({
  label,
  title,
  description,
  columns,
  rows,
  rowLink,
}: {
  label?: string
  title: string
  description: string
  columns: string[]
  rows: (string | React.ReactNode)[][]
  rowLink?: (index: number) => string
}) {
  return (
    <div className="space-y-6">
      <PageHeader label={label} title={title} description={description} />
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((c) => <TableHead key={c}>{c}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, i) => (
                <TableRow key={i} className={rowLink ? 'cursor-pointer' : undefined}>
                  {row.map((cell, j) => (
                    <TableCell key={j}>
                      {rowLink && j === 0 ? <Link to={rowLink(i)} className="font-medium hover:text-primary">{cell}</Link> : cell}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export function AdminDashboardPage() {
  const version = useDataStoreVersion()
  const opps = opportunitiesApi.list().length
  const users = peopleApi.listUsers().length
  const matches = matchesApi.list().length
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

  return (
    <div className="space-y-6">
      <PageHeader label="Admin" title="Command center" description="Platform KPIs, queues, and quick actions." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Opportunities" value={opps} />
        <StatCard label="Users" value={users} />
        <StatCard label="Post-matches" value={matches} />
        <StatCard label="Pending vetting" value={adminApi.getPendingUsers().length} />
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Matching Readiness Overview</h2>
          <p className="text-sm text-muted-foreground">
            Readiness quality across profiles and opportunities using current domain evaluators.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Profiles</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <StatCard label="Total profiles" value={readinessAnalytics.profiles.total} />
              <StatCard label="Average score" value={`${Math.round(readinessAnalytics.profiles.averageScore)}%`} />
              <StatCard label="Ready" value={readinessAnalytics.profiles.ready} />
              <StatCard label="Needs review" value={readinessAnalytics.profiles.needsReview} />
              <StatCard label="Incomplete" value={readinessAnalytics.profiles.incomplete} />
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Opportunities</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <StatCard label="Total opportunities" value={readinessAnalytics.opportunities.total} />
              <StatCard label="Average score" value={`${Math.round(readinessAnalytics.opportunities.averageScore)}%`} />
              <StatCard label="Ready" value={readinessAnalytics.opportunities.ready} />
              <StatCard label="Needs review" value={readinessAnalytics.opportunities.needsReview} />
              <StatCard label="Incomplete" value={readinessAnalytics.opportunities.incomplete} />
              <StatCard label="Draft" value={readinessAnalytics.opportunities.draft} />
              <StatCard label="Publish blocked" value={readinessAnalytics.opportunities.publishBlocked} />
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Matching Quality Metrics</h2>
          <p className="text-sm text-muted-foreground">
            Outcome quality across readiness scores, match scores, and collaboration funnel conversion.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Average profile readiness"
            value={`${Math.round(matchingQuality.averageProfileReadiness)}%`}
          />
          <StatCard
            label="Average opportunity readiness"
            value={`${Math.round(matchingQuality.averageOpportunityReadiness)}%`}
          />
          <StatCard
            label="Average match score"
            value={`${Math.round(matchingQuality.averageMatchScore)}%`}
          />
          <StatCard
            label="Match acceptance rate"
            value={`${Math.round(matchingQuality.acceptanceRate)}%`}
            hint={`${matchingQuality.acceptedMatches} of ${matchingQuality.totalMatches} matches`}
          />
          <StatCard
            label="Negotiation rate"
            value={`${Math.round(matchingQuality.negotiationRate)}%`}
            hint={`${matchingQuality.negotiationsStarted} negotiations from ${matchingQuality.acceptedMatches} accepted`}
          />
          <StatCard
            label="Deal conversion rate"
            value={`${Math.round(matchingQuality.dealConversionRate)}%`}
            hint={`${matchingQuality.dealsCreated} deals from ${matchingQuality.negotiationsStarted} negotiations`}
          />
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Quick actions</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button size="sm" className="cursor-pointer" asChild><Link to="/admin/vetting">Review vetting</Link></Button>
            <Button size="sm" variant="outline" className="cursor-pointer" asChild><Link to="/admin/matching">Run matching</Link></Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Recent activity</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            {adminApi.getAuditLog().slice(0, 5).map((a) => (
              <p key={a.id}>{a.action} — {formatDate(a.timestamp)}</p>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function AdminReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Platform analytics and export tools." />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="New users (30d)" value="12" hint="Demo metric" />
        <StatCard label="Published opps" value={opportunitiesApi.list().filter((o) => o.status === 'published').length} />
        <StatCard label="Match rate" value="78%" hint="Demo metric" />
      </div>
    </div>
  )
}

export function AdminHealthPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="System health" description="Service status and data store snapshot." />
      {['Data service', 'Matching engine', 'Notifications', 'Auth'].map((s) => (
        <div key={s} className="flex items-center justify-between rounded-xl border border-border/60 px-4 py-3">
          <span className="font-medium">{s}</span>
          <StatusBadge status="active" />
        </div>
      ))}
    </div>
  )
}

export function AdminUsersPage() {
  const users = peopleApi.listAll()
  return (
    <AdminTablePage
      title="Users"
      description="Managed accounts after vetting."
      columns={['Name', 'Email', 'Role', 'Status']}
      rows={users.map((u) => [u.profile?.name ?? u.id, u.email, u.role, <StatusBadge key={u.id} status={u.status} />])}
      rowLink={(i) => `/admin/users/${users[i].id}`}
    />
  )
}

export function AdminUserDetailPage() {
  const { id } = useParams()
  const user = id ? peopleApi.get(id) : undefined
  return (
    <div className="space-y-6">
      <PageHeader title={user?.profile?.name ?? 'User detail'} description={user?.email} />
      <Card><CardContent className="py-8 text-sm text-muted-foreground">Admin user inspector — documents, activity, decisions</CardContent></Card>
    </div>
  )
}

export function AdminVettingPage() {
  const pending = adminApi.getPendingUsers()
  return (
    <AdminTablePage
      label="Queue"
      title="Vetting"
      description="Pre-approval user queue."
      columns={['Name', 'Email', 'Submitted']}
      rows={pending.length ? pending.map((u) => [u.profile?.name ?? u.id, u.email, formatDate(u.createdAt)]) : [['—', 'No pending users', '—']]}
    />
  )
}

export function AdminOpportunitiesPage() {
  const opps = opportunitiesApi.list()
  return (
    <AdminTablePage
      title="Opportunities"
      description="Platform opportunity oversight."
      columns={['Title', 'Status', 'Location', 'Updated']}
      rows={opps.slice(0, 20).map((o) => [o.title, <StatusBadge key={o.id} status={o.status} />, o.location, formatDate(o.updatedAt)])}
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

  return (
    <div className="space-y-6">
      <PageHeader title="Matching engine" description="Run matching, review queues, and diagnostics." />
      <div className="flex flex-wrap gap-2">
        <Button
          className="cursor-pointer"
          disabled={isRunning}
          onClick={handleRunCircularMatching}
        >
          {isRunning ? 'Running circular matching…' : 'Run circular matching'}
        </Button>
      </div>
      <AdminTablePage
        title="Recent matching runs"
        description="Audit trail for manual circular matching jobs."
        columns={['Run ID', 'Status', 'Discovered', 'Skipped', 'Errors', 'Completed']}
        rows={
          matchingRuns.length
            ? matchingRuns.map((run) => [
                run.runId,
                run.status,
                String(run.discoveredMatchesCount),
                String(run.skippedDuplicatesCount),
                String(run.matchingErrorsCount),
                formatDate(run.completedAt),
              ])
            : [['—', 'No matching runs yet', '—', '—', '—', '—']]
        }
      />
      <AdminTablePage
        title="Recent matches"
        description=""
        columns={['ID', 'Type', 'Score', 'Status']}
        rows={matches.slice(0, 10).map((m) => [m.id, m.matchType, `${Math.round(m.matchScore * 100)}%`, <StatusBadge key={m.id} status={m.status} />])}
      />
    </div>
  )
}

export function AdminNegotiationsPage() {
  const negs = negotiationsApi.list()
  return (
    <AdminTablePage
      title="Negotiations"
      description="Negotiation command center."
      columns={['ID', 'Status', 'Updated']}
      rows={negs.map((n) => [n.id, <StatusBadge key={n.id} status={n.status ?? 'pending'} />, formatDate(n.updatedAt)])}
      rowLink={(i) => `/admin/negotiations/${negs[i].id}`}
    />
  )
}

export function AdminNegotiationDetailPage() {
  return <div className="space-y-6"><PageHeader title="Negotiation detail" description="Admin inspector with transcript export." /></div>
}

export function AdminDisputesPage() {
  return <AdminTablePage title="Disputes" description="Dispute resolution queue." columns={['ID', 'Status']} rows={[['—', 'No disputes in seed']]} />
}

export function AdminDealsPage() {
  const deals = dealsApi.list()
  return (
    <AdminTablePage
      title="Deals"
      description="All platform deals."
      columns={['ID', 'Status']}
      rows={deals.map((d) => [d.id, d.status ?? 'pending'])}
      rowLink={(i) => `/admin/deals/${deals[i].id}`}
    />
  )
}

export function AdminContractsPage() {
  return <AdminTablePage title="Contracts" description="All platform contracts." columns={['ID', 'Status']} rows={[['—', 'No contracts in seed']]} />
}

export function AdminConsortiumPage() {
  return (
    <AdminTablePage
      title="Consortium"
      description="Consortium deals subset."
      columns={['Match', 'Type']}
      rows={matchesApi.list().filter((m) => m.matchType.includes('consortium')).map((m) => [m.id, m.matchType])}
    />
  )
}

export function AdminAuditPage() {
  const logs = adminApi.getAuditLog()
  return (
    <AdminTablePage
      title="Audit log"
      description="Compliance and activity trail."
      columns={['Action', 'Actor', 'Time']}
      rows={logs.map((l) => [l.action, l.userId ?? '—', formatDate(l.timestamp)])}
    />
  )
}

export function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Platform settings" description="General, branding, security, matching, and feature flags." />
      <Card><CardContent className="py-8 text-sm text-muted-foreground">Vertical settings tabs — wire to system_settings</CardContent></Card>
    </div>
  )
}

export function AdminSkillsPage() {
  return <PageHeader title="Skills catalog" description="Canonical skills and lookup editor." />
}

export function AdminCollaborationModelsPage() {
  return <PageHeader title="Collaboration models" description="Enable and order platform collaboration models." />
}

export function AdminSiteContentPage() {
  return <PageHeader title="Site content" description="CMS for public marketing pages." />
}

export function AdminSubscriptionsPage() {
  return <AdminTablePage title="Subscriptions" description="Plans and assignments (POC)." columns={['Plan', 'Status']} rows={[['Professional', 'Active'], ['Enterprise', 'Active']]} />
}
