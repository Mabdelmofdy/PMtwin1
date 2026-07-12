import { getAdminCapabilityForPath } from '@/pages/admin/registry/admin-page-registry.ts'
import type { AdminCapability } from '@/domain/rbac/roles/permission-bundles.ts'

export type AdminRoutePermission = {
  readonly pathPrefix: string
  readonly capability: AdminCapability
}

export function resolveAdminRouteCapability(pathname: string): AdminCapability {
  return getAdminCapabilityForPath(pathname)
}
