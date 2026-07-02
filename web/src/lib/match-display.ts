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

/**
 * Topology-aware match title. `one_way` keeps its exact Need -> Offer pairing;
 * the other three types get a structure-appropriate label.
 */
export function formatMatchDisplayTitle(
  match: PostMatch,
  getOpportunity: OpportunityLookup,
): string {
  const matchType = (match.matchType || 'one_way').toLowerCase()

  if (matchType === 'two_way') {
    const { needTitle, offerTitle } = resolveMatchNeedOfferTitles(match, getOpportunity)
    return `Barter: ${offerTitle} \u21c4 ${needTitle}`
  }

  if (matchType === 'consortium') {
    const leadId = match.payload?.leadNeedId
    const leadTitle = leadId
      ? formatOpportunityDisplayTitle(getOpportunity(leadId))
      : formatOpportunityDisplayTitle(undefined)
    const roleCount = match.payload?.roles?.length ?? 0
    return `Consortium: ${leadTitle} + ${roleCount} ${roleCount === 1 ? 'role' : 'roles'}`
  }

  if (matchType === 'circular') {
    const partyCount =
      match.payload?.cycle?.length ??
      match.payload?.links?.length ??
      match.participants?.length ??
      0
    return `Circular exchange: ${partyCount} parties`
  }

  const { needTitle, offerTitle } = resolveMatchNeedOfferTitles(match, getOpportunity)
  return formatMatchPairingLabel(needTitle, offerTitle)
}

export { formatMatchPairingLabel } from '@/lib/entity-display-titles.ts'
