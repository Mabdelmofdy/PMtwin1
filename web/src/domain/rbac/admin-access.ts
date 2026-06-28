/**
 * Platform admin access — shared by route guards and command RBAC.
 * Matches authService.canAccessAdmin (admin, moderator, auditor).
 */

const ADMIN_ROUTE_ROLES = new Set(['admin', 'moderator', 'auditor'])

export function canAccessAdminForRole(
  role: string | undefined | null,
): boolean {
  if (!role) return false
  return ADMIN_ROUTE_ROLES.has(role)
}
