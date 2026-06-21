import { useNavigate, useParams } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { matchesApi } from '@/api/matches.ts'
import { negotiationsApi } from '@/api/negotiations.ts'
import { formatDate, formatPercent } from '@/lib/format'
import { useDataStoreVersion } from '@/hooks/use-data-store'
import { PageHeader, StatCard, StatusBadge } from '@/components/shared/page-primitives'
import { PipelineBoard } from '@/components/pipeline/pipeline-board'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function PipelinePage() {
  const { tab } = useParams()
  const navigate = useNavigate()
  const activeTab = tab ?? 'opportunities'
  const version = useDataStoreVersion()
  const matches = matchesApi.list()

  return (
    <div className="space-y-6">
      <PageHeader
        label="Workflow"
        title="Pipeline"
        description="Drag cards onto sidebar stages to update opportunity or application status."
      />
      <Tabs
        value={activeTab}
        onValueChange={(v) =>
          navigate(v === 'opportunities' ? '/pipeline' : `/pipeline/${v}`)
        }
      >
        <TabsList>
          {['opportunities', 'applications', 'matches'].map((t) => (
            <TabsTrigger key={t} value={t} className="cursor-pointer capitalize">
              {t}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="opportunities" className="mt-4">
          <PipelineBoard mode="opportunities" key={`opp-${version}`} />
        </TabsContent>
        <TabsContent value="applications" className="mt-4">
          <PipelineBoard mode="applications" key={`app-${version}`} />
        </TabsContent>
        <TabsContent value="matches" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {matches.map((m) => (
              <Link key={m.id} to={`/matches/${m.id}`} className="cursor-pointer">
                <Card className="hover:border-primary/30 hover:shadow-md">
                  <CardHeader className="flex-row items-center justify-between pb-2">
                    <CardTitle className="text-base">
                      {m.matchType.replace(/_/g, ' ')}
                    </CardTitle>
                    <span className="text-lg font-semibold text-primary">
                      {formatPercent(m.matchScore)}
                    </span>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
                    <StatusBadge status={m.status} />
                    <span>{formatDate(m.createdAt)}</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export function MatchesPage() {
  const matches = matchesApi.list()
  return (
    <div className="space-y-6">
      <PageHeader label="Matching" title="Matches" description="AI-ranked post-matches for your opportunities." />
      <div className="grid gap-4 md:grid-cols-2">
        {matches.map((m) => (
          <Link key={m.id} to={`/matches/${m.id}`} className="cursor-pointer">
            <Card className="transition-all hover:border-primary/30 hover:shadow-md">
              <CardHeader className="flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">{m.matchType.replace(/_/g, ' ')}</CardTitle>
                <span className="text-lg font-semibold text-primary">{formatPercent(m.matchScore)}</span>
              </CardHeader>
              <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
                <StatusBadge status={m.status} />
                <span>{formatDate(m.createdAt)}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}

export function MatchDetailPage() {
  const { id } = useParams()
  const match = id ? matchesApi.get(id) : undefined
  if (!match) return <p className="text-muted-foreground">Match not found.</p>
  return (
    <div className="space-y-6">
      <PageHeader
        title={`Match ${formatPercent(match.matchScore)}`}
        description={`${match.matchType} · ${match.status}`}
        actions={
          <>
            <Button variant="outline" className="cursor-pointer">Decline</Button>
            <Button className="cursor-pointer">Accept</Button>
          </>
        }
      />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Skill match" value={formatPercent(match.payload?.breakdown?.skillMatch ?? 0)} />
        <StatCard label="Timeline fit" value={formatPercent(match.payload?.breakdown?.timelineFit ?? 0)} />
        <StatCard label="Location fit" value={formatPercent(match.payload?.breakdown?.locationFit ?? 0)} />
      </div>
      <Card>
        <CardHeader><CardTitle>Participants</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {match.participants?.map((p) => (
            <p key={p.userId}>{p.role} — {p.userId} ({p.participantStatus})</p>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

export function NegotiationDetailPage() {
  const { id } = useParams()
  const neg = id ? negotiationsApi.get(id) : undefined
  return (
    <div className="space-y-6">
      <PageHeader
        title={neg ? `Negotiation ${neg.id}` : 'Negotiation'}
        description={neg?.status ?? 'Value negotiation workspace'}
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Discussion</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">Terms sheet, rounds timeline, and proposal form.</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full cursor-pointer">Submit proposal</Button>
            <Button variant="outline" className="w-full cursor-pointer">Escalate dispute</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
