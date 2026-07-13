/**
 * Enterprise Onboarding Center — queues by canonical vetting case status.
 */

import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '@/providers/auth-provider'
import { useDataStoreVersion } from '@/hooks/use-data-store'
import { vettingService } from '@/lib/vetting-service.ts'
import {
  executeApproveVetting,
  executeRejectVetting,
  executeRequestVettingClarification,
  executeSuspendVetting,
} from '@/domain/admin/commands/vetting-admin-commands.ts'
import { denyUnlessAuthorized } from '@/domain/admin/auth/admin-mutation-auth.ts'
import type { VettingCaseStatus } from '@/types/vetting.ts'
import { resolveVettingCaseStatus } from '@/types/vetting.ts'
import { PmBadge, PmButton, PmPageHeader } from '@/components/ui/pm-index'
import { PmContentCard, PmDashboardLayout } from '@/components/layout/pm-layout-index'
import { PmDataTable, PmTableEmpty } from '@/components/data/pm-data-index'
import { formatUserPresentation } from '@/lib/enterprise-display.ts'
import { VettingSlaBadge } from '@/components/admin/vetting-sla-badge'
import { toast } from 'sonner'

const QUEUE_TABS: readonly {
  readonly slug: string
  readonly title: string
  readonly caseStatuses: readonly VettingCaseStatus[]
}[] = [
  {
    slug: 'new',
    title: 'New Registrations',
    caseStatuses: ['draft', 'submitted'],
  },
  {
    slug: 'pending',
    title: 'Pending Review',
    caseStatuses: ['pending_review', 'resubmitted'],
  },
  {
    slug: 'clarifications',
    title: 'Clarifications',
    caseStatuses: ['clarification_requested'],
  },
  {
    slug: 'approved',
    title: 'Approved',
    caseStatuses: ['approved'],
  },
  {
    slug: 'rejected',
    title: 'Rejected',
    caseStatuses: ['rejected'],
  },
  {
    slug: 'suspended',
    title: 'Suspended',
    caseStatuses: ['suspended'],
  },
] as const

function resolveTab(slug: string | undefined) {
  return QUEUE_TABS.find((tab) => tab.slug === slug) ?? QUEUE_TABS[0]
}

export function AdminOnboardingCenterPage() {
  const { queueSlug } = useParams<{ queueSlug?: string }>()
  const tab = resolveTab(queueSlug)
  const { user, refreshUser } = useAuth()
  const version = useDataStoreVersion()
  const canManage = !denyUnlessAuthorized(user?.role, 'admin.vetting.manage')
  const [notes, setNotes] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  const entries = useMemo(() => {
    return tab.caseStatuses.flatMap((status) => vettingService.listByCaseStatus(status))
  }, [tab, version])

  const selected = entries.find((e) => e.user.id === selectedUserId) ?? null

  const runAction = (
    action: 'approve' | 'reject' | 'clarify' | 'suspend',
  ) => {
    if (!selected || !user) return
    const partyId = selected.activeParty?.id ?? selected.user.id
    if (action === 'approve') {
      const result = executeApproveVetting(selected.user.id, partyId, user.id, user.role)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success('Approved — workspace and capabilities activated')
      refreshUser()
    } else if (action === 'reject') {
      const result = executeRejectVetting(
        selected.user.id,
        partyId,
        user.id,
        notes || 'Rejected',
        user.role,
      )
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success('Rejected')
    } else if (action === 'clarify') {
      const result = executeRequestVettingClarification({
        userId: selected.user.id,
        partyId,
        reviewerId: user.id,
        reason: notes || 'Please provide additional documentation',
        requestedItems: notes ? [notes] : ['Additional documents'],
        actorRole: user.role,
      })
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success('Clarification requested')
    } else {
      const result = executeSuspendVetting(
        selected.user.id,
        partyId,
        user.id,
        notes || 'Suspended',
        user.role,
      )
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success('Suspended')
    }
    setNotes('')
  }

  return (
    <PmDashboardLayout
      header={
        <PmPageHeader
          label="Enterprise Onboarding"
          title="Onboarding Center"
          description="Review registrations, clarifications, and activation decisions."
          tone="mission"
        />
      }
    >
      <div className="mb-4 flex flex-wrap gap-2">
        {QUEUE_TABS.map((item) => (
          <Link key={item.slug} to={`/admin/onboarding/${item.slug}`}>
            <PmBadge tone={item.slug === tab.slug ? 'info' : 'neutral'}>
              {item.title}
            </PmBadge>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <PmContentCard title={tab.title} description={`${entries.length} records`}>
          {entries.length === 0 ? (
            <PmTableEmpty title="No records in this queue" />
          ) : (
            <PmDataTable
              data={entries}
              getRowId={(entry) => entry.user.id}
              columns={[
                {
                  id: 'name',
                  label: 'Name',
                  cell: (entry) => (
                    <button
                      type="button"
                      className="text-start font-medium text-primary underline-offset-2 hover:underline"
                      onClick={() => setSelectedUserId(entry.user.id)}
                    >
                      {formatUserPresentation(entry.user).fullName}
                    </button>
                  ),
                },
                { id: 'email', label: 'Email', cell: (entry) => entry.user.email },
                {
                  id: 'case',
                  label: 'Case',
                  cell: (entry) =>
                    resolveVettingCaseStatus(entry.user.profile?.vetting, entry.user.status),
                },
                {
                  id: 'sla',
                  label: 'SLA',
                  cell: (entry) => (
                    <VettingSlaBadge
                      status={entry.user.profile?.vetting?.slaStatus ?? 'on_track'}
                      user={entry.user}
                    />
                  ),
                },
                { id: 'party', label: 'Party', cell: (entry) => entry.partyLabel },
              ]}
            />
          )}
        </PmContentCard>

        <PmContentCard title="Review panel" description="Approve, reject, clarify, or suspend">
          {!selected ? (
            <p className="text-sm text-muted-foreground">Select a registration to review.</p>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium">
                {formatUserPresentation(selected.user).fullName}
              </p>
              <p className="text-xs text-muted-foreground">{selected.user.email}</p>
              <p className="text-xs">
                Case:{' '}
                {resolveVettingCaseStatus(
                  selected.user.profile?.vetting,
                  selected.user.status,
                )}
              </p>
              {selected.user.profile?.vetting?.reviewNotes ? (
                <p className="rounded border p-2 text-sm">
                  {selected.user.profile.vetting.reviewNotes}
                </p>
              ) : null}
              <label className="block text-sm">
                Reviewer notes
                <textarea
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </label>
              {canManage ? (
                <div className="flex flex-wrap gap-2">
                  <PmButton onClick={() => runAction('approve')}>Approve</PmButton>
                  <PmButton variant="outline" onClick={() => runAction('clarify')}>
                    Clarification
                  </PmButton>
                  <PmButton variant="outline" onClick={() => runAction('reject')}>
                    Reject
                  </PmButton>
                  <PmButton variant="outline" onClick={() => runAction('suspend')}>
                    Suspend
                  </PmButton>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Read-only — missing manage capability.</p>
              )}
              <Link
                className="text-sm text-primary underline"
                to={`/admin/users/${selected.user.id}`}
              >
                Open user timeline / audit
              </Link>
            </div>
          )}
        </PmContentCard>
      </div>
    </PmDashboardLayout>
  )
}
