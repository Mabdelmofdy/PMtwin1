import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useAuth } from '@/providers/auth-provider'
import { matchesApi } from '@/api/matches.ts'
import { WorkspaceDashboardComposition } from '@/components/layout/workspace-dashboard-composition'
import { PmPageLayout, countActiveMatches } from '@/components/layout/pm-layout-index'
import { resolveProfileReadiness } from '@/components/readiness/profile-readiness-card'
import {
  PmButton,
  PmPageActions,
  PmPageHeader,
  PmPageHeroMetric,
} from '@/components/ui/pm-index'
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
          title="What needs attention"
          description={`Good morning, ${firstName} — review urgent workflow steps, matches, and pipeline progress.`}
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
                label: 'Post opportunity',
                href: '/opportunities/create',
                render: () => (
                  <PmButton asChild>
                    <Link to="/opportunities/create">
                      Post opportunity
                      <ArrowRight className="size-4 rtl:rotate-180" aria-hidden />
                    </Link>
                  </PmButton>
                ),
              }}
              secondary={{ label: 'Open pipeline', href: '/pipeline', variant: 'outline' }}
            />
          }
        />
      }
    >
      <WorkspaceDashboardComposition />
    </PmPageLayout>
  )
}
