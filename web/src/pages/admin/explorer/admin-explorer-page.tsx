import { useMemo } from 'react'
import { AdminEntityCatalogue } from '@/components/admin/explorer/admin-entity-catalogue.tsx'
import { listExplorerEntities } from '@/domain/admin/read-models/explorer-adapter.ts'
import { useDataStoreVersion } from '@/hooks/use-data-store'
import { PmPage, PmPageHeader } from '@/components/ui/pm-index'

export function AdminExplorerPage() {
  const version = useDataStoreVersion()
  const entities = useMemo(() => listExplorerEntities(), [version])

  return (
    <PmPage
      header={
        <PmPageHeader
          label="Explore"
          title="Platform Explorer"
          description="Entity catalogue with live LocalStorage record counts."
        />
      }
    >
      <AdminEntityCatalogue entities={entities} title="Entities" />
    </PmPage>
  )
}
