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
  PmPageActions,
  PmPageHeader,
  PmPageHeroMetric,
  PmMoreActions,
  PmWorkflowBadge,
  buildContractWorkflowSteps,
  type PmMoreActionItem,
} from '@/components/ui/pm-index'
import { PmToolbarSurface } from '@/components/ui/pm-toolbar-surface'
import { pmTypography } from '@/components/shared/pm-design-tokens'
import { cn } from '@/lib/utils'
import type { Contract } from '@/types/domain.ts'
import {
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import {
  buildViewerContext,
  canMutateContractDetail,
  canViewContractDetail,
  filterContractsForViewer,
} from '@/lib/entity-view-visibility.ts'
import { EntityAccessDenied } from '@/components/auth/entity-access-state'
import { formatContractDisplayTitle } from '@/lib/entity-display-titles.ts'
import { PRODUCT_LANGUAGE } from '@/lib/product-language'
import { PmTechnicalDetails } from '@/components/ui/pm-technical-details.tsx'

function buildContractRecommendedAction(
  model: NonNullable<ReturnType<typeof buildContractDetailReadModel>>,
  canMutate: boolean,
  userId?: string,
): PmActionHubItem | null {
  if (canMutate && model.canSign && userId) {
    return {
      id: 'sign-contract',
      title: 'Sign contract',
      context: 'Your signature is required to activate this agreement.',
      status: model.status,
      statusEntity: 'contract',
      primary: {
        label: 'Sign contract',
        render: () => (
          <SignContractButton contractId={model.contractId} userId={userId} />
        ),
      },
      secondary: model.links.deal
        ? { label: PRODUCT_LANGUAGE.OPEN_DEAL, href: model.links.deal.path, variant: 'outline' }
        : undefined,
    }
  }

  if (model.links.deal) {
    return {
      id: 'open-deal',
      title: 'Review source deal',
      context: 'Commercial terms and participants live in the deal workspace.',
      status: model.status,
      statusEntity: 'contract',
      primary: { label: PRODUCT_LANGUAGE.OPEN_DEAL, href: model.links.deal.path },
      secondary: model.links.negotiation
        ? {
            label: PRODUCT_LANGUAGE.OPEN_NEGOTIATION,
            href: model.links.negotiation.path,
            variant: 'outline',
          }
        : undefined,
    }
  }

  return null
}

function resolveContractListTitle(contract: Contract): string {
  const deal = contract.dealId ? dealsApi.get(contract.dealId) : undefined
  return formatContractDisplayTitle({
    dealTitle: deal?.title,
    needTitle: deal?.needOpportunityId
      ? opportunitiesApi.get(deal.needOpportunityId)?.title
      : null,
    offerTitle: deal?.offerOpportunityId
      ? opportunitiesApi.get(deal.offerOpportunityId)?.title
      : null,
  })
}

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
  const title = resolveContractListTitle(contract)
  const deal = contract.dealId ? dealsApi.get(contract.dealId) : undefined
  return (
    <PmEntityListCard
      title={title}
      href={`/contracts/${contract.id}`}
      badge={<PmWorkflowBadge status={contract.status} entity="contract" size="sm" />}
      meta={`${deal?.title ?? 'Collaboration deal'} · Updated ${formatDate(contract.updatedAt)}`}
      primary={{ label: 'Open contract', href: `/contracts/${contract.id}` }}
    />
  )
}

export function ContractsPage() {
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
  const contracts = useMemo(
    () => filterContractsForViewer(contractsApi.list(), viewer),
    [viewer],
  )
  const activeContracts = countActiveContracts(contracts)

  const filtered = useMemo(() => {
    return contracts.filter((c) => {
      if (!search) return true
      const q = search.toLowerCase()
      const title = resolveContractListTitle(c).toLowerCase()
      const dealTitle = c.dealId ? dealsApi.get(c.dealId)?.title?.toLowerCase() ?? '' : ''
      return title.includes(q) || dealTitle.includes(q)
    })
  }, [contracts, search])

  const totalItems = filtered.length
  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize))
  const safePage = Math.min(page, pageCount)
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  const listEmpty = resolveListEmptyState({
    hasSourceData: contracts.length > 0,
    hasActiveFilters: search.length > 0,
    firstRun: {
      title: 'No contracts yet',
      description: 'Contracts are created from deals in draft, review, or signing.',
    },
    filtered: {
      title: 'No contracts match your search',
      description: 'Try a different search term.',
    },
  })

  const columns: PmDataTableColumn<Contract>[] = [
    {
      id: 'title',
      label: 'Contract',
      cell: (c) => (
        <Link to={`/contracts/${c.id}`} className={cn(pmTypography.bodySm, 'font-medium hover:text-primary')}>
          {resolveContractListTitle(c)}
        </Link>
      ),
    },
    {
      id: 'deal',
      label: 'Deal',
      cell: (c) => {
        const deal = c.dealId ? dealsApi.get(c.dealId) : undefined
        return deal?.title ?? '—'
      },
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

  return (
    <PmPage
      header={
        <PmPageHeader
          label="My Workspace"
          title="My contracts"
          description={
            contracts.length
              ? 'Agreements you own — pending signature, active, and completed.'
              : 'Contracts assigned to you for signature and execution.'
          }
          tone="contract"
          metric={<PmPageHeroMetric value={activeContracts} label="Active" />}
          badges={
            contracts.length ? (
              <>
                <PmBadge tone="muted">{contracts.length} total</PmBadge>
                <PmBadge tone="primary">{activeContracts} active</PmBadge>
              </>
            ) : undefined
          }
        />
      }
    >
      {listEmpty.branch === 'first-run' ? (
        <PmEmptyState
          title={listEmpty.config.title ?? 'No contracts yet'}
          description={listEmpty.config.description}
          action={
            <PmButton asChild>
              <Link to="/deals">Open deals</Link>
            </PmButton>
          }
        />
      ) : (
        <PmDataTable
          density="comfortable"
          columns={columns}
          data={paged}
          getRowId={(c) => c.id}
          caption="Contracts"
          toolbar={
            <PmToolbarSurface>
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
            </PmToolbarSurface>
          }
          rowActions={(c) => (
            <PmTableRowActions
              onView={() => navigate(`/contracts/${c.id}`)}
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
                      setSearch('')
                      setPage(1)
                    }}
                  >
                    Clear search
                  </PmButton>
                }
              />
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
            ) : undefined
          }
          renderMobileCard={(c) => <ContractListCard contract={c} />}
        />
      )}
    </PmPage>
  )
}

export function ContractDetailPage() {
  const version = useDataStoreVersion()
  const { user, canAccessAdmin } = useAuth()
  const { id } = useParams()

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
      <PmPage
        header={<PmPageHeader title="Contract" description="Contract summary." />}
      >
        <PmEmptyState
          title="Contract not found"
          description="This contract may have been removed or the link is invalid."
        />
      </PmPage>
    )
  }

  if (!canViewContractDetail(model.contract, viewer)) {
    return (
      <PmPage header={<PmPageHeader title="Access denied" description="Contract summary." />}>
        <EntityAccessDenied
          description="Contract details are only visible to parties or authorized platform staff."
          backHref="/contracts"
          backLabel="Back to contracts"
        />
      </PmPage>
    )
  }

  const canMutate = canMutateContractDetail(model.contract, viewer)

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

  const contractWorkflowSteps = buildContractWorkflowSteps({
    contractId: model.contractId,
    status: model.status,
    postMatchId: model.postMatchId,
    negotiationId: model.negotiationId,
    dealId: model.dealId,
  })

  const contractNavMore = buildContractNavMoreItems(model)
  const recommendedAction = buildContractRecommendedAction(model, canMutate, user?.id)
  const showMutations =
    canMutate &&
    contractDetailShowsMutationActions({
      canSign: model.canSign,
      canComplete: model.canComplete,
      canTerminate: model.canTerminate,
    })

  return (
    <PmPage
      header={
        <PmPageHeader
          label="Contract"
          title={formatContractDisplayTitle({
            dealTitle: model.dealTitle,
            needTitle: model.needTitle,
            offerTitle: model.offerTitle,
          })}
          description={`Created ${formatDate(model.contract.createdAt)} · Updated ${formatDate(model.contract.updatedAt)}`}
          tone="contract"
          metric={
            <PmPageHeroMetric
              value={model.parties.length}
              label="Parties"
            />
          }
          badges={<PmWorkflowBadge status={model.status} entity="contract" />}
          actions={
            canMutate && model.canSign && user?.id ? (
              <PmPageActions
                primary={{
                  label: 'Sign contract',
                  render: () => (
                    <SignContractButton
                      contractId={model.contractId}
                      userId={user.id}
                    />
                  ),
                }}
                more={
                  contractNavMore.length > 0
                    ? contractNavMore.map((item) => ({
                        id: item.id,
                        label: item.label,
                        href: item.href,
                      }))
                    : undefined
                }
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
            <PmLifecycleMap steps={contractWorkflowSteps} />

            {recommendedAction ? (
              <PmActionHub
                title="Recommended next step"
                description="The most important action for this contract."
                items={[recommendedAction]}
              />
            ) : null}

            <PmContentCard title="Workflow links" className="border-border/60 bg-surface-muted/30">
              <div className="flex flex-wrap gap-2">
                {model.links.deal ? (
                  <PmButton size="sm" variant="outline" asChild>
                    <Link to={model.links.deal.path}>{PRODUCT_LANGUAGE.OPEN_DEAL}</Link>
                  </PmButton>
                ) : null}
                {model.links.match ? (
                  <PmButton size="sm" variant="outline" asChild>
                    <Link to={model.links.match.path}>{PRODUCT_LANGUAGE.OPEN_MATCH}</Link>
                  </PmButton>
                ) : null}
                {model.links.negotiation ? (
                  <PmButton size="sm" variant="outline" asChild>
                    <Link to={model.links.negotiation.path}>
                      {PRODUCT_LANGUAGE.OPEN_NEGOTIATION}
                    </Link>
                  </PmButton>
                ) : null}
              </div>
            </PmContentCard>

            <PmContentCard title="Summary">
              <PmFormReadonly>
                <PmFormReadonlySection>
                  <PmFormReadonlyField label="Deal" value={model.dealTitle} />
                  <PmFormReadonlyField label="Need" value={model.needTitle} />
                  <PmFormReadonlyField label="Offer" value={model.offerTitle} />
                </PmFormReadonlySection>
              </PmFormReadonly>
              <PmTechnicalDetails className="mt-4">
                <PmFormReadonly>
                  <PmFormReadonlySection>
                    <PmFormReadonlyField label="Contract reference" value={model.contractId} />
                    <PmFormReadonlyField label="Deal reference" value={model.dealId} />
                    <PmFormReadonlyField label="Match reference" value={model.postMatchId} />
                    <PmFormReadonlyField label="Negotiation reference" value={model.negotiationId} />
                  </PmFormReadonlySection>
                </PmFormReadonly>
              </PmTechnicalDetails>
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
                <PmEmptyState title="No parties recorded" size="compact" />
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
                <PmEmptyState title="No milestones recorded" size="compact" />
              )}
            </PmContentCard>

            <PmContentCard title="Attachments">
              <PmEmptyState
                title="No attachments yet"
                description="File uploads are not available in this preview build. Attachments will appear here once document storage is connected."
                size="compact"
              />
            </PmContentCard>
          </>
        }
        inspector={
          <PmInspectorLayout
            header={<PmSectionHeader title="Scope" />}
            footer={
              showMutations && (model.canComplete || model.canTerminate) ? (
                <PmMoreActions label="More contract actions" className="w-full">
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
    </PmPage>
  )
}
