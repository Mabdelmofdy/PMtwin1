import type { PlatformUser } from '@/types/domain.ts'
import type { PartyDocument } from '@/types/party-document.ts'
import type { VettingReadinessResult } from '@/domain/vetting-readiness/types.ts'
import type { ProfileReadinessResult } from '@/domain/profile-readiness/types.ts'
import {
  REQUIRED_VETTING_DOCUMENT_TYPES,
  resolveLatestDocumentsByType,
} from '@/domain/vetting-readiness/vetting-readiness-rules.ts'
import type {
  PendingJourneyStep,
  PendingJourneyStepId,
  PendingJourneyStepState,
  PendingVettingJourneyResult,
} from '@/domain/pending-vetting-journey/types.ts'

const JOURNEY_LABELS: Record<PendingJourneyStepId, string> = {
  account_created: 'Account Created',
  email_verified: 'Email Verified',
  profile_completion: 'Profile Completion',
  upload_documents: 'Upload Documents',
  admin_review: 'Admin Review',
  approved: 'Approved',
}

const PROFILE_COMPLETE_THRESHOLD = 70
const DOCUMENTS_COMPLETE_THRESHOLD = 0.8
const OVERALL_ONBOARDING_WEIGHTS = {
  profile: 0.4,
  vetting: 0.4,
  adminApproval: 0.2,
} as const

export function resolveAdminApprovalProgress(user: PlatformUser): number {
  const reviewProgress = user.profile?.vetting?.reviewProgress
  if (reviewProgress === 'changes_requested') return 0
  if (reviewProgress === 'in_review' && user.profile?.vetting?.lastResubmittedAt) {
    return 50
  }
  if (reviewProgress === 'approved') return 100

  const statusProgressMap: Partial<Record<PlatformUser['status'], number>> = {
    pending_vetting: 0,
    active: 100,
    approved: 100,
    rejected: 0,
  }
  const mappedStatus = statusProgressMap[user.status]
  if (typeof mappedStatus === 'number') return mappedStatus
  return 0
}

export function computeOverallOnboardingPercent(input: {
  readonly profileCompletionScore: number
  readonly vettingScore: number
  readonly adminApprovalProgress: number
}): number {
  const percent =
    input.profileCompletionScore * OVERALL_ONBOARDING_WEIGHTS.profile +
    input.vettingScore * OVERALL_ONBOARDING_WEIGHTS.vetting +
    input.adminApprovalProgress * OVERALL_ONBOARDING_WEIGHTS.adminApproval
  return Math.round(Math.min(100, Math.max(0, percent)))
}

function isProfileStepComplete(
  profile: ProfileReadinessResult,
  profileCompletionUnlocked: boolean,
): boolean {
  return profileCompletionUnlocked && profile.score >= PROFILE_COMPLETE_THRESHOLD
}

function isDocumentsStepComplete(vetting: VettingReadinessResult): boolean {
  const { approvedRequired, totalRequired } = vetting.documentsProgress
  if (totalRequired === 0) return false
  return approvedRequired / totalRequired >= DOCUMENTS_COMPLETE_THRESHOLD
}

function hasExpiredDocuments(documents: readonly PartyDocument[]): boolean {
  const map = resolveLatestDocumentsByType(documents)
  for (const type of REQUIRED_VETTING_DOCUMENT_TYPES) {
    const doc = map.get(type)
    if (doc?.status === 'expired' || doc?.status === 'replacement_requested') {
      return true
    }
  }
  return false
}

function resolveNextBestAction(input: {
  readonly user: PlatformUser
  readonly profile: ProfileReadinessResult
  readonly vetting: VettingReadinessResult
  readonly documents: readonly PartyDocument[]
  readonly steps: readonly PendingJourneyStep[]
}): string {
  const { user, profile, vetting, documents, steps } = input
  const current = steps.find((step) => step.state === 'current')

  if (hasExpiredDocuments(documents)) {
    const map = resolveLatestDocumentsByType(documents)
    for (const type of REQUIRED_VETTING_DOCUMENT_TYPES) {
      const doc = map.get(type)
      if (doc?.status === 'expired' || doc?.status === 'replacement_requested') {
        return `Replace expired ${type.replace(/_/g, ' ')}`
      }
    }
  }

  if (user.profile?.vetting?.reviewProgress === 'changes_requested') {
    return 'Resubmit for review'
  }

  if (current?.id === 'profile_completion' || profile.score < PROFILE_COMPLETE_THRESHOLD) {
    if (profile.recommendations[0]) return profile.recommendations[0]
    return 'Complete profile'
  }

  if (current?.id === 'upload_documents' || vetting.missingRequired.length > 0) {
    const vatMissing = vetting.missingRequired.some((item) =>
      item.toLowerCase().includes('vat'),
    )
    if (vatMissing) return 'Upload VAT'
    const crMissing = vetting.missingRequired.some((item) =>
      item.toLowerCase().includes('commercial registration'),
    )
    if (crMissing) return 'Upload CR'
    if (vetting.recommendations[0]) return vetting.recommendations[0]
    return 'Upload required documents'
  }

  if (current?.id === 'admin_review' || user.profile?.vetting?.reviewProgress === 'in_review') {
    return 'Waiting for admin review'
  }

  if (vetting.recommendations[0]) return vetting.recommendations[0]
  return 'Waiting for admin review'
}

function countStepsRemaining(steps: readonly PendingJourneyStep[]): number {
  return steps.filter((step) => step.state !== 'completed').length
}

function markSteps(
  completion: Record<PendingJourneyStepId, boolean>,
  blocked: Partial<Record<PendingJourneyStepId, boolean>>,
): PendingJourneyStep[] {
  const order: PendingJourneyStepId[] = [
    'account_created',
    'email_verified',
    'profile_completion',
    'upload_documents',
    'admin_review',
    'approved',
  ]

  let currentAssigned = false
  return order.map((id) => {
    let state: PendingJourneyStepState
    if (completion[id]) {
      state = 'completed'
    } else if (blocked[id]) {
      state = 'blocked'
    } else if (!currentAssigned) {
      state = 'current'
      currentAssigned = true
    } else {
      state = 'pending'
    }

    const href =
      id === 'profile_completion'
        ? '/profile'
        : id === 'upload_documents'
          ? '/party-documents'
          : undefined

    return { id, label: JOURNEY_LABELS[id], state, href }
  })
}

export function resolvePendingVettingJourney(input: {
  readonly user: PlatformUser
  readonly profile: ProfileReadinessResult
  readonly profileCompletionUnlocked: boolean
  readonly vetting: VettingReadinessResult
  readonly documents: readonly PartyDocument[]
}): PendingVettingJourneyResult {
  const { user, profile, profileCompletionUnlocked, vetting, documents } = input
  const adminApprovalProgress = resolveAdminApprovalProgress(user)

  const completion: Record<PendingJourneyStepId, boolean> = {
    account_created: Boolean(user.id),
    email_verified: Boolean(user.email?.trim()),
    profile_completion: isProfileStepComplete(profile, profileCompletionUnlocked),
    upload_documents: isDocumentsStepComplete(vetting),
    admin_review: adminApprovalProgress >= 50 || user.profile?.vetting?.reviewProgress === 'in_review',
    approved: user.status === 'active',
  }

  const blocked: Partial<Record<PendingJourneyStepId, boolean>> = {}
  if (!completion.upload_documents && completion.profile_completion) {
    blocked.admin_review = true
  }
  if (user.status === 'rejected') {
    blocked.approved = true
    blocked.admin_review = true
  }

  const steps = markSteps(completion, blocked)
  const overallOnboarding = {
    percent: computeOverallOnboardingPercent({
      profileCompletionScore: profile.score,
      vettingScore: vetting.score,
      adminApprovalProgress,
    }),
    profileWeight: OVERALL_ONBOARDING_WEIGHTS.profile,
    vettingWeight: OVERALL_ONBOARDING_WEIGHTS.vetting,
    adminApprovalWeight: OVERALL_ONBOARDING_WEIGHTS.adminApproval,
    adminApprovalProgress,
  }

  return {
    steps,
    overallOnboarding,
    stepsRemaining: countStepsRemaining(steps),
    nextBestAction: resolveNextBestAction({ user, profile, vetting, documents, steps }),
  }
}
