import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { opportunitiesApi } from '@/api/opportunities.ts'
import { formatDate } from '@/lib/format'
import { formatMatchDisplayTitle } from '@/lib/match-display.ts'
import { MatchCard } from '@/components/collaboration/match-card'
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
import { PmBadge, PmButton, PmMatchScoreBadge, PmWorkflowBadge } from '@/components/ui/pm-index'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { pmTypography } from '@/components/shared/pm-design-tokens'
import { formatMatchTypeBadgeLabel } from '@/components/collaboration/collaboration-display'
import type { PostMatch } from '@/types/domain.ts'

export type MatchesListSectionProps = {
  matches: readonly PostMatch[]
  showToolbar?: boolean
  compact?: boolean
}

/** Shared matches list — PmDataTable desktop + MatchCard mobile. */
export function MatchesListSection({
  matches,
  showToolbar = true,
  compact = false,
}: MatchesListSectionProps) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [matchType, setMatchType] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(compact ? 8 : 12)

  const filtered = useMemo(() => {
    return matches.filter((m) => {
      const pairing = formatMatchDisplayTitle(m, (id) => opportunitiesApi.get(id)).toLowerCase()
      const matchesSearch = !search || pairing.includes(search.toLowerCase())
      const matchesStatus = status === 'all' || m.status === status
      const matchesType =
        matchType === 'all' || (m.matchType || 'one_way').toLowerCase() === matchType
      return matchesSearch && matchesStatus && matchesType
    })
  }, [matches, search, status, matchType])

  const totalItems = filtered.length
  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize))
  const safePage = Math.min(page, pageCount)
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  const columns: PmDataTableColumn<PostMatch>[] = [
    {
      id: 'pairing',
      label: 'Match',
      cell: (m) => (
        <Link to={`/matches/${m.id}`} className="font-medium hover:text-primary">
          {formatMatchDisplayTitle(m, (id) => opportunitiesApi.get(id))}
        </Link>
      ),
    },
    {
      id: 'score',
      label: 'Score',
      cell: (m) => (
        <PmMatchScoreBadge
          score={m.matchScore}
          variant="list"
          breakdown={m.payload?.breakdown ?? m.matchCriteria}
        />
      ),
    },
    {
      id: 'status',
      label: 'Status',
      cell: (m) => <PmWorkflowBadge status={m.status} entity="match" />,
    },
    {
      id: 'typeBadge',
      label: 'Type',
      hideable: true,
      defaultVisible: true,
      cell: (m) => (
        <PmBadge tone="neutral" size="sm">
          {formatMatchTypeBadgeLabel(m.matchType)}
        </PmBadge>
      ),
    },
    {
      id: 'created',
      label: 'Created',
      cell: (m) => formatDate(m.createdAt),
    },
  ]

  return (
    <PmDataTable
      density={compact ? 'compact' : 'comfortable'}
      columns={columns}
      data={paged}
      getRowId={(m) => m.id}
      caption="Matches"
      toolbar={
        showToolbar ? (
          <PmTableToolbar
            search={
              <PmTableSearch
                placeholder="Search need, offer, or partner…"
                value={search}
                onValueChange={(v) => {
                  setSearch(v)
                  setPage(1)
                }}
              />
            }
            filters={
              <PmTableFilter
                activeCount={
                  (status !== 'all' ? 1 : 0) + (matchType !== 'all' ? 1 : 0)
                }
                label="Filters"
              >
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className={pmTypography.label}>Status</label>
                    <Select
                      value={status}
                      onValueChange={(v) => {
                        setStatus(v)
                        setPage(1)
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        <SelectItem value="discovered">Discovered</SelectItem>
                        <SelectItem value="accepted">Accepted</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="declined">Declined</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className={pmTypography.label}>Match type</label>
                    <Select
                      value={matchType}
                      onValueChange={(v) => {
                        setMatchType(v)
                        setPage(1)
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All types</SelectItem>
                        <SelectItem value="one_way">One-way</SelectItem>
                        <SelectItem value="two_way">Two-way</SelectItem>
                        <SelectItem value="consortium">Consortium</SelectItem>
                        <SelectItem value="circular">Circular</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </PmTableFilter>
            }
          />
        ) : undefined
      }
      rowActions={(m) => (
        <PmTableRowActions
          onView={() => navigate(`/matches/${m.id}`)}
          hiddenActions={['edit', 'delete', 'duplicate']}
        />
      )}
      empty={
        <PmTableEmpty
          variant="no-results"
          title="No matches found"
          description="Matches appear when opportunities are published and the matching engine runs."
          primaryAction={
            <PmButton size="sm" variant="outline" asChild>
              <Link to="/opportunities">View opportunities</Link>
            </PmButton>
          }
        />
      }
      pagination={
        totalItems > 0 ? (
          <PmTablePagination
            page={safePage}
            pageSize={pageSize}
            totalItems={totalItems}
            pageSizeOptions={compact ? [8, 16] : [12, 24, 48]}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size)
              setPage(1)
            }}
          />
        ) : undefined
      }
      renderMobileCard={(m) => <MatchCard match={m} />}
    />
  )
}
