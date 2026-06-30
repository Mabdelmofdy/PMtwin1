import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { opportunitiesApi } from '@/api/opportunities.ts'
import { matchesApi } from '@/api/matches.ts'
import { negotiationsApi } from '@/api/negotiations.ts'
import { peopleApi } from '@/api/people.ts'
import { applicationRepository, dealRepository } from '@/repositories/index.ts'
import { matchingService } from '@/services/matching-service.ts'
import { negotiationService } from '@/services/negotiation-service.ts'
import { buildOpportunityMatchesReadModel } from '@/lib/opportunity-matches-read-model.ts'
import { useDataStoreVersion } from '@/hooks/use-data-store'
import { useAuth } from '@/providers/auth-provider'
import { ApplicationsPanel } from '@/components/opportunity/applications-panel'
import { OpportunityTimeline, type OpportunityTimelineEvent } from '@/components/opportunity/opportunity-timeline'
import { CollaborationFlowStrip } from '@/components/opportunity/collaboration-flow-strip'
import { OpportunitySummaryCard } from '@/components/opportunity/opportunity-summary-card'
import { RelatedMatchesPanel } from '@/components/opportunity/related-matches-panel'
import { OpportunityPublishExperience, OpportunityPublishPanel } from '@/components/opportunity/opportunity-publish-experience'
import { ApplyWizard } from '@/components/opportunity/apply-wizard'
import { OpportunityReadinessCard, resolveOpportunityReadiness } from '@/components/readiness'
import { formatDate } from '@/lib/format'
import { resolveCanonicalStatus } from '@/lib/status-display.ts'
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
  PmMetricGrid,
  PmPageLayout,
} from '@/components/layout/pm-layout-index'
import {
  PmFormReadonly,
  PmFormReadonlyField,
  PmFormReadonlySection,
} from '@/components/forms/pm-form-index'
import { PmBadge, PmButton, PmEmptyState, PmMatchScoreBadge, PmPageHeader, PmPageHeroMetric, PmReadinessScoreBadge, PmStatCard } from '@/components/ui/pm-index'
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
  const topMatchScore = topMatch?.matchScore
  const opportunityReadiness = resolveOpportunityReadiness(opp)
  const canPublishDraft =
    isOwner &&
    !isPendingApproval &&
    (opp.status === 'draft' || resolveCanonicalStatus('opportunity', opp.status) === 'draft')

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
            <>
              <PmButton variant="outline" asChild>
                <Link to="/matches">View matches</Link>
              </PmButton>
              {isOwner ? (
                <PmButton variant="outline" asChild>
                  <Link to={`/opportunities/${opp.id}/edit`}>Edit</Link>
                </PmButton>
              ) : null}
            </>
          }
        />
      }
    >
      <CollaborationFlowStrip activeStep={collaborationStep} />

      {topMatchScore != null ? (
        <PmMatchScoreBadge score={topMatchScore} variant="hero" className="mb-2" />
      ) : (
        <PmReadinessScoreBadge
          score={opportunityReadiness.score}
          variant="hero"
          className="mb-2"
        />
      )}

      <PmMetricGrid columns={3} className="mb-2">
        <PmStatCard
          label="Related matches"
          value={relatedMatchesModel?.matches.length ?? 0}
          hint="Ranked by compatibility"
          dense
        />
        <PmStatCard
          label="Workflow step"
          value={collaborationStep}
          hint="Current collaboration stage"
          dense
        />
        <PmStatCard
          label="Skills listed"
          value={skills.length}
          hint="Scope capabilities"
          dense
        />
      </PmMetricGrid>

      {(hasMatches || canPublishDraft) ? (
        <PmContentCard title="Primary action" className="mb-2">
          <p className="text-sm text-muted-foreground">
            {hasMatches
              ? 'Work through your matches in order: respond, negotiate terms, then create a deal.'
              : 'Publish this opportunity to discover PostMatches, then negotiate and create a deal.'}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <PmButton
              variant={hasMatches ? 'default' : 'outline'}
              asChild
            >
              <Link to={hasMatches ? `/matches/${relatedMatchesModel!.matches[0]!.match.id}` : '/matches'}>
                {hasMatches ? 'Open top match' : 'View matches'}
              </Link>
            </PmButton>
            <PmButton variant="outline" asChild>
              <Link to="/pipeline/matches">Pipeline: Post-matches</Link>
            </PmButton>
          </div>
        </PmContentCard>
      ) : null}

      {isPendingApproval ? (
        <PmContentCard className="border-warning/30 bg-warning/5">
          <p className="text-sm text-warning">
            Your account is pending approval. You can browse matches but cannot respond or move pipeline cards yet.
          </p>
        </PmContentCard>
      ) : null}

      <OpportunityPublishExperience publishDetails={publishDetails} />

      <PmDetailLayout
        main={
          <>
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
          <PmInspectorLayout header="Actions & readiness">
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

            <PmContentCard title="Next steps">
              <p className="text-sm text-muted-foreground">
                Use the primary action above or jump directly to readiness and publish controls.
              </p>
              <div className="mt-3 flex flex-col gap-2">
                <PmButton variant="outline" className="w-full" asChild>
                  <Link to="/matches">All matches</Link>
                </PmButton>
              </div>
            </PmContentCard>

            {productFlags.showLegacyApplications && !isOwner && application && !canApply ? (
              <PmContentCard title="Direct application (legacy)">
                <PmBadge tone="neutral" size="sm" className="mb-2">
                  {application.status}
                </PmBadge>
                <p className="text-sm text-muted-foreground">
                  {application.status === 'accepted'
                    ? 'Your legacy application was accepted.'
                    : 'You submitted a direct application. PostMatch is the primary collaboration path.'}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
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
                  <p className="text-sm text-muted-foreground">
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
            title="Activity"
          />
        }
      />
    </PmPageLayout>
  )
}
