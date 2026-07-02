/**
 * Topology-aware resolution of the opportunity IDs referenced by a PostMatch.
 *
 * one_way records promote `needOpportunityId` / `offerOpportunityId` to the top
 * level; the other three topologies carry their structure in `payload`. This
 * resolver returns a flat, de-duplicated, ordered list plus a "primary" need and
 * offer so downstream flows (negotiation, deal, contract) work for every type
 * while preserving the exact IDs for `one_way`.
 */

import type { PostMatch } from '@/types/domain.ts'

export type ResolvedPostMatchOpportunityIds = {
  readonly opportunityIds: readonly string[]
  readonly needOpportunityId?: string
  readonly offerOpportunityId?: string
}

function dedupe(ids: readonly (string | undefined | null)[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const id of ids) {
    if (typeof id === 'string' && id.trim() && !seen.has(id)) {
      seen.add(id)
      result.push(id)
    }
  }
  return result
}

export function resolvePostMatchOpportunityIds(
  match: PostMatch,
): ResolvedPostMatchOpportunityIds {
  const payload = match.payload
  const matchType = (match.matchType || 'one_way').toLowerCase()

  if (matchType === 'two_way') {
    const sideA = payload?.sideA
    const sideB = payload?.sideB
    return {
      opportunityIds: dedupe([
        sideA?.needId,
        sideA?.offerId,
        sideB?.needId,
        sideB?.offerId,
      ]),
      needOpportunityId: sideA?.needId,
      offerOpportunityId: sideA?.offerId,
    }
  }

  if (matchType === 'consortium') {
    const leadNeedId = payload?.leadNeedId
    const roleOpportunityIds = (payload?.roles ?? []).map(
      (role) => role.opportunityId,
    )
    return {
      opportunityIds: dedupe([leadNeedId, ...roleOpportunityIds]),
      needOpportunityId: leadNeedId,
      offerOpportunityId: roleOpportunityIds[0],
    }
  }

  if (matchType === 'circular') {
    const links = payload?.links ?? []
    const linkIds: (string | undefined)[] = []
    for (const link of links) {
      linkIds.push(link.needId, link.offerId)
    }
    return {
      opportunityIds: dedupe(linkIds),
      needOpportunityId: links[0]?.needId,
      offerOpportunityId: links[0]?.offerId,
    }
  }

  // one_way (and any unknown type): preserve the promoted fields exactly.
  const needOpportunityId = match.needOpportunityId ?? payload?.needOpportunityId
  const offerOpportunityId =
    match.offerOpportunityId ?? payload?.offerOpportunityId
  return {
    opportunityIds: dedupe([needOpportunityId, offerOpportunityId]),
    needOpportunityId,
    offerOpportunityId,
  }
}
