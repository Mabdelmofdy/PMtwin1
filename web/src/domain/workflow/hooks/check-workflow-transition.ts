import { canTransition, getWorkflowDefinition } from '@/domain/workflow/core/workflow-engine.ts'
import {
  logAllowedTransition,
  logBlockedTransition,
  logTransitionAttempt,
} from '@/domain/workflow/observability/workflow-logger.ts'
import type {
  WorkflowCheckInput,
  WorkflowCheckResult,
} from '@/domain/workflow/types.ts'

export type CheckWorkflowTransitionOptions = {
  /** When true, emit observability logs (never blocks). Default false. */
  log?: boolean
}

/**
 * Opt-in workflow decision hook — does not enforce or mutate anything.
 */
export function checkWorkflowTransition(
  input: WorkflowCheckInput,
  options: CheckWorkflowTransitionOptions = {},
): WorkflowCheckResult {
  const { entityType, from, to, context = {} } = input
  const workflow = getWorkflowDefinition(entityType).name

  if (options.log) {
    logTransitionAttempt({
      entityType,
      from,
      to,
      userId: context.userId,
      userRole: context.userRole,
    })
  }

  const result = canTransition(entityType, from, to, context)
  const check: WorkflowCheckResult = {
    allowed: result.allowed,
    reason: result.reason,
    workflow,
    fromCanonical: result.fromCanonical,
    toCanonical: result.toCanonical,
  }

  if (options.log) {
    if (check.allowed) {
      logAllowedTransition({
        entityType,
        from,
        to,
        userId: context.userId,
        userRole: context.userRole,
      })
    } else {
      logBlockedTransition({
        entityType,
        from,
        to,
        reason: check.reason,
        userId: context.userId,
        userRole: context.userRole,
      })
    }
  }

  return check
}
