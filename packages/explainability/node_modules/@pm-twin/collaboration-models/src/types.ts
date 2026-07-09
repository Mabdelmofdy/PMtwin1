import type { SubModelKnowledge } from './knowledge/types.ts'

/** Matching topology — never store in subModelType. */
export type MatchTopology = 'one_way' | 'two_way' | 'consortium' | 'circular'

export const MATCH_TOPOLOGY_KEYS: readonly MatchTopology[] = [
  'one_way',
  'two_way',
  'consortium',
  'circular',
]

/** Value exchange modes supported by the platform. */
export type ExchangeMode =
  | 'cash'
  | 'barter'
  | 'equity'
  | 'profit_sharing'
  | 'hybrid'

export const EXCHANGE_MODE_KEYS: readonly ExchangeMode[] = [
  'cash',
  'barter',
  'equity',
  'profit_sharing',
  'hybrid',
]

/** UX-level main collaboration models (5). */
export type MainCollaborationModel =
  | 'cash_subcontracting'
  | 'service_exchange'
  | 'joint_venture'
  | 'resource_sharing'
  | 'hiring'

export const MAIN_COLLABORATION_MODEL_KEYS: readonly MainCollaborationModel[] = [
  'cash_subcontracting',
  'service_exchange',
  'joint_venture',
  'resource_sharing',
  'hiring',
]

/** Technical model types from POC OPPORTUNITY_MODELS. */
export type ModelType =
  | 'project_based'
  | 'strategic_partnership'
  | 'resource_pooling'
  | 'hiring'
  | 'competition'

export const MODEL_TYPE_KEYS: readonly ModelType[] = [
  'project_based',
  'strategic_partnership',
  'resource_pooling',
  'hiring',
  'competition',
]

/** Canonical collaboration sub-models — never matching topology values. */
export type SubModelType =
  | 'task_based'
  | 'consortium'
  | 'project_jv'
  | 'spv'
  | 'strategic_jv'
  | 'strategic_alliance'
  | 'mentorship'
  | 'bulk_purchasing'
  | 'equipment_sharing'
  | 'resource_sharing'
  | 'professional_hiring'
  | 'consultant_hiring'
  | 'competition_rfp'

export const SUB_MODEL_TYPE_KEYS: readonly SubModelType[] = [
  'task_based',
  'consortium',
  'project_jv',
  'spv',
  'strategic_jv',
  'strategic_alliance',
  'mentorship',
  'bulk_purchasing',
  'equipment_sharing',
  'resource_sharing',
  'professional_hiring',
  'consultant_hiring',
  'competition_rfp',
]

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'currency'
  | 'currency-range'
  | 'select'
  | 'multi-select'
  | 'tags'
  | 'date'
  | 'date-range'
  | 'boolean'
  | 'array-objects'
  | 'array-percentages'
  | 'datetime'
  | 'multiselect'
  | 'location'
  | 'company'
  | 'person'
  | 'skills'
  | 'equipment'
  | 'resource'
  | 'attachment'

export type FieldConditional = {
  readonly field: string
  readonly value: string | readonly string[]
}

export type SubModelFieldDefinition = {
  readonly key: string
  readonly label: string
  readonly type: FieldType
  readonly required: boolean
  readonly description?: string
  readonly options?: readonly string[]
  readonly maxLength?: number
  readonly min?: number
  readonly conditional?: FieldConditional
}

export type SubModelEligibility = {
  readonly allowedEntityTypes?: readonly ('company' | 'individual')[]
  readonly reason?: string
}

export type RelationshipType = 'B2B' | 'B2P' | 'P2B' | 'P2P'

export type OwnershipPolicyMode = 'single' | 'shared' | 'multi'

export type OwnershipPolicy = {
  readonly mode: OwnershipPolicyMode
  readonly transferable: boolean
  readonly requiresPrimaryOwner: boolean
}

export type ParticipantConstraints = {
  readonly minimumParticipants: number
  readonly maximumParticipants: number | 'unlimited'
  readonly recommendedParticipants: number
}

export type CollaborationApplicability = {
  readonly allowedPartyTypes?: readonly ('company' | 'individual')[]
  readonly primaryRelationship?: RelationshipType
  readonly supportedRelationships: readonly RelationshipType[]
  readonly supportsB2B?: boolean
  readonly supportsB2P?: boolean
  readonly supportsP2B?: boolean
  readonly supportsP2P?: boolean
  readonly ownershipPolicy: OwnershipPolicy
  readonly participantConstraints: ParticipantConstraints
  readonly reason?: string
}

export type SubModelDefinition = {
  readonly key: SubModelType
  readonly name: string
  readonly description: string
  readonly modelType: ModelType
  readonly mainCollaborationModel: MainCollaborationModel
  readonly allowedMatchTopologies: readonly MatchTopology[]
  readonly allowedExchangeModes: readonly ExchangeMode[]
  readonly requiredFields: readonly string[]
  readonly recommendedFields: readonly string[]
  /** Temporary compatibility layer — future: generate from knowledge.dynamicForm. */
  readonly attributes: readonly SubModelFieldDefinition[]
  readonly eligibility?: SubModelEligibility
  /** Party-driven applicability — canonical Sprint 2.5 metadata. */
  readonly applicability?: CollaborationApplicability
  /** Canonical Collaboration Knowledge Engine payload. */
  readonly knowledge: SubModelKnowledge
}

export type PartyEligibilityValidationContext = {
  readonly ownerPartyType: 'company' | 'individual'
  readonly participantPartyType?: 'company' | 'individual'
}

export type MainCollaborationModelDefinition = {
  readonly key: MainCollaborationModel
  readonly name: string
  readonly description: string
  readonly defaultModelType: ModelType
  readonly subModelKeys: readonly SubModelType[]
  readonly allowedMatchTopologies: readonly MatchTopology[]
  readonly allowedExchangeModes: readonly ExchangeMode[]
}

export type ModelTypeDefinition = {
  readonly key: ModelType
  readonly name: string
  readonly subModelKeys: readonly SubModelType[]
}

export type CollaborationTaxonomyInput = {
  readonly mainCollaborationModel?: string
  readonly modelType?: string
  readonly subModelType?: string
  readonly exchangeMode?: string
  readonly acceptedExchangeModes?: readonly string[]
  readonly collaborationAttributes?: Readonly<Record<string, unknown>>
  readonly intent?: string
}

export type CollaborationValidationResult = {
  readonly valid: boolean
  readonly errors: readonly string[]
  readonly warnings: readonly string[]
}

export type DerivedMatchingTopology = {
  readonly topology: MatchTopology
  readonly reason: string
  readonly alternatives?: readonly MatchTopology[]
}

export type ValueExchangeFieldGroup = {
  readonly mode: ExchangeMode
  readonly requiredFields: readonly string[]
  readonly optionalFields: readonly string[]
}

/** Re-export canonical knowledge type for taxonomy consumers. */
export type { SubModelKnowledge }
