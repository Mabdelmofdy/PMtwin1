import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  listAdminUserSummaries,
  uniqueUserRoles,
  uniqueUserStatuses,
} from '@/domain/admin/read-models/user-summary-adapter.ts'
import { useDataStoreVersion } from '@/hooks/use-data-store'
import { AdminListPage } from '@/pages/admin/admin-list-page'
import { AdminStatusBadge } from '@/pages/admin/admin-display'
import { PmToolbarSurface } from '@/components/ui/pm-toolbar-surface'

export function AdminUsersPage() {
  const navigate = useNavigate()
  const version = useDataStoreVersion()
  const [params, setParams] = useSearchParams()
  const statusFilter = params.get('status') ?? ''
  const roleFilter = params.get('role') ?? ''
  const [query, setQuery] = useState('')

  const statuses = useMemo(() => uniqueUserStatuses(), [version])
  const roles = useMemo(() => uniqueUserRoles(), [version])
  const users = useMemo(
    () =>
      listAdminUserSummaries({
        status: statusFilter || undefined,
        role: roleFilter || undefined,
        query: query || undefined,
      }),
    [statusFilter, roleFilter, query, version],
  )

  return (
    <AdminListPage
      title="Users"
      description="Managed accounts after vetting."
      storageKey="users"
      data={users}
      getRowId={(u) => u.id}
      getRowHref={(u) => `/admin/users/${u.id}`}
      getSearchText={(u) =>
        [u.fullName, u.email, u.role, u.accountStatus].filter(Boolean).join(' ')
      }
      getSortValue={(u, columnId) => {
        if (columnId === 'name') return u.fullName
        if (columnId === 'email') return u.email
        if (columnId === 'role') return u.roleLabel
        if (columnId === 'status') return u.accountStatus
        return undefined
      }}
      searchPlaceholder="Search users…"
      getRowActions={(u) => [
        {
          id: 'audit',
          label: 'Audit',
          onSelect: () => navigate(`/admin/audit?entity=${u.id}`),
        },
        {
          id: 'memberships',
          label: 'Memberships',
          onSelect: () => navigate('/admin/memberships'),
        },
      ]}
      toolbarExtra={
        <PmToolbarSurface className="flex flex-wrap items-center gap-2">
          <label className="text-sm text-muted-foreground">
            Status{' '}
            <select
              className="ml-1 rounded-md border border-border bg-background px-2 py-1 text-sm"
              value={statusFilter}
              onChange={(e) => {
                const next = new URLSearchParams(params)
                if (e.target.value) next.set('status', e.target.value)
                else next.delete('status')
                setParams(next)
              }}
            >
              <option value="">All</option>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-muted-foreground">
            Role{' '}
            <select
              className="ml-1 rounded-md border border-border bg-background px-2 py-1 text-sm"
              value={roleFilter}
              onChange={(e) => {
                const next = new URLSearchParams(params)
                if (e.target.value) next.set('role', e.target.value)
                else next.delete('role')
                setParams(next)
              }}
            >
              <option value="">All</option>
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <input
            type="search"
            className="rounded-md border border-border bg-background px-2 py-1 text-sm"
            placeholder="Filter…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Additional user filter"
          />
        </PmToolbarSurface>
      }
      columns={[
        { id: 'name', label: 'Name', cell: (u) => u.fullName },
        { id: 'email', label: 'Email', cell: (u) => u.email },
        { id: 'role', label: 'Role', cell: (u) => u.roleLabel },
        {
          id: 'party',
          label: 'Party',
          cell: (u) => u.primaryPartyLabel ?? '—',
        },
        {
          id: 'status',
          label: 'Status',
          cell: (u) => <AdminStatusBadge status={u.accountStatus} />,
        },
      ]}
    />
  )
}
