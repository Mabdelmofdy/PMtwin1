import type { Opportunity } from '@/types/domain.ts'
import { isWithdrawnOpportunityVisibility } from '@/lib/entity-view-visibility.ts'

/**
 * Opportunities eligible for the publish-matching candidate pool.
 * Requires lifecycle `published` and marketplace visibility not closed/archived.
 */
export function isMatchingPoolOpportunity(
  opportunity: Pick<Opportunity, 'status' | 'visibilityStatus'>,
): boolean {
  if ((opportunity.status ?? '').toLowerCase() !== 'published') return false
  return !isWithdrawnOpportunityVisibility(opportunity)
}
