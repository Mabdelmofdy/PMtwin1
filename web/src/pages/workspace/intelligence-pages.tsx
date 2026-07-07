import { Link } from 'react-router-dom'
import { opportunitiesApi } from '@/api/opportunities.ts'
import { matchesApi } from '@/api/matches.ts'
import { negotiationsApi } from '@/api/negotiations.ts'
import { dealsApi } from '@/api/deals.ts'
import { contractsApi } from '@/api/contracts.ts'
import { peopleApi } from '@/api/people.ts'
import { PmContentCard, PmMetricGrid } from '@/components/layout/pm-layout-index'
import { PmBadge, PmButton, PmPage, PmPageHeader, PmPageHeroMetric, PmStatCard } from '@/components/ui/pm-index'
import { buildReadinessAnalytics, createCreatorProfileResolver } from '@/domain/readiness-analytics/readiness-analytics.ts'
import { buildMatchingQualityAnalytics } from '@/domain/matching-quality/matching-quality-analytics.ts'

function useIntelligenceData() {
  const opportunities = opportunitiesApi.list()
  const matches = matchesApi.list()
  const negotiations = negotiationsApi.list()
  const deals = dealsApi.list()
  const contracts = contractsApi.list()
  const users = peopleApi.listUsers()
  const profiles = users.map((user) => ({
    profile: user.profile,
    profileKind: user.role === 'company_owner' ? ('company' as const) : ('individual' as const),
  }))
  const readiness = buildReadinessAnalytics({
    profiles,
    opportunities,
    resolveProfileForOpportunity: createCreatorProfileResolver(peopleApi.get),
  })
  const quality = buildMatchingQualityAnalytics({
    profiles,
    opportunities,
    matches,
    negotiations,
    deals,
  })
  return { opportunities, matches, negotiations, deals, contracts, readiness, quality }
}

export function IntelligencePortfolioPage() {
  const data = useIntelligenceData()
  return (
    <PmPage
      header={
        <PmPageHeader
          label="Intelligence"
          title="Portfolio overview"
          description="Executive portfolio health across opportunities, negotiations, agreements, and contracts."
          metric={<PmPageHeroMetric value={data.opportunities.length} label="Opportunities" />}
          badges={<PmBadge tone="primary">{data.contracts.length} contracts</PmBadge>}
        />
      }
    >
      <PmMetricGrid columns={4}>
        <PmStatCard label="Ready opportunities" value={data.readiness.opportunities.ready} dense />
        <PmStatCard label="Needs review" value={data.readiness.opportunities.needsReview} dense />
        <PmStatCard label="Active negotiations" value={data.negotiations.filter((item) => item.status === 'active' || item.status === 'countered').length} dense />
        <PmStatCard label="Active contracts" value={data.contracts.filter((item) => item.status === 'active').length} dense />
      </PmMetricGrid>
    </PmPage>
  )
}

export function IntelligenceFunnelPage() {
  const data = useIntelligenceData()
  return (
    <PmPage
      header={
        <PmPageHeader
          label="Intelligence"
          title="Funnel & conversion"
          description="Track marketplace conversion from match discovery through agreement execution."
          metric={<PmPageHeroMetric value={`${Math.round(data.quality.acceptanceRate)}%`} label="Acceptance rate" />}
        />
      }
    >
      <PmMetricGrid columns={4}>
        <PmStatCard label="Total matches" value={data.quality.totalMatches} dense />
        <PmStatCard label="Accepted" value={data.quality.acceptedMatches} dense />
        <PmStatCard label="Negotiations started" value={data.quality.negotiationsStarted} dense />
        <PmStatCard label="Deals created" value={data.quality.dealsCreated} dense />
      </PmMetricGrid>
    </PmPage>
  )
}

export function IntelligenceRiskPage() {
  const data = useIntelligenceData()
  const blockedMatches = data.matches.filter((item) => item.status === 'declined' || item.status === 'expired')
  const blockedNegotiations = data.negotiations.filter((item) => item.status === 'countered' || item.status === 'cancelled')
  const blockedContracts = data.contracts.filter((item) => item.status === 'terminated')
  return (
    <PmPage
      header={
        <PmPageHeader
          label="Intelligence"
          title="Risk & blockers"
          description="Highlight stalled collaboration flows and escalation candidates."
          metric={<PmPageHeroMetric value={blockedMatches.length + blockedNegotiations.length + blockedContracts.length} label="Blockers" />}
        />
      }
    >
      <PmContentCard title="Blocked workload">
        <p>{blockedMatches.length} blocked matches</p>
        <p>{blockedNegotiations.length} blocked negotiations</p>
        <p>{blockedContracts.length} terminated contracts</p>
      </PmContentCard>
    </PmPage>
  )
}

export function IntelligenceExecutionPage() {
  const data = useIntelligenceData()
  return (
    <PmPage
      header={
        <PmPageHeader
          label="Intelligence"
          title="Execution health"
          description="Operational health of commercial agreements and contracts in flight."
          metric={<PmPageHeroMetric value={data.deals.filter((item) => item.status === 'execution' || item.status === 'active').length} label="Executing agreements" />}
          actions={
            <PmButton asChild>
              <Link to="/contracts">Open contracts</Link>
            </PmButton>
          }
        />
      }
    >
      <PmMetricGrid columns={4}>
        <PmStatCard label="Agreements in review/signing" value={data.deals.filter((item) => item.status === 'review' || item.status === 'signing').length} dense />
        <PmStatCard label="Pending signatures" value={data.contracts.filter((item) => item.status === 'pending_signature').length} dense />
        <PmStatCard label="Active contracts" value={data.contracts.filter((item) => item.status === 'active').length} dense />
        <PmStatCard label="Completed contracts" value={data.contracts.filter((item) => item.status === 'completed').length} dense />
      </PmMetricGrid>
    </PmPage>
  )
}
