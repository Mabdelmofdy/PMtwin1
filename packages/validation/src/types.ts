export type ValidationSeverity = 'valid' | 'warning' | 'error' | 'blocker'

export type ValidationScope =
  | 'draft'
  | 'update'
  | 'publish'
  | 'import'
  | 'api'
  | 'admin'

export type ValidationSource =
  | 'field'
  | 'business'
  | 'commercial'
  | 'document'
  | 'taxonomy'
  | 'workflow'
  | 'publish'

export type ValidationLayer = 'field' | 'business' | 'publish'

export type ValidationRuleGroup =
  | 'field'
  | 'dates'
  | 'budget'
  | 'commercial'
  | 'skills'
  | 'workPackages'
  | 'capacity'
  | 'documents'
  | 'location'
  | 'duplicates'
  | 'needOffer'
  | 'exchange'
  | 'publish'

export type StructuredSkillInput = {
  readonly skillId?: string
  readonly name?: string
  readonly role: 'required' | 'provided'
  readonly level?: string
  readonly years?: number
  readonly intent?: 'need' | 'offer' | 'hybrid'
}

export type WorkPackageInput = {
  readonly id?: string
  readonly title?: string
  readonly description?: string
  readonly skills?: readonly string[]
  readonly deadline?: string
}

export type CapacityInput = {
  readonly required?: number
  readonly available?: number
}

export type OpportunityValidationInput = {
  readonly id?: string
  readonly title?: string
  readonly description?: string
  readonly intent?: string
  readonly status?: string
  readonly location?: string
  readonly country?: string
  readonly city?: string
  readonly workMode?: string
  readonly mainCollaborationModel?: string
  readonly modelType?: string
  readonly subModelType?: string
  readonly exchangeMode?: string
  readonly startDate?: string
  readonly endDate?: string
  readonly duration?: number | string
  readonly deliveryDeadline?: string
  readonly budget?: number
  readonly budgetMin?: number
  readonly budgetMax?: number
  readonly ownerId?: string
  readonly creatorId?: string
  readonly structuredSkills?: readonly StructuredSkillInput[]
  readonly workPackages?: readonly WorkPackageInput[]
  readonly capacity?: CapacityInput
  readonly scope?: Readonly<Record<string, unknown>>
  readonly exchangeData?: Readonly<Record<string, unknown>>
  readonly collaborationAttributes?: Readonly<Record<string, unknown>>
  readonly complianceRequirements?: readonly string[]
  readonly attachments?: ReadonlyArray<{ readonly name?: string } | string>
  readonly attributes?: Readonly<Record<string, unknown>>
}

export type DuplicateDraftCandidate = {
  readonly id: string
  readonly title?: string
  readonly ownerId?: string
  readonly creatorId?: string
  readonly mainCollaborationModel?: string
  readonly subModelType?: string
  readonly location?: string
  readonly status?: string
}

export type ValidationConfig = {
  readonly minimumBudget: number
  readonly retentionMax: number
  readonly maxRetentionPercent: number
  readonly vatMax: number
  readonly maxVatPercent: number
  readonly profitShareMin: number
  readonly profitShareMax: number
  readonly advancePaymentMaxPercent: number
  readonly warningStartWithinHours: number
  readonly duplicateSimilarityThreshold: number
  readonly maxPackageCount?: number
  readonly titleMaxLength: number
  readonly descriptionMaxLength: number
  readonly skillLevelMinYears: Readonly<Record<string, number>>
}

export type ValidationContext = {
  readonly today?: string
  readonly now?: Date
  readonly isExistingDraft?: boolean
  readonly existingDrafts?: readonly DuplicateDraftCandidate[]
  readonly operationScope?: ValidationScope
  readonly config?: Partial<ValidationConfig>
  readonly taxonomyValid?: boolean
  readonly taxonomyErrors?: readonly string[]
}

export type ValidationIssue = {
  readonly code: string
  readonly source: ValidationSource
  readonly severity: ValidationSeverity
  readonly scope: readonly ValidationScope[]
  readonly fieldPaths: readonly string[]
  readonly message: string
  readonly layer: ValidationLayer
  readonly group?: ValidationRuleGroup
  readonly blocksPublish?: boolean
}

export type ValidationResult = {
  readonly valid: boolean
  readonly issues: readonly ValidationIssue[]
}

export type RunRulesOptions = {
  readonly scopes?: readonly ValidationScope[]
  readonly groups?: readonly ValidationRuleGroup[]
}

export type ValidationRule = {
  readonly id: string
  readonly code: string
  readonly layer: ValidationLayer
  readonly source: ValidationSource
  readonly severity: ValidationSeverity
  readonly scope: readonly ValidationScope[]
  readonly fieldPaths: readonly string[]
  readonly group: ValidationRuleGroup
  readonly blocksPublish?: boolean
  readonly execute: (
    input: OpportunityValidationInput,
    context: ValidationContext,
    config: ValidationConfig,
  ) => readonly ValidationIssue[] | ValidationIssue | null
}

export type PublishReadinessSnapshot = {
  readonly allowed: boolean
  readonly profileReady: boolean
  readonly opportunityPublishReady: boolean
  readonly opportunityScore?: number
  readonly missingProfileRequired?: readonly string[]
  readonly missingOpportunityRequired?: readonly string[]
}

export type VettingSnapshot = {
  readonly approved: boolean
}

export type PublishValidationInput = {
  readonly fieldResult: ValidationResult
  readonly businessResult: ValidationResult
  readonly publishReadiness: PublishReadinessSnapshot
  readonly vettingStatus: VettingSnapshot
}

export type PublishValidationResult = {
  readonly status: 'allowed' | 'blocked'
  readonly blockingIssues: readonly ValidationIssue[]
  readonly warnings: readonly ValidationIssue[]
  readonly recommendations: readonly string[]
}
