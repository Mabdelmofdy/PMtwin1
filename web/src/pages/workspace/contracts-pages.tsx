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
  CONTRACT_DETAIL_MUTATION_ACTIONS,
  contractDetailLinkFallbackLabel,
  contractDetailShowsMutationActions,
  type ContractDetailLink,
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
  PmButton,
  PmEmptyState,
  PmPageHeader,
  PmSurface,
  PmWorkflowBadge,
} from '@/components/ui/pm-index'
import { pmTypography } from '@/components/shared/pm-design-tokens'
import { cn } from '@/lib/utils'
import type { Contract } from '@/types/domain.ts'

function ContractDetailNavLink({
  link,
  fallbackLabel,
}: {
  link: ContractDetailLink | null
  fallbackLabel: string
}) {
  if (!link) {
    return (
      <span className="text-sm text-muted-foreground">
        {contractDetailLinkFallbackLabel(fallbackLabel)}
      </span>
    )
  }
  return (
    <PmButton variant="outline" size="sm" asChild>
      <Link to={link.path}>{link.label}</Link>
    </PmButton>
  )
}

function ContractListCard({ contract }: { contract: Contract }) {
  return (
    <PmSurface variant="default" shadow="card" interactive className="flex h-full flex-col p-4">
      <div className="flex items-start justify-between gap-2">
        <Link
          to={`/contracts/${contract.id}`}
          className={cn(pmTypography.h3, 'hover:text-primary')}
        >
          Contract {contract.id}
        </Link>
        <PmWorkflowBadge status={contract.status} entity="contract" />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Deal {contract.dealId} · Updated {formatDate(contract.updatedAt)}
      </p>
      <div className="mt-4 border-t border-border/40 pt-3">
        <PmButton size="sm" asChild>
          <Link to={`/contracts/${contract.id}`}>View contract</Link>
        </PmButton>
      </div>
    </PmSurface>
  )
}

export function ContractsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)
  const contracts = contractsApi.list()

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
        <Link to={`/contracts/${c.id}`} className="font-medium hover:text-primary">
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
            title="Contracts"
            description="Agreements linked to deals and opportunities."
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
          title="Contracts"
          description="Agreements linked to deals and opportunities."
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

  return (
    <PmPageLayout
      header={
        <PmPageHeader
          label="Contract"
          title={`Contract ${model.contractId}`}
          description={`Created ${formatDate(model.contract.createdAt)} · Updated ${formatDate(model.contract.updatedAt)}`}
          actions={<PmWorkflowBadge status={model.status} entity="contract" />}
        />
      }
    >
      <div className="flex flex-wrap gap-2">
        <ContractDetailNavLink link={model.links.deal} fallbackLabel="Back to Deal" />
        <ContractDetailNavLink link={model.links.match} fallbackLabel="Back to Match" />
        <ContractDetailNavLink link={model.links.negotiation} fallbackLabel="Back to Negotiation" />
        <ContractDetailNavLink link={model.links.needOpportunity} fallbackLabel="Back to Need Opportunity" />
        <ContractDetailNavLink link={model.links.offerOpportunity} fallbackLabel="Back to Offer Opportunity" />
      </div>

      <PmDetailLayout
        main={
          <>
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
                <ul className="space-y-2 text-sm">
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
                <p className="text-sm text-muted-foreground">No parties recorded.</p>
              )}
            </PmContentCard>

            <PmContentCard title="Payment schedule & milestones">
              {model.milestones.length ? (
                <ul className="space-y-2 text-sm">
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
                <p className="text-sm text-muted-foreground">No milestones recorded.</p>
              )}
            </PmContentCard>

            <PmContentCard title="Attachments">
              <p className="text-sm text-muted-foreground">
                Attachment management is not wired in this MVP build.
              </p>
            </PmContentCard>
          </>
        }
        inspector={
          <PmInspectorLayout
            header={<PmSectionHeader title="Scope" />}
            footer={
              contractDetailShowsMutationActions({
                canSign: model.canSign,
                canComplete: model.canComplete,
                canTerminate: model.canTerminate,
              }) ? (
                <div className="flex flex-col gap-2">
                  {model.canSign && user?.id ? (
                    <SignContractButton
                      contractId={model.contractId}
                      userId={user.id}
                      className="w-full"
                    />
                  ) : null}
                  {model.canComplete ? (
                    <CompleteContractButton
                      contractId={model.contractId}
                      className="w-full"
                    />
                  ) : null}
                  {model.canTerminate ? (
                    <TerminateContractButton
                      contractId={model.contractId}
                      className="w-full"
                    />
                  ) : null}
                  {CONTRACT_DETAIL_MUTATION_ACTIONS.activate ? (
                    <PmButton className="w-full">Activate contract</PmButton>
                  ) : null}
                </div>
              ) : undefined
            }
          >
            <p className="text-sm text-muted-foreground">
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
