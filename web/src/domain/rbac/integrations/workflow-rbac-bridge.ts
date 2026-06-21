/**
 * Workflow ↔ RBAC integration bridge.
 * Combines workflow validity ("can it happen") with RBAC ("can user do it").
 */

import { canTransition } from '@/domain/workflow/core/workflow-engine.ts'
import { toCanonicalStatus } from '@/domain/workflow/legacy-map.ts'
import type { WorkflowContext } from '@/domain/workflow/types.ts'
import { evaluatePolicy } from '@/domain/rbac/core/policy-engine.ts'
import {
  ACTION_WORKFLOW_TARGETS,
  ACTION_ENTITY_MAP,
} from '@/domain/rbac/registry.ts'
import type {
  CombinedWorkflowRbacDecision,
  PermissionAction,
  PermissionContext,
} from '@/domain/rbac/types.ts'

export type EvaluateActionWithWorkflowOptions = {
  /** Override target workflow state (instead of registry default). */
  targetState?: string
  /** When true, workflow check is skipped for non-transition actions. Default: auto. */
  skipWorkflowCheck?: boolean
}

function toWorkflowContext(context: PermissionContext): WorkflowContext {
  return {
    userId: context.userId,
    userRole: context.userRole,
    tenantId: context.tenantId ?? context.organizationId,
    entitySnapshot: context.entitySnapshot,
    metadata: context.metadata,
  }
}

function resolveTargetState(
  action: PermissionAction,
  options: EvaluateActionWithWorkflowOptions,
): string | undefined {
  if (options.targetState) {
    return toCanonicalStatus(
      ACTION_ENTITY_MAP[action],
      options.targetState,
    )
  }
  const registered = ACTION_WORKFLOW_TARGETS[action]
  return registered ?? undefined
}

/**
 * Evaluate an action combining workflow engine and RBAC policy decisions.
 * Pure function — no side effects, no blocking.
 */
export function evaluateActionWithWorkflow(
  action: PermissionAction,
  context: PermissionContext,
  options: EvaluateActionWithWorkflowOptions = {},
): CombinedWorkflowRbacDecision {
  const rbacResult = evaluatePolicy(action, context)
  const targetState = resolveTargetState(action, options)
  const entityType = context.entityType

  let workflowAllowed = true
  let workflowReason: string | undefined

  const shouldCheckWorkflow =
    !options.skipWorkflowCheck && targetState != null && context.workflowState !== ''

  if (shouldCheckWorkflow && targetState) {
    const workflowResult = canTransition(
      entityType,
      context.workflowState,
      targetState,
      toWorkflowContext(context),
    )
    workflowAllowed = workflowResult.allowed
    workflowReason = workflowResult.reason
  } else if (!targetState && !options.skipWorkflowCheck) {
    // Creation / view actions have no workflow transition target
    workflowAllowed = true
  }

  const rbacAllowed = rbacResult.allowed
  const allowed = workflowAllowed && rbacAllowed

  let reason: string | undefined
  if (!allowed) {
    if (!workflowAllowed && !rbacAllowed) {
      reason = `Workflow: ${workflowReason ?? 'transition not allowed'}; RBAC: ${rbacResult.reason ?? 'denied'}`
    } else if (!workflowAllowed) {
      reason = workflowReason ?? 'Workflow transition not allowed'
    } else {
      reason = rbacResult.reason ?? 'RBAC policy denied'
    }
  }

  return {
    allowed,
    workflowAllowed,
    rbacAllowed,
    reason,
    matchedPolicies: rbacResult.matchedPolicies,
    workflowReason,
    rbacReason: rbacResult.reason,
  }
}
