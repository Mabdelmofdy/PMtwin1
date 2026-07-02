/**
 * User-facing display titles for workflow entities.
 * Presentation only — internal IDs are never shown as primary labels.
 */

import type { Deal, Negotiation, Opportunity } from '@/types/domain.ts'

export const UNTITLED_OPPORTUNITY = 'Untitled Opportunity'
export const UNTITLED_NEGOTIATION = 'Untitled Negotiation'
export const UNTITLED_DEAL = 'Untitled Deal'
export const UNTITLED_CONTRACT = 'Untitled Contract'

export type OpportunityLookup = (id: string) => Opportunity | undefined

export function formatOpportunityDisplayTitle(
  opportunity?: Pick<Opportunity, 'title'> | null,
): string {
  const title = opportunity?.title?.trim()
  return title || UNTITLED_OPPORTUNITY
}

export function formatDealDisplayTitle(deal?: Pick<Deal, 'title'> | null): string {
  const title = deal?.title?.trim()
  return title || UNTITLED_DEAL
}

export function formatMatchPairingLabel(needTitle: string, offerTitle: string): string {
  return `${needTitle} ↔ ${offerTitle}`
}

export function resolveNegotiationSubjectTitle(
  negotiation: Negotiation,
  getOpportunity?: OpportunityLookup,
): string | null {
  if (!getOpportunity) return null

  const candidates = [
    negotiation.needOpportunityId,
    negotiation.offerOpportunityId,
    negotiation.opportunityId,
  ].filter((id): id is string => Boolean(id?.trim()))

  for (const id of candidates) {
    const title = getOpportunity(id)?.title?.trim()
    if (title) return title
  }

  return null
}

export function formatNegotiationDisplayTitle(
  negotiation: Negotiation,
  getOpportunity?: OpportunityLookup,
): string {
  const subject = resolveNegotiationSubjectTitle(negotiation, getOpportunity)
  if (subject) return `${subject} Negotiation`
  return UNTITLED_NEGOTIATION
}

export function formatContractDisplayTitle(input: {
  readonly dealTitle?: string | null
  readonly needTitle?: string | null
  readonly offerTitle?: string | null
}): string {
  const dealTitle = input.dealTitle?.trim()
  if (dealTitle) return `${dealTitle} Contract`

  const needTitle = input.needTitle?.trim()
  if (needTitle) return `${needTitle} Contract`

  const offerTitle = input.offerTitle?.trim()
  if (offerTitle) return `${offerTitle} Contract`

  return UNTITLED_CONTRACT
}

export function formatContractDisplayTitleFromContract(
  input?: {
    readonly dealTitle?: string | null
    readonly needTitle?: string | null
    readonly offerTitle?: string | null
  },
): string {
  return formatContractDisplayTitle(input ?? {})
}
