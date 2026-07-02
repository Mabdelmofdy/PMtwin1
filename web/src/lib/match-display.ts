/**
 * Match UI display helpers — need/offer pairing as primary identity.
 */

import type { PostMatch } from '@/types/domain.ts'
import {
  formatMatchPairingLabel,
  formatOpportunityDisplayTitle,
  type OpportunityLookup,
} from '@/lib/entity-display-titles.ts'

export type MatchNeedOfferTitles = {
  readonly needTitle: string
  readonly offerTitle: string
  readonly needId?: string
  readonly offerId?: string
}

function resolveNeedOfferIds(match: PostMatch): {
  readonly needId?: string
  readonly offerId?: string
} {
  const payload = match.payload
  return {
    needId: match.needOpportunityId ?? payload?.needOpportunityId,
    offerId: match.offerOpportunityId ?? payload?.offerOpportunityId,
  }
}

export function resolveMatchNeedOfferTitles(
  match: PostMatch,
  getOpportunity: OpportunityLookup,
): MatchNeedOfferTitles {
  const { needId, offerId } = resolveNeedOfferIds(match)

  return {
    needId,
    offerId,
    needTitle: needId
      ? formatOpportunityDisplayTitle(getOpportunity(needId))
      : formatOpportunityDisplayTitle(undefined),
    offerTitle: offerId
      ? formatOpportunityDisplayTitle(getOpportunity(offerId))
      : formatOpportunityDisplayTitle(undefined),
  }
}

export function formatMatchDisplayTitle(
  match: PostMatch,
  getOpportunity: OpportunityLookup,
): string {
  const { needTitle, offerTitle } = resolveMatchNeedOfferTitles(match, getOpportunity)
  return formatMatchPairingLabel(needTitle, offerTitle)
}

export { formatMatchPairingLabel } from '@/lib/entity-display-titles.ts'
