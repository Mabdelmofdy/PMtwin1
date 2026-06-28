import { canAccessAdminForRole } from '@/domain/rbac/admin-access.ts'

export type AdminRouteAccessDecision =
  | 'loading'
  | 'allow'
  | 'redirect-login'
  | 'access-denied'

export function evaluateAdminRouteAccess(input: {
  readonly isLoading: boolean
  readonly isAuthenticated: boolean
  readonly userRole?: string | null
}): AdminRouteAccessDecision {
  if (input.isLoading) return 'loading'
  if (!input.isAuthenticated) return 'redirect-login'
  if (!canAccessAdminForRole(input.userRole)) return 'access-denied'
  return 'allow'
}
