import type { Opportunity, PostMatch } from '@/types/domain.ts'
import { formatFrameworkMatchTypeLabel } from '@/config/need-offer-framework.ts'
import {
  resolveMainCollaborationModelLabel,
  resolveModelTypeLabel,
  resolveSubModelLabel,
} from '@/domain/collaboration/opportunity-collaboration.ts'
import { formatValueExchangeModeLabel } from '@/config/need-offer-framework.ts'
import { deriveMatchingTopology } from '@pm-twin/collaboration-models'

export type CollaborationTaxonomyLabels = {
  readonly mainModel: string
  readonly subModel: string
  readonly modelType: string
  readonly exchangeMode: string
  readonly matchingTopology: string
}

export function formatCollaborationExchangeMode(mode?: string): string {
  if (!mode) return '—'
  return formatValueExchangeModeLabel(mode)
}

export function formatCollaborationMatchTopology(topology?: string): string {
  if (!topology) return '—'
  return formatFrameworkMatchTypeLabel(topology)
}

export function resolveOpportunityTaxonomyLabels(
  opportunity: Pick<
    Opportunity,
    | 'mainCollaborationModel'
    | 'modelType'
    | 'subModelType'
    | 'exchangeMode'
    | 'preferredMatchingTopology'
    | 'acceptedExchangeModes'
    | 'paymentModes'
  >,
): CollaborationTaxonomyLabels {
  const topology =
    opportunity.preferredMatchingTopology
    ?? deriveMatchingTopology({
      mainCollaborationModel: opportunity.mainCollaborationModel,
      modelType: opportunity.modelType,
      subModelType: opportunity.subModelType,
      exchangeMode: opportunity.exchangeMode,
      acceptedExchangeModes:
        opportunity.acceptedExchangeModes ?? opportunity.paymentModes,
    }).topology

  return {
    mainModel: opportunity.mainCollaborationModel
      ? resolveMainCollaborationModelLabel(opportunity.mainCollaborationModel)
      : '—',
    subModel: opportunity.subModelType
      ? resolveSubModelLabel(opportunity.subModelType)
      : '—',
    modelType: opportunity.modelType
      ? resolveModelTypeLabel(opportunity.modelType)
      : '—',
    exchangeMode: formatCollaborationExchangeMode(opportunity.exchangeMode),
    matchingTopology: formatCollaborationMatchTopology(topology),
  }
}

export function resolvePostMatchTopologyLabel(match: Pick<PostMatch, 'matchType'>): string {
  return formatCollaborationMatchTopology(match.matchType)
}

/** Returns true when value looks like a raw taxonomy slug (snake_case id). */
export function looksLikeRawTaxonomyId(value: string): boolean {
  return /^[a-z][a-z0-9]*(_[a-z0-9]+)+$/.test(value.trim())
}

export function isHiringOpportunity(
  opportunity: Pick<Opportunity, 'mainCollaborationModel' | 'modelType' | 'subModelType'>,
): boolean {
  if (opportunity.mainCollaborationModel === 'hiring') return true
  if (opportunity.modelType === 'hiring') return true
  const sub = opportunity.subModelType ?? ''
  return sub === 'professional_hiring' || sub === 'consultant_hiring'
}
