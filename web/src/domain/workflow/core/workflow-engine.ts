import {
  getWorkflowDefinition,
  WORKFLOW_DEFINITIONS,
} from '@/domain/workflow/definitions/index.ts'
import { toCanonicalStatus } from '@/domain/workflow/legacy-map.ts'
import { evaluateEntityRules } from '@/domain/workflow/rules/index.ts'
import type {
  TransitionResult,
  WorkflowContext,
  WorkflowEntityType,
} from '@/domain/workflow/types.ts'

export type WorkflowEngineMode = 'advisory' | 'strict'

let engineMode: WorkflowEngineMode = 'advisory'

export function getWorkflowEngineMode(): WorkflowEngineMode {
  return engineMode
}

export function setWorkflowEngineMode(mode: WorkflowEngineMode): void {
  engineMode = mode
}

function isDefinedState(
  entityType: WorkflowEntityType,
  canonical: string,
): boolean {
  if (!canonical) return false
  const def = getWorkflowDefinition(entityType)
  return def.states.includes(canonical)
}

function isTransitionInGraph(
  entityType: WorkflowEntityType,
  fromCanonical: string,
  toCanonical: string,
): boolean {
  const def = getWorkflowDefinition(entityType)
  const allowed = def.transitions[fromCanonical] ?? []
  return allowed.includes(toCanonical)
}

/**
 * Advisory transition check — never throws, never mutates storage.
 * Maps legacy statuses to canonical workflow states before evaluation.
 */
export function canTransition(
  entityType: WorkflowEntityType,
  fromState: string,
  toState: string,
  context: WorkflowContext = {},
  options: { mode?: WorkflowEngineMode } = {},
): TransitionResult {
  const mode = options.mode ?? engineMode
  const allowUnknown = mode === 'advisory'

  const fromCanonical = toCanonicalStatus(entityType, fromState)
  const toCanonical = toCanonicalStatus(entityType, toState)

  if (fromCanonical === toCanonical) {
    return { allowed: true, fromCanonical, toCanonical }
  }

  if (!isDefinedState(entityType, fromCanonical)) {
    return {
      allowed: allowUnknown,
      reason: allowUnknown
        ? `Unknown source state "${fromState}" — advisory mode allows legacy flows`
        : `Unknown source state "${fromState}" — not in ${getWorkflowDefinition(entityType).name}`,
      fromCanonical,
      toCanonical,
    }
  }

  if (!isDefinedState(entityType, toCanonical)) {
    return {
      allowed: allowUnknown,
      reason: allowUnknown
        ? `Unknown target state "${toState}" — advisory mode allows legacy flows`
        : `Unknown target state "${toState}" — not in ${getWorkflowDefinition(entityType).name}`,
      fromCanonical,
      toCanonical,
    }
  }

  if (!isTransitionInGraph(entityType, fromCanonical, toCanonical)) {
    return {
      allowed: false,
      reason: `Transition ${fromCanonical} → ${toCanonical} is not defined in ${getWorkflowDefinition(entityType).name}`,
      fromCanonical,
      toCanonical,
    }
  }

  const ruleResult = evaluateEntityRules(
    entityType,
    fromCanonical,
    toCanonical,
    context,
  )
  if (!ruleResult.allowed) {
    return {
      allowed: false,
      reason: ruleResult.reason,
      fromCanonical,
      toCanonical,
    }
  }

  return { allowed: true, fromCanonical, toCanonical }
}

/**
 * Returns canonical next states from the workflow graph.
 * Rule-based exclusions apply when context is provided.
 */
export function getAllowedTransitions(
  entityType: WorkflowEntityType,
  state: string,
  context: WorkflowContext = {},
): string[] {
  const canonical = toCanonicalStatus(entityType, state)
  const def = getWorkflowDefinition(entityType)
  const candidates = [...(def.transitions[canonical] ?? [])]

  if (!context || Object.keys(context).length === 0) {
    return candidates
  }

  return candidates.filter(
    (to) => canTransition(entityType, canonical, to, context).allowed,
  )
}

/**
 * Strict validation — same logic as canTransition with strict unknown-state handling.
 * Does not throw; suitable for CI/debug pipelines.
 */
export function validateTransition(
  entityType: WorkflowEntityType,
  fromState: string,
  toState: string,
  context: WorkflowContext = {},
): TransitionResult {
  return canTransition(entityType, fromState, toState, context, {
    mode: 'strict',
  })
}

export function listWorkflowEntityTypes(): WorkflowEntityType[] {
  return Object.keys(WORKFLOW_DEFINITIONS) as WorkflowEntityType[]
}

export { WORKFLOW_DEFINITIONS, getWorkflowDefinition }
