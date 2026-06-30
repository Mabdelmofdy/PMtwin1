import { Link } from 'react-router-dom'
import { opportunitiesApi } from '@/api/opportunities.ts'
import { matchesApi } from '@/api/matches.ts'
import { negotiationsApi } from '@/api/negotiations.ts'
import { notificationsApi } from '@/api/notifications.ts'
import { formatDate, formatRelativeTime } from '@/lib/format'
import { OpportunityCard } from '@/components/opportunity/opportunity-card'
import { MatchCard } from '@/components/collaboration/match-card'
import { resolveProfileReadiness } from '@/components/readiness/profile-readiness-card'
import { MOCK_MESSAGE_THREADS } from '@/components/user/user-display'
import {
  PmContentCard,
  PmDashboardLayout,
  PmMetricGrid,
  PmSectionHeader,
} from '@/components/layout/pm-layout-index'
import { PmBadge, PmButton, PmStatCard, PmWorkflowBadge } from '@/components/ui/pm-index'
import { useAuth } from '@/providers/auth-provider'
import { pmTypography } from '@/components/shared/pm-design-tokens'
import { cn } from '@/lib/utils'

/** User-focused dashboard widgets — recent activity across workspace. */
export function UserDashboardSection() {
  const { user, isCompanyUser } = useAuth()
  const userId = user?.id
  const profileKind = isCompanyUser ? 'company' : 'individual'

  const recentOpportunities = opportunitiesApi
    .list()
    .filter((o) => !userId || o.creatorId === userId)
    .sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))
    .slice(0, 3)

  const recentMatches = matchesApi.list().slice(0, 3)
  const recentNegotiations = negotiationsApi.list().slice(0, 3)
  const notifications = userId ? notificationsApi.list(userId).slice(0, 4) : []
  const unreadCount = userId ? notificationsApi.unreadCount(userId) : 0
  const readiness = user?.profile
    ? resolveProfileReadiness(user.profile, profileKind)
    : null

  return (
    <PmDashboardLayout
      header={
        <PmSectionHeader
          title="Your workspace"
          description="Recent activity across opportunities, collaboration, and alerts."
        />
      }
      metrics={
        <PmMetricGrid columns={4}>
          <PmStatCard label="Recent opportunities" value={recentOpportunities.length} dense />
          <PmStatCard label="Active matches" value={recentMatches.length} dense />
          <PmStatCard label="Negotiations" value={recentNegotiations.length} dense />
          <PmStatCard
            label="Unread alerts"
            value={unreadCount}
            dense
            hint={unreadCount > 0 ? 'In notification feed' : 'All caught up'}
          />
        </PmMetricGrid>
      }
      quickActions={
        <>
          <PmContentCard title="Quick actions">
            <div className="flex flex-wrap gap-2">
              <PmButton size="sm" asChild>
                <Link to="/opportunities/create">Post opportunity</Link>
              </PmButton>
              <PmButton size="sm" variant="outline" asChild>
                <Link to="/matches">View matches</Link>
              </PmButton>
              <PmButton size="sm" variant="outline" asChild>
                <Link to="/messages">Open messages</Link>
              </PmButton>
              <PmButton size="sm" variant="outline" asChild>
                <Link to="/profile">Edit profile</Link>
              </PmButton>
            </div>
          </PmContentCard>
          {readiness ? (
            <PmContentCard title="Profile completion">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={cn(pmTypography.label)}>Readiness score</span>
                  <PmBadge tone={readiness.score >= 80 ? 'success' : 'warning'}>
                    {Math.round(readiness.score)}%
                  </PmBadge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Complete your profile to improve matching quality.
                </p>
                <PmButton size="sm" variant="outline" className="w-full" asChild>
                  <Link to="/profile">Complete profile</Link>
                </PmButton>
              </div>
            </PmContentCard>
          ) : null}
        </>
      }
      recentActivity={
        <PmContentCard title="Recent messages">
          <ul className="space-y-2 text-sm">
            {MOCK_MESSAGE_THREADS.map((thread) => (
                <li key={thread.id}>
                  <Link
                    to={`/messages/${thread.id}`}
                    className="flex items-center justify-between hover:text-primary"
                  >
                    <span className="font-medium">{thread.name}</span>
                    {thread.unread > 0 ? (
                      <PmBadge tone="primary" size="sm">
                        {thread.unread}
                      </PmBadge>
                    ) : null}
                  </Link>
                  <p className="truncate text-xs text-muted-foreground">{thread.preview}</p>
                </li>
              ))}
          </ul>
        </PmContentCard>
      }
    >
      <PmSectionHeader
        title="Recent opportunities"
        actions={
          <PmButton size="sm" variant="outline" asChild>
            <Link to="/opportunities">View all</Link>
          </PmButton>
        }
      />
      {recentOpportunities.length === 0 ? (
        <PmContentCard>
          <p className="text-sm text-muted-foreground">No recent opportunities.</p>
        </PmContentCard>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {recentOpportunities.map((opp) => (
            <OpportunityCard key={opp.id} opportunity={opp} showActions />
          ))}
        </div>
      )}

      <PmSectionHeader
        title="Recent matches"
        className="mt-8"
        actions={
          <PmButton size="sm" variant="outline" asChild>
            <Link to="/matches">View all</Link>
          </PmButton>
        }
      />
      {recentMatches.length === 0 ? (
        <PmContentCard>
          <p className="text-sm text-muted-foreground">No matches yet.</p>
        </PmContentCard>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {recentMatches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}

      <PmSectionHeader
        title="Recent negotiations"
        className="mt-8"
        actions={
          recentNegotiations[0] ? (
            <PmButton size="sm" variant="outline" asChild>
              <Link to={`/negotiations/${recentNegotiations[0].id}`}>Open latest</Link>
            </PmButton>
          ) : undefined
        }
      />
      {recentNegotiations.length === 0 ? (
        <PmContentCard>
          <p className="text-sm text-muted-foreground">No negotiations yet.</p>
        </PmContentCard>
      ) : (
        <PmContentCard>
          <ul className="space-y-2 text-sm">
            {recentNegotiations.map((neg) => (
              <li key={neg.id} className="flex items-center justify-between gap-2">
                <Link
                  to={`/negotiations/${neg.id}`}
                  className="font-medium hover:text-primary"
                >
                  Negotiation {neg.id}
                </Link>
                <PmWorkflowBadge status={neg.status} entity="negotiation" />
                <span className="text-xs text-muted-foreground">
                  {neg.updatedAt ? formatDate(neg.updatedAt) : '—'}
                </span>
              </li>
            ))}
          </ul>
        </PmContentCard>
      )}

      <PmSectionHeader
        title="Recent notifications"
        className="mt-8"
        actions={
          <PmButton size="sm" variant="outline" asChild>
            <Link to="/notifications">View all</Link>
          </PmButton>
        }
      />
      {notifications.length === 0 ? (
        <PmContentCard>
          <p className="text-sm text-muted-foreground">No notifications.</p>
        </PmContentCard>
      ) : (
        <PmContentCard>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {notifications.map((n) => (
              <li key={n.id} className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className={cn(!n.read && 'font-medium text-foreground')}>{n.title}</p>
                  <p className="line-clamp-1 text-xs">{n.message}</p>
                </div>
                <span className="shrink-0 text-xs">
                  {formatRelativeTime(n.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        </PmContentCard>
      )}
    </PmDashboardLayout>
  )
}
