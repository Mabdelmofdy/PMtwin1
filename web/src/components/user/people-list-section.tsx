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
  type PmDataTableColumn,
} from '@/components/data/pm-data-index'
import { PmBadge } from '@/components/ui/pm-index'
import { PmToolbarSurface } from '@/components/ui/pm-toolbar-surface'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { pmTypography } from '@/components/shared/pm-design-tokens'
import { cn } from '@/lib/utils'
import type { PlatformUser } from '@/types/domain.ts'

export type PeopleListSectionProps = {
  initialScope?: PeopleScopeFilter
}

export function PeopleListSection({ initialScope = 'all' }: PeopleListSectionProps) {
  const location = useLocation()
  const navPeopleScope = (location.state as { peopleScope?: PeopleScopeFilter } | null)?.peopleScope
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [scope, setScope] = useState<PeopleScopeFilter>(navPeopleScope ?? initialScope)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(12)

  useEffect(() => {
    if (navPeopleScope) {
      setScope(navPeopleScope)
      setPage(1)
    }
  }, [location.key, navPeopleScope])

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
        <PmToolbarSurface>
          <PmTableToolbar
            search={
              <PmTableSearch
                placeholder="Search by name, skills, sector…"
                value={search}
                onValueChange={(v) => {
                  setSearch(v)
                  setPage(1)
                }}
              />
            }
            filters={
              <PmTableFilter activeCount={scope !== 'all' ? 1 : 0} label="Type">
                <div className="space-y-1.5">
                  <label className={cn(pmTypography.bodySm, 'font-medium')}>Entity type</label>
                  <Select
                    value={scope}
                    onValueChange={(v) => {
                      setScope(v as PeopleScopeFilter)
                    setPage(1)
                  }}
                >
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
          />
        </PmToolbarSurface>
      }
      rowActions={(person) => (
        <PmTableRowActions
          onView={() => navigate(`/people/${person.id}`)}
          hiddenActions={['edit', 'delete', 'duplicate']}
        />
      )}
      empty={
        <PmTableEmpty
          variant="no-results"
          title="No people found"
          description="Try adjusting search or filters."
        />
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
