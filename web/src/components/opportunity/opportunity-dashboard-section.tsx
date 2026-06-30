import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { opportunitiesApi } from '@/api/opportunities.ts'
import { adminApi } from '@/api/admin.ts'
import { formatDate } from '@/lib/format'
import { countOpportunityBuckets } from '@/components/opportunity/opportunity-display'
import { OpportunityCard } from '@/components/opportunity/opportunity-card'
import {
  PmContentCard,
  PmDashboardLayout,
  PmSectionHeader,
} from '@/components/layout/pm-layout-index'
import { PmButton, PmStatCard } from '@/components/ui/pm-index'
import { useAuth } from '@/providers/auth-provider'

/** Opportunity-focused dashboard section — My Drafts through Quick Actions. */
export function OpportunityDashboardSection() {
  const { user } = useAuth()
  const opportunities = opportunitiesApi.list()
  const buckets = countOpportunityBuckets(opportunities, user?.id)
  const myRecent = opportunities
    .filter((o) => o.creatorId === user?.id)
    .sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''))
    .slice(0, 3)

  const auditEntries = adminApi.getAuditLog().slice(0, 4)

  return (
    <PmDashboardLayout
      header={
        <PmSectionHeader
          title="My opportunities"
          description="Track drafts, published postings, and collaboration progress."
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
      metrics={
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <PmStatCard label="My drafts" value={buckets.drafts} dense />
          <PmStatCard label="Published" value={buckets.published} dense />
          <PmStatCard label="Matched" value={buckets.matched} dense />
          <PmStatCard label="Negotiating" value={buckets.negotiating} dense />
          <PmStatCard label="Completed" value={buckets.completed} dense />
        </div>
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
        <PmContentCard title="Recent activity">
          {auditEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent activity.</p>
          ) : (
            <ul className="space-y-2 text-sm text-muted-foreground">
              {auditEntries.map((entry) => (
                <li key={entry.id}>
                  {entry.action} — {formatDate(entry.timestamp)}
                </li>
              ))}
            </ul>
          )}
        </PmContentCard>
      }
    >
      <PmSectionHeader
        title="Recent opportunities"
        description="Your latest postings and drafts."
        actions={
          <PmButton size="sm" variant="outline" asChild>
            <Link to="/opportunities">View all</Link>
          </PmButton>
        }
      />
      {myRecent.length === 0 ? (
        <PmContentCard>
          <p className="text-sm text-muted-foreground">
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
  )
}
