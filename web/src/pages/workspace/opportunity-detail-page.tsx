import type { ExplanationBundle } from '@pm-twin/explainability'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Archive, Copy, FileJson, Pencil, Printer, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { opportunityCommandService } from '@/services/opportunity-command-service.ts'
import { OpportunityVersionTimeline } from '@/components/opportunity/opportunity-version-timeline.tsx'
import { buildCollaborationCommandPayload, opportunityToDraft } from '@/components/opportunity/wizard/draft-model.ts'
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
import { EntityAccessDenied, EntityLimitedViewBanner } from '@/components/auth/entity-access-state'
import { ApplicationsPanel } from '@/components/opportunity/applications-panel'
import { OpportunityTimeline, type OpportunityTimelineEvent } from '@/components/opportunity/opportunity-timeline'
import { OpportunitySummaryCard } from '@/components/opportunity/opportunity-summary-card'
import { RelatedMatchesPanel } from '@/components/opportunity/related-matches-panel'
import { OpportunityPublishExperience, OpportunityPublishPanel } from '@/components/opportunity/opportunity-publish-experience'
import { ApplyWizard } from '@/components/opportunity/apply-wizard'
import { OpportunityReadinessCard, resolveOpportunityReadiness } from '@/components/readiness'
import {
  OpportunityHealthIndicator,
  resolveOpportunityHealthState,
} from '@/components/opportunity/opportunity-health-indicator.tsx'
import { CollaborationSummaryCard } from '@/components/opportunity/collaboration-summary-card.tsx'
import { DraftMetadataCard } from '@/components/opportunity/ocx/draft-metadata-card.tsx'
import { MarketplacePreviewPanel } from '@/components/opportunity/wizard/marketplace-preview-panel.tsx'
import {
  buildCommercialStructureSummary,
  migrateLegacyExchangeModeToCommercialStructure,
  presentCommercialForAudience,
} from '@/domain/opportunity-commercial-structure'
import { normalizeMilestones, normalizeWorkPackages } from '@/domain/opportunity-creation'
import { evaluateLiveOpportunityValidation } from '@/domain/opportunity-validation/index.ts'
import { trackOcxEvent } from '@/lib/ocx-analytics.ts'
import { formatDate } from '@/lib/format'
import { resolveCanonicalStatus } from '@/lib/status-display.ts'
import { PRODUCT_LANGUAGE } from '@/lib/product-language'
import {
  publishOpportunityUiAction,
  canShowPublishOpportunity,
  resolveProfileKindFromUser,
} from '@/lib/publish-opportunity-ui-actions.ts'
import {
  RELATED_MATCHES_SECTION_ID,
  showPublishSuccessFeedback,
} from '@/lib/publish-opportunity-feedback.ts'
import {
  deriveMatchingTopology,
  resolveMainCollaborationModelLabel,
  resolveModelTypeLabel,
  resolveSubModelLabel,
} from '@/domain/collaboration/opportunity-collaboration.ts'
import { formatFrameworkMatchTypeLabel } from '@/config/need-offer-framework.ts'
import { formatCollaborationExchangeMode } from '@/lib/collaboration-taxonomy-display.ts'
import {
  PmContentCard,
  PmDetailLayout,
  PM_RECOMMENDED_NEXT_STEP,
  PmInspectorLayout,
  PmSectionHeader,
} from '@/components/layout/pm-layout-index'
import {
  PmFormReadonly,
  PmFormReadonlyField,
  PmFormReadonlySection,
} from '@/components/forms/pm-form-index'
import {
  PmActionHub,
  PmBadge,
  PmButton,
  PmDisclosureSection,
  PmEmptyState,
  PmLifecycleMap,
  PmMatchScoreBadge,
  PmPage,
  PmPageHeader,
  PmPageHeroMetric,
  PmPageActions,
  buildOpportunityWorkflowSteps,
  resolveCollaborationActiveStepFromMatches,
  type PmActionHubItem,
} from '@/components/ui/pm-index'
import { formatReadinessScorePercent } from '@/components/ui/pm-readiness-score-display'
import { OpportunityStatusBadge } from '@/components/opportunity/opportunity-status-badge'
import { OpportunityIdentityBadges } from '@/components/opportunity/opportunity-identity'
import { formatOpportunityIntent } from '@/components/opportunity/opportunity-display'
import { pmTypography } from '@/tokens'
import { cn } from '@/lib/utils'
import { productFlags } from '@/config/product-flags.ts'
import {
  buildViewerContext,
  findParticipantMatchForOpportunity,
  resolveOpportunityDetailVisibility,
} from '@/lib/entity-view-visibility.ts'
import {
  MatchingModelsReferencePanel,
  NeedOfferMirrorPanel,
  UserJourneyStrip,
  ValueExchangeModesPanel,
} from '@/components/need-offer/need-offer-framework-panels'
import {
  buildOpportunitySemanticReadModel,
  resolveOpportunityPaymentModes,
} from '@/lib/need-offer-semantic-read-model.ts'

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
      context: 'Publishing runs matching and surfaces matches.',
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
      context: 'Respond to the highest-ranked match to advance the workflow.',
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
      secondary: { label: 'Open match', href: topCard.detailPath, variant: 'outline' },
    }
  }
  if (actions.showCreateDeal || actions.showViewDeal) {
    return {
      id: 'view-deal',
      title: actions.showCreateDeal ? 'Create commercial agreement' : 'Review commercial agreement',
      context: 'Finalize commercial terms from the accepted negotiation.',
      status: actions.negotiation?.status,
      statusEntity: 'deal',
      primary: actions.dealId
        ? { label: PRODUCT_LANGUAGE.OPEN_COMMERCIAL_AGREEMENT, href: `/commercial-agreements/${actions.dealId}` }
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
  const navigate = useNavigate()
  const { user, isPendingApproval, canAccessAdmin } = useAuth()
  const [showWizard, setShowWizard] = useState(false)
  const [publishDetails, setPublishDetails] = useState<readonly string[] | null>(null)
  const [publishBundles, setPublishBundles] = useState<readonly ExplanationBundle[] | null>(null)
  const [highlightRelatedMatches, setHighlightRelatedMatches] = useState(false)

  const opp = useMemo(
    () => (id ? opportunitiesApi.get(id) : undefined),
    [id, version],
  )
  const applications = useMemo(() => applicationRepository.getAll(), [version])

  const postMatchesForOpp = useMemo(
    () => (opp?.id ? matchesApi.getByOpportunity(opp.id) : []),
    [opp?.id, version],
  )

  const viewer = useMemo(
    () =>
      buildViewerContext({
        userId: user?.id,
        role: user?.role,
        status: user?.status,
        canAccessAdmin,
        profile: user?.profile,
      }),
    [user, canAccessAdmin],
  )

  const visibility = useMemo(() => {
    if (!opp) return null
    return resolveOpportunityDetailVisibility(opp, viewer, {
      postMatches: postMatchesForOpp,
      showLegacyApplicationsFlag: productFlags.showLegacyApplications,
    })
  }, [opp, viewer, postMatchesForOpp])

  const participantMatch = useMemo(() => {
    if (!opp?.id) return undefined
    return findParticipantMatchForOpportunity(opp.id, postMatchesForOpp, viewer)
  }, [opp?.id, postMatchesForOpp, viewer])

  const relatedMatchesModel = useMemo(() => {
    if (!opp?.id || !visibility?.showMatchingSection) return null
    return buildOpportunityMatchesReadModel(opp.id, {
      getPostMatchesByOpportunity: matchesApi.getByOpportunity,
      getOpportunity: opportunitiesApi.get,
      getNegotiationsForPostMatch: negotiationsApi.getByPostMatchId,
      getDealForPostMatch: (postMatchId) =>
        dealRepository.findByPostMatchId(postMatchId),
      getPersonName: (userId) => peopleApi.get(userId)?.profile?.name,
      currentUserId: user?.id ?? null,
    })
  }, [opp?.id, user?.id, version, visibility?.showMatchingSection])

  const collaborationStep = resolveCollaborationActiveStepFromMatches(
    relatedMatchesModel?.matches ?? [],
  )
  const hasMatches = (relatedMatchesModel?.matches.length ?? 0) > 0

  const opportunitySemantic = useMemo(
    () => (opp ? buildOpportunitySemanticReadModel(opp) : null),
    [opp],
  )

  const opportunityReadinessResult = useMemo(
    () => (opp ? resolveOpportunityReadiness(opp) : null),
    [opp],
  )
  const opportunityLiveValidation = useMemo(
    () => (opp ? evaluateLiveOpportunityValidation(opp) : null),
    [opp],
  )
  const validationErrorCount = opportunityLiveValidation
    ? opportunityLiveValidation.issues.filter(
        (i) => i.severity === 'error' || i.severity === 'blocker',
      ).length
    : 0

  const opportunityPaymentModes = useMemo(
    () => (opp ? resolveOpportunityPaymentModes(opp) : []),
    [opp],
  )

  const journeyActiveStep = useMemo(() => {
    if (!opp) return 'post'
    const status = resolveCanonicalStatus('opportunity', opp.status)
    if (status === 'draft') return 'attributes'
    if (status === 'published' && !hasMatches) return 'matching'
    if (hasMatches && !relatedMatchesModel?.matches.some((card) => card.actions.showViewNegotiation)) {
      return 'comparison'
    }
    if (relatedMatchesModel?.matches.some((card) => card.actions.showViewNegotiation)) {
      return 'negotiation'
    }
    if (relatedMatchesModel?.matches.some((card) => card.actions.showViewDeal)) {
      return 'agreement'
    }
    return 'matching'
  }, [opp, hasMatches, relatedMatchesModel])

  const timelineEvents = useMemo((): OpportunityTimelineEvent[] => {
    if (!opp || !visibility) return []
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

    if (visibility.showMatchingSection && hasMatches) {
      events.push({
        id: 'matched',
        label: 'Matches discovered',
        description: `${relatedMatchesModel!.matches.length} related matches`,
        status: 'done',
      })
    } else if (visibility.showMatchingSection) {
      events.push({
        id: 'awaiting',
        label: 'Awaiting matches',
        description: 'Publish to run matching',
        status: 'upcoming',
      })
    }

    return events
  }, [hasMatches, opp, relatedMatchesModel, visibility])

  useEffect(() => {
    if (!highlightRelatedMatches) return

    const section = document.getElementById(RELATED_MATCHES_SECTION_ID)
    section?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })

    const timer = window.setTimeout(() => {
      setHighlightRelatedMatches(false)
    }, 2400)

    return () => window.clearTimeout(timer)
  }, [highlightRelatedMatches, relatedMatchesModel?.matches.length])

  if (!opp) {
    return (
      <PmPage
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
      </PmPage>
    )
  }

  if (!visibility) {
    return null
  }

  if (visibility.access === 'denied') {
    return (
      <PmPage
        header={<PmPageHeader title="Access denied" description="This opportunity is not available." />}
      >
        <EntityAccessDenied
          entity="opportunity"
          description="Draft opportunities are only visible to their owner or platform staff."
        />
      </PmPage>
    )
  }

  const isOwner = visibility.access === 'owner'
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
  const topMatch = relatedMatchesModel?.matches[0]?.match
  const topMatchCard = relatedMatchesModel?.matches[0]
  const topMatchScore = topMatch?.matchScore
  const opportunityReadiness = resolveOpportunityReadiness(opp)
  const canPublishDraft = canShowPublishOpportunity(opp, {
    userId: user?.id,
    canMutate: !isPendingApproval,
    isOpportunityOwner: isOwner,
  })
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
  const recommendedAction = visibility.showRecommendedActions
    ? buildRecommendedActionItem({
        canPublishDraft,
        opportunityId: opp.id,
        topCard: topMatchCard,
      })
    : null

  const handlePublish = () => {
    if (!user) {
      toast.error('Sign in to publish opportunities.')
      return
    }

    const result = publishOpportunityUiAction(opp.id, {
      profile: user.profile,
      profileKind: resolveProfileKindFromUser(user),
      opportunity: opp,
      profileId: user.id,
    })

    if (!result.success) {
      setPublishDetails(result.details ?? [result.message])
      setPublishBundles(result.publishBundles ?? null)
      toast.error(result.message)
      return
    }

    trackOcxEvent('published_from_detail', { opportunityId: opp.id })
    setPublishDetails(null)
    setPublishBundles(null)
    setHighlightRelatedMatches(true)
    showPublishSuccessFeedback(result)
  }

  const isDraft = (opp.status ?? '').toLowerCase() === 'draft'
  const isArchived = (opp.visibilityStatus ?? '').toLowerCase() === 'archived'

  const handleDeleteDraft = () => {
    if (!window.confirm('Delete this draft opportunity? This cannot be undone.')) return
    const result = opportunityCommandService.deleteOpportunity(opp.id)
    if (!result.success) {
      toast.error(result.errors?.join('\n') ?? 'Could not delete draft')
      return
    }
    toast.success('Draft deleted')
    navigate('/opportunities')
  }

  const handleArchive = () => {
    const result = opportunityCommandService.archiveOpportunity(opp.id, 'Owner archived')
    if (!result.success) {
      toast.error(result.errors?.join('\n') ?? 'Could not archive')
      return
    }
    toast.success('Opportunity archived')
  }

  const handleDuplicate = (asTemplate: boolean) => {
    if (!user) {
      toast.error('Sign in to duplicate opportunities.')
      return
    }
    const draft = opportunityToDraft(opp)
    const payload = buildCollaborationCommandPayload(draft, user.id)
    const result = opportunityCommandService.duplicateOpportunity({
      ...payload,
      asTemplate,
      sourceOpportunityId: opp.id,
    })
    if (!result.success) {
      toast.error(result.errors?.join('\n') ?? 'Could not duplicate')
      return
    }
    toast.success(asTemplate ? 'Template draft created' : 'Draft copy created')
    navigate(`/opportunities/${result.aggregateId}`)
  }

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(opp, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${opp.id}.json`
    anchor.click()
    URL.revokeObjectURL(url)
    toast.success('JSON exported')
  }

  const handlePrintSummary = () => {
    window.print()
  }

  const handleExportPdf = () => {
    toast.message('Export PDF', {
      description: 'Use Print Summary and choose Save as PDF in the print dialog.',
    })
    window.print()
  }

  const ownerMoreActions = isOwner
    ? [
        {
          id: 'edit',
          label: isDraft ? 'Edit draft' : 'Edit opportunity',
          href: `/opportunities/${opp.id}/edit`,
          icon: Pencil,
        },
        {
          id: 'preview-marketplace',
          label: 'Marketplace preview',
          onSelect: () => {
            document
              .getElementById('marketplace-preview')
              ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          },
          icon: Printer,
        },
        {
          id: 'duplicate-draft',
          label: 'Duplicate as Draft',
          onSelect: () => handleDuplicate(false),
          icon: Copy,
        },
        {
          id: 'duplicate-template',
          label: 'Duplicate as Template',
          onSelect: () => handleDuplicate(true),
          icon: Copy,
        },
        {
          id: 'export-json',
          label: 'Export JSON',
          onSelect: handleExportJson,
          icon: FileJson,
        },
        {
          id: 'export-pdf',
          label: 'Export PDF',
          onSelect: handleExportPdf,
          icon: Printer,
        },
        {
          id: 'print',
          label: 'Print Summary',
          onSelect: handlePrintSummary,
          icon: Printer,
        },
        ...(isDraft
          ? [
              {
                id: 'delete-draft',
                label: 'Delete draft',
                onSelect: handleDeleteDraft,
                icon: Trash2,
              },
            ]
          : []),
        ...(!isDraft && !isArchived
          ? [
              {
                id: 'archive',
                label: 'Archive / Withdraw',
                onSelect: handleArchive,
                icon: Archive,
              },
            ]
          : []),
      ]
    : undefined

  const headerDescription = [
    opp.location,
    visibility.showCreatorName ? creator?.profile?.name : undefined,
    visibility.access === 'teaser' ? opp.scope?.sectors?.[0] : undefined,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <PmPage
      header={
        <PmPageHeader
          label={formatOpportunityIntent(opp.intent)}
          title={opp.title}
          description={headerDescription || undefined}
          tone="opportunity"
          metric={
            visibility.showReadiness ? (
              <PmPageHeroMetric
                value={formatReadinessScorePercent(opportunityReadiness.score)}
                label="Readiness"
                animate={false}
              />
            ) : undefined
          }
          badges={
            <>
              <OpportunityIdentityBadges
                opportunity={opp}
                viewerUserId={user?.id}
                viewerOrganizationId={user?.organizationId}
                creatorOrganizationId={
                  opp.creatorId ? peopleApi.get(opp.creatorId)?.organizationId : undefined
                }
              />
              <OpportunityStatusBadge status={opp.status} />
              {visibility.showMatchScoreInHero && topMatchScore != null ? (
                <PmMatchScoreBadge score={topMatchScore} variant="compact" showLabel />
              ) : null}
              {visibility.showParticipantMatchChip && participantMatch?.matchScore != null ? (
                <PmMatchScoreBadge score={participantMatch.matchScore} variant="compact" showLabel />
              ) : null}
              {visibility.showFullDescription && skills.length > 0 ? (
                <PmBadge tone="muted">{skills.length} skills</PmBadge>
              ) : null}
            </>
          }
          actions={
            visibility.showOwnerActions ? (
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
                        : { label: 'Open matches', href: '/matches', variant: 'outline' }
                }
                more={ownerMoreActions}
              />
            ) : undefined
          }
        />
      }
    >
      <PmDetailLayout
        main={
          <>
            {visibility.access === 'teaser' ? (
              <EntityLimitedViewBanner message="Limited preview — verify your account to see full opportunity details." />
            ) : null}

            {visibility.showCollaborationWorkflow ? (
              <PmLifecycleMap steps={workflowSteps} />
            ) : null}

            {recommendedAction ? (
              <PmActionHub
                title={PM_RECOMMENDED_NEXT_STEP.title}
                description={PM_RECOMMENDED_NEXT_STEP.description('opportunity')}
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

            {visibility.showOwnerActions ? (
              <OpportunityPublishExperience
                publishDetails={publishDetails}
                publishBundles={publishBundles}
              />
            ) : null}

            {visibility.showOwnerActions || visibility.showFullDescription ? (
              <>
                <OpportunityHealthIndicator
                  healthState={resolveOpportunityHealthState({
                    status: opp.status,
                    visibilityStatus: opp.visibilityStatus,
                    errorCount: validationErrorCount,
                    publishReady:
                      opportunityReadinessResult?.status === 'ready_for_matching',
                  })}
                  validationPercent={Math.max(0, 100 - validationErrorCount * 12)}
                  readinessPercent={opportunityReadinessResult?.score ?? 0}
                  publishReady={
                    opportunityReadinessResult?.status === 'ready_for_matching'
                  }
                  estimatedMatch={
                    (opportunityReadinessResult?.score ?? 0) >= 80
                      ? 'High'
                      : (opportunityReadinessResult?.score ?? 0) >= 50
                        ? 'Medium'
                        : 'Developing'
                  }
                />
                <CollaborationSummaryCard
                  intent={formatOpportunityIntent(opp.intent)}
                  mainModelLabel={resolveMainCollaborationModelLabel(
                    opp.mainCollaborationModel ?? '',
                  )}
                  subModelLabel={resolveSubModelLabel(opp.subModelType ?? '')}
                  exchangeModeLabel={formatCollaborationExchangeMode(opp.exchangeMode)}
                  topologyLabel={formatFrameworkMatchTypeLabel(
                    opp.preferredMatchingTopology ??
                      deriveMatchingTopology({
                        mainCollaborationModel: opp.mainCollaborationModel,
                        modelType: opp.modelType,
                        subModelType: opp.subModelType,
                        exchangeMode: opp.exchangeMode,
                        acceptedExchangeModes: opp.acceptedExchangeModes,
                      }).topology,
                  )}
                  relationshipLabel="Company → Company"
                  readyToPublish={
                    opportunityReadinessResult?.status === 'ready_for_matching'
                  }
                />
                <DraftMetadataCard
                  status={opp.status}
                  createdAt={opp.createdAt}
                  updatedAt={opp.updatedAt}
                  ownerLabel={
                    visibility.showCreatorName ? creator?.profile?.name : opp.ownerPartyId
                  }
                  lastValidationLabel={
                    !opportunityLiveValidation ||
                    opportunityLiveValidation.issues.length === 0
                      ? 'No open issues'
                      : `${opportunityLiveValidation.issues.length} issue(s)`
                  }
                  lastReadinessLabel={`${Math.round(opportunityReadinessResult?.score ?? 0)}% · ${opportunityReadinessResult?.status ?? '—'}`}
                />
                <div id="marketplace-preview">
                  <MarketplacePreviewPanel opportunity={opp} />
                </div>
              </>
            ) : null}

            {visibility.showFullDescription ? (
              <OpportunitySummaryCard
                opportunity={opp}
                creatorName={visibility.showCreatorName ? creator?.profile?.name : undefined}
                skillCount={skills.length}
              />
            ) : null}

            {visibility.showParticipantMatchChip && participantMatch ? (
              <PmContentCard title="Your match">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className={cn(pmTypography.bodySm, 'text-muted-foreground')}>
                      You are matched to this opportunity.
                    </p>
                    {participantMatch.matchScore != null ? (
                      <PmMatchScoreBadge
                        score={participantMatch.matchScore}
                        variant="default"
                        showLabel
                        className="mt-2"
                      />
                    ) : null}
                  </div>
                  <PmButton size="sm" variant="outline" asChild>
                    <Link to={`/matches/${participantMatch.id}`}>Open match</Link>
                  </PmButton>
                </div>
              </PmContentCard>
            ) : null}

            {relatedMatchesModel ? (
              <RelatedMatchesPanel
                model={relatedMatchesModel}
                currentUserId={user?.id}
                canAct={!isPendingApproval}
                highlighted={highlightRelatedMatches}
                sectionId={RELATED_MATCHES_SECTION_ID}
              />
            ) : null}

            {visibility.showFullDescription ? (
              <PmContentCard title="Requirements" className="border-border/60 bg-surface-muted/30">
                <p className={cn(pmTypography.bodySm, 'text-muted-foreground')}>
                  {opp.description || 'No description provided.'}
                </p>
              </PmContentCard>
            ) : null}

            {visibility.showFullDescription && skills.length > 0 ? (
              <PmContentCard title="Core skills" className="border-border/60 bg-surface-muted/30">
                <div className="flex flex-wrap gap-2">
                  {skills.map((s: string) => (
                    <PmBadge key={s} tone="neutral" size="sm">
                      {s}
                    </PmBadge>
                  ))}
                </div>
              </PmContentCard>
            ) : null}

            {visibility.showBudgetAndTimeline ? (
              <PmFormReadonly>
                <PmFormReadonlySection title="Budget & timeline" description="Commercial and schedule context.">
                  <PmFormReadonlyField label="Main collaboration model" value={resolveMainCollaborationModelLabel(opp.mainCollaborationModel ?? '')} />
                  <PmFormReadonlyField label="Sub-model" value={resolveSubModelLabel(opp.subModelType ?? '')} />
                  <PmFormReadonlyField label="Model type" value={resolveModelTypeLabel(opp.modelType ?? '')} />
                  <PmFormReadonlyField label="Exchange mode" value={formatCollaborationExchangeMode(opp.exchangeMode)} />
                  <PmFormReadonlyField
                    label="Recommended Matching Topology"
                    value={`System will match this as ${formatFrameworkMatchTypeLabel(
                      opp.preferredMatchingTopology
                      ?? deriveMatchingTopology({
                        mainCollaborationModel: opp.mainCollaborationModel,
                        modelType: opp.modelType,
                        subModelType: opp.subModelType,
                        exchangeMode: opp.exchangeMode,
                      }).topology,
                    )}`}
                  />
                  <PmFormReadonlyField
                    label="Topology source"
                    value="System-derived — based on your collaboration model and exchange mode"
                  />
                  <PmFormReadonlyField label="Start date" value={opp.attributes?.startDate} />
                  <PmFormReadonlyField label="Updated" value={formatDate(opp.updatedAt)} />
                </PmFormReadonlySection>
              </PmFormReadonly>
            ) : null}

            {(() => {
              const attrs = opp.collaborationAttributes ?? {}
              const packages = normalizeWorkPackages(attrs.workPackages)
              const milestones = normalizeMilestones(
                attrs.milestones ?? opp.deliveryMilestones ?? [],
              )
              const taskCount = packages.reduce(
                (sum, pkg) => sum + (pkg.tasks?.length ?? 0),
                0,
              )
              if (packages.length === 0 && milestones.length === 0) return null
              return (
                <PmContentCard title="Work Packages" className="border-border/60 bg-surface-muted/30">
                  <p className={cn(pmTypography.bodySm, 'text-muted-foreground')}>
                    {packages.length} Work Packages · {taskCount} Tasks · {milestones.length} Milestones
                  </p>
                  <ul className="mt-3 space-y-2">
                    {packages.map((pkg) => (
                      <li key={pkg.id} className={cn(pmTypography.bodySm)}>
                        <span className="font-medium text-foreground">
                          {pkg.title || 'Untitled package'}
                        </span>
                        {pkg.tasks?.length
                          ? ` · ${pkg.tasks.length} task(s)`
                          : ''}
                        {pkg.deliverables.length
                          ? ` · ${pkg.deliverables.length} deliverable(s)`
                          : ''}
                      </li>
                    ))}
                  </ul>
                </PmContentCard>
              )
            })()}

            {visibility.showBudgetAndTimeline
              ? (() => {
                  const structure = migrateLegacyExchangeModeToCommercialStructure({
                    exchangeMode: opp.exchangeMode,
                    acceptedExchangeModes: opp.acceptedExchangeModes,
                    paymentModes: opp.paymentModes,
                    exchangeData: opp.exchangeData,
                    collaborationAttributes: opp.collaborationAttributes,
                  })
                  if (!structure.components.some((c) => c.enabled)) return null
                  const audience = isOwner ? 'owner' : 'marketplace'
                  const presented = presentCommercialForAudience(structure, audience)
                  const summary = buildCommercialStructureSummary(structure)
                  return (
                    <PmContentCard
                      title="Commercial Structure"
                      className="border-border/60 bg-surface-muted/30"
                    >
                      <p className={cn(pmTypography.bodySm, 'text-muted-foreground')}>
                        {presented?.isHybrid ? 'Hybrid' : presented?.derivedExchangeMode} —{' '}
                        {presented?.componentTypes.join(' + ')}
                      </p>
                      {presented?.showAmounts ? (
                        <ul className="mt-2 space-y-1">
                          {summary.previewLines.map((line) => (
                            <li key={line} className={cn(pmTypography.caption)}>
                              {line}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className={cn(pmTypography.caption, 'mt-2 text-muted-foreground')}>
                          Detailed commercial values are visible to owners and participants.
                        </p>
                      )}
                    </PmContentCard>
                  )
                })()
              : null}

            {visibility.showFullDescription && opportunitySemantic ? (
              <PmDisclosureSection
                title="Need/Offer framework reference"
                description="Advanced reference — semantic attributes, exchange modes, and matching models."
              >
                <UserJourneyStrip activeStepId={journeyActiveStep} compact />
                <NeedOfferMirrorPanel semantic={opportunitySemantic} />
                <ValueExchangeModesPanel selectedModes={opportunityPaymentModes} />
                <MatchingModelsReferencePanel
                  selectedModel={
                    opp.preferredMatchingTopology
                    ?? deriveMatchingTopology({
                      mainCollaborationModel: opp.mainCollaborationModel,
                      modelType: opp.modelType,
                      subModelType: opp.subModelType,
                      exchangeMode: opp.exchangeMode,
                    }).topology
                  }
                  compact
                  systemDerived
                />
              </PmDisclosureSection>
            ) : null}

            {visibility.showLegacyApplications ? (
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
            {visibility.showReadiness ? (
              <OpportunityReadinessCard opportunity={opp} opportunityId={opp.id} />
            ) : null}

            {isOwner ? <OpportunityVersionTimeline opportunity={opp} /> : null}

            {visibility.showOwnerActions && canPublishDraft ? (
              <OpportunityPublishPanel
                opportunity={opp}
                publishDetails={publishDetails}
                publishBundles={publishBundles}
                onPublish={handlePublish}
                showPublishButton={!recommendedAction || recommendedAction.id !== 'publish'}
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
                    : 'You submitted a direct application. Matches are the primary collaboration path.'}
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
                    Match is the primary path: Opportunity to Match to Negotiation to Commercial Agreement to Contract.
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
    </PmPage>
  )
}
