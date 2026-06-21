/**
 * Shared pure helpers for entity policy evaluation.
 */

import type { PermissionContext, PolicyEvaluation, Role } from '@/domain/rbac/types.ts'
import { toCanonicalRole } from '@/domain/rbac/legacy-role-map.ts'

export function allow(
  policyId: string,
  workflowAware = false,
): PolicyEvaluation {
  return { allowed: true, matchedPolicies: [policyId], workflowAware }
}

export function deny(
  policyId: string,
  reason: string,
  workflowAware = false,
): PolicyEvaluation {
  return {
    allowed: false,
    reason,
    matchedPolicies: [policyId],
    workflowAware,
  }
}

export function getRole(context: PermissionContext): Role {
  return toCanonicalRole(context.userRole)
}

export function isAdmin(context: PermissionContext): boolean {
  return getRole(context) === 'admin'
}

export function isCompanyOwner(context: PermissionContext): boolean {
  return getRole(context) === 'company_owner'
}

export function isUser(context: PermissionContext): boolean {
  return getRole(context) === 'user'
}

export function isParticipant(
  context: PermissionContext,
  userId?: string,
): boolean {
  const uid = userId ?? context.userId
  if (!uid) return false
  const participants = context.entitySnapshot?.participants
  if (!Array.isArray(participants)) return false
  return participants.some(
    (p) =>
      p &&
      typeof p === 'object' &&
      'userId' in p &&
      String((p as { userId: string }).userId) === uid,
  )
}

export function isEntityOwner(
  context: PermissionContext,
  ownerFields: string[] = ['ownerId', 'companyId', 'createdBy', 'userId'],
): boolean {
  const uid = context.userId
  if (!uid || !context.entitySnapshot) return false
  return ownerFields.some((field) => {
    const value = context.entitySnapshot?.[field]
    return value != null && String(value) === uid
  })
}

export function isSigner(context: PermissionContext): boolean {
  const uid = context.userId
  if (!uid) return false
  const signers = context.entitySnapshot?.signers
  if (Array.isArray(signers)) {
    return signers.some((s) => String(s) === uid)
  }
  return isParticipant(context, uid)
}

export function isTerminalState(
  context: PermissionContext,
  terminalStates: readonly string[],
): boolean {
  const state = (context.workflowState ?? '').toLowerCase()
  return terminalStates.includes(state)
}

export function isReadOnlyState(
  context: PermissionContext,
  readOnlyStates: readonly string[],
): boolean {
  return isTerminalState(context, readOnlyStates)
}
