import type { ProfileKind } from '@/domain/profile-readiness/types.ts'
import type { Opportunity } from '@/types/domain.ts'
import { resolveRuntimeProfileSubject } from '@/domain/profile/profile-subject-service.ts'

export type PublishReadinessUiContext = {
  readonly profile?: object | null
  readonly profileKind: ProfileKind
  readonly opportunity?: object | null
  /** Consumed by evaluatePublishValidation — not recalculated from readiness. */
  readonly vettingApproved?: boolean
}

function isVettingApproved(
  profile:
    | { vetting?: { caseStatus?: string; reviewProgress?: string } }
    | null
    | undefined,
): boolean {
  const progress = profile?.vetting?.caseStatus ?? profile?.vetting?.reviewProgress
  // Legacy / seed profiles without vetting metadata are treated as approved.
  if (!profile?.vetting) return true
  return progress === 'approved'
}

export function resolvePublishReadinessContextForOpportunity(
  opportunity: Opportunity | object | null,
): PublishReadinessUiContext {
  const record = opportunity as Opportunity | null
  const subject = resolveRuntimeProfileSubject({
    partyId: record?.ownerPartyId,
    workspaceId: record?.workspaceId,
    legacyAccountId: record?.createdByUserId ?? record?.creatorId,
  })
  if (!subject) {
    return { profile: null, profileKind: 'individual', opportunity, vettingApproved: true }
  }

  return {
    profile: subject.account.profile,
    profileKind: subject.profileKind,
    opportunity,
    vettingApproved: isVettingApproved(subject.account.profile),
  }
}
