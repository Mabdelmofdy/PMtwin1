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
  PmPageLayout,
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
  PmPageHeader,
  PmPageHeroMetric,
  PmMoreActions,
  PmPageActions,
  PmCardActions,
  PmSurface,
  PmWorkflowBadge,
  PmWorkflowJourney,
  type PmMoreActionItem,
  type PmWorkflowJourneyStep,
} from '@/components/ui/pm-index'
import { pmTypography } from '@/components/shared/pm-design-tokens'
import { cn } from '@/lib/utils'
import type { Deal } from '@/types/domain.ts'

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
    <PmSurface variant="default" shadow="card" interactive className="flex h-full flex-col p-4">
      <div className="flex items-start justify-between gap-2">
        <Link
          to={`/deals/${deal.id}`}
          className={cn(pmTypography.h3, 'line-clamp-2 hover:text-primary')}
        >
          {deal.title}
        </Link>
        <PmWorkflowBadge status={deal.status} entity="deal" size="sm" />
      </div>
      <p className={cn('mt-2', pmTypography.caption, 'text-muted-foreground')}>
        Updated {formatDate(deal.updatedAt)}
      </p>
      <PmCardActions
        className="mt-4"
        primary={{ label: 'Open deal', href: `/deals/${deal.id}` }}
      />
    </PmSurface>
  )
}

export function DealsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const deals = dealsApi.list()
  const activeDeals = countActiveDeals(deals)

  const filtered = useMemo(() => {
    return deals.filter((d) => {
      if (!search) return true
      const q = search.toLowerCase()
      return d.title.toLowerCase().includes(q) || d.id.toLowerCase().includes(q)
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
          {d.title}
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
      <PmPageLayout
        header={
          <PmPageHeader
            label="Workflow"
            title="Deals"
            description="Collaboration deals from accepted PostMatches and negotiations."
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
      </PmPageLayout>
    )
  }

  return (
    <PmPageLayout
      header={
        <PmPageHeader
          label="Workflow"
          title="Deals"
          description="Track collaboration deals through lifecycle stages."
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
          <PmTableToolbar
            className="pm-toolbar-surface rounded-xl px-4 py-3"
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
    </PmPageLayout>
  )
}

export function DealDetailPage() {
  const version = useDataStoreVersion()
  const { id } = useParams()

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
      <PmPageLayout
        header={<PmPageHeader title="Deal" description="Collaboration deal summary." />}
      >
        <PmEmptyState
          title="Deal not found"
          description="This deal may have been removed or the link is invalid."
        />
      </PmPageLayout>
    )
  }

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

  const dealWorkflowSteps: readonly PmWorkflowJourneyStep[] = [
    {
      id: 'match',
      label: 'Match',
      href: model.postMatchId ? `/matches/${model.postMatchId}` : undefined,
      state: 'complete',
    },
    {
      id: 'negotiation',
      label: 'Negotiation',
      status: model.negotiationStatus ?? undefined,
      statusEntity: 'negotiation',
      href: model.negotiationId ? `/negotiations/${model.negotiationId}` : undefined,
      state: 'complete',
    },
    {
      id: 'deal',
      label: 'Deal',
      status: model.status,
      statusEntity: 'deal',
      href: `/deals/${model.deal.id}`,
      state: model.existingContract ? 'complete' : 'current',
    },
    {
      id: 'contract',
      label: 'Contract',
      status: model.existingContract?.status,
      statusEntity: 'contract',
      href: model.contractLink?.path,
      state: model.existingContract ? 'current' : 'upcoming',
    },
    {
      id: 'execution',
      label: 'Complete',
      state: 'upcoming',
    },
  ]

  const dealNavMore = buildDealNavMoreItems(model)

  return (
    <PmPageLayout
      header={
        <PmPageHeader
          label="Deal"
          title={model.deal.title}
          description={`Created ${formatDate(model.deal.createdAt)} · Updated ${formatDate(model.deal.updatedAt)}`}
          metric={
            <PmPageHeroMetric
              value={model.participants.length}
              label="Participants"
            />
          }
          badges={<PmWorkflowBadge status={model.status} entity="deal" />}
          actions={
            model.existingContract && model.contractLink ? (
              <PmButton asChild>
                <Link to={model.contractLink.path}>{model.contractLink.label}</Link>
              </PmButton>
            ) : model.canCreateContract ? (
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
            <PmWorkflowJourney steps={dealWorkflowSteps} compact label={false} />

            <PmContentCard title="Linked records">
              <PmFormReadonly>
                <PmFormReadonlySection>
                  <PmFormReadonlyField label="PostMatch ID" value={model.postMatchId} />
                  <PmFormReadonlyField label="Negotiation ID" value={model.negotiationId} />
                  <PmFormReadonlyField label="Need opportunity ID" value={model.needOpportunityId} />
                  <PmFormReadonlyField label="Offer opportunity ID" value={model.offerOpportunityId} />
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
                <p className={cn(pmTypography.bodySm, 'text-muted-foreground')}>No participants recorded.</p>
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
                <p className={cn(pmTypography.bodySm, 'text-muted-foreground')}>No commercial terms recorded yet.</p>
              )}
            </PmContentCard>
          </>
        }
        inspector={
          <PmInspectorLayout
            header={<PmSectionHeader title="Lifecycle" />}
            footer={
              model.existingContract && model.contractLink ? (
                <PmButton variant="outline" className="w-full" asChild>
                  <Link to={model.contractLink.path}>{model.contractLink.label}</Link>
                </PmButton>
              ) : model.canCreateContract ? (
                <CreateContractButton dealId={model.deal.id} className="w-full" />
              ) : null
            }
          >
            <DealStageActions
              deal={model.deal}
              className="flex flex-col gap-2 [&>button]:w-full"
            />
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
    </PmPageLayout>
  )
}

export function DealRatePage() {
  const { id } = useParams()
  return (
    <PmPageLayout
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
    </PmPageLayout>
  )
}
