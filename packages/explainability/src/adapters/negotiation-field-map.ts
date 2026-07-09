import {
  NEGOTIATION_REASON_CODES,
  type NegotiationReasonCode,
} from '../reason-codes/negotiation.ts'
import type { NegotiationStatus } from './negotiation-types.ts'

export const NEGOTIATION_ADAPTER_SCORE_WEIGHTS = {
  priceAlignment: 30,
  termsAlignment: 30,
  responseTimeliness: 20,
  offerProgression: 20,
} as const

export const NEGOTIATION_BREAKDOWN_LABELS = {
  priceAlignment: 'Price alignment',
  termsAlignment: 'Terms alignment',
  responseTimeliness: 'Response timeliness',
  offerProgression: 'Offer progression',
} as const

export type NegotiationBreakdownDimension = keyof typeof NEGOTIATION_ADAPTER_SCORE_WEIGHTS

export const NEGOTIATION_STATUS_TO_REASON_CODE: Readonly<
  Record<NegotiationStatus, NegotiationReasonCode>
> = {
  active: NEGOTIATION_REASON_CODES.STATUS_ACTIVE,
  countered: NEGOTIATION_REASON_CODES.STATUS_COUNTERED,
  agreed: NEGOTIATION_REASON_CODES.STATUS_AGREED,
  expired: NEGOTIATION_REASON_CODES.STATUS_EXPIRED,
  cancelled: NEGOTIATION_REASON_CODES.STATUS_CANCELLED,
}

/** Large price gap threshold (percent) for blocker surfacing. */
export const NEGOTIATION_LARGE_PRICE_GAP_PERCENT = 20

/** Response delay threshold (days) for weakness surfacing. */
export const NEGOTIATION_RESPONSE_DELAY_DAYS_THRESHOLD = 3

export function negotiationStatusToReasonCode(
  status: NegotiationStatus,
): NegotiationReasonCode {
  return NEGOTIATION_STATUS_TO_REASON_CODE[status]
}

export function negotiationStatusToHref(
  entityId: string,
  section?: 'offers' | 'terms' | 'messages',
): string {
  const base = `/negotiation/${entityId}`
  if (section) return `${base}/${section}`
  return base
}

export function negotiationTermsFieldToHref(
  entityId: string,
  field: string,
): string {
  const slug = field
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `${negotiationStatusToHref(entityId, 'terms')}#${slug}`
}

export function negotiationGapToReasonCode(): NegotiationReasonCode {
  return NEGOTIATION_REASON_CODES.TERMS_MISMATCH
}

export function isLargePriceGap(percent: number | undefined): boolean {
  return percent != null && percent >= NEGOTIATION_LARGE_PRICE_GAP_PERCENT
}

export function isResponseDelayed(days: number | undefined): boolean {
  return days != null && days >= NEGOTIATION_RESPONSE_DELAY_DAYS_THRESHOLD
}
