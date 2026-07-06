import type { WorkflowContext, WorkflowKey } from '../types.ts'
import { resolveCollaborationWorkflowKey } from '../registry/collaboration-workflows.ts'

const BLOCKING_NEGOTIATION_STATUSES = new Set(['active', 'countered', 'agreed'])

export function resolvePrimaryWorkflowKey(context: WorkflowContext): WorkflowKey {
  if (context.primaryWorkflow) return context.primaryWorkflow

  if (context.application?.id) {
    return 'hiring'
  }

  return 'marketplace'
}

export function resolveWorkflowKeys(context: WorkflowContext): {
  readonly primary: WorkflowKey
  readonly collaboration?: WorkflowKey
} {
  const primary = context.primaryWorkflow ?? resolvePrimaryWorkflowKey(context)
  const collaboration =
    context.collaborationWorkflow
    ?? resolveCollaborationWorkflowKey(context.collaboration?.mainCollaborationModel)

  return { primary, collaboration }
}

export function hasBlockingPostMatchNegotiation(
  context: WorkflowContext,
): boolean {
  const linked = context.linkage?.negotiationsForPostMatch ?? []
  return linked.some((negotiation) =>
    BLOCKING_NEGOTIATION_STATUSES.has(
      (negotiation.status ?? '').toLowerCase(),
    ),
  )
}

export function hasBlockingApplicationNegotiation(
  context: WorkflowContext,
): boolean {
  const linked = context.linkage?.negotiationsForApplication ?? []
  return linked.some((negotiation) => {
    const status = (negotiation.status ?? '').toLowerCase()
    return BLOCKING_NEGOTIATION_STATUSES.has(status)
  })
}

export function findAgreedApplicationNegotiation(context: WorkflowContext) {
  const linked = context.linkage?.negotiationsForApplication ?? []
  return linked.find((negotiation) => (negotiation.status ?? '').toLowerCase() === 'agreed')
}

export function hasActiveContractForDeal(context: WorkflowContext): boolean {
  const contracts = context.linkage?.contractsForDeal ?? []
  return contracts.some((contract) => {
    const status = (contract.status ?? '').toLowerCase()
    return status !== 'completed' && status !== 'terminated' && status !== 'cancelled'
  })
}
