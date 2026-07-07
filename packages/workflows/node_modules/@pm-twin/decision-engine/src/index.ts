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

function nowIso(value?: string): string {
  return value ?? new Date().toISOString()
}

function createEvent(
  decisionId: string,
  eventType: DecisionHistoryEventType,
  summary: string,
  at: string,
  actorId?: string,
  metadata?: Readonly<Record<string, unknown>>,
): DecisionHistoryEvent {
  return {
    id: `${eventType}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    decisionId,
    eventType,
    actorId,
    timestamp: at,
    summary,
    metadata,
  }
}

function resolveStageApprovers(
  stageConfig: DecisionStageConfig,
  stageState: DecisionStageState,
): readonly string[] {
  const delegatedByApprover = stageState.delegatedApprovers
  const resolved = stageConfig.approvers.map(
    (approverId) => delegatedByApprover[approverId] ?? approverId,
  )
  const escalated = Object.entries(delegatedByApprover)
    .filter(([key]) => key.startsWith('escalated:'))
    .map(([, value]) => value)
  return Array.from(new Set([...resolved, ...escalated]))
}

function stageThreshold(stage: DecisionStageConfig): number {
  if (stage.rule?.requireUnanimous) return stage.approvers.length
  return Math.max(1, stage.rule?.minApprovals ?? stage.approvers.length)
}

function isStageApproved(
  stageConfig: DecisionStageConfig,
  stageState: DecisionStageState,
): boolean {
  const approvers = resolveStageApprovers(stageConfig, stageState)
  const approvals = approvers.filter((id) => stageState.approvals[id] === 'approved').length
  if (stageConfig.mode === 'parallel') return approvals >= stageThreshold(stageConfig)
  const nextExpected = approvers[approvals]
  return !nextExpected && approvals >= stageThreshold(stageConfig)
}

function currentStage(
  matrix: DecisionMatrixConfig,
  decision: DecisionRecord,
): { readonly config: DecisionStageConfig; readonly state: DecisionStageState } | null {
  const config = matrix.stages[decision.currentStageIndex]
  const state = decision.stages[decision.currentStageIndex]
  if (!config || !state) return null
  return { config, state }
}

export function startDecision(
  matrix: DecisionMatrixConfig,
  input: StartDecisionInput,
): DecisionRecord {
  const at = nowIso(input.at)
  const firstStage = matrix.stages[0]
  const stageState: DecisionStageState = {
    key: firstStage.key,
    startedAt: at,
    approvals: {},
    delegatedApprovers: {},
  }
  const history: DecisionHistoryEvent[] = [
    createEvent(
      input.decisionId,
      'decision.started',
      `Decision started for ${matrix.entityType}`,
      at,
      input.startedBy.actorId,
      { matrixId: matrix.matrixId, entityId: input.entityId },
    ),
  ]
  return {
    id: input.decisionId,
    matrixId: matrix.matrixId,
    entityType: matrix.entityType,
    entityId: input.entityId,
    status: 'in_review',
    createdAt: at,
    updatedAt: at,
    currentStageIndex: 0,
    stages: [stageState],
    history,
  }
}

export function delegateApproval(
  matrix: DecisionMatrixConfig,
  decision: DecisionRecord,
  input: DelegateApprovalInput,
): DecisionRecord {
  const at = nowIso(input.at)
  const stage = currentStage(matrix, decision)
  if (!stage) return decision
  if (!stage.config.delegation?.allowDelegation) return decision
  if (!stage.config.approvers.includes(input.fromApproverId)) return decision

  const nextStageState: DecisionStageState = {
    ...stage.state,
    delegatedApprovers: {
      ...stage.state.delegatedApprovers,
      [input.fromApproverId]: input.toApproverId,
    },
  }
  const stages = [...decision.stages]
  stages[decision.currentStageIndex] = nextStageState
  return {
    ...decision,
    stages,
    updatedAt: at,
    history: [
      ...decision.history,
      createEvent(
        decision.id,
        'decision.delegated',
        `Approval delegated from ${input.fromApproverId} to ${input.toApproverId}`,
        at,
        input.actorId,
      ),
    ],
  }
}

export function recordApproval(
  matrix: DecisionMatrixConfig,
  decision: DecisionRecord,
  input: RecordApprovalInput,
): DecisionRecord {
  if (decision.status !== 'in_review' && decision.status !== 'escalated') return decision
  const at = nowIso(input.at)
  const stage = currentStage(matrix, decision)
  if (!stage) return decision

  const approvers = resolveStageApprovers(stage.config, stage.state)
  if (!approvers.includes(input.actorId)) return decision

  if (stage.config.mode === 'sequential') {
    const completed = approvers.filter((id) => stage.state.approvals[id] === 'approved')
    const nextExpected = approvers[completed.length]
    if (nextExpected && nextExpected !== input.actorId) return decision
  }

  const approvals = {
    ...stage.state.approvals,
    [input.actorId]: input.approve ? 'approved' : 'rejected',
  } as const

  const updatedStage: DecisionStageState = { ...stage.state, approvals }
  let nextDecision: DecisionRecord = {
    ...decision,
    updatedAt: at,
    stages: decision.stages.map((item, idx) =>
      idx === decision.currentStageIndex ? updatedStage : item,
    ),
    history: [
      ...decision.history,
      createEvent(
        decision.id,
        input.approve ? 'approval.recorded' : 'approval.rejected',
        input.approve ? 'Approval recorded' : 'Approval rejected',
        at,
        input.actorId,
        input.comment ? { comment: input.comment } : undefined,
      ),
    ],
  }

  if (!input.approve) {
    return {
      ...nextDecision,
      status: 'rejected',
      history: [
        ...nextDecision.history,
        createEvent(decision.id, 'decision.completed', 'Decision rejected', at, input.actorId),
      ],
    }
  }

  if (!isStageApproved(stage.config, updatedStage)) {
    return nextDecision
  }

  const nextIndex = decision.currentStageIndex + 1
  if (!matrix.stages[nextIndex]) {
    return {
      ...nextDecision,
      status: 'approved',
      history: [
        ...nextDecision.history,
        createEvent(decision.id, 'decision.completed', 'Decision approved', at, input.actorId),
      ],
    }
  }

  const nextStageConfig = matrix.stages[nextIndex]
  const appendedStage: DecisionStageState = {
    key: nextStageConfig.key,
    startedAt: at,
    approvals: {},
    delegatedApprovers: {},
  }

  return {
    ...nextDecision,
    currentStageIndex: nextIndex,
    stages: [...nextDecision.stages, appendedStage],
    history: [
      ...nextDecision.history,
      createEvent(
        decision.id,
        'decision.stage_advanced',
        `Advanced to stage "${nextStageConfig.label}"`,
        at,
        input.actorId,
      ),
    ],
  }
}

export function tickSla(
  matrix: DecisionMatrixConfig,
  decision: DecisionRecord,
  input: TickSlaInput,
): DecisionRecord {
  if (decision.status !== 'in_review' && decision.status !== 'escalated') return decision
  const at = nowIso(input.at)
  const stage = currentStage(matrix, decision)
  if (!stage) return decision
  if (!stage.config.slaMinutes || !stage.config.escalation) return decision
  if (stage.state.escalated) return decision

  const elapsedMs = Date.parse(at) - Date.parse(stage.state.startedAt)
  if (elapsedMs < stage.config.slaMinutes * 60_000) return decision

  const nextStage: DecisionStageState = {
    ...stage.state,
    escalated: true,
    delegatedApprovers: {
      ...stage.state.delegatedApprovers,
      ...Object.fromEntries(stage.config.escalation.escalateTo.map((id) => [`escalated:${id}`, id])),
    },
  }
  return {
    ...decision,
    status: 'escalated',
    updatedAt: at,
    stages: decision.stages.map((item, idx) =>
      idx === decision.currentStageIndex ? nextStage : item,
    ),
    history: [
      ...decision.history,
      createEvent(
        decision.id,
        'decision.escalated',
        'Decision stage escalated due to SLA breach',
        at,
        undefined,
        { escalatedTo: stage.config.escalation.escalateTo },
      ),
    ],
  }
}

export function cancelDecision(
  decision: DecisionRecord,
  actorId: string,
  at?: string,
): DecisionRecord {
  const timestamp = nowIso(at)
  if (decision.status === 'approved' || decision.status === 'rejected') return decision
  return {
    ...decision,
    status: 'cancelled',
    updatedAt: timestamp,
    history: [
      ...decision.history,
      createEvent(decision.id, 'decision.cancelled', 'Decision cancelled', timestamp, actorId),
    ],
  }
}

export function toAuditEvents(decision: DecisionRecord): readonly DecisionAuditEvent[] {
  return decision.history.map((event) => ({
    action: event.eventType,
    entityType: 'decision',
    entityId: decision.id,
    actorId: event.actorId,
    metadata: {
      decisionId: decision.id,
      matrixId: decision.matrixId,
      eventType: event.eventType,
      ...event.metadata,
    },
    timestamp: event.timestamp,
  }))
}

export function isDecisionApproved(decision: DecisionRecord | null | undefined): boolean {
  return decision?.status === 'approved'
}

export function isDecisionStatusApproved(
  status: DecisionStatus | string | null | undefined,
): boolean {
  return status === 'approved'
}
