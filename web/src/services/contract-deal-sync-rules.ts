import { toCanonical } from '@pm-twin/lifecycle'

const CONTRACT_ENTITY = 'contract' as const
const DEAL_ENTITY = 'deal' as const

/** Contract canonical status → downstream Deal canonical status (Phase 8.1). */
export const CONTRACT_TO_DEAL_SYNC_TARGETS = {
  active: 'executing',
  completed: 'completed',
  terminated: 'cancelled',
} as const satisfies Record<string, string>

export type ContractDealSyncTrigger = keyof typeof CONTRACT_TO_DEAL_SYNC_TARGETS

export function resolveDealSyncTarget(
  contractStatus: string | undefined | null,
): string | null {
  const canonical = toCanonical(CONTRACT_ENTITY, contractStatus ?? '')
  if (!canonical) return null
  if (canonical in CONTRACT_TO_DEAL_SYNC_TARGETS) {
    return CONTRACT_TO_DEAL_SYNC_TARGETS[
      canonical as ContractDealSyncTrigger
    ]
  }
  return null
}

export function canonicalDealStatus(status: string | undefined | null): string {
  return toCanonical(DEAL_ENTITY, status ?? '') ?? ''
}
