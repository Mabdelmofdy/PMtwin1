// src/index.ts
function nowIso(value) {
  return value ?? (/* @__PURE__ */ new Date()).toISOString();
}
function createEvent(decisionId, eventType, summary, at, actorId, metadata) {
  return {
    id: `${eventType}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    decisionId,
    eventType,
    actorId,
    timestamp: at,
    summary,
    metadata
  };
}
function resolveStageApprovers(stageConfig, stageState) {
  const delegatedByApprover = stageState.delegatedApprovers;
  const resolved = stageConfig.approvers.map(
    (approverId) => delegatedByApprover[approverId] ?? approverId
  );
  const escalated = Object.entries(delegatedByApprover).filter(([key]) => key.startsWith("escalated:")).map(([, value]) => value);
  return Array.from(/* @__PURE__ */ new Set([...resolved, ...escalated]));
}
function stageThreshold(stage) {
  if (stage.rule?.requireUnanimous) return stage.approvers.length;
  return Math.max(1, stage.rule?.minApprovals ?? stage.approvers.length);
}
function isStageApproved(stageConfig, stageState) {
  const approvers = resolveStageApprovers(stageConfig, stageState);
  const approvals = approvers.filter((id) => stageState.approvals[id] === "approved").length;
  if (stageConfig.mode === "parallel") return approvals >= stageThreshold(stageConfig);
  const nextExpected = approvers[approvals];
  return !nextExpected && approvals >= stageThreshold(stageConfig);
}
function currentStage(matrix, decision) {
  const config = matrix.stages[decision.currentStageIndex];
  const state = decision.stages[decision.currentStageIndex];
  if (!config || !state) return null;
  return { config, state };
}
function startDecision(matrix, input) {
  const at = nowIso(input.at);
  const firstStage = matrix.stages[0];
  const stageState = {
    key: firstStage.key,
    startedAt: at,
    approvals: {},
    delegatedApprovers: {}
  };
  const history = [
    createEvent(
      input.decisionId,
      "decision.started",
      `Decision started for ${matrix.entityType}`,
      at,
      input.startedBy.actorId,
      { matrixId: matrix.matrixId, entityId: input.entityId }
    )
  ];
  return {
    id: input.decisionId,
    matrixId: matrix.matrixId,
    entityType: matrix.entityType,
    entityId: input.entityId,
    status: "in_review",
    createdAt: at,
    updatedAt: at,
    currentStageIndex: 0,
    stages: [stageState],
    history
  };
}
function delegateApproval(matrix, decision, input) {
  const at = nowIso(input.at);
  const stage = currentStage(matrix, decision);
  if (!stage) return decision;
  if (!stage.config.delegation?.allowDelegation) return decision;
  if (!stage.config.approvers.includes(input.fromApproverId)) return decision;
  const nextStageState = {
    ...stage.state,
    delegatedApprovers: {
      ...stage.state.delegatedApprovers,
      [input.fromApproverId]: input.toApproverId
    }
  };
  const stages = [...decision.stages];
  stages[decision.currentStageIndex] = nextStageState;
  return {
    ...decision,
    stages,
    updatedAt: at,
    history: [
      ...decision.history,
      createEvent(
        decision.id,
        "decision.delegated",
        `Approval delegated from ${input.fromApproverId} to ${input.toApproverId}`,
        at,
        input.actorId
      )
    ]
  };
}
function recordApproval(matrix, decision, input) {
  if (decision.status !== "in_review" && decision.status !== "escalated") return decision;
  const at = nowIso(input.at);
  const stage = currentStage(matrix, decision);
  if (!stage) return decision;
  const approvers = resolveStageApprovers(stage.config, stage.state);
  if (!approvers.includes(input.actorId)) return decision;
  if (stage.config.mode === "sequential") {
    const completed = approvers.filter((id) => stage.state.approvals[id] === "approved");
    const nextExpected = approvers[completed.length];
    if (nextExpected && nextExpected !== input.actorId) return decision;
  }
  const approvals = {
    ...stage.state.approvals,
    [input.actorId]: input.approve ? "approved" : "rejected"
  };
  const updatedStage = { ...stage.state, approvals };
  let nextDecision = {
    ...decision,
    updatedAt: at,
    stages: decision.stages.map(
      (item, idx) => idx === decision.currentStageIndex ? updatedStage : item
    ),
    history: [
      ...decision.history,
      createEvent(
        decision.id,
        input.approve ? "approval.recorded" : "approval.rejected",
        input.approve ? "Approval recorded" : "Approval rejected",
        at,
        input.actorId,
        input.comment ? { comment: input.comment } : void 0
      )
    ]
  };
  if (!input.approve) {
    return {
      ...nextDecision,
      status: "rejected",
      history: [
        ...nextDecision.history,
        createEvent(decision.id, "decision.completed", "Decision rejected", at, input.actorId)
      ]
    };
  }
  if (!isStageApproved(stage.config, updatedStage)) {
    return nextDecision;
  }
  const nextIndex = decision.currentStageIndex + 1;
  if (!matrix.stages[nextIndex]) {
    return {
      ...nextDecision,
      status: "approved",
      history: [
        ...nextDecision.history,
        createEvent(decision.id, "decision.completed", "Decision approved", at, input.actorId)
      ]
    };
  }
  const nextStageConfig = matrix.stages[nextIndex];
  const appendedStage = {
    key: nextStageConfig.key,
    startedAt: at,
    approvals: {},
    delegatedApprovers: {}
  };
  return {
    ...nextDecision,
    currentStageIndex: nextIndex,
    stages: [...nextDecision.stages, appendedStage],
    history: [
      ...nextDecision.history,
      createEvent(
        decision.id,
        "decision.stage_advanced",
        `Advanced to stage "${nextStageConfig.label}"`,
        at,
        input.actorId
      )
    ]
  };
}
function tickSla(matrix, decision, input) {
  if (decision.status !== "in_review" && decision.status !== "escalated") return decision;
  const at = nowIso(input.at);
  const stage = currentStage(matrix, decision);
  if (!stage) return decision;
  if (!stage.config.slaMinutes || !stage.config.escalation) return decision;
  if (stage.state.escalated) return decision;
  const elapsedMs = Date.parse(at) - Date.parse(stage.state.startedAt);
  if (elapsedMs < stage.config.slaMinutes * 6e4) return decision;
  const nextStage = {
    ...stage.state,
    escalated: true,
    delegatedApprovers: {
      ...stage.state.delegatedApprovers,
      ...Object.fromEntries(stage.config.escalation.escalateTo.map((id) => [`escalated:${id}`, id]))
    }
  };
  return {
    ...decision,
    status: "escalated",
    updatedAt: at,
    stages: decision.stages.map(
      (item, idx) => idx === decision.currentStageIndex ? nextStage : item
    ),
    history: [
      ...decision.history,
      createEvent(
        decision.id,
        "decision.escalated",
        "Decision stage escalated due to SLA breach",
        at,
        void 0,
        { escalatedTo: stage.config.escalation.escalateTo }
      )
    ]
  };
}
function cancelDecision(decision, actorId, at) {
  const timestamp = nowIso(at);
  if (decision.status === "approved" || decision.status === "rejected") return decision;
  return {
    ...decision,
    status: "cancelled",
    updatedAt: timestamp,
    history: [
      ...decision.history,
      createEvent(decision.id, "decision.cancelled", "Decision cancelled", timestamp, actorId)
    ]
  };
}
function toAuditEvents(decision) {
  return decision.history.map((event) => ({
    action: event.eventType,
    entityType: "decision",
    entityId: decision.id,
    actorId: event.actorId,
    metadata: {
      decisionId: decision.id,
      matrixId: decision.matrixId,
      eventType: event.eventType,
      ...event.metadata
    },
    timestamp: event.timestamp
  }));
}
function isDecisionApproved(decision) {
  return decision?.status === "approved";
}
function isDecisionStatusApproved(status) {
  return status === "approved";
}
export {
  cancelDecision,
  delegateApproval,
  isDecisionApproved,
  isDecisionStatusApproved,
  recordApproval,
  startDecision,
  tickSla,
  toAuditEvents
};
