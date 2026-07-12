import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { buildCommandCenterSummary } from '@/domain/admin/read-models/command-center-adapter.ts'
import {
  buildReadinessAnalytics,
  createCreatorProfileResolver,
} from '@/domain/readiness-analytics/index.ts'
import { buildMatchingQualityAnalytics } from '@/domain/matching-quality/index.ts'
import { adminApi } from '@/api/admin.ts'
import { dealsApi } from '@/api/deals.ts'
import { matchesApi } from '@/api/matches.ts'
import { negotiationsApi } from '@/api/negotiations.ts'
import { opportunitiesApi } from '@/api/opportunities.ts'
import { peopleApi } from '@/api/people.ts'
import { useDataStoreVersion } from '@/hooks/use-data-store'
import { formatDate } from '@/lib/format'
import { useProductLanguage } from '@/providers/product-language-provider.tsx'
import {
  PmContentCard,
  PmDashboardLayout,
  PmMetricGrid,
  PmSectionHeader,
  formatPlatformHealthMetric,
} from '@/components/layout/pm-layout-index'
import {
  PmBadge,
  PmEmptyState,
  PmPageActions,
  PmPageHeader,
  PmPageHeroMetric,
  PmStatCard,
} from '@/components/ui/pm-index'
import { MATCHING_MODELS, MATCHING_MODEL_KEYS } from '@/config/need-offer-framework.ts'
import { cn } from '@/lib/utils'
import { pmTypography, resolveMatchTypeStyle } from '@/tokens'

type AdminFunnelStage = {
  readonly id: string
  readonly label: string
  readonly count: number
  readonly hint: string
}

function AdminFunnelBars({ stages }: { readonly stages: readonly AdminFunnelStage[] }) {
  const maxCount = Math.max(1, ...stages.map((stage) => stage.count))
  return (
    <ol className="space-y-3" aria-label="Collaboration funnel">
      {stages.map((stage) => {
        const width = Math.max(4, Math.round((stage.count / maxCount) * 100))
        return (
          <li key={stage.id} className="space-y-1">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className={cn(pmTypography.label)}>{stage.label}</span>
              <span className={cn(pmTypography.caption, 'text-muted-foreground')}>
                {stage.count} · {stage.hint}
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted" role="img" aria-label={`${stage.label}: ${stage.count}`}>
              <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${width}%` }} />
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export function AdminExecutivePage() {
  const { productLanguage } = useProductLanguage()
  const version = useDataStoreVersion()
  const summary = useMemo(() => buildCommandCenterSummary(), [version])

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
          title="Executive Command Center"
          description="Platform KPIs, queues, and quick actions."
          metric={<PmPageHeroMetric value={platformHealth} label="Platform health" />}
          badges={
            <>
              <PmBadge tone="success">{Math.round(readinessAnalytics.profiles.averageScore)}% readiness</PmBadge>
              <PmBadge tone="info">{Math.round(matchingQuality.averageMatchScore)}% match quality</PmBadge>
              {summary.pendingVetting > 0 ? (
                <PmBadge tone="warning">{summary.pendingVetting} pending vetting</PmBadge>
              ) : null}
              <PmBadge tone="muted">{summary.environment}</PmBadge>
            </>
          }
        />
      }
      metrics={
        <PmMetricGrid columns={4}>
          <PmStatCard label={productLanguage.plural('opportunity')} value={summary.publishedOpportunities} dense />
          <PmStatCard label="Users" value={summary.totalUsers} dense />
          <PmStatCard label="Active matches" value={summary.activeMatches} dense />
          <PmStatCard label="Pending vetting" value={summary.pendingVetting} dense />
        </PmMetricGrid>
      }
      quickActions={
        <PmContentCard title="Quick actions">
          <PmPageActions
            primary={{ label: 'Run matching', href: '/admin/matching' }}
            more={[
              { id: 'ops', label: 'Operations', href: '/admin/command-center/operations' },
              { id: 'risk', label: 'Risk & Compliance', href: '/admin/command-center/risk' },
              { id: 'inbox', label: 'Admin Inbox', href: '/admin/inbox' },
              { id: 'vetting', label: 'Review vetting', href: '/admin/vetting' },
              { id: 'audit', label: 'Open audit log', href: '/admin/audit' },
            ]}
          />
          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            <Link className="text-primary underline-offset-4 hover:underline" to="/admin/command-center/operations">Operations</Link>
            <Link className="text-primary underline-offset-4 hover:underline" to="/admin/command-center/risk">Risk</Link>
            <Link className="text-primary underline-offset-4 hover:underline" to="/admin/inbox">Inbox</Link>
          </div>
        </PmContentCard>
      }
      recentActivity={
        <PmContentCard title="Recent activity">
          {auditEntries.length === 0 ? (
            <PmEmptyState title="No recent audit entries" size="compact" />
          ) : (
            <ul className="space-y-2 text-sm text-muted-foreground">
              {auditEntries.map((a) => (
                <li key={a.id}>{a.action} — {formatDate(a.timestamp)}</li>
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
          </PmMetricGrid>
        </PmContentCard>
        <PmContentCard title={productLanguage.plural('opportunity')}>
          <PmMetricGrid columns={3}>
            <PmStatCard label="Total" value={readinessAnalytics.opportunities.total} dense />
            <PmStatCard label="Average score" value={`${Math.round(readinessAnalytics.opportunities.averageScore)}%`} dense />
            <PmStatCard label="Ready" value={readinessAnalytics.opportunities.ready} dense />
          </PmMetricGrid>
        </PmContentCard>
      </div>

      <PmSectionHeader
        title="Matching Quality Metrics"
        description="Outcome quality across readiness scores, match scores, and collaboration funnel conversion."
        className="mt-6"
      />
      <PmMetricGrid columns={3}>
        <PmStatCard label="Average profile readiness" value={`${Math.round(matchingQuality.averageProfileReadiness)}%`} dense />
        <PmStatCard label="Average opportunity readiness" value={`${Math.round(matchingQuality.averageOpportunityReadiness)}%`} dense />
        <PmStatCard label="Average match score" value={`${Math.round(matchingQuality.averageMatchScore)}%`} dense />
      </PmMetricGrid>
      <PmContentCard
        title="Collaboration funnel"
        description="Conversion from discovered matches through negotiations to commercial agreements."
      >
        <AdminFunnelBars
          stages={[
            { id: 'matches', label: 'Matches', count: matchingQuality.totalMatches, hint: 'All discovered matches' },
            { id: 'accepted', label: 'Accepted', count: matchingQuality.acceptedMatches, hint: `${Math.round(matchingQuality.acceptanceRate)}% acceptance rate` },
            { id: 'negotiations', label: productLanguage.plural('negotiation'), count: matchingQuality.negotiationsStarted, hint: `${Math.round(matchingQuality.negotiationRate)}% of accepted matches` },
            { id: 'deals', label: productLanguage.plural('commercialAgreement'), count: matchingQuality.dealsCreated, hint: `${Math.round(matchingQuality.dealConversionRate)}% of negotiations` },
          ]}
        />
      </PmContentCard>

      <PmSectionHeader
        title="Matching models (Need/Offer framework)"
        description="Breakdown by topology model — One Way, Two-Way, Group Formation, Circular Exchange."
        className="mt-6"
      />
      <PmMetricGrid columns={4}>
        {MATCHING_MODEL_KEYS.map((key) => {
          const entry = matchingQuality.byMatchType[key]
          const model = MATCHING_MODELS[key]
          return (
            <PmStatCard
              key={key}
              label={model.label}
              value={entry.total}
              hint={`${entry.accepted} accepted · ${entry.confirmed} confirmed`}
              trend={
                <span className={cn(pmTypography.badge, 'inline-flex items-center rounded-md px-1.5 py-0.5', resolveMatchTypeStyle(key))}>
                  {model.subtitle}
                </span>
              }
              dense
            />
          )
        })}
      </PmMetricGrid>
    </PmDashboardLayout>
  )
}

/** Compatibility alias — prefer AdminExecutivePage. */
export { AdminExecutivePage as AdminDashboardPage }
