/**
 * Platform admin access — shared by route guards and command RBAC.
 * Uses unified Demo/UAT staff role vocabulary.
 */

import { isPlatformStaffRole } from '@/domain/rbac/roles/canonical-roles.ts'

const PRODUCT_LANGUAGE_EDITOR_ROLES = new Set(['admin', 'company_owner', 'platform_admin', 'super_admin'])

export function canAccessAdminForRole(
  role: string | undefined | null,
): boolean {
  return isPlatformStaffRole(role)
}

export function canManageProductLanguageForRole(
  role: string | undefined | null,
): boolean {
  if (!role) return false
  return PRODUCT_LANGUAGE_EDITOR_ROLES.has(role.trim().toLowerCase())
}
