/**
 * Unified Demo/UAT admin role vocabulary with legacy aliases.
 * Improves route/command/visibility consistency — not Production security.
 */

export const PLATFORM_STAFF_ROLES = [
  'super_admin',
  'platform_admin',
  'operations_admin',
  'user_admin',
  'compliance_admin',
  'finance_admin',
  'content_admin',
  'support_admin',
  'moderator',
  'auditor',
  'read_only_analyst',
] as const

export type PlatformStaffRole = (typeof PLATFORM_STAFF_ROLES)[number]

/** Stored seed/UI role strings that may appear on PlatformUser.role */
export type StoredUserRole =
  | 'admin'
  | 'moderator'
  | 'auditor'
  | 'company_owner'
  | 'professional'
  | 'user'
  | PlatformStaffRole
  | string

/**
 * Map any stored/legacy role to a canonical platform staff role or marketplace role.
 * Staff access for admin portal uses `isPlatformStaffRole`.
 */
export function toUnifiedAdminRole(
  role: string | undefined | null,
): PlatformStaffRole | 'company_owner' | 'user' {
  if (!role) return 'user'
  const r = role.trim().toLowerCase()
  switch (r) {
    case 'super_admin':
      return 'super_admin'
    case 'admin':
    case 'platform_admin':
      return 'platform_admin'
    case 'operations_admin':
      return 'operations_admin'
    case 'user_admin':
      return 'user_admin'
    case 'compliance_admin':
      return 'compliance_admin'
    case 'finance_admin':
      return 'finance_admin'
    case 'content_admin':
      return 'content_admin'
    case 'support_admin':
      return 'support_admin'
    case 'moderator':
      return 'moderator'
    case 'auditor':
    case 'read_only_analyst':
      return r === 'auditor' ? 'auditor' : 'read_only_analyst'
    case 'company_owner':
      return 'company_owner'
    case 'professional':
    case 'user':
      return 'user'
    default:
      return 'user'
  }
}

/** Roles that may open the Admin Portal (Demo/UAT). */
export const ADMIN_PORTAL_ROLES = new Set<string>([
  'admin',
  'super_admin',
  'platform_admin',
  'operations_admin',
  'user_admin',
  'compliance_admin',
  'finance_admin',
  'content_admin',
  'support_admin',
  'moderator',
  'auditor',
  'read_only_analyst',
])

export function isPlatformStaffRole(role: string | undefined | null): boolean {
  if (!role) return false
  return ADMIN_PORTAL_ROLES.has(role.trim().toLowerCase())
}

/** Mutating staff (excludes read-only auditor/analyst). */
export function isMutatingAdminRole(role: string | undefined | null): boolean {
  if (!role) return false
  const unified = toUnifiedAdminRole(role)
  return (
    unified !== 'user' &&
    unified !== 'company_owner' &&
    unified !== 'auditor' &&
    unified !== 'read_only_analyst'
  )
}

/** Display labels for Admin UI. */
export function adminRoleDisplayLabel(role: string | undefined | null): string {
  const unified = toUnifiedAdminRole(role)
  const labels: Record<string, string> = {
    super_admin: 'Super Admin',
    platform_admin: 'Platform Admin',
    operations_admin: 'Operations Admin',
    user_admin: 'User Admin',
    compliance_admin: 'Compliance Admin',
    finance_admin: 'Finance Admin',
    content_admin: 'Content Admin',
    support_admin: 'Support Admin',
    moderator: 'Moderator',
    auditor: 'Auditor',
    read_only_analyst: 'Read-only Analyst',
    company_owner: 'Company Owner',
    user: 'User',
  }
  return labels[unified] ?? role ?? 'User'
}
