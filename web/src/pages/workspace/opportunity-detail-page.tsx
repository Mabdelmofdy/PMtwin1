import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { opportunitiesApi } from '@/api/opportunities.ts'
import { matchesApi } from '@/api/matches.ts'
import { negotiationsApi } from '@/api/negotiations.ts'
import { contractsApi } from '@/api/contracts.ts'
import { peopleApi } from '@/api/people.ts'
import { applicationRepository, dealRepository } from '@/repositories/index.ts'
import { matchingService } from '@/services/matching-service.ts'
import { negotiationService } from '@/services/negotiation-service.ts'
import { buildOpportunityMatchesReadModel, type OpportunityMatchCard } from '@/lib/opportunity-matches-read-model.ts'
import { useDataStoreVersion } from '@/hooks/use-data-store'
import { useAuth } from '@/providers/auth-provider'
import { ApplicationsPanel } from '@/components/opportunity/applications-panel'
import { OpportunityTimeline, type OpportunityTimelineEvent } from '@/components/opportunity/opportunity-timeline'
import { OpportunitySummaryCard } from '@/components/opportunity/opportunity-summary-card'
import { RelatedMatchesPanel } from '@/components/opportunity/related-matches-panel'
import { OpportunityPublishExperience, OpportunityPublishPanel } from '@/components/opportunity/opportunity-publish-experience'
import { ApplyWizard } from '@/components/opportunity/apply-wizard'
import { OpportunityReadinessCard, resolveOpportunityReadiness } from '@/components/readiness'
import { formatDate } from '@/lib/format'
import { resolveCanonicalStatus, type StatusEntity } from '@/lib/status-display.ts'
import {
  publishOpportunityUiAction,
  resolveProfileKindFromUser,
} from '@/lib/publish-opportunity-ui-actions.ts'
import {
  RELATED_MATCHES_SECTION_ID,
  showPublishSuccessFeedback,
} from '@/lib/publish-opportunity-feedback.ts'
import {
  PmContentCard,
  PmDetailLayout,
  PmInspectorLayout,
  PmPageLayout,
  PmSectionHeader,
} from '@/components/layout/pm-layout-index'
import {
  PmFormReadonly,
  PmFormReadonlyField,
  PmFormReadonlySection,
} from '@/components/forms/pm-form-index'
import { PmActionHub, PmBadge, PmButton, PmEmptyState, PmMatchScoreBadge, PmPageHeader, PmPageHeroMetric, PmPageActions, PmWorkflowJourney, type PmActionHubItem, type PmWorkflowJourneyStep } from '@/components/ui/pm-index'
import { formatReadinessScorePercent } from '@/components/ui/pm-readiness-score-display'
import { OpportunityStatusBadge } from '@/components/opportunity/opportunity-status-badge'
import { formatOpportunityIntent } from '@/components/opportunity/opportunity-display'
import { pmTypography } from '@/components/shared/pm-design-tokens'
import { cn } from '@/lib/utils'
import { productFlags } from '@/config/product-flags.ts'

function resolveCollaborationActiveStep(
  matches: ReturnType<typeof buildOpportunityMatchesReadModel>['matches'],
): 'Opportunity' | 'PostMatch' | 'Negotiation' | 'Deal' | 'Contract' {
  if (matches.some((card) => card.actions.showViewDeal)) return 'Deal'
  if (matches.some((card) => card.actions.showViewNegotiation || card.actions.showCreateDeal)) {
    return 'Negotiation'
  }
  if (matches.length > 0) return 'PostMatch'
  return 'Opportunity'
}

function resolveJourneyActiveIndex(
  collaborationStep: ReturnType<typeof resolveCollaborationActiveStep>,
  oppStatus: string,
): number {
  if (['completed', 'closed'].includes(oppStatus)) return 5
  if (['in_execution', 'executing'].includes(oppStatus)) return 5
  if (oppStatus === 'contracted') return 4
  const stepIndex: Record<ReturnType<typeof resolveCollaborationActiveStep>, number> = {
    Opportunity: 0,
    PostMatch: 1,
    Negotiation: 2,
    Deal: 3,
    Contract: 4,
  }
  return stepIndex[collaborationStep] ?? 0
}

function buildOpportunityWorkflowSteps(
  opp: { id: string; status: string },
  collaborationStep: ReturnType<typeof resolveCollaborationActiveStep>,
  topCard?: OpportunityMatchCard,
  dealStatus?: string,
  contractStatus?: string,
): readonly PmWorkflowJourneyStep[] {
  const activeIndex = resolveJourneyActiveIndex(collaborationStep, opp.status)
  const stepDefs: Array<{
    id: string
    label: string
    status?: string
    statusEntity?: StatusEntity
    href?: string
  }> = [
    {
      id: 'opportunity',
      label: 'Opportunity',
      status: opp.status,
      statusEntity: 'opportunity',
      href: `/opportunities/${opp.id}`,
    },
    {
      id: 'match',
      label: 'Match',
      status: topCard?.match.status,
      statusEntity: 'match',
      href: topCard?.detailPath,
    },
    {
      id: 'negotiation',
      label: 'Negotiation',
      status: topCard?.actions.negotiation?.status,
      statusEntity: 'negotiation',
      href: topCard?.actions.negotiationId
        ? `/negotiations/${topCard.actions.negotiationId}`
        : undefined,
    },
    {
      id: 'deal',
      label: 'Deal',
      status: dealStatus,
      statusEntity: 'deal',
      href: topCard?.actions.dealId ? `/deals/${topCard.actions.dealId}` : undefined,
    },
    {
      id: 'contract',
      label: 'Contract',
      status: contractStatus,
      statusEntity: 'contract',
    },
    {
      id: 'execution',
      label: 'Complete',
      status: ['completed', 'closed'].includes(opp.status) ? opp.status : undefined,
      statusEntity: 'opportunity',
    },
  ]

  return stepDefs.map((step, index) => ({
    id: step.id,
    label: step.label,
    status: step.status,
    statusEntity: step.statusEntity,
    href: step.href,
    state:
      index < activeIndex
        ? ('complete' as const)
        : index === activeIndex
          ? ('current' as const)
          : ('upcoming' as const),
  }))
}

function buildRecommendedActionItem(input: {
  canPublishDraft: boolean
  opportunityId: string
  topCard?: OpportunityMatchCard
}): PmActionHubItem | null {
  const { canPublishDraft, opportunityId, topCard } = input

  if (canPublishDraft) {
    return {
      id: 'publish',
      title: 'Publish opportunity',
      context: 'Publishing runs matching and surfaces PostMatches.',
      status: 'draft',
      statusEntity: 'opportunity',
      primary: { label: 'Review readiness', href: `#${RELATED_MATCHES_SECTION_ID}` },
      secondary: { label: 'Edit', href: `/opportunities/${opportunityId}/edit`, variant: 'outline' },
    }
  }

  if (!topCard) return null

  const { actions } = topCard
  if (actions.showAccept) {
    return {
      id: 'accept-match',
      title: 'Accept top match',
      context: 'Respond to the highest-ranked PostMatch to advance the workflow.',
      status: topCard.match.status,
      statusEntity: 'match',
      matchScore: topCard.match.matchScore,
      primary: { label: 'Open match', href: topCard.detailPath },
    }
  }
  if (actions.showStartNegotiation) {
    return {
      id: 'start-negotiation',
      title: 'Start negotiation',
      context: 'Move from match acceptance into term negotiation.',
      status: topCard.match.status,
      statusEntity: 'match',
      matchScore: topCard.match.matchScore,
      primary: { label: 'Open match', href: topCard.detailPath },
    }
  }
  if (actions.showViewNegotiation && actions.negotiationId) {
    return {
      id: 'view-negotiation',
      title: 'Review negotiation',
      context: 'Terms are in progress — review or counter.',
      status: actions.negotiation?.status ?? 'active',
      statusEntity: 'negotiation',
      primary: { label: 'Open negotiation', href: `/negotiations/${actions.negotiationId}` },
      secondary: { label: 'View match', href: topCard.detailPath, variant: 'outline' },
    }
  }
  if (actions.showCreateDeal || actions.showViewDeal) {
    return {
      id: 'view-deal',
      title: actions.showCreateDeal ? 'Create deal' : 'Review deal',
      context: 'Finalize commercial terms from the accepted negotiation.',
      status: actions.negotiation?.status,
      statusEntity: 'deal',
      primary: actions.dealId
        ? { label: 'Open deal', href: `/deals/${actions.dealId}` }
        : { label: 'Open match', href: topCard.detailPath },
    }
  }

  return {
    id: 'review-match',
    title: 'Review top match',
    context: 'Compare compatibility and choose the next collaboration step.',
    status: topCard.match.status,
    statusEntity: 'match',
    matchScore: topCard.match.matchScore,
    primary: { label: 'Open match', href: topCard.detailPath },
  }
}

export function OpportunityDetailPage() {
  const version = useDataStoreVersion()
  const { id } = useParams()
  const { user, isPendingApproval } = useAuth()
  const [showWizard, setShowWizard] = useState(false)
  const [publishDetails, setPublishDetails] = useState<readonly string[] | null>(null)
  const [highlightRelatedMatches, setHighlightRelatedMatches] = useState(false)

  const opp = useMemo(
    () => (id ? opportunitiesApi.get(id) : undefined),
    [id, version],
  )
  const applications = useMemo(() => applicationRepository.getAll(), [version])

  const relatedMatchesModel = useMemo(() => {
    if (!opp?.id) return null
    return buildOpportunityMatchesReadModel(opp.id, {
      getPostMatchesByOpportunity: matchesApi.getByOpportunity,
      getOpportunity: opportunitiesApi.get,
      getNegotiationsForPostMatch: negotiationsApi.getByPostMatchId,
      getDealForPostMatch: (postMatchId) =>
        dealRepository.findByPostMatchId(postMatchId),
      getPersonName: (userId) => peopleApi.get(userId)?.profile?.name,
      currentUserId: user?.id ?? null,
    })
  }, [opp?.id, user?.id, version])

  if (!opp) {
    return (
      <PmPageLayout
        header={<PmPageHeader title="Opportunity not found" description="This record may have been removed." />}
      >
        <PmEmptyState
          title="Opportunity not found"
          description="This record may have been removed or the link is invalid."
          action={
            <PmButton size="sm" variant="outline" asChild>
              <Link to="/opportunities">Back to opportunities</Link>
            </PmButton>
          }
        />
      </PmPageLayout>
    )
  }

  const isOwner = user?.id === opp.creatorId
  const { application, canEdit, canReapply } = user
    ? negotiationService.resolveUserApplication(applications, opp.id, user.id)
    : { application: undefined, canEdit: false, canReapply: false }

  const canApply = user
    ? negotiationService.canUserApplyToOpportunity(opp, user, {
        application,
        canReapply,
        hasDeal: !!application?.dealId,
      })
    : false

  const oppApplications = matchingService.sortApplicationsByValueScore(
    matchingService.getFilteredApplications(opp.id),
  ).map((app) => ({
    ...app,
    applicant: peopleApi.get(app.applicantId),
  }))

  const opportunityClosed = [
    'contracted',
    'in_execution',
    'completed',
    'closed',
    'cancelled',
  ].includes(opp.status)

  const skills = opp.scope?.coreSkills ?? opp.attributes?.coreSkills ?? []
  const creator = opp.creatorId ? peopleApi.get(opp.creatorId) : undefined
  const collaborationStep = resolveCollaborationActiveStep(
    relatedMatchesModel?.matches ?? [],
  )
  const hasMatches = (relatedMatchesModel?.matches.length ?? 0) > 0
  const topMatch = relatedMatchesModel?.matches[0]?.match
  const topMatchCard = relatedMatchesModel?.matches[0]
  const topMatchScore = topMatch?.matchScore
  const opportunityReadiness = resolveOpportunityReadiness(opp)
  const canPublishDraft =
    isOwner &&
    !isPendingApproval &&
    (opp.status === 'draft' || resolveCanonicalStatus('opportunity', opp.status) === 'draft')
  const topDeal = topMatchCard?.actions.dealId
    ? dealRepository.findByPostMatchId(topMatchCard.match.id)
    : undefined
  const topContract = topMatchCard?.actions.dealId
    ? contractsApi.getByDealId(topMatchCard.actions.dealId)[0]
    : undefined
  const workflowSteps = buildOpportunityWorkflowSteps(
    opp,
    collaborationStep,
    topMatchCard,
    topDeal?.status,
    topContract?.status,
  )
  const recommendedAction = buildRecommendedActionItem({
    canPublishDraft,
    opportunityId: opp.id,
    topCard: topMatchCard,
  })

  const timelineEvents = useMemo((): OpportunityTimelineEvent[] => {
    const events: OpportunityTimelineEvent[] = [
      {
        id: 'updated',
        label: 'Last updated',
        timestamp: formatDate(opp.updatedAt),
        status: 'active',
      },
    ]

    if (opp.createdAt) {
      events.unshift({
        id: 'created',
        label: 'Created',
        timestamp: formatDate(opp.createdAt),
        status: 'done',
      })
    }

    if (hasMatches) {
      events.push({
        id: 'matched',
        label: 'Matches discovered',
        description: `${relatedMatchesModel!.matches.length} related matches`,
        status: 'done',
      })
    } else {
      events.push({
        id: 'awaiting',
        label: 'Awaiting matches',
        description: 'Publish to run matching',
        status: 'upcoming',
      })
    }

    return events
  }, [hasMatches, opp.createdAt, opp.updatedAt, relatedMatchesModel])

  useEffect(() => {
    if (!highlightRelatedMatches) return

    const section = document.getElementById(RELATED_MATCHES_SECTION_ID)
    section?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })

    const timer = window.setTimeout(() => {
      setHighlightRelatedMatches(false)
    }, 2400)

    return () => window.clearTimeout(timer)
  }, [highlightRelatedMatches, relatedMatchesModel?.matches.length])

  const handlePublish = () => {
    if (!user) {
      toast.error('Sign in to publish opportunities.')
      return
    }

    const result = publishOpportunityUiAction(opp.id, {
      profile: user.profile,
      profileKind: resolveProfileKindFromUser(user),
      opportunity: opp,
    })

    if (!result.success) {
      setPublishDetails(result.details ?? [result.message])
      toast.error(result.message)
      return
    }

    setPublishDetails(null)
    const feedback = showPublishSuccessFeedback(result)
    if (feedback.shouldHighlightRelatedMatches) {
      setHighlightRelatedMatches(true)
    }
  }

  return (
    <PmPageLayout
      header={
        <PmPageHeader
          label={formatOpportunityIntent(opp.intent)}
          title={opp.title}
          description={[opp.location, creator?.profile?.name].filter(Boolean).join(' · ')}
          metric={
            <PmPageHeroMetric
              value={formatReadinessScorePercent(opportunityReadiness.score)}
              label="Readiness"
              animate={false}
            />
          }
          badges={
            <>
              <OpportunityStatusBadge status={opp.status} />
              {topMatchScore != null ? (
                <PmMatchScoreBadge score={topMatchScore} variant="compact" showLabel />
              ) : null}
              {skills.length > 0 ? (
                <PmBadge tone="muted">{skills.length} skills</PmBadge>
              ) : null}
            </>
          }
          actions={
            <PmPageActions
              primary={
                recommendedAction
                  ? undefined
                  : hasMatches
                    ? {
                        label: 'Open top match',
                        href: `/matches/${relatedMatchesModel!.matches[0]!.match.id}`,
                      }
                    : canPublishDraft
                      ? undefined
                      : { label: 'View matches', href: '/matches', variant: 'outline' }
              }
              more={
                isOwner
                  ? [
                      {
                        id: 'edit',
                        label: 'Edit opportunity',
                        href: `/opportunities/${opp.id}/edit`,
                        icon: Pencil,
                      },
                    ]
                  : undefined
              }
            />
          }
        />
      }
    >
      <PmDetailLayout
        main={
          <>
            <PmWorkflowJourney steps={workflowSteps} compact label={false} />

            {recommendedAction ? (
              <PmActionHub
                title="Recommended next action"
                description="The single most important step for this opportunity."
                items={[recommendedAction]}
              />
            ) : null}

            {isPendingApproval ? (
              <PmContentCard className="border-warning/30 bg-warning/5">
                <p className={cn(pmTypography.bodySm, 'text-warning')}>
                  Your account is pending approval. You can browse matches but cannot respond or move pipeline cards yet.
                </p>
              </PmContentCard>
            ) : null}

            <OpportunityPublishExperience publishDetails={publishDetails} />

            <OpportunitySummaryCard
              opportunity={opp}
              creatorName={creator?.profile?.name}
              skillCount={skills.length}
            />

            {relatedMatchesModel ? (
              <RelatedMatchesPanel
                model={relatedMatchesModel}
                currentUserId={user?.id}
                canAct={!isPendingApproval}
                highlighted={highlightRelatedMatches}
                sectionId={RELATED_MATCHES_SECTION_ID}
              />
            ) : null}

            <PmContentCard title="Requirements">
              <p className={cn(pmTypography.bodySm, 'text-muted-foreground')}>
                {opp.description || 'No description provided.'}
              </p>
            </PmContentCard>

            {skills.length > 0 ? (
              <PmContentCard title="Core skills">
                <div className="flex flex-wrap gap-2">
                  {skills.map((s: string) => (
                    <PmBadge key={s} tone="neutral" size="sm">
                      {s}
                    </PmBadge>
                  ))}
                </div>
              </PmContentCard>
            ) : null}

            <PmFormReadonly>
              <PmFormReadonlySection title="Budget & timeline" description="Commercial and schedule context.">
                <PmFormReadonlyField label="Exchange mode" value={opp.exchangeMode} />
                <PmFormReadonlyField label="Model type" value={opp.modelType} />
                <PmFormReadonlyField label="Start date" value={opp.attributes?.startDate} />
                <PmFormReadonlyField label="Updated" value={formatDate(opp.updatedAt)} />
              </PmFormReadonlySection>
            </PmFormReadonly>

            {isOwner && productFlags.showLegacyApplications ? (
              <ApplicationsPanel
                applications={oppApplications}
                canManage={!isPendingApproval}
                opportunityClosed={opportunityClosed}
                variant="legacy"
              />
            ) : null}
          </>
        }
        inspector={
          <PmInspectorLayout
            header={<PmSectionHeader title="Actions & readiness" />}
          >
            {isOwner ? (
              <OpportunityReadinessCard opportunity={opp} opportunityId={opp.id} />
            ) : null}

            {canPublishDraft ? (
              <OpportunityPublishPanel
                opportunity={opp}
                publishDetails={publishDetails}
                onPublish={handlePublish}
                showPublishButton
              />
            ) : null}

            {productFlags.showLegacyApplications && !isOwner && application && !canApply ? (
              <PmContentCard title="Direct application (legacy)">
                <PmBadge tone="neutral" size="sm" className="mb-2">
                  {application.status}
                </PmBadge>
                <p className={cn(pmTypography.bodySm, 'text-muted-foreground')}>
                  {application.status === 'accepted'
                    ? 'Your legacy application was accepted.'
                    : 'You submitted a direct application. PostMatch is the primary collaboration path.'}
                </p>
                <p className={cn('mt-1', pmTypography.caption, 'text-muted-foreground')}>
                  Submitted {formatDate(application.createdAt)}
                </p>
                {canEdit && !isPendingApproval ? (
                  <PmButton
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => setShowWizard(true)}
                  >
                    Edit legacy application
                  </PmButton>
                ) : null}
              </PmContentCard>
            ) : null}

            {productFlags.showLegacyApplications && !isOwner && canApply && !isPendingApproval ? (
              showWizard ? (
                <ApplyWizard
                  opportunityId={opp.id}
                  applicantId={user!.id}
                  onSubmitted={() => setShowWizard(false)}
                  legacy
                />
              ) : (
                <PmContentCard title="Direct application (legacy / hiring)">
                  <p className={cn(pmTypography.bodySm, 'text-muted-foreground')}>
                    PostMatch is the primary path: Opportunity → PostMatch → Negotiation → Deal → Contract.
                  </p>
                  <PmButton
                    className="mt-3 w-full"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowWizard(true)}
                  >
                    {canReapply ? 'Re-submit legacy application' : 'Submit legacy application'}
                  </PmButton>
                </PmContentCard>
              )
            ) : null}
          </PmInspectorLayout>
        }
        timeline={
          <OpportunityTimeline
            activeStep={collaborationStep}
            events={timelineEvents}
            title="Activity & history"
          />
        }
      />
    </PmPageLayout>
  )
}
