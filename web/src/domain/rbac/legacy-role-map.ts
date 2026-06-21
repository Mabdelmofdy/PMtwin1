/**
 * Read-only legacy → canonical role mapping.
 * Never mutates stored roles; used only by the RBAC decision layer.
 */

import type { Role } from '@/domain/rbac/types.ts'

const LEGACY_ROLE_MAP: Record<string, Role> = {
  admin: 'admin',
  ADMIN: 'admin',
  company_owner: 'company_owner',
  COMPANY_OWNER: 'company_owner',
  user: 'user',
  USER: 'user',
  professional: 'user',
  PROFESSIONAL: 'user',
  moderator: 'admin',
  MODERATOR: 'admin',
  auditor: 'user',
  AUDITOR: 'user',
}

/** Map a stored/legacy role to its canonical RBAC role (read-only). */
export function toCanonicalRole(role: string | undefined | null): Role {
  if (role == null || role === '') return 'user'
  const direct = LEGACY_ROLE_MAP[role]
  if (direct) return direct
  const lower = String(role).toLowerCase()
  return LEGACY_ROLE_MAP[lower] ?? 'user'
}

/** All known legacy aliases for diagnostics. */
export function getLegacyRoleAliases(): Readonly<Record<string, Role>> {
  return LEGACY_ROLE_MAP
}

/** Reverse lookup: canonical role → legacy aliases that map to it. */
export function getLegacyVariantsForCanonicalRole(canonical: Role): string[] {
  const target = canonical.toLowerCase()
  const variants = Object.entries(LEGACY_ROLE_MAP)
    .filter(([, canon]) => canon === target)
    .map(([legacy]) => legacy)
  if (!variants.includes(target)) variants.push(target)
  return [...new Set(variants)]
}
