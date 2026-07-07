import { useNavigate, useParams, useLocation, useSearchParams } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
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
import { EntityAccessDenied } from '@/components/auth/entity-access-state'
import { CreateCommercialAgreementButton } from '@/components/negotiation/create-commercial-agreement-button.tsx'
import { StartNegotiationButton } from '@/components/negotiation/start-negotiation-button.tsx'
import { AgreeNegotiationButton } from '@/components/negotiation/agree-negotiation-button.tsx'
import { CancelNegotiationButton } from '@/components/negotiation/cancel-negotiation-button.tsx'
import { NegotiationRoomPanel } from '@/components/negotiation/negotiation-room-panel.tsx'
import {
  canShowNegotiationTransition,
  transitionNegotiationStatusUiAction,
} from '@/lib/negotiation-ui-actions.ts'
import { dealRepository, applicationRepository } from '@/repositories/index.ts'
import { PmTableEmpty, PmTablePagination, PmTableSearch, PmTableToolbar, resolveListEmptyState } from '@/components/data/pm-data-index'
import { PipelineBoard } from '@/components/pipeline/pipeline-board'
import {
  MatchesBrowseToolbar,
  MatchesListSection,
  useMatchesListFilters,
} from '@/components/collaboration/matches-list-section'
import { MatchTypeChip } from '@/components/collaboration/match-card'
import { CollaborationTimeline } from '@/components/collaboration/collaboration-timeline'
import {
  resolveCollaborationStepFromMatch,
  resolveCollaborationStepFromNegotiation,
} from '@/components/collaboration/collaboration-display'
import {
  PmBrowsePage,
  PmBrowseToolbar,
  PmContentCard,
  PmDetailLayout,
  PM_RECOMMENDED_NEXT_STEP,
  PmInspectorLayout,
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
  PmActionHub,
  type PmActionHubItem,
  PmBadge,
  PmButton,
  PmCardActions,
  PmEmptyState,
  PmLifecycleMap,
  PmPage,
  PmPageHeader,
  PmPageHeroMetric,
  PmPageActions,
  PmStatCard,
  PmSurface,
  PmWorkflowBadge,
  PmWorkflowLinksCard,
  buildMatchWorkflowSteps,
  buildNegotiationWorkflowSteps,
  type PmCardActionSlot,
  type PmMoreActionItem,
} from '@/components/ui/pm-index'
import { PmToolbarSurface } from '@/components/ui/pm-toolbar-surface'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import type { CollaborationTimelineEvent } from '@/components/collaboration/collaboration-timeline'
import type { Negotiation, PostMatch } from '@/types/domain.ts'
import { productFlags } from '@/config/product-flags.ts'
import { formatNegotiationDisplayTitle } from '@/lib/entity-display-titles.ts'
import { formatMatchDisplayTitle } from '@/lib/match-display.ts'
import {
  buildViewerContext,
  canMutateNegotiationDetail,
  canViewMatchDetail,
  canViewNegotiationDetail,
  filterPostMatchesForViewer,
} from '@/lib/entity-view-visibility.ts'
import { pmTypography } from '@/components/shared/pm-design-tokens'
import { pmResponsive } from '@/tokens'
import { cn } from '@/lib/utils'
import {
  MATCH_MARKETPLACE_VIEW_AVAILABLE,
  MATCH_VIEW_LABELS,
  readProductNavState,
  resolveDefaultMatchView,
  type MatchPresentationView,
} from '@/config/product-identity'
import { MatchTopologyDiagram } from '@/components/need-offer/need-offer-framework-panels'
import { formatFrameworkMatchTypeSubtitle } from '@/config/need-offer-framework.ts'
import { PRODUCT_LANGUAGE } from '@/lib/product-language'

function resolveMatchNegotiation(match: PostMatch): Negotiation | undefined {
  if (match.negotiationId) {
    return negotiationsApi.get(match.negotiationId)
  }
  const linked = negotiationsApi.getByPostMatchId(match.id)
  return linked[0]
}

function buildMatchDetailHeaderActions(input: {
  match: PostMatch
  model: NonNullable<ReturnType<typeof buildMatchDetailReadModel>>
  negotiation?: Negotiation
  actionPending: boolean
  onAcceptDecline: (action: 'accept' | 'decline') => void
}): {
  primary?: PmCardActionSlot
  secondary?: PmCardActionSlot
  more?: PmMoreActionItem[]
  moreChildren?: ReactNode
} {
  const { match, model, negotiation, actionPending, onAcceptDecline } = input
  const { actions } = model
  const more: PmMoreActionItem[] = []

  if (model.canAct && actions.showDecline) {
    more.push({
      id: 'decline',
      label: 'Decline',
      onSelect: () => onAcceptDecline('decline'),
      disabled: actionPending,
    })
  }

  if (actions.showViewNegotiation && actions.negotiationId) {
    more.push({
      id: 'view-negotiation',
      label: 'Open negotiation',
      href: `/negotiations/${actions.negotiationId}`,
    })
  }

  if (actions.showViewDeal && actions.dealId) {
    more.push({
      id: 'view-deal',
      label: PRODUCT_LANGUAGE.OPEN_COMMERCIAL_AGREEMENT,
      href: `/commercial-agreements/${actions.dealId}`,
    })
  }

  if (negotiation) {
    return {
      primary: {
        label: 'Agree terms',
        render: () => <AgreeNegotiationButton negotiation={negotiation} />,
      },
      secondary: {
        label: 'Open negotiation',
        href: `/negotiations/${negotiation.id}`,
        variant: 'outline',
      },
      more,
      moreChildren: (
        <>
          <DropdownMenuItem asChild>
            <CancelNegotiationButton negotiation={negotiation} variant="destructive" className="w-full justify-start" />
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <CreateCommercialAgreementButton negotiation={negotiation} variant="outline" className="w-full justify-start" />
          </DropdownMenuItem>
        </>
      ),
    }
  }

  if (model.canAct && actions.showAccept) {
    return {
      primary: {
        label: 'Accept',
        onClick: () => onAcceptDecline('accept'),
        loading: actionPending,
      },
      secondary: { label: PRODUCT_LANGUAGE.OPEN_OPPORTUNITIES, href: '/opportunities', variant: 'outline' },
      more,
    }
  }

  if (model.canAct && actions.showStartNegotiation) {
    return {
      primary: {
        label: 'Start negotiation',
        render: () => <StartNegotiationButton match={match} variant="default" />,
      },
      secondary: { label: PRODUCT_LANGUAGE.OPEN_OPPORTUNITIES, href: '/opportunities', variant: 'outline' },
      more,
    }
  }

  if (actions.showViewDeal && actions.dealId) {
    return {
      primary: { label: PRODUCT_LANGUAGE.OPEN_COMMERCIAL_AGREEMENT, href: `/commercial-agreements/${actions.dealId}` },
      more,
    }
  }

  return {
    primary: { label: 'Open match', href: `/matches/${match.id}` },
    more,
  }
}

function buildMatchRecommendedAction(input: {
  match: PostMatch
  model: NonNullable<ReturnType<typeof buildMatchDetailReadModel>>
  negotiation?: Negotiation
  onAcceptDecline?: (action: 'accept' | 'decline') => void
  actionPending?: boolean
}): PmActionHubItem | null {
  const { match, model, negotiation, onAcceptDecline, actionPending } = input
  const { actions } = model

  if (model.canAct && actions.showAccept && onAcceptDecline) {
    return {
      id: 'accept-match',
      title: 'Accept match',
      context: 'Respond to advance this collaboration.',
      status: match.status,
      statusEntity: 'match',
      matchScore: match.matchScore,
      primary: {
        label: 'Accept',
        onClick: () => onAcceptDecline('accept'),
        loading: actionPending,
      },
      secondary: {
        label: PRODUCT_LANGUAGE.OPEN_OPPORTUNITIES,
        href: '/opportunities',
        variant: 'outline',
      },
    }
  }

  if (model.canAct && actions.showStartNegotiation) {
    return {
      id: 'start-negotiation',
      title: 'Start negotiation',
      context: 'Move from match acceptance into term discussions.',
      status: match.status,
      statusEntity: 'match',
      matchScore: match.matchScore,
      primary: {
        label: 'Start negotiation',
        render: () => <StartNegotiationButton match={match} variant="default" />,
      },
    }
  }

  if (negotiation) {
    return {
      id: 'negotiation-active',
      title: 'Review negotiation',
      context: 'Terms are in progress — agree, counter, or create a commercial agreement.',
      status: negotiation.status,
      statusEntity: 'negotiation',
      primary: { label: PRODUCT_LANGUAGE.OPEN_NEGOTIATION, href: `/negotiations/${negotiation.id}` },
      secondary: actions.showViewDeal && actions.dealId
        ? { label: PRODUCT_LANGUAGE.OPEN_COMMERCIAL_AGREEMENT, href: `/commercial-agreements/${actions.dealId}`, variant: 'outline' }
        : undefined,
    }
  }

  if (actions.showViewDeal && actions.dealId) {
    return {
      id: 'open-deal',
      title: 'Review commercial agreement',
      context: 'Commercial agreement terms are ready for review.',
      status: match.status,
      statusEntity: 'deal',
      primary: { label: PRODUCT_LANGUAGE.OPEN_COMMERCIAL_AGREEMENT, href: `/commercial-agreements/${actions.dealId}` },
      secondary: actions.showViewNegotiation && actions.negotiationId
        ? {
            label: PRODUCT_LANGUAGE.OPEN_NEGOTIATION,
            href: `/negotiations/${actions.negotiationId}`,
            variant: 'outline',
          }
        : undefined,
    }
  }

  return null
}

function buildNegotiationRecommendedAction(input: {
  neg: Negotiation
  linkedDeal?: { id: string; status: string }
  canMutate: boolean
}): PmActionHubItem | null {
  const { neg, linkedDeal, canMutate } = input

  if (linkedDeal) {
    return {
      id: 'open-deal',
      title: 'Review linked commercial agreement',
      context: 'Terms are settled — continue in the commercial agreement workspace.',
      status: linkedDeal.status,
      statusEntity: 'deal',
      primary: { label: PRODUCT_LANGUAGE.OPEN_COMMERCIAL_AGREEMENT, href: `/commercial-agreements/${linkedDeal.id}` },
      secondary: neg.postMatchId
        ? { label: PRODUCT_LANGUAGE.OPEN_MATCH, href: `/matches/${neg.postMatchId}`, variant: 'outline' }
        : undefined,
    }
  }

  if (!canMutate) return null

  return {
    id: 'agree-terms',
    title: 'Agree terms',
    context: 'Confirm terms or create a commercial agreement when ready.',
    status: neg.status,
    statusEntity: 'negotiation',
    primary: {
      label: 'Agree terms',
      render: () => <AgreeNegotiationButton negotiation={neg} />,
    },
    secondary: neg.postMatchId
      ? { label: PRODUCT_LANGUAGE.OPEN_MATCH, href: `/matches/${neg.postMatchId}`, variant: 'outline' }
      : undefined,
  }
}

const PIPELINE_TAB_DEFS = [
  { value: 'opportunities', label: 'Opportunities' },
  { value: 'matches', label: 'Matches' },
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
  const { user, canAccessAdmin } = useAuth()
  const showLegacyApplications = productFlags.showLegacyApplications
  const pipelineTabs = getVisiblePipelineTabs(showLegacyApplications)
  const activeTab =
    !showLegacyApplications && tab === 'applications' ? 'opportunities' : (tab ?? 'opportunities')
  const version = useDataStoreVersion()
  const opportunities = opportunitiesApi.list()
  const allMatches = matchesApi.list()
  const applications = applicationRepository.getAll()
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
  const ownedOpportunityIds = useMemo(() => {
    const ids = new Set<string>()
    for (const opp of opportunities) {
      if (opp.creatorId && opp.creatorId === user?.id) {
        ids.add(opp.id)
      }
    }
    return ids
  }, [opportunities, user?.id])
  const matches = useMemo(
    () => filterPostMatchesForViewer(allMatches, viewer, { ownedOpportunityIds }),
    [allMatches, viewer, ownedOpportunityIds],
  )
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
    <PmPage
      header={
        <PmPageHeader
          label="Workflow"
          title="Pipeline"
          description="Track opportunity and match stages here, then continue to negotiations, commercial agreements, and contracts in their workflow sections."
          tone="mission"
          metric={
            <PmPageHeroMetric value={workflowCount} label="Active workflows" />
          }
          badges={
            <>
              <PmBadge tone="primary">{opportunities.length} opportunities</PmBadge>
              <PmBadge tone="info">{activeMatches} matches</PmBadge>
              <PmBadge tone="muted">{'Next: Negotiations -> Commercial Agreements -> Contracts'}</PmBadge>
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
        <PmToolbarSurface>
          <TabsList className={cn('max-w-full', pmResponsive.scrollX)}>
            {pipelineTabs.map((t) => (
              <TabsTrigger key={t.value} value={t.value} className="cursor-pointer">
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </PmToolbarSurface>
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
              description="Primary collaboration runs through matches."
            >
              <PipelineBoard mode="applications" key={`app-${version}`} />
            </PmContentCard>
          </TabsContent>
        ) : null}
      </Tabs>
    </PmPage>
  )
}

export function MatchesPage() {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const navState = readProductNavState(location.state)
  const { user, canAccessAdmin } = useAuth()
  const [matchView, setMatchView] = useState<MatchPresentationView>(() =>
    resolveDefaultMatchView(navState),
  )
  const allMatches = matchesApi.list()
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
  const ownedOpportunityIds = useMemo(() => {
    const ids = new Set<string>()
    for (const opp of opportunitiesApi.list()) {
      if (opp.creatorId && opp.creatorId === user?.id) {
        ids.add(opp.id)
      }
    }
    return ids
  }, [user?.id])
  const myMatches = useMemo(
    () => filterPostMatchesForViewer(allMatches, viewer, { ownedOpportunityIds }),
    [allMatches, viewer, ownedOpportunityIds],
  )
  const recommendedMatches = useMemo(
    () =>
      [...myMatches]
        .filter((match) => match.status === 'discovered' || match.status === 'accepted')
        .sort((a, b) => b.matchScore - a.matchScore),
    [myMatches],
  )
  const displayedMatches =
    matchView === 'recommended'
      ? recommendedMatches
      : matchView === 'marketplace' && !MATCH_MARKETPLACE_VIEW_AVAILABLE
        ? []
        : myMatches
  const activeMatches = countActiveMatches(myMatches)
  const isMarketplaceBrowse = navState?.domain === 'marketplace' || matchView === 'marketplace'
  const marketplacePreview =
    matchView === 'marketplace' && !MATCH_MARKETPLACE_VIEW_AVAILABLE
  const listFilters = useMatchesListFilters(displayedMatches)

  useEffect(() => {
    const urlMatchTypes = searchParams.get('matchTypes')
    const urlMainModel = searchParams.get('mainModel')
    const urlExchangeMode = searchParams.get('exchangeModes')
    if (urlMatchTypes) {
      const first = urlMatchTypes.split(',').map((entry) => entry.trim()).find(Boolean)
      if (first && first !== listFilters.matchType) listFilters.setMatchType(first)
    }
    if (urlMainModel && urlMainModel !== listFilters.mainModel) {
      listFilters.setMainModel(urlMainModel)
    }
    if (urlExchangeMode) {
      const first = urlExchangeMode.split(',').map((entry) => entry.trim()).find(Boolean)
      if (first && first !== listFilters.exchangeMode) {
        listFilters.setExchangeMode(first)
      }
    }
  }, [
    searchParams,
    listFilters.matchType,
    listFilters.mainModel,
    listFilters.exchangeMode,
    listFilters.setMatchType,
    listFilters.setMainModel,
    listFilters.setExchangeMode,
  ])

  useEffect(() => {
    setMatchView(resolveDefaultMatchView(navState))
  }, [location.key, navState?.domain, navState?.matchView])

  useEffect(() => {
    listFilters.setPage(1)
  }, [matchView, listFilters.setPage])

  return (
    <PmBrowsePage
      header={
        <PmPageHeader
          label={isMarketplaceBrowse ? 'Marketplace' : 'My Workspace'}
          title={
            matchView === 'recommended'
              ? 'Recommended matches'
              : matchView === 'marketplace'
                ? 'Browse matches'
                : 'My matches'
          }
          description={
            isMarketplaceBrowse
              ? 'Discover ranked collaboration pairings across the marketplace.'
              : 'Matches assigned to you — review, accept, and progress to negotiations.'
          }
          tone="match"
          metric={
            <PmPageHeroMetric value={activeMatches} label="Needs action" />
          }
          badges={
            <>
              <PmBadge tone="primary">{myMatches.length} assigned</PmBadge>
              <PmBadge tone="success">
                {myMatches.filter((m) => m.status === 'accepted' || m.status === 'confirmed').length} accepted
              </PmBadge>
            </>
          }
        />
      }
      toolbar={
        <PmBrowseToolbar>
          <Tabs
            value={matchView}
            onValueChange={(value) => setMatchView(value as MatchPresentationView)}
          >
            <TabsList className={cn('max-w-full', pmResponsive.scrollX)}>
              {(Object.keys(MATCH_VIEW_LABELS) as MatchPresentationView[]).map((key) => (
                <TabsTrigger
                  key={key}
                  value={key}
                  className="cursor-pointer"
                  disabled={key === 'marketplace' && !MATCH_MARKETPLACE_VIEW_AVAILABLE}
                >
                  {MATCH_VIEW_LABELS[key]}
                  {key === 'marketplace' && !MATCH_MARKETPLACE_VIEW_AVAILABLE ? (
                    <PmBadge tone="muted" size="sm" className="ms-1.5">
                      Preview
                    </PmBadge>
                  ) : null}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          {!marketplacePreview ? (
            <MatchesBrowseToolbar
              search={listFilters.search}
              setSearch={listFilters.setSearch}
              status={listFilters.status}
              setStatus={listFilters.setStatus}
              matchType={listFilters.matchType}
              setMatchType={listFilters.setMatchType}
              activeFilterChips={listFilters.activeFilterChips}
              clearAllFilters={listFilters.clearAllFilters}
            />
          ) : null}
        </PmBrowseToolbar>
      }
      pagination={
        !marketplacePreview && listFilters.totalItems > 0 ? (
          <PmTablePagination
            page={listFilters.safePage}
            pageSize={listFilters.pageSize}
            totalItems={listFilters.totalItems}
            pageSizeOptions={[12, 24, 48]}
            onPageChange={listFilters.setPage}
            onPageSizeChange={listFilters.setPageSize}
          />
        ) : null
      }
    >
      {marketplacePreview ? (
        <PmEmptyState
          title="Marketplace match browse — preview"
          description="Cross-marketplace match discovery is not available yet. Use My Matches or Recommended Matches for your assigned collaborations."
          action={
            <PmButton size="sm" variant="outline" onClick={() => setMatchView('mine')}>
              View my matches
            </PmButton>
          }
        />
      ) : (
        <MatchesListSection
          matches={displayedMatches}
          filters={listFilters}
          showToolbar={false}
          showPagination={false}
          layout="cards"
          shortenTitles
        />
      )}
    </PmBrowsePage>
  )
}

export function MatchDetailPage() {
  const { id } = useParams()
  const { user, isPendingApproval, canAccessAdmin } = useAuth()
  const version = useDataStoreVersion()
  const match = id ? matchesApi.get(id) : undefined
  const [pendingAction, setPendingAction] = useState<'accept' | 'decline' | null>(null)

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
      <PmPage
        header={<PmPageHeader title="Match" description="Match detail." />}
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
      </PmPage>
    )
  }

  if (!canViewMatchDetail(match, viewer)) {
    return (
      <PmPage header={<PmPageHeader title="Access denied" description="Match detail." />}>
        <EntityAccessDenied
          entity="match"
          description="Only match participants can access this workspace."
        />
      </PmPage>
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

  const headerActions = buildMatchDetailHeaderActions({
    match,
    model,
    negotiation,
    actionPending,
    onAcceptDecline: runPostMatchAction,
  })

  const matchWorkflowSteps = buildMatchWorkflowSteps({
    id: match.id,
    status: match.status,
    negotiation: negotiation
      ? { id: negotiation.id, status: negotiation.status }
      : undefined,
    deal: deal ? { id: deal.id, status: deal.status } : undefined,
  })

  const matchTitle = formatMatchDisplayTitle(match, opportunitiesApi.get)
  const recommendedAction = buildMatchRecommendedAction({
    match,
    model,
    negotiation,
    onAcceptDecline: runPostMatchAction,
    actionPending,
  })
  const matchWorkflowLinks = [
    ...(negotiation
      ? [
          {
            id: 'negotiation',
            label: PRODUCT_LANGUAGE.OPEN_NEGOTIATION,
            href: `/negotiations/${negotiation.id}`,
          },
        ]
      : []),
    ...(actions.showViewDeal && actions.dealId
      ? [{ id: 'deal', label: PRODUCT_LANGUAGE.OPEN_COMMERCIAL_AGREEMENT, href: `/commercial-agreements/${actions.dealId}` }]
      : []),
  ]

  return (
    <PmPage
      header={
        <PmPageHeader
          label="Match"
          title={matchTitle}
          description={model.canonicalStatus.replace(/_/g, ' ')}
          tone="match"
          metric={
            <PmPageHeroMetric value={model.scoreLabel} label="Match score" />
          }
          badges={
            <>
              <MatchTypeChip matchType={match.matchType} />
              <PmBadge tone="muted" size="sm">
                {formatFrameworkMatchTypeSubtitle(match.matchType)}
              </PmBadge>
              <PmWorkflowBadge status={match.status} entity="match" />
            </>
          }
          actions={
            <PmPageActions
              primary={headerActions.primary}
              secondary={headerActions.secondary}
              more={headerActions.more}
              moreChildren={headerActions.moreChildren}
            />
          }
        />
      }
    >
      <PmDetailLayout
        main={
          <>
            <PmLifecycleMap steps={matchWorkflowSteps} />

            {recommendedAction ? (
              <PmActionHub
                title={PM_RECOMMENDED_NEXT_STEP.title}
                description={PM_RECOMMENDED_NEXT_STEP.description('match')}
                items={[recommendedAction]}
              />
            ) : null}

            <PmWorkflowLinksCard
              links={matchWorkflowLinks}
              emptyMessage="Accept the match or start negotiating to unlock the next workflow links."
            />

            <PmContentCard title="Match status" className="border-border/60 bg-surface-muted/40">
              <div className="flex flex-wrap items-center gap-3">
                <PmWorkflowBadge status={match.status} entity="match" />
                <MatchTypeChip matchType={match.matchType} />
                <p className={cn(pmTypography.bodySm, 'text-muted-foreground')}>
                  {model.canonicalStatus.replace(/_/g, ' ')} · Score {model.scoreLabel}
                </p>
              </div>
            </PmContentCard>

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

            <MatchTopologyDiagram topology={model.topology} className="border-border/60 bg-surface-muted/30" />

            {model.relatedOpportunities.length > 0 ? (
              <PmContentCard title="Related opportunities" className="border-border/60 bg-surface-muted/30">
                <ul className={cn('space-y-1', pmTypography.bodySm)}>
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

            <PmContentCard title="Participants" className="border-border/60 bg-surface-muted/30">
              {model.participants.length > 0 ? (
                <ul className={cn('space-y-1', pmTypography.bodySm)}>
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
                <PmEmptyState title="No participants recorded" size="compact" />
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
              negotiation ? undefined : (
                <p className={cn(pmTypography.bodySm, 'text-muted-foreground')}>
                  Start negotiating terms to move this match forward.
                </p>
              )
            }
          >
            {negotiation ? (
              <PmFormReadonly>
                <PmFormReadonlySection title="Status">
                  <PmFormReadonlyField label="Status">
                    <PmWorkflowBadge status={negotiation.status} entity="negotiation" />
                  </PmFormReadonlyField>
                </PmFormReadonlySection>
              </PmFormReadonly>
            ) : (
              <p className={cn(pmTypography.bodySm, 'text-muted-foreground')}>
                No negotiation linked yet. Start negotiating terms before creating a commercial agreement.
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
    </PmPage>
  )
}

export function NegotiationsPage() {
  const { user, canAccessAdmin } = useAuth()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const allNegotiations = negotiationsApi.list()
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
  const negotiations = useMemo(
    () => allNegotiations.filter((n) => canViewNegotiationDetail(n, viewer)),
    [allNegotiations, viewer],
  )
  const filteredNegotiations = useMemo(() => {
    if (!search.trim()) return negotiations
    const q = search.toLowerCase()
    return negotiations.filter((neg) =>
      formatNegotiationDisplayTitle(neg, opportunitiesApi.get).toLowerCase().includes(q) &&
      (status === 'all' || neg.status === status),
    )
  }, [negotiations, search, status])
  const totalItems = filteredNegotiations.length
  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize))
  const safePage = Math.min(page, pageCount)
  const pagedNegotiations = filteredNegotiations.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  )
  const activeCount = negotiations.filter(
    (n) => n.status === 'active' || n.status === 'countered',
  ).length
  const listEmpty = resolveListEmptyState({
    hasSourceData: negotiations.length > 0,
    hasActiveFilters: search.length > 0 || status !== 'all',
    firstRun: {
      title: 'No negotiations yet',
      description: 'Negotiations begin after you accept a match and start term discussions.',
    },
    filtered: {
      title: 'No negotiations match your search',
      description: 'Try a different search term.',
    },
  })

  return (
    <PmBrowsePage
      header={
        <PmPageHeader
          label="My Workspace"
          title="My active negotiations"
          description="Respond to terms and counters on negotiations assigned to you."
          tone="negotiation"
          metric={<PmPageHeroMetric value={activeCount} label="Active" />}
          badges={
            <>
              <PmBadge tone="muted">{negotiations.length} total</PmBadge>
              <PmBadge tone="primary">{activeCount} active</PmBadge>
            </>
          }
        />
      }
      toolbar={
        negotiations.length > 0 ? (
          <PmBrowseToolbar>
            <PmTableToolbar
              search={
                <PmTableSearch
                  placeholder="Search negotiations…"
                  value={search}
                  onValueChange={(value) => {
                    setSearch(value)
                    setPage(1)
                  }}
                />
              }
              filters={
                <div className="w-44">
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="countered">Countered</SelectItem>
                      <SelectItem value="agreed">Agreed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              }
            />
          </PmBrowseToolbar>
        ) : undefined
      }
      pagination={
        totalItems > 0 ? (
          <PmTablePagination
            page={safePage}
            pageSize={pageSize}
            totalItems={totalItems}
            pageSizeOptions={[12, 24, 48]}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size)
              setPage(1)
            }}
          />
        ) : null
      }
    >
      {pagedNegotiations.length === 0 ? (
        listEmpty.branch === 'first-run' ? (
          <PmEmptyState
            title={listEmpty.config.title ?? 'No negotiations yet'}
            description={listEmpty.config.description}
            action={
              <PmButton asChild>
                <Link to="/matches">Open matches</Link>
              </PmButton>
            }
          />
        ) : listEmpty.branch === 'filtered' ? (
          <PmTableEmpty
            variant="no-results"
            title={listEmpty.config.title}
            description={listEmpty.config.description}
            primaryAction={
              <PmButton size="sm" variant="outline" onClick={() => setSearch('')}>
                Clear search
              </PmButton>
            }
          />
        ) : null
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {pagedNegotiations.map((neg) => (
            <PmSurface
              key={neg.id}
              variant="default"
              shadow="card"
              interactive
              className="flex h-full flex-col p-4 md:p-5"
            >
              <div className="flex items-start justify-between gap-2">
                <Link
                  to={`/negotiations/${neg.id}`}
                  className={cn(pmTypography.h3, 'line-clamp-2 hover:text-primary')}
                >
                  {formatNegotiationDisplayTitle(neg, opportunitiesApi.get)}
                </Link>
                <PmWorkflowBadge status={neg.status} entity="negotiation" size="sm" />
              </div>
              <p className={cn(pmTypography.caption, 'mt-2 text-muted-foreground')}>
                Updated {formatDate(neg.updatedAt ?? neg.createdAt)}
              </p>
              <PmCardActions
                className="mt-4"
                primary={{ label: 'Open negotiation', href: `/negotiations/${neg.id}` }}
              />
            </PmSurface>
          ))}
        </div>
      )}
    </PmBrowsePage>
  )
}

export function NegotiationDetailPage() {
  const { id } = useParams()
  const { user, canAccessAdmin } = useAuth()
  const version = useDataStoreVersion()
  const neg = id ? negotiationsApi.get(id) : undefined
  const [proposalPending, setProposalPending] = useState(false)

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
      <PmPage
        header={<PmPageHeader title="Negotiation" description="Value negotiation workspace." />}
      >
        <PmEmptyState
          title="Negotiation not found"
          description="This negotiation may have been removed or the link is invalid."
        />
      </PmPage>
    )
  }

  if (!canViewNegotiationDetail(neg, viewer)) {
    return (
      <PmPage
        header={<PmPageHeader title="Access denied" description="Value negotiation workspace." />}
      >
        <EntityAccessDenied
          entity="negotiation"
          description="Only negotiation participants and authorized auditors can access this workspace."
        />
      </PmPage>
    )
  }

  const canMutate = canMutateNegotiationDetail(neg, viewer)

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

  const negotiationTitle = formatNegotiationDisplayTitle(neg, opportunitiesApi.get)
  const linkedMatch = neg.postMatchId ? matchesApi.get(neg.postMatchId) : undefined
  const recommendedNegotiationAction = buildNegotiationRecommendedAction({
    neg,
    linkedDeal,
    canMutate,
  })

  const negotiationWorkflowSteps = buildNegotiationWorkflowSteps({
    id: neg.id,
    status: neg.status,
    postMatchId: neg.postMatchId,
    linkedMatch: linkedMatch ? { status: linkedMatch.status } : undefined,
    linkedDeal: linkedDeal
      ? { id: linkedDeal.id, status: linkedDeal.status }
      : undefined,
  })
  const negotiationWorkflowLinks = [
    ...(neg.postMatchId
      ? [{ id: 'match', label: PRODUCT_LANGUAGE.OPEN_MATCH, href: `/matches/${neg.postMatchId}` }]
      : []),
    ...(linkedDeal
      ? [{ id: 'deal', label: PRODUCT_LANGUAGE.OPEN_COMMERCIAL_AGREEMENT, href: `/commercial-agreements/${linkedDeal.id}` }]
      : []),
  ]

  return (
    <PmPage
      header={
        <PmPageHeader
          label="Negotiation"
          title={negotiationTitle}
          description="Structured negotiation room with discussion, offers, and audit trail."
          tone="negotiation"
          metric={
            <PmPageHeroMetric
              value={neg.rounds?.length ?? 0}
              label="Rounds"
            />
          }
          badges={<PmWorkflowBadge status={neg.status} entity="negotiation" />}
          actions={
            canMutate ? (
              <PmPageActions
                primary={{
                  label: 'Agree terms',
                  render: () => <AgreeNegotiationButton negotiation={neg} />,
                }}
                secondary={
                  neg.postMatchId
                    ? { label: 'Open match', href: `/matches/${neg.postMatchId}`, variant: 'outline' }
                    : undefined
                }
                more={[
                  ...(linkedDeal
                    ? [{ id: 'view-deal', label: PRODUCT_LANGUAGE.OPEN_COMMERCIAL_AGREEMENT, href: `/commercial-agreements/${linkedDeal.id}` }]
                    : []),
                ]}
                moreChildren={
                  <>
                    <DropdownMenuItem asChild>
                      <CancelNegotiationButton
                        negotiation={neg}
                        variant="destructive"
                        className="w-full justify-start"
                      />
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <CreateCommercialAgreementButton negotiation={neg} className="w-full justify-start" />
                    </DropdownMenuItem>
                    {canSubmitProposal ? (
                      <DropdownMenuItem
                        disabled={proposalPending}
                        onSelect={() => handleProposalTransition('countered')}
                      >
                        Submit proposal
                      </DropdownMenuItem>
                    ) : null}
                    {canAcceptUpdatedProposal ? (
                      <DropdownMenuItem
                        disabled={proposalPending}
                        onSelect={() => handleProposalTransition('active')}
                      >
                        Accept updated proposal
                      </DropdownMenuItem>
                    ) : null}
                  </>
                }
              />
            ) : neg.postMatchId ? (
              <PmPageActions
                secondary={{
                  label: PRODUCT_LANGUAGE.OPEN_MATCH,
                  href: `/matches/${neg.postMatchId}`,
                  variant: 'outline',
                }}
              />
            ) : undefined
          }
        />
      }
    >
      <PmDetailLayout
        main={
          <>
            <PmLifecycleMap steps={negotiationWorkflowSteps} />

            {recommendedNegotiationAction ? (
              <PmActionHub
                title={PM_RECOMMENDED_NEXT_STEP.title}
                description={PM_RECOMMENDED_NEXT_STEP.description('negotiation')}
                items={[recommendedNegotiationAction]}
              />
            ) : null}

            <PmWorkflowLinksCard links={negotiationWorkflowLinks} />

            <NegotiationRoomPanel negotiation={neg} viewer={viewer} />
          </>
        }
        inspector={
          <PmInspectorLayout header={<PmSectionHeader title="Participants & terms" />}>
            <PmFormReadonly>
              <PmFormReadonlySection title="Participants">
                {(neg.participants ?? neg.parties ?? []).map((p) => {
                  const displayName = peopleApi.get(p.userId)?.profile?.name
                  return (
                    <PmFormReadonlyField
                      key={p.userId}
                      label={p.role.replace(/_/g, ' ')}
                      value={displayName ? `${displayName} (${p.userId})` : p.userId}
                    />
                  )
                })}
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
    </PmPage>
  )
}
