import type { WorkflowDefinition } from '@/domain/workflow/types.ts'

export const ApplicationWorkflow: WorkflowDefinition = {
  entityType: 'application',
  name: 'ApplicationWorkflow',
  states: [
    'submitted',
    'reviewing',
    'shortlisted',
    'negotiation',
    'accepted',
    'rejected',
    'withdrawn',
  ],
  terminalStates: ['accepted', 'rejected', 'withdrawn'],
  transitions: {
    submitted: ['reviewing', 'rejected', 'withdrawn'],
    reviewing: ['shortlisted', 'rejected', 'withdrawn'],
    shortlisted: ['negotiation', 'rejected', 'withdrawn'],
    negotiation: ['accepted', 'rejected', 'withdrawn'],
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
    'negotiation',
    'contracted',
    'execution',
    'completed',
    'cancelled',
  ],
  terminalStates: ['completed', 'cancelled'],
  transitions: {
    draft: ['published', 'cancelled'],
    published: ['matched', 'negotiation', 'cancelled'],
    matched: ['negotiation', 'contracted', 'cancelled'],
    negotiation: ['contracted', 'cancelled'],
    contracted: ['execution', 'cancelled'],
    execution: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
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
  states: ['draft', 'active', 'execution', 'completed', 'cancelled'],
  terminalStates: ['completed', 'cancelled'],
  transitions: {
    draft: ['active', 'cancelled'],
    active: ['execution', 'completed', 'cancelled'],
    execution: ['completed', 'cancelled'],
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
  negotiation: NegotiationWorkflow,
  deal: DealWorkflow,
  contract: ContractWorkflow,
} as const

export function getWorkflowDefinition(
  entityType: keyof typeof WORKFLOW_DEFINITIONS,
): WorkflowDefinition {
  return WORKFLOW_DEFINITIONS[entityType]
}
