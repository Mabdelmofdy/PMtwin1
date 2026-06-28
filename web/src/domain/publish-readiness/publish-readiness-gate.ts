import { evaluateOpportunityReadiness } from '@/domain/opportunity-readiness/opportunity-readiness-evaluator.ts'
import { evaluateProfileReadiness } from '@/domain/profile-readiness/profile-readiness-evaluator.ts'
import type { ProfileReadinessProfile } from '@/domain/profile-readiness/types.ts'
import type { OpportunityReadinessOpportunity } from '@/domain/opportunity-readiness/types.ts'
import type {
  PublishReadinessInput,
  PublishReadinessResult,
} from '@/domain/publish-readiness/types.ts'

export const PUBLISH_READINESS_BLOCKED_MESSAGE =
  'Complete your profile and opportunity details before publishing for matching.' as const

export const PUBLISH_READINESS_BLOCKED_CODE = 'PUBLISH_READINESS_BLOCKED' as const

function toProfileInput(profile?: object | null): ProfileReadinessProfile | null {
  if (!profile) return null
  return profile as ProfileReadinessProfile
}

function toOpportunityInput(
  opportunity?: object | null,
): OpportunityReadinessOpportunity | null {
  if (!opportunity) return null
  return opportunity as OpportunityReadinessOpportunity
}

export function evaluatePublishReadiness(
  input: PublishReadinessInput,
): PublishReadinessResult {
  const profileReadiness = evaluateProfileReadiness({
    profileKind: input.profileKind,
    profile: toProfileInput(input.profile),
  })
  const opportunityReadiness = evaluateOpportunityReadiness(
    toOpportunityInput(input.opportunity),
  )

  const allowed =
    profileReadiness.status === 'ready_for_matching' &&
    opportunityReadiness.status === 'ready_for_matching'

  return {
    allowed,
    code: allowed ? undefined : PUBLISH_READINESS_BLOCKED_CODE,
    reason: allowed ? undefined : PUBLISH_READINESS_BLOCKED_MESSAGE,
    profileReadiness,
    opportunityReadiness,
    missingProfileRequired: profileReadiness.missingRequired,
    missingProfileRecommended: profileReadiness.missingRecommended,
    missingOpportunityRequired: opportunityReadiness.missingRequired,
    missingOpportunityRecommended: opportunityReadiness.missingRecommended,
  }
}

export function formatPublishReadinessDetailLines(
  gate: PublishReadinessResult,
): readonly string[] {
  const lines: string[] = [PUBLISH_READINESS_BLOCKED_MESSAGE]

  const profileMissing = [
    ...gate.missingProfileRequired,
    ...gate.missingProfileRecommended,
  ]
  if (profileMissing.length > 0) {
    lines.push('Profile missing:')
    for (const item of profileMissing) {
      lines.push(`- ${item}`)
    }
  }

  const opportunityMissing = [
    ...gate.missingOpportunityRequired,
    ...gate.missingOpportunityRecommended,
  ]
  if (opportunityMissing.length > 0) {
    lines.push('Opportunity missing:')
    for (const item of opportunityMissing) {
      lines.push(`- ${item}`)
    }
  }

  return lines
}

export function formatPublishReadinessCommandErrors(
  gate: PublishReadinessResult,
): readonly string[] {
  return [...formatPublishReadinessDetailLines(gate)]
}

export function isPublishTargetStatus(targetStatus: string): boolean {
  return targetStatus.trim().toLowerCase() === 'published'
}
