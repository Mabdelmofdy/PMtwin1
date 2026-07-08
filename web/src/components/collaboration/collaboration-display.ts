/**
 * Collaboration UI display helpers — active step resolution and match type tones.
 * No business logic changes.
 */

import type { CollaborationFlowStep } from '@/components/opportunity/opportunity-collaboration-constants'
import type { PmBadgeTone } from '@/components/ui/pm-badge'
import { formatMatchTypeLabel } from '@/lib/opportunity-matches-read-model.ts'

export const MATCH_TYPE_TONE = {
  one_way: 'info',
  two_way: 'primary',
  consortium: 'warning',
  circular: 'success',
} as const

export function resolveMatchTypeTone(matchType: string): PmBadgeTone {
  const key = matchType.toLowerCase() as keyof typeof MATCH_TYPE_TONE
  return MATCH_TYPE_TONE[key] ?? 'neutral'
}

export function formatMatchTypeBadgeLabel(matchType: string): string {
  return formatMatchTypeLabel(matchType.toLowerCase())
}

export function resolveCollaborationStepFromMatch(options: {
  hasDeal?: boolean
  hasNegotiation?: boolean
}): CollaborationFlowStep {
  if (options.hasDeal) return 'Commercial Agreement'
  if (options.hasNegotiation) return 'Negotiation'
  return 'PostMatch'
}

export function resolveCollaborationStepFromNegotiation(
  hasDeal: boolean,
): CollaborationFlowStep {
  return hasDeal ? 'Commercial Agreement' : 'Negotiation'
}

export function resolveCollaborationStepFromDeal(
  hasContract: boolean,
): CollaborationFlowStep {
  return hasContract ? 'Contract' : 'Commercial Agreement'
}

export function resolveCollaborationStepFromContract(): CollaborationFlowStep {
  return 'Contract'
}
