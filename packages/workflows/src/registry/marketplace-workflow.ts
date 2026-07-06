import type { WorkflowDefinition } from '../types.ts'

const MARKETPLACE_COMMANDS = [
  'PublishOpportunity',
  'AcceptPostMatch',
  'DeclinePostMatch',
  'StartNegotiationFromPostMatch',
  'AgreeNegotiation',
  'CancelNegotiation',
  'CreateDealFromPostMatch',
  'CreateDealFromNegotiation',
  'CreateContractFromDeal',
  'SignContract',
  'ActivateContract',
  'CompleteContract',
] as const

export const MARKETPLACE_WORKFLOW: WorkflowDefinition = {
  key: 'marketplace',
  label: 'Marketplace collaboration',
  startEntity: 'opportunity',
  steps: [
    'opportunity',
    'publish',
    'matching',
    'post_match',
    'negotiation',
    'deal',
    'contract',
    'completion',
  ],
  allowedTransitions: [
    { from: 'opportunity', to: 'publish', action: 'publish_opportunity', commandType: 'PublishOpportunity' },
    { from: 'post_match', to: 'negotiation', action: 'start_negotiation_from_post_match', commandType: 'StartNegotiationFromPostMatch' },
    { from: 'post_match', to: 'post_match', action: 'accept_match', commandType: 'AcceptPostMatch' },
    { from: 'post_match', to: 'post_match', action: 'decline_match', commandType: 'DeclinePostMatch' },
    { from: 'negotiation', to: 'deal', action: 'agree_negotiation', commandType: 'AgreeNegotiation' },
    { from: 'negotiation', to: 'deal', action: 'create_deal_from_post_match', commandType: 'CreateDealFromPostMatch' },
    { from: 'negotiation', to: 'deal', action: 'create_deal_from_negotiation', commandType: 'CreateDealFromNegotiation' },
    { from: 'deal', to: 'contract', action: 'create_contract_from_deal', commandType: 'CreateContractFromDeal' },
    { from: 'contract', to: 'completion', action: 'sign_contract', commandType: 'SignContract' },
    { from: 'contract', to: 'completion', action: 'activate_contract', commandType: 'ActivateContract' },
    { from: 'contract', to: 'completion', action: 'complete_contract', commandType: 'CompleteContract' },
  ],
  allowedCommands: [...MARKETPLACE_COMMANDS],
  businessRules: [
    'PostMatch must be confirmed before starting negotiation',
    'Negotiation must be agreed before creating a deal',
    'Deal must exist before creating a contract',
    'Collaboration taxonomy must be valid before publish',
  ],
  terminalStates: ['completed', 'cancelled', 'closed', 'terminated'],
}
