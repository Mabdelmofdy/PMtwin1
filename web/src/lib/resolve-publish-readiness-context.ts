import type { ProfileKind } from '@/domain/profile-readiness/types.ts'
import type { Opportunity } from '@/types/domain.ts'
import { companyRepository, userRepository } from '@/repositories/index.ts'

export type PublishReadinessUiContext = {
  readonly profile?: object | null
  readonly profileKind: ProfileKind
  readonly opportunity?: object | null
  /** Consumed by evaluatePublishValidation — not recalculated from readiness. */
  readonly vettingApproved?: boolean
}

function isVettingApproved(profile: { vetting?: { reviewProgress?: string } } | null | undefined): boolean {
  const progress = profile?.vetting?.reviewProgress
  // Legacy / seed profiles without vetting metadata are treated as approved.
  if (!profile?.vetting) return true
  return progress === 'approved'
}

export function resolvePublishReadinessContextForOpportunity(
  opportunity: Opportunity | object | null,
): PublishReadinessUiContext {
  const record = opportunity as Opportunity | null
  const creatorId = record?.creatorId
  if (!creatorId) {
    return { profile: null, profileKind: 'individual', opportunity, vettingApproved: true }
  }

  const creator =
    userRepository.getById(creatorId) ?? companyRepository.getById(creatorId)
  if (!creator) {
    return { profile: null, profileKind: 'individual', opportunity, vettingApproved: true }
  }

  return {
    profile: creator.profile,
    profileKind: creator.profile?.type === 'company' ? 'company' : 'individual',
    opportunity,
    vettingApproved: isVettingApproved(creator.profile),
  }
}
