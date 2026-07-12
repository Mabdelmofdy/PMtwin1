import {
  PLATFORM_STAFF_ROLES,
  adminRoleDisplayLabel,
} from '@/domain/rbac/roles/canonical-roles.ts'
import { capabilitiesForRole } from '@/domain/rbac/roles/permission-bundles.ts'
import { PmContentCard } from '@/components/layout/pm-layout-index'
import { PmBadge, PmPage, PmPageHeader } from '@/components/ui/pm-index'

export function AdminRolesPage() {
  return (
    <PmPage
      header={
        <PmPageHeader
          label="Identity"
          title="Roles"
          description="Canonical platform staff roles and permission bundles (Demo/UAT)."
        />
      }
    >
      <div className="grid gap-4 lg:grid-cols-2">
        {PLATFORM_STAFF_ROLES.map((role) => {
          const caps = capabilitiesForRole(role)
          return (
            <PmContentCard
              key={role}
              title={adminRoleDisplayLabel(role)}
              description={role}
            >
              <div className="flex flex-wrap gap-1.5">
                {(caps as readonly string[]).includes('*') ? (
                  <PmBadge tone="success" size="sm">
                    All capabilities
                  </PmBadge>
                ) : (
                  caps.map((cap) => (
                    <PmBadge key={cap} tone="muted" size="sm">
                      {cap}
                    </PmBadge>
                  ))
                )}
              </div>
            </PmContentCard>
          )
        })}
      </div>
    </PmPage>
  )
}
