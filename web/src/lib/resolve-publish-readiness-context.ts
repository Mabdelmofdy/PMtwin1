import type { ProfileKind } from '@/domain/profile-readiness/types.ts'
import type { Opportunity } from '@/types/domain.ts'
import { companyRepository, userRepository } from '@/repositories/index.ts'

export type PublishReadinessUiContext = {
  readonly profile?: object | null
  readonly profileKind: ProfileKind
  readonly opportunity?: object | null
}

export function resolvePublishReadinessContextForOpportunity(
  opportunity: Opportunity | object | null,
): PublishReadinessUiContext {
  const record = opportunity as Opportunity | null
  const creatorId = record?.creatorId
  if (!creatorId) {
    return { profile: null, profileKind: 'individual', opportunity }
  }

  const creator =
    userRepository.getById(creatorId) ?? companyRepository.getById(creatorId)
  if (!creator) {
    return { profile: null, profileKind: 'individual', opportunity }
  }

  return {
    profile: creator.profile,
    profileKind: creator.profile?.type === 'company' ? 'company' : 'individual',
    opportunity,
  }
}
