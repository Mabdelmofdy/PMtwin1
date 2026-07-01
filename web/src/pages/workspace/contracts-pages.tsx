import { Link, useParams, useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { contractsApi } from '@/api/contracts.ts'
import { dealsApi } from '@/api/deals.ts'
import { negotiationsApi } from '@/api/negotiations.ts'
import { opportunitiesApi } from '@/api/opportunities.ts'
import { peopleApi } from '@/api/people.ts'
import { SignContractButton } from '@/components/contract/sign-contract-button.tsx'
import { CompleteContractButton } from '@/components/contract/complete-contract-button.tsx'
import { TerminateContractButton } from '@/components/contract/terminate-contract-button.tsx'
import { useDataStoreVersion } from '@/hooks/use-data-store'
import {
  buildContractDetailReadModel,
  contractDetailShowsMutationActions,
} from '@/lib/contract-detail-read-model.ts'
import { formatDate } from '@/lib/format'
import { useAuth } from '@/providers/auth-provider'
import { CollaborationTimeline } from '@/components/collaboration/collaboration-timeline'
import { resolveCollaborationStepFromContract } from '@/components/collaboration/collaboration-display'
import type { CollaborationTimelineEvent } from '@/components/collaboration/collaboration-timeline'
import {
  PmContentCard,
  PmDetailLayout,
  PmInspectorLayout,
  PmPageLayout,
  PmSectionHeader,
  countActiveContracts,
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
  PmCardActions,
  PmSurface,
  PmWorkflowBadge,
  PmWorkflowJourney,
  type PmMoreActionItem,
  type PmWorkflowJourneyStep,
} from '@/components/ui/pm-index'
import { pmTypography } from '@/components/shared/pm-design-tokens'
import { cn } from '@/lib/utils'
import type { Contract } from '@/types/domain.ts'
import {
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'

function buildContractNavMoreItems(model: NonNullable<ReturnType<typeof buildContractDetailReadModel>>): PmMoreActionItem[] {
  const items: PmMoreActionItem[] = []
  if (model.links.deal) {
    items.push({ id: 'deal', label: model.links.deal.label, href: model.links.deal.path })
  }
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

function ContractListCard({ contract }: { contract: Contract }) {
  return (
    <PmSurface variant="default" shadow="card" interactive className="flex h-full flex-col p-4">
      <div className="flex items-start justify-between gap-2">
        <Link
          to={`/contracts/${contract.id}`}
          className={cn(pmTypography.h3, 'truncate hover:text-primary')}
          title={contract.id}
        >
          Contract {contract.id}
        </Link>
        <PmWorkflowBadge status={contract.status} entity="contract" size="sm" />
      </div>
      <p className={cn('mt-2', pmTypography.caption, 'text-muted-foreground')}>
        Deal {contract.dealId} · Updated {formatDate(contract.updatedAt)}
      </p>
      <PmCardActions
        className="mt-4"
        primary={{ label: 'Open contract', href: `/contracts/${contract.id}` }}
      />
    </PmSurface>
  )
}

export function ContractsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const contracts = contractsApi.list()
  const activeContracts = countActiveContracts(contracts)

  const filtered = useMemo(() => {
    return contracts.filter((c) => {
      if (!search) return true
      const q = search.toLowerCase()
      return c.id.toLowerCase().includes(q) || c.dealId.toLowerCase().includes(q)
    })
  }, [contracts, search])

  const totalItems = filtered.length
  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize))
  const safePage = Math.min(page, pageCount)
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  const columns: PmDataTableColumn<Contract>[] = [
    {
      id: 'id',
      label: 'Contract',
      cell: (c) => (
        <Link to={`/contracts/${c.id}`} className={cn(pmTypography.mono, 'font-medium hover:text-primary')}>
          {c.id}
        </Link>
      ),
    },
    {
      id: 'deal',
      label: 'Deal',
      cell: (c) => c.dealId,
    },
    {
      id: 'status',
      label: 'Status',
      cell: (c) => <PmWorkflowBadge status={c.status} entity="contract" />,
    },
    {
      id: 'updated',
      label: 'Updated',
      cell: (c) => formatDate(c.updatedAt),
    },
  ]

  if (!contracts.length) {
    return (
      <PmPageLayout
        header={
          <PmPageHeader
            label="Workflow"
            title="Contracts"
            description="Agreements linked to deals and opportunities."
            metric={<PmPageHeroMetric value={0} label="Active" />}
          />
        }
      >
        <PmEmptyState
          title="No contracts yet"
          description="Contracts are created from deals in draft, review, or signing."
          action={
            <PmButton asChild>
              <Link to="/deals">View deals</Link>
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
          title="Contracts"
          description="Agreements linked to deals and opportunities."
          metric={<PmPageHeroMetric value={activeContracts} label="Active" />}
          badges={
            <>
              <PmBadge tone="muted">{contracts.length} total</PmBadge>
              <PmBadge tone="primary">{activeContracts} active</PmBadge>
            </>
          }
        />
      }
    >
      <PmDataTable
        density="comfortable"
        columns={columns}
        data={paged}
        getRowId={(c) => c.id}
        caption="Contracts"
        toolbar={
          <PmTableToolbar
            className="pm-toolbar-surface rounded-xl px-4 py-3"
            search={
              <PmTableSearch
                placeholder="Search contract or deal ID…"
                value={search}
                onValueChange={(v) => {
                  setSearch(v)
                  setPage(1)
                }}
              />
            }
          />
        }
        rowActions={(c) => (
          <PmTableRowActions
            onView={() => navigate(`/contracts/${c.id}`)}
            hiddenActions={['edit', 'delete', 'duplicate']}
          />
        )}
        empty={
          <PmTableEmpty
            variant="no-results"
            title="No contracts match your search"
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
        renderMobileCard={(c) => <ContractListCard contract={c} />}
      />
    </PmPageLayout>
  )
}

export function ContractDetailPage() {
  const version = useDataStoreVersion()
  const { user } = useAuth()
  const { id } = useParams()

  const model =
    id
      ? buildContractDetailReadModel(
          id,
          {
            getContract: (contractId) => contractsApi.get(contractId),
            getDeal: (dealId) => dealsApi.get(dealId),
            getNegotiation: (negotiationId) => negotiationsApi.get(negotiationId),
            getOpportunity: (opportunityId) => opportunitiesApi.get(opportunityId),
            getPersonName: (userId) => peopleApi.get(userId)?.profile?.name,
          },
          { currentUserId: user?.id },
        )
      : null

  void version

  if (!id || !model) {
    return (
      <PmPageLayout
        header={<PmPageHeader title="Contract" description="Contract summary." />}
      >
        <PmEmptyState
          title="Contract not found"
          description="This contract may have been removed or the link is invalid."
        />
      </PmPageLayout>
    )
  }

  const collaborationStep = resolveCollaborationStepFromContract()
  const timelineEvents: CollaborationTimelineEvent[] = [
    {
      id: 'created',
      label: 'Contract created',
      timestamp: formatDate(model.contract.createdAt),
      status: 'done',
    },
    {
      id: 'status',
      label: model.status,
      status: 'active',
    },
  ]

  const contractWorkflowSteps: readonly PmWorkflowJourneyStep[] = [
    {
      id: 'match',
      label: 'Match',
      href: model.postMatchId ? `/matches/${model.postMatchId}` : undefined,
      state: 'complete',
    },
    {
      id: 'negotiation',
      label: 'Negotiation',
      href: model.negotiationId ? `/negotiations/${model.negotiationId}` : undefined,
      state: 'complete',
    },
    {
      id: 'deal',
      label: 'Deal',
      href: model.dealId ? `/deals/${model.dealId}` : undefined,
      state: 'complete',
    },
    {
      id: 'contract',
      label: 'Contract',
      status: model.status,
      statusEntity: 'contract',
      href: `/contracts/${model.contractId}`,
      state: 'current',
    },
    {
      id: 'execution',
      label: 'Complete',
      state: 'upcoming',
    },
  ]

  const contractNavMore = buildContractNavMoreItems(model)
  const showMutations = contractDetailShowsMutationActions({
    canSign: model.canSign,
    canComplete: model.canComplete,
    canTerminate: model.canTerminate,
  })

  return (
    <PmPageLayout
      header={
        <PmPageHeader
          label="Contract"
          title={`Contract ${model.contractId}`}
          description={`Created ${formatDate(model.contract.createdAt)} · Updated ${formatDate(model.contract.updatedAt)}`}
          metric={
            <PmPageHeroMetric
              value={model.parties.length}
              label="Parties"
            />
          }
          badges={<PmWorkflowBadge status={model.status} entity="contract" />}
          actions={
            model.canSign && user?.id ? (
              <SignContractButton
                contractId={model.contractId}
                userId={user.id}
              />
            ) : contractNavMore.length > 0 ? (
              <PmMoreActions items={contractNavMore} label="Related records" />
            ) : undefined
          }
        />
      }
    >
      <PmDetailLayout
        main={
          <>
            <PmWorkflowJourney steps={contractWorkflowSteps} compact label={false} />

            <PmContentCard title="Summary">
              <PmFormReadonly>
                <PmFormReadonlySection>
                  <PmFormReadonlyField label="Contract ID" value={model.contractId} />
                  <PmFormReadonlyField label="Deal ID" value={model.dealId} />
                  <PmFormReadonlyField label="Deal" value={model.dealTitle} />
                  <PmFormReadonlyField label="PostMatch ID" value={model.postMatchId} />
                  <PmFormReadonlyField label="Negotiation ID" value={model.negotiationId} />
                  <PmFormReadonlyField label="Need" value={model.needTitle} />
                  <PmFormReadonlyField label="Offer" value={model.offerTitle} />
                </PmFormReadonlySection>
              </PmFormReadonly>
            </PmContentCard>

            <PmContentCard title="Parties & signatures">
              {model.parties.length ? (
                <ul className={cn('space-y-2', pmTypography.bodySm)}>
                  {model.parties.map((party) => (
                    <li key={`${party.userId}-${party.role}`}>
                      {party.displayName} · {party.role} ·{' '}
                      {party.signatureState === 'signed'
                        ? `Signed${party.signedAt ? ` ${formatDate(party.signedAt)}` : ''}`
                        : 'Pending signature'}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={cn(pmTypography.bodySm, 'text-muted-foreground')}>No parties recorded.</p>
              )}
            </PmContentCard>

            <PmContentCard title="Payment schedule & milestones">
              {model.milestones.length ? (
                <ul className={cn('space-y-2', pmTypography.bodySm)}>
                  {model.milestones.map((milestone) => (
                    <li key={milestone.id ?? milestone.title}>
                      {milestone.title}
                      {milestone.dueDate ? ` · due ${formatDate(milestone.dueDate)}` : ''}
                      {milestone.status ? (
                        <> · <PmWorkflowBadge status={milestone.status} /></>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={cn(pmTypography.bodySm, 'text-muted-foreground')}>No milestones recorded.</p>
              )}
            </PmContentCard>

            <PmContentCard title="Attachments">
              <PmEmptyState
                title="No attachments"
                description="Attachment management is not wired in this MVP build."
                size="compact"
              />
            </PmContentCard>
          </>
        }
        inspector={
          <PmInspectorLayout
            header={<PmSectionHeader title="Scope" />}
            footer={
              showMutations ? (
                <div className="flex w-full flex-col gap-2">
                  {model.canSign && user?.id ? (
                    <SignContractButton
                      contractId={model.contractId}
                      userId={user.id}
                      className="w-full"
                    />
                  ) : null}
                  {(model.canComplete || model.canTerminate) ? (
                    <PmMoreActions
                      label="More contract actions"
                      className="w-full"
                    >
                        <>
                          {model.canComplete ? (
                            <DropdownMenuItem asChild>
                              <CompleteContractButton
                                contractId={model.contractId}
                                className="w-full justify-start"
                                variant="outline"
                              />
                            </DropdownMenuItem>
                          ) : null}
                          {model.canTerminate ? (
                            <DropdownMenuItem asChild>
                              <TerminateContractButton
                                contractId={model.contractId}
                                className="w-full justify-start"
                              />
                            </DropdownMenuItem>
                          ) : null}
                        </>
                    </PmMoreActions>
                  ) : null}
                </div>
              ) : undefined
            }
          >
            <p className={cn(pmTypography.bodySm, 'text-muted-foreground')}>
              {model.scope ?? 'No scope recorded.'}
            </p>
          </PmInspectorLayout>
        }
        timeline={
          <CollaborationTimeline
            activeStep={collaborationStep}
            events={timelineEvents}
            title="Contract timeline"
          />
        }
      />
    </PmPageLayout>
  )
}
