import type { ReactNode } from 'react'
import { opportunitiesApi } from '@/api/opportunities.ts'
import { dealsApi } from '@/api/deals.ts'
import { MatchTypeChip } from '@/components/collaboration/match-card'
import { ExecutiveEntityMetadata } from '@/components/shared/executive-entity-metadata'
import { PmReadinessScoreBadge } from '@/components/ui/pm-readiness-score-badge'
import { PmMatchScoreBadge, PmWorkflowBadge } from '@/components/ui/pm-index'
import type { PmDataTableColumn } from '@/components/data/pm-data-index'
import { resolveOpportunityReadiness } from '@/components/readiness/opportunity-readiness-card'
import { formatFrameworkMatchTypeSubtitle } from '@/config/need-offer-framework.ts'
import {
  formatCommercialAgreementPresentation,
  formatContractPresentation,
  formatNegotiationPresentation,
  formatOpportunityPresentation,
  formatPostMatchPresentation,
} from '@/lib/enterprise-display.ts'
import {
  formatContractDisplayTitle,
  formatDealDisplayTitleWithOpportunities,
  formatNegotiationDisplayTitle,
  formatOpportunityDisplayTitle,
  type OpportunityLookup,
} from '@/lib/entity-display-titles.ts'
import { formatMatchDisplayTitle } from '@/lib/match-display.ts'
import { resolveOpportunityTaxonomyLabels } from '@/lib/collaboration-taxonomy-display.ts'
import { formatDate } from '@/lib/format'
import { pmTypography } from '@/tokens'
import { cn } from '@/lib/utils'
import type { Contract, Deal, Negotiation, Opportunity, PostMatch } from '@/types/domain.ts'

function adminReferenceColumn<T>(
  id: string,
  label: string,
  value: (row: T) => string,
): PmDataTableColumn<T> {
  return {
    id,
    label,
    hideable: true,
    defaultVisible: false,
    cell: (row) => value(row),
    exportValue: (row) => value(row),
  }
}

function opportunityBusinessContext(opportunity: Opportunity): ReactNode {
  const taxonomy = resolveOpportunityTaxonomyLabels(opportunity)
  return (
    <ExecutiveEntityMetadata
      mainModel={taxonomy.mainModel}
      subModel={taxonomy.subModel}
      exchangeMode={taxonomy.exchangeMode}
      topology={taxonomy.matchingTopology}
      status={opportunity.status}
    />
  )
}

function dealBusinessContext(deal: Deal): ReactNode {
  const opportunity = deal.needOpportunityId
    ? opportunitiesApi.get(deal.needOpportunityId)
    : deal.offerOpportunityId
      ? opportunitiesApi.get(deal.offerOpportunityId)
      : undefined
  const taxonomy = opportunity ? resolveOpportunityTaxonomyLabels(opportunity) : null
  return (
    <ExecutiveEntityMetadata
      mainModel={taxonomy?.mainModel}
      subModel={taxonomy?.subModel}
      exchangeMode={taxonomy?.exchangeMode}
      topology={taxonomy?.matchingTopology}
      status={deal.status}
    />
  )
}

function contractBusinessContext(contract: Contract): ReactNode {
  const deal = contract.dealId ? dealsApi.get(contract.dealId) : undefined
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
      status={contract.status}
      readiness={
        contract.parties?.length
          ? `${contract.parties.filter((party) => party.signedAt).length}/${contract.parties.length} signed`
          : undefined
      }
    />
  )
}

export function resolveAdminContractListTitle(contract: Contract): string {
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

export function adminOpportunitySearchText(opportunity: Opportunity): string {
  const taxonomy = resolveOpportunityTaxonomyLabels(opportunity)
  return [
    formatOpportunityDisplayTitle(opportunity),
    opportunity.status,
    opportunity.location,
    taxonomy.mainModel,
    taxonomy.subModel,
    taxonomy.exchangeMode,
  ]
    .filter(Boolean)
    .join(' ')
}

export function adminPostMatchSearchText(
  match: PostMatch,
  getOpportunity: OpportunityLookup,
): string {
  return [
    formatMatchDisplayTitle(match, getOpportunity),
    match.status,
    match.matchType,
  ]
    .filter(Boolean)
    .join(' ')
}

export function adminNegotiationSearchText(
  negotiation: Negotiation,
  getOpportunity: OpportunityLookup,
): string {
  return [
    formatNegotiationDisplayTitle(negotiation, getOpportunity),
    negotiation.status,
  ]
    .filter(Boolean)
    .join(' ')
}

export function adminDealSearchText(deal: Deal): string {
  return [
    formatDealDisplayTitleWithOpportunities(deal, (id) => opportunitiesApi.get(id)),
    deal.status,
    deal.exchangeMode,
  ]
    .filter(Boolean)
    .join(' ')
}

export function adminContractSearchText(contract: Contract): string {
  const deal = contract.dealId ? dealsApi.get(contract.dealId) : undefined
  return [
    resolveAdminContractListTitle(contract),
    contract.status,
    contract.paymentMode,
    deal?.title,
  ]
    .filter(Boolean)
    .join(' ')
}

export function buildAdminOpportunityListColumns(input: {
  opportunityLabel: string
}): PmDataTableColumn<Opportunity>[] {
  return [
    {
      id: 'title',
      label: `${input.opportunityLabel} Name`,
      cell: (o) => formatOpportunityDisplayTitle(o),
      exportValue: (o) => formatOpportunityDisplayTitle(o),
    },
    {
      id: 'business',
      label: 'Business context',
      hideable: true,
      defaultVisible: true,
      cell: (o) => opportunityBusinessContext(o),
    },
    {
      id: 'status',
      label: 'Status',
      cell: (o) => <PmWorkflowBadge status={o.status} entity="opportunity" />,
      exportValue: (o) => String(o.status ?? ''),
    },
    {
      id: 'location',
      label: 'Location',
      cell: (o) => o.location ?? '—',
      exportValue: (o) => String(o.location ?? ''),
    },
    {
      id: 'readiness',
      label: 'Readiness',
      hideable: true,
      defaultVisible: true,
      cell: (o) => {
        const readiness = resolveOpportunityReadiness(o)
        return (
          <PmReadinessScoreBadge
            score={readiness.score}
            variant="admin"
            explanation={{
              missingRequired: readiness.missingRequired,
              missingRecommended: readiness.missingRecommended,
            }}
          />
        )
      },
      exportValue: (o) => String(resolveOpportunityReadiness(o).score),
    },
    {
      id: 'updated',
      label: 'Updated',
      cell: (o) => formatDate(o.updatedAt),
      exportValue: (o) => String(o.updatedAt ?? ''),
    },
    adminReferenceColumn('reference', 'Reference Number', (o) =>
      formatOpportunityPresentation(o).reference,
    ),
  ]
}

export function buildAdminPostMatchListColumns(input: {
  getOpportunity: OpportunityLookup
}): PmDataTableColumn<PostMatch>[] {
  const { getOpportunity } = input
  return [
    {
      id: 'title',
      label: 'Match',
      cell: (m) => formatMatchDisplayTitle(m, getOpportunity),
      exportValue: (m) => formatMatchDisplayTitle(m, getOpportunity),
    },
    {
      id: 'score',
      label: 'Score',
      cell: (m) =>
        typeof m.matchScore === 'number' ? (
          <PmMatchScoreBadge
            score={m.matchScore}
            variant="list"
            breakdown={m.payload?.breakdown ?? m.matchCriteria}
          />
        ) : (
          '—'
        ),
      exportValue: (m) =>
        typeof m.matchScore === 'number' ? String(m.matchScore) : '',
    },
    {
      id: 'status',
      label: 'Status',
      cell: (m) => <PmWorkflowBadge status={m.status} entity="match" />,
      exportValue: (m) => String(m.status ?? ''),
    },
    {
      id: 'type',
      label: 'Type',
      hideable: true,
      defaultVisible: true,
      cell: (m) => (
        <div className="flex flex-col items-start gap-0.5">
          <MatchTypeChip matchType={m.matchType} />
          <span className={cn(pmTypography.caption, 'text-muted-foreground')}>
            {formatFrameworkMatchTypeSubtitle(m.matchType)}
          </span>
        </div>
      ),
      exportValue: (m) => String(m.matchType ?? ''),
    },
    {
      id: 'created',
      label: 'Created',
      cell: (m) => formatDate(m.createdAt),
      exportValue: (m) => String(m.createdAt ?? ''),
    },
    adminReferenceColumn('reference', 'Reference Number', (m) =>
      formatPostMatchPresentation(m, getOpportunity).reference,
    ),
  ]
}

export function buildAdminNegotiationListColumns(input: {
  negotiationLabel: string
  getOpportunity: OpportunityLookup
}): PmDataTableColumn<Negotiation>[] {
  const { getOpportunity, negotiationLabel } = input
  return [
    {
      id: 'title',
      label: `${negotiationLabel} Title`,
      cell: (n) => formatNegotiationDisplayTitle(n, getOpportunity),
      exportValue: (n) => formatNegotiationDisplayTitle(n, getOpportunity),
    },
    {
      id: 'business',
      label: 'Business context',
      hideable: true,
      defaultVisible: true,
      cell: (n) => {
        const opportunityId =
          n.needOpportunityId ?? n.offerOpportunityId ?? n.opportunityId
        const opportunity = opportunityId ? getOpportunity(opportunityId) : undefined
        return opportunity ? opportunityBusinessContext(opportunity) : '—'
      },
    },
    {
      id: 'status',
      label: 'Status',
      cell: (n) => (
        <PmWorkflowBadge status={n.status ?? 'pending'} entity="negotiation" />
      ),
      exportValue: (n) => String(n.status ?? ''),
    },
    {
      id: 'updated',
      label: 'Updated',
      cell: (n) => formatDate(n.updatedAt),
      exportValue: (n) => String(n.updatedAt ?? ''),
    },
    adminReferenceColumn('reference', 'Reference Number', (n) =>
      formatNegotiationPresentation(n, getOpportunity).reference,
    ),
  ]
}

export function buildAdminDealListColumns(): PmDataTableColumn<Deal>[] {
  return [
    {
      id: 'title',
      label: 'Agreement Name',
      cell: (d) => formatDealDisplayTitleWithOpportunities(d, (id) => opportunitiesApi.get(id)),
      exportValue: (d) =>
        formatDealDisplayTitleWithOpportunities(d, (id) => opportunitiesApi.get(id)),
    },
    {
      id: 'business',
      label: 'Business context',
      hideable: true,
      defaultVisible: true,
      cell: (d) => dealBusinessContext(d),
    },
    {
      id: 'status',
      label: 'Status',
      cell: (d) => <PmWorkflowBadge status={d.status ?? 'pending'} entity="deal" />,
      exportValue: (d) => String(d.status ?? ''),
    },
    {
      id: 'updated',
      label: 'Updated',
      cell: (d) => formatDate(d.updatedAt),
      exportValue: (d) => String(d.updatedAt ?? ''),
    },
    adminReferenceColumn('reference', 'Reference Number', (d) =>
      formatCommercialAgreementPresentation(d).reference,
    ),
  ]
}

export function buildAdminContractListColumns(input: {
  contractLabel: string
}): PmDataTableColumn<Contract>[] {
  return [
    {
      id: 'title',
      label: `${input.contractLabel} Name`,
      cell: (c) => resolveAdminContractListTitle(c),
      exportValue: (c) => resolveAdminContractListTitle(c),
    },
    {
      id: 'deal',
      label: 'Source record',
      hideable: true,
      defaultVisible: true,
      cell: (c) => {
        const deal = c.dealId ? dealsApi.get(c.dealId) : undefined
        return deal
          ? formatDealDisplayTitleWithOpportunities(deal, (id) => opportunitiesApi.get(id))
          : '—'
      },
    },
    {
      id: 'business',
      label: 'Business context',
      hideable: true,
      defaultVisible: true,
      cell: (c) => contractBusinessContext(c),
    },
    {
      id: 'status',
      label: 'Status',
      cell: (c) => <PmWorkflowBadge status={c.status} entity="contract" />,
      exportValue: (c) => String(c.status ?? ''),
    },
    {
      id: 'updated',
      label: 'Updated',
      cell: (c) => formatDate(c.updatedAt),
      exportValue: (c) => String(c.updatedAt ?? ''),
    },
    adminReferenceColumn('reference', 'Reference Number', (c) =>
      formatContractPresentation(c).reference,
    ),
  ]
}
