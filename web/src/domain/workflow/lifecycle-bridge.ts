/**
 * Thin bridge to @pm-twin/lifecycle — ADR-001 source of truth.
 */
import {
  allowedTransitions as lifecycleAllowedTransitions,
  forbiddenTransitions as lifecycleForbiddenTransitions,
  getCanonicalStates as lifecycleGetCanonicalStates,
  getFsm as lifecycleGetFsm,
  getLegacyAliases as lifecycleGetLegacyAliases,
  isTerminal as lifecycleIsTerminal,
  toCanonical as lifecycleToCanonical,
} from '@pm-twin/lifecycle'
import type { WorkflowEntityType } from '@/domain/workflow/types.ts'

export {
  lifecycleAllowedTransitions as allowedTransitions,
  lifecycleForbiddenTransitions as forbiddenTransitions,
  lifecycleGetCanonicalStates as getCanonicalStates,
  lifecycleGetFsm as getFsm,
  lifecycleGetLegacyAliases as getLegacyAliases,
  lifecycleIsTerminal as isTerminal,
  lifecycleToCanonical as toCanonical,
}

export function toCanonicalStatus(
  entityType: WorkflowEntityType,
  status: string | undefined | null,
): string {
  return lifecycleToCanonical(entityType, status)
}
