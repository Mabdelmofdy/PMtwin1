/**
 * Workflow engine — business process intelligence layer (advisory only).
 * Does NOT replace POC workflow-engine.js or enforce runtime transitions.
 */

export type {
  ApplicationStatus,
  ContractStatus,
  DealStatus,
  MatchStatus,
  NegotiationStatus,
  OpportunityStatus,
  TransitionLogEntry,
  TransitionResult,
  WorkflowCheckInput,
  WorkflowCheckResult,
  WorkflowContext,
  WorkflowDefinition,
  WorkflowEntityStatusMap,
  WorkflowEntityType,
  WorkflowGraph,
  WorkflowGraphEdge,
  WorkflowGraphNode,
  WorkflowRule,
  WorkflowRuleResult,
  WorkflowStatus,
  WorkflowUserRole,
} from '@/domain/workflow/types.ts'

export {
  ApplicationWorkflow,
  ContractWorkflow,
  DealWorkflow,
  MatchWorkflow,
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
  allowedTransitions,
  forbiddenTransitions,
  getCanonicalStates,
  getFsm,
  isTerminal,
  toCanonical,
} from '@/domain/workflow/lifecycle-bridge.ts'

export {
  getLegacyAliases,
  getLegacyVariantsForCanonical,
  toCanonicalStatus,
  toStoredStatus,
} from '@/domain/workflow/legacy-map.ts'

export {
  applicationRules,
  contractRules,
  dealRules,
  evaluateApplicationRules,
  evaluateContractRules,
  evaluateDealRules,
  evaluateEntityRules,
  evaluateMatchRules,
  evaluateNegotiationRules,
  evaluateOpportunityRules,
  matchRules,
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
