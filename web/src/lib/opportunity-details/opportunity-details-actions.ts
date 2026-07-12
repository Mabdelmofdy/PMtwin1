/**
 * Capability map for Opportunity Details — presentation only.
 * Visible actions still execute through existing command / UI services.
 */

import type { Opportunity } from '@/types/domain.ts'
import type { OpportunityDetailVisibility } from '@/lib/entity-view-visibility.ts'
import { canShowPublishOpportunity } from '@/lib/publish-opportunity-ui-actions.ts'
import { resolveCanonicalStatus } from '@/lib/status-display.ts'

export type OpportunityDetailsCapabilities = {
  readonly canEdit: boolean
  readonly canPublish: boolean
  readonly canDuplicateDraft: boolean
  readonly canDuplicateTemplate: boolean
  readonly canClose: boolean
  readonly canArchive: boolean
  readonly canDeleteDraft: boolean
  readonly canShare: boolean
  readonly canCopyLink: boolean
  readonly canPrint: boolean
  readonly canExportJson: boolean
  readonly canExportPdf: boolean
  readonly canOpenMarketplace: boolean
  readonly canOpenMatching: boolean
  readonly canViewReadinessDetails: boolean
  readonly canViewCommercialDetails: boolean
  readonly canViewRelatedObjects: boolean
  readonly canViewHistory: boolean
  readonly isReadOnly: boolean
}

export type ResolveCapabilitiesInput = {
  readonly opportunity: Opportunity
  readonly visibility: OpportunityDetailVisibility
  readonly userId?: string | null
  readonly canMutate?: boolean
  readonly isAuditor?: boolean
  readonly canViewCommercialAmounts?: boolean
}

export function resolveOpportunityDetailsCapabilities(
  input: ResolveCapabilitiesInput,
): OpportunityDetailsCapabilities {
  const {
    opportunity,
    visibility,
    userId,
    canMutate = true,
    isAuditor = false,
    canViewCommercialAmounts = false,
  } = input

  const isOwner = visibility.access === 'owner'
  const isAdmin = visibility.access === 'admin'
  const status = resolveCanonicalStatus('opportunity', opportunity.status)
  const visibilityStatus = (opportunity.visibilityStatus ?? '').toLowerCase()
  const isDraft = status === 'draft'
  const isArchived = visibilityStatus === 'archived'
  const isClosed = ['closed', 'cancelled', 'completed'].includes(status)
  const mutate = canMutate && !isAuditor

  const canPublish = mutate
    && canShowPublishOpportunity(opportunity, {
      userId,
      canMutate: mutate,
      isOpportunityOwner: isOwner,
    })

  return {
    canEdit: mutate && isOwner && !isArchived && !isClosed,
    canPublish,
    canDuplicateDraft: mutate && isOwner,
    canDuplicateTemplate: mutate && isOwner,
    canClose: mutate && isOwner && !isDraft && !isClosed && !isArchived,
    canArchive: mutate && isOwner && !isDraft && !isArchived,
    canDeleteDraft: mutate && isOwner && isDraft,
    canShare: true,
    canCopyLink: true,
    canPrint: true,
    canExportJson: isOwner || isAdmin,
    canExportPdf: isOwner || isAdmin,
    canOpenMarketplace: true,
    canOpenMatching: visibility.showMatchingSection || isOwner,
    canViewReadinessDetails: visibility.showReadiness,
    canViewCommercialDetails: canViewCommercialAmounts,
    canViewRelatedObjects:
      isOwner || visibility.access === 'participant' || isAdmin,
    canViewHistory: visibility.access !== 'denied' && visibility.access !== 'teaser',
    isReadOnly: isAuditor || !mutate,
  }
}
