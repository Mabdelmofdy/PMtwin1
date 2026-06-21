/**
 * RBAC decision layer types — advisory only; no runtime enforcement.
 */

import type { WorkflowEntityType } from '@/domain/workflow/types.ts'

/** Canonical RBAC roles (mapped from legacy at read time). */
export type Role = 'user' | 'company_owner' | 'admin'

/** Entity types governed by RBAC policies. */
export type RbacEntityType = WorkflowEntityType

/** All permission actions the governance layer can evaluate. */
export type PermissionAction =
  | 'opportunity.create'
  | 'opportunity.publish'
  | 'opportunity.view'
  | 'opportunity.cancel'
  | 'application.apply'
  | 'application.accept'
  | 'application.reject'
  | 'application.view'
  | 'negotiation.start'
  | 'negotiation.counter'
  | 'negotiation.accept'
  | 'negotiation.terminate'
  | 'deal.create'
  | 'deal.execute'
  | 'deal.view'
  | 'contract.sign'
  | 'contract.view'
  | 'contract.terminate'

export type PermissionContext = {
  userId?: string
  userRole: Role | string
  tenantId?: string
  organizationId?: string
  entityType: RbacEntityType
  entitySnapshot?: Record<string, unknown>
  /** Canonical workflow state (legacy values should be normalized before use). */
  workflowState: string
  metadata?: Record<string, unknown>
}

export type PolicyEvaluation = {
  allowed: boolean
  reason?: string
  matchedPolicies: string[]
  workflowAware: boolean
}

export type CombinedWorkflowRbacDecision = {
  allowed: boolean
  workflowAllowed: boolean
  rbacAllowed: boolean
  reason?: string
  matchedPolicies?: string[]
  workflowReason?: string
  rbacReason?: string
}

export type RbacAuditEntry = {
  at: string
  action: PermissionAction | string
  allowed: boolean
  userId?: string
  userRole?: string
  entityType?: RbacEntityType
  workflowState?: string
  reason?: string
  matchedPolicies?: string[]
  workflowConflict?: boolean
}

export type RbacAuditReport = {
  generatedAt: string
  totalDecisions: number
  allowedCount: number
  deniedCount: number
  workflowConflicts: number
  entries: RbacAuditEntry[]
}
