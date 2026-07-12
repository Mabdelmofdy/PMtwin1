import { useMemo, useState } from 'react'
import {
  clearFailedLocalCommands,
  listFailedLocalCommands,
} from '@/domain/admin/diagnostics/failed-command-log.ts'
import { useDataStoreVersion } from '@/hooks/use-data-store'
import { formatDate } from '@/lib/format'
import { AdminListPage } from '@/pages/admin/admin-list-page'
import { PmButton } from '@/components/ui/pm-index'

export function AdminFailedCommandsPage() {
  const version = useDataStoreVersion()
  const [, bump] = useState(0)
  const entries = useMemo(() => listFailedLocalCommands(), [version, bump])

  return (
    <AdminListPage
      label="System"
      title="Failed local commands"
      description="Demo/UAT command failures recorded in LocalStorage — not a server dead-letter queue."
      data={entries}
      getRowId={(e) => e.id}
      getSearchText={(e) => [e.commandType, e.message, e.aggregateId].filter(Boolean).join(' ')}
      emptyTitle="No failed commands"
      emptyDescription="Failures will appear here when recorded by admin command wrappers."
      headerActions={
        <PmButton
          variant="outline"
          size="sm"
          onClick={() => {
            clearFailedLocalCommands()
            bump((n) => n + 1)
          }}
        >
          Clear log
        </PmButton>
      }
      columns={[
        { id: 'type', label: 'Command', cell: (e) => e.commandType },
        { id: 'message', label: 'Message', cell: (e) => e.message },
        { id: 'aggregate', label: 'Aggregate', cell: (e) => e.aggregateId ?? '—' },
        { id: 'time', label: 'Time', cell: (e) => formatDate(e.timestamp) },
      ]}
    />
  )
}
