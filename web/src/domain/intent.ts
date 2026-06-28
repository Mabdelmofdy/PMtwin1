import type { OpportunityIntent } from '@/types/enums.ts'

/**
 * Map legacy or canonical stored intent to canonical OpportunityIntent.
 * Does not mutate storage — use on read/normalize paths only.
 */
export function toCanonicalIntent(
  intent: string | undefined | null,
): OpportunityIntent | undefined {
  if (intent == null || intent === '') return undefined
  const lower = intent.toLowerCase()
  if (lower === 'request' || lower === 'need') return 'need'
  if (lower === 'offer') return 'offer'
  if (lower === 'hybrid') return 'hybrid'
  return undefined
}
