import type { PlatformUser } from '@/types/domain.ts'
import type { ProfileKind } from '@/domain/profile-readiness/types.ts'
import { evaluateProfileReadiness } from '@/domain/profile-readiness/profile-readiness-evaluator.ts'
import { partiesApi } from '@/api/parties.ts'
import { resolveRuntimeProfileSubject } from '@/domain/profile/profile-subject-service.ts'

export function resolveScorableProfileForUser(user: PlatformUser): {
  readonly profile: Record<string, unknown>
  readonly profileKind: ProfileKind
} {
  const activeParty = partiesApi.resolveActiveParty(user.id)
  const subject = resolveRuntimeProfileSubject({
    partyId: activeParty?.id,
    legacyAccountId: user.id,
  })
  if (subject) {
    return {
      profile: (subject.account.profile ?? {}) as Record<string, unknown>,
      profileKind: subject.profileKind,
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

