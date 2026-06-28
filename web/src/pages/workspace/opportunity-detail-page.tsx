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
import { CollaborationFlowStrip } from '@/components/opportunity/collaboration-flow-strip'
import { OpportunitySummaryCard } from '@/components/opportunity/opportunity-summary-card'
import { RelatedMatchesPanel } from '@/components/opportunity/related-matches-panel'
import { ApplyWizard } from '@/components/opportunity/apply-wizard'
import { OpportunityReadinessCard, PublishReadinessAlert } from '@/components/readiness'
import { PageHeader, StatusBadge } from '@/components/shared/page-primitives'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    return <p className="text-muted-foreground">Opportunity not found.</p>
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
  const canPublishDraft =
    isOwner &&
    !isPendingApproval &&
    (opp.status === 'draft' || resolveCanonicalStatus('opportunity', opp.status) === 'draft')

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
    <div className="space-y-6">
      <PageHeader
        label={opp.intent === 'offer' ? 'Offer' : 'Need'}
        title={opp.title}
        description={[opp.location, creator?.profile?.name].filter(Boolean).join(' · ')}
        actions={
          <>
            <StatusBadge status={opp.status} />
            <Button variant="outline" className="cursor-pointer" asChild>
              <Link to="/matches">View matches</Link>
            </Button>
            {isOwner ? (
              <Button variant="outline" className="cursor-pointer" asChild>
                <Link to={`/opportunities/${opp.id}/edit`}>Edit</Link>
              </Button>
            ) : null}
          </>
        }
      />

      <CollaborationFlowStrip activeStep={collaborationStep} />

      {isPendingApproval ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          Your account is pending approval. You can browse matches but cannot respond or move pipeline cards yet.
        </div>
      ) : null}

      {publishDetails ? <PublishReadinessAlert details={publishDetails} /> : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
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

          <Card>
            <CardHeader><CardTitle>Full description</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {opp.description}
            </CardContent>
          </Card>
          {skills.length > 0 ? (
            <Card>
              <CardHeader><CardTitle>Core skills</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {skills.map((s: string) => (
                  <span key={s} className="rounded-md bg-muted px-2 py-1 text-xs">{s}</span>
                ))}
              </CardContent>
            </Card>
          ) : null}

          {isOwner ? (
            <ApplicationsPanel
              applications={oppApplications}
              canManage={!isPendingApproval}
              opportunityClosed={opportunityClosed}
              variant="legacy"
            />
          ) : null}
        </div>

        <div className="space-y-4">
          {isOwner ? (
            <OpportunityReadinessCard opportunity={opp} opportunityId={opp.id} />
          ) : null}

          {canPublishDraft ? (
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-base">Publish for matching</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Publishing makes this opportunity visible for matching once profile and opportunity readiness are complete.
                </p>
                <Button className="w-full cursor-pointer" onClick={handlePublish}>
                  Publish for matching
                </Button>
              </CardContent>
            </Card>
          ) : null}

          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-base">Next steps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                {hasMatches
                  ? 'Work through your matches in order: respond, negotiate terms, then create a deal.'
                  : 'Publish this opportunity to discover PostMatches, then negotiate and create a deal.'}
              </p>
              <div className="flex flex-col gap-2">
                <Button
                  className="w-full cursor-pointer"
                  variant={hasMatches ? 'default' : 'outline'}
                  asChild
                >
                  <Link to={hasMatches ? `/matches/${relatedMatchesModel!.matches[0]!.match.id}` : '/matches'}>
                    {hasMatches ? 'Open top match' : 'View matches'}
                  </Link>
                </Button>
                <Button variant="outline" className="w-full cursor-pointer" asChild>
                  <Link to="/pipeline/matches">Pipeline: Post-matches</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Exchange</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><span className="text-muted-foreground">Mode:</span> {opp.exchangeMode}</p>
              <p><span className="text-muted-foreground">Model:</span> {opp.modelType}</p>
              <p><span className="text-muted-foreground">Updated:</span> {formatDate(opp.updatedAt)}</p>
            </CardContent>
          </Card>

          {!isOwner && application && !canApply ? (
            <Card className="border-border/50 bg-muted/10">
              <CardHeader>
                <CardTitle className="text-base text-muted-foreground">
                  Direct application (legacy)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <StatusBadge status={application.status} />
                <p className="text-muted-foreground">
                  {application.status === 'accepted'
                    ? 'Your legacy application was accepted.'
                    : 'You submitted a direct application. PostMatch is the primary collaboration path.'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Submitted {formatDate(application.createdAt)}
                </p>
                {canEdit && !isPendingApproval ? (
                  <Button
                    className="cursor-pointer"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowWizard(true)}
                  >
                    Edit application
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {!isOwner && canApply && !isPendingApproval ? (
            showWizard ? (
              <ApplyWizard
                opportunityId={opp.id}
                applicantId={user!.id}
                onSubmitted={() => setShowWizard(false)}
                legacy
              />
            ) : (
              <Card className="border-border/50 bg-muted/10">
                <CardHeader>
                  <CardTitle className="text-base text-muted-foreground">
                    Direct application (legacy / hiring)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    PostMatch is the primary path: Opportunity → PostMatch → Negotiation → Deal → Contract.
                  </p>
                  <p className="text-xs">
                    Use direct application only for optional hiring-style proposals.
                  </p>
                  <Button
                    className="w-full cursor-pointer"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowWizard(true)}
                  >
                    {canReapply ? 'Re-submit legacy application' : 'Submit legacy application'}
                  </Button>
                </CardContent>
              </Card>
            )
          ) : null}
        </div>
      </div>
    </div>
  )
}
