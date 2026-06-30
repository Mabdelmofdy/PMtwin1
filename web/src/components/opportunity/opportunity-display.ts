/**
 * Opportunity UI display helpers — bucket counts and publish visual state.
 * No business logic changes; uses existing canonical status resolution.
 */

import { resolveCanonicalStatus } from '@/lib/status-display'
import {
  getReadinessStatusTone,
  type ReadinessStatus,
} from '@/components/readiness/readiness-display'

export type OpportunityDashboardBuckets = {
  readonly drafts: number
  readonly published: number
  readonly matched: number
  readonly negotiating: number
  readonly completed: number
}

export type PublishVisualState = 'draft' | 'ready' | 'blocked' | 'published'

/** Counts opportunities by canonical pipeline stage for dashboard widgets. */
export function countOpportunityBuckets(
  opportunities: readonly { status?: string; creatorId?: string }[],
  userId?: string,
): OpportunityDashboardBuckets {
  const scoped = userId
    ? opportunities.filter((o) => o.creatorId === userId)
    : opportunities

  let drafts = 0
  let published = 0
  let matched = 0
  let negotiating = 0
  let completed = 0

  for (const opp of scoped) {
    const canonical = resolveCanonicalStatus('opportunity', opp.status)
    switch (canonical) {
      case 'draft':
        drafts += 1
        break
      case 'published':
        published += 1
        break
      case 'matched':
        matched += 1
        break
      case 'negotiating':
      case 'contracted':
      case 'executing':
        negotiating += 1
        break
      case 'completed':
      case 'cancelled':
        completed += 1
        break
      default:
        published += 1
    }
  }

  return { drafts, published, matched, negotiating, completed }
}

/** Visual publish state for UI chrome — does not gate publish. */
export function resolvePublishVisualState(
  opportunityStatus: string | undefined,
  readinessStatus: ReadinessStatus,
): PublishVisualState {
  const canonical = resolveCanonicalStatus('opportunity', opportunityStatus)
  if (canonical === 'published' || canonical === 'matched' || canonical === 'negotiating') {
    return 'published'
  }
  const tone = getReadinessStatusTone(readinessStatus)
  if (tone === 'ready') return 'ready'
  if (tone === 'incomplete') return 'blocked'
  return 'draft'
}

export function formatOpportunityIntent(intent?: string): string {
  if (intent === 'offer') return 'Offer'
  if (intent === 'need') return 'Need'
  if (intent === 'hybrid') return 'Hybrid'
  return intent ? intent.replace(/_/g, ' ') : '—'
}
