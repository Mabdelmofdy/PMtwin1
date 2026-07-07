import type { WorkflowDefinition } from '../types.ts'

const HIRING_COMMANDS = [
  'StartNegotiationFromApplication',
  'AgreeNegotiation',
  'CreateCommercialAgreementFromApplication',
  'RouteContractDecision',
  'CreateContractFromCommercialAgreement',
  'SignContract',
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
    'commercial_agreement',
    'contract',
    'completion',
  ],
  allowedTransitions: [
    { from: 'accepted', to: 'negotiation', action: 'start_negotiation_from_application', commandType: 'StartNegotiationFromApplication' },
    { from: 'negotiation', to: 'commercial_agreement', action: 'agree_negotiation', commandType: 'AgreeNegotiation' },
    { from: 'negotiation', to: 'commercial_agreement', action: 'create_commercial_agreement_from_application', commandType: 'CreateCommercialAgreementFromApplication' },
    { from: 'commercial_agreement', to: 'commercial_agreement', action: 'route_contract_decision', commandType: 'RouteContractDecision' },
    { from: 'commercial_agreement', to: 'contract', action: 'create_contract_from_commercial_agreement', commandType: 'CreateContractFromCommercialAgreement' },
    { from: 'contract', to: 'completion', action: 'sign_contract', commandType: 'SignContract' },
    { from: 'contract', to: 'completion', action: 'complete_contract', commandType: 'CompleteContract' },
  ],
  allowedCommands: [...HIRING_COMMANDS],
  businessRules: [
    'Application must be accepted before starting hiring negotiation',
    'Negotiation must be agreed before creating hiring commercial agreement',
    'Commercial agreement contract route must pass decision engine approval',
    'Commercial agreement must exist before creating contract',
    'Hiring path does not require PostMatch',
  ],
  terminalStates: ['completed', 'cancelled', 'rejected', 'withdrawn'],
}
