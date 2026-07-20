import { useEffect, useMemo, useState } from 'react'
import { AdminInboxList } from '@/components/admin/inbox/admin-inbox-list.tsx'
import {
  buildAdminInbox,
  filterInboxByView,
  INBOX_VIEW_TABS,
} from '@/domain/admin/read-models/inbox-adapter.ts'
import { adminApi } from '@/api/admin.ts'
import { useDataStoreVersion } from '@/hooks/use-data-store'
import { PmPage, PmPageHeader } from '@/components/ui/pm-index'

export function AdminInboxPage() {
  const version = useDataStoreVersion()
  const [viewId, setViewId] = useState('all')

  useEffect(() => {
    adminApi.syncVettingSla()
  }, [])

  const allItems = useMemo(() => buildAdminInbox(), [version])
  const items = useMemo(() => filterInboxByView(allItems, viewId), [allItems, viewId])

  return (
    <PmPage
      header={
        <PmPageHeader
          label="Command Center"
          title="Admin Inbox"
          description="Cross-domain work items from vetting, identity, commercial, and matching queues."
        />
      }
    >
      <AdminInboxList
        items={items}
        viewTabs={[...INBOX_VIEW_TABS]}
        activeViewId={viewId}
        onViewChange={setViewId}
        title="Inbox"
      />
    </PmPage>
  )
}
