import type {
  PublishValidationInput,
  PublishValidationResult,
  ValidationIssue,
} from '../types.ts'
import { VAL_CODES } from '../rules/codes.ts'
import { messageForCode } from '../messages/catalog.ts'
import { shouldBlockOperation } from '../engine/run-rules.ts'

const PUBLISH_SCOPE = ['publish'] as const

function publishIssue(
  code: string,
  fieldPaths: readonly string[] = [],
): ValidationIssue {
  return {
    code,
    source: 'publish',
    severity: 'blocker',
    scope: PUBLISH_SCOPE,
    fieldPaths,
    message: messageForCode(code),
    layer: 'publish',
    group: 'publish',
  }
}

/**
 * Sole publish gate composer.
 * Does NOT recalculate readiness — consumes publishReadiness snapshot only.
 */
export function evaluatePublishValidation(
  input: PublishValidationInput,
): PublishValidationResult {
  const blockingIssues: ValidationIssue[] = []
  const warnings: ValidationIssue[] = []
  const recommendations: string[] = []

  const { publishReadiness, vettingStatus, fieldResult, businessResult } = input

  if (!publishReadiness.profileReady) {
    blockingIssues.push(publishIssue(VAL_CODES.PUBLISH_PROFILE_INCOMPLETE, ['profile']))
    recommendations.push(messageForCode(VAL_CODES.PUBLISH_PROFILE_INCOMPLETE))
    for (const item of publishReadiness.missingProfileRequired ?? []) {
      recommendations.push(`Complete profile field: ${item}`)
    }
  }

  if (!vettingStatus.approved) {
    blockingIssues.push(
      publishIssue(VAL_CODES.PUBLISH_VETTING_NOT_APPROVED, ['vetting']),
    )
    recommendations.push(messageForCode(VAL_CODES.PUBLISH_VETTING_NOT_APPROVED))
  }

  if (!publishReadiness.opportunityPublishReady) {
    blockingIssues.push(
      publishIssue(VAL_CODES.PUBLISH_READINESS_BELOW_THRESHOLD, ['readiness']),
    )
    recommendations.push(messageForCode(VAL_CODES.PUBLISH_READINESS_BELOW_THRESHOLD))
    for (const item of publishReadiness.missingOpportunityRequired ?? []) {
      recommendations.push(`Complete opportunity field: ${item}`)
    }
  }

  const fieldBlocking = fieldResult.issues.filter((i) =>
    shouldBlockOperation([i], 'publish'),
  )
  if (fieldBlocking.length > 0) {
    blockingIssues.push(...fieldBlocking)
    recommendations.push(messageForCode(VAL_CODES.PUBLISH_FIELD_ERRORS))
  }

  const businessBlocking = businessResult.issues.filter((i) =>
    shouldBlockOperation([i], 'publish'),
  )
  if (businessBlocking.length > 0) {
    blockingIssues.push(...businessBlocking)
    recommendations.push(messageForCode(VAL_CODES.PUBLISH_BUSINESS_ERRORS))
  }

  for (const issue of [...fieldResult.issues, ...businessResult.issues]) {
    if (issue.severity === 'warning' && !shouldBlockOperation([issue], 'publish')) {
      warnings.push(issue)
    }
  }

  const uniqueRecommendations = [...new Set(recommendations)]

  return {
    status: blockingIssues.length === 0 ? 'allowed' : 'blocked',
    blockingIssues,
    warnings,
    recommendations: uniqueRecommendations,
  }
}

export function formatPublishValidationMessages(
  result: PublishValidationResult,
): readonly string[] {
  return result.blockingIssues.map((i) => i.message)
}
