import { Link } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  Briefcase,
  Handshake,
  Lightbulb,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { opportunitiesApi } from '@/api/opportunities.ts'
import { matchesApi } from '@/api/matches.ts'
import { negotiationsApi } from '@/api/negotiations.ts'
import { dealsApi } from '@/api/deals.ts'
import { notificationsApi } from '@/api/notifications.ts'
import { MatchCard } from '@/components/collaboration/match-card'
import { OpportunityCard } from '@/components/opportunity/opportunity-card'
import { countOpportunityBuckets } from '@/components/opportunity/opportunity-display'
import { resolveProfileReadiness } from '@/components/readiness/profile-readiness-card'
import {
  PmContentCard,
  PmDashboardLayout,
  PmMetricGrid,
  PmSectionHeader,
  countActiveDeals,
  countActiveMatches,
  countActiveNegotiations,
} from '@/components/layout/pm-layout-index'
import {
  PmBadge,
  PmButton,
  PmMatchScoreBadge,
  PmReadinessScoreBadge,
  PmStatCard,
  PmSurface,
} from '@/components/ui/pm-index'
import { MOCK_MESSAGE_THREADS } from '@/components/user/user-display'
import { useAuth } from '@/providers/auth-provider'
import { pmTypography } from '@/components/shared/pm-design-tokens'
import { formatRelativeTime } from '@/lib/format'
import { cn } from '@/lib/utils'

/** Premium dashboard body — section hierarchy for workspace home. */
export function WorkspaceDashboardComposition() {
  const { user, isCompanyUser } = useAuth()
  const userId = user?.id
  const profileKind = isCompanyUser ? 'company' : 'individual'

  const opportunities = opportunitiesApi.list()
  const matches = matchesApi.list()
  const negotiations = negotiationsApi.list()
  const deals = dealsApi.list()
  const buckets = countOpportunityBuckets(opportunities, userId)
  const activeMatches = countActiveMatches(matches)
  const activeNegotiations = countActiveNegotiations(negotiations)
  const activeDeals = countActiveDeals(deals)
  const notifications = userId ? notificationsApi.list(userId).slice(0, 5) : []
  const unreadMessages = MOCK_MESSAGE_THREADS.reduce((sum, t) => sum + t.unread, 0)

  const recommendedMatches = [...matches]
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 3)

  const recentOpportunities = opportunities
    .filter((o) => !userId || o.creatorId === userId)
    .sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))
    .slice(0, 3)

  const readiness = user?.profile
    ? resolveProfileReadiness(user.profile, profileKind)
    : null

  const pipelineHealthPercent =
    opportunities.length > 0
      ? Math.round(
          ((activeMatches + activeNegotiations + activeDeals) /
            Math.max(opportunities.length, 1)) *
            100,
        )
      : 0

  return (
    <PmDashboardLayout
      metrics={
        <PmMetricGrid columns={4}>
          <PmStatCard
            label="Published"
            value={buckets.published}
            hint="Live in marketplace"
            icon={<Briefcase className="size-4" aria-hidden />}
          />
          <PmStatCard
            label="Active matches"
            value={activeMatches}
            hint="Awaiting response"
            icon={<Handshake className="size-4" aria-hidden />}
          />
          <PmStatCard
            label="Negotiating"
            value={buckets.negotiating}
            hint="In collaboration"
          />
          <PmStatCard
            label="Drafts"
            value={buckets.drafts}
            hint="Ready to publish"
            icon={<Sparkles className="size-4" aria-hidden />}
          />
        </PmMetricGrid>
      }
      charts={
        <PmContentCard
          title="Pipeline health"
          description="Workflow momentum across PostMatches, negotiations, and deals."
          actions={
            <PmButton size="sm" variant="outline" asChild>
              <Link to="/pipeline">Open pipeline</Link>
            </PmButton>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <PmStatCard label="Opportunities" value={opportunities.length} dense />
            <PmStatCard label="Active matches" value={activeMatches} dense />
            <PmStatCard label="Negotiations" value={activeNegotiations} dense />
            <PmStatCard label="Active deals" value={activeDeals} dense />
          </div>
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-border/60 bg-surface-muted/50 px-4 py-3">
            <TrendingUp className="size-4 shrink-0 text-primary" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className={cn(pmTypography.label)}>Collaboration velocity</p>
              <p className={cn(pmTypography.caption, 'text-muted-foreground')}>
                {pipelineHealthPercent}% of opportunities have active collaboration signals
              </p>
            </div>
            <PmBadge tone={pipelineHealthPercent >= 50 ? 'success' : 'warning'}>
              {pipelineHealthPercent}%
            </PmBadge>
          </div>
        </PmContentCard>
      }
      quickActions={
        <>
          <PmContentCard title="Today's summary">
            <ul className={cn('space-y-2', pmTypography.bodySm)}>
              {readiness ? (
                <li className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Profile readiness</span>
                  <PmReadinessScoreBadge score={readiness.score} variant="compact" />
                </li>
              ) : null}
              <li className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Unread messages</span>
                <PmBadge tone={unreadMessages > 0 ? 'primary' : 'muted'}>{unreadMessages}</PmBadge>
              </li>
              <li className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Notifications</span>
                <PmBadge tone={notifications.some((n) => !n.read) ? 'info' : 'muted'}>
                  {notifications.filter((n) => !n.read).length}
                </PmBadge>
              </li>
              <li className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Top match score</span>
                {recommendedMatches[0] ? (
                  <PmMatchScoreBadge score={recommendedMatches[0].matchScore} variant="compact" />
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </li>
            </ul>
          </PmContentCard>
          <PmContentCard title="Quick actions">
            <div className="flex flex-col gap-2">
              <PmButton size="sm" asChild>
                <Link to="/opportunities/create">
                  Post opportunity
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </PmButton>
              <PmButton size="sm" variant="outline" asChild>
                <Link to="/matches">View matches</Link>
              </PmButton>
              <PmButton size="sm" variant="outline" asChild>
                <Link to="/people">Browse talent</Link>
              </PmButton>
            </div>
          </PmContentCard>
        </>
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
            <p className={cn(pmTypography.bodySm, 'text-muted-foreground')}>No recent alerts.</p>
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
        <PmSurface variant="muted" className="p-6">
          <p className={cn(pmTypography.bodySm, 'text-muted-foreground')}>
            Publish opportunities to discover ranked PostMatches.
          </p>
        </PmSurface>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {recommendedMatches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}

      <PmSectionHeader
        title="Recent opportunities"
        className="mt-10"
        actions={
          <PmButton size="sm" variant="outline" asChild>
            <Link to="/opportunities">View all</Link>
          </PmButton>
        }
      />
      {recentOpportunities.length === 0 ? (
        <PmSurface variant="muted" className="p-6">
          <p className={cn(pmTypography.bodySm, 'text-muted-foreground')}>No recent opportunities.</p>
        </PmSurface>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {recentOpportunities.map((opp) => (
            <OpportunityCard key={opp.id} opportunity={opp} showActions />
          ))}
        </div>
      )}

      <PmSectionHeader
        title="Insights"
        description="Profile and workspace signals to improve matching quality."
        className="mt-10"
        actions={
          readiness ? (
            <PmButton size="sm" variant="outline" asChild>
              <Link to="/profile">Improve profile</Link>
            </PmButton>
          ) : undefined
        }
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {readiness ? (
          <PmContentCard title="Profile readiness">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary-muted text-primary">
                <Activity className="size-4" aria-hidden />
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className={pmTypography.label}>Completion score</span>
                  <PmReadinessScoreBadge score={readiness.score} variant="compact" />
                </div>
                <p className={cn(pmTypography.bodySm, 'text-muted-foreground')}>
                  Complete your profile to improve match quality and publish readiness.
                </p>
              </div>
            </div>
          </PmContentCard>
        ) : null}
        <PmContentCard title="Collaboration tip">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-surface-muted text-muted-foreground">
              <Lightbulb className="size-4" aria-hidden />
            </div>
            <p className={cn(pmTypography.bodySm, 'text-muted-foreground')}>
              Work through matches in order: respond to PostMatches, negotiate terms, create a deal,
              then finalize the contract. Applications remain off the primary path.
            </p>
          </div>
        </PmContentCard>
      </div>
    </PmDashboardLayout>
  )
}
