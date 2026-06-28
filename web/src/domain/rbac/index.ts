/**
 * RBAC governance decision layer — advisory only.
 * Answers WHO can do WHAT at WHICH state without enforcing anything.
 */

export type {
  CombinedWorkflowRbacDecision,
  PermissionAction,
  PermissionContext,
  PolicyEvaluation,
  RbacAuditEntry,
  RbacAuditReport,
  RbacEntityType,
  Role,
} from '@/domain/rbac/types.ts'

export {
  toCanonicalRole,
  getLegacyRoleAliases,
  getLegacyVariantsForCanonicalRole,
} from '@/domain/rbac/legacy-role-map.ts'

export {
  ALL_PERMISSION_ACTIONS,
  ALL_ROLES,
  ROLE_MATRIX,
  ACTION_ENTITY_MAP,
  ACTION_WORKFLOW_TARGETS,
  matchesRolePattern,
  isActionInRoleMatrix,
} from '@/domain/rbac/registry.ts'

export {
  canPerformAction,
  evaluatePolicy,
  getAllowedActions,
  resolveRole,
} from '@/domain/rbac/core/policy-engine.ts'

export { canAccessAdminForRole } from '@/domain/rbac/admin-access.ts'
export {
  evaluateAdminRouteAccess,
  type AdminRouteAccessDecision,
} from '@/domain/rbac/admin-route-access.ts'
export {
  ADMIN_ONLY_COMMAND_TYPES,
  COMMAND_REQUIRED_CAPABILITY,
  evaluateCommandRbac,
  buildCommandRbacFailureResult,
  type CommandCapability,
  type CommandRbacEvaluation,
} from '@/domain/rbac/command-rbac.ts'
export {
  getCommandPermissionActor,
  setCommandPermissionActor,
  resetCommandPermissionActorForTests,
  type CommandPermissionActor,
} from '@/domain/rbac/context/command-permission-context.ts'

export {
  evaluateEntityPolicy,
  evaluateApplicationPolicy,
  evaluateContractPolicy,
  evaluateDealPolicy,
  evaluateNegotiationPolicy,
  evaluateOpportunityPolicy,
} from '@/domain/rbac/policies/index.ts'

export {
  buildPermissionContext,
  isUserEntityOwner,
} from '@/domain/rbac/context/build-context.ts'
export type {
  BuildContextInput,
  LegacyUserInput,
} from '@/domain/rbac/context/build-context.ts'

export {
  evaluateActionWithWorkflow,
} from '@/domain/rbac/integrations/workflow-rbac-bridge.ts'
export type {
  EvaluateActionWithWorkflowOptions,
} from '@/domain/rbac/integrations/workflow-rbac-bridge.ts'

export {
  clearRbacAuditBuffer,
  generateRbacReport,
  getRbacAuditBuffer,
  isRbacAuditEnabled,
  logCombinedDecision,
  logRbacDecision,
  logRbacViolation,
  setRbacAuditEnabled,
} from '@/domain/rbac/audit/rbac-audit.ts'
