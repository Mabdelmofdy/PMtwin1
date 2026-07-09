import type { ExplainabilityAdapter } from './explainability-adapter.ts'
import {
  isVettingDocumentGapLabel,
  vettingDocumentLabelToHref,
  vettingDocumentLabelToReasonCode,
  vettingReviewGapLabelToHref,
  vettingReviewGapLabelToReasonCode,
  vettingReviewProgressToReasonCode,
} from './vetting-field-map.ts'
import type {
  VettingDocumentStatus,
  VettingReadinessSnapshot,
} from './vetting-types.ts'
import type { ReasonCode } from '../reason-codes/index.ts'
import { VETTING_REASON_CODES } from '../reason-codes/vetting.ts'
import { ENGINE_ID } from '../types/engine.ts'
import { HEALTH } from '../types/health.ts'
import type { ExplanationBundle } from '../types/bundle.ts'
import type { BlockingFactor } from '../types/blocking.ts'
import type {
  ExplanationReason,
  StrengthWeaknessEntry,
} from '../types/reason.ts'
import type { Recommendation } from '../types/recommendation.ts'
import type { ScoreBreakdownEntry } from '../types/score-breakdown.ts'
import type { TimelineEvent } from '../types/timeline.ts'
import {
  EXPLANATION_SEVERITY,
  RECOMMENDATION_PRIORITY,
  TIMELINE_EVENT_STATUS,
} from '../types/severity.ts'

export const VETTING_ADAPTER_VERSION = '1.0.0' as const

/** Mirrors vetting-readiness-evaluator weights — used for impact estimates only. */
export const VETTING_ADAPTER_SCORE_WEIGHTS = {
  documents: 80,
  review: 20,
} as const

const REQUIRED_DOCUMENT_TYPES = [
  'commercial_registration',
  'vat_certificate',
  'insurance_certificate',
  'license',
  'national_id',
] as const

const DOCUMENT_TYPE_TO_LABEL: Readonly<Record<string, string>> = {
  commercial_registration: 'Document: Commercial Registration',
  vat_certificate: 'Document: VAT Certificate',
  insurance_certificate: 'Document: Insurance Certificate',
  license: 'Document: License',
  national_id: 'Document: National ID',
}

function roundScore(value: number): number {
  return Math.round(value * 100) / 100
}

function resolveGeneratedAt(input: VettingReadinessSnapshot): string {
  return input.evaluatedAt ?? new Date().toISOString()
}

function isActiveAccount(input: VettingReadinessSnapshot): boolean {
  return input.accountStatus === 'active'
}

function resolveHealth(
  input: VettingReadinessSnapshot,
): (typeof HEALTH)[keyof typeof HEALTH] {
  if (isActiveAccount(input) || input.status === 'ready_for_matching') {
    return HEALTH.EXCELLENT
  }
  if (input.status === 'needs_review') {
    return HEALTH.WARNING
  }
  return HEALTH.CRITICAL
}

/** Mirrors scoreDocument() in vetting-readiness-evaluator — breakdown display only. */
function scoreDocumentStatus(status: VettingDocumentStatus | undefined): number {
  if (!status) return 0
  switch (status) {
    case 'approved':
      return 1
    case 'pending_review':
      return 0.65
    case 'rejected':
      return 0.15
    case 'expired':
    case 'replacement_requested':
      return 0.1
    default:
      return 0
  }
}

function resolveDocumentStatus(
  input: VettingReadinessSnapshot,
  type: string,
): VettingDocumentStatus | undefined {
  const entry = input.documents?.find(
    (document) =>
      document.type.trim().toLowerCase().replace(/\s+/g, '_') ===
      type.trim().toLowerCase().replace(/\s+/g, '_'),
  )
  return entry?.status
}

function resolveDocumentTypes(totalRequired: number): readonly string[] {
  return REQUIRED_DOCUMENT_TYPES.slice(0, totalRequired)
}

function isDocumentMissing(input: VettingReadinessSnapshot, type: string): boolean {
  const label = DOCUMENT_TYPE_TO_LABEL[type]
  if (!label) return true
  return input.missingRequired.includes(label)
}

function resolveReviewProgressScore(input: VettingReadinessSnapshot): number {
  if (isActiveAccount(input) || input.reviewProgress === 'approved') {
    return 1
  }
  if (input.reviewProgress === 'in_review') {
    return 0.5
  }
  if (input.reviewProgress === 'changes_requested') {
    return input.changesResolved ? 0.45 : 0.2
  }
  return 0.1
}

function documentImpactPercent(input: VettingReadinessSnapshot): number {
  if (input.documentsProgress.totalRequired === 0) return 0
  return roundScore(
    VETTING_ADAPTER_SCORE_WEIGHTS.documents / input.documentsProgress.totalRequired,
  )
}

function reviewImpactPercent(input: VettingReadinessSnapshot): number {
  const reviewGaps = input.missingRecommended.length
  if (reviewGaps === 0) return 0
  return roundScore(VETTING_ADAPTER_SCORE_WEIGHTS.review / reviewGaps)
}

function gapToReasonCode(label: string): ReasonCode {
  if (isVettingDocumentGapLabel(label)) {
    return vettingDocumentLabelToReasonCode(label)
  }
  return vettingReviewGapLabelToReasonCode(label)
}

function buildSummary(input: VettingReadinessSnapshot): string {
  if (isActiveAccount(input)) {
    return 'Vetting is complete — account is active and cleared for matching.'
  }

  if (input.status === 'ready_for_matching') {
    return 'Vetting documents and admin review are complete.'
  }

  if (input.status === 'needs_review') {
    const gapCount =
      input.missingRequired.length + input.missingRecommended.length
    return `Vetting is partially complete — ${gapCount} item${gapCount === 1 ? '' : 's'} still need attention.`
  }

  return 'Vetting is incomplete — upload required documents and complete admin review.'
}

function buildReasons(input: VettingReadinessSnapshot): readonly ExplanationReason[] {
  const reasons: ExplanationReason[] = []

  if (isActiveAccount(input)) {
    reasons.push({
      code: VETTING_REASON_CODES.ACTIVE,
      message: 'Account vetting is active and fully cleared.',
      severity: EXPLANATION_SEVERITY.INFO,
      category: 'summary',
    })
    return reasons
  }

  for (const label of input.missingRequired) {
    reasons.push({
      code: vettingDocumentLabelToReasonCode(label),
      message: `Required document missing or unapproved: ${label.replace(/^Document:\s*/, '')}.`,
      severity: EXPLANATION_SEVERITY.CRITICAL,
      category: 'required',
      relatedEntityId: input.entityId,
    })
  }

  for (const label of input.missingRecommended) {
    reasons.push({
      code: vettingReviewGapLabelToReasonCode(label),
      message: `Review action needed: ${label}.`,
      severity: EXPLANATION_SEVERITY.WARNING,
      category: 'recommended',
      relatedEntityId: input.entityId,
    })
  }

  if (reasons.length === 0) {
    reasons.push({
      code: VETTING_REASON_CODES.COMPLETE,
      message: 'All vetting requirements are satisfied.',
      severity: EXPLANATION_SEVERITY.INFO,
      category: 'summary',
    })
  }

  return reasons
}

function buildBlockers(input: VettingReadinessSnapshot): readonly BlockingFactor[] {
  if (isActiveAccount(input)) {
    return []
  }

  const blockers: BlockingFactor[] = []

  for (const label of input.missingRequired) {
    blockers.push({
      reasonCode: vettingDocumentLabelToReasonCode(label),
      severity: EXPLANATION_SEVERITY.CRITICAL,
      blockingEntity: input.entityId,
      resolutionHint: `Upload and get approval for ${label.replace(/^Document:\s*/, '')}.`,
    })
  }

  for (const label of input.missingRecommended) {
    if (label === 'Resolve requested changes and resubmit') {
      blockers.push({
        reasonCode: VETTING_REASON_CODES.REVIEW_CHANGES_REQUESTED,
        severity: EXPLANATION_SEVERITY.CRITICAL,
        blockingEntity: input.entityId,
        resolutionHint: 'Address admin feedback and resubmit documents for review.',
      })
    }
  }

  return blockers
}

function buildStrengths(
  input: VettingReadinessSnapshot,
): readonly StrengthWeaknessEntry[] {
  const strengths: StrengthWeaknessEntry[] = []

  if (isActiveAccount(input)) {
    strengths.push({
      code: VETTING_REASON_CODES.ACTIVE,
      label: 'Active vetted account',
      impactPercent: 100,
    })
    return strengths
  }

  if (
    input.documentsProgress.approvedRequired === input.documentsProgress.totalRequired &&
    input.documentsProgress.totalRequired > 0
  ) {
    strengths.push({
      code: VETTING_REASON_CODES.DOCUMENTS_COMPLETE,
      label: 'All required documents approved',
      impactPercent: VETTING_ADAPTER_SCORE_WEIGHTS.documents,
    })
  }

  if (input.reviewProgress === 'approved') {
    strengths.push({
      code: VETTING_REASON_CODES.REVIEW_APPROVED,
      label: 'Admin review approved',
      impactPercent: VETTING_ADAPTER_SCORE_WEIGHTS.review,
    })
  }

  if (input.status === 'ready_for_matching') {
    strengths.push({
      code: VETTING_REASON_CODES.COMPLETE,
      label: 'Vetting ready for matching',
      impactPercent: 100,
    })
  }

  return strengths
}

function buildWeaknesses(
  input: VettingReadinessSnapshot,
): readonly StrengthWeaknessEntry[] {
  const weaknesses: StrengthWeaknessEntry[] = []

  for (const label of input.missingRequired) {
    weaknesses.push({
      code: vettingDocumentLabelToReasonCode(label),
      label: label.replace(/^Document:\s*/, ''),
      impactPercent: documentImpactPercent(input),
    })
  }

  for (const label of input.missingRecommended) {
    weaknesses.push({
      code: vettingReviewGapLabelToReasonCode(label),
      label,
      impactPercent: reviewImpactPercent(input),
    })
  }

  return weaknesses
}

function recommendationPriority(
  isDocument: boolean,
  label: string,
  status: VettingReadinessSnapshot['status'],
): (typeof RECOMMENDATION_PRIORITY)[keyof typeof RECOMMENDATION_PRIORITY] {
  if (isDocument) {
    return status === 'incomplete'
      ? RECOMMENDATION_PRIORITY.CRITICAL
      : RECOMMENDATION_PRIORITY.HIGH
  }
  if (label === 'Resolve requested changes and resubmit') {
    return RECOMMENDATION_PRIORITY.CRITICAL
  }
  return RECOMMENDATION_PRIORITY.MEDIUM
}

function buildRecommendationEntry(
  input: VettingReadinessSnapshot,
  label: string,
  isDocument: boolean,
  index: number,
): Recommendation {
  const reasonCode = gapToReasonCode(label)
  const impactPercent = isDocument
    ? documentImpactPercent(input)
    : reviewImpactPercent(input)
  const slug = isDocument
    ? reasonCode.replace('DOCUMENT_', '').toLowerCase()
    : reasonCode.replace('VETTING_', '').toLowerCase()

  return {
    id: `vetting-rec-${slug}-${index}`,
    label: input.recommendations[index] ?? label,
    reasonCode,
    priority: recommendationPriority(isDocument, label, input.status),
    impactPercent,
    estimatedScore: roundScore(Math.min(100, input.score + impactPercent)),
    href: isDocument
      ? vettingDocumentLabelToHref(label)
      : vettingReviewGapLabelToHref(label),
    category: isDocument ? 'required' : 'recommended',
    severity: isDocument
      ? EXPLANATION_SEVERITY.CRITICAL
      : label === 'Resolve requested changes and resubmit'
        ? EXPLANATION_SEVERITY.CRITICAL
        : EXPLANATION_SEVERITY.WARNING,
  }
}

function buildRecommendationsFromSnapshot(
  input: VettingReadinessSnapshot,
): readonly Recommendation[] {
  const recommendations: Recommendation[] = []
  let index = 0

  for (const label of input.missingRequired) {
    recommendations.push(buildRecommendationEntry(input, label, true, index))
    index += 1
  }

  for (const label of input.missingRecommended) {
    recommendations.push(buildRecommendationEntry(input, label, false, index))
    index += 1
  }

  return recommendations
}

function buildBreakdownFromSnapshot(
  input: VettingReadinessSnapshot,
): readonly ScoreBreakdownEntry[] {
  const totalRequired =
    input.documentsProgress.totalRequired || REQUIRED_DOCUMENT_TYPES.length

  let weightedDocumentScore = 0
  const documentReasonCodes = input.missingRequired.map(vettingDocumentLabelToReasonCode)

  if (isActiveAccount(input)) {
    weightedDocumentScore = totalRequired
  } else {
    for (const type of resolveDocumentTypes(totalRequired)) {
      if (input.documents && input.documents.length > 0) {
        weightedDocumentScore += scoreDocumentStatus(resolveDocumentStatus(input, type))
      } else {
        weightedDocumentScore += isDocumentMissing(input, type) ? 0 : 1
      }
    }
  }

  const documentRatio = totalRequired === 0 ? 1 : weightedDocumentScore / totalRequired
  const reviewRatio = resolveReviewProgressScore(input)

  const reviewReasonCodes: ReasonCode[] = []
  if (!isActiveAccount(input) && input.reviewProgress !== 'approved') {
    reviewReasonCodes.push(vettingReviewProgressToReasonCode(input.reviewProgress))
  }
  for (const label of input.missingRecommended) {
    const code = vettingReviewGapLabelToReasonCode(label)
    if (!reviewReasonCodes.includes(code)) {
      reviewReasonCodes.push(code)
    }
  }

  return [
    {
      label: 'Documents',
      weight: VETTING_ADAPTER_SCORE_WEIGHTS.documents,
      score: roundScore(documentRatio * VETTING_ADAPTER_SCORE_WEIGHTS.documents),
      maxScore: VETTING_ADAPTER_SCORE_WEIGHTS.documents,
      reasonCodes: documentReasonCodes,
    },
    {
      label: 'Review',
      weight: VETTING_ADAPTER_SCORE_WEIGHTS.review,
      score: roundScore(reviewRatio * VETTING_ADAPTER_SCORE_WEIGHTS.review),
      maxScore: VETTING_ADAPTER_SCORE_WEIGHTS.review,
      reasonCodes: reviewReasonCodes,
    },
  ]
}

function buildTimelineFromSnapshot(
  input: VettingReadinessSnapshot,
): readonly TimelineEvent[] {
  const events: TimelineEvent[] = []

  if (input.createdAt) {
    events.push({
      type: 'vetting-started',
      title: 'Vetting started',
      description: 'Party entered the vetting workflow.',
      timestamp: input.createdAt,
      status: TIMELINE_EVENT_STATUS.COMPLETED,
      relatedEntity: input.entityId,
    })
  }

  if (input.documents) {
    for (const document of input.documents) {
      if (!document.uploadedAt) continue
      events.push({
        type: 'vetting-document-uploaded',
        title: `Document uploaded: ${document.type.replace(/_/g, ' ')}`,
        description: `Uploaded ${document.type.replace(/_/g, ' ')} for vetting review.`,
        timestamp: document.uploadedAt,
        status:
          document.status === 'approved'
            ? TIMELINE_EVENT_STATUS.COMPLETED
            : document.status === 'rejected'
              ? TIMELINE_EVENT_STATUS.BLOCKED
              : TIMELINE_EVENT_STATUS.ACTIVE,
        relatedEntity: input.entityId,
      })
    }
  }

  if (input.reviewStartedAt) {
    events.push({
      type: 'vetting-review-started',
      title: 'Admin review started',
      description: 'Vetting documents submitted for admin review.',
      timestamp: input.reviewStartedAt,
      status:
        input.reviewProgress === 'approved'
          ? TIMELINE_EVENT_STATUS.COMPLETED
          : TIMELINE_EVENT_STATUS.ACTIVE,
      relatedEntity: input.entityId,
    })
  }

  if (input.changesRequestedAt) {
    events.push({
      type: 'vetting-changes-requested',
      title: 'Changes requested',
      description: 'Admin requested changes to submitted vetting documents.',
      timestamp: input.changesRequestedAt,
      status:
        input.changesResolved === true
          ? TIMELINE_EVENT_STATUS.COMPLETED
          : TIMELINE_EVENT_STATUS.BLOCKED,
      relatedEntity: input.entityId,
    })
  }

  if (input.resubmittedAt) {
    events.push({
      type: 'vetting-resubmitted',
      title: 'Documents resubmitted',
      description: 'Updated documents resubmitted after admin feedback.',
      timestamp: input.resubmittedAt,
      status: TIMELINE_EVENT_STATUS.ACTIVE,
      relatedEntity: input.entityId,
    })
  }

  if (input.reviewApprovedAt) {
    events.push({
      type: 'vetting-review-approved',
      title: 'Admin review approved',
      description: 'Vetting admin review completed successfully.',
      timestamp: input.reviewApprovedAt,
      status: TIMELINE_EVENT_STATUS.COMPLETED,
      relatedEntity: input.entityId,
    })
  }

  events.push({
    type: 'vetting-evaluated',
    title: 'Vetting readiness evaluated',
    description: buildSummary(input),
    timestamp: resolveGeneratedAt(input),
    status:
      isActiveAccount(input) || input.status === 'ready_for_matching'
        ? TIMELINE_EVENT_STATUS.COMPLETED
        : input.status === 'needs_review'
          ? TIMELINE_EVENT_STATUS.ACTIVE
          : TIMELINE_EVENT_STATUS.BLOCKED,
    relatedEntity: input.entityId,
  })

  return events.sort(
    (left, right) =>
      new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime(),
  )
}

export function buildVettingExplanation(
  input: VettingReadinessSnapshot,
): ExplanationBundle {
  const generatedAt = resolveGeneratedAt(input)

  return {
    engine: ENGINE_ID.VETTING,
    entityId: input.entityId,
    score: input.score,
    health: resolveHealth(input),
    summary: buildSummary(input),
    scoreBreakdown: buildBreakdownFromSnapshot(input),
    reasons: buildReasons(input),
    blockers: buildBlockers(input),
    strengths: buildStrengths(input),
    weaknesses: buildWeaknesses(input),
    recommendations: buildRecommendationsFromSnapshot(input),
    timeline: buildTimelineFromSnapshot(input),
    metadata: {
      generatedAt,
      engineVersion: VETTING_ADAPTER_VERSION,
      locale: input.locale ?? 'en-SA',
      source: 'vetting-readiness-adapter',
      tags: [input.reviewProgress, input.status],
      extensions: {
        readinessStatus: input.status,
        reviewProgress: input.reviewProgress,
        accountStatus: input.accountStatus ?? null,
        documentsProgress: input.documentsProgress,
      },
    },
  }
}

export const vettingExplainabilityAdapter: ExplainabilityAdapter<VettingReadinessSnapshot> =
  {
    buildExplanation: buildVettingExplanation,
    buildRecommendations: buildRecommendationsFromSnapshot,
    buildBreakdown: buildBreakdownFromSnapshot,
    buildTimeline: buildTimelineFromSnapshot,
  }
