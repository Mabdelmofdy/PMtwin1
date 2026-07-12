import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  formatMembershipId,
  partyMembershipRepository,
  partyRepository,
  userRepository,
} from '@/repositories/index.ts'
import {
  formatPartyCompanyCode,
  formatPartyPresentation,
  formatUserEmployeeNumber,
  formatUserPresentation,
} from '@/lib/enterprise-display.ts'
import {
  inviteMember,
  suspendMembership,
  changeMembershipRole,
} from '@/domain/admin/commands/membership-admin-commands.ts'
import { denyUnlessAuthorized } from '@/domain/admin/auth/admin-mutation-auth.ts'
import { getEffectiveSettingsSections } from '@/domain/admin/settings/effective-settings.ts'
import { useAuth } from '@/providers/auth-provider.tsx'
import { useDataStoreVersion } from '@/hooks/use-data-store'
import { AdminListPage } from '@/pages/admin/admin-list-page'
import { AdminStatusBadge } from '@/pages/admin/admin-display'
import { PmBadge, PmButton } from '@/components/ui/pm-index'

export function AdminMembershipsPage() {
  const version = useDataStoreVersion()
  const { user } = useAuth()
  const [, bump] = useState(0)
  const memberships = useMemo(() => partyMembershipRepository.getAll(), [version, bump])
  const canManage = !denyUnlessAuthorized(user?.role, 'admin.memberships.manage')

  function handleInvite(): void {
    const denied = denyUnlessAuthorized(user?.role, 'admin.memberships.manage')
    if (denied) {
      toast.error(denied)
      return
    }
    if (!user?.id) {
      toast.error('Signed-in admin required')
      return
    }
    const partyKey = window.prompt('Party routing key (for invite command)')
    const userKey = window.prompt('User routing key (for invite command)')
    const role = window.prompt('Membership role (owner|admin|member|viewer)', 'member')
    if (!partyKey || !userKey) return
    const result = inviteMember({
      partyId: partyKey.trim(),
      userId: userKey.trim(),
      role: role?.trim() || getEffectiveSettingsSections().access.defaultInviteRole || 'member',
      actorId: user.id,
      actorRole: user.role,
    })
    if (!result.ok) toast.error(result.error ?? 'Invite failed')
    else {
      toast.success('Invitation created')
      bump((n) => n + 1)
    }
  }

  return (
    <AdminListPage
      label="Identity"
      title="Memberships"
      description="User–party memberships, invitations, and role changes (Demo/UAT overrides)."
      data={memberships}
      getRowId={(m) => formatMembershipId({ userId: m.userId, partyId: m.partyId })}
      getRowHref={(m) => `/admin/parties/${m.partyId}`}
      getSearchText={(m) => {
        const u = userRepository.getById(m.userId)
        const p = partyRepository.getById(m.partyId)
        const userView = u ? formatUserPresentation(u) : null
        const partyView = p ? formatPartyPresentation(p) : null
        return [
          userView?.fullName,
          userView?.employeeNumber,
          partyView?.companyName,
          partyView?.companyCode,
          m.membershipRole,
          m.status,
        ]
          .filter(Boolean)
          .join(' ')
      }}
      searchPlaceholder="Search memberships…"
      headerActions={
        canManage ? (
          <PmButton size="sm" onClick={handleInvite}>
            Invite member
          </PmButton>
        ) : (
          <PmBadge tone="warning">Read-only</PmBadge>
        )
      }
      columns={[
        {
          id: 'user',
          label: 'Full Name',
          cell: (m) => {
            const u = userRepository.getById(m.userId)
            return u
              ? formatUserPresentation(u).fullName
              : formatUserEmployeeNumber(m.userId)
          },
        },
        {
          id: 'userNumber',
          label: 'User Number',
          cell: (m) => {
            const u = userRepository.getById(m.userId)
            return u
              ? formatUserPresentation(u).employeeNumber
              : formatUserEmployeeNumber(m.userId)
          },
        },
        {
          id: 'party',
          label: 'Company Name',
          cell: (m) => {
            const p = partyRepository.getById(m.partyId)
            return p
              ? formatPartyPresentation(p).companyName
              : 'Party'
          },
        },
        {
          id: 'companyCode',
          label: 'Company Code',
          cell: (m) => {
            const p = partyRepository.getById(m.partyId)
            return p
              ? formatPartyPresentation(p).companyCode
              : formatPartyCompanyCode(m.partyId)
          },
        },
        { id: 'role', label: 'Role', cell: (m) => m.membershipRole },
        {
          id: 'status',
          label: 'Status',
          cell: (m) => <AdminStatusBadge status={m.status} />,
        },
        {
          id: 'primary',
          label: 'Primary',
          cell: (m) => (m.isPrimary ? 'Yes' : 'No'),
        },
        {
          id: 'actions',
          label: 'Actions',
          cell: (m) =>
            canManage ? (
              <div className="flex flex-wrap gap-1">
                <PmButton
                  size="sm"
                  variant="outline"
                  onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    const denied = denyUnlessAuthorized(user?.role, 'admin.memberships.manage')
                    if (denied) {
                      toast.error(denied)
                      return
                    }
                    if (!user?.id) return
                    const role = window.prompt('New role', String(m.membershipRole))
                    const reason = window.prompt('Reason')
                    if (!role || reason == null) return
                    const result = changeMembershipRole({
                      partyId: m.partyId,
                      userId: m.userId,
                      role,
                      actorId: user.id,
                      reason,
                      actorRole: user.role,
                    })
                    if (!result.ok) toast.error(result.error ?? 'Failed')
                    else {
                      toast.success('Role updated')
                      bump((n) => n + 1)
                    }
                  }}
                >
                  Change role
                </PmButton>
                <PmButton
                  size="sm"
                  variant="destructive"
                  onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    const denied = denyUnlessAuthorized(user?.role, 'admin.memberships.manage')
                    if (denied) {
                      toast.error(denied)
                      return
                    }
                    if (!user?.id) return
                    const reason = window.prompt('Suspend membership — reason')
                    if (reason == null) return
                    const result = suspendMembership({
                      partyId: m.partyId,
                      userId: m.userId,
                      actorId: user.id,
                      reason,
                      actorRole: user.role,
                    })
                    if (!result.ok) toast.error(result.error ?? 'Failed')
                    else {
                      toast.success('Membership suspended')
                      bump((n) => n + 1)
                    }
                  }}
                >
                  Suspend
                </PmButton>
              </div>
            ) : (
              '—'
            ),
        },
      ]}
    />
  )
}
