export type WorkflowKey =
  | 'marketplace'
  | 'hiring'
  | 'cash_subcontracting'
  | 'service_exchange'
  | 'joint_venture'
  | 'resource_sharing'
  | 'hiring_engagement'

export type WorkflowStartEntity =
  | 'opportunity'
  | 'application'
  | 'post_match'

export type WorkflowStepKey =
  | 'opportunity'
  | 'publish'
  | 'matching'
  | 'post_match'
  | 'negotiation'
  | 'deal'
  | 'contract'
  | 'completion'
  | 'application'
  | 'accepted'

export type WorkflowActionKey =
  | 'publish_opportunity'
  | 'accept_match'
  | 'decline_match'
  | 'start_negotiation_from_post_match'
  | 'start_negotiation_from_application'
  | 'agree_negotiation'
  | 'cancel_negotiation'
  | 'create_deal_from_post_match'
  | 'create_deal_from_application'
  | 'create_deal_from_negotiation'
  | 'create_contract_from_deal'
  | 'sign_contract'
  | 'activate_contract'
  | 'complete_contract'

export type WorkflowEntityKind =
  | 'opportunity'
  | 'application'
  | 'post_match'
  | 'negotiation'
  | 'deal'
  | 'contract'

export type WorkflowEntitySnapshot = {
  readonly id: string
  readonly status?: string
  readonly creatorId?: string
  readonly applicantId?: string
  readonly opportunityId?: string
  readonly postMatchId?: string
  readonly matchId?: string
  readonly applicationId?: string
  readonly negotiationId?: string
  readonly dealId?: string
  readonly matchType?: string
  readonly participants?: readonly WorkflowParticipantSnapshot[]
  readonly commercialTerms?: Readonly<Record<string, unknown>>
}

export type WorkflowParticipantSnapshot = {
  readonly userId: string
  readonly role?: string
  readonly opportunityId?: string
  readonly participantStatus?: string
}

export type WorkflowUserContext = {
  readonly userId: string | null
  readonly roles?: readonly string[]
  readonly permissions?: readonly string[]
  readonly isOpportunityOwner?: boolean
  readonly isApplicant?: boolean
  readonly isParticipant?: boolean
  readonly canMutate?: boolean
}

export type WorkflowCollaborationContext = {
  readonly mainCollaborationModel?: string
  readonly modelType?: string
  readonly subModelType?: string
  readonly exchangeMode?: string
  readonly preferredMatchingTopology?: string
  readonly matchType?: string
  readonly collaborationAttributes?: Readonly<Record<string, unknown>>
  readonly exchangeData?: Readonly<Record<string, unknown>>
  readonly acceptedExchangeModes?: readonly string[]
}

export type WorkflowLinkageContext = {
  readonly negotiationsForPostMatch?: readonly WorkflowEntitySnapshot[]
  readonly negotiationsForApplication?: readonly WorkflowEntitySnapshot[]
  readonly dealForPostMatch?: WorkflowEntitySnapshot | null
  readonly dealForApplication?: WorkflowEntitySnapshot | null
  readonly dealForNegotiation?: WorkflowEntitySnapshot | null
  readonly contractsForDeal?: readonly WorkflowEntitySnapshot[]
  readonly opportunityClosed?: boolean
  readonly legacyApplicationsEnabled?: boolean
}

export type WorkflowContext = {
  readonly primaryWorkflow: WorkflowKey
  readonly collaborationWorkflow?: WorkflowKey
  readonly user: WorkflowUserContext
  readonly opportunity?: WorkflowEntitySnapshot
  readonly application?: WorkflowEntitySnapshot
  readonly postMatch?: WorkflowEntitySnapshot
  readonly negotiation?: WorkflowEntitySnapshot
  readonly deal?: WorkflowEntitySnapshot
  readonly contract?: WorkflowEntitySnapshot
  readonly collaboration?: WorkflowCollaborationContext
  readonly linkage?: WorkflowLinkageContext
}

export type WorkflowAction = {
  readonly key: WorkflowActionKey
  readonly label: string
  readonly commandType: string
  readonly visible: boolean
  readonly enabled: boolean
  readonly visibilityReason: string
  readonly disabledReason?: string
  readonly requiredRole?: string
  readonly requiredPermission?: string
  readonly workflowKey: WorkflowKey
  readonly aggregateId?: string
  readonly metadata?: Readonly<Record<string, unknown>>
}

export type WorkflowTransitionValidation = {
  readonly valid: boolean
  readonly errors: readonly string[]
  readonly warnings: readonly string[]
}

export type WorkflowTransitionDefinition = {
  readonly from: WorkflowStepKey
  readonly to: WorkflowStepKey
  readonly action: WorkflowActionKey
  readonly commandType: string
}

export type WorkflowDefinition = {
  readonly key: WorkflowKey
  readonly label: string
  readonly startEntity: WorkflowStartEntity
  readonly steps: readonly WorkflowStepKey[]
  readonly allowedTransitions: readonly WorkflowTransitionDefinition[]
  readonly allowedCommands: readonly string[]
  readonly businessRules: readonly string[]
  readonly terminalStates: readonly string[]
}
