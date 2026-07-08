import { toCanonical } from '@pm-twin/lifecycle'

const COMMERCIAL_AGREEMENT_ENTITY = 'commercial_agreement' as const
const OPPORTUNITY_ENTITY = 'opportunity' as const

export const COMMERCIAL_AGREEMENT_TO_OPPORTUNITY_SYNC_TARGETS = {
  executing: 'executing',
  completed: 'completed',
  cancelled: 'cancelled',
} as const satisfies Record<string, string>

export type CommercialAgreementOpportunitySyncTrigger =
  keyof typeof COMMERCIAL_AGREEMENT_TO_OPPORTUNITY_SYNC_TARGETS

export function resolveOpportunitySyncTarget(
  commercialAgreementStatus: string | undefined | null,
): string | null {
  const canonical = toCanonical(COMMERCIAL_AGREEMENT_ENTITY, commercialAgreementStatus ?? '')
  if (!canonical) return null
  if (canonical in COMMERCIAL_AGREEMENT_TO_OPPORTUNITY_SYNC_TARGETS) {
    return COMMERCIAL_AGREEMENT_TO_OPPORTUNITY_SYNC_TARGETS[
      canonical as CommercialAgreementOpportunitySyncTrigger
    ]
  }
  return null
}

export function canonicalOpportunityStatus(status: string | undefined | null): string {
  return toCanonical(OPPORTUNITY_ENTITY, status ?? '') ?? ''
}

export function shouldSyncOpportunityFromCommercialAgreement(input: {
  readonly visibilityStatus?: string | null
}): boolean {
  return (input.visibilityStatus ?? '').toLowerCase() !== 'published'
}
