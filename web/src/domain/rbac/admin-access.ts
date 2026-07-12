/**
 * Platform admin access — shared by route guards and command RBAC.
 * Uses unified Demo/UAT staff role vocabulary.
 *
 * Marketplace WorkspaceRole (including legacy company_owner) must never grant
 * Admin Portal access. Platform authorization stays on PlatformRole / staff roles.
 */

import { resolveLegacyRoleToPlatformRoles } from '@pm-twin/identity'
import { isPlatformStaffRole } from '@/domain/rbac/roles/canonical-roles.ts'

const PRODUCT_LANGUAGE_EDITOR_ROLES = new Set(['admin', 'company_owner', 'platform_admin', 'super_admin'])

export function canAccessAdminForRole(
  role: string | undefined | null,
): boolean {
  if (!role) return false
  // Prefer staged PlatformRole resolution; fall back to staff vocabulary set.
  if (resolveLegacyRoleToPlatformRoles(role).length > 0) return true
  return isPlatformStaffRole(role)
}

export function canManageProductLanguageForRole(
  role: string | undefined | null,
): boolean {
  if (!role) return false
  return PRODUCT_LANGUAGE_EDITOR_ROLES.has(role.trim().toLowerCase())
}
