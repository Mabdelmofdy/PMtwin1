/**
 * Shared opportunity location matching for browse / find / admin search.
 */
import type { Opportunity } from '@/types/domain.ts'
import {
  expandScopeTokens,
  formatLocation,
  normalizeStoredLocation,
  resolveOpportunityCoverageAreas,
  resolveScopeIdFromText,
  resolveScopeLabel,
} from '@/domain/locations'

function normalizeCompare(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

/** All searchable location labels for an opportunity (primary + coverage). */
export function opportunityLocationSearchText(opportunity: Opportunity): string {
  const primary = formatLocation(opportunity.location)
  const coverageIds = resolveOpportunityCoverageAreas(opportunity)
  const coverageLabels = coverageIds.map((id) => resolveScopeLabel(id))
  return [primary, ...coverageLabels].filter(Boolean).join(' ')
}

/**
 * True when any selected filter scope intersects the opportunity's
 * primary location or coverage areas (via downward expansion).
 */
export function opportunityMatchesLocationScopes(
  opportunity: Opportunity,
  scopeIds: readonly string[],
): boolean {
  if (!scopeIds.length) return true

  const primaryId =
    normalizeStoredLocation(opportunity.location) ||
    resolveScopeIdFromText(opportunity.location ?? '') ||
    ''
  const coverageIds = resolveOpportunityCoverageAreas(opportunity)
  const opportunityTokens = new Set(
    [
      ...expandScopeTokens(primaryId ? [primaryId] : []),
      ...expandScopeTokens(coverageIds),
      // Legacy free-text primary still searchable by label
      formatLocation(opportunity.location),
    ]
      .map(normalizeCompare)
      .filter(Boolean),
  )

  for (const filterId of scopeIds) {
    const filterTokens = expandScopeTokens([filterId]).map(normalizeCompare)
    // Also allow exact scope-id containment (descendant / ancestor)
    const id = filterId.trim()
    if (
      primaryId === id ||
      coverageIds.includes(id) ||
      (primaryId && (primaryId.startsWith(`${id}/`) || id.startsWith(`${primaryId}/`))) ||
      coverageIds.some(
        (cov) => cov === id || cov.startsWith(`${id}/`) || id.startsWith(`${cov}/`),
      )
    ) {
      return true
    }
    if (filterTokens.some((token) => opportunityTokens.has(token))) {
      return true
    }
  }
  return false
}

/** Substring match against resolved primary + coverage labels. */
export function opportunityMatchesLocationQuery(
  opportunity: Opportunity,
  query: string,
): boolean {
  if (!query.trim()) return true
  const haystack = opportunityLocationSearchText(opportunity).toLowerCase()
  return haystack.includes(query.trim().toLowerCase())
}
