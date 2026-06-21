/**
 * Workflow engine — business process intelligence layer (advisory only).
 * Does NOT replace POC workflow-engine.js or enforce runtime transitions.
 */

export type {
  TransitionLogEntry,
  TransitionResult,
  WorkflowCheckInput,
  WorkflowCheckResult,
  WorkflowContext,
  WorkflowDefinition,
  WorkflowEntityType,
  WorkflowGraph,
  WorkflowGraphEdge,
  WorkflowGraphNode,
  WorkflowRule,
  WorkflowRuleResult,
  WorkflowUserRole,
} from '@/domain/workflow/types.ts'

export {
  ApplicationWorkflow,
  ContractWorkflow,
  DealWorkflow,
  NegotiationWorkflow,
  OpportunityWorkflow,
  WORKFLOW_DEFINITIONS,
  getWorkflowDefinition,
} from '@/domain/workflow/definitions/index.ts'

export {
  canTransition,
  getAllowedTransitions,
  getWorkflowEngineMode,
  listWorkflowEntityTypes,
  setWorkflowEngineMode,
  validateTransition,
} from '@/domain/workflow/core/workflow-engine.ts'

export type { WorkflowEngineMode } from '@/domain/workflow/core/workflow-engine.ts'

export {
  getLegacyAliases,
  getLegacyVariantsForCanonical,
  toCanonicalStatus,
} from '@/domain/workflow/legacy-map.ts'

export {
  applicationRules,
  contractRules,
  dealRules,
  evaluateApplicationRules,
  evaluateContractRules,
  evaluateDealRules,
  evaluateEntityRules,
  evaluateNegotiationRules,
  evaluateOpportunityRules,
  negotiationRules,
  opportunityRules,
} from '@/domain/workflow/rules/index.ts'

export {
  checkWorkflowTransition,
} from '@/domain/workflow/hooks/check-workflow-transition.ts'

export type {
  CheckWorkflowTransitionOptions,
} from '@/domain/workflow/hooks/check-workflow-transition.ts'

export {
  clearWorkflowLogBuffer,
  getWorkflowLogBuffer,
  isWorkflowLoggingEnabled,
  logAllowedTransition,
  logBlockedTransition,
  logTransitionAttempt,
  setWorkflowLoggingEnabled,
} from '@/domain/workflow/observability/workflow-logger.ts'

export {
  buildAllWorkflowGraphs,
  buildWorkflowGraph,
  getAdjacencyList,
  toMermaidDiagram,
} from '@/domain/workflow/graph.ts'
