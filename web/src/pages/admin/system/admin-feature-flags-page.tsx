import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import {
  executeUpdateFeatureFlag,
  listEffectiveFeatureFlags,
} from '@/domain/admin/settings/index.ts'
import { denyUnlessAuthorized } from '@/domain/admin/auth/admin-mutation-auth.ts'
import { hasAdminCapability } from '@/domain/rbac/roles/permission-bundles.ts'
import { useAuth } from '@/providers/auth-provider.tsx'
import { useDataStoreVersion } from '@/hooks/use-data-store'
import { environmentContext } from '@/infrastructure/environment/environment-context.ts'
import { PmContentCard } from '@/components/layout/pm-layout-index'
import { PmBadge, PmButton, PmPage, PmPageHeader } from '@/components/ui/pm-index'

export function AdminFeatureFlagsPage() {
  const { user } = useAuth()
  const version = useDataStoreVersion()
  const [, bump] = useState(0)
  const flags = useMemo(() => listEffectiveFeatureFlags(), [version, bump])
  const canManage =
    hasAdminCapability(user?.role, 'admin.settings.manage') ||
    hasAdminCapability(user?.role, 'feature-flags.manage')

  const editable = flags.filter((f) => f.kind === 'editable')
  const locked = flags.filter((f) => f.kind === 'locked')

  function toggleFlag(key: string, current: boolean): void {
    const denied =
      canManage
        ? null
        : denyUnlessAuthorized(user?.role, 'feature-flags.manage')
    if (denied) {
      toast.error(denied)
      return
    }
    if (!user?.id) {
      toast.error('Signed-in admin required')
      return
    }
    const result = executeUpdateFeatureFlag({
      key,
      value: !current,
      actorId: user.id,
      actorRole: user.role,
    })
    if (!result.ok) {
      toast.error(result.error ?? 'Update failed')
      return
    }
    toast.success(`Flag ${key} updated`)
    bump((n) => n + 1)
  }

  return (
    <PmPage
      header={
        <PmPageHeader
          label="System"
          title="Feature Flags"
          description={`Demo/UAT flags for ${environmentContext.runtimeMode.toUpperCase()}. Editable flags persist in the environment namespace; locked flags remain architectural.`}
          badges={
            canManage ? (
              <PmBadge tone="success">Editable flags available</PmBadge>
            ) : (
              <PmBadge tone="warning">Read-only for your role</PmBadge>
            )
          }
        />
      }
    >
      <div className="mb-4">
        <Link className="text-sm text-primary underline-offset-4 hover:underline" to="/admin/settings">
          ← Platform Settings
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <PmContentCard title="Editable Demo/UAT flags" noPadding>
          <ul className="divide-y divide-border/60">
            {editable.map((flag) => (
              <li key={flag.key} className="flex items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="font-medium">{flag.label}</p>
                  <p className="text-xs text-muted-foreground">{flag.key}</p>
                </div>
                <div className="flex items-center gap-2">
                  <PmBadge tone="muted" size="sm">
                    {String(flag.value)}
                  </PmBadge>
                  {canManage && typeof flag.value === 'boolean' ? (
                    <PmButton
                      size="sm"
                      variant="outline"
                      onClick={() => toggleFlag(flag.key, flag.value as boolean)}
                    >
                      Toggle
                    </PmButton>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </PmContentCard>

        <PmContentCard title="Locked architectural flags" noPadding>
          <ul className="divide-y divide-border/60">
            {locked.map((flag) => (
              <li key={flag.key} className="space-y-1 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">{flag.label}</span>
                  <PmBadge tone="warning" size="sm">
                    {String(flag.value)}
                  </PmBadge>
                </div>
                <p className="text-xs text-muted-foreground">{flag.key}</p>
                {flag.reason ? (
                  <p className="text-xs text-muted-foreground">Locked: {flag.reason}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </PmContentCard>
      </div>
    </PmPage>
  )
}
