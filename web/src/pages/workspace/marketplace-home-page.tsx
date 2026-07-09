import { Link } from 'react-router-dom'
import { Handshake, Layers, RefreshCcw, Repeat, ArrowRightLeft, CircleDollarSign, Compass } from 'lucide-react'
import { opportunitiesApi } from '@/api/opportunities.ts'
import { negotiationsApi } from '@/api/negotiations.ts'
import { contractsApi } from '@/api/contracts.ts'
import { dealsApi } from '@/api/deals.ts'
import { matchesApi } from '@/api/matches.ts'
import { resolveMainCollaborationModelLabel } from '@/domain/collaboration/opportunity-collaboration.ts'
import { formatCollaborationExchangeMode } from '@/lib/collaboration-taxonomy-display.ts'
import { PmContentCard, PmMetricGrid } from '@/components/layout/pm-layout-index'
import { PmBadge, PmButton, PmEmptyState, PmPage, PmPageHeader, PmPageHeroMetric, PmStatCard } from '@/components/ui/pm-index'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'

const MAIN_MODELS = [
  'cash_subcontracting',
  'service_exchange',
  'joint_venture',
  'resource_sharing',
  'hiring',
] as const
const MATCH_TYPES = ['one_way', 'two_way', 'consortium', 'circular'] as const
const EXCHANGE_MODES = ['cash', 'barter', 'profit_sharing', 'equity', 'hybrid'] as const

const MATCH_TYPE_ICONS = {
  one_way: Layers,
  two_way: ArrowRightLeft,
  consortium: Handshake,
  circular: RefreshCcw,
} as const

function toPercent(value: number): string {
  return `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`
}

export function MarketplaceHomePage() {
  const opportunities = opportunitiesApi.list()
  const matches = matchesApi.list()
  const negotiations = negotiationsApi.list()
  const deals = dealsApi.list()
  const contracts = contractsApi.list()

  return (
    <PmPage
      header={
        <PmPageHeader
          label="Marketplace"
          title="Enterprise discovery"
          description="Explore PM-Twin by collaboration models, match topologies, and value exchange modes."
          tone="mission"
          metric={<PmPageHeroMetric value={opportunities.length} label="Total opportunities" />}
          badges={
            <>
              <PmBadge tone="primary">{matches.length} matches</PmBadge>
              <PmBadge tone="info">{negotiations.length} negotiations</PmBadge>
              <PmBadge tone="success">{contracts.length} contracts</PmBadge>
            </>
          }
        />
      }
    >
      <PmMetricGrid columns={4}>
        <PmStatCard
          label="Published opportunities"
          value={opportunities.filter((o) => (o.visibilityStatus ?? '').toLowerCase() === 'published').length}
          dense
        />
        <PmStatCard label="Active negotiations" value={negotiations.filter((n) => n.status === 'active' || n.status === 'countered').length} dense />
        <PmStatCard label="Commercial agreements" value={deals.length} dense />
        <PmStatCard label="Active contracts" value={contracts.filter((c) => c.status === 'active').length} dense />
      </PmMetricGrid>

      {opportunities.length === 0 && matches.length === 0 ? (
        <div className="mt-6">
          <PmEmptyState
            title="Marketplace is warming up"
            description="Published opportunities and matches will appear here as the network grows."
            icon={<Compass className="size-10" />}
            action={
              <PmButton size="sm" asChild>
                <Link to="/opportunities">Browse opportunities</Link>
              </PmButton>
            }
            secondaryAction={
              <PmButton size="sm" variant="outline" asChild>
                <Link to="/dashboard">Go to dashboard</Link>
              </PmButton>
            }
          />
        </div>
      ) : null}

      <section className="mt-6 space-y-3">
        <h2 className={pmTypography.h3}>Explore by collaboration</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {MAIN_MODELS.map((model) => {
            const count = opportunities.filter((o) => o.mainCollaborationModel === model).length
            const activeNegotiations = negotiations.filter((n) => {
              const opp = n.opportunityId ? opportunitiesApi.get(n.opportunityId) : undefined
              return opp?.mainCollaborationModel === model && (n.status === 'active' || n.status === 'countered')
            }).length
            const activeContracts = contracts.filter((contract) => {
              const deal = contract.dealId ? dealsApi.get(contract.dealId) : undefined
              const opp = deal?.opportunityId ? opportunitiesApi.get(deal.opportunityId) : undefined
              return opp?.mainCollaborationModel === model && contract.status === 'active'
            }).length
            return (
              <PmContentCard key={model} title={resolveMainCollaborationModelLabel(model)}>
                <p className={cn(pmTypography.bodySm, 'text-muted-foreground')}>
                  Opportunity discovery and execution funnel for this collaboration model.
                </p>
                <div className="mt-3 space-y-1 text-sm">
                  <p>{count} opportunities</p>
                  <p>{activeNegotiations} active negotiations</p>
                  <p>{activeContracts} active contracts</p>
                </div>
                <Link
                  to={`/opportunities?mainModel=${model}`}
                  className={cn(pmTypography.label, 'mt-4 inline-flex items-center gap-1 text-primary hover:underline')}
                >
                  Explore model <Repeat className="size-3.5" />
                </Link>
              </PmContentCard>
            )
          })}
        </div>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className={pmTypography.h3}>Explore by match type</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {MATCH_TYPES.map((type) => {
            const Icon = MATCH_TYPE_ICONS[type]
            const modelMatches = matches.filter((m) => m.matchType === type)
            const discovered = modelMatches.filter((m) => m.status === 'discovered').length
            const acceptedOrConfirmed = modelMatches.filter((m) => m.status === 'accepted' || m.status === 'confirmed').length
            const successRate = modelMatches.length === 0 ? 0 : acceptedOrConfirmed / modelMatches.length
            const avgScore = modelMatches.length === 0 ? 0 : modelMatches.reduce((sum, m) => sum + m.matchScore, 0) / modelMatches.length
            return (
              <PmContentCard key={type} title={type.replace('_', ' ')}>
                <div className="mb-2 inline-flex rounded-md border border-border p-2">
                  <Icon className="size-4" />
                </div>
                <div className="space-y-1 text-sm">
                  <p>{discovered} active opportunities</p>
                  <p>{toPercent(successRate)} matching success</p>
                  <p>{toPercent(avgScore)} average readiness proxy</p>
                </div>
                <Link to={`/matches?matchTypes=${type}`} className={cn(pmTypography.label, 'mt-4 inline-flex items-center gap-1 text-primary hover:underline')}>
                  Open matches <Repeat className="size-3.5" />
                </Link>
              </PmContentCard>
            )
          })}
        </div>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className={pmTypography.h3}>Explore by value exchange</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {EXCHANGE_MODES.map((mode) => {
            const modeOpportunities = opportunities.filter((o) => o.exchangeMode === mode || o.acceptedExchangeModes?.includes(mode))
            const modeDeals = deals.filter((d) => d.exchangeMode === mode)
            const modeContracts = contracts.filter((c) => c.paymentMode === mode)
            return (
              <PmContentCard key={mode} title={formatCollaborationExchangeMode(mode)}>
                <CircleDollarSign className="mb-2 size-4" />
                <div className="space-y-1 text-sm">
                  <p>{modeOpportunities.length} opportunities</p>
                  <p>{modeDeals.length} agreements</p>
                  <p>{modeContracts.length} contracts</p>
                </div>
                <Link to={`/opportunities?exchangeModes=${mode}`} className={cn(pmTypography.label, 'mt-4 inline-flex items-center gap-1 text-primary hover:underline')}>
                  Filter opportunities <ArrowRightLeft className="size-3.5" />
                </Link>
              </PmContentCard>
            )
          })}
        </div>
      </section>
    </PmPage>
  )
}
