/**
 * Opportunity UI display helpers — bucket counts and publish visual state.
 * No business logic changes; uses existing canonical status resolution.
 */

import { resolveCanonicalStatus } from '@/lib/status-display'
import type { Opportunity } from '@/types/domain.ts'
import type { PmBadgeTone } from '@/components/ui/pm-badge'
import { isOpportunityOwnedByContext } from '@/domain/identity/ownership-adapters.ts'
import {
  getReadinessStatusTone,
  type ReadinessStatus,
} from '@/components/readiness/readiness-display'

export type OpportunityIntentKind = 'need' | 'offer' | 'hybrid' | 'unknown'

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
  opportunities: readonly Pick<
    Opportunity,
    'status' | 'creatorId' | 'workspaceId' | 'ownerPartyId'
  >[],
  userId?: string,
  activeContext?: {
    readonly activeWorkspaceId?: string
    readonly activePartyId?: string
  },
): OpportunityDashboardBuckets {
  const scoped = userId
    ? opportunities.filter((opportunity) =>
        isOpportunityOwnedByContext(opportunity, {
          ...activeContext,
          userId,
        }),
      )
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
  if (intent === 'need' || intent === 'request') return 'Need'
  if (intent === 'hybrid') return 'Hybrid'
  return intent ? intent.replace(/_/g, ' ') : '—'
}

/** Normalizes stored intent to a list-badge kind. */
export function resolveOpportunityIntentKind(intent?: string): OpportunityIntentKind {
  if (intent === 'offer') return 'offer'
  if (intent === 'need' || intent === 'request') return 'need'
  if (intent === 'hybrid') return 'hybrid'
  return 'unknown'
}

/** Semantic badge tone for need / offer / hybrid chips on opportunity cards. */
export function resolveOpportunityIntentBadgeTone(intent?: string): PmBadgeTone {
  const kind = resolveOpportunityIntentKind(intent)
  switch (kind) {
    case 'need':
      return 'info'
    case 'offer':
      return 'success'
    case 'hybrid':
      return 'warning'
    default:
      return 'neutral'
  }
}

export function resolveOpportunityOwnerBadgeTone(): PmBadgeTone {
  return 'primary'
}

export type OpportunityOwnershipScope = 'mine' | 'company' | 'marketplace'

export function resolveOpportunityOwnershipScope(input: {
  readonly opportunity: Pick<
    Opportunity,
    'creatorId' | 'organizationId' | 'workspaceId' | 'ownerPartyId'
  >
  readonly viewerUserId?: string | null
  readonly viewerWorkspaceId?: string | null
  readonly viewerPartyId?: string | null
  readonly viewerOrganizationId?: string | null
  readonly creatorOrganizationId?: string | null
}): OpportunityOwnershipScope {
  const { opportunity, viewerUserId, viewerOrganizationId, creatorOrganizationId } = input

  if (
    isOpportunityOwnedByContext(opportunity, {
      userId: viewerUserId,
      activeWorkspaceId: input.viewerWorkspaceId,
      activePartyId: input.viewerPartyId,
    })
  ) {
    return 'mine'
  }

  const sharedOrg =
    viewerOrganizationId &&
    (opportunity.organizationId === viewerOrganizationId ||
      creatorOrganizationId === viewerOrganizationId)

  if (sharedOrg) {
    return 'company'
  }

  return 'marketplace'
}

export function formatOpportunityOwnershipLabel(scope: OpportunityOwnershipScope): string {
  switch (scope) {
    case 'mine':
      return 'Mine'
    case 'company':
      return 'Company'
    case 'marketplace':
      return 'Marketplace'
  }
}

export function resolveOpportunityOwnershipBadgeTone(
  scope: OpportunityOwnershipScope,
): PmBadgeTone {
  switch (scope) {
    case 'mine':
      return 'primary'
    case 'company':
      return 'info'
    case 'marketplace':
      return 'muted'
  }
}
