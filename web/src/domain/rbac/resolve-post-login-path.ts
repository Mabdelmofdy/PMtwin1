import { canAccessAdminForRole } from '@/domain/rbac/admin-access.ts'

const DEFAULT_MARKETPLACE_HOMES = new Set([
  '/dashboard',
  '/company-dashboard',
  '/login',
  '/',
])

/**
 * Chooses where to send a user after successful authentication.
 * Staff roles open the Admin Portal by default; deep-link `from` is preserved
 * when it is an explicit non-home destination the user may access.
 */
export function resolvePostLoginPath(input: {
  readonly userRole?: string | null
  readonly from?: string | null
  readonly isCompanyUser?: boolean
}): string {
  const from = typeof input.from === 'string' ? input.from.trim() : ''
  const canAdmin = canAccessAdminForRole(input.userRole)
  const hasExplicitFrom = from.length > 0 && !DEFAULT_MARKETPLACE_HOMES.has(from)

  if (hasExplicitFrom) {
    if (from.startsWith('/admin')) {
      return canAdmin ? from : input.isCompanyUser ? '/company-dashboard' : '/dashboard'
    }
    return from
  }

  if (canAdmin) return '/admin'
  if (input.isCompanyUser) return '/company-dashboard'
  return '/dashboard'
}
