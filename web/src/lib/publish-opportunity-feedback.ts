import { toast } from 'sonner'
import type { PublishOpportunityUiActionResult } from '@/lib/publish-opportunity-ui-actions.ts'

export const RELATED_MATCHES_SECTION_ID = 'related-matches'

export type PublishSuccessFeedback = {
  readonly variant: 'success' | 'warning'
  readonly message: string
  readonly description?: string
  readonly shouldHighlightRelatedMatches: boolean
}

export type PublishSuccessResult = Extract<
  PublishOpportunityUiActionResult,
  { readonly success: true }
>

function formatMatchCount(count: number, adjective: string): string {
  const noun = count === 1 ? 'match' : 'matches'
  return `${count} ${adjective} ${noun}`
}

export function buildPublishSuccessFeedback(
  result: PublishSuccessResult,
): PublishSuccessFeedback {
  const summaryParts: string[] = []

  if (result.discoveredMatchesCount > 0) {
    summaryParts.push(
      `Opportunity published. ${formatMatchCount(result.discoveredMatchesCount, 'related')} discovered.`,
    )
  } else {
    summaryParts.push('Opportunity published. No matches found yet.')
  }

  if (result.skippedDuplicatesCount > 0) {
    summaryParts.push(
      `${formatMatchCount(result.skippedDuplicatesCount, 'duplicate')} skipped.`,
    )
  }

  const summary = summaryParts.join(' ')
  const hasMatchingErrors = result.matchingErrors.length > 0

  if (hasMatchingErrors) {
    return {
      variant: 'warning',
      message: 'Published, but some matching results could not be saved.',
      description: summary,
      shouldHighlightRelatedMatches: result.discoveredMatchesCount > 0,
    }
  }

  return {
    variant: 'success',
    message: summary,
    shouldHighlightRelatedMatches: result.discoveredMatchesCount > 0,
  }
}

export function showPublishSuccessFeedback(
  result: PublishSuccessResult,
): PublishSuccessFeedback {
  const feedback = buildPublishSuccessFeedback(result)

  if (feedback.variant === 'warning') {
    toast.warning(feedback.message, {
      description: feedback.description,
    })
  } else {
    toast.success(feedback.message, {
      description: feedback.description,
    })
  }

  return feedback
}
