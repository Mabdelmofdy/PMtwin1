import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { opportunitiesApi } from '@/api/opportunities.ts'
import { matchesApi } from '@/api/matches.ts'
import { negotiationsApi } from '@/api/negotiations.ts'
import { dealsApi } from '@/api/deals.ts'
import { contractsApi } from '@/api/contracts.ts'
import { notificationsApi } from '@/api/notifications.ts'
import { peopleApi } from '@/api/people.ts'
import { MatchCard } from '@/components/collaboration/match-card'
import { formatNegotiationDisplayTitle } from '@/lib/entity-display-titles.ts'
import {
  PmContentCard,
  PmDashboardLayout,
  PmSectionHeader,
  countActiveMatches,
} from '@/components/layout/pm-layout-index'
import {
  PmActionHub,
  type PmActionHubItem,
  PmButton,
  PmEmptyState,
  PmPageActions,
  PmPageHeader,
  PmPageHeroMetric,
  PmStatsStrip,
  PmSurface,
  PmWorkflowBadge,
} from '@/components/ui/pm-index'
import { useAuth } from '@/providers/auth-provider'
import { pmTypography } from '@/tokens'
import { resolveMatchTypeStyle } from '@/tokens'
import { formatDate, formatRelativeTime } from '@/lib/format'
import { PRODUCT_LANGUAGE } from '@/lib/product-language'
import { formatReadinessScorePercent } from '@/components/ui/pm-readiness-score-display'
import { resolveProfileReadiness } from '@/components/readiness/profile-readiness-card'
import {
  buildDashboardExplanation,
  buildOpportunityExplanationFromForm,
  buildProfileExplanationFromEvaluation,
  getAggregatedRecommendations,
} from '@/services/explainability/index.ts'
import { ExplanationPanel } from '@/components/explainability/explanation-panel.tsx'
import { ExplanationRecommendations } from '@/components/explainability/explanation-recommendations.tsx'
import { cn } from '@/lib/utils'
import { useProductLanguage } from '@/providers/product-language-provider'
import { MATCHING_MODELS, MATCHING_MODEL_KEYS } from '@/config/need-offer-framework.ts'
import { buildReadinessAnalytics, createCreatorProfileResolver } from '@/domain/readiness-analytics/readiness-analytics.ts'
import { buildMatchingQualityAnalytics } from '@/domain/matching-quality/matching-quality-analytics.ts'
import { PendingVettingDashboard } from '@/components/vetting/pending-vetting-dashboard.tsx'
import { isOpportunityOwnedByContext } from '@/domain/identity/ownership-adapters.ts'
function buildNeedsActionItems(input: {
  userId?: string
  activeWorkspaceId?: string
  activePartyId?: string
  matches: ReturnType<typeof matchesApi.list>
  negotiations: ReturnType<typeof negotiationsApi.list>
  deals: ReturnType<typeof dealsApi.list>
  opportunities: ReturnType<typeof opportunitiesApi.list>
}): PmActionHubItem[] {
  const {
    userId,
    activeWorkspaceId,
    activePartyId,
    matches,
    negotiations,
    deals,
    opportunities,
  } = input
  const items: PmActionHubItem[] = []

  for (const match of matches.filter((m) => m.status === 'discovered').slice(0, 2)) {
    items.push({
      id: `match-${match.id}`,
      title: 'Review new match',
      context: 'A match is waiting for your response.',
      status: match.status,
      statusEntity: 'match',
      matchScore: match.matchScore,
      primary: { label: 'Open match', href: `/matches/${match.id}` },
      secondary: { label: 'Pipeline', href: '/pipeline', variant: 'outline' },
    })
  }

  for (const negotiation of negotiations
    .filter((n) => n.status === 'active' || n.status === 'countered')
    .slice(0, 2)) {
    items.push({
      id: `negotiation-${negotiation.id}`,
      title: 'Respond to negotiation',
      context: 'Terms need your review or counter.',
      status: negotiation.status,
      statusEntity: 'negotiation',
      primary: { label: 'Open negotiation', href: `/negotiations/${negotiation.id}` },
    })
  }

  for (const deal of deals
    .filter((d) => d.status === 'review' || d.status === 'signing')
    .slice(0, 2)) {
    items.push({
      id: `deal-${deal.id}`,
      title: deal.title,
      context: 'This record requires your signature or review.',
      status: deal.status,
      statusEntity: 'deal',
      primary: { label: PRODUCT_LANGUAGE.OPEN_COMMERCIAL_AGREEMENT, href: `/commercial-agreements/${deal.id}` },
    })
  }

  if (userId) {
    for (const opp of opportunities
      .filter(
        (opportunity) =>
          opportunity.status === 'draft' &&
          isOpportunityOwnedByContext(opportunity, {
            userId,
            activeWorkspaceId,
            activePartyId,
          }),
      )
      .slice(0, 1)) {
      items.push({
        id: `opp-${opp.id}`,
        title: opp.title,
        context: 'Draft opportunity — publish to start matching.',
        status: opp.status,
        statusEntity: 'opportunity',
        primary: { label: 'Open opportunity', href: `/opportunities/${opp.id}` },
        secondary: { label: 'Edit', href: `/opportunities/${opp.id}/edit`, variant: 'outline' },
      })
    }
  }

  return items.slice(0, 5)
}

/** Action-first dashboard — attention, matches, active workflows, activity. */
export function WorkspaceDashboardComposition() {
  const {
    user,
    activeWorkspace,
    activeParty,
    isCompanyUser,
    isPendingApproval,
    canMutate,
  } = useAuth()
  const { productLanguage, locale } = useProductLanguage()
  const userId = user?.id
  const firstName = (user?.profile?.name ?? 'there').split(' ')[0]
  const profileKind = isCompanyUser ? 'company' : 'individual'
  const readiness = user?.profile
    ? resolveProfileReadiness(user.profile, profileKind)
    : null
  const opportunities = opportunitiesApi.list()
  const ownsOpportunity = (opportunity: (typeof opportunities)[number]) =>
    isOpportunityOwnedByContext(opportunity, {
      userId,
      activeWorkspaceId: activeWorkspace?.id,
      activePartyId: activeParty?.id,
    })
  const profileExplanationBundle = user?.id
    ? buildProfileExplanationFromEvaluation(user.id, profileKind, user.profile)
    : null
  const draftOpportunity = userId
    ? opportunities.find(
        (opportunity) => ownsOpportunity(opportunity) && opportunity.status === 'draft',
      )
    : undefined
  const draftOpportunityBundle = draftOpportunity
    ? buildOpportunityExplanationFromForm(draftOpportunity.id, draftOpportunity)
    : null
  const dashboardBundles = [
    profileExplanationBundle,
    draftOpportunityBundle,
  ].filter((bundle): bundle is NonNullable<typeof bundle> => bundle != null)
  const dashboardRecommendations = dashboardBundles.length > 0
    ? getAggregatedRecommendations(dashboardBundles, 5)
    : []
  const matches = matchesApi.list()
  const activeMatches = countActiveMatches(matches)
  const negotiations = negotiationsApi.list()
  const deals = dealsApi.list()
  const contracts = contractsApi.list()
  const notifications = userId ? notificationsApi.list(userId).slice(0, 5) : []
  const readinessAnalytics = buildReadinessAnalytics({
    profiles: peopleApi.listUsers().map((entry) => ({
      profile: entry.profile,
      profileKind: entry.role === 'company' ? 'company' : 'individual',
    })),
    opportunities,
    resolveProfileForOpportunity: createCreatorProfileResolver(peopleApi.get),
  })
  const qualityAnalytics = buildMatchingQualityAnalytics({
    profiles: peopleApi.listUsers().map((entry) => ({
      profile: entry.profile,
      profileKind: entry.role === 'company' ? 'company' : 'individual',
    })),
    opportunities,
    matches,
    negotiations,
    deals,
  })
  const dashboardExplanationBundle = userId
    ? buildDashboardExplanation(
        {
          entityId: userId,
          profileScore: readiness?.score,
          opportunityCount: opportunities.length,
          matchCount: matches.length,
          negotiationCount: negotiations.length,
          dealCount: deals.length,
          contractCount: contracts.length,
          aggregatedRecommendations: dashboardRecommendations,
          heroMetric: {
            label: 'Active matches',
            value: activeMatches,
          },
        },
        { locale },
      )
    : null
  const needsActionItems = buildNeedsActionItems({
    userId,
    activeWorkspaceId: activeWorkspace?.id,
    activePartyId: activeParty?.id,
    matches,
    negotiations,
    deals,
    opportunities,
  })

  const recommendedMatches = [...matches]
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 3)

  const matchTypeSummary = MATCHING_MODEL_KEYS.map((key) => ({
    key,
    label: MATCHING_MODELS[key].label,
    count: matches.filter(
      (match) => (match.matchType || 'one_way').toLowerCase() === key,
    ).length,
  }))

  const activeWorkflowItems = [
    ...negotiations
      .filter((n) => n.status === 'active' || n.status === 'countered')
      .slice(0, 3)
      .map((n) => ({
        id: n.id,
        title: formatNegotiationDisplayTitle(n, opportunitiesApi.get),
        status: n.status,
        entity: 'negotiation' as const,
        href: `/negotiations/${n.id}`,
        updatedAt: n.updatedAt ?? n.createdAt,
      })),
    ...deals
      .filter((d) => d.status !== 'completed' && d.status !== 'cancelled')
      .slice(0, 3)
      .map((d) => ({
        id: d.id,
        title: d.title,
        status: d.status,
        entity: 'deal' as const,
        href: `/commercial-agreements/${d.id}`,
        updatedAt: d.updatedAt,
      })),
  ]
    .sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))
    .slice(0, 4)

  const blockedItems = [
    ...matches
      .filter((m) => m.status === 'declined' || m.status === 'expired')
      .map((m) => ({
        id: `blocked-match-${m.id}`,
        label: 'Match needs replacement',
        entity: 'match' as const,
        status: m.status,
        href: `/matches/${m.id}`,
      })),
    ...negotiations
      .filter((n) => n.status === 'countered' || n.status === 'cancelled')
      .map((n) => ({
        id: `blocked-neg-${n.id}`,
        label: formatNegotiationDisplayTitle(n, opportunitiesApi.get),
        entity: 'negotiation' as const,
        status: n.status,
        href: `/negotiations/${n.id}`,
      })),
  ].slice(0, 4)

  if (user && isPendingApproval) {
    return <PendingVettingDashboard user={user} />
  }

  return (
    <PmDashboardLayout
      header={
        <PmPageHeader
          label="Dashboard"
          title={`Good morning, ${firstName}`}
          description="Review your tasks, workflow progress, and items pending action."
          tone="mission"
          metric={
            readiness ? (
              <PmPageHeroMetric
                value={formatReadinessScorePercent(readiness.score)}
                label="Profile readiness"
                animate={false}
              />
            ) : (
              <PmPageHeroMetric value={activeMatches} label="Active matches" />
            )
          }
          actions={
            <PmPageActions
              primary={{
                label: productLanguage.actionLabel('createOpportunity'),
                href: '/opportunities/create',
                render: () => (
                  <PmButton asChild disabled={!canMutate}>
                    <Link to="/opportunities/create">
                      {productLanguage.actionLabel('createOpportunity')}
                      <ArrowRight className="size-4 rtl:rotate-180" aria-hidden />
                    </Link>
                  </PmButton>
                ),
              }}
              secondary={{ label: 'My pipeline', href: '/pipeline', variant: 'outline' }}
            />
          }
        />
      }
      metrics={        <PmStatsStrip
          data-slot="pm-dashboard-metric-strip"
          items={[
            {
              label: `My ${productLanguage.plural('opportunity').toLowerCase()}`,
              value: opportunities.filter(ownsOpportunity).length,
              href: '/opportunities',
            },
            { label: 'My matches', value: matches.length, href: '/matches' },
            { label: `My ${productLanguage.plural('negotiation').toLowerCase()}`, value: negotiations.length, href: '/negotiations' },
            {
              label: `My ${productLanguage.plural('commercialAgreement').toLowerCase()}`,
              value: deals.length,
              href: '/commercial-agreements',
            },
            { label: `My ${productLanguage.plural('contract').toLowerCase()}`, value: contracts.length, href: '/contracts' },
          ]}
        />
      }
      recentActivity={
        <PmContentCard
          title="My notifications"
          actions={
            <PmButton size="sm" variant="ghost" asChild>
              <Link to="/notifications">View all</Link>
            </PmButton>
          }
        >
          {notifications.length === 0 ? (
            <PmEmptyState
              title="No recent alerts"
              description="Notifications about matches, negotiations, and commercial agreements will appear here."
              size="compact"
            />
          ) : (
            <ul className={cn('space-y-3', pmTypography.bodySm)}>
              {notifications.map((n) => (
                <li key={n.id} className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className={cn(!n.read && 'font-medium text-foreground')}>{n.title}</p>
                    <p className={cn(pmTypography.caption, 'line-clamp-1 text-muted-foreground')}>
                      {n.message}
                    </p>
                  </div>
                  <span className={cn(pmTypography.caption, 'shrink-0 text-muted-foreground')}>
                    {formatRelativeTime(n.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </PmContentCard>
      }
    >
      <PmActionHub
        title="My tasks"
        description="Items that need your action to keep execution moving."
        items={needsActionItems}
      />
      {dashboardRecommendations.length > 0 && profileExplanationBundle ? (
        <PmContentCard title="Next best actions">
          <ExplanationRecommendations
            bundle={{
              ...profileExplanationBundle,
              recommendations: dashboardRecommendations,
            }}
            heading="Prioritized recommendations"
          />
        </PmContentCard>
      ) : null}
      {dashboardExplanationBundle ? (
        <PmContentCard title="Dashboard explainability">
          <ExplanationPanel
            bundle={dashboardExplanationBundle}
            compact
            showTimeline={false}
            showAiPayload
            scoreLabel="Workspace health"
          />
        </PmContentCard>
      ) : null}
      <PmSectionHeader
        title="My workflow"
        description="Progress, current stage, and next step across active entities."
        actions={
          <PmButton size="sm" variant="outline" asChild>
            <Link to="/pipeline">Open pipeline</Link>
          </PmButton>
        }
      />
      {activeWorkflowItems.length === 0 ? (
        <PmEmptyState
          title="No active workflow items"
          description="Start by publishing or opening a match to move through the collaboration stages."
          size="compact"
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {activeWorkflowItems.map((item) => (
            <PmSurface
              key={`${item.entity}-${item.id}`}
              variant="default"
              shadow="card"
              interactive
              className="p-4 md:p-5"
            >
              <div className="flex items-start justify-between gap-2">
                <Link
                  to={item.href}
                  className={cn(pmTypography.h3, 'line-clamp-2 hover:text-primary')}
                >                  {item.title}
                </Link>
                <PmWorkflowBadge status={item.status} entity={item.entity} size="sm" />
              </div>
              <p className={cn(pmTypography.caption, 'mt-2 text-muted-foreground')}>
                Updated {formatDate(item.updatedAt)}
              </p>
            </PmSurface>
          ))}
        </div>
      )}

      <PmSectionHeader
        title="Blocked — needs decision"
        description="Items waiting on partner response or your reset decision."
        actions={
          <PmButton size="sm" variant="outline" asChild>
            <Link to="/pipeline">Review blockers</Link>
          </PmButton>
        }
      />
      {blockedItems.length === 0 ? (
        <PmEmptyState
          title="No blockers right now"
          description="Your workflow is moving. Keep monitoring negotiations and commercial agreements."
          size="compact"
        />
      ) : (
        <ul className="space-y-2" role="list">
          {blockedItems.map((item) => (
            <li key={item.id}>
              <PmSurface
                variant="default"
                shadow="card"
                interactive
                className="flex flex-wrap items-center justify-between gap-2 p-3.5 md:p-4"
              >
                <Link
                  to={item.href}
                  className={cn(pmTypography.bodySm, 'min-w-0 flex-1 truncate font-medium hover:text-primary')}
                >
                  {item.label}
                </Link>
                <PmWorkflowBadge status={item.status} entity={item.entity} size="sm" />
              </PmSurface>
            </li>
          ))}
        </ul>
      )}

      <PmSectionHeader
        title="My matching summary"
        description="Matches grouped by Need/Offer framework topology models."
        className="opacity-90"
        actions={
          <PmButton size="sm" variant="ghost" asChild>
            <Link to="/matches">View all matches</Link>
          </PmButton>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {matchTypeSummary.map((entry) => (
          <PmSurface key={entry.key} variant="muted" shadow="card" className="p-4 md:p-5">
            <span
              className={cn(
                pmTypography.badge,
                'inline-flex items-center rounded-md px-2 py-0.5',
                resolveMatchTypeStyle(entry.key),
              )}
            >
              {entry.label}
            </span>
            <p className={cn(pmTypography.stat, 'mt-2 tabular-nums')}>{entry.count}</p>            <p className={cn(pmTypography.caption, 'mt-1 text-muted-foreground')}>
              {MATCHING_MODELS[entry.key].subtitle}
            </p>
          </PmSurface>
        ))}
      </div>

      <PmSectionHeader
        title="Recommended from marketplace"
        description="Top-ranked matches to explore — browse the marketplace for more."
        actions={
          <PmButton size="sm" variant="outline" asChild>
            <Link to="/matches" state={{ domain: 'marketplace', matchView: 'recommended' }}>
              Browse matches
            </Link>
          </PmButton>
        }
      />
      {recommendedMatches.length === 0 ? (
        <PmEmptyState
          title="No marketplace recommendations yet"
          description="Published marketplace opportunities will surface recommended matches here."
          size="compact"
          action={
            <PmButton size="sm" variant="outline" asChild>
              <Link to="/matches">Open matches</Link>
            </PmButton>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {recommendedMatches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}

      <PmSectionHeader
        title="Executive intelligence snapshot"
        description="Portfolio, funnel, risk, and execution signals from current marketplace data."
      />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <PmSurface variant="muted" shadow="card" className="p-4 md:p-5">
          <p className={cn(pmTypography.caption, 'text-muted-foreground')}>Portfolio readiness</p>
          <p className={cn(pmTypography.stat, 'mt-1 tabular-nums')}>{Math.round(readinessAnalytics.opportunities.averageScore)}%</p>
          <p className={cn(pmTypography.caption, 'mt-1')}>{readinessAnalytics.opportunities.ready} ready opportunities</p>
          <PmButton size="sm" variant="ghost" asChild className="mt-2 px-0">
            <Link to="/intelligence/portfolio">Open portfolio</Link>
          </PmButton>
        </PmSurface>
        <PmSurface variant="muted" shadow="card" className="p-4 md:p-5">
          <p className={cn(pmTypography.caption, 'text-muted-foreground')}>Funnel conversion</p>
          <p className={cn(pmTypography.stat, 'mt-1 tabular-nums')}>{Math.round(qualityAnalytics.dealConversionRate)}%</p>
          <p className={cn(pmTypography.caption, 'mt-1')}>{qualityAnalytics.dealsCreated} deals from {qualityAnalytics.negotiationsStarted} negotiations</p>
          <PmButton size="sm" variant="ghost" asChild className="mt-2 px-0">
            <Link to="/intelligence/funnel">Open funnel</Link>
          </PmButton>
        </PmSurface>
        <PmSurface variant="muted" shadow="card" className="p-4 md:p-5">
          <p className={cn(pmTypography.caption, 'text-muted-foreground')}>Risk blockers</p>
          <p className={cn(pmTypography.stat, 'mt-1 tabular-nums')}>
            {matches.filter((m) => m.status === 'declined' || m.status === 'expired').length +
              negotiations.filter((n) => n.status === 'countered' || n.status === 'cancelled').length}
          </p>
          <p className={cn(pmTypography.caption, 'mt-1')}>Matches and negotiations needing intervention</p>
          <PmButton size="sm" variant="ghost" asChild className="mt-2 px-0">
            <Link to="/intelligence/risk">Open risk</Link>
          </PmButton>
        </PmSurface>
        <PmSurface variant="muted" shadow="card" className="p-4 md:p-5">
          <p className={cn(pmTypography.caption, 'text-muted-foreground')}>Execution health</p>
          <p className={cn(pmTypography.stat, 'mt-1 tabular-nums')}>
            {contracts.filter((contract) => contract.status === 'active').length}
          </p>
          <p className={cn(pmTypography.caption, 'mt-1')}>Active contracts in execution</p>
          <PmButton size="sm" variant="ghost" asChild className="mt-2 px-0">
            <Link to="/intelligence/execution">Open execution</Link>
          </PmButton>
        </PmSurface>
      </div>
    </PmDashboardLayout>
  )
}
