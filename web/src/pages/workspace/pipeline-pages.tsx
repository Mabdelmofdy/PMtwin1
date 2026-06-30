import { useNavigate, useParams } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { matchesApi } from '@/api/matches.ts'
import { negotiationsApi } from '@/api/negotiations.ts'
import { opportunitiesApi } from '@/api/opportunities.ts'
import { peopleApi } from '@/api/people.ts'
import { dealsApi } from '@/api/deals.ts'
import { formatDate, formatPercent } from '@/lib/format'
import {
  acceptPostMatchUiAction,
  declinePostMatchUiAction,
} from '@/lib/post-match-ui-actions.ts'
import { buildMatchDetailReadModel } from '@/lib/match-detail-read-model.ts'
import { useDataStoreVersion } from '@/hooks/use-data-store'
import { useAuth } from '@/providers/auth-provider'
import { CreateDealButton } from '@/components/negotiation/create-deal-button.tsx'
import { StartNegotiationButton } from '@/components/negotiation/start-negotiation-button.tsx'
import { AgreeNegotiationButton } from '@/components/negotiation/agree-negotiation-button.tsx'
import { CancelNegotiationButton } from '@/components/negotiation/cancel-negotiation-button.tsx'
import {
  canShowNegotiationTransition,
  transitionNegotiationStatusUiAction,
} from '@/lib/negotiation-ui-actions.ts'
import { dealRepository, applicationRepository } from '@/repositories/index.ts'
import { PipelineBoard } from '@/components/pipeline/pipeline-board'
import { MatchesListSection } from '@/components/collaboration/matches-list-section'
import { CollaborationTimeline } from '@/components/collaboration/collaboration-timeline'
import {
  formatMatchTypeBadgeLabel,
  resolveCollaborationStepFromMatch,
  resolveCollaborationStepFromNegotiation,
  resolveMatchTypeTone,
} from '@/components/collaboration/collaboration-display'
import {
  PmContentCard,
  PmDetailLayout,
  PmInspectorLayout,
  PmMetricGrid,
  PmPageLayout,
  PmSectionHeader,
  countActiveMatches,
  countPipelineWorkflowItems,
} from '@/components/layout/pm-layout-index'
import {
  PmFormReadonly,
  PmFormReadonlyField,
  PmFormReadonlySection,
} from '@/components/forms/pm-form-index'
import {
  PmBadge,
  PmButton,
  PmEmptyState,
  PmMatchScoreBadge,
  PmPageHeader,
  PmPageHeroMetric,
  PmStatCard,
  PmSurface,
  PmWorkflowBadge,
} from '@/components/ui/pm-index'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Negotiation, PostMatch } from '@/types/domain.ts'
import type { CollaborationTimelineEvent } from '@/components/collaboration/collaboration-timeline'
import { productFlags } from '@/config/product-flags.ts'

function resolveMatchNegotiation(match: PostMatch): Negotiation | undefined {
  if (match.negotiationId) {
    return negotiationsApi.get(match.negotiationId)
  }
  const linked = negotiationsApi.getByPostMatchId(match.id)
  return linked[0]
}

const PIPELINE_TAB_DEFS = [
  { value: 'opportunities', label: 'Opportunities' },
  { value: 'matches', label: 'Post-matches' },
  { value: 'applications', label: 'Applications (legacy)' },
] as const

/** Visible pipeline tabs — applications tab omitted when legacy UI is suppressed. */
export function getVisiblePipelineTabs(showLegacyApplications: boolean) {
  return showLegacyApplications
    ? PIPELINE_TAB_DEFS
    : PIPELINE_TAB_DEFS.filter((t) => t.value !== 'applications')
}

export function PipelinePage() {
  const { tab } = useParams()
  const navigate = useNavigate()
  const showLegacyApplications = productFlags.showLegacyApplications
  const pipelineTabs = getVisiblePipelineTabs(showLegacyApplications)
  const activeTab =
    !showLegacyApplications && tab === 'applications' ? 'opportunities' : (tab ?? 'opportunities')
  const version = useDataStoreVersion()
  const opportunities = opportunitiesApi.list()
  const matches = matchesApi.list()
  const applications = applicationRepository.getAll()
  const applicationCount = showLegacyApplications ? applications.length : 0
  const workflowCount = countPipelineWorkflowItems(
    opportunities.length,
    matches.length,
    applicationCount,
  )
  const activeMatches = countActiveMatches(matches)

  useEffect(() => {
    if (!showLegacyApplications && tab === 'applications') {
      navigate('/pipeline', { replace: true })
    }
  }, [showLegacyApplications, tab, navigate])

  return (
    <PmPageLayout
      header={
        <PmPageHeader
          label="Workflow"
          title="Pipeline"
          description="Track opportunities and PostMatches through negotiation, deal, and contract."
          metric={
            <PmPageHeroMetric value={workflowCount} label="Active workflows" />
          }
          badges={
            <>
              <PmBadge tone="primary">{opportunities.length} opportunities</PmBadge>
              <PmBadge tone="info">{activeMatches} matches</PmBadge>
              {showLegacyApplications ? (
                <PmBadge tone="muted">{applications.length} applications</PmBadge>
              ) : null}
            </>
          }
        />
      }
    >
      <Tabs
        value={activeTab}
        onValueChange={(v) =>
          navigate(v === 'opportunities' ? '/pipeline' : `/pipeline/${v}`)
        }
      >
        <div className="pm-toolbar-surface rounded-xl px-4 py-3">
          <TabsList>
            {pipelineTabs.map((t) => (
              <TabsTrigger key={t.value} value={t.value} className="cursor-pointer">
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <TabsContent value="opportunities" className="mt-4">
          <PipelineBoard mode="opportunities" key={`opp-${version}`} />
        </TabsContent>
        <TabsContent value="matches" className="mt-4">
          <MatchesListSection matches={matches} compact />
        </TabsContent>
        {showLegacyApplications ? (
          <TabsContent value="applications" className="mt-4">
            <PmContentCard
              title="Legacy applications"
              description="Primary collaboration runs through Post-matches."
            >
              <PipelineBoard mode="applications" key={`app-${version}`} />
            </PmContentCard>
          </TabsContent>
        ) : null}
      </Tabs>
    </PmPageLayout>
  )
}

export function MatchesPage() {
  const matches = matchesApi.list()
  const activeMatches = countActiveMatches(matches)

  return (
    <PmPageLayout
      header={
        <PmPageHeader
          label="Collaboration"
          title="Post-matches"
          description="Ranked matches for your opportunities — accept, negotiate, create deals, then contracts."
          metric={
            <PmPageHeroMetric value={activeMatches} label="Active" />
          }
          badges={
            <>
              <PmBadge tone="primary">{matches.length} total</PmBadge>
              <PmBadge tone="success">
                {matches.filter((m) => m.status === 'accepted' || m.status === 'confirmed').length} accepted
              </PmBadge>
            </>
          }
        />
      }
    >
      <PmMetricGrid columns={3} className="mb-6">
        <PmStatCard label="Active" value={activeMatches} dense />
        <PmStatCard label="Total" value={matches.length} dense />
        <PmStatCard
          label="Accepted"
          value={matches.filter((m) => m.status === 'accepted' || m.status === 'confirmed').length}
          dense
        />
      </PmMetricGrid>
      <MatchesListSection matches={matches} />
    </PmPageLayout>
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

  if (!match || !model) {
    return (
      <PmPageLayout
        header={<PmPageHeader title="Match" description="Post-match detail." />}
      >
        <PmEmptyState
          title="Match not found"
          description="This match may have been removed or the link is invalid."
          action={
            <PmButton size="sm" variant="outline" asChild>
              <Link to="/matches">Back to matches</Link>
            </PmButton>
          }
        />
      </PmPageLayout>
    )
  }

  const negotiation = resolveMatchNegotiation(match)
  const deal = dealRepository.findByPostMatchId(match.id)
  const { actions } = model
  const actionPending = pendingAction !== null
  const collaborationStep = resolveCollaborationStepFromMatch({
    hasDeal: Boolean(actions.showViewDeal || deal),
    hasNegotiation: Boolean(actions.showViewNegotiation || negotiation),
  })

  const timelineEvents: CollaborationTimelineEvent[] = [
    {
      id: 'created',
      label: 'Match discovered',
      timestamp: formatDate(match.createdAt),
      status: 'done',
    },
    {
      id: 'status',
      label: model.canonicalStatus.replace(/_/g, ' '),
      description: `Score ${model.scoreLabel}`,
      status: 'active',
    },
  ]

  if (negotiation) {
    timelineEvents.push({
      id: 'negotiation',
      label: 'Negotiation started',
      description: negotiation.status,
      status: actions.showViewDeal ? 'done' : 'upcoming',
    })
  }

  return (
    <PmPageLayout
      header={
        <PmPageHeader
          label="Post-match"
          title={`Match ${model.scoreLabel}`}
          description={`${model.matchTypeLabel} · ${model.canonicalStatus}`}
          metric={
            <PmPageHeroMetric value={model.scoreLabel} label="Match score" />
          }
          badges={
            <>
              <PmBadge tone={resolveMatchTypeTone(match.matchType)} uppercase>
                {formatMatchTypeBadgeLabel(match.matchType)}
              </PmBadge>
              <PmWorkflowBadge status={match.status} entity="match" />
            </>
          }
          actions={
            <>
              {model.canAct && actions.showAccept ? (
                <PmButton
                  disabled={actionPending}
                  onClick={() => runPostMatchAction('accept')}
                >
                  {pendingAction === 'accept' ? 'Accepting…' : 'Accept'}
                </PmButton>
              ) : null}
              {model.canAct && actions.showDecline ? (
                <PmButton
                  variant="outline"
                  disabled={actionPending}
                  onClick={() => runPostMatchAction('decline')}
                >
                  {pendingAction === 'decline' ? 'Declining…' : 'Decline'}
                </PmButton>
              ) : null}
              {model.canAct && actions.showStartNegotiation ? (
                <StartNegotiationButton match={match} variant="default" />
              ) : null}
              {actions.showViewNegotiation && actions.negotiationId ? (
                <PmButton variant="secondary" asChild>
                  <Link to={`/negotiations/${actions.negotiationId}`}>View negotiation</Link>
                </PmButton>
              ) : null}
              {actions.showViewDeal && actions.dealId ? (
                <PmButton variant="secondary" asChild>
                  <Link to={`/deals/${actions.dealId}`}>View deal</Link>
                </PmButton>
              ) : null}
            </>
          }
        />
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        {negotiation ? (
          <PmBadge tone="info">Negotiation linked</PmBadge>
        ) : null}
        {deal ? (
          <PmBadge tone="success">Deal linked</PmBadge>
        ) : null}
      </div>

      <PmMatchScoreBadge score={match.matchScore} variant="hero" className="mb-4" />

      {!model.isParticipant && user ? (
        <p className="text-sm text-muted-foreground">
          You are viewing this match in read-only mode — you are not a participant.
        </p>
      ) : null}

      <PmDetailLayout
        main={
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <PmStatCard
                label="Skill match"
                value={formatPercent(match.payload?.breakdown?.skillMatch ?? 0)}
                dense
              />
              <PmStatCard
                label="Timeline fit"
                value={formatPercent(match.payload?.breakdown?.timelineFit ?? 0)}
                dense
              />
              <PmStatCard
                label="Location fit"
                value={formatPercent(match.payload?.breakdown?.locationFit ?? 0)}
                dense
              />
            </div>

            {model.relatedOpportunities.length > 0 ? (
              <PmContentCard title="Related opportunities">
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
              </PmContentCard>
            ) : null}

            <PmContentCard title="Participants">
              {model.participants.length > 0 ? (
                <ul className="space-y-1 text-sm">
                  {model.participants.map((participant) => (
                    <li key={participant.userId}>
                      {participant.role.replace(/_/g, ' ')} — {participant.displayName}
                      {participant.participantStatus
                        ? ` (${participant.participantStatus})`
                        : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No participants recorded.</p>
              )}
            </PmContentCard>
          </>
        }
        inspector={
          <PmInspectorLayout
            header={
              <PmSectionHeader
                title="Negotiation"
                description="Terms discussion for this match."
              />
            }
            footer={
              negotiation ? (
                <div className="flex flex-col gap-2">
                  <PmButton variant="outline" size="sm" asChild>
                    <Link to={`/negotiations/${negotiation.id}`}>Open negotiation</Link>
                  </PmButton>
                  <AgreeNegotiationButton negotiation={negotiation} />
                  <CancelNegotiationButton negotiation={negotiation} />
                  <CreateDealButton negotiation={negotiation} variant="default" />
                </div>
              ) : (
                <StartNegotiationButton match={match} className="w-full" />
              )
            }
          >
            {negotiation ? (
              <PmFormReadonly>
                <PmFormReadonlySection title="Status">
                  <PmFormReadonlyField label="Negotiation">
                    <PmWorkflowBadge status={negotiation.status} entity="negotiation" />
                  </PmFormReadonlyField>
                  <PmFormReadonlyField label="ID" value={negotiation.id} />
                </PmFormReadonlySection>
              </PmFormReadonly>
            ) : (
              <p className="text-sm text-muted-foreground">
                No negotiation linked yet. Start negotiating terms before creating a deal.
              </p>
            )}
          </PmInspectorLayout>
        }
        timeline={
          <CollaborationTimeline
            activeStep={collaborationStep}
            events={timelineEvents}
            title="Activity"
          />
        }
      />
    </PmPageLayout>
  )
}

export function NegotiationDetailPage() {
  const { id } = useParams()
  const version = useDataStoreVersion()
  const neg = id ? negotiationsApi.get(id) : undefined
  const [proposalPending, setProposalPending] = useState(false)

  const linkedDeal = useMemo(() => {
    if (!neg) return undefined
    return dealsApi.list().find((d) => d.negotiationId === neg.id)
  }, [neg, version])

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

  if (!neg) {
    return (
      <PmPageLayout
        header={<PmPageHeader title="Negotiation" description="Value negotiation workspace." />}
      >
        <PmEmptyState
          title="Negotiation not found"
          description="This negotiation may have been removed or the link is invalid."
        />
      </PmPageLayout>
    )
  }

  const collaborationStep = resolveCollaborationStepFromNegotiation(Boolean(linkedDeal))
  const timelineEvents: CollaborationTimelineEvent[] = [
    {
      id: 'created',
      label: 'Negotiation opened',
      timestamp: neg.createdAt ? formatDate(neg.createdAt) : undefined,
      status: 'done',
    },
    {
      id: 'status',
      label: 'Current status',
      description: neg.status,
      status: 'active',
    },
  ]

  return (
    <PmPageLayout
      header={
        <PmPageHeader
          label="Negotiation"
          title={`Negotiation ${neg.id}`}
          description="Terms sheet, rounds timeline, and proposal form."
          metric={
            <PmPageHeroMetric
              value={neg.rounds?.length ?? 0}
              label="Rounds"
            />
          }
          badges={<PmWorkflowBadge status={neg.status} entity="negotiation" />}
          actions={
            <>
              <AgreeNegotiationButton negotiation={neg} />
              <CancelNegotiationButton negotiation={neg} />
              <CreateDealButton negotiation={neg} />
            </>
          }
        />
      }
    >
      <div className="flex flex-wrap gap-2">
        {neg.postMatchId ? (
          <PmButton variant="outline" size="sm" asChild>
            <Link to={`/matches/${neg.postMatchId}`}>View match</Link>
          </PmButton>
        ) : null}
        {linkedDeal ? (
          <PmButton variant="outline" size="sm" asChild>
            <Link to={`/deals/${linkedDeal.id}`}>View deal</Link>
          </PmButton>
        ) : null}
      </div>

      <PmDetailLayout
        main={
          <PmContentCard
            title="Discussion"
            description="Terms sheet, rounds timeline, and proposal form."
          >
            <p className="text-sm text-muted-foreground">
              Negotiation workspace for post-match collaboration. Use the inspector to agree,
              cancel, or create a deal when terms are settled.
            </p>
            {neg.rounds && neg.rounds.length > 0 ? (
              <ul className="mt-4 space-y-2 text-sm">
                {neg.rounds.map((round, index) => (
                  <li key={`${round.at}-${index}`}>
                    <PmSurface variant="default" shadow="card" className="p-3">
                      <p className="font-medium">Round {index + 1}</p>
                      <p className="text-muted-foreground">
                        {round.by} · {formatDate(round.at)}
                      </p>
                    </PmSurface>
                  </li>
                ))}
              </ul>
            ) : null}
          </PmContentCard>
        }
        inspector={
          <PmInspectorLayout
            header={<PmSectionHeader title="Actions" />}
            footer={
              <div className="flex flex-col gap-2">
                <AgreeNegotiationButton negotiation={neg} className="w-full" />
                <CancelNegotiationButton negotiation={neg} className="w-full" variant="destructive" />
                <CreateDealButton negotiation={neg} className="w-full" />
                {canSubmitProposal ? (
                  <PmButton
                    type="button"
                    className="w-full"
                    disabled={proposalPending}
                    onClick={() => handleProposalTransition('countered')}
                  >
                    {proposalPending ? 'Submitting…' : 'Submit proposal'}
                  </PmButton>
                ) : null}
                {canAcceptUpdatedProposal ? (
                  <PmButton
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={proposalPending}
                    onClick={() => handleProposalTransition('active')}
                  >
                    {proposalPending ? 'Accepting…' : 'Accept updated proposal'}
                  </PmButton>
                ) : null}
                <PmButton variant="outline" className="w-full" disabled>
                  Escalate dispute
                </PmButton>
              </div>
            }
          >
            <PmFormReadonly>
              <PmFormReadonlySection title="Participants">
                {(neg.participants ?? neg.parties ?? []).map((p) => (
                  <PmFormReadonlyField
                    key={p.userId}
                    label={p.role.replace(/_/g, ' ')}
                    value={p.userId}
                  />
                ))}
              </PmFormReadonlySection>
              {neg.commercialTerms ? (
                <PmFormReadonlySection title="Current offer">
                  <PmFormReadonlyField
                    label="Currency"
                    value={neg.commercialTerms.currency ?? '—'}
                  />
                  <PmFormReadonlyField
                    label="Amount"
                    value={
                      neg.commercialTerms.amount != null
                        ? String(neg.commercialTerms.amount)
                        : '—'
                    }
                  />
                </PmFormReadonlySection>
              ) : null}
            </PmFormReadonly>
          </PmInspectorLayout>
        }
        timeline={
          <CollaborationTimeline
            activeStep={collaborationStep}
            events={timelineEvents}
            title="Negotiation history"
          />
        }
      />
    </PmPageLayout>
  )
}
