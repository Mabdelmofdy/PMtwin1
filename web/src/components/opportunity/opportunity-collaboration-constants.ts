export const COLLABORATION_FLOW_STEPS = [
  'Opportunity',
  'PostMatch',
  'Negotiation',
  'Deal',
  'Contract',
] as const

export type CollaborationFlowStep = (typeof COLLABORATION_FLOW_STEPS)[number]
