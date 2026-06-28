import {
  hasReadinessGaps,
  type ReadinessResult,
} from '@/components/readiness/readiness-display.ts'

export type ReadinessCta = {
  readonly label: string
  readonly href: string
}

/** Opportunity readiness is owner-only internal guidance. */
export function shouldShowOpportunityReadiness(isOwner: boolean): boolean {
  return isOwner
}

export function isReadinessFullyReady(result: ReadinessResult): boolean {
  return result.status === 'ready_for_matching' && !hasReadinessGaps(result)
}

export function resolveProfileReadinessCta(
  result: ReadinessResult,
): ReadinessCta | null {
  if (isReadinessFullyReady(result)) return null
  return { label: 'Complete profile', href: '/profile#profile-details' }
}

export function resolveOpportunityReadinessCta(
  opportunityId: string | undefined,
  result: ReadinessResult,
  options: { readonly suppressCta?: boolean } = {},
): ReadinessCta | null {
  if (options.suppressCta) return null
  if (isReadinessFullyReady(result)) return null
  if (!opportunityId) return null
  return {
    label: 'Edit opportunity',
    href: `/opportunities/${opportunityId}/edit`,
  }
}
