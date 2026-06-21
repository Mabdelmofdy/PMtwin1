/**
 * Permission context builder — assembles PermissionContext from heterogeneous inputs.
 */

import { toCanonicalStatus } from '@/domain/workflow/legacy-map.ts'
import type { WorkflowEntityType } from '@/domain/workflow/types.ts'
import { toCanonicalRole } from '@/domain/rbac/legacy-role-map.ts'
import type {
  PermissionContext,
  RbacEntityType,
  Role,
} from '@/domain/rbac/types.ts'

export type LegacyUserInput = {
  id?: string
  userId?: string
  role?: string
  tenantId?: string
  organizationId?: string
}

export type BuildContextInput = {
  user?: LegacyUserInput | null
  userId?: string
  userRole?: Role | string
  tenantId?: string
  organizationId?: string
  entityType: RbacEntityType
  entity?: Record<string, unknown> | null
  entitySnapshot?: Record<string, unknown> | null
  workflowState?: string
  metadata?: Record<string, unknown>
}

const STATUS_FIELDS = [
  'status',
  'state',
  'workflowState',
  'lifecycleStatus',
] as const

const OWNER_ID_FIELDS = ['ownerId', 'companyId', 'createdBy', 'userId'] as const

function resolveUserId(user?: LegacyUserInput | null, fallback?: string): string | undefined {
  if (fallback) return fallback
  if (!user) return undefined
  return user.id ?? user.userId
}

function resolveRole(
  user?: LegacyUserInput | null,
  fallback?: Role | string,
): Role {
  const raw = fallback ?? user?.role
  return toCanonicalRole(raw)
}

function extractStatus(entity?: Record<string, unknown> | null): string {
  if (!entity) return ''
  for (const field of STATUS_FIELDS) {
    const value = entity[field]
    if (value != null && value !== '') return String(value)
  }
  return ''
}

function normalizeEntitySnapshot(
  entity?: Record<string, unknown> | null,
  provided?: Record<string, unknown> | null,
): Record<string, unknown> | undefined {
  const base = provided ?? entity
  if (!base || typeof base !== 'object') return undefined
  return { ...base }
}

function resolveTenantId(
  input: BuildContextInput,
  entity?: Record<string, unknown> | null,
): string | undefined {
  if (input.tenantId) return input.tenantId
  if (input.user?.tenantId) return input.user.tenantId
  if (entity?.tenantId != null) return String(entity.tenantId)
  return undefined
}

function resolveOrganizationId(
  input: BuildContextInput,
  entity?: Record<string, unknown> | null,
): string | undefined {
  if (input.organizationId) return input.organizationId
  if (input.user?.organizationId) return input.user.organizationId
  if (entity?.organizationId != null) return String(entity.organizationId)
  return undefined
}

/**
 * Build a PermissionContext from normalized entity, workflow output, and legacy user.
 * Safely handles missing fields and polymorphic IDs.
 */
export function buildPermissionContext(
  input: BuildContextInput,
): PermissionContext {
  const entitySnapshot = normalizeEntitySnapshot(input.entity, input.entitySnapshot)
  const rawState = input.workflowState ?? extractStatus(entitySnapshot)
  const workflowState = rawState
    ? toCanonicalStatus(input.entityType as WorkflowEntityType, rawState)
    : ''

  return {
    userId: resolveUserId(input.user, input.userId),
    userRole: resolveRole(input.user, input.userRole),
    tenantId: resolveTenantId(input, entitySnapshot),
    organizationId: resolveOrganizationId(input, entitySnapshot),
    entityType: input.entityType,
    entitySnapshot,
    workflowState,
    metadata: input.metadata ? { ...input.metadata } : undefined,
  }
}

/** Check if a user ID matches any known owner field on the entity snapshot. */
export function isUserEntityOwner(
  userId: string | undefined,
  entity?: Record<string, unknown> | null,
): boolean {
  if (!userId || !entity) return false
  return OWNER_ID_FIELDS.some((field) => {
    const value = entity[field]
    return value != null && String(value) === userId
  })
}
