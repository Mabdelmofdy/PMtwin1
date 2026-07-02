import { useMemo, useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { peopleApi } from '@/api/people.ts'
import { PersonCard } from '@/components/user/person-card'
import {
  filterPublicPeople,
  isCompanyEntity,
  matchesPeopleScope,
  matchesPeopleSearch,
  resolvePersonDisplayName,
  resolvePersonHeadline,
  type PeopleScopeFilter,
} from '@/components/user/user-display'
import {
  PmDataTable,
  PmTableEmpty,
  PmTablePagination,
  PmTableRowActions,
  resolveListEmptyState,
  type PmDataTableColumn,
} from '@/components/data/pm-data-index'
import { PmBadge, PmButton, PmEmptyState } from '@/components/ui/pm-index'
import type { PlatformUser } from '@/types/domain.ts'

export type PeopleListSectionProps = {
  initialScope?: PeopleScopeFilter
  search: string
  scope: PeopleScopeFilter
  onSearchChange: (value: string) => void
  onScopeChange: (scope: PeopleScopeFilter) => void
}

export function PeopleListSection({
  initialScope = 'all',
  search,
  scope,
  onSearchChange,
  onScopeChange,
}: PeopleListSectionProps) {
  const location = useLocation()
  const navPeopleScope = (location.state as { peopleScope?: PeopleScopeFilter } | null)?.peopleScope
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)

  useEffect(() => {
    if (navPeopleScope) {
      onScopeChange(navPeopleScope)
      setPage(1)
    }
  }, [location.key, navPeopleScope, onScopeChange])

  const companyIds = useMemo(
    () => new Set(peopleApi.listCompanies().map((c) => c.id)),
    [],
  )

  const filtered = useMemo(() => {
    return filterPublicPeople(peopleApi.listAll()).filter(
      (person) =>
        matchesPeopleSearch(person, search) &&
        matchesPeopleScope(person, scope, companyIds),
    )
  }, [search, scope, companyIds])

  const totalItems = filtered.length
  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize))
  const safePage = Math.min(page, pageCount)
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  const hasActiveFilters = search.length > 0 || scope !== 'all'
  const listEmpty = resolveListEmptyState({
    hasSourceData: filterPublicPeople(peopleApi.listAll()).length > 0,
    hasActiveFilters,
    firstRun: {
      title: 'No people in directory yet',
      description: 'Professionals and companies will appear here as they join the platform.',
    },
    filtered: {
      title: 'No people found',
      description: 'Try adjusting search or filters.',
    },
  })

  const columns: PmDataTableColumn<PlatformUser>[] = [
    {
      id: 'name',
      label: 'Name',
      sortable: true,
      cell: (person) => (
        <Link to={`/people/${person.id}`} className="font-medium hover:text-primary">
          {resolvePersonDisplayName(person)}
        </Link>
      ),
    },
    {
      id: 'type',
      label: 'Type',
      cell: (person) => (
        <PmBadge tone={isCompanyEntity(person, companyIds) ? 'primary' : 'info'} size="sm">
          {isCompanyEntity(person, companyIds) ? 'Company' : 'Professional'}
        </PmBadge>
      ),
    },
    {
      id: 'headline',
      label: 'Headline',
      cell: (person) => resolvePersonHeadline(person),
    },
    {
      id: 'location',
      label: 'Location',
      cell: (person) => person.profile?.location ?? '—',
    },
  ]

  return (
    <PmDataTable
      density="comfortable"
      columns={columns}
      data={paged}
      getRowId={(p) => p.id}
      caption="People and companies"
      rowActions={(person) => (
        <PmTableRowActions
          onView={() => navigate(`/people/${person.id}`)}
          hiddenActions={['edit', 'delete', 'duplicate']}
        />
      )}
      empty={
        listEmpty.branch === 'first-run' ? (
          <PmEmptyState
            title={listEmpty.config.title ?? 'No people in directory yet'}
            description={listEmpty.config.description}
            action={
              <PmButton size="sm" variant="outline" asChild>
                <Link to="/profile">Complete your profile</Link>
              </PmButton>
            }
          />
        ) : listEmpty.branch === 'filtered' ? (
          <PmTableEmpty
            variant="no-results"
            title={listEmpty.config.title}
            description={listEmpty.config.description}
            primaryAction={
              <PmButton
                size="sm"
                variant="outline"
                onClick={() => {
                  onSearchChange('')
                  onScopeChange(initialScope)
                  setPage(1)
                }}
              >
                Clear filters
              </PmButton>
            }
          />
        ) : (
          <PmTableEmpty
            variant="no-results"
            title="No people found"
            description="Try adjusting search or filters."
          />
        )
      }
      pagination={
        totalItems > 0 ? (
          <PmTablePagination
            page={safePage}
            pageSize={pageSize}
            totalItems={totalItems}
            pageSizeOptions={[12, 24, 48]}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size)
              setPage(1)
            }}
          />
        ) : undefined
      }
      renderMobileCard={(person) => (
        <PersonCard person={person} companyIds={companyIds} />
      )}
    />
  )
}
