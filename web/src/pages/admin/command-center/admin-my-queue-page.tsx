import { useMemo } from 'react'
import { AdminInboxList } from '@/components/admin/inbox/admin-inbox-list.tsx'
import { buildAdminInbox } from '@/domain/admin/read-models/inbox-adapter.ts'
import { useAuth } from '@/providers/auth-provider.tsx'
import { useDataStoreVersion } from '@/hooks/use-data-store'
import { PmPage, PmPageHeader } from '@/components/ui/pm-index'

export function AdminMyQueuePage() {
  const { user } = useAuth()
  const version = useDataStoreVersion()
  const items = useMemo(
    () => buildAdminInbox({ assigneeId: user?.id ?? null }),
    [version, user?.id],
  )

  return (
    <PmPage
      header={
        <PmPageHeader
          label="Command Center"
          title="My Queue"
          description={
            user?.id
              ? 'Items assigned to you, plus unassigned work.'
              : 'Unassigned inbox items (no signed-in assignee).'
          }
        />
      }
    >
      <AdminInboxList items={items} title="My queue" />
    </PmPage>
  )
}
