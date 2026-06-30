import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useAuth } from '@/providers/auth-provider'
import { matchesApi } from '@/api/matches.ts'
import { WorkspaceDashboardComposition } from '@/components/layout/workspace-dashboard-composition'
import { PmPageLayout, countActiveMatches } from '@/components/layout/pm-layout-index'
import { resolveProfileReadiness } from '@/components/readiness/profile-readiness-card'
import { PmBadge, PmButton, PmPageHeader, PmPageHeroMetric, PmReadinessScoreBadge } from '@/components/ui/pm-index'
import { formatReadinessScorePercent } from '@/components/ui/pm-readiness-score-display'

export function DashboardPage() {
  const { user, isCompanyUser } = useAuth()
  const firstName = (user?.profile?.name ?? 'there').split(' ')[0]
  const matches = matchesApi.list()
  const activeMatches = countActiveMatches(matches)
  const profileKind = isCompanyUser ? 'company' : 'individual'
  const readiness = user?.profile
    ? resolveProfileReadiness(user.profile, profileKind)
    : null

  return (
    <PmPageLayout
      header={
        <PmPageHeader
          label="Workspace"
          title={`Good morning, ${firstName}`}
          description="Your collaboration hub — opportunities, matches, and pipeline progress at a glance."
          metric={
            readiness ? (
              <PmPageHeroMetric
                value={formatReadinessScorePercent(readiness.score)}
                label="Profile readiness"
                animate={false}
              />
            ) : (
              <PmPageHeroMetric
                value={activeMatches}
                label="Active matches"
              />
            )
          }
          badges={
            <>
              <PmBadge tone="info">{activeMatches} active matches</PmBadge>
              {readiness ? (
                <PmReadinessScoreBadge score={readiness.score} variant="compact" showLabel />
              ) : null}
            </>
          }
          actions={
            <>
              <PmButton asChild>
                <Link to="/opportunities/create">
                  Post opportunity
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </PmButton>
              <PmButton variant="outline" asChild>
                <Link to="/pipeline">Open pipeline</Link>
              </PmButton>
            </>
          }
        />
      }
    >
      <div className="flex flex-col gap-8 pm-section-gap">
        <WorkspaceDashboardComposition />
      </div>
    </PmPageLayout>
  )
}
