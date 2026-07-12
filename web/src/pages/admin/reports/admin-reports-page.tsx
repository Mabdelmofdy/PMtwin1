import { useMemo } from 'react'
import { buildCommandCenterSummary } from '@/domain/admin/read-models/command-center-adapter.ts'
import { buildRiskSummary } from '@/domain/admin/read-models/command-center-adapter.ts'
import { buildMatchingQualityAnalytics } from '@/domain/matching-quality/index.ts'
import { dealsApi } from '@/api/deals.ts'
import { matchesApi } from '@/api/matches.ts'
import { negotiationsApi } from '@/api/negotiations.ts'
import { opportunitiesApi } from '@/api/opportunities.ts'
import { peopleApi } from '@/api/people.ts'
import { useDataStoreVersion } from '@/hooks/use-data-store'
import { useProductLanguage } from '@/providers/product-language-provider.tsx'
import { PmMetricGrid } from '@/components/layout/pm-layout-index'
import { PmPage, PmPageHeader, PmPageHeroMetric, PmStatCard } from '@/components/ui/pm-index'

/** Reports — real metrics only from adapters / analytics (no hardcoded demo %). */
export function AdminReportsPage() {
  const { productLanguage } = useProductLanguage()
  const version = useDataStoreVersion()
  const summary = useMemo(() => buildCommandCenterSummary(), [version])
  const risk = useMemo(() => buildRiskSummary(), [version])
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
    <PmPage
      header={
        <PmPageHeader
          label="Admin"
          title="Reports"
          description="Platform analytics from live repositories — no fabricated demo metrics."
          metric={
            <PmPageHeroMetric
              value={summary.publishedOpportunities}
              label={`Published ${productLanguage.plural('opportunity').toLowerCase()}`}
            />
          }
        />
      }
    >
      <PmMetricGrid columns={3}>
        <PmStatCard label="Total users" value={summary.totalUsers} dense />
        <PmStatCard
          label={`Published ${productLanguage.plural('opportunity').toLowerCase()}`}
          value={summary.publishedOpportunities}
          dense
        />
        <PmStatCard
          label="Match acceptance rate"
          value={`${Math.round(matchingQuality.acceptanceRate)}%`}
          dense
        />
        <PmStatCard label="Active matches" value={summary.activeMatches} dense />
        <PmStatCard
          label={productLanguage.plural('commercialAgreement')}
          value={summary.commercialAgreements}
          dense
        />
        <PmStatCard label="Active contracts" value={summary.activeContracts} dense />
        <PmStatCard label="Pending vetting" value={summary.pendingVetting} dense />
        <PmStatCard label="Suspended users" value={risk.suspendedUsers} dense />
        <PmStatCard label="Orphan hints" value={risk.orphanHints} dense />
      </PmMetricGrid>
    </PmPage>
  )
}
