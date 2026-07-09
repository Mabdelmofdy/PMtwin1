import type { ExchangeMode, SubModelType } from '../types.ts'

/** Canonical field-group ids for dynamic forms. */
export type FieldGroupId =
  | 'general'
  | 'commercial'
  | 'timeline'
  | 'resources'
  | 'technical'
  | 'legal'
  | 'risk'
  | 'financial'
  | 'location'
  | 'requirements'

export const FIELD_GROUP_IDS: readonly FieldGroupId[] = [
  'general',
  'commercial',
  'timeline',
  'resources',
  'technical',
  'legal',
  'risk',
  'financial',
  'location',
  'requirements',
]

/**
 * Dynamic-form field types for the Knowledge Registry.
 * Kept self-contained (no FieldType import) to avoid circular types with ../types.ts.
 */
export type DynamicFieldType =
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

export type FieldValidation = {
  readonly required?: boolean
  readonly min?: number
  readonly max?: number
  readonly minLength?: number
  readonly maxLength?: number
  /** Preferred regex source string. */
  readonly regex?: string
  /** Legacy alias of `regex` for Sprint 1 seeded fields. */
  readonly pattern?: string
  readonly customValidatorKey?: string
  readonly message?: string
}

export type FieldConditionOperator = 'eq' | 'neq' | 'in' | 'notIn' | 'truthy' | 'falsy'

export type FieldCondition = {
  readonly field: string
  readonly op: FieldConditionOperator
  readonly value?: string | number | boolean | readonly string[]
}

export type FieldConditionSet = FieldCondition | readonly FieldCondition[]

export type DynamicFieldUiMetadata = {
  readonly icon?: string
  readonly width?: 'full' | 'half' | 'third'
  readonly step?: string
  readonly order?: number
  readonly hint?: string
  readonly placeholder?: string
  readonly sectionDescription?: string
}

/** Reserved for future engines — metadata only this sprint. */
export type DynamicFormExtensionStubs = {
  readonly visibilityRules?: Readonly<Record<string, unknown>>
  readonly permissions?: Readonly<Record<string, unknown>>
  readonly displayModes?: Readonly<Record<string, unknown>>
  readonly mobileLayout?: Readonly<Record<string, unknown>>
  readonly printLayout?: Readonly<Record<string, unknown>>
  readonly apiMapping?: Readonly<Record<string, unknown>>
}

export type DynamicFieldDefinition = {
  readonly id: string
  readonly label: string
  readonly description: string
  readonly type: DynamicFieldType
  readonly required: boolean
  readonly placeholder?: string
  readonly helpText?: string
  readonly validation?: FieldValidation
  readonly displayOrder: number
  readonly group: FieldGroupId
  readonly options?: readonly string[]
  readonly ui?: DynamicFieldUiMetadata
  readonly visibleWhen?: FieldConditionSet
  readonly enabledWhen?: FieldConditionSet
  readonly requiredWhen?: FieldConditionSet
} & DynamicFormExtensionStubs

export type DynamicFormDefinition = {
  readonly groups: readonly FieldGroupId[]
  readonly fields: readonly DynamicFieldDefinition[]
} & DynamicFormExtensionStubs

export type KnowledgeStability = 'experimental' | 'beta' | 'stable' | 'deprecated'

export const KNOWLEDGE_STABILITY_VALUES: readonly KnowledgeStability[] = [
  'experimental',
  'beta',
  'stable',
  'deprecated',
]

export type SubModelKnowledgeMetadata = {
  readonly schemaVersion: string
  readonly knowledgeVersion: number
  readonly lastUpdated: string
  readonly deprecated: boolean
  readonly stability: KnowledgeStability
}

export type BusinessMetadata = {
  readonly title: string
  readonly shortDescription: string
  readonly longDescription: string
  readonly businessPurpose: string
  readonly businessOutcome: string
}

export type UsageGuidance = {
  readonly whenToUse: readonly string[]
  readonly whenNotToUse: readonly string[]
  readonly bestFor: readonly string[]
  readonly typicalIndustries: readonly string[]
  readonly exampleScenarios: readonly string[]
}

export type ReadinessFieldWeight = {
  readonly fieldId: string
  /** Aggregate weight used for overall completion (sum across fields = 100). */
  readonly weight: number
  /** Contribution toward publish eligibility. */
  readonly requiredWeight: number
  /** Contribution toward completion quality beyond publish bar. */
  readonly recommendedWeight: number
}

export type ReadinessDefinition = {
  readonly requiredFields: readonly string[]
  readonly optionalFields: readonly string[]
  readonly minimumPublishFields: readonly string[]
  readonly fieldWeights: readonly ReadinessFieldWeight[]
}

export type MatchingMetricDefinition = {
  readonly id: string
  readonly label: string
  readonly description: string
  readonly weightHint: number
}

export type MatchingMetricsDefinition = {
  readonly metrics: readonly MatchingMetricDefinition[]
}

export type WorkflowMetadata = {
  readonly supportedWorkflow: boolean
  readonly supportsNegotiation: boolean
  readonly supportsCommercialAgreement: boolean
  readonly supportsContract: boolean
  readonly supportsApplications: boolean
  readonly supportsMarketplace: boolean
  readonly supportsAward: boolean
}

/** Platform capabilities required for the model (distinct from supportsX). */
export type CapabilityDependencies = {
  readonly requiresMarketplace: boolean
  readonly requiresMatching: boolean
  readonly requiresNegotiation: boolean
  readonly requiresCommercialAgreement: boolean
  readonly requiresContract: boolean
  readonly requiresAward: boolean
}

export type LifecycleMetadata = {
  readonly typicalStages: readonly string[]
  readonly terminalStages: readonly string[]
  readonly recommendedNextStage?: string
}

export type DocumentsMetadata = {
  readonly required: readonly string[]
  readonly optional: readonly string[]
}

export type ConfidentialityMetadata = {
  readonly marketplaceVisibleFields: readonly string[]
  readonly participantVisibleFields: readonly string[]
  readonly auditorVisibleFields: readonly string[]
  readonly privateFields: readonly string[]
}

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

export const RISK_LEVEL_VALUES: readonly RiskLevel[] = [
  'low',
  'medium',
  'high',
  'critical',
]

export type RiskProfile = {
  readonly defaultRiskLevel: RiskLevel
  readonly riskFactors: readonly string[]
  readonly mitigationHints: readonly string[]
}

export type ComplianceMetadata = {
  readonly requiresLegalReview: boolean
  readonly requiresFinancialReview: boolean
  readonly requiresKyc: boolean
  readonly requiresBoardApproval: boolean
}

export type CommercialMetadata = {
  readonly recommendedExchangeModes: readonly ExchangeMode[]
  readonly defaultExchangeMode: ExchangeMode
  readonly pricingStrategy: string
  readonly commercialTemplate: string
  readonly recommendedCommercialTerms: readonly string[]
}

export type EducationFaqItem = {
  readonly question: string
  readonly answer: string
}

export type EducationalContent = {
  readonly whatIsIt: string
  readonly whyUseIt: string
  readonly advantages: readonly string[]
  readonly risks: readonly string[]
  readonly typicalMistakes: readonly string[]
  readonly realWorldExample: string
  readonly faq: readonly EducationFaqItem[]
  readonly relatedModels: readonly SubModelType[]
}

export type DecisionTreeNode = {
  readonly id: string
  readonly prompt: string
  readonly outcomeSubModel?: SubModelType
  readonly branches?: readonly DecisionTreeBranch[]
}

export type DecisionTreeBranch = {
  readonly answer: string
  readonly next: DecisionTreeNode
}

export type AiMetadata = {
  readonly intentKeywords: readonly string[]
  readonly recommendedQuestions: readonly string[]
  readonly decisionHints: readonly string[]
  readonly confidenceFactors: readonly string[]
  readonly missingInformationPrompts: readonly string[]
  readonly decisionTree: DecisionTreeNode
}

export type DashboardWidgetRecommendation = {
  readonly id: string
  readonly label: string
  readonly description?: string
  readonly metricKey?: string
}

export type AnalyticsMetadata = {
  readonly primaryKPIs: readonly string[]
  readonly secondaryKPIs: readonly string[]
  readonly successMetrics: readonly string[]
  readonly timeMetrics: readonly string[]
  readonly financialMetrics: readonly string[]
  readonly dashboardWidgets: readonly DashboardWidgetRecommendation[]
}

export type SubModelKnowledge = {
  readonly metadata: SubModelKnowledgeMetadata
  readonly business: BusinessMetadata
  readonly usage: UsageGuidance
  readonly dynamicForm: DynamicFormDefinition
  readonly readiness: ReadinessDefinition
  readonly matching: MatchingMetricsDefinition
  readonly workflow: WorkflowMetadata
  readonly dependencies: CapabilityDependencies
  readonly lifecycle: LifecycleMetadata
  readonly documents: DocumentsMetadata
  readonly confidentiality: ConfidentialityMetadata
  readonly riskProfile: RiskProfile
  readonly compliance: ComplianceMetadata
  readonly commercial: CommercialMetadata
  readonly education: EducationalContent
  readonly ai: AiMetadata
  readonly analytics: AnalyticsMetadata
}
