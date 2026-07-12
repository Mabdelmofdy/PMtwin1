/**
 * Presentation visibility map for Opportunity Details workspaces.
 * Wraps resolveOpportunityDetailVisibility — does not reinvent authorization.
 */

import type { CommercialVisibilityAudience } from '@/domain/opportunity-commercial-structure'
import type {
  OpportunityDetailAccess,
  OpportunityDetailVisibility,
} from '@/lib/entity-view-visibility.ts'

export type WorkspaceId =
  | 'overview'
  | 'scope'
  | 'commercial'
  | 'marketplace'
  | 'matching'
  | 'documents'
  | 'related'
  | 'history'

export const WORKSPACE_IDS: readonly WorkspaceId[] = [
  'overview',
  'scope',
  'commercial',
  'marketplace',
  'matching',
  'documents',
  'related',
  'history',
] as const

export type WorkspaceAccessState =
  | 'ready'
  | 'empty'
  | 'restricted'
  | 'unavailable'

export type OpportunityDetailsWorkspaceVisibility = {
  readonly overview: WorkspaceAccessState
  readonly scope: WorkspaceAccessState
  readonly commercial: WorkspaceAccessState
  readonly marketplace: WorkspaceAccessState
  readonly matching: WorkspaceAccessState
  readonly documents: WorkspaceAccessState
  readonly related: WorkspaceAccessState
  readonly history: WorkspaceAccessState
  readonly showCommandCenter: boolean
  readonly showKpiStrip: boolean
  readonly commercialAudience: CommercialVisibilityAudience
  readonly canViewCommercialAmounts: boolean
  readonly canViewRelatedObjectExistence: boolean
}

function audienceForAccess(access: OpportunityDetailAccess): CommercialVisibilityAudience {
  switch (access) {
    case 'owner':
      return 'owner'
    case 'participant':
      return 'participant'
    case 'admin':
      return 'admin'
    case 'teaser':
    case 'public':
    case 'denied':
    default:
      return 'marketplace'
  }
}

export function resolveCommercialAudience(
  access: OpportunityDetailAccess,
  options?: { readonly isAuditor?: boolean },
): CommercialVisibilityAudience {
  if (options?.isAuditor && access !== 'owner') return 'auditor'
  return audienceForAccess(access)
}

export function buildOpportunityDetailsWorkspaceVisibility(
  visibility: OpportunityDetailVisibility,
  options?: { readonly isAuditor?: boolean },
): OpportunityDetailsWorkspaceVisibility {
  const access = visibility.access
  const commercialAudience = resolveCommercialAudience(access, options)
  const canViewCommercialAmounts =
    commercialAudience === 'owner'
    || commercialAudience === 'participant'
    || commercialAudience === 'admin'
    || commercialAudience === 'auditor'

  if (access === 'denied' || access === 'teaser') {
    return {
      overview: access === 'teaser' ? 'ready' : 'restricted',
      scope: 'restricted',
      commercial: 'restricted',
      marketplace: access === 'teaser' ? 'ready' : 'restricted',
      matching: 'restricted',
      documents: 'restricted',
      related: 'restricted',
      history: 'restricted',
      showCommandCenter: false,
      showKpiStrip: false,
      commercialAudience,
      canViewCommercialAmounts: false,
      canViewRelatedObjectExistence: false,
    }
  }

  const matchingState: WorkspaceAccessState = visibility.showMatchingSection
    ? 'ready'
    : access === 'owner'
      ? 'empty'
      : 'restricted'

  const relatedState: WorkspaceAccessState =
    access === 'owner' || access === 'participant' || access === 'admin'
      ? 'ready'
      : 'restricted'

  return {
    overview: 'ready',
    scope: visibility.showFullDescription ? 'ready' : 'restricted',
    commercial: visibility.showBudgetAndTimeline ? 'ready' : 'restricted',
    marketplace: 'ready',
    matching: matchingState,
    documents: visibility.showFullDescription ? 'ready' : 'restricted',
    related: relatedState,
    history: access === 'owner' || access === 'admin' ? 'ready' : 'ready',
    showCommandCenter: access === 'owner' || access === 'participant',
    showKpiStrip: access === 'owner' || access === 'participant' || access === 'admin',
    commercialAudience,
    canViewCommercialAmounts,
    canViewRelatedObjectExistence: relatedState !== 'restricted',
  }
}

export function parseWorkspaceId(raw: string | null | undefined): WorkspaceId {
  if (!raw) return 'overview'
  const normalized = raw.trim().toLowerCase()
  return (WORKSPACE_IDS as readonly string[]).includes(normalized)
    ? (normalized as WorkspaceId)
    : 'overview'
}

export function workspaceStorageKey(userId: string | undefined, opportunityId: string): string {
  return `pmtwin.opportunity.workspace.${userId ?? 'anon'}.${opportunityId}`
}
