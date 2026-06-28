import { toast } from 'sonner'
import type { RunCircularMatchingUiActionResult } from '@/lib/run-circular-matching-ui-action.ts'

export type CircularMatchingSuccessResult = Extract<
  RunCircularMatchingUiActionResult,
  { readonly success: true }
>

export function showCircularMatchingFeedback(
  result: CircularMatchingSuccessResult,
): void {
  if (result.auditWarning) {
    toast.warning(result.auditWarning, {
      description: buildCircularMatchingSummary(result),
    })
    return
  }

  if (result.matchingErrors.length > 0) {
    toast.warning('Circular matching completed with errors.', {
      description: buildCircularMatchingSummary(result),
    })
    return
  }

  if (result.discoveredMatchesCount === 0) {
    toast.success('Circular matching complete.', {
      description: buildCircularMatchingSummary(result),
    })
    return
  }

  toast.success('Circular matching complete.', {
    description: buildCircularMatchingSummary(result),
  })
}

function buildCircularMatchingSummary(result: CircularMatchingSuccessResult): string {
  const parts: string[] = [`Run ${result.runId}`]

  if (result.discoveredMatchesCount > 0) {
    const noun = result.discoveredMatchesCount === 1 ? 'match' : 'matches'
    parts.push(`${result.discoveredMatchesCount} circular ${noun} discovered`)
  } else {
    parts.push('no circular chains discovered')
  }

  if (result.skippedDuplicatesCount > 0) {
    const noun = result.skippedDuplicatesCount === 1 ? 'duplicate' : 'duplicates'
    parts.push(`${result.skippedDuplicatesCount} ${noun} skipped`)
  }

  if (result.matchingErrors.length > 0) {
    parts.push(`${result.matchingErrors.length} command error(s)`)
  }

  return parts.join('. ') + (parts.length ? '.' : '')
}

export function showCircularMatchingAccessDenied(message: string): void {
  toast.error(message)
}
