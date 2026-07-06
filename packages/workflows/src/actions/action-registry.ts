import type { WorkflowActionKey } from '../types.ts'

export type WorkflowActionDefinition = {
  readonly key: WorkflowActionKey
  readonly label: string
  readonly commandType: string
  readonly requiredRole?: string
  readonly requiredPermission?: string
}

export const WORKFLOW_ACTION_REGISTRY: Record<
  WorkflowActionKey,
  WorkflowActionDefinition
> = {
  publish_opportunity: {
    key: 'publish_opportunity',
    label: 'Publish opportunity',
    commandType: 'PublishOpportunity',
    requiredRole: 'opportunity_owner',
    requiredPermission: 'opportunity:publish',
  },
  accept_match: {
    key: 'accept_match',
    label: 'Accept match',
    commandType: 'AcceptPostMatch',
    requiredRole: 'participant',
    requiredPermission: 'match:accept',
  },
  decline_match: {
    key: 'decline_match',
    label: 'Decline match',
    commandType: 'DeclinePostMatch',
    requiredRole: 'participant',
    requiredPermission: 'match:decline',
  },
  start_negotiation_from_post_match: {
    key: 'start_negotiation_from_post_match',
    label: 'Start negotiation',
    commandType: 'StartNegotiationFromPostMatch',
    requiredRole: 'participant',
    requiredPermission: 'negotiation:start',
  },
  start_negotiation_from_application: {
    key: 'start_negotiation_from_application',
    label: 'Start hiring negotiation',
    commandType: 'StartNegotiationFromApplication',
    requiredRole: 'hiring_party',
    requiredPermission: 'negotiation:start',
  },
  agree_negotiation: {
    key: 'agree_negotiation',
    label: 'Agree negotiation',
    commandType: 'AgreeNegotiation',
    requiredRole: 'participant',
    requiredPermission: 'negotiation:agree',
  },
  cancel_negotiation: {
    key: 'cancel_negotiation',
    label: 'Cancel negotiation',
    commandType: 'CancelNegotiation',
    requiredRole: 'participant',
    requiredPermission: 'negotiation:cancel',
  },
  create_deal_from_post_match: {
    key: 'create_deal_from_post_match',
    label: 'Create deal',
    commandType: 'CreateDealFromPostMatch',
    requiredRole: 'participant',
    requiredPermission: 'deal:create',
  },
  create_deal_from_application: {
    key: 'create_deal_from_application',
    label: 'Create hiring deal',
    commandType: 'CreateDealFromApplication',
    requiredRole: 'hiring_party',
    requiredPermission: 'deal:create',
  },
  create_deal_from_negotiation: {
    key: 'create_deal_from_negotiation',
    label: 'Create deal',
    commandType: 'CreateDealFromNegotiation',
    requiredRole: 'participant',
    requiredPermission: 'deal:create',
  },
  create_contract_from_deal: {
    key: 'create_contract_from_deal',
    label: 'Create contract',
    commandType: 'CreateContractFromDeal',
    requiredRole: 'participant',
    requiredPermission: 'contract:create',
  },
  sign_contract: {
    key: 'sign_contract',
    label: 'Sign contract',
    commandType: 'SignContract',
    requiredRole: 'participant',
    requiredPermission: 'contract:sign',
  },
  complete_contract: {
    key: 'complete_contract',
    label: 'Complete contract',
    commandType: 'CompleteContract',
    requiredRole: 'participant',
    requiredPermission: 'contract:complete',
  },
}

export function getActionDefinition(
  key: WorkflowActionKey,
): WorkflowActionDefinition {
  return WORKFLOW_ACTION_REGISTRY[key]
}
