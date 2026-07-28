import { lazy, Suspense, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { ExplanationBundle } from '@pm-twin/explainability'
import { toast } from 'sonner'
import {
  buildOpportunityDetailsReadModel,
  buildViewerContext,
} from '@/lib/opportunity-details'
import { opportunitiesApi } from '@/api/opportunities.ts'
import { matchesApi } from '@/api/matches.ts'
import { negotiationsApi } from '@/api/negotiations.ts'
import { contractsApi } from '@/api/contracts.ts'
import { peopleApi } from '@/api/people.ts'
import { applicationRepository, dealRepository } from '@/repositories/index.ts'
import { auditRepository } from '@/repositories/index.ts'
import { useDataStoreVersion } from '@/hooks/use-data-store'
import { useAuth } from '@/providers/auth-provider'
import { getEffectiveProductFlags } from '@/domain/admin/settings/effective-settings.ts'
import { EntityAccessDenied, EntityLimitedViewBanner } from '@/components/auth/entity-access-state'
import { PmEmptyState, PmButton, PmPage, PmPageHeader, PmWorkflowJourney } from '@/components/ui/pm-index'
import {
  buildOpportunityWorkflowSteps,
  resolveCollaborationActiveStepFromMatches,
} from '@/components/ui/pm-workflow-journey-steps'
import { OpportunityExecutiveHeader, type OpportunityDetailsActionHandlers } from './header/opportunity-executive-header.tsx'
import { OpportunityKpiStrip } from './header/opportunity-kpi-strip.tsx'
import {
  OpportunityDetailsNavigation,
  useOpportunityWorkspace,
} from './opportunity-details-navigation.tsx'
import { OpportunityDetailsProvider } from './opportunity-details-context.tsx'
import { OpportunityCommandCenter } from './sidebar/opportunity-command-center.tsx'
import { OverviewWorkspace } from './workspaces/overview-workspace.tsx'
import { ScopeWorkspace } from './workspaces/scope-workspace.tsx'
import { CommercialWorkspace } from './workspaces/commercial-workspace.tsx'
import { trackOcxEvent } from '@/lib/ocx-analytics.ts'
import { opportunityCommandService } from '@/services/opportunity-command-service.ts'
import {
  publishOpportunityUiAction,
  resolveProfileKindFromUser,
} from '@/lib/publish-opportunity-ui-actions.ts'
import { showPublishSuccessFeedback } from '@/lib/publish-opportunity-feedback.ts'
import { buildCollaborationCommandPayload, opportunityToDraft } from '@/components/opportunity/wizard/draft-model.ts'
import { useNavigate } from 'react-router-dom'
import { OpportunityPublishExperience } from '@/components/opportunity/opportunity-publish-experience'
import { useState } from 'react'
import type { WorkspaceId } from '@/lib/opportunity-details'
import { cn } from '@/lib/utils'

const MarketplaceWorkspace = lazy(() =>
  import('./workspaces/marketplace-workspace.tsx').then((m) => ({ default: m.MarketplaceWorkspace })),
)
const MatchingWorkspace = lazy(() =>
  import('./workspaces/matching-workspace.tsx').then((m) => ({ default: m.MatchingWorkspace })),
)
const DocumentsWorkspace = lazy(() =>
  import('./workspaces/documents-workspace.tsx').then((m) => ({ default: m.DocumentsWorkspace })),
)
const RelatedWorkspace = lazy(() =>
  import('./workspaces/related-workspace.tsx').then((m) => ({ default: m.RelatedWorkspace })),
)
const HistoryWorkspace = lazy(() =>
  import('./workspaces/history-workspace.tsx').then((m) => ({ default: m.HistoryWorkspace })),
)

function WorkspaceFallback() {
  return (
    <div className="rounded-lg border border-dashed border-border/60 px-4 py-8 text-center text-sm text-muted-foreground">
      Loading workspace…
    </div>
  )
}

function renderWorkspace(workspace: WorkspaceId) {
  switch (workspace) {
    case 'overview':
      return <OverviewWorkspace />
    case 'scope':
      return <ScopeWorkspace />
    case 'commercial':
      return <CommercialWorkspace />
    case 'marketplace':
      return (
        <Suspense fallback={<WorkspaceFallback />}>
          <MarketplaceWorkspace />
        </Suspense>
      )
    case 'matching':
      return (
        <Suspense fallback={<WorkspaceFallback />}>
          <MatchingWorkspace />
        </Suspense>
      )
    case 'documents':
      return (
        <Suspense fallback={<WorkspaceFallback />}>
          <DocumentsWorkspace />
        </Suspense>
      )
    case 'related':
      return (
        <Suspense fallback={<WorkspaceFallback />}>
          <RelatedWorkspace />
        </Suspense>
      )
    case 'history':
      return (
        <Suspense fallback={<WorkspaceFallback />}>
          <HistoryWorkspace />
        </Suspense>
      )
    default:
      return <OverviewWorkspace />
  }
}

export function OpportunityDetailsShell({
  opportunityId,
}: {
  readonly opportunityId: string
}) {
  const version = useDataStoreVersion()
  const navigate = useNavigate()
  const { user, isPendingApproval, canAccessAdmin, activeWorkspace, activeParty } = useAuth()
  const [publishDetails, setPublishDetails] = useState<readonly string[] | null>(null)
  const [publishBundles, setPublishBundles] = useState<readonly ExplanationBundle[] | null>(null)
  const [highlightRelatedMatches, setHighlightRelatedMatches] = useState(false)

  const viewer = useMemo(
    () =>
      buildViewerContext({
        userId: user?.id,
        role: user?.role,
        status: user?.status,
        canAccessAdmin,
        activeWorkspaceId: activeWorkspace?.id,
        activePartyId: activeParty?.id,
        profile: user?.profile,
      }),
    [user, canAccessAdmin, activeWorkspace?.id, activeParty?.id],
  )

  const model = useMemo(
    () =>
      buildOpportunityDetailsReadModel(opportunityId, {
        getOpportunity: opportunitiesApi.get,
        getPostMatchesByOpportunity: matchesApi.getByOpportunity,
        getNegotiationsForPostMatch: negotiationsApi.getByPostMatchId,
        getDealForPostMatch: (postMatchId) => dealRepository.findByPostMatchId(postMatchId),
        getContractsForDeal: (dealId) => contractsApi.getByDealId(dealId),
        getApplicationsForOpportunity: (id) =>
          applicationRepository.getAll().filter((app) => app.opportunityId === id),
        getAuditEntries: () => auditRepository.getAll(),
        getPersonName: (userId) => peopleApi.get(userId)?.profile?.name,
        viewer,
        showLegacyApplicationsFlag: getEffectiveProductFlags().showLegacyApplications,
        canMutate: !isPendingApproval,
      }),
    [opportunityId, viewer, isPendingApproval, version],
  )

  const { workspace, setWorkspace } = useOpportunityWorkspace(opportunityId, user?.id)

  useEffect(() => {
    if (model) {
      trackOcxEvent('opportunity_details_opened', { opportunityId })
    }
  }, [opportunityId, model?.opportunity.id])

  if (!model) {
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

  if (model.visibility.access === 'denied') {
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

  const opp = model.opportunity

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
    setWorkspace('matching')
    showPublishSuccessFeedback(result)
  }

  const handleDeleteDraft = () => {
    const isDraft = (opp.status ?? '').toLowerCase() === 'draft'
    const confirmMessage = isDraft
      ? 'Delete this draft opportunity? This cannot be undone.'
      : 'Delete this opportunity from your workspace? This cannot be undone.'
    if (!window.confirm(confirmMessage)) return
    const result = opportunityCommandService.deleteOpportunity(opp.id)
    if (!result.success) {
      toast.error(result.errors?.join('\n') ?? 'Could not delete opportunity')
      return
    }
    toast.success(isDraft ? 'Draft deleted' : 'Opportunity deleted')
    navigate('/opportunities')
  }

  const handleArchive = () => {
    if (!window.confirm('Archive this opportunity? It will leave your active work list and marketplace discovery.')) return
    const result = opportunityCommandService.archiveOpportunity(opp.id, 'Owner archived')
    if (!result.success) {
      toast.error(result.errors?.join('\n') ?? 'Could not archive')
      return
    }
    toast.success('Opportunity archived')
    navigate('/opportunities')
  }

  const handleClose = () => {
    if (!window.confirm('Close this opportunity? It will leave your active work list and end new matching.')) return
    const result = opportunityCommandService.closeOpportunity(opp.id, 'Owner closed')
    if (!result.success) {
      toast.error(result.errors?.join('\n') ?? 'Could not close')
      return
    }
    toast.success('Opportunity closed')
    navigate('/opportunities')
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
    const blob = new Blob([JSON.stringify(opp, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${opp.id}.json`
    anchor.click()
    URL.revokeObjectURL(url)
    toast.success('JSON exported')
  }

  const handlePrint = () => window.print()
  const handleExportPdf = () => {
    toast.message('Export PDF', {
      description: 'Use Print and choose Save as PDF in the print dialog.',
    })
    window.print()
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied')
    } catch {
      toast.message(window.location.href)
    }
  }

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title: opp.title, url })
        return
      } catch {
        // fall through
      }
    }
    await handleCopyLink()
  }

  const handlers: OpportunityDetailsActionHandlers = {
    onPublish: handlePublish,
    onDeleteDraft: handleDeleteDraft,
    onArchive: handleArchive,
    onClose: handleClose,
    onDuplicate: handleDuplicate,
    onExportJson: handleExportJson,
    onExportPdf: handleExportPdf,
    onPrint: handlePrint,
    onShare: handleShare,
    onCopyLink: handleCopyLink,
  }

  const collaborationStep = resolveCollaborationActiveStepFromMatches(model.matching.cards)
  const topCard = model.matching.cards[0]
  const topContract = model.related.contracts[0]
  const journeySteps = buildOpportunityWorkflowSteps(
    opp,
    collaborationStep,
    topCard,
    model.related.agreements[0]?.status,
    topContract?.status,
    topContract?.id,
  )

  return (
    <OpportunityDetailsProvider
      value={{
        model,
        workspace,
        setWorkspace,
        handlers,
        highlightRelatedMatches,
      }}
    >
      <PmPage
        header={
          <div className="space-y-4">
            <OpportunityExecutiveHeader model={model} handlers={handlers} />
            <OpportunityKpiStrip model={model} />
            <PmWorkflowJourney
              steps={journeySteps}
              label="Opportunity journey"
              aria-label="Opportunity lifecycle journey"
              compact
            />
          </div>
        }
      >
        {model.visibility.access === 'teaser' ? (
          <EntityLimitedViewBanner message="Limited preview — complete verification to see full opportunity details." />
        ) : null}

        {publishDetails ? (
          <div className="mb-4">
            <OpportunityPublishExperience
              publishDetails={publishDetails}
              publishBundles={publishBundles}
            />
          </div>
        ) : null}

        <div className="mb-3 lg:hidden">
          <OpportunityCommandCenter handlers={handlers} />
        </div>

        <OpportunityDetailsNavigation
          workspace={workspace}
          onWorkspaceChange={setWorkspace}
        />

        <div
          className={cn(
            'mt-4 grid gap-6',
            model.workspaceVisibility.showCommandCenter && 'lg:grid-cols-[minmax(0,1fr)_minmax(16rem,22%)]',
          )}
        >
          <div className="min-w-0">{renderWorkspace(workspace)}</div>
          {model.workspaceVisibility.showCommandCenter ? (
            <aside className="hidden min-w-0 lg:block">
              <OpportunityCommandCenter handlers={handlers} />
            </aside>
          ) : null}
        </div>
      </PmPage>
    </OpportunityDetailsProvider>
  )
}
