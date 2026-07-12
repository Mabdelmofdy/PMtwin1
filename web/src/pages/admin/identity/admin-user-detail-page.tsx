import { useParams } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { AdminRelatedObjects } from '@/components/admin/related-objects/admin-related-objects.tsx'
import { AdminUniversalTimeline } from '@/components/admin/timeline/admin-universal-timeline.tsx'
import { AdminQuickActions } from '@/components/admin/quick-actions/admin-quick-actions.tsx'
import { quickActionsForEntity } from '@/domain/admin/actions/quick-action-catalogue.ts'
import { getAdminUserDetail } from '@/domain/admin/read-models/user-summary-adapter.ts'
import { relatedObjectsForUser } from '@/domain/admin/read-models/related-objects-adapter.ts'
import { buildUserTimeline } from '@/domain/admin/read-models/timeline-adapter.ts'
import {
  activateUser,
  addUserInternalNote,
  lockUser,
  suspendUser,
  unlockUser,
  unsuspendUser,
} from '@/domain/admin/commands/user-admin-commands.ts'
import { hasAdminCapability } from '@/domain/rbac/roles/permission-bundles.ts'
import { useAuth } from '@/providers/auth-provider.tsx'
import { useDataStoreVersion } from '@/hooks/use-data-store'
import { formatDate } from '@/lib/format'
import {
  PmFormReadonly,
  PmFormReadonlyField,
  PmFormReadonlySection,
} from '@/components/forms/pm-form-index'
import { PmContentCard } from '@/components/layout/pm-layout-index'
import { PmButton, PmEmptyState, PmPage, PmPageHeader } from '@/components/ui/pm-index'
import { AdminStatusBadge } from '@/pages/admin/admin-display'

export function AdminUserDetailPage() {
  const { id } = useParams()
  const { user: actor } = useAuth()
  const version = useDataStoreVersion()
  const [, bump] = useState(0)
  const detail = useMemo(() => (id ? getAdminUserDetail(id) : undefined), [id, version, bump])
  const related = useMemo(() => (id ? relatedObjectsForUser(id) : []), [id, version, bump])
  const timeline = useMemo(() => (id ? buildUserTimeline(id) : []), [id, version, bump])
  const actions = quickActionsForEntity('user')

  function refresh(): void {
    bump((n) => n + 1)
  }

  function promptReason(label: string): string | null {
    const reason = window.prompt(`${label} — enter reason`)
    return reason
  }

  function handleAction(actionId: string): void {
    if (!id || !actor?.id) {
      toast.error('Signed-in admin required')
      return
    }
    const role = actor.role
    switch (actionId) {
      case 'user.activate': {
        const reason = promptReason('Activate user')
        if (reason == null) return
        const result = activateUser(id, actor.id, reason, role)
        if (!result.ok) toast.error(result.error ?? 'Failed')
        else {
          toast.success('User activated')
          refresh()
        }
        break
      }
      case 'user.suspend': {
        const reason = promptReason('Suspend user')
        if (reason == null) return
        const result = suspendUser(id, actor.id, reason, role)
        if (!result.ok) toast.error(result.error ?? 'Failed')
        else {
          toast.success('User suspended')
          refresh()
        }
        break
      }
      case 'user.unsuspend': {
        const reason = promptReason('Unsuspend user')
        if (reason == null) return
        const result = unsuspendUser(id, actor.id, reason, role)
        if (!result.ok) toast.error(result.error ?? 'Failed')
        else {
          toast.success('User unsuspended')
          refresh()
        }
        break
      }
      case 'user.lock': {
        const reason = promptReason('Lock user')
        if (reason == null) return
        const result = lockUser(id, actor.id, reason, role)
        if (!result.ok) toast.error(result.error ?? 'Failed')
        else {
          toast.success('User locked')
          refresh()
        }
        break
      }
      case 'user.unlock': {
        const result = unlockUser(id, actor.id, undefined, role)
        if (!result.ok) toast.error(result.error ?? 'Failed')
        else {
          toast.success('User unlocked')
          refresh()
        }
        break
      }
      case 'user.add_note': {
        const note = window.prompt('Internal note')
        if (note == null) return
        const result = addUserInternalNote(id, actor.id, note, role)
        if (!result.ok) toast.error(result.error ?? 'Failed')
        else {
          toast.success('Note recorded in audit')
          refresh()
        }
        break
      }
      case 'user.open_party':
        window.location.assign(detail?.primaryPartyId ? `/admin/parties/${detail.primaryPartyId}` : '/admin/parties')
        break
      case 'user.open_audit':
        window.location.assign('/admin/audit')
        break
      default:
        toast.message('Action not wired in Demo/UAT yet')
    }
  }

  if (!detail) {
    return (
      <PmPage header={<PmPageHeader title="User detail" />}>
        <PmEmptyState title="User not found" size="compact" />
      </PmPage>
    )
  }

  return (
    <PmPage
      header={
        <PmPageHeader
          title={detail.fullName}
          description={detail.email}
          badges={<AdminStatusBadge status={detail.accountStatus} />}
        />
      }
    >
      <div className="mb-4">
        <AdminQuickActions
          actions={actions}
          onAction={handleAction}
          hasPermission={(cap) => hasAdminCapability(actor?.role, cap as never)}
        />
      </div>

      <PmFormReadonly>
        <PmFormReadonlySection title="Overview" description="Admin user inspector">
          <PmFormReadonlyField label="User ID" value={detail.id} />
          <PmFormReadonlyField label="Email" value={detail.email} />
          <PmFormReadonlyField label="Role" value={detail.roleLabel} />
          <PmFormReadonlyField label="Status">
            <AdminStatusBadge status={detail.accountStatus} />
          </PmFormReadonlyField>
          <PmFormReadonlyField label="Primary party" value={detail.primaryPartyLabel ?? '—'} />
          <PmFormReadonlyField label="Memberships" value={String(detail.membershipCount)} />
          <PmFormReadonlyField
            label="Registered"
            value={detail.registeredAt ? formatDate(detail.registeredAt) : null}
          />
        </PmFormReadonlySection>
      </PmFormReadonly>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <AdminRelatedObjects groups={related} title="Related objects" />
        <AdminUniversalTimeline events={timeline} title="Timeline" />
      </div>

      {detail.notes && detail.notes.length > 0 ? (
        <PmContentCard title="Notes" className="mt-6">
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {detail.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </PmContentCard>
      ) : null}

      <div className="mt-4">
        <PmButton type="button" variant="outline" size="sm" onClick={refresh}>
          Refresh
        </PmButton>
      </div>
    </PmPage>
  )
}
