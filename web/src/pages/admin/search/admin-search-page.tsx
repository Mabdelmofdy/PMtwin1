import { useMemo, useState } from 'react'
import { AdminSearchResults } from '@/components/admin/search/admin-search-results.tsx'
import { searchAdminEntities } from '@/domain/admin/read-models/search-adapter.ts'
import { useAuth } from '@/providers/auth-provider.tsx'
import { useDataStoreVersion } from '@/hooks/use-data-store'
import { PmPage, PmPageHeader } from '@/components/ui/pm-index'
import { PmToolbarSurface } from '@/components/ui/pm-toolbar-surface'
import { PmTableSearch } from '@/components/data/pm-data-index'

export function AdminSearchPage() {
  const { user } = useAuth()
  const version = useDataStoreVersion()
  const [query, setQuery] = useState('')
  const results = useMemo(
    () =>
      searchAdminEntities({
        query,
        actorRole: user?.role,
        limit: 60,
      }),
    [query, user?.role, version],
  )

  return (
    <PmPage
      header={
        <PmPageHeader
          label="Explore"
          title="Global Search"
          description="Search users, parties, opportunities, negotiations, Commercial Agreements, contracts, audit, and notifications."
        />
      }
    >
      <PmToolbarSurface className="mb-4">
        <PmTableSearch
          value={query}
          onValueChange={setQuery}
          placeholder="Search across admin entities…"
        />
      </PmToolbarSurface>
      <AdminSearchResults results={results} title={query.trim() ? 'Results' : 'Enter a query'} />
    </PmPage>
  )
}
