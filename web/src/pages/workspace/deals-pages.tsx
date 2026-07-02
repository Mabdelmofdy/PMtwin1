import { Link, useParams, useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { contractsApi } from '@/api/contracts.ts'
import { dealsApi } from '@/api/deals.ts'
import { matchesApi } from '@/api/matches.ts'
import { negotiationsApi } from '@/api/negotiations.ts'
import { opportunitiesApi } from '@/api/opportunities.ts'
import { peopleApi } from '@/api/people.ts'
import { CreateContractButton } from '@/components/deal/create-contract-button'
import { DealStageActions } from '@/components/deal/deal-stage-actions.tsx'
import { useDataStoreVersion } from '@/hooks/use-data-store'
import {
  buildDealDetailReadModel,
} from '@/lib/deal-detail-read-model.ts'
import { formatDate } from '@/lib/format'
import { CollaborationTimeline } from '@/components/collaboration/collaboration-timeline'
import { resolveCollaborationStepFromDeal } from '@/components/collaboration/collaboration-display'
import type { CollaborationTimelineEvent } from '@/components/collaboration/collaboration-timeline'
import {
  PmContentCard,
  PmDetailLayout,
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
  type PmDataTableColumn,
} from '@/components/data/pm-data-index'
import {
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
  buildDealWorkflowSteps,
  type PmMoreActionItem,
} from '@/components/ui/pm-index'
import { PmToolbarSurface } from '@/components/ui/pm-toolbar-surface'
import { pmTypography } from '@/components/shared/pm-design-tokens'
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
import { formatDealDisplayTitle } from '@/lib/entity-display-titles.ts'
import { PmTechnicalDetails } from '@/components/ui/pm-technical-details.tsx'

function buildDealNavMoreItems(model: NonNullable<ReturnType<typeof buildDealDetailReadModel>>): PmMoreActionItem[] {
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

function DealListCard({ deal }: { deal: Deal }) {
  return (
    <PmEntityListCard
      title={formatDealDisplayTitle(deal)}
      href={`/deals/${deal.id}`}
      badge={<PmWorkflowBadge status={deal.status} entity="deal" size="sm" />}
      meta={`Updated ${formatDate(deal.updatedAt)}`}
      primary={{ label: 'Open deal', href: `/deals/${deal.id}` }}
    />
  )
}

export function DealsPage() {
  const navigate = useNavigate()
  const { user, canAccessAdmin } = useAuth()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
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
  const deals = useMemo(
    () => filterDealsForViewer(dealsApi.list(), viewer),
    [viewer],
  )
  const activeDeals = countActiveDeals(deals)

  const filtered = useMemo(() => {
    return deals.filter((d) => {
      if (!search) return true
      const q = search.toLowerCase()
      return d.title.toLowerCase().includes(q)
    })
  }, [deals, search])

  const totalItems = filtered.length
  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize))
  const safePage = Math.min(page, pageCount)
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  const columns: PmDataTableColumn<Deal>[] = [
    {
      id: 'title',
      label: 'Title',
      cell: (d) => (
        <Link to={`/deals/${d.id}`} className={cn(pmTypography.bodySm, 'font-medium hover:text-primary')}>
          {formatDealDisplayTitle(d)}
        </Link>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      cell: (d) => <PmWorkflowBadge status={d.status} entity="deal" />,
    },
    {
      id: 'updated',
      label: 'Updated',
      cell: (d) => formatDate(d.updatedAt),
    },
  ]

  if (!deals.length) {
    return (
      <PmPage
        header={
          <PmPageHeader
            label="My Workspace"
            title="My deals"
            description="Deals you are executing — review, sign, and track progress."
            tone="deal"
            metric={<PmPageHeroMetric value={0} label="Active" />}
          />
        }
      >
        <PmEmptyState
          title="No deals yet"
          description="Deals appear when negotiations conclude successfully."
          action={
            <PmButton asChild>
              <Link to="/matches">View matches</Link>
            </PmButton>
          }
        />
      </PmPage>
    )
  }

  return (
    <PmPage
      header={
        <PmPageHeader
          label="My Workspace"
          title="My deals"
          description="Track your active deals through signing and execution stages."
          tone="deal"
          metric={<PmPageHeroMetric value={activeDeals} label="Active" />}
          badges={
            <>
              <PmBadge tone="muted">{deals.length} total</PmBadge>
              <PmBadge tone="primary">{activeDeals} active</PmBadge>
            </>
          }
        />
      }
    >
      <PmDataTable
        density="comfortable"
        columns={columns}
        data={paged}
        getRowId={(d) => d.id}
        caption="Deals"
        toolbar={
          <PmToolbarSurface>
            <PmTableToolbar
              search={
                <PmTableSearch
                  placeholder="Search deals…"
                  value={search}
                  onValueChange={(v) => {
                    setSearch(v)
                    setPage(1)
                  }}
                />
              }
            />
          </PmToolbarSurface>
        }
        rowActions={(d) => (
          <PmTableRowActions
            onView={() => navigate(`/deals/${d.id}`)}
            hiddenActions={['edit', 'delete', 'duplicate']}
          />
        )}
        empty={
          <PmTableEmpty
            variant="no-results"
            title="No deals match your search"
            description="Try a different search term."
          />
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
          ) : undefined
        }
        renderMobileCard={(d) => <DealListCard deal={d} />}
      />
    </PmPage>
  )
}

export function DealDetailPage() {
  const version = useDataStoreVersion()
  const { id } = useParams()
  const { user, canAccessAdmin } = useAuth()

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

  const model =
    id
      ? buildDealDetailReadModel(id, {
          getDeal: (dealId) => dealsApi.get(dealId),
          getNegotiation: (negotiationId) => negotiationsApi.get(negotiationId),
          getPostMatch: (postMatchId) => matchesApi.get(postMatchId),
          getOpportunity: (opportunityId) => opportunitiesApi.get(opportunityId),
          getContractsForDeal: (dealId) => contractsApi.getByDealId(dealId),
          getPersonName: (userId) => peopleApi.get(userId)?.profile?.name,
        })
      : null

  void version

  if (!id || !model) {
    return (
      <PmPage
        header={<PmPageHeader title="Deal" description="Collaboration deal summary." />}
      >
        <PmEmptyState
          title="Deal not found"
          description="This deal may have been removed or the link is invalid."
        />
      </PmPage>
    )
  }

  if (!canViewDealDetail(model.deal, viewer)) {
    return (
      <PmPage header={<PmPageHeader title="Access denied" description="Collaboration deal summary." />}>
        <EntityAccessDenied
          description="Deal details are only visible to participants or authorized platform staff."
          backHref="/deals"
          backLabel="Back to deals"
        />
      </PmPage>
    )
  }

  const canMutate = canMutateDealDetail(model.deal, viewer)

  const collaborationStep = resolveCollaborationStepFromDeal(Boolean(model.existingContract))
  const timelineEvents: CollaborationTimelineEvent[] = [
    {
      id: 'created',
      label: 'Deal created',
      timestamp: formatDate(model.deal.createdAt),
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
      label: 'Contract linked',
      description: model.existingContract.status,
      status: 'upcoming',
    })
  }

  const dealWorkflowSteps = buildDealWorkflowSteps({
    id: model.deal.id,
    status: model.status,
    postMatchId: model.postMatchId,
    negotiationId: model.negotiationId,
    negotiationStatus: model.negotiationStatus,
    existingContract: model.existingContract,
    contractLink: model.contractLink,
  })

  const dealNavMore = buildDealNavMoreItems(model)

  return (
    <PmPage
      header={
        <PmPageHeader
          label="Deal"
          title={formatDealDisplayTitle(model.deal)}
          description={`Created ${formatDate(model.deal.createdAt)} · Updated ${formatDate(model.deal.updatedAt)}`}
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
              <PmButton asChild>
                <Link to={model.contractLink.path}>{model.contractLink.label}</Link>
              </PmButton>
            ) : canMutate && model.canCreateContract ? (
              <CreateContractButton dealId={model.deal.id} />
            ) : dealNavMore.length > 0 ? (
              <PmMoreActions items={dealNavMore} label="Related records" />
            ) : undefined
          }
        />
      }
    >
      <PmDetailLayout
        main={
          <>
            <PmLifecycleMap steps={dealWorkflowSteps} />

            <PmContentCard title="Linked records">
              <PmFormReadonly>
                <PmFormReadonlySection>
                  <PmFormReadonlyField label="Need" value={model.needTitle} />
                  <PmFormReadonlyField label="Offer" value={model.offerTitle} />
                  <PmFormReadonlyField label="Negotiation status">
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
                    <PmFormReadonlyField label="Negotiation reference" value={model.negotiationId} />
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
            footer={
              canMutate && model.existingContract && model.contractLink ? (
                <PmButton variant="outline" className="w-full" asChild>
                  <Link to={model.contractLink.path}>{model.contractLink.label}</Link>
                </PmButton>
              ) : canMutate && model.canCreateContract ? (
                <CreateContractButton dealId={model.deal.id} className="w-full" />
              ) : null
            }
          >
            {canMutate ? (
              <DealStageActions
                deal={model.deal}
                className="flex flex-col gap-2 [&>button]:w-full"
              />
            ) : null}
            {model.existingContract ? (
              <PmFormReadonly>
                <PmFormReadonlySection title="Contract">
                  <PmFormReadonlyField label="Status">
                    <PmWorkflowBadge
                      status={model.existingContract.status}
                      entity="contract"
                    />
                  </PmFormReadonlyField>
                </PmFormReadonlySection>
              </PmFormReadonly>
            ) : null}
          </PmInspectorLayout>
        }
        timeline={
          <CollaborationTimeline
            activeStep={collaborationStep}
            events={timelineEvents}
            title="Deal history"
          />
        }
      />
    </PmPage>
  )
}

export function DealRatePage() {
  const { id } = useParams()
  return (
    <PmPage
      header={
        <PmPageHeader
          label="Workflow"
          title="Rate participants"
          description={`Post-deal review for deal ${id}`}
          actions={
            <PmPageActions
              secondary={{ label: 'Back to deal', href: `/deals/${id}`, variant: 'outline' }}
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
