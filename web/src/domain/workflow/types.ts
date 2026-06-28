/**
 * Workflow engine types — decision layer only; no runtime enforcement.
 * All status identifiers use ADR-001 canonical names.
 */

export type WorkflowEntityType =
  | 'application'
  | 'opportunity'
  | 'match'
  | 'negotiation'
  | 'deal'
  | 'contract'

export type ApplicationStatus =
  | 'submitted'
  | 'reviewing'
  | 'shortlisted'
  | 'negotiating'
  | 'accepted'
  | 'rejected'
  | 'withdrawn'

export type OpportunityStatus =
  | 'draft'
  | 'published'
  | 'matched'
  | 'negotiating'
  | 'contracted'
  | 'executing'
  | 'completed'
  | 'cancelled'

export type MatchStatus =
  | 'discovered'
  | 'accepted'
  | 'confirmed'
  | 'declined'
  | 'expired'
  | 'superseded'

export type NegotiationStatus =
  | 'active'
  | 'countered'
  | 'agreed'
  | 'expired'
  | 'cancelled'

export type DealStatus =
  | 'draft'
  | 'review'
  | 'signing'
  | 'executing'
  | 'completed'
  | 'cancelled'

export type ContractStatus =
  | 'draft'
  | 'pending_signature'
  | 'active'
  | 'completed'
  | 'terminated'

export type WorkflowEntityStatusMap = {
  application: ApplicationStatus
  opportunity: OpportunityStatus
  match: MatchStatus
  negotiation: NegotiationStatus
  deal: DealStatus
  contract: ContractStatus
}

export type WorkflowStatus<T extends WorkflowEntityType> =
  WorkflowEntityStatusMap[T]

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
  /** Canonical ADR-001 state identifiers for this workflow */
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
