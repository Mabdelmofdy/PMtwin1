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
  PmTableFilter,
  PmTablePagination,
  PmTableRowActions,
  PmTableSearch,
  PmTableToolbar,
  resolveListEmptyState,
  type PmDataTableColumn,
} from '@/components/data/pm-data-index'
import {
  PmBadge,
  PmButton,
  PmEmptyState,
  PmFilterChips,
  type PmFilterChip,
} from '@/components/ui/pm-index'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { pmTypography } from '@/tokens'
import { cn } from '@/lib/utils'
import type { PlatformUser } from '@/types/domain.ts'

const PEOPLE_SCOPE_FILTER_LABELS: Record<PeopleScopeFilter, string> = {
  all: 'All',
  people: 'Professionals',
  companies: 'Companies',
}

export type PeopleListFilters = ReturnType<typeof usePeopleListFilters>

export type PeopleListSectionProps = {
  showToolbar?: boolean
  showPagination?: boolean
  initialScope?: PeopleScopeFilter
  /** When provided, filter/pagination state is controlled externally (browse page). */
  filters?: PeopleListFilters
}

export function usePeopleListFilters(initialScope: PeopleScopeFilter = 'all') {
  const location = useLocation()
  const navPeopleScope = (location.state as { peopleScope?: PeopleScopeFilter } | null)?.peopleScope
  const [search, setSearchState] = useState('')
  const [scope, setScopeState] = useState<PeopleScopeFilter>(initialScope)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSizeState] = useState(12)

  useEffect(() => {
    setScopeState(initialScope)
  }, [initialScope])

  useEffect(() => {
    if (navPeopleScope) {
      setScopeState(navPeopleScope)
      setPage(1)
    }
  }, [location.key, navPeopleScope])

  const setSearch = (value: string) => {
    setSearchState(value)
    setPage(1)
  }
  const setScope = (value: PeopleScopeFilter) => {
    setScopeState(value)
    setPage(1)
  }
  const setPageSize = (size: number) => {
    setPageSizeState(size)
    setPage(1)
  }

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

  const activeFilterChips: PmFilterChip[] =
    scope !== 'all'
      ? [
          {
            id: 'scope',
            label: 'Type',
            value: PEOPLE_SCOPE_FILTER_LABELS[scope],
            onRemove: () => setScope('all'),
          },
        ]
      : []

  const clearAllFilters = () => {
    setSearchState('')
    setScopeState(initialScope)
    setPage(1)
  }

  return {
    search,
    setSearch,
    scope,
    setScope,
    page,
    setPage,
    pageSize,
    setPageSize,
    paged,
    totalItems,
    safePage,
    pageCount,
    listEmpty,
    activeFilterChips,
    clearAllFilters,
    companyIds,
    initialScope,
  }
}

export type PeopleBrowseToolbarProps = Pick<
  PeopleListFilters,
  | 'search'
  | 'setSearch'
  | 'scope'
  | 'setScope'
  | 'activeFilterChips'
  | 'clearAllFilters'
>

/** Search, type filter, and chips for people browse — composed inside `PmBrowseToolbar`. */
export function PeopleBrowseToolbar({
  search,
  setSearch,
  scope,
  setScope,
  activeFilterChips,
  clearAllFilters,
}: PeopleBrowseToolbarProps) {
  return (
    <PmTableToolbar
      search={
        <PmTableSearch
          placeholder="Search by name, skills, sector…"
          value={search}
          onValueChange={setSearch}
        />
      }
      filters={
        <PmTableFilter activeCount={scope !== 'all' ? 1 : 0} label="Type">
          <div className="space-y-1.5">
            <label className={cn(pmTypography.bodySm, 'font-medium')}>Entity type</label>
            <Select value={scope} onValueChange={(value) => setScope(value as PeopleScopeFilter)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="people">Professionals</SelectItem>
                <SelectItem value="companies">Companies</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </PmTableFilter>
      }
    >
      <PmFilterChips chips={activeFilterChips} onClearAll={clearAllFilters} />
    </PmTableToolbar>
  )
}

/** Shared people directory — PmDataTable desktop + PersonCard mobile. */
export function PeopleListSection({
  showToolbar = true,
  showPagination = true,
  initialScope = 'all',
  filters: externalFilters,
}: PeopleListSectionProps) {
  if (externalFilters) {
    return (
      <PeopleListTable
        showToolbar={showToolbar}
        showPagination={showPagination}
        filters={externalFilters}
      />
    )
  }

  return (
    <PeopleListSectionWithFilters
      showToolbar={showToolbar}
      showPagination={showPagination}
      initialScope={initialScope}
    />
  )
}

function PeopleListSectionWithFilters({
  showToolbar,
  showPagination,
  initialScope,
}: Omit<PeopleListSectionProps, 'filters'>) {
  const filters = usePeopleListFilters(initialScope)
  return (
    <PeopleListTable
      showToolbar={showToolbar}
      showPagination={showPagination}
      filters={filters}
    />
  )
}

function PeopleListEmpty({
  listEmpty,
  clearAllFilters,
}: {
  listEmpty: PeopleListFilters['listEmpty']
  clearAllFilters: () => void
}) {
  if (listEmpty.branch === 'first-run') {
    return (
      <PmEmptyState
        title={listEmpty.config.title ?? 'No people in directory yet'}
        description={listEmpty.config.description}
        action={
          <PmButton size="sm" variant="outline" asChild>
            <Link to="/profile">Complete your profile</Link>
          </PmButton>
        }
      />
    )
  }

  if (listEmpty.branch === 'filtered') {
    return (
      <PmTableEmpty
        variant="no-results"
        title={listEmpty.config.title}
        description={listEmpty.config.description}
        primaryAction={
          <PmButton size="sm" variant="outline" onClick={clearAllFilters}>
            Clear filters
          </PmButton>
        }
      />
    )
  }

  return (
    <PmTableEmpty
      variant="no-results"
      title="No people found"
      description="Try adjusting search or filters."
    />
  )
}

function PeopleListTable({
  showToolbar = true,
  showPagination = true,
  filters,
}: {
  showToolbar?: boolean
  showPagination?: boolean
  filters: PeopleListFilters
}) {
  const navigate = useNavigate()
  const {
    search,
    setSearch,
    scope,
    setScope,
    paged,
    totalItems,
    safePage,
    pageSize,
    setPage,
    setPageSize,
    listEmpty,
    activeFilterChips,
    clearAllFilters,
    companyIds,
  } = filters

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
      toolbar={
        showToolbar ? (
          <PeopleBrowseToolbar
            search={search}
            setSearch={setSearch}
            scope={scope}
            setScope={setScope}
            activeFilterChips={activeFilterChips}
            clearAllFilters={clearAllFilters}
          />
        ) : undefined
      }
      rowActions={(person) => (
        <PmTableRowActions
          onView={() => navigate(`/people/${person.id}`)}
          hiddenActions={['edit', 'delete', 'duplicate']}
        />
      )}
      empty={<PeopleListEmpty listEmpty={listEmpty} clearAllFilters={clearAllFilters} />}
      pagination={
        showPagination && totalItems > 0 ? (
          <PmTablePagination
            page={safePage}
            pageSize={pageSize}
            totalItems={totalItems}
            pageSizeOptions={[12, 24, 48]}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        ) : undefined
      }
      renderMobileCard={(person) => (
        <PersonCard person={person} companyIds={companyIds} />
      )}
    />
  )
}
