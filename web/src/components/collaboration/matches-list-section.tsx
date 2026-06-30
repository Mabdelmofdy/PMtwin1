import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { pmTypography } from '@/components/shared/pm-design-tokens'
import { formatDate } from '@/lib/format'
import { MatchCard } from '@/components/collaboration/match-card'
import {
  formatMatchTypeBadgeLabel,
  resolveMatchTypeTone,
} from '@/components/collaboration/collaboration-display'
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
import type { PostMatch } from '@/types/domain.ts'

export type MatchesListSectionProps = {
  matches: readonly PostMatch[]
  showToolbar?: boolean
  compact?: boolean
}

/** Shared post-matches list — PmDataTable desktop + MatchCard mobile. */
export function MatchesListSection({
  matches,
  showToolbar = true,
  compact = false,
}: MatchesListSectionProps) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(compact ? 8 : 12)

  const filtered = useMemo(() => {
    return matches.filter((m) => {
      const typeLabel = m.matchType.replace(/_/g, ' ').toLowerCase()
      const matchesSearch =
        !search ||
        typeLabel.includes(search.toLowerCase()) ||
        m.id.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = status === 'all' || m.status === status
      return matchesSearch && matchesStatus
    })
  }, [matches, search, status])

  const totalItems = filtered.length
  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize))
  const safePage = Math.min(page, pageCount)
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  const columns: PmDataTableColumn<PostMatch>[] = [
    {
      id: 'type',
      label: 'Match type',
      cell: (m) => (
        <Link to={`/matches/${m.id}`} className="font-medium hover:text-primary">
          {formatMatchTypeBadgeLabel(m.matchType)}
        </Link>
      ),
    },
    {
      id: 'score',
      label: 'Score',
      cell: (m) => <PmMatchScoreBadge score={m.matchScore} variant="list" />,
    },
    {
      id: 'status',
      label: 'Status',
      cell: (m) => <PmWorkflowBadge status={m.status} entity="match" />,
    },
    {
      id: 'typeBadge',
      label: 'Topology',
      hideable: true,
      defaultVisible: false,
      cell: (m) => (
        <PmBadge tone={resolveMatchTypeTone(m.matchType)} size="sm" uppercase>
          {m.matchType.replace(/_/g, ' ')}
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
      caption="Post-matches"
      toolbar={
        showToolbar ? (
          <PmTableToolbar
            search={
              <PmTableSearch
                placeholder="Search match type or ID…"
                value={search}
                onValueChange={(v) => {
                  setSearch(v)
                  setPage(1)
                }}
              />
            }
            filters={
              <PmTableFilter activeCount={status !== 'all' ? 1 : 0} label="Status">
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
          title="No post-matches found"
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
