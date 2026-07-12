/**
 * Demo/UAT Admin mutation authorization helpers.
 * Capability checks are required in handlers/UI — not hide-only.
 */

import {
  canMutateAsAdmin,
  hasAdminCapability,
  type AdminCapability,
} from '@/domain/rbac/roles/permission-bundles.ts'

export type AdminMutationAuthResult = {
  readonly allowed: boolean
  readonly reason?: string
}

/** Require staff portal access + specific capability + non-auditor mutate role. */
export function authorizeAdminMutation(
  role: string | undefined | null,
  capability: AdminCapability,
): AdminMutationAuthResult {
  if (!canMutateAsAdmin(role)) {
    return {
      allowed: false,
      reason: 'Read-only Admin roles cannot perform mutations.',
    }
  }
  if (!hasAdminCapability(role, capability)) {
    return {
      allowed: false,
      reason: `Missing capability: ${capability}`,
    }
  }
  return { allowed: true }
}

export function denyUnlessAuthorized(
  role: string | undefined | null,
  capability: AdminCapability,
): string | null {
  const result = authorizeAdminMutation(role, capability)
  return result.allowed ? null : (result.reason ?? 'Not authorized')
}
