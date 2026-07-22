import { toast } from 'sonner'
import type { RunPublishMatchingUiActionResult } from '@/lib/run-publish-matching-ui-action.ts'

export type PublishMatchingSuccessResult = Extract<
  RunPublishMatchingUiActionResult,
  { readonly success: true }
>

export function showPublishMatchingFeedback(
  result: PublishMatchingSuccessResult,
): void {
  if (result.auditWarning) {
    toast.warning(result.auditWarning, {
      description: buildPublishMatchingSummary(result),
    })
    return
  }

  if (result.matchingErrors.length > 0) {
    toast.warning('Matching completed with errors.', {
      description: buildPublishMatchingSummary(result),
    })
    return
  }

  toast.success('Matching complete.', {
    description: buildPublishMatchingSummary(result),
  })
}

function buildPublishMatchingSummary(result: PublishMatchingSuccessResult): string {
  const parts: string[] = [
    `Run ${result.runId}`,
    `${result.opportunitiesProcessed} published opportunit${
      result.opportunitiesProcessed === 1 ? 'y' : 'ies'
    }`,
  ]

  if (result.discoveredMatchesCount > 0) {
    const noun = result.discoveredMatchesCount === 1 ? 'match' : 'matches'
    parts.push(`${result.discoveredMatchesCount} new ${noun} discovered`)
  } else {
    parts.push('no new Need↔Offer matches discovered')
  }

  if (result.skippedDuplicatesCount > 0) {
    const noun = result.skippedDuplicatesCount === 1 ? 'duplicate' : 'duplicates'
    parts.push(`${result.skippedDuplicatesCount} ${noun} skipped`)
  }

  if (result.matchingErrors.length > 0) {
    parts.push(`${result.matchingErrors.length} command error(s)`)
  }

  return parts.join('. ') + '.'
}

export function showPublishMatchingAccessDenied(message: string): void {
  toast.error(message)
}
