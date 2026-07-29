import { Link, useParams, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { contractsApi } from '@/api/contracts.ts'
import { dealsApi } from '@/api/deals.ts'
import { negotiationsApi } from '@/api/negotiations.ts'
import { opportunitiesApi } from '@/api/opportunities.ts'
import { peopleApi } from '@/api/people.ts'
import { SignContractButton } from '@/components/contract/sign-contract-button.tsx'
import { CompleteContractButton } from '@/components/contract/complete-contract-button.tsx'
import { TerminateContractButton } from '@/components/contract/terminate-contract-button.tsx'
import { useDataStoreVersion } from '@/hooks/use-data-store'
import { ExplanationPanel } from '@/components/explainability/explanation-panel.tsx'
import { buildContractExplanation } from '@/services/explainability/index.ts'
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
  PmBrowsePage,
  PmBrowseToolbar,
  PmContentCard,
  PmDetailLayout,
  PM_RECOMMENDED_NEXT_STEP,
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
  PmWorkflowLinksCard,
  PmFilterChips,
  buildContractWorkflowSteps,
  type PmMoreActionItem,
} from '@/components/ui/pm-index'
import { pmTypography } from '@/tokens'
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
import {
  formatContractDisplayTitle,
  formatDealDisplayTitle,
  formatDealDisplayTitleWithOpportunities,
} from '@/lib/entity-display-titles.ts'
import { PRODUCT_LANGUAGE } from '@/lib/product-language'
import { PmTechnicalDetails } from '@/components/ui/pm-technical-details.tsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCollaborationExchangeMode } from '@/lib/collaboration-taxonomy-display.ts'
import { useProductLanguage } from '@/providers/product-language-provider'
import { resolveOpportunityTaxonomyLabels } from '@/lib/collaboration-taxonomy-display.ts'
import { ExecutiveEntityMetadata } from '@/components/shared/executive-entity-metadata'
import { useExecutiveListFilters } from '@/lib/executive-list-filters'
import {
  AttachmentsUploadControl,
  type AttachmentFileMeta,
} from '@/components/shared/attachments-upload-control.tsx'
import { toast } from 'sonner'

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
      title: 'Review source commercial agreement',
      context: 'Commercial terms and participants live in the commercial agreement workspace.',
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
  const relatedOpportunity = deal?.needOpportunityId
    ? opportunitiesApi.get(deal.needOpportunityId)
    : deal?.offerOpportunityId
      ? opportunitiesApi.get(deal.offerOpportunityId)
      : undefined
  const taxonomy = relatedOpportunity
    ? resolveOpportunityTaxonomyLabels(relatedOpportunity)
    : null
  const dealLabel = deal
    ? formatDealDisplayTitleWithOpportunities(deal, (id) => opportunitiesApi.get(id))
    : 'Commercial agreement'
  return (
    <PmEntityListCard
      title={title}
      href={`/contracts/${contract.id}`}
      badge={<PmWorkflowBadge status={contract.status} entity="contract" size="sm" />}
      meta={`${taxonomy?.mainModel ?? dealLabel} · ${taxonomy?.exchangeMode ?? '—'} · Updated ${formatDate(contract.updatedAt)}`}
      primary={{ label: 'Open contract', href: `/contracts/${contract.id}` }}
    />
  )
}

export function ContractsPage() {
  const navigate = useNavigate()
  const { user, canAccessAdmin, activeWorkspace, activeParty } = useAuth()
  const filters = useExecutiveListFilters('contracts', {
    statusLabel: (value) => value.replace(/_/g, ' '),
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
  const contracts = useMemo(
    () => filterContractsForViewer(contractsApi.list(), viewer),
    [viewer],
  )
  const activeContracts = countActiveContracts(contracts)

  const filtered = useMemo(() => {
    return contracts.filter((c) => {
      const q = filters.search.toLowerCase()
      const title = resolveContractListTitle(c).toLowerCase()
      const dealTitle = c.dealId ? dealsApi.get(c.dealId)?.title?.toLowerCase() ?? '' : ''
      const matchesSearch = !filters.search || title.includes(q) || dealTitle.includes(q)
      const matchesStatus = filters.status === 'all' || c.status === filters.status
      const matchesPaymentMode = filters.mode === 'all' || c.paymentMode === filters.mode
      return matchesSearch && matchesStatus && matchesPaymentMode
    })
  }, [contracts, filters.search, filters.status, filters.mode])

  const totalItems = filtered.length
  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize))
  const safePage = Math.min(page, pageCount)
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  const listEmpty = resolveListEmptyState({
    hasSourceData: contracts.length > 0,
    hasActiveFilters:
      filters.search.length > 0 || filters.status !== 'all' || filters.mode !== 'all',
    firstRun: {
      title: 'No contracts yet',
      description: 'These records are created from commercial agreements in draft, review, or signing.',
    },
    filtered: {
      title: 'No contracts match your search',
      description: 'Try a different search term.',
    },
  })

  const columns: PmDataTableColumn<Contract>[] = [
    {
      id: 'title',
      label: 'Record',
      cell: (c) => (
        <Link to={`/contracts/${c.id}`} className={cn(pmTypography.bodySm, 'font-medium hover:text-primary')}>
          {resolveContractListTitle(c)}
        </Link>
      ),
    },
    {
      id: 'deal',
      label: 'Source record',
      cell: (c) => {
        const deal = c.dealId ? dealsApi.get(c.dealId) : undefined
        return deal
          ? formatDealDisplayTitleWithOpportunities(deal, (id) => opportunitiesApi.get(id))
          : '—'
      },
    },
    {
      id: 'status',
      label: 'Status',
      cell: (c) => <PmWorkflowBadge status={c.status} entity="contract" />,
    },
    {
      id: 'business',
      label: 'Business context',
      cell: (c) => {
        const deal = c.dealId ? dealsApi.get(c.dealId) : undefined
        const opportunity = deal?.needOpportunityId
          ? opportunitiesApi.get(deal.needOpportunityId)
          : deal?.offerOpportunityId
            ? opportunitiesApi.get(deal.offerOpportunityId)
            : undefined
        const taxonomy = opportunity ? resolveOpportunityTaxonomyLabels(opportunity) : null
        return (
          <ExecutiveEntityMetadata
            mainModel={taxonomy?.mainModel}
            subModel={taxonomy?.subModel}
            exchangeMode={taxonomy?.exchangeMode}
            topology={taxonomy?.matchingTopology}
            status={c.status}
            readiness={c.parties?.length ? `${c.parties.filter((party) => party.signedAt).length}/${c.parties.length} signed` : undefined}
          />
        )
      },
    },
    {
      id: 'updated',
      label: 'Updated',
      cell: (c) => formatDate(c.updatedAt),
    },
  ]

  return (
    <PmBrowsePage
      header={
        <PmPageHeader
          label="My Workspace"
          title={`My ${productLanguage.plural('contract').toLowerCase()}`}
          description={
            contracts.length
              ? 'Agreements you own — pending signature, active, and completed.'
              : 'Records assigned to you for signature and execution.'
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
      toolbar={
        contracts.length > 0 ? (
          <PmBrowseToolbar>
            <PmTableToolbar
              search={
                <PmTableSearch
                  placeholder={`Search ${productLanguage.label('contract').toLowerCase()} or ${productLanguage.label('commercialAgreement').toLowerCase()} ID…`}
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
                      <SelectItem value="pending_signature">Pending signature</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="terminated">Terminated</SelectItem>
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
                      <SelectItem value="all">All payment modes</SelectItem>
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
          title={listEmpty.config.title ?? 'No contracts yet'}
          description={listEmpty.config.description}
          action={
            <PmButton asChild>
              <Link to="/commercial-agreements">Open commercial agreements</Link>
            </PmButton>
          }
        />
      ) : (
        <PmDataTable
          density="comfortable"
          columns={columns}
          data={paged}
          getRowId={(c) => c.id}
          caption={productLanguage.plural('contract')}
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
          renderMobileCard={(c) => <ContractListCard contract={c} />}
        />
      )}
    </PmBrowsePage>
  )
}

export function ContractDetailPage() {
  const version = useDataStoreVersion()
  const { user, canAccessAdmin, activeWorkspace, activeParty } = useAuth()
  const { productLanguage } = useProductLanguage()
  const { id } = useParams()
  const [sessionAttachments, setSessionAttachments] = useState<readonly AttachmentFileMeta[]>([])

  useEffect(() => {
    setSessionAttachments([])
  }, [id])

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

  const contractBundle = useMemo(
    () => (model ? buildContractExplanation(model) : null),
    [model],
  )

  void version

  if (!id || !model) {
    return (
      <PmPage
        header={<PmPageHeader title={productLanguage.label('contract')} description={`${productLanguage.label('contract')} summary.`} />}
      >
        <PmEmptyState
          title={`${productLanguage.label('contract')} not found`}
          description={`This ${productLanguage.label('contract').toLowerCase()} may have been removed or the link is invalid.`}
        />
      </PmPage>
    )
  }

  if (!canViewContractDetail(model.contract, viewer)) {
    return (
      <PmPage header={<PmPageHeader title="Access denied" description={`${productLanguage.label('contract')} summary.`} />}>
        <EntityAccessDenied
          entity="contract"
          description={`${productLanguage.label('contract')} details are only visible to parties or authorized platform staff.`}
        />
      </PmPage>
    )
  }

  const canMutate = canMutateContractDetail(model.contract, viewer)

  const collaborationStep = resolveCollaborationStepFromContract()
  const timelineEvents: CollaborationTimelineEvent[] = [
    {
      id: 'created',
      label: `${productLanguage.label('contract')} created`,
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
  const contractWorkflowLinks = [
    ...(model.links.deal
      ? [{ id: 'deal', label: PRODUCT_LANGUAGE.OPEN_DEAL, href: model.links.deal.path }]
      : []),
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
  ]
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
          label={productLanguage.label('contract')}
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
                title={PM_RECOMMENDED_NEXT_STEP.title}
                description={PM_RECOMMENDED_NEXT_STEP.description('contract')}
                items={[recommendedAction]}
              />
            ) : null}

            <PmWorkflowLinksCard links={contractWorkflowLinks} />

            <PmContentCard title="Summary">
              <PmFormReadonly>
                <PmFormReadonlySection>
                  <PmFormReadonlyField
                    label="Source record"
                    value={formatDealDisplayTitle(
                      model.dealTitle ? { title: model.dealTitle } : null,
                      {
                        needTitle: model.needTitle,
                        offerTitle: model.offerTitle,
                      },
                    )}
                  />
                  <PmFormReadonlyField label="Need" value={model.needTitle} />
                  <PmFormReadonlyField label="Offer" value={model.offerTitle} />
                </PmFormReadonlySection>
              </PmFormReadonly>
              <PmTechnicalDetails className="mt-4">
                <PmFormReadonly>
                  <PmFormReadonlySection>
                    <PmFormReadonlyField label="Primary reference" value={model.contractId} />
                    <PmFormReadonlyField label="Commercial agreement reference" value={model.dealId} />
                    <PmFormReadonlyField label="Match reference" value={model.postMatchId} />
                    <PmFormReadonlyField label="Linked workflow reference" value={model.negotiationId} />
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

            <PmContentCard
              title="Attachments"
              actions={
                <AttachmentsUploadControl
                  label="Upload"
                  aria-label="Upload contract attachments"
                  existingFileNames={sessionAttachments.map((file) => file.fileName)}
                  onFilesSelected={(files) => {
                    setSessionAttachments((current) => {
                      const seen = new Set(current.map((item) => item.fileName.toLowerCase()))
                      const merged = [...current]
                      for (const file of files) {
                        const key = file.fileName.toLowerCase()
                        if (seen.has(key)) continue
                        seen.add(key)
                        merged.push(file)
                      }
                      return merged
                    })
                    toast.success(
                      files.length === 1 ? 'Attachment added' : 'Attachments added',
                    )
                  }}
                />
              }
            >
              {sessionAttachments.length === 0 ? (
                <PmEmptyState
                  title="No attachments yet"
                  description="Upload document references for this contract. File names are kept in this session; binary storage is not connected yet."
                  size="compact"
                />
              ) : (
                <ul className="space-y-2">
                  {sessionAttachments.map((attachment) => (
                    <li
                      key={attachment.fileName}
                      className={cn(pmTypography.bodySm, 'rounded border border-border p-2')}
                    >
                      <span className="font-medium">{attachment.fileName}</span>
                      {attachment.mimeType ? (
                        <span className="text-muted-foreground"> · {attachment.mimeType}</span>
                      ) : null}
                      {attachment.sizeBytes != null ? (
                        <span className="text-muted-foreground">
                          {' '}
                          · {attachment.sizeBytes} bytes
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
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
            <ExplanationPanel
              bundle={contractBundle!}
              scoreLabel={`${productLanguage.label('contract')} progress`}
              compact
              showTimeline={false}
              className="mt-4 border-t border-border/50 pt-4"
            />
          </PmInspectorLayout>
        }
        timeline={
          <CollaborationTimeline
            activeStep={collaborationStep}
            events={timelineEvents}
            title={`${productLanguage.label('contract')} timeline`}
          />
        }
      />
    </PmPage>
  )
}
