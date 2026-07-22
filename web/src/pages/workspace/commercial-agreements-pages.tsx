import { Link, useParams, useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { contractsApi } from '@/api/contracts.ts'
import { commercialAgreementsApi } from '@/api/commercial-agreements.ts'
import { matchesApi } from '@/api/matches.ts'
import { negotiationsApi } from '@/api/negotiations.ts'
import { opportunitiesApi } from '@/api/opportunities.ts'
import { peopleApi } from '@/api/people.ts'
import { CreateContractButton } from '@/components/commercial-agreement/create-contract-button'
import { CommercialAgreementStageActions } from '@/components/commercial-agreement/commercial-agreement-stage-actions.tsx'
import { useDataStoreVersion } from '@/hooks/use-data-store'
import { buildCommercialAgreementDetailReadModel } from '@/lib/commercial-agreement-detail-read-model.ts'
import { ExplanationPanel } from '@/components/explainability/explanation-panel.tsx'
import { buildAgreementExplanation } from '@/services/explainability/index.ts'
import { formatDate } from '@/lib/format'
import { CollaborationTimeline } from '@/components/collaboration/collaboration-timeline'
import { resolveCollaborationStepFromDeal } from '@/components/collaboration/collaboration-display'
import type { CollaborationTimelineEvent } from '@/components/collaboration/collaboration-timeline'
import {
  PmBrowsePage,
  PmBrowseToolbar,
  PmContentCard,
  PmDetailLayout,
  PM_RECOMMENDED_NEXT_STEP,
  PmInspectorLayout,
  PmSectionHeader,
  countActiveDeals,
} from '@/components/layout/pm-layout-index'
import {
  PmFormReadonly,
  PmFormReadonlyField,
  PmFormReadonlySection,
} from '@/components/forms/pm-form-index'
import {
  PmDataTable,
  PmTableEmpty,
  PmTablePagination,
  PmTableRowActions,
  PmTableSearch,
  PmTableToolbar,
  resolveListEmptyState,
  type PmDataTableColumn,
} from '@/components/data/pm-data-index'
import {
  PmActionHub,
  type PmActionHubItem,
  PmBadge,
  PmButton,
  PmEmptyState,
  PmEntityListCard,
  PmLifecycleMap,
  PmPage,
  PmPageHeader,
  PmPageHeroMetric,
  PmMoreActions,
  PmPageActions,
  PmWorkflowBadge,
  PmWorkflowLinksCard,
  PmFilterChips,
  buildDealWorkflowSteps,
  type PmMoreActionItem,
} from '@/components/ui/pm-index'
import { pmTypography } from '@/tokens'
import { cn } from '@/lib/utils'
import type { Deal } from '@/types/domain.ts'
import { useAuth } from '@/providers/auth-provider'
import { EntityAccessDenied } from '@/components/auth/entity-access-state'
import {
  buildViewerContext,
  canMutateDealDetail,
  canViewDealDetail,
  filterDealsForViewer,
} from '@/lib/entity-view-visibility.ts'
import { formatDealDisplayTitle, formatDealDisplayTitleWithOpportunities } from '@/lib/entity-display-titles.ts'
import { PRODUCT_LANGUAGE } from '@/lib/product-language'
import { PmTechnicalDetails } from '@/components/ui/pm-technical-details.tsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCollaborationExchangeMode } from '@/lib/collaboration-taxonomy-display.ts'
import { useProductLanguage } from '@/providers/product-language-provider'
import { resolveOpportunityTaxonomyLabels } from '@/lib/collaboration-taxonomy-display.ts'
import { ExecutiveEntityMetadata } from '@/components/shared/executive-entity-metadata'
import { useExecutiveListFilters } from '@/lib/executive-list-filters'

function buildCommercialAgreementRecommendedAction(
  model: NonNullable<ReturnType<typeof buildCommercialAgreementDetailReadModel>>,
  canMutate: boolean,
): PmActionHubItem | null {
  if (model.existingContract && model.contractLink) {
    return {
      id: 'open-contract',
      title: 'Review contract',
      context: 'Continue signing or execution in the contract workspace.',
      status: model.existingContract.status,
      statusEntity: 'contract',
      primary: { label: model.contractLink.label, href: model.contractLink.path },
      secondary: model.links.match
        ? { label: PRODUCT_LANGUAGE.OPEN_MATCH, href: model.links.match.path, variant: 'outline' }
        : undefined,
    }
  }

  if (canMutate && model.canCreateContract) {
    return {
      id: 'create-contract',
      title: 'Create contract',
      context: 'Turn agreed commercial agreement terms into a signable contract.',
      status: model.status,
      statusEntity: 'deal',
      primary: {
        label: 'Create contract',
        render: () => <CreateContractButton commercialAgreementId={model.commercialAgreement.id} />,
      },
      secondary: model.links.negotiation
        ? {
            label: PRODUCT_LANGUAGE.OPEN_NEGOTIATION,
            href: model.links.negotiation.path,
            variant: 'outline',
          }
        : undefined,
    }
  }

  if (model.links.negotiation) {
    return {
      id: 'open-negotiation',
      title: 'Review negotiation',
      context: 'Trace commercial terms back to the originating negotiation.',
      status: model.negotiationStatus ?? undefined,
      statusEntity: 'negotiation',
      primary: {
        label: PRODUCT_LANGUAGE.OPEN_NEGOTIATION,
        href: model.links.negotiation.path,
      },
      secondary: model.links.match
        ? { label: PRODUCT_LANGUAGE.OPEN_MATCH, href: model.links.match.path, variant: 'outline' }
        : undefined,
    }
  }

  return null
}

function buildCommercialAgreementNavMoreItems(
  model: NonNullable<ReturnType<typeof buildCommercialAgreementDetailReadModel>>,
): PmMoreActionItem[] {
  const items: PmMoreActionItem[] = []
  if (model.links.match) {
    items.push({ id: 'match', label: model.links.match.label, href: model.links.match.path })
  }
  if (model.links.negotiation) {
    items.push({ id: 'negotiation', label: model.links.negotiation.label, href: model.links.negotiation.path })
  }
  if (model.links.needOpportunity) {
    items.push({ id: 'need', label: model.links.needOpportunity.label, href: model.links.needOpportunity.path })
  }
  if (model.links.offerOpportunity) {
    items.push({ id: 'offer', label: model.links.offerOpportunity.label, href: model.links.offerOpportunity.path })
  }
  return items
}

function CommercialAgreementListCard({ commercialAgreement }: { commercialAgreement: Deal }) {
  const relatedOpportunity = commercialAgreement.needOpportunityId
    ? opportunitiesApi.get(commercialAgreement.needOpportunityId)
    : commercialAgreement.offerOpportunityId
      ? opportunitiesApi.get(commercialAgreement.offerOpportunityId)
      : undefined
  const taxonomy = relatedOpportunity
    ? resolveOpportunityTaxonomyLabels(relatedOpportunity)
    : null
  return (
    <PmEntityListCard
      title={formatDealDisplayTitleWithOpportunities(
        commercialAgreement,
        (id) => opportunitiesApi.get(id),
      )}
      href={`/commercial-agreements/${commercialAgreement.id}`}
      badge={<PmWorkflowBadge status={commercialAgreement.status} entity="deal" size="sm" />}
      meta={
        taxonomy
          ? `${taxonomy.mainModel} · ${taxonomy.exchangeMode} · Updated ${formatDate(commercialAgreement.updatedAt)}`
          : `Updated ${formatDate(commercialAgreement.updatedAt)}`
      }
      primary={{ label: PRODUCT_LANGUAGE.OPEN_COMMERCIAL_AGREEMENT, href: `/commercial-agreements/${commercialAgreement.id}` }}
    />
  )
}

export function CommercialAgreementsPage() {
  const navigate = useNavigate()
  const { user, canAccessAdmin, activeWorkspace, activeParty } = useAuth()
  const filters = useExecutiveListFilters('agreements', {
    statusLabel: (value) => value.charAt(0).toUpperCase() + value.slice(1),
    modeLabel: (value) => formatCollaborationExchangeMode(value),
  })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const { productLanguage } = useProductLanguage()
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
  const commercialAgreements = useMemo(
    () => filterDealsForViewer(commercialAgreementsApi.list(), viewer),
    [viewer],
  )
  const activeCommercialAgreements = countActiveDeals(commercialAgreements)

  const filtered = useMemo(() => {
    return commercialAgreements.filter((d) => {
      const q = filters.search.toLowerCase()
      const matchesSearch = !filters.search || d.title.toLowerCase().includes(q)
      const matchesStatus = filters.status === 'all' || d.status === filters.status
      const matchesExchange = filters.mode === 'all' || d.exchangeMode === filters.mode
      return matchesSearch && matchesStatus && matchesExchange
    })
  }, [commercialAgreements, filters.search, filters.status, filters.mode])

  const totalItems = filtered.length
  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize))
  const safePage = Math.min(page, pageCount)
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  const listEmpty = resolveListEmptyState({
    hasSourceData: commercialAgreements.length > 0,
    hasActiveFilters:
      filters.search.length > 0 || filters.status !== 'all' || filters.mode !== 'all',
    firstRun: {
      title: 'No commercial agreements yet',
      description: 'Commercial agreements appear when negotiations conclude successfully.',
    },
    filtered: {
      title: 'No commercial agreements match your search',
      description: 'Try a different search term.',
    },
  })

  const columns: PmDataTableColumn<Deal>[] = [
    {
      id: 'title',
      label: 'Title',
      cell: (d) => (
        <Link to={`/commercial-agreements/${d.id}`} className={cn(pmTypography.bodySm, 'font-medium hover:text-primary')}>
          {formatDealDisplayTitleWithOpportunities(d, (id) => opportunitiesApi.get(id))}
        </Link>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      cell: (d) => <PmWorkflowBadge status={d.status} entity="deal" />,
    },
    {
      id: 'business',
      label: 'Business context',
      cell: (d) => {
        const opportunity = d.needOpportunityId
          ? opportunitiesApi.get(d.needOpportunityId)
          : d.offerOpportunityId
            ? opportunitiesApi.get(d.offerOpportunityId)
            : undefined
        const taxonomy = opportunity ? resolveOpportunityTaxonomyLabels(opportunity) : null
        return (
          <ExecutiveEntityMetadata
            mainModel={taxonomy?.mainModel}
            subModel={taxonomy?.subModel}
            exchangeMode={taxonomy?.exchangeMode}
            topology={taxonomy?.matchingTopology}
            status={d.status}
            confidence={undefined}
          />
        )
      },
    },
    {
      id: 'updated',
      label: 'Updated',
      cell: (d) => formatDate(d.updatedAt),
    },
  ]

  return (
    <PmBrowsePage
      header={
        <PmPageHeader
          label="My Workspace"
      title={`My ${productLanguage.plural('commercialAgreement').toLowerCase()}`}
          description={
            commercialAgreements.length
              ? 'Track your active commercial agreements through signing and execution stages.'
              : 'Commercial agreements you are executing — review, sign, and track progress.'
          }
          tone="deal"
          metric={<PmPageHeroMetric value={activeCommercialAgreements} label="Active" />}
          badges={
            commercialAgreements.length ? (
              <>
                <PmBadge tone="muted">{commercialAgreements.length} total</PmBadge>
                <PmBadge tone="primary">{activeCommercialAgreements} active</PmBadge>
              </>
            ) : undefined
          }
        />
      }
      toolbar={
        commercialAgreements.length > 0 ? (
          <PmBrowseToolbar>
            <PmTableToolbar
              search={
                <PmTableSearch
                  placeholder={`Search ${productLanguage.plural('commercialAgreement').toLowerCase()}…`}
                  value={filters.search}
                  onValueChange={(v) => {
                    filters.setSearch(v)
                    setPage(1)
                  }}
                />
              }
              filters={
                <div className="grid w-56 gap-2">
                  <Select
                    value={filters.status}
                    onValueChange={(value) => {
                      filters.setStatus(value)
                      setPage(1)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="execution">Executing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={filters.mode}
                    onValueChange={(value) => {
                      filters.setMode(value)
                      setPage(1)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All exchange modes</SelectItem>
                      {['cash', 'barter', 'profit_sharing', 'equity', 'hybrid'].map((mode) => (
                        <SelectItem key={mode} value={mode}>
                          {formatCollaborationExchangeMode(mode)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              }
            >
              <PmFilterChips chips={filters.chips} onClearAll={() => filters.clearAll()} />
            </PmTableToolbar>
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
      {listEmpty.branch === 'first-run' ? (
        <PmEmptyState
          title={listEmpty.config.title ?? 'No commercial agreements yet'}
          description={listEmpty.config.description}
          action={
            <PmButton asChild>
              <Link to="/matches">Open matches</Link>
            </PmButton>
          }
        />
      ) : (
        <PmDataTable
          density="comfortable"
          columns={columns}
          data={paged}
          getRowId={(d) => d.id}
          caption={productLanguage.plural('commercialAgreement')}
          rowActions={(d) => (
            <PmTableRowActions
              onView={() => navigate(`/commercial-agreements/${d.id}`)}
              hiddenActions={['edit', 'delete', 'duplicate']}
            />
          )}
          empty={
            listEmpty.branch === 'filtered' ? (
              <PmTableEmpty
                variant="no-results"
                title={listEmpty.config.title}
                description={listEmpty.config.description}
                primaryAction={
                  <PmButton
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      filters.clearAll()
                      setPage(1)
                    }}
                  >
                    Clear search
                  </PmButton>
                }
              />
            ) : undefined
          }
          renderMobileCard={(d) => <CommercialAgreementListCard commercialAgreement={d} />}
        />
      )}
    </PmBrowsePage>
  )
}

export function CommercialAgreementDetailPage() {
  const version = useDataStoreVersion()
  const { id } = useParams()
  const { user, canAccessAdmin, activeWorkspace, activeParty } = useAuth()
  const { productLanguage } = useProductLanguage()

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

  const model =
    id
      ? buildCommercialAgreementDetailReadModel(id, {
          getCommercialAgreement: (commercialAgreementId) =>
            commercialAgreementsApi.get(commercialAgreementId),
          getNegotiation: (negotiationId) => negotiationsApi.get(negotiationId),
          getPostMatch: (postMatchId) => matchesApi.get(postMatchId),
          getOpportunity: (opportunityId) => opportunitiesApi.get(opportunityId),
          getContractsForCommercialAgreement: (commercialAgreementId) =>
            contractsApi.getByDealId(commercialAgreementId),
          getPersonName: (userId) => peopleApi.get(userId)?.profile?.name,
        })
      : null

  const agreementBundle = useMemo(
    () => (model ? buildAgreementExplanation(model) : null),
    [model],
  )

  void version

  if (!id || !model) {
    return (
      <PmPage
        header={
          <PmPageHeader
            title={productLanguage.label('commercialAgreement')}
            description={`Collaboration ${productLanguage.label('commercialAgreement').toLowerCase()} summary.`}
          />
        }
      >
        <PmEmptyState
          title={`${productLanguage.label('commercialAgreement')} not found`}
          description={`This ${productLanguage.label('commercialAgreement').toLowerCase()} may have been removed or the link is invalid.`}
        />
      </PmPage>
    )
  }

  if (!canViewDealDetail(model.commercialAgreement, viewer)) {
    return (
      <PmPage
        header={
          <PmPageHeader
            title="Access denied"
            description={`Collaboration ${productLanguage.label('commercialAgreement').toLowerCase()} summary.`}
          />
        }
      >
        <EntityAccessDenied
          entity="deal"
          description={`${productLanguage.label('commercialAgreement')} details are only visible to participants or authorized platform staff.`}
        />
      </PmPage>
    )
  }

  const canMutate = canMutateDealDetail(model.commercialAgreement, viewer)

  const collaborationStep = resolveCollaborationStepFromDeal(Boolean(model.existingContract))
  const timelineEvents: CollaborationTimelineEvent[] = [
    {
      id: 'created',
      label: `${productLanguage.label('commercialAgreement')} created`,
      timestamp: formatDate(model.commercialAgreement.createdAt),
      status: 'done',
    },
    {
      id: 'status',
      label: model.statusLabel,
      description: model.canonicalStatus,
      status: 'active',
    },
  ]

  if (model.existingContract) {
    timelineEvents.push({
      id: 'contract',
      label: 'Linked record created',
      description: model.existingContract.status,
      status: 'upcoming',
    })
  }

  const workflowSteps = buildDealWorkflowSteps({
    id: model.commercialAgreement.id,
    status: model.status,
    postMatchId: model.postMatchId,
    negotiationId: model.negotiationId,
    negotiationStatus: model.negotiationStatus,
    existingContract: model.existingContract,
    contractLink: model.contractLink,
  })

  const navMore = buildCommercialAgreementNavMoreItems(model)
  const recommendedAction = buildCommercialAgreementRecommendedAction(model, canMutate)
  const workflowLinks = [
    ...(model.links.match
      ? [{ id: 'match', label: PRODUCT_LANGUAGE.OPEN_MATCH, href: model.links.match.path }]
      : []),
    ...(model.links.negotiation
      ? [
          {
            id: 'negotiation',
            label: PRODUCT_LANGUAGE.OPEN_NEGOTIATION,
            href: model.links.negotiation.path,
          },
        ]
      : []),
    ...(model.contractLink
      ? [{ id: 'contract', label: PRODUCT_LANGUAGE.OPEN_CONTRACT, href: model.contractLink.path }]
      : []),
  ]

  return (
    <PmPage
      header={
        <PmPageHeader
          label={productLanguage.label('commercialAgreement')}
          title={formatDealDisplayTitle(model.commercialAgreement, {
            needTitle: model.needTitle,
            offerTitle: model.offerTitle,
          })}
          description={`Created ${formatDate(model.commercialAgreement.createdAt)} · Updated ${formatDate(model.commercialAgreement.updatedAt)}`}
          tone="deal"
          metric={
            <PmPageHeroMetric
              value={model.participants.length}
              label="Participants"
            />
          }
          badges={<PmWorkflowBadge status={model.status} entity="deal" />}
          actions={
            canMutate && model.existingContract && model.contractLink ? (
              <PmPageActions
                primary={{ label: model.contractLink.label, href: model.contractLink.path }}
                more={navMore.length > 0 ? navMore : undefined}
              />
            ) : canMutate && model.canCreateContract ? (
              <PmPageActions
                primary={{
                  label: 'Create contract',
                  render: () => (
                    <CreateContractButton commercialAgreementId={model.commercialAgreement.id} />
                  ),
                }}
                more={navMore.length > 0 ? navMore : undefined}
              />
            ) : navMore.length > 0 ? (
              <PmMoreActions items={navMore} label="Related records" />
            ) : undefined
          }
        />
      }
    >
      <PmDetailLayout
        main={
          <>
            <PmLifecycleMap steps={workflowSteps} />

            {recommendedAction ? (
              <PmActionHub
                title={PM_RECOMMENDED_NEXT_STEP.title}
                description={PM_RECOMMENDED_NEXT_STEP.description('deal')}
                items={[recommendedAction]}
              />
            ) : null}

            <PmWorkflowLinksCard links={workflowLinks} />

            <PmContentCard title="Linked records">
              <PmFormReadonly>
                <PmFormReadonlySection>
                  <PmFormReadonlyField label="Need" value={model.needTitle} />
                  <PmFormReadonlyField label="Offer" value={model.offerTitle} />
                  <PmFormReadonlyField label="Linked workflow status">
                    {model.negotiationStatus ? (
                      <PmWorkflowBadge status={model.negotiationStatus} entity="negotiation" />
                    ) : (
                      '—'
                    )}
                  </PmFormReadonlyField>
                </PmFormReadonlySection>
              </PmFormReadonly>
              <PmTechnicalDetails className="mt-4">
                <PmFormReadonly>
                  <PmFormReadonlySection>
                    <PmFormReadonlyField label="Match reference" value={model.postMatchId} />
                    <PmFormReadonlyField label="Linked workflow reference" value={model.negotiationId} />
                    <PmFormReadonlyField label="Need opportunity reference" value={model.needOpportunityId} />
                    <PmFormReadonlyField label="Offer opportunity reference" value={model.offerOpportunityId} />
                  </PmFormReadonlySection>
                </PmFormReadonly>
              </PmTechnicalDetails>
            </PmContentCard>

            <PmContentCard title="Participants">
              {model.participants.length ? (
                <ul className={cn('space-y-1', pmTypography.bodySm)}>
                  {model.participants.map((participant) => (
                    <li key={`${participant.userId}-${participant.role}`}>
                      {participant.displayName} · {participant.role}
                      {participant.participantStatus ? ` (${participant.participantStatus})` : ''}
                    </li>
                  ))}
                </ul>
              ) : (
                <PmEmptyState title="No participants recorded" size="compact" />
              )}
            </PmContentCard>

            <PmContentCard title="Commercial terms">
              {model.commercialTermsLines.length ? (
                <ul className={cn('space-y-1', pmTypography.bodySm)}>
                  {model.commercialTermsLines.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              ) : (
                <PmEmptyState title="No commercial terms recorded yet" size="compact" />
              )}
            </PmContentCard>
          </>
        }
        inspector={
          <PmInspectorLayout
            header={<PmSectionHeader title="Lifecycle" />}
          >
            {canMutate ? (
              <CommercialAgreementStageActions
                commercialAgreement={model.commercialAgreement}
                className="flex flex-col gap-2 [&>button]:w-full"
              />
            ) : null}
            {model.existingContract ? (
              <PmFormReadonly>
                <PmFormReadonlySection title="Linked record">
                  <PmFormReadonlyField label="Status">
                    <PmWorkflowBadge
                      status={model.existingContract.status}
                      entity="contract"
                    />
                  </PmFormReadonlyField>
                </PmFormReadonlySection>
              </PmFormReadonly>
            ) : null}
            <ExplanationPanel
              bundle={agreementBundle!}
              scoreLabel="Agreement progress"
              compact
              showTimeline={false}
            />
          </PmInspectorLayout>
        }
        timeline={
          <CollaborationTimeline
            activeStep={collaborationStep}
            events={timelineEvents}
            title={`${productLanguage.label('commercialAgreement')} history`}
          />
        }
      />
    </PmPage>
  )
}

export function CommercialAgreementRatePage() {
  const { id } = useParams()
  const { productLanguage } = useProductLanguage()
  return (
    <PmPage
      header={
        <PmPageHeader
          label="Workflow"
          title="Rate participants"
          description={`Post-agreement review for ${productLanguage.label('commercialAgreement').toLowerCase()} ${id}`}
          actions={
            <PmPageActions
              secondary={{
                label: `Back to ${productLanguage.label('commercialAgreement').toLowerCase()}`,
                href: `/commercial-agreements/${id}`,
                variant: 'outline',
              }}
            />
          }
        />
      }
    >
      <PmContentCard title="Rating criteria">
        <p className={cn(pmTypography.bodySm, 'text-muted-foreground')}>
          Communication · Quality · Timeliness · Collaboration
        </p>
        <PmButton className="mt-4">Submit review</PmButton>
      </PmContentCard>
    </PmPage>
  )
}
