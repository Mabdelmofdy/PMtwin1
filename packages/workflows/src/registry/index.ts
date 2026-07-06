import type { WorkflowDefinition, WorkflowKey } from '../types.ts'
import { COLLABORATION_WORKFLOW_DEFINITIONS } from './collaboration-workflows.ts'
import { HIRING_WORKFLOW } from './hiring-workflow.ts'
import { MARKETPLACE_WORKFLOW } from './marketplace-workflow.ts'

export const WORKFLOW_REGISTRY: Record<WorkflowKey, WorkflowDefinition> = {
  marketplace: MARKETPLACE_WORKFLOW,
  hiring: HIRING_WORKFLOW,
  ...COLLABORATION_WORKFLOW_DEFINITIONS,
}

export function getWorkflowDefinition(key: WorkflowKey): WorkflowDefinition {
  return WORKFLOW_REGISTRY[key]
}

export function listWorkflowKeys(): readonly WorkflowKey[] {
  return Object.keys(WORKFLOW_REGISTRY) as WorkflowKey[]
}

export { MARKETPLACE_WORKFLOW, HIRING_WORKFLOW, COLLABORATION_WORKFLOW_DEFINITIONS }
