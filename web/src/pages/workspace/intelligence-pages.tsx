import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { opportunitiesApi } from '@/api/opportunities.ts'
import { matchesApi } from '@/api/matches.ts'
import { negotiationsApi } from '@/api/negotiations.ts'
import { dealsApi } from '@/api/deals.ts'
import { contractsApi } from '@/api/contracts.ts'
import { peopleApi } from '@/api/people.ts'
import { PmContentCard, PmMetricGrid } from '@/components/layout/pm-layout-index'
import { PmBadge, PmButton, PmPage, PmPageHeader, PmPageHeroMetric, PmStatCard } from '@/components/ui/pm-index'
import { ExplanationPanel } from '@/components/explainability/explanation-panel.tsx'
import { buildReadinessAnalytics, createCreatorProfileResolver } from '@/domain/readiness-analytics/readiness-analytics.ts'
import { buildMatchingQualityAnalytics } from '@/domain/matching-quality/matching-quality-analytics.ts'
import { buildAnalyticsExplanation } from '@/services/explainability/index.ts'
import { useProductLanguage } from '@/providers/product-language-provider.tsx'

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

function useIntelligenceAnalyticsBundle(
  data: ReturnType<typeof useIntelligenceData>,
  entityId: string,
  periodLabel: string,
  riskBlockers?: readonly { label: string; count: number; href?: string }[],
) {
  const { locale } = useProductLanguage()

  return useMemo(
    () =>
      buildAnalyticsExplanation(
        {
          entityId,
          readinessAnalytics: data.readiness,
          matchingQualityAnalytics: data.quality,
          riskBlockers,
          periodLabel,
        },
        { locale },
      ),
    [data.readiness, data.quality, entityId, locale, periodLabel, riskBlockers],
  )
}

export function IntelligencePortfolioPage() {
  const data = useIntelligenceData()
  const analyticsBundle = useIntelligenceAnalyticsBundle(
    data,
    'intelligence-portfolio',
    'portfolio overview',
  )

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
      <PmContentCard title="Readiness explainability" className="mt-6">
        <ExplanationPanel
          bundle={analyticsBundle}
          compact
          showTimeline={false}
          showBreakdown={false}
          scoreLabel="Analytics health"
        />
      </PmContentCard>
    </PmPage>
  )
}

export function IntelligenceFunnelPage() {
  const data = useIntelligenceData()
  const analyticsBundle = useIntelligenceAnalyticsBundle(
    data,
    'intelligence-funnel',
    'funnel conversion',
  )

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
        <PmStatCard label="Commercial Agreements created" value={data.quality.dealsCreated} dense />
      </PmMetricGrid>
      <PmContentCard title="Matching quality explainability" className="mt-6">
        <ExplanationPanel
          bundle={analyticsBundle}
          compact
          showTimeline={false}
          showBlockers={false}
          scoreLabel="Funnel health"
        />
      </PmContentCard>
    </PmPage>
  )
}

export function IntelligenceRiskPage() {
  const data = useIntelligenceData()
  const blockedMatches = data.matches.filter((item) => item.status === 'declined' || item.status === 'expired')
  const blockedNegotiations = data.negotiations.filter((item) => item.status === 'countered' || item.status === 'cancelled')
  const blockedContracts = data.contracts.filter((item) => item.status === 'terminated')
  const riskBlockers = [
    { label: 'Blocked matches', count: blockedMatches.length, href: '/intelligence/risk' },
    { label: 'Blocked negotiations', count: blockedNegotiations.length, href: '/intelligence/risk' },
    { label: 'Terminated contracts', count: blockedContracts.length, href: '/intelligence/risk' },
  ]
  const analyticsBundle = useIntelligenceAnalyticsBundle(
    data,
    'intelligence-risk',
    'risk and blockers',
    riskBlockers,
  )

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
      <PmContentCard title="Risk explainability" className="mt-6">
        <ExplanationPanel
          bundle={analyticsBundle}
          compact
          showTimeline={false}
          showBreakdown={false}
          scoreLabel="Risk posture"
        />
      </PmContentCard>
    </PmPage>
  )
}

export function IntelligenceExecutionPage() {
  const data = useIntelligenceData()
  const analyticsBundle = useIntelligenceAnalyticsBundle(
    data,
    'intelligence-execution',
    'execution health',
  )

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
      <PmContentCard title="Execution explainability" className="mt-6">
        <ExplanationPanel
          bundle={analyticsBundle}
          compact
          showTimeline={false}
          scoreLabel="Execution health"
        />
      </PmContentCard>
    </PmPage>
  )
}
