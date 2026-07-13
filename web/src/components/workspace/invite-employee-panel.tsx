import { useState } from 'react'
import { toast } from 'sonner'
import { hasWorkspaceCapability } from '@pm-twin/identity'
import { useAuth } from '@/providers/auth-provider'
import { invitationService } from '@/lib/invitation-service.ts'
import { partiesApi } from '@/api/parties.ts'
import { PmButton } from '@/components/ui/pm-index'
import { PmContentCard } from '@/components/layout/pm-layout-index'

/**
 * Company workspace owners with workspace.members.manage can invite employees.
 * Employee joins existing company workspace — never creates a Company.
 */
export function InviteEmployeePanel() {
  const { user, activeWorkspace, memberships } = useAuth()
  const [email, setEmail] = useState('')
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)

  const membership = memberships.find(
    (m) => m.workspaceId === activeWorkspace?.id && m.status === 'active',
  )
  const canInvite =
    activeWorkspace?.type === 'company' &&
    membership != null &&
    hasWorkspaceCapability({ workspaceRole: membership.role }, 'workspace.members.manage')

  if (!canInvite || !user || !activeWorkspace) return null

  const party = partiesApi.resolveActiveParty(user.id)
  const companySourceId = activeWorkspace.id.replace(/^ws-company-/, '')

  return (
    <PmContentCard
      title="Invite employee"
      description="Invite teammates to this company workspace. They join the existing company — they do not create a new one."
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          className="flex-1 rounded-md border px-3 py-2 text-sm"
          placeholder="employee@company.test"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <PmButton
          onClick={() => {
            const result = invitationService.inviteEmployee({
              email,
              companySourceId,
              companyPartyId: party?.id ?? activeWorkspace.ownerPartyId,
              invitedByUserId: user.id,
              role: 'member',
            })
            if (!result.ok) {
              toast.error(result.error)
              return
            }
            const url = `${window.location.origin}/invite/${result.invitation.token}`
            setInviteUrl(url)
            toast.success('Invitation created')
            setEmail('')
          }}
        >
          Send invitation
        </PmButton>
      </div>
      {inviteUrl ? (
        <p className="mt-3 break-all text-xs text-muted-foreground">
          Invite link (Demo/UAT): {inviteUrl}
        </p>
      ) : null}
    </PmContentCard>
  )
}
