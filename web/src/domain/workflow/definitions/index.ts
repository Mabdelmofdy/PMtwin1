import type { WorkflowDefinition } from '@/domain/workflow/types.ts'

export const ApplicationWorkflow: WorkflowDefinition = {
  entityType: 'application',
  name: 'ApplicationWorkflow',
  states: [
    'submitted',
    'reviewing',
    'shortlisted',
    'negotiating',
    'accepted',
    'rejected',
    'withdrawn',
  ],
  terminalStates: ['accepted', 'rejected', 'withdrawn'],
  transitions: {
    submitted: ['reviewing', 'rejected', 'withdrawn'],
    reviewing: ['shortlisted', 'rejected', 'withdrawn'],
    shortlisted: ['negotiating', 'rejected', 'withdrawn'],
    negotiating: ['accepted', 'rejected', 'withdrawn'],
    accepted: [],
    rejected: [],
    withdrawn: [],
  },
}

export const OpportunityWorkflow: WorkflowDefinition = {
  entityType: 'opportunity',
  name: 'OpportunityWorkflow',
  states: [
    'draft',
    'published',
    'matched',
    'negotiating',
    'contracted',
    'executing',
    'completed',
    'cancelled',
  ],
  terminalStates: ['completed', 'cancelled'],
  transitions: {
    draft: ['published', 'cancelled'],
    published: ['matched', 'negotiating', 'cancelled'],
    matched: ['negotiating', 'contracted', 'cancelled'],
    negotiating: ['contracted', 'cancelled'],
    contracted: ['executing', 'cancelled'],
    executing: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
  },
}

export const MatchWorkflow: WorkflowDefinition = {
  entityType: 'match',
  name: 'MatchWorkflow',
  states: [
    'discovered',
    'accepted',
    'confirmed',
    'declined',
    'expired',
    'superseded',
  ],
  terminalStates: ['confirmed', 'declined', 'expired', 'superseded'],
  transitions: {
    discovered: ['accepted', 'declined', 'expired'],
    accepted: ['confirmed', 'declined', 'expired', 'superseded'],
    confirmed: [],
    declined: [],
    expired: [],
    superseded: [],
  },
}

export const NegotiationWorkflow: WorkflowDefinition = {
  entityType: 'negotiation',
  name: 'NegotiationWorkflow',
  states: ['active', 'countered', 'agreed', 'expired', 'cancelled'],
  terminalStates: ['agreed', 'expired', 'cancelled'],
  transitions: {
    active: ['countered', 'agreed', 'expired', 'cancelled'],
    countered: ['active', 'agreed', 'expired', 'cancelled'],
    agreed: [],
    expired: [],
    cancelled: [],
  },
}

export const DealWorkflow: WorkflowDefinition = {
  entityType: 'deal',
  name: 'DealWorkflow',
  states: ['draft', 'review', 'signing', 'executing', 'completed', 'cancelled'],
  terminalStates: ['completed', 'cancelled'],
  transitions: {
    draft: ['review', 'cancelled'],
    review: ['signing', 'cancelled'],
    signing: ['executing', 'cancelled'],
    executing: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
  },
}

export const ContractWorkflow: WorkflowDefinition = {
  entityType: 'contract',
  name: 'ContractWorkflow',
  states: [
    'draft',
    'pending_signature',
    'active',
    'completed',
    'terminated',
  ],
  terminalStates: ['completed', 'terminated'],
  transitions: {
    draft: ['pending_signature', 'terminated'],
    pending_signature: ['active', 'terminated'],
    active: ['completed', 'terminated'],
    completed: [],
    terminated: [],
  },
}

export const WORKFLOW_DEFINITIONS = {
  application: ApplicationWorkflow,
  opportunity: OpportunityWorkflow,
  match: MatchWorkflow,
  negotiation: NegotiationWorkflow,
  deal: DealWorkflow,
  contract: ContractWorkflow,
} as const

export function getWorkflowDefinition(
  entityType: keyof typeof WORKFLOW_DEFINITIONS,
): WorkflowDefinition {
  return WORKFLOW_DEFINITIONS[entityType]
}
