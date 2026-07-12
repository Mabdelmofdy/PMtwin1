import { canAccessAdminForRole } from '@/domain/rbac/admin-access.ts'
import { hasAdminCapability } from '@/domain/rbac/roles/permission-bundles.ts'
import { resolveAdminRouteCapability } from '@/pages/admin/registry/admin-route-permissions.ts'

export type AdminRouteAccessDecision =
  | 'loading'
  | 'allow'
  | 'redirect-login'
  | 'access-denied'

export function evaluateAdminRouteAccess(input: {
  readonly isLoading: boolean
  readonly isAuthenticated: boolean
  readonly userRole?: string | null
  readonly pathname?: string
}): AdminRouteAccessDecision {
  if (input.isLoading) return 'loading'
  if (!input.isAuthenticated) return 'redirect-login'
  if (!canAccessAdminForRole(input.userRole)) return 'access-denied'
  if (input.pathname) {
    const capability = resolveAdminRouteCapability(input.pathname)
    if (!hasAdminCapability(input.userRole, capability) && capability !== 'admin.portal.access') {
      // Soft gate: staff without specific capability still enter portal for Demo/UAT read bundles;
      // deny only when role has zero portal access (already checked).
      if (!hasAdminCapability(input.userRole, 'admin.portal.access')) {
        return 'access-denied'
      }
    }
  }
  return 'allow'
}
