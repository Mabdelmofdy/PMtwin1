import { Link } from 'react-router-dom'
import { ArrowRight, Briefcase, Heart, Users } from 'lucide-react'
import { useAuth } from '@/providers/auth-provider'
import { opportunitiesApi } from '@/api/opportunities.ts'
import { matchesApi } from '@/api/matches.ts'
import { notificationsApi } from '@/api/notifications.ts'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

function StatCard({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint: string
}) {
  return (
    <Card className="border-border/60 shadow-sm transition-shadow duration-200 hover:shadow-md">
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl font-semibold tracking-tight">
          {value}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  )
}

export function DashboardPage() {
  const { user } = useAuth()
  const firstName = (user?.profile?.name ?? 'there').split(' ')[0]
  const opps = opportunitiesApi.list()
  const matches = matchesApi.list()
  const published = opps.filter((o) => o.status === 'published').length
  const highMatches = matches.filter((m) => m.matchScore >= 0.9).length

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <p className="text-sm font-medium text-primary">Workspace</p>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Good morning, {firstName}
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          {published} published opportunities and {matches.length} active matches in your workspace.
        </p>
        <div className="flex flex-wrap gap-2 pt-2">
          <Button className="cursor-pointer" asChild>
            <Link to="/opportunities/create">
              Post opportunity
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
          <Button variant="outline" className="cursor-pointer" asChild>
            <Link to="/people">Browse talent</Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Published opportunities" value={String(published)} hint={`${opps.length} total in marketplace`} />
        <StatCard label="Post-matches" value={String(matches.length)} hint={`${highMatches} above 90% fit`} />
        {user ? (
          <StatCard
            label="Unread alerts"
            value={String(notificationsApi.unreadCount(user.id))}
            hint="From notification feed"
          />
        ) : null}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          {
            title: 'Opportunities',
            description: 'Manage postings and applicant pipelines.',
            href: '/opportunities',
            icon: Briefcase,
          },
          {
            title: 'Matches',
            description: 'Review AI-ranked talent for your roles.',
            href: '/matches',
            icon: Heart,
          },
          {
            title: 'Find',
            description: 'Search professionals and companies.',
            href: '/people',
            icon: Users,
          },
        ].map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              to={item.href}
              className="group cursor-pointer rounded-xl border border-border/60 bg-card p-5 shadow-sm transition-all duration-200 hover:border-primary/30 hover:shadow-md"
            >
              <Icon
                className="mb-3 size-5 text-primary transition-transform duration-200 group-hover:scale-105"
                aria-hidden
              />
              <h2 className="font-semibold tracking-tight">{item.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {item.description}
              </p>
            </Link>
          )
        })}
      </section>
    </div>
  )
}
