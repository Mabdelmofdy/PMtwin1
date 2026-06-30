import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useAuth } from '@/providers/auth-provider'
import { opportunitiesApi } from '@/api/opportunities.ts'
import { matchesApi } from '@/api/matches.ts'
import { OpportunityDashboardSection } from '@/components/opportunity/opportunity-dashboard-section'
import { UserDashboardSection } from '@/components/user/user-dashboard-section'
import { PmPageLayout } from '@/components/layout/pm-layout-index'
import { PmButton, PmPageHeader } from '@/components/ui/pm-index'

export function DashboardPage() {
  const { user } = useAuth()
  const firstName = (user?.profile?.name ?? 'there').split(' ')[0]
  const opps = opportunitiesApi.list()
  const matches = matchesApi.list()
  const published = opps.filter((o) => o.status === 'published').length

  return (
    <PmPageLayout
      header={
        <PmPageHeader
          label="Workspace"
          title={`Good morning, ${firstName}`}
          description={`${published} published opportunities and ${matches.length} active matches in your workspace.`}
          actions={
            <>
              <PmButton asChild>
                <Link to="/opportunities/create">
                  Post opportunity
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </PmButton>
              <PmButton variant="outline" asChild>
                <Link to="/people">Browse talent</Link>
              </PmButton>
            </>
          }
        />
      }
    >
      <div className="space-y-10">
        <UserDashboardSection />
        <OpportunityDashboardSection />
      </div>
    </PmPageLayout>
  )
}
