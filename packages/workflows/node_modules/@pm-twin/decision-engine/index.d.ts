export type DecisionEntityType =
  | 'commercial_agreement'
  | 'contract'
  | 'change_request'
  | 'payment'
  | 'milestone'
  | 'project_closure'
  | string

export type DecisionOutcome = 'approved' | 'rejected' | 'cancelled'
export type DecisionStatus =
  | 'pending'
  | 'in_review'
  | 'escalated'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'expired'

export type ApprovalMode = 'sequential' | 'parallel'

export type DecisionActor = {
  readonly actorId: string
  readonly actorRole?: string
}

export type DecisionRule = {
  readonly minApprovals?: number
  readonly requireUnanimous?: boolean
}

export type EscalationPolicy = {
  readonly escalateTo: readonly string[]
  readonly afterMinutes: number
}

export type DelegationPolicy = {
  readonly allowDelegation: boolean
  readonly maxDepth?: number
}

export type DecisionStageConfig = {
  readonly key: string
  readonly label: string
  readonly approvers: readonly string[]
  readonly mode: ApprovalMode
  readonly slaMinutes?: number
  readonly rule?: DecisionRule
  readonly escalation?: EscalationPolicy
  readonly delegation?: DelegationPolicy
}

export type DecisionMatrixConfig = {
  readonly matrixId: string
  readonly label: string
  readonly entityType: DecisionEntityType
  readonly stages: readonly DecisionStageConfig[]
}

export type DecisionHistoryEventType =
  | 'decision.started'
  | 'approval.recorded'
  | 'approval.rejected'
  | 'decision.stage_advanced'
  | 'decision.delegated'
  | 'decision.escalated'
  | 'decision.completed'
  | 'decision.cancelled'
  | 'decision.expired'

export type DecisionHistoryEvent = {
  readonly id: string
  readonly decisionId: string
  readonly eventType: DecisionHistoryEventType
  readonly actorId?: string
  readonly timestamp: string
  readonly summary: string
  readonly metadata?: Readonly<Record<string, unknown>>
}

export type DecisionStageState = {
  readonly key: string
  readonly startedAt: string
  readonly completedAt?: string
  readonly approvals: Readonly<Record<string, 'approved' | 'rejected'>>
  readonly delegatedApprovers: Readonly<Record<string, string>>
  readonly escalated?: boolean
}

export type DecisionRecord = {
  readonly id: string
  readonly matrixId: string
  readonly entityType: DecisionEntityType
  readonly entityId: string
  readonly status: DecisionStatus
  readonly createdAt: string
  readonly updatedAt: string
  readonly currentStageIndex: number
  readonly stages: readonly DecisionStageState[]
  readonly history: readonly DecisionHistoryEvent[]
}

export type StartDecisionInput = {
  readonly decisionId: string
  readonly entityId: string
  readonly startedBy: DecisionActor
  readonly at?: string
}

export type RecordApprovalInput = {
  readonly actorId: string
  readonly decisionId: string
  readonly approve: boolean
  readonly at?: string
  readonly comment?: string
}

export type DelegateApprovalInput = {
  readonly decisionId: string
  readonly fromApproverId: string
  readonly toApproverId: string
  readonly actorId: string
  readonly at?: string
}

export type TickSlaInput = {
  readonly decisionId: string
  readonly at?: string
}

export type DecisionAuditEvent = {
  readonly action: string
  readonly entityType: 'decision'
  readonly entityId: string
  readonly actorId?: string
  readonly beforeState?: Readonly<Record<string, unknown>>
  readonly afterState?: Readonly<Record<string, unknown>>
  readonly metadata?: Readonly<Record<string, unknown>>
  readonly timestamp: string
}

export function startDecision(
  matrix: DecisionMatrixConfig,
  input: StartDecisionInput,
): DecisionRecord
export function delegateApproval(
  matrix: DecisionMatrixConfig,
  decision: DecisionRecord,
  input: DelegateApprovalInput,
): DecisionRecord
export function recordApproval(
  matrix: DecisionMatrixConfig,
  decision: DecisionRecord,
  input: RecordApprovalInput,
): DecisionRecord
export function tickSla(
  matrix: DecisionMatrixConfig,
  decision: DecisionRecord,
  input: TickSlaInput,
): DecisionRecord
export function cancelDecision(
  decision: DecisionRecord,
  actorId: string,
  at?: string,
): DecisionRecord
export function toAuditEvents(decision: DecisionRecord): readonly DecisionAuditEvent[]
export function isDecisionApproved(decision: DecisionRecord | null | undefined): boolean
export function isDecisionStatusApproved(
  status: DecisionStatus | string | null | undefined,
): boolean
