import type { OpportunityPost, NormalizedPost } from '@pm-twin/matching'
import type { Opportunity } from '@/types/domain.ts'
import {
  expandScopeTokens,
  formatLocation,
  normalizeStoredLocation,
  resolveOpportunityCoverageAreas,
} from '@/domain/locations'

type OpportunityWithNormalized = Opportunity & {
  readonly normalized?: OpportunityPost['normalized']
  readonly exchangeData?: Readonly<Record<string, unknown>>
  readonly value_exchange?: OpportunityPost['value_exchange']
  readonly attributes?: Readonly<Record<string, unknown>> & {
    readonly targetRole?: string
    readonly memberRoles?: unknown
    readonly partnerRoles?: unknown
  }
  readonly scope?: Readonly<Record<string, unknown>> & {
    readonly requiredSkills?: string[]
    readonly sectors?: string[]
  }
}

function mapIntentToEngine(intent?: string): string {
  if (intent === 'need') return 'request'
  return intent ?? 'request'
}

/**
 * Derive engine location label + coverage tokens from stored canonical IDs.
 * Never persists — OpportunityPost is a transient matching DTO.
 */
function deriveNormalizedLocationFields(
  opportunity: Opportunity,
  existing: NormalizedPost | undefined,
): Pick<NormalizedPost, 'location' | 'coverageScopes'> {
  const locationId = normalizeStoredLocation(opportunity.location)
  const locationLabel = formatLocation(locationId || opportunity.location)
  const coverageIds = resolveOpportunityCoverageAreas(opportunity)
  const coverageScopes = expandScopeTokens(coverageIds)

  return {
    location: locationLabel || existing?.location,
    coverageScopes:
      coverageScopes.length > 0
        ? coverageScopes
        : existing?.coverageScopes,
  }
}

/** Maps web Opportunity → @pm-twin/matching OpportunityPost (engine input DTO). */
export function opportunityToPost(opportunity: Opportunity): OpportunityPost {
  const record = opportunity as OpportunityWithNormalized
  const derived = deriveNormalizedLocationFields(
    opportunity,
    record.normalized as NormalizedPost | undefined,
  )
  const locationLabel =
    derived.location ||
    formatLocation(opportunity.location) ||
    opportunity.location

  return {
    id: record.id,
    intent: mapIntentToEngine(record.intent),
    status: record.status,
    creatorId: record.creatorId,
    ownerPartyId: record.ownerPartyId,
    workspaceId: record.workspaceId,
    exchangeMode: record.exchangeMode,
    subModelType: record.subModelType,
    modelType: record.modelType,
    mainCollaborationModel: record.mainCollaborationModel,
    preferredMatchingTopology: record.preferredMatchingTopology,
    title: record.title,
    description: record.description,
    location: locationLabel,
    attributes: {
      ...(record.collaborationAttributes ?? {}),
      ...(record.attributes ?? {}),
    },
    scope: record.scope,
    exchangeData: record.exchangeData,
    normalized: {
      ...(record.normalized ?? {}),
      location: derived.location ?? (record.normalized as NormalizedPost | undefined)?.location,
      coverageScopes:
        derived.coverageScopes ??
        (record.normalized as NormalizedPost | undefined)?.coverageScopes,
    },
    value_exchange: record.value_exchange ?? {
      mode: record.exchangeMode,
      accepted_modes: record.acceptedExchangeModes ?? record.paymentModes,
    },
  }
}

export function opportunitiesToPosts(
  opportunities: readonly Opportunity[],
): OpportunityPost[] {
  return opportunities.map(opportunityToPost)
}
