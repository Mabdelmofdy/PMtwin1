import { Link } from 'react-router-dom'
import { opportunitiesApi } from '@/api/opportunities.ts'
import { matchesApi } from '@/api/matches.ts'
import { negotiationsApi } from '@/api/negotiations.ts'
import { dealsApi } from '@/api/deals.ts'
import { contractsApi } from '@/api/contracts.ts'
import { notificationsApi } from '@/api/notifications.ts'
import { MatchCard } from '@/components/collaboration/match-card'
import { formatNegotiationDisplayTitle } from '@/lib/entity-display-titles.ts'
import {
  PmContentCard,
  PmDashboardLayout,
  PmSectionHeader,
} from '@/components/layout/pm-layout-index'
import {
  PmActionHub,
  type PmActionHubItem,
  PmButton,
  PmEmptyState,
  PmPageActions,
  PmStatsStrip,
  PmSurface,
  PmWorkflowBadge,
} from '@/components/ui/pm-index'
import { useAuth } from '@/providers/auth-provider'
import { pmTypography } from '@/components/shared/pm-design-tokens'
import { formatDate, formatRelativeTime } from '@/lib/format'
import { cn } from '@/lib/utils'

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
  const contracts = contractsApi.list()
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
        href: `/deals/${d.id}`,
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
        href: `/matches/${m.id}`,
      })),
    ...negotiations
      .filter((n) => n.status === 'countered' || n.status === 'cancelled')
      .map((n) => ({
        id: `blocked-neg-${n.id}`,
        label: formatNegotiationDisplayTitle(n, opportunitiesApi.get),
        href: `/negotiations/${n.id}`,
      })),
  ].slice(0, 4)

  const recommendedAction =
    needsActionItems[0]?.primary?.href
      ? {
          label: needsActionItems[0].primary.label,
          href: needsActionItems[0].primary.href,
        }
      : {
          label: 'Post opportunity',
          href: '/opportunities/create',
        }

  return (
    <PmDashboardLayout
      metrics={
        <PmStatsStrip
          data-slot="pm-dashboard-metric-strip"
          items={[
            { label: 'My opportunities', value: opportunities.filter((o) => o.creatorId === userId).length },
            { label: 'My matches', value: matches.length },
            { label: 'My negotiations', value: negotiations.length },
            { label: 'My deals', value: deals.length },
            { label: 'My contracts', value: contracts.length },
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
        title="My tasks"
        description="Items that need your action to keep execution moving."
        items={needsActionItems}
        emptyAction={
          <PmPageActions
            primary={{ label: 'Post opportunity', href: '/opportunities/create' }}
            secondary={{ label: 'My pipeline', href: '/pipeline', variant: 'outline' }}
          />
        }
      />

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
          action={
            <PmButton size="sm" asChild>
              <Link to="/pipeline">Open pipeline</Link>
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
          description="Your workflow is moving. Keep monitoring negotiations and deals."
          size="compact"
          action={
            <PmButton size="sm" variant="outline" asChild>
              <Link to="/pipeline">Open pipeline</Link>
            </PmButton>
          }
        />
      ) : (
        <ul className={cn('space-y-2', pmTypography.bodySm)}>
          {blockedItems.map((item) => (
            <li key={item.id}>
              <Link to={item.href} className="font-medium text-primary hover:underline">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <PmSectionHeader
        title="Next action"
        description="Single recommended step to keep execution moving."
        actions={
          <PmButton size="sm" asChild>
            <Link to={recommendedAction.href}>{recommendedAction.label}</Link>
          </PmButton>
        }
      />
      <PmSurface variant="default" shadow="card" className="rounded-3xl p-5">
        <p className={cn(pmTypography.bodySm, 'text-muted-foreground')}>
          Focus on one action at a time: complete your current stage, then move to the next stage in the collaboration chain.
        </p>
      </PmSurface>

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
    </PmDashboardLayout>
  )
}
