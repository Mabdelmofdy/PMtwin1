import type { PlatformUser } from '@/types/domain.ts'
import type { ProfileKind } from '@/domain/profile-readiness/types.ts'
import { evaluateProfileReadiness } from '@/domain/profile-readiness/profile-readiness-evaluator.ts'
import { partiesApi } from '@/api/parties.ts'
import { companyRepository } from '@/repositories/index.ts'

export function resolveScorableProfileForUser(user: PlatformUser): {
  readonly profile: Record<string, unknown>
  readonly profileKind: ProfileKind
} {
  const activeParty = partiesApi.resolveActiveParty(user.id)
  if (activeParty?.partyType === 'company') {
    const company = companyRepository.getById(activeParty.id)
    return {
      profile: (company?.profile ?? {}) as Record<string, unknown>,
      profileKind: 'company',
    }
  }
  return {
    profile: (user.profile ?? {}) as Record<string, unknown>,
    profileKind: 'individual',
  }
}

export function resolveProfileCompletionScore(user: PlatformUser) {
  const { profile, profileKind } = resolveScorableProfileForUser(user)
  return evaluateProfileReadiness({
    profileKind,
    profile,
  })
}

