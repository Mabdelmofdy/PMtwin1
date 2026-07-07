import { toCanonical } from '@pm-twin/lifecycle'

const CONTRACT_ENTITY = 'contract' as const
const COMMERCIAL_AGREEMENT_ENTITY = 'commercial_agreement' as const

export const CONTRACT_TO_COMMERCIAL_AGREEMENT_SYNC_TARGETS = {
  active: 'executing',
  completed: 'completed',
  terminated: 'cancelled',
} as const satisfies Record<string, string>

export type ContractCommercialAgreementSyncTrigger =
  keyof typeof CONTRACT_TO_COMMERCIAL_AGREEMENT_SYNC_TARGETS

export function resolveCommercialAgreementSyncTarget(
  contractStatus: string | undefined | null,
): string | null {
  const canonical = toCanonical(CONTRACT_ENTITY, contractStatus ?? '')
  if (!canonical) return null
  if (canonical in CONTRACT_TO_COMMERCIAL_AGREEMENT_SYNC_TARGETS) {
    return CONTRACT_TO_COMMERCIAL_AGREEMENT_SYNC_TARGETS[
      canonical as ContractCommercialAgreementSyncTrigger
    ]
  }
  return null
}

export function canonicalCommercialAgreementStatus(
  status: string | undefined | null,
): string {
  return toCanonical(COMMERCIAL_AGREEMENT_ENTITY, status ?? '') ?? ''
}
