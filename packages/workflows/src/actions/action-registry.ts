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
  send_negotiation_message: {
    key: 'send_negotiation_message',
    label: 'Send message',
    commandType: 'SendNegotiationMessage',
    requiredRole: 'participant',
    requiredPermission: 'negotiation:message',
  },
  submit_negotiation_offer: {
    key: 'submit_negotiation_offer',
    label: 'Submit offer',
    commandType: 'SubmitNegotiationOffer',
    requiredRole: 'participant',
    requiredPermission: 'negotiation:offer',
  },
  submit_negotiation_counter_offer: {
    key: 'submit_negotiation_counter_offer',
    label: 'Submit counter offer',
    commandType: 'SubmitNegotiationCounterOffer',
    requiredRole: 'participant',
    requiredPermission: 'negotiation:counter',
  },
  accept_negotiation_offer: {
    key: 'accept_negotiation_offer',
    label: 'Accept offer',
    commandType: 'AcceptNegotiationOffer',
    requiredRole: 'participant',
    requiredPermission: 'negotiation:offer:accept',
  },
  reject_negotiation_offer: {
    key: 'reject_negotiation_offer',
    label: 'Reject offer',
    commandType: 'RejectNegotiationOffer',
    requiredRole: 'participant',
    requiredPermission: 'negotiation:offer:reject',
  },
  view_negotiation_transcript: {
    key: 'view_negotiation_transcript',
    label: 'View transcript',
    commandType: 'LockNegotiationTranscript',
    requiredRole: 'auditor',
    requiredPermission: 'negotiation:transcript:view',
  },
  create_commercial_agreement_from_post_match: {
    key: 'create_commercial_agreement_from_post_match',
    label: 'Create commercial agreement',
    commandType: 'CreateCommercialAgreementFromPostMatch',
    requiredRole: 'participant',
    requiredPermission: 'commercial_agreement:create',
  },
  create_commercial_agreement_from_application: {
    key: 'create_commercial_agreement_from_application',
    label: 'Create hiring commercial agreement',
    commandType: 'CreateCommercialAgreementFromApplication',
    requiredRole: 'hiring_party',
    requiredPermission: 'commercial_agreement:create',
  },
  create_commercial_agreement_from_negotiation: {
    key: 'create_commercial_agreement_from_negotiation',
    label: 'Create commercial agreement',
    commandType: 'CreateCommercialAgreementFromNegotiation',
    requiredRole: 'participant',
    requiredPermission: 'commercial_agreement:create',
  },
  award_commercial_agreement: {
    key: 'award_commercial_agreement',
    label: 'Award commercial agreement',
    commandType: 'AwardCommercialAgreement',
    requiredRole: 'opportunity_owner',
    requiredPermission: 'commercial_agreement:award',
  },
  route_contract_decision: {
    key: 'route_contract_decision',
    label: 'Route contract decision',
    commandType: 'RouteContractDecision',
    requiredRole: 'participant',
    requiredPermission: 'contract:decision:route',
  },
  create_contract_from_commercial_agreement: {
    key: 'create_contract_from_commercial_agreement',
    label: 'Create contract',
    commandType: 'CreateContractFromCommercialAgreement',
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
