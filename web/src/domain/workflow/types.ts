/**
 * Workflow engine types — decision layer only; no runtime enforcement.
 */

export type WorkflowEntityType =
  | 'application'
  | 'opportunity'
  | 'negotiation'
  | 'deal'
  | 'contract'

export type WorkflowUserRole = 'user' | 'company_owner' | 'admin' | string

export type WorkflowContext = {
  userId?: string
  userRole?: WorkflowUserRole
  tenantId?: string
  entitySnapshot?: Record<string, unknown>
  metadata?: Record<string, unknown>
}

export type TransitionResult = {
  allowed: boolean
  reason?: string
  /** Canonical workflow state used after legacy mapping */
  fromCanonical?: string
  toCanonical?: string
}

export type WorkflowCheckInput = {
  entityType: WorkflowEntityType
  from: string
  to: string
  context?: WorkflowContext
}

export type WorkflowCheckResult = TransitionResult & {
  workflow: string
}

export type WorkflowRuleResult = {
  allowed: boolean
  reason?: string
}

export type WorkflowRule = (
  from: string,
  to: string,
  context: WorkflowContext,
) => WorkflowRuleResult

export type WorkflowDefinition = {
  entityType: WorkflowEntityType
  name: string
  /** Canonical state identifiers for this workflow */
  states: readonly string[]
  /** States with no outgoing transitions in the canonical model */
  terminalStates: readonly string[]
  /** Adjacency list: fromState → allowed next canonical states */
  transitions: Readonly<Record<string, readonly string[]>>
}

export type WorkflowGraphNode = {
  id: string
  terminal: boolean
}

export type WorkflowGraphEdge = {
  from: string
  to: string
}

export type WorkflowGraph = {
  entityType: WorkflowEntityType
  workflow: string
  nodes: WorkflowGraphNode[]
  edges: WorkflowGraphEdge[]
  adjacencyList: Readonly<Record<string, readonly string[]>>
}

export type TransitionLogEntry = {
  at: string
  entityType: WorkflowEntityType
  from: string
  to: string
  allowed: boolean
  reason?: string
  userId?: string
  userRole?: string
}
