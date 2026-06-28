import { toCanonical } from '@pm-twin/lifecycle'

const DEAL_ENTITY = 'deal' as const
const OPPORTUNITY_ENTITY = 'opportunity' as const

/** Deal canonical status → downstream Opportunity canonical status (Phase 8.2). */
export const DEAL_TO_OPPORTUNITY_SYNC_TARGETS = {
  executing: 'executing',
  completed: 'completed',
  cancelled: 'cancelled',
} as const satisfies Record<string, string>

export type DealOpportunitySyncTrigger = keyof typeof DEAL_TO_OPPORTUNITY_SYNC_TARGETS

export function resolveOpportunitySyncTarget(
  dealStatus: string | undefined | null,
): string | null {
  const canonical = toCanonical(DEAL_ENTITY, dealStatus ?? '')
  if (!canonical) return null
  if (canonical in DEAL_TO_OPPORTUNITY_SYNC_TARGETS) {
    return DEAL_TO_OPPORTUNITY_SYNC_TARGETS[
      canonical as DealOpportunitySyncTrigger
    ]
  }
  return null
}

export function canonicalOpportunityStatus(
  status: string | undefined | null,
): string {
  return toCanonical(OPPORTUNITY_ENTITY, status ?? '') ?? ''
}
