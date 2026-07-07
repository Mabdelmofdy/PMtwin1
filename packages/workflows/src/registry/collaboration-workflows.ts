import type { WorkflowDefinition, WorkflowKey } from '../types.ts'

export const COLLABORATION_WORKFLOW_DEFINITIONS: Record<
  Exclude<
    WorkflowKey,
    'marketplace' | 'hiring'
  >,
  WorkflowDefinition
> = {
  cash_subcontracting: {
    key: 'cash_subcontracting',
    label: 'Cash subcontracting',
    startEntity: 'opportunity',
    steps: ['opportunity', 'publish', 'matching', 'post_match', 'negotiation', 'commercial_agreement', 'contract', 'completion'],
    allowedTransitions: [],
    allowedCommands: [],
    businessRules: [
      'Requires cash or hybrid exchange mode',
      'Cash budget and payment schedule required before publish',
      'Defaults to one-way matching topology',
    ],
    terminalStates: ['completed', 'cancelled'],
  },
  service_exchange: {
    key: 'service_exchange',
    label: 'Service exchange / barter',
    startEntity: 'opportunity',
    steps: ['opportunity', 'publish', 'matching', 'post_match', 'negotiation', 'commercial_agreement', 'contract', 'completion'],
    allowedTransitions: [],
    allowedCommands: [],
    businessRules: [
      'Requires barter or hybrid exchange mode',
      'Barter offer and requested service required before publish',
      'Defaults to two-way matching topology',
    ],
    terminalStates: ['completed', 'cancelled'],
  },
  joint_venture: {
    key: 'joint_venture',
    label: 'Joint venture',
    startEntity: 'opportunity',
    steps: ['opportunity', 'publish', 'matching', 'post_match', 'negotiation', 'commercial_agreement', 'contract', 'completion'],
    allowedTransitions: [],
    allowedCommands: [],
    businessRules: [
      'Requires equity, profit sharing, or hybrid exchange for commercial terms',
      'Joint venture sub-model attributes required before publish',
      'Defaults to consortium matching topology',
    ],
    terminalStates: ['completed', 'cancelled'],
  },
  resource_sharing: {
    key: 'resource_sharing',
    label: 'Resource sharing',
    startEntity: 'opportunity',
    steps: ['opportunity', 'publish', 'matching', 'post_match', 'negotiation', 'commercial_agreement', 'contract', 'completion'],
    allowedTransitions: [],
    allowedCommands: [],
    businessRules: [
      'Resource availability and location required before publish',
      'Barter resource sharing may use circular matching',
    ],
    terminalStates: ['completed', 'cancelled'],
  },
  hiring_engagement: {
    key: 'hiring_engagement',
    label: 'Hiring / professional engagement',
    startEntity: 'application',
    steps: ['application', 'accepted', 'negotiation', 'commercial_agreement', 'contract', 'completion'],
    allowedTransitions: [],
    allowedCommands: [],
    businessRules: [
      'Professional hiring requires salary range and start date',
      'Application path is primary for formal hiring and RFP',
    ],
    terminalStates: ['completed', 'cancelled', 'rejected'],
  },
}

export function resolveCollaborationWorkflowKey(
  mainCollaborationModel?: string,
): WorkflowKey | undefined {
  switch (mainCollaborationModel) {
    case 'cash_subcontracting':
      return 'cash_subcontracting'
    case 'service_exchange':
      return 'service_exchange'
    case 'joint_venture':
      return 'joint_venture'
    case 'resource_sharing':
      return 'resource_sharing'
    case 'hiring':
      return 'hiring_engagement'
    default:
      return undefined
  }
}
