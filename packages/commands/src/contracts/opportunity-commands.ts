import type { Command } from '../types.ts'

/** First-class structured skill for opportunity validation (complements scope skill arrays). */
export type OpportunityStructuredSkill = {
  readonly skillId?: string
  readonly name?: string
  readonly role: 'required' | 'provided'
  readonly level?: string
  readonly years?: number
  readonly intent?: 'need' | 'offer' | 'hybrid'
}

export type OpportunityWorkPackage = {
  readonly id?: string
  readonly title?: string
  readonly description?: string
  readonly skills?: readonly string[]
  readonly deadline?: string
}

export type OpportunityCapacity = {
  readonly required?: number
  readonly available?: number
}

export type OpportunityCollaborationPayload = {
  readonly title: string
  readonly description?: string
  readonly intent?: 'need' | 'offer' | 'hybrid' | 'request'
  readonly location?: string
  /** Canonical coverage scope IDs — single source of truth for multi-location. */
  readonly coverageAreas?: readonly string[]
  readonly creatorId?: string
  readonly tenantId?: string
  readonly organizationId?: string
  readonly mainCollaborationModel: string
  readonly modelType: string
  readonly subModelType: string
  readonly exchangeMode: string
  readonly acceptedExchangeModes?: readonly string[]
  readonly preferredMatchingTopology?: string
  readonly collaborationAttributes?: Readonly<Record<string, unknown>>
  readonly exchangeData?: Readonly<Record<string, unknown>>
  readonly scope?: Readonly<Record<string, unknown>>
  readonly attributes?: Readonly<Record<string, unknown>>
  readonly normalized?: Readonly<Record<string, unknown>>
  readonly paymentModes?: readonly string[]
  /** Recommended readiness fields (do not affect matching algorithm). */
  readonly preferredPartnerType?: string
  readonly attachments?: ReadonlyArray<{ readonly name?: string } | string>
  readonly complianceRequirements?: readonly string[]
  readonly deliveryMilestones?: ReadonlyArray<{ readonly title?: string } | string>
  /** Minimal schema expansion — validated by @pm-twin/validation. */
  readonly structuredSkills?: readonly OpportunityStructuredSkill[]
  readonly workPackages?: readonly OpportunityWorkPackage[]
  readonly capacity?: OpportunityCapacity
  readonly startDate?: string
  readonly endDate?: string
  readonly duration?: number | string
  readonly deliveryDeadline?: string
  readonly country?: string
  readonly city?: string
  readonly workMode?: string
  readonly budget?: number
}

export type CreateOpportunityCommand = Command & {
  readonly commandType: 'CreateOpportunity'
  readonly payload: OpportunityCollaborationPayload
}

export type UpdateOpportunityCommand = Command & {
  readonly commandType: 'UpdateOpportunity'
  readonly payload: Partial<OpportunityCollaborationPayload>
}

export type ValidateOpportunityCollaborationModelCommand = Command & {
  readonly commandType: 'ValidateOpportunityCollaborationModel'
  readonly payload: OpportunityCollaborationPayload
}

export type PublishOpportunityCommand = Command & {
  readonly commandType: 'PublishOpportunity'
  readonly reason?: string
}

export type CloseOpportunityCommand = Command & {
  readonly commandType: 'CloseOpportunity'
  readonly reason?: string
}

export type ArchiveOpportunityCommand = Command & {
  readonly commandType: 'ArchiveOpportunity'
  readonly reason?: string
}

/** Soft-delete draft opportunities only. Published opportunities must be archived. */
export type DeleteOpportunityCommand = Command & {
  readonly commandType: 'DeleteOpportunity'
  readonly reason?: string
}
