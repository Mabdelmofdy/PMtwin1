import type { ProfileReadinessSnapshot } from '@pm-twin/explainability'
import { getProfileReadinessRules } from '@/domain/profile-readiness/profile-readiness-rules.ts'
import type {
  ProfileKind,
  ProfileReadinessProfile,
  ProfileReadinessResult,
} from '@/domain/profile-readiness/types.ts'

export type ProfileSnapshotOptions = {
  readonly locale?: string
  readonly evaluatedAt?: string
  readonly createdAt?: string
}

export function buildProfileReadinessSnapshot(
  entityId: string,
  profileKind: ProfileKind,
  result: ProfileReadinessResult,
  profile?: ProfileReadinessProfile | null,
  options?: ProfileSnapshotOptions,
): ProfileReadinessSnapshot {
  const { required, recommended } = getProfileReadinessRules(profileKind)
  const hasLock =
    profile != null &&
    Object.prototype.hasOwnProperty.call(profile, 'profileCompletionUnlocked')
  const completionLocked = hasLock && profile?.profileCompletionUnlocked !== true

  return {
    entityId,
    profileKind,
    score: result.score,
    status: result.status,
    missingRequired: result.missingRequired,
    missingRecommended: result.missingRecommended,
    recommendations: result.recommendations,
    requiredTotal: required.length,
    recommendedTotal: recommended.length,
    completionLocked: completionLocked || undefined,
    createdAt: options?.createdAt,
    evaluatedAt: options?.evaluatedAt,
    locale: options?.locale ?? 'en-SA',
  }
}
