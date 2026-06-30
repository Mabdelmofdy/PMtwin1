import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { opportunitiesApi } from '@/api/opportunities.ts'
import { pmTypography } from '@/components/shared/pm-design-tokens'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { OpportunityCard } from '@/components/opportunity/opportunity-card'
import {
  PmContentCard,
  PmDashboardLayout,
  PmSectionHeader,
} from '@/components/layout/pm-layout-index'
import { PmButton, PmSurface } from '@/components/ui/pm-index'
import { useAuth } from '@/providers/auth-provider'

/** Opportunity-focused dashboard section — recent postings and quick actions. */
export function OpportunityDashboardSection() {
  const { user } = useAuth()
  const opportunities = opportunitiesApi.list()
  const myRecent = opportunities
    .filter((o) => o.creatorId === user?.id)
    .sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))
    .slice(0, 3)

  return (
    <PmSurface variant="muted" className="p-4 md:p-6">
      <PmDashboardLayout
        header={
          <PmSectionHeader
            title="My opportunities"
            description="Your latest postings and drafts."
            actions={
              <PmButton size="sm" asChild>
                <Link to="/opportunities/create">
                  <Plus className="size-4" aria-hidden />
                  Post opportunity
                </Link>
              </PmButton>
            }
          />
        }
        quickActions={
          <PmContentCard title="Quick actions">
            <div className="flex flex-wrap gap-2">
              <PmButton size="sm" asChild>
                <Link to="/opportunities/create">Create opportunity</Link>
              </PmButton>
              <PmButton size="sm" variant="outline" asChild>
                <Link to="/opportunities">Browse marketplace</Link>
              </PmButton>
              <PmButton size="sm" variant="outline" asChild>
                <Link to="/pipeline">Open pipeline</Link>
              </PmButton>
            </div>
          </PmContentCard>
        }
        recentActivity={
          myRecent.length > 0 ? (
            <PmContentCard title="Latest updates">
              <ul className={cn('space-y-2', pmTypography.bodySm, 'text-muted-foreground')}>
                {myRecent.map((opp) => (
                  <li key={opp.id}>
                    <Link to={`/opportunities/${opp.id}`} className="hover:text-primary">
                      {opp.title}
                    </Link>
                    {' — '}
                    {formatDate(opp.updatedAt)}
                  </li>
                ))}
              </ul>
            </PmContentCard>
          ) : undefined
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
        {myRecent.length === 0 ? (
          <PmContentCard>
            <p className={cn(pmTypography.bodySm, 'text-muted-foreground')}>
              You have not created any opportunities yet.
            </p>
          </PmContentCard>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {myRecent.map((opp) => (
              <OpportunityCard key={opp.id} opportunity={opp} showActions />
            ))}
          </div>
        )}
      </PmDashboardLayout>
    </PmSurface>
  )
}
