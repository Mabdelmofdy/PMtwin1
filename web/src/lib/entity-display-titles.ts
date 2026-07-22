/**
 * User-facing display titles for workflow entities.
 * Presentation only — internal IDs are never shown as primary labels.
 */

import type { Deal, Negotiation, Opportunity } from '@/types/domain.ts'

export const UNTITLED_OPPORTUNITY = 'Untitled Opportunity'
export const UNTITLED_NEGOTIATION = 'Untitled Negotiation'
export const UNTITLED_DEAL = 'Untitled Commercial Agreement'
export const UNTITLED_CONTRACT = 'Untitled Contract'

const LINKED_RECORD_UNAVAILABLE = 'Linked record unavailable'

export type OpportunityLookup = (id: string) => Opportunity | undefined

export type CommercialAgreementSubjectInput = {
  readonly needTitle?: string | null
  readonly offerTitle?: string | null
}

export function formatOpportunityDisplayTitle(
  opportunity?: Pick<Opportunity, 'title'> | null,
): string {
  const title = opportunity?.title?.trim()
  return title || UNTITLED_OPPORTUNITY
}

export function formatMatchPairingLabel(needTitle: string, offerTitle: string): string {
  return `${needTitle} ↔ ${offerTitle}`
}

function isUsableSubjectTitle(title: string | null | undefined): title is string {
  const trimmed = title?.trim()
  if (!trimmed) return false
  if (trimmed === LINKED_RECORD_UNAVAILABLE) return false
  if (trimmed === UNTITLED_OPPORTUNITY) return false
  return true
}

/** True when a stored deal title embeds a technical entity id (legacy placeholders). */
export function isTechnicalStoredTitle(title: string): boolean {
  const trimmed = title.trim()
  if (
    /^Commercial Agreement\s*[–—-]\s*(Application\s+\S+|(pm|neg|opp|deal|ctr)-[a-z0-9-]+|[0-9a-f]{8}-[0-9a-f-]{27,})$/i.test(
      trimmed,
    )
  ) {
    return true
  }
  if (/^(pm|neg|opp|deal|ctr)-[a-z0-9-]+$/i.test(trimmed)) return true
  if (/^(Deal|Contract|Commercial Agreement)\s*[–—-]\s*(pm|neg|opp|deal|ctr)-/i.test(trimmed)) {
    return true
  }
  return false
}

export function resolveCommercialAgreementSubjectLabel(
  input: CommercialAgreementSubjectInput,
): string | null {
  const need = isUsableSubjectTitle(input.needTitle) ? input.needTitle.trim() : null
  const offer = isUsableSubjectTitle(input.offerTitle) ? input.offerTitle.trim() : null
  if (need && offer) return formatMatchPairingLabel(need, offer)
  return need ?? offer
}

/** Persistable commercial-agreement title from Need/Offer subjects (never an entity id). */
export function buildCommercialAgreementStoredTitle(
  input: CommercialAgreementSubjectInput,
): string {
  return resolveCommercialAgreementSubjectLabel(input) ?? UNTITLED_DEAL
}

export function formatDealDisplayTitle(
  deal?: Pick<Deal, 'title'> | null,
  subjects?: CommercialAgreementSubjectInput,
): string {
  const stored = deal?.title?.trim()
  if (stored && !isTechnicalStoredTitle(stored)) return stored

  const fromSubjects = subjects
    ? resolveCommercialAgreementSubjectLabel(subjects)
    : null
  if (fromSubjects) return fromSubjects

  return UNTITLED_DEAL
}

export function formatDealDisplayTitleWithOpportunities(
  deal:
    | Pick<Deal, 'title' | 'needOpportunityId' | 'offerOpportunityId'>
    | null
    | undefined,
  getOpportunity: OpportunityLookup,
): string {
  if (!deal) return UNTITLED_DEAL
  return formatDealDisplayTitle(deal, {
    needTitle: deal.needOpportunityId
      ? getOpportunity(deal.needOpportunityId)?.title
      : null,
    offerTitle: deal.offerOpportunityId
      ? getOpportunity(deal.offerOpportunityId)?.title
      : null,
  })
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
  const stored = input.dealTitle?.trim()
  if (stored && !isTechnicalStoredTitle(stored)) return `${stored} Contract`

  const subject = resolveCommercialAgreementSubjectLabel({
    needTitle: input.needTitle,
    offerTitle: input.offerTitle,
  })
  if (subject) return `${subject} Contract`

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
