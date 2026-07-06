import type { WorkflowDefinition } from '../types.ts'

const HIRING_COMMANDS = [
  'StartNegotiationFromApplication',
  'AgreeNegotiation',
  'CreateDealFromApplication',
  'CreateContractFromDeal',
  'SignContract',
  'ActivateContract',
  'CompleteContract',
] as const

export const HIRING_WORKFLOW: WorkflowDefinition = {
  key: 'hiring',
  label: 'Hiring / RFP application',
  startEntity: 'application',
  steps: [
    'application',
    'accepted',
    'negotiation',
    'deal',
    'contract',
    'completion',
  ],
  allowedTransitions: [
    { from: 'accepted', to: 'negotiation', action: 'start_negotiation_from_application', commandType: 'StartNegotiationFromApplication' },
    { from: 'negotiation', to: 'deal', action: 'agree_negotiation', commandType: 'AgreeNegotiation' },
    { from: 'negotiation', to: 'deal', action: 'create_deal_from_application', commandType: 'CreateDealFromApplication' },
    { from: 'deal', to: 'contract', action: 'create_contract_from_deal', commandType: 'CreateContractFromDeal' },
    { from: 'contract', to: 'completion', action: 'sign_contract', commandType: 'SignContract' },
    { from: 'contract', to: 'completion', action: 'activate_contract', commandType: 'ActivateContract' },
    { from: 'contract', to: 'completion', action: 'complete_contract', commandType: 'CompleteContract' },
  ],
  allowedCommands: [...HIRING_COMMANDS],
  businessRules: [
    'Application must be accepted before starting hiring negotiation',
    'Negotiation must be agreed before creating hiring deal',
    'Deal must exist before creating contract',
    'Hiring path does not require PostMatch',
  ],
  terminalStates: ['completed', 'cancelled', 'rejected', 'withdrawn'],
}
