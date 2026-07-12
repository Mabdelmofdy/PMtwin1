import { useMemo } from 'react'
import { dealsApi } from '@/api/deals.ts'
import { matchesApi } from '@/api/matches.ts'
import { negotiationsApi } from '@/api/negotiations.ts'
import { opportunitiesApi } from '@/api/opportunities.ts'
import { peopleApi } from '@/api/people.ts'
import { buildMatchingQualityAnalytics } from '@/domain/matching-quality/index.ts'
import { useDataStoreVersion } from '@/hooks/use-data-store'
import { useProductLanguage } from '@/providers/product-language-provider.tsx'
import { PmContentCard, PmMetricGrid } from '@/components/layout/pm-layout-index'
import { PmPage, PmPageHeader, PmStatCard } from '@/components/ui/pm-index'

export function AdminMatchingQualityPage() {
  const { productLanguage } = useProductLanguage()
  const version = useDataStoreVersion()
  const quality = useMemo(() => {
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
          label="Marketplace"
          title="Matching Quality"
          description="Live matching quality analytics from repositories — no hardcoded rates."
        />
      }
    >
      <PmMetricGrid columns={3}>
        <PmStatCard
          label="Average match score"
          value={`${Math.round(quality.averageMatchScore)}%`}
          dense
        />
        <PmStatCard label="Total matches" value={quality.totalMatches} dense />
        <PmStatCard label="Accepted matches" value={quality.acceptedMatches} dense />
        <PmStatCard
          label="Acceptance rate"
          value={`${Math.round(quality.acceptanceRate)}%`}
          dense
        />
        <PmStatCard
          label={productLanguage.plural('negotiation')}
          value={quality.negotiationsStarted}
          dense
        />
        <PmStatCard
          label={productLanguage.plural('commercialAgreement')}
          value={quality.dealsCreated}
          dense
        />
      </PmMetricGrid>
      <PmContentCard title="Conversion" className="mt-6">
        <PmMetricGrid columns={3}>
          <PmStatCard
            label="Negotiation rate"
            value={`${Math.round(quality.negotiationRate)}%`}
            dense
          />
          <PmStatCard
            label="CA conversion"
            value={`${Math.round(quality.dealConversionRate)}%`}
            dense
          />
          <PmStatCard
            label="Avg opportunity readiness"
            value={`${Math.round(quality.averageOpportunityReadiness)}%`}
            dense
          />
        </PmMetricGrid>
      </PmContentCard>
    </PmPage>
  )
}
