import { useMemo } from 'react'
import { evaluateProfileReadiness } from '@/domain/profile-readiness/profile-readiness-evaluator.ts'
import type { ProfileKind, ProfileReadinessProfile } from '@/domain/profile-readiness/types.ts'
import { ReadinessCard } from '@/components/readiness/readiness-card.tsx'
import { resolveProfileReadinessCta } from '@/components/readiness/readiness-ui-rules.ts'

export function toProfileReadinessInput(
  profile?: object | null,
): ProfileReadinessProfile | null {
  if (!profile) return null
  return profile as ProfileReadinessProfile
}

export function resolveProfileReadiness(
  profile: object | null | undefined,
  profileKind: ProfileKind,
) {
  return evaluateProfileReadiness({
    profileKind,
    profile: toProfileReadinessInput(profile),
  })
}

export function ProfileReadinessCard({
  profile,
  profileKind,
  title = 'Profile Readiness',
  className,
}: {
  profile?: object | null
  profileKind: ProfileKind
  /** Kept for call-site compatibility; unused after design revert. */
  userId?: string
  title?: string
  className?: string
}) {
  const result = useMemo(
    () => resolveProfileReadiness(profile, profileKind),
    [profile, profileKind],
  )

  const cta = useMemo(() => resolveProfileReadinessCta(result), [result])

  return (
    <ReadinessCard
      title={title}
      result={result}
      className={className}
      cta={cta}
      scoreKindLabel="Profile Readiness"
    />
  )
}
