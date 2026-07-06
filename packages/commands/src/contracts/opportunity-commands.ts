import type { Command } from '../types.ts'

export type OpportunityCollaborationPayload = {
  readonly title: string
  readonly description?: string
  readonly intent?: 'need' | 'offer' | 'hybrid' | 'request'
  readonly location?: string
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
