export const COLLABORATION_FLOW_STEPS = [
  'Opportunity',
  'PostMatch',
  'Negotiation',
  'Deal',
  'Contract',
] as const

export type CollaborationFlowStep = (typeof COLLABORATION_FLOW_STEPS)[number]

export function formatCollaborationFlowStepLabel(step: CollaborationFlowStep): string {
  if (step === 'PostMatch') return 'Match'
  return step
}
