import type { PublishValidationResult } from '@pm-twin/validation'

/**
 * Maps publish validation output into human-readable explainability lines.
 * Does not change explainability package contracts — codes stay internal.
 */
export function buildPublishValidationExplanationLines(
  result: PublishValidationResult,
): readonly string[] {
  const lines: string[] = []
  for (const issue of result.blockingIssues) {
    lines.push(issue.message)
  }
  for (const recommendation of result.recommendations) {
    if (!lines.includes(recommendation)) {
      lines.push(recommendation)
    }
  }
  for (const warning of result.warnings) {
    lines.push(warning.message)
  }
  return lines.filter((line) => !line.includes('VAL_'))
}
