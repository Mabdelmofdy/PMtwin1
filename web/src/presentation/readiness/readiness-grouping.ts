import { mapReadinessReasonToUserMessage } from './readiness-message-mapper.ts'
import type {
  ReadinessIssueGroup,
  ReadinessUserMessage,
} from './readiness-presentation-types.ts'

export type ReadinessGroupingInput = {
  missingRequired?: readonly string[]
  missingRecommended?: readonly string[]
  reasonCodes?: readonly string[]
  recommendedReasonCodes?: readonly string[]
  completedLabels?: readonly string[]
}

function labelToPseudoCode(label: string): string {
  return `LABEL:${label}`
}

export function groupReadinessIssues(
  input: ReadinessGroupingInput,
): ReadinessIssueGroup {
  const required: ReadinessUserMessage[] = []
  const recommended: ReadinessUserMessage[] = []

  for (const code of input.reasonCodes ?? []) {
    required.push(mapReadinessReasonToUserMessage(code, { required: true }))
  }
  for (const label of input.missingRequired ?? []) {
    if (input.reasonCodes?.length) continue
    required.push({
      title: label.replace(/^Add\s+/i, '').replace(/^Missing\s+/i, '') || label,
      description: label,
      stepId: 'opportunity',
      severity: 'required',
    })
  }

  for (const code of input.recommendedReasonCodes ?? []) {
    recommended.push(
      mapReadinessReasonToUserMessage(code, { required: false }),
    )
  }
  for (const label of input.missingRecommended ?? []) {
    recommended.push({
      title: label,
      description: label,
      stepId: 'scope_work',
      severity: 'recommended',
    })
  }

  const completed: ReadinessUserMessage[] = (input.completedLabels ?? []).map(
    (label) => ({
      title: label,
      description: 'Completed',
      stepId: 'review',
      severity: 'completed' as const,
    }),
  )

  void labelToPseudoCode
  return { required, recommended, completed }
}
