/**
 * RBAC audit hook — non-blocking observability for permission decisions.
 */

import type {
  CombinedWorkflowRbacDecision,
  PermissionAction,
  PermissionContext,
  PolicyEvaluation,
  RbacAuditEntry,
  RbacAuditReport,
} from '@/domain/rbac/types.ts'

let auditBuffer: RbacAuditEntry[] = []
let auditEnabled = false

export function setRbacAuditEnabled(enabled: boolean): void {
  auditEnabled = enabled
}

export function isRbacAuditEnabled(): boolean {
  return auditEnabled
}

export function clearRbacAuditBuffer(): RbacAuditEntry[] {
  const snapshot = [...auditBuffer]
  auditBuffer = []
  return snapshot
}

export function getRbacAuditBuffer(): readonly RbacAuditEntry[] {
  return auditBuffer
}

function pushEntry(entry: RbacAuditEntry): void {
  if (!auditEnabled) return
  auditBuffer.push(entry)
  if (auditBuffer.length > 500) {
    auditBuffer = auditBuffer.slice(-500)
  }
}

/**
 * Log an RBAC decision (allowed or denied) — never blocks execution.
 */
export function logRbacDecision(
  action: PermissionAction | string,
  context: PermissionContext,
  result: PolicyEvaluation,
): void {
  pushEntry({
    at: new Date().toISOString(),
    action,
    allowed: result.allowed,
    userId: context.userId,
    userRole: String(context.userRole),
    entityType: context.entityType,
    workflowState: context.workflowState,
    reason: result.reason,
    matchedPolicies: result.matchedPolicies,
    workflowConflict: false,
  })
}

/**
 * Log an advisory RBAC violation — informational only.
 */
export function logRbacViolation(
  action: PermissionAction | string,
  context: PermissionContext,
  reason: string,
  options: { workflowConflict?: boolean } = {},
): void {
  pushEntry({
    at: new Date().toISOString(),
    action,
    allowed: false,
    userId: context.userId,
    userRole: String(context.userRole),
    entityType: context.entityType,
    workflowState: context.workflowState,
    reason,
    workflowConflict: options.workflowConflict ?? false,
  })
}

/**
 * Log a combined workflow + RBAC decision for conflict analysis.
 */
export function logCombinedDecision(
  action: PermissionAction | string,
  context: PermissionContext,
  decision: CombinedWorkflowRbacDecision,
): void {
  const workflowConflict =
    decision.workflowAllowed !== decision.rbacAllowed &&
    (decision.workflowAllowed || decision.rbacAllowed)

  pushEntry({
    at: new Date().toISOString(),
    action,
    allowed: decision.allowed,
    userId: context.userId,
    userRole: String(context.userRole),
    entityType: context.entityType,
    workflowState: context.workflowState,
    reason: decision.reason,
    matchedPolicies: decision.matchedPolicies,
    workflowConflict,
  })
}

/** Generate a summary report from the audit buffer. */
export function generateRbacReport(
  entries: readonly RbacAuditEntry[] = auditBuffer,
): RbacAuditReport {
  const allowedCount = entries.filter((e) => e.allowed).length
  const deniedCount = entries.filter((e) => !e.allowed).length
  const workflowConflicts = entries.filter((e) => e.workflowConflict).length

  return {
    generatedAt: new Date().toISOString(),
    totalDecisions: entries.length,
    allowedCount,
    deniedCount,
    workflowConflicts,
    entries: [...entries],
  }
}
