import {
  POST_TYPE_LABELS,
  resolvePostTypeKey,
  type PostTypeKey,
  type SemanticMirrorPair,
} from '@/config/need-offer-framework.ts'
import type { Opportunity } from '@/types/domain.ts'

export type SemanticAttributeValue = {
  readonly label: string
  readonly value: string
}

export type OpportunitySemanticReadModel = {
  readonly postType: PostTypeKey | 'hybrid' | 'unknown'
  readonly postTypeLabel: string
  readonly attributes: readonly SemanticAttributeValue[]
  readonly mirrorPairs: readonly SemanticMirrorPair[]
}

type ExtendedOpportunity = Opportunity & {
  scope?: {
    coreSkills?: string[]
    sectors?: string[]
    requiredSkills?: string[]
    offeredSkills?: string[]
  }
  normalized?: {
    requiredServices?: string[]
    offeredServices?: string[]
    skills?: string[]
  }
  exchangeData?: {
    budgetRange?: { min?: number; max?: number; currency?: string }
    rateRange?: { min?: number; max?: number; currency?: string }
  }
  attributes?: {
    coreSkills?: string[]
    startDate?: string
    tenderDeadline?: string
    availabilityDate?: string
    locationRequirement?: string
    preferredLocation?: string
  }
  paymentModes?: readonly string[]
}

function formatSkills(values: readonly string[] | undefined): string | undefined {
  if (!values?.length) return undefined
  return values.join(', ')
}

function formatBudgetRange(
  range: { min?: number; max?: number; currency?: string } | undefined,
): string | undefined {
  if (!range) return undefined
  const currency = range.currency ?? 'SAR'
  if (range.min != null && range.max != null) {
    return `${range.min.toLocaleString()}–${range.max.toLocaleString()} ${currency}`
  }
  if (range.min != null) return `from ${range.min.toLocaleString()} ${currency}`
  if (range.max != null) return `up to ${range.max.toLocaleString()} ${currency}`
  return undefined
}

function resolveNeedAttributes(opp: ExtendedOpportunity): SemanticAttributeValue[] {
  const skills =
    formatSkills(opp.scope?.requiredSkills)
    ?? formatSkills(opp.normalized?.requiredServices)
    ?? formatSkills(opp.scope?.coreSkills)
    ?? formatSkills(opp.normalized?.skills)

  const budget =
    formatBudgetRange(opp.exchangeData?.budgetRange)
    ?? (opp.exchangeMode ? formatValueExchangeHint(opp.exchangeMode) : undefined)

  const deadline = opp.attributes?.tenderDeadline ?? opp.attributes?.startDate
  const location = opp.location ?? opp.attributes?.locationRequirement

  return [
    { label: 'Required Skills', value: skills ?? '—' },
    { label: 'Budget', value: budget ?? '—' },
    { label: 'Deadline', value: deadline ?? '—' },
    { label: 'Location', value: location ?? '—' },
  ]
}

function resolveOfferAttributes(opp: ExtendedOpportunity): SemanticAttributeValue[] {
  const skills =
    formatSkills(opp.scope?.offeredSkills)
    ?? formatSkills(opp.normalized?.offeredServices)
    ?? formatSkills(opp.scope?.coreSkills)
    ?? formatSkills(opp.normalized?.skills)

  const rate =
    formatBudgetRange(opp.exchangeData?.rateRange ?? opp.exchangeData?.budgetRange)
    ?? (opp.exchangeMode ? formatValueExchangeHint(opp.exchangeMode) : undefined)

  const availability = opp.attributes?.availabilityDate ?? opp.attributes?.startDate
  const location = opp.attributes?.preferredLocation ?? opp.location

  return [
    { label: 'Available Skills', value: skills ?? '—' },
    { label: 'Rate', value: rate ?? '—' },
    { label: 'Availability', value: availability ?? '—' },
    { label: 'Preferred Location', value: location ?? '—' },
  ]
}

function formatValueExchangeHint(mode: string): string {
  return mode.replace(/_/g, ' ')
}

export function buildOpportunitySemanticReadModel(
  opportunity: Opportunity,
): OpportunitySemanticReadModel {
  const postType = resolvePostTypeKey(opportunity.intent)
  const isOffer = postType === 'offer'

  return {
    postType,
    postTypeLabel:
      postType === 'need' || postType === 'offer'
        ? POST_TYPE_LABELS[postType]
        : postType === 'hybrid'
          ? 'Hybrid'
          : '—',
    attributes: isOffer
      ? resolveOfferAttributes(opportunity as ExtendedOpportunity)
      : resolveNeedAttributes(opportunity as ExtendedOpportunity),
    mirrorPairs: [],
  }
}

export function resolveOpportunityPaymentModes(
  opportunity: Opportunity,
): readonly string[] {
  const extended = opportunity as ExtendedOpportunity & { value_exchange?: { accepted_modes?: string[] } }
  if (extended.paymentModes?.length) return extended.paymentModes
  if (extended.value_exchange?.accepted_modes?.length) {
    return extended.value_exchange.accepted_modes
  }
  if (opportunity.exchangeMode) return [opportunity.exchangeMode]
  return []
}
