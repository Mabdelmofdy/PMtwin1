import { Link } from 'react-router-dom'
import { opportunitiesApi } from '@/api/opportunities.ts'
import { matchesApi } from '@/api/matches.ts'
import { negotiationsApi } from '@/api/negotiations.ts'
import { dealsApi } from '@/api/deals.ts'
import { notificationsApi } from '@/api/notifications.ts'
import { MatchCard } from '@/components/collaboration/match-card'
import { OpportunityCard } from '@/components/opportunity/opportunity-card'
import { countOpportunityBuckets } from '@/components/opportunity/opportunity-display'
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
  PmSurface,
  PmWorkflowBadge,
} from '@/components/ui/pm-index'
import { useAuth } from '@/providers/auth-provider'
import { pmTypography } from '@/components/shared/pm-design-tokens'
import { formatDate, formatRelativeTime } from '@/lib/format'
import { cn } from '@/lib/utils'

function DashboardMetricStrip({
  published,
  activeMatches,
  negotiating,
  drafts,
}: {
  published: number
  activeMatches: number
  negotiating: number
  drafts: number
}) {
  const metrics = [
    { label: 'Published', value: published },
    { label: 'Active matches', value: activeMatches },
    { label: 'Negotiating', value: negotiating },
    { label: 'Drafts', value: drafts },
  ]

  return (
    <PmSurface
      data-slot="pm-dashboard-metric-strip"
      variant="muted"
      className="flex flex-wrap divide-y divide-border/50 sm:divide-x sm:divide-y-0"
    >
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="flex min-w-[50%] flex-1 items-center justify-between gap-2 px-4 py-2.5 sm:min-w-0 sm:flex-col sm:items-start sm:py-3"
        >
          <span className={cn(pmTypography.statLabel, 'text-muted-foreground')}>
            {metric.label}
          </span>
          <span className={cn(pmTypography.stat, 'tabular-nums')}>
            {metric.value}
          </span>
        </div>
      ))}
    </PmSurface>
  )
}

function buildNeedsActionItems(input: {
  userId?: string
  matches: ReturnType<typeof matchesApi.list>
  negotiations: ReturnType<typeof negotiationsApi.list>
  deals: ReturnType<typeof dealsApi.list>
  opportunities: ReturnType<typeof opportunitiesApi.list>
}): PmActionHubItem[] {
  const { userId, matches, negotiations, deals, opportunities } = input
  const items: PmActionHubItem[] = []

  for (const match of matches.filter((m) => m.status === 'discovered').slice(0, 2)) {
    items.push({
      id: `match-${match.id}`,
      title: 'Review new match',
      context: 'A PostMatch is waiting for your response.',
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
      context: 'Deal requires your signature or review.',
      status: deal.status,
      statusEntity: 'deal',
      primary: { label: 'Open deal', href: `/deals/${deal.id}` },
    })
  }

  if (userId) {
    for (const opp of opportunities
      .filter((o) => o.creatorId === userId && o.status === 'draft')
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
  const { user } = useAuth()
  const userId = user?.id

  const opportunities = opportunitiesApi.list()
  const matches = matchesApi.list()
  const negotiations = negotiationsApi.list()
  const deals = dealsApi.list()
  const buckets = countOpportunityBuckets(opportunities, userId)
  const activeMatches = countActiveMatches(matches)
  const notifications = userId ? notificationsApi.list(userId).slice(0, 5) : []
  const needsActionItems = buildNeedsActionItems({
    userId,
    matches,
    negotiations,
    deals,
    opportunities,
  })

  const recommendedMatches = [...matches]
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 3)

  const recentOpportunities = opportunities
    .filter((o) => !userId || o.creatorId === userId)
    .sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))
    .slice(0, 3)

  const activeWorkflowItems = [
    ...negotiations
      .filter((n) => n.status === 'active' || n.status === 'countered')
      .slice(0, 3)
      .map((n) => ({
        id: n.id,
        title: `Negotiation ${n.id}`,
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
        href: `/deals/${d.id}`,
        updatedAt: d.updatedAt,
      })),
  ]
    .sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))
    .slice(0, 4)

  return (
    <PmDashboardLayout
      metrics={
        <DashboardMetricStrip
          published={buckets.published}
          activeMatches={activeMatches}
          negotiating={buckets.negotiating}
          drafts={buckets.drafts}
        />
      }
      recentActivity={
        <PmContentCard
          title="Recent activity"
          actions={
            <PmButton size="sm" variant="ghost" asChild>
              <Link to="/notifications">View all</Link>
            </PmButton>
          }
        >
          {notifications.length === 0 ? (
            <PmEmptyState
              title="No recent alerts"
              description="Notifications about matches, negotiations, and deals will appear here."
              size="compact"
              action={
                <PmButton size="sm" variant="outline" asChild>
                  <Link to="/pipeline">Open pipeline</Link>
                </PmButton>
              }
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
        items={needsActionItems}
        emptyAction={
          <PmPageActions
            primary={{ label: 'Post opportunity', href: '/opportunities/create' }}
            secondary={{ label: 'Open pipeline', href: '/pipeline', variant: 'outline' }}
          />
        }
      />

      <PmSectionHeader
        title="Recommended matches"
        description="Highest compatibility scores from your active opportunities."
        actions={
          <PmButton size="sm" variant="outline" asChild>
            <Link to="/matches">View all</Link>
          </PmButton>
        }
      />
      {recommendedMatches.length === 0 ? (
        <PmEmptyState
          title="No matches yet"
          description="Publish an opportunity to discover ranked PostMatches across the network."
          size="compact"
          action={
            <PmButton size="sm" asChild>
              <Link to="/opportunities/create">Post opportunity</Link>
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
        title="Active negotiations & deals"
        description="Collaboration items in progress across the workflow."
        actions={
          <PmButton size="sm" variant="outline" asChild>
            <Link to="/pipeline">Open pipeline</Link>
          </PmButton>
        }
      />
      {activeWorkflowItems.length === 0 ? (
        <PmEmptyState
          title="No active collaborations"
          description="When negotiations or deals start, they will show up here for quick access."
          size="compact"
          action={
            <PmButton size="sm" variant="outline" asChild>
              <Link to="/matches">Browse matches</Link>
            </PmButton>
          }
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {activeWorkflowItems.map((item) => (
            <PmSurface
              key={`${item.entity}-${item.id}`}
              variant="default"
              shadow="card"
              interactive
              className="p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <Link
                  to={item.href}
                  className={cn(pmTypography.bodySm, 'line-clamp-2 font-medium hover:text-primary')}
                >
                  {item.title}
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
        title="Recent opportunities"
        actions={
          <PmButton size="sm" variant="outline" asChild>
            <Link to="/opportunities">View all</Link>
          </PmButton>
        }
      />
      {recentOpportunities.length === 0 ? (
        <PmEmptyState
          title="No opportunities yet"
          description="Post your first opportunity to start the collaboration workflow."
          size="compact"
          action={
            <PmButton size="sm" asChild>
              <Link to="/opportunities/create">Post opportunity</Link>
            </PmButton>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {recentOpportunities.map((opp) => (
            <OpportunityCard
              key={opp.id}
              opportunity={opp}
              showActions={false}
              canEdit={userId === opp.creatorId}
            />
          ))}
        </div>
      )}
    </PmDashboardLayout>
  )
}
