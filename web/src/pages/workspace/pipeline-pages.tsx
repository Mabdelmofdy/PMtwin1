import { useNavigate, useParams } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { matchesApi } from '@/api/matches.ts'
import { negotiationsApi } from '@/api/negotiations.ts'
import { opportunitiesApi } from '@/api/opportunities.ts'
import { peopleApi } from '@/api/people.ts'
import { formatDate, formatPercent } from '@/lib/format'
import {
  acceptPostMatchUiAction,
  declinePostMatchUiAction,
} from '@/lib/post-match-ui-actions.ts'
import { buildMatchDetailReadModel } from '@/lib/match-detail-read-model.ts'
import { useDataStoreVersion } from '@/hooks/use-data-store'
import { useAuth } from '@/providers/auth-provider'
import { PageHeader, StatCard, StatusBadge } from '@/components/shared/page-primitives'
import { CreateDealButton } from '@/components/negotiation/create-deal-button.tsx'
import { StartNegotiationButton } from '@/components/negotiation/start-negotiation-button.tsx'
import { AgreeNegotiationButton } from '@/components/negotiation/agree-negotiation-button.tsx'
import { CancelNegotiationButton } from '@/components/negotiation/cancel-negotiation-button.tsx'
import {
  canShowNegotiationTransition,
  transitionNegotiationStatusUiAction,
} from '@/lib/negotiation-ui-actions.ts'
import { dealRepository } from '@/repositories/index.ts'
import { PipelineBoard } from '@/components/pipeline/pipeline-board'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import type { Negotiation, PostMatch } from '@/types/domain.ts'

const MATCH_TYPE_BADGE_STYLES: Record<string, string> = {
  one_way: 'bg-sky-500/10 text-sky-700 dark:text-sky-400',
  two_way: 'bg-violet-500/10 text-violet-700 dark:text-violet-400',
  consortium: 'bg-amber-500/10 text-amber-800 dark:text-amber-300',
  circular: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
}

function MatchTypeBadge({
  matchType,
  label,
}: {
  matchType: string
  label: string
}) {
  const key = matchType.toLowerCase()
  const style =
    MATCH_TYPE_BADGE_STYLES[key] ??
    'bg-muted text-muted-foreground'

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold uppercase tracking-wide',
        style,
      )}
    >
      {label}
    </span>
  )
}

function resolveMatchNegotiation(match: PostMatch): Negotiation | undefined {
  if (match.negotiationId) {
    return negotiationsApi.get(match.negotiationId)
  }
  const linked = negotiationsApi.getByPostMatchId(match.id)
  return linked[0]
}

const PIPELINE_TABS = [
  { value: 'opportunities', label: 'Opportunities' },
  { value: 'matches', label: 'Post-matches' },
  { value: 'applications', label: 'Applications (legacy)' },
] as const

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
        description="Track opportunities and PostMatches through negotiation, deal, and contract. Applications are a legacy hiring path."
      />
      <Tabs
        value={activeTab}
        onValueChange={(v) =>
          navigate(v === 'opportunities' ? '/pipeline' : `/pipeline/${v}`)
        }
      >
        <TabsList>
          {PIPELINE_TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value} className="cursor-pointer">
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="opportunities" className="mt-4">
          <PipelineBoard mode="opportunities" key={`opp-${version}`} />
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
                    <StatusBadge status={m.status} entity="match" />
                    <span>{formatDate(m.createdAt)}</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="applications" className="mt-4">
          <p className="mb-4 text-sm text-muted-foreground">
            Legacy hiring applications — primary collaboration runs through Post-matches.
          </p>
          <PipelineBoard mode="applications" key={`app-${version}`} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export function MatchesPage() {
  const matches = matchesApi.list()
  return (
    <div className="space-y-6">
      <PageHeader
        label="Collaboration"
        title="Post-matches"
        description="Ranked matches for your opportunities — accept, negotiate, create deals, then contracts."
      />
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
  const { user, isPendingApproval } = useAuth()
  const version = useDataStoreVersion()
  const match = id ? matchesApi.get(id) : undefined
  const [pendingAction, setPendingAction] = useState<'accept' | 'decline' | null>(null)

  const model = useMemo(() => {
    if (!match) return null
    return buildMatchDetailReadModel(match, {
      getOpportunity: opportunitiesApi.get,
      getNegotiationsForPostMatch: negotiationsApi.getByPostMatchId,
      getDealForPostMatch: (postMatchId) => dealRepository.findByPostMatchId(postMatchId),
      getPersonName: (userId) => peopleApi.get(userId)?.profile?.name,
      currentUserId: user?.id ?? null,
      canAct: !isPendingApproval,
    })
  }, [match, user?.id, isPendingApproval, version])

  const runPostMatchAction = (action: 'accept' | 'decline') => {
    if (!id || pendingAction) return
    if (!user?.id) {
      toast.error('Sign in to respond to this match.')
      return
    }
    setPendingAction(action)
    const result =
      action === 'accept'
        ? acceptPostMatchUiAction(id, user.id)
        : declinePostMatchUiAction(id, user.id)
    setPendingAction(null)

    if (!result.success) {
      toast.error(result.message)
      return
    }

    toast.success(
      action === 'accept' ? 'Match accepted' : 'Match declined',
      { description: `Status is now ${result.status}.` },
    )
  }

  if (!match || !model) return <p className="text-muted-foreground">Match not found.</p>

  const negotiation = resolveMatchNegotiation(match)
  const { actions } = model
  const actionPending = pendingAction !== null

  return (
    <div className="space-y-6" key={`match-detail-${version}`}>
      <PageHeader
        title={`Match ${model.scoreLabel}`}
        description={`${model.matchTypeLabel} · ${model.canonicalStatus}`}
        actions={
          <>
            {model.canAct && actions.showAccept ? (
              <Button
                className="cursor-pointer"
                disabled={actionPending}
                onClick={() => runPostMatchAction('accept')}
              >
                {pendingAction === 'accept' ? 'Accepting…' : 'Accept'}
              </Button>
            ) : null}

            {model.canAct && actions.showDecline ? (
              <Button
                variant="outline"
                className="cursor-pointer"
                disabled={actionPending}
                onClick={() => runPostMatchAction('decline')}
              >
                {pendingAction === 'decline' ? 'Declining…' : 'Decline'}
              </Button>
            ) : null}

            {model.canAct && actions.showStartNegotiation ? (
              <StartNegotiationButton match={match} variant="default" />
            ) : null}

            {actions.showViewNegotiation && actions.negotiationId ? (
              <Button variant="secondary" className="cursor-pointer" asChild>
                <Link to={`/negotiations/${actions.negotiationId}`}>View negotiation</Link>
              </Button>
            ) : null}

            {actions.showViewDeal && actions.dealId ? (
              <Button variant="secondary" className="cursor-pointer" asChild>
                <Link to={`/deals/${actions.dealId}`}>View deal</Link>
              </Button>
            ) : null}
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <MatchTypeBadge matchType={match.matchType} label={model.matchTypeLabel} />
        <StatusBadge status={match.status} entity="match" />
      </div>

      {!model.isParticipant && user ? (
        <p className="text-sm text-muted-foreground">
          You are viewing this match in read-only mode — you are not a participant.
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Skill match" value={formatPercent(match.payload?.breakdown?.skillMatch ?? 0)} />
        <StatCard label="Timeline fit" value={formatPercent(match.payload?.breakdown?.timelineFit ?? 0)} />
        <StatCard label="Location fit" value={formatPercent(match.payload?.breakdown?.locationFit ?? 0)} />
      </div>

      {model.relatedOpportunities.length > 0 ? (
        <Card>
          <CardHeader><CardTitle>Related opportunities</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {model.relatedOpportunities.map((item) => (
                <li key={`${item.id}-${item.label}`}>
                  <span className="text-muted-foreground">{item.label}:</span>{' '}
                  {item.isCurrent ? (
                    <span className="font-medium">{item.title}</span>
                  ) : (
                    <Link
                      to={item.path}
                      className="font-medium text-primary hover:underline"
                    >
                      {item.title}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader><CardTitle>Participants</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {model.participants.map((participant) => (
            <p key={participant.userId}>
              {participant.role.replace(/_/g, ' ')} — {participant.displayName}
              {participant.participantStatus
                ? ` (${participant.participantStatus})`
                : null}
            </p>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Negotiation</CardTitle>
          {negotiation ? (
            <StatusBadge status={negotiation.status} />
          ) : null}
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {negotiation ? (
            <>
              <p className="text-muted-foreground">
                Terms discussion for this confirmed match.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" className="cursor-pointer" asChild>
                  <Link to={`/negotiations/${negotiation.id}`}>Open negotiation</Link>
                </Button>
                <AgreeNegotiationButton negotiation={negotiation} />
                <CancelNegotiationButton negotiation={negotiation} />
                <CreateDealButton negotiation={negotiation} variant="default" />
              </div>
            </>
          ) : (
            <>
              <p className="text-muted-foreground">
                No negotiation linked yet. Start negotiating terms before creating a deal.
              </p>
              <StartNegotiationButton match={match} className="mt-2" />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export function NegotiationDetailPage() {
  const { id } = useParams()
  const version = useDataStoreVersion()
  const neg = id ? negotiationsApi.get(id) : undefined
  const [proposalPending, setProposalPending] = useState(false)

  const canSubmitProposal = canShowNegotiationTransition(neg, 'countered')
  const canAcceptUpdatedProposal = canShowNegotiationTransition(neg, 'active')

  const handleProposalTransition = (targetStatus: 'countered' | 'active') => {
    if (!neg?.id || proposalPending) return
    setProposalPending(true)
    const result = transitionNegotiationStatusUiAction(neg.id, targetStatus)
    setProposalPending(false)

    if (!result.success) {
      toast.error(result.message)
      return
    }

    toast.success(
      targetStatus === 'countered'
        ? 'Counter proposal submitted'
        : 'Updated proposal accepted',
    )
  }

  return (
    <div className="space-y-6" key={`negotiation-detail-${version}`}>
      <PageHeader
        title={neg ? `Negotiation ${neg.id}` : 'Negotiation'}
        description={neg?.status ?? 'Value negotiation workspace'}
        actions={
          <>
            <AgreeNegotiationButton negotiation={neg} />
            <CancelNegotiationButton negotiation={neg} />
            <CreateDealButton negotiation={neg} />
          </>
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Discussion</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">Terms sheet, rounds timeline, and proposal form.</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <AgreeNegotiationButton negotiation={neg} className="w-full" />
            <CancelNegotiationButton negotiation={neg} className="w-full" variant="destructive" />
            <CreateDealButton negotiation={neg} className="w-full" />
            {canSubmitProposal ? (
              <Button
                type="button"
                className="w-full cursor-pointer"
                disabled={proposalPending}
                onClick={() => handleProposalTransition('countered')}
              >
                {proposalPending ? 'Submitting…' : 'Submit proposal'}
              </Button>
            ) : null}
            {canAcceptUpdatedProposal ? (
              <Button
                type="button"
                variant="outline"
                className="w-full cursor-pointer"
                disabled={proposalPending}
                onClick={() => handleProposalTransition('active')}
              >
                {proposalPending ? 'Accepting…' : 'Accept updated proposal'}
              </Button>
            ) : null}
            <Button variant="outline" className="w-full cursor-pointer" disabled>
              Escalate dispute
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
