import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  buildCommandCenterSummary,
  buildPipelineSummary,
  buildRiskSummary,
} from '@/domain/admin/read-models/command-center-adapter.ts'
import { buildAdminAnalyticsBundle } from '@/domain/admin/read-models/admin-analytics-adapter.ts'
import { buildMatchingQualityAnalytics } from '@/domain/matching-quality/index.ts'
import { dealsApi } from '@/api/deals.ts'
import { matchesApi } from '@/api/matches.ts'
import { negotiationsApi } from '@/api/negotiations.ts'
import { opportunitiesApi } from '@/api/opportunities.ts'
import { peopleApi } from '@/api/people.ts'
import { useDataStoreVersion } from '@/hooks/use-data-store'
import { useProductLanguage } from '@/providers/product-language-provider.tsx'
import {
  AdminConversionFunnel,
  AdminDistributionChart,
  AdminMetricTile,
  AdminTrendChart,
} from '@/components/admin/analytics/admin-analytics-charts.tsx'
import { AdminKpiStrip } from '@/components/admin/workspace/admin-kpi-strip.tsx'
import { PmContentCard } from '@/components/layout/pm-layout-index'
import { PmPage, PmPageHeader, PmBadge } from '@/components/ui/pm-index'

/** Reports — enterprise analytics from live repositories only. */
export function AdminReportsPage() {
  const { productLanguage } = useProductLanguage()
  const version = useDataStoreVersion()
  const summary = useMemo(() => buildCommandCenterSummary(), [version])
  const risk = useMemo(() => buildRiskSummary(), [version])
  const pipeline = useMemo(() => buildPipelineSummary(), [version])
  const analytics = useMemo(() => buildAdminAnalyticsBundle(), [version])
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

  const formatDays = (value: number | null): string =>
    value == null ? '—' : `${Math.round(value)}d`

  return (
    <PmPage
      header={
        <PmPageHeader
          label="Reports"
          title="Analytics"
          description="Trends, distribution, conversion, and velocity from live repositories — no fabricated metrics."
          badges={<PmBadge tone="muted">{summary.environment}</PmBadge>}
        />
      }
    >
      <div className="flex flex-col gap-4">
        <AdminKpiStrip
          items={[
            { label: 'Users', value: summary.totalUsers, href: '/admin/users' },
            {
              label: `Published ${productLanguage.plural('opportunity').toLowerCase()}`,
              value: summary.publishedOpportunities,
              href: '/admin/opportunities?status=published',
            },
            {
              label: 'Acceptance rate',
              value: `${Math.round(matchingQuality.acceptanceRate)}%`,
              href: '/admin/matching/quality',
            },
            {
              label: 'Completion rate',
              value:
                analytics.completionRate == null
                  ? '—'
                  : `${Math.round(analytics.completionRate)}%`,
              href: '/admin/contracts?status=completed',
            },
          ]}
        />

        <div className="grid gap-4 lg:grid-cols-2">
          <AdminConversionFunnel
            title="Pipeline conversion"
            stages={pipeline.stages.map((s) => ({
              id: s.id,
              label: s.label,
              count: s.count,
              href: s.href,
            }))}
          />
          <AdminTrendChart
            title="Matching trend"
            description="Live match status buckets"
            points={analytics.matchingTrend}
            href="/admin/post-matches"
          />
        </div>

        <PmContentCard title="Velocity" description="Average age from available timestamps.">
          <div className="grid gap-3 sm:grid-cols-3">
            <AdminMetricTile
              label="Opportunity age"
              value={formatDays(analytics.velocityDays.avgOpportunityAgeDays)}
              href="/admin/opportunities"
              hint="Avg days since create/update"
            />
            <AdminMetricTile
              label="Negotiation age"
              value={formatDays(analytics.velocityDays.avgNegotiationAgeDays)}
              href="/admin/negotiations"
              hint="Avg days since create/update"
            />
            <AdminMetricTile
              label="Contract age"
              value={formatDays(analytics.velocityDays.avgContractAgeDays)}
              href="/admin/contracts"
              hint="Avg days since create/update"
            />
          </div>
        </PmContentCard>

        <div className="grid gap-4 lg:grid-cols-2">
          <AdminDistributionChart
            title="Top regions"
            buckets={analytics.topRegions}
          />
          <AdminDistributionChart
            title="Top collaboration models"
            buckets={analytics.topCollaborationModels}
          />
          <AdminDistributionChart
            title="Top exchange modes"
            buckets={analytics.topExchangeModes}
          />
          <AdminDistributionChart
            title="Top companies"
            buckets={analytics.topCompanies}
          />
        </div>

        <AdminDistributionChart
          title={`${productLanguage.label('opportunity')} status distribution`}
          buckets={analytics.statusDistribution}
        />

        <PmContentCard title="Risk signals">
          <div className="flex flex-wrap gap-4 text-sm">
            <Link className="text-primary underline-offset-4 hover:underline" to="/admin/users?status=suspended">
              Suspended users: {risk.suspendedUsers}
            </Link>
            <Link className="text-primary underline-offset-4 hover:underline" to="/admin/data-quality">
              Orphan hints: {risk.orphanHints}
            </Link>
            <Link className="text-primary underline-offset-4 hover:underline" to="/admin/vetting">
              Pending vetting: {summary.pendingVetting}
            </Link>
          </div>
        </PmContentCard>
      </div>
    </PmPage>
  )
}
