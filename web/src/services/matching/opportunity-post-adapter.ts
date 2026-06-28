import type { OpportunityPost } from '@pm-twin/matching'
import type { Opportunity } from '@/types/domain.ts'

type OpportunityWithNormalized = Opportunity & {
  readonly normalized?: OpportunityPost['normalized']
  readonly exchangeData?: Readonly<Record<string, unknown>>
  readonly value_exchange?: OpportunityPost['value_exchange']
  readonly subModelType?: string
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

/** Maps web Opportunity → @pm-twin/matching OpportunityPost (engine input DTO). */
export function opportunityToPost(opportunity: Opportunity): OpportunityPost {
  const record = opportunity as OpportunityWithNormalized
  return {
    id: record.id,
    intent: mapIntentToEngine(record.intent),
    status: record.status,
    creatorId: record.creatorId,
    exchangeMode: record.exchangeMode,
    subModelType: record.subModelType,
    modelType: record.modelType,
    title: record.title,
    description: record.description,
    location: record.location,
    attributes: record.attributes,
    scope: record.scope,
    exchangeData: record.exchangeData,
    normalized: record.normalized,
    value_exchange: record.value_exchange,
  }
}

export function opportunitiesToPosts(
  opportunities: readonly Opportunity[],
): OpportunityPost[] {
  return opportunities.map(opportunityToPost)
}
