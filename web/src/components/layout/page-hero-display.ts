/**
 * Page hero display helpers — counts and labels for PmPageHeader slots.
 * Display-only; no business logic or data access changes.
 */

import { resolveCanonicalStatus } from '@/lib/status-display'

export type OpportunityListHeroSummary = {
  readonly activeCount: number
  readonly draftCount: number
  readonly publishedCount: number
  readonly inPipelineCount: number
}

/** Summarize opportunity list counts for hero metric and badges. */
export function summarizeOpportunityListHero(
  opportunities: readonly { status?: string }[],
): OpportunityListHeroSummary {
  let activeCount = 0
  let draftCount = 0
  let publishedCount = 0
  let inPipelineCount = 0

  for (const opp of opportunities) {
    const canonical = resolveCanonicalStatus('opportunity', opp.status)
    switch (canonical) {
      case 'draft':
        draftCount += 1
        break
      case 'published':
        publishedCount += 1
        activeCount += 1
        break
      case 'matched':
      case 'negotiating':
      case 'contracted':
      case 'executing':
        inPipelineCount += 1
        activeCount += 1
        break
      case 'completed':
      case 'cancelled':
        break
      default:
        activeCount += 1
        break
    }
  }

  return { activeCount, draftCount, publishedCount, inPipelineCount }
}

/** Count non-terminal opportunities for hero metrics. */
export function countActiveOpportunities(
  opportunities: readonly { status?: string }[],
): number {
  return summarizeOpportunityListHero(opportunities).activeCount
}

/** Total pipeline workflow items across opportunities, matches, and applications (pass 0 when legacy UI suppressed). */
export function countPipelineWorkflowItems(
  opportunityCount: number,
  matchCount: number,
  applicationCount: number,
): number {
  return opportunityCount + matchCount + applicationCount
}

/** Platform health label from existing readiness and matching analytics averages. */
export function formatPlatformHealthMetric(
  profileReadinessAverage: number,
  matchScoreAverage: number,
): string {
  const health = Math.round((profileReadinessAverage + matchScoreAverage) / 2)
  return `${health}%`
}

/** Active collaboration matches — discovered or in progress. */
export function countActiveMatches(
  matches: readonly { status?: string }[],
): number {
  let active = 0
  for (const match of matches) {
    const canonical = resolveCanonicalStatus('match', match.status)
    if (
      canonical === 'discovered' ||
      canonical === 'accepted' ||
      canonical === 'confirmed'
    ) {
      active += 1
    }
  }
  return active
}

/** Active deals — not completed or cancelled. */
export function countActiveDeals(deals: readonly { status?: string }[]): number {
  return deals.filter((deal) => {
    const canonical = resolveCanonicalStatus('deal', deal.status)
    return canonical !== 'completed' && canonical !== 'cancelled'
  }).length
}

/** Active contracts — draft through active lifecycle. */
export function countActiveContracts(
  contracts: readonly { status?: string }[],
): number {
  return contracts.filter((contract) => {
    const canonical = resolveCanonicalStatus('contract', contract.status)
    return canonical !== 'completed' && canonical !== 'terminated'
  }).length
}

/** Active negotiations — not agreed, expired, or cancelled. */
export function countActiveNegotiations(
  negotiations: readonly { status?: string }[],
): number {
  return negotiations.filter((neg) => {
    const canonical = resolveCanonicalStatus('negotiation', neg.status)
    return canonical === 'active' || canonical === 'countered'
  }).length
}
