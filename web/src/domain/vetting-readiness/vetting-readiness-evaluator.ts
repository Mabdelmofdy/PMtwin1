import type { PartyDocument } from '@/types/party-document.ts'
import {
  buildDocRequirementKey,
  REQUIRED_VETTING_DOCUMENT_TYPES,
  resolveLatestDocumentsByType,
} from '@/domain/vetting-readiness/vetting-readiness-rules.ts'
import type {
  VettingReadinessInput,
  VettingReadinessResult,
} from '@/domain/vetting-readiness/types.ts'

function toRecommendations(
  missingRequired: readonly string[],
  missingRecommended: readonly string[],
): readonly string[] {
  return [...missingRequired, ...missingRecommended].map((item) => {
    if (item.startsWith('Document: ')) {
      return `Upload ${item.replace('Document: ', '')}`
    }
    return item
  })
}

function scoreDocument(document: PartyDocument | undefined): number {
  if (!document) return 0
  switch (document.status) {
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

function resolveStatus(score: number, missingRequiredCount: number): VettingReadinessResult['status'] {
  if (score < 60 || missingRequiredCount > 0) return 'incomplete'
  if (score < 90) return 'needs_review'
  return 'ready_for_matching'
}

export function evaluateVettingReadiness(input: VettingReadinessInput): VettingReadinessResult {
  if (input.accountStatus === 'active') {
    return {
      score: 100,
      status: 'ready_for_matching',
      missingRequired: [],
      missingRecommended: [],
      recommendations: [],
      documentsProgress: {
        approvedRequired: REQUIRED_VETTING_DOCUMENT_TYPES.length,
        totalRequired: REQUIRED_VETTING_DOCUMENT_TYPES.length,
      },
    }
  }

  const documentMap = resolveLatestDocumentsByType(input.documents ?? [])
  let weightedDocumentScore = 0
  let approvedRequired = 0
  const missingRequired: string[] = []

  for (const type of REQUIRED_VETTING_DOCUMENT_TYPES) {
    const key = type
    const document = documentMap.get(key)
    weightedDocumentScore += scoreDocument(document)
    if (!document || document.status !== 'approved') {
      missingRequired.push(buildDocRequirementKey(type))
    } else {
      approvedRequired += 1
    }
  }

  const requiredTotal = REQUIRED_VETTING_DOCUMENT_TYPES.length
  const docScore = weightedDocumentScore / requiredTotal
  const reviewScore = input.reviewProgress === 'approved'
    ? 1
    : input.reviewProgress === 'in_review'
      ? 0.5
      : input.reviewProgress === 'changes_requested'
        ? input.changesResolved
          ? 0.45
          : 0.2
        : 0.1

  const missingRecommended: string[] = []
  if (input.reviewProgress !== 'in_review' && input.reviewProgress !== 'approved') {
    missingRecommended.push('Start admin review')
  }
  if (input.reviewProgress === 'changes_requested' && !input.changesResolved) {
    missingRecommended.push('Resolve requested changes and resubmit')
  }

  const score = Math.round((docScore * 0.8 + reviewScore * 0.2) * 100)

  return {
    score,
    status: resolveStatus(score, missingRequired.length),
    missingRequired,
    missingRecommended,
    recommendations: toRecommendations(missingRequired, missingRecommended),
    documentsProgress: {
      approvedRequired,
      totalRequired: requiredTotal,
    },
  }
}

