/**
 * Commercial Agreement adapter — Accepted Offer is authoritative.
 * Opportunity commercial structure is retained only as source context.
 */

import type { CommercialTerms } from '@/types/commercial-terms.ts'
import type { OpportunityCommercialStructure } from './types.ts'
import type { ProposedCommercialTerms } from './negotiation-adapter.ts'

export type AgreementCommercialSource = {
  /** Authoritative final negotiated terms (from accepted offer). */
  acceptedOfferTerms: CommercialTerms | ProposedCommercialTerms
  /** Optional opportunity context — never overrides accepted offer. */
  opportunityCommercialStructure?: OpportunityCommercialStructure | null
}

export function resolveAgreementCommercialTerms(
  source: AgreementCommercialSource,
): CommercialTerms {
  const accepted = source.acceptedOfferTerms
  return {
    amount: accepted.amount,
    currency: accepted.currency,
    duration: accepted.duration,
    paymentSchedule: accepted.paymentSchedule,
    profitSplit: accepted.profitSplit,
    exchangeMode: accepted.exchangeMode,
  }
}

export function agreementSourceContext(
  source: AgreementCommercialSource,
): OpportunityCommercialStructure | null {
  if (
    'commercialStructure' in source.acceptedOfferTerms
    && source.acceptedOfferTerms.commercialStructure
  ) {
    return source.acceptedOfferTerms.commercialStructure
  }
  return source.opportunityCommercialStructure ?? null
}
