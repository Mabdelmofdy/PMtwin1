import { Link, useParams } from 'react-router-dom'
import { adminApi } from '@/api/admin.ts'
import { dealsApi } from '@/api/deals.ts'
import { matchesApi } from '@/api/matches.ts'
import { negotiationsApi } from '@/api/negotiations.ts'
import { opportunitiesApi } from '@/api/opportunities.ts'
import { peopleApi } from '@/api/people.ts'
import { formatDate } from '@/lib/format'
import { PageHeader, StatCard, StatusBadge } from '@/components/shared/page-primitives'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

function AdminTablePage({
  label,
  title,
  description,
  columns,
  rows,
  rowLink,
}: {
  label?: string
  title: string
  description: string
  columns: string[]
  rows: (string | React.ReactNode)[][]
  rowLink?: (index: number) => string
}) {
  return (
    <div className="space-y-6">
      <PageHeader label={label} title={title} description={description} />
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((c) => <TableHead key={c}>{c}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, i) => (
                <TableRow key={i} className={rowLink ? 'cursor-pointer' : undefined}>
                  {row.map((cell, j) => (
                    <TableCell key={j}>
                      {rowLink && j === 0 ? <Link to={rowLink(i)} className="font-medium hover:text-primary">{cell}</Link> : cell}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export function AdminDashboardPage() {
  const opps = opportunitiesApi.list().length
  const users = peopleApi.listUsers().length
  const matches = matchesApi.list().length
  return (
    <div className="space-y-6">
      <PageHeader label="Admin" title="Command center" description="Platform KPIs, queues, and quick actions." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Opportunities" value={opps} />
        <StatCard label="Users" value={users} />
        <StatCard label="Post-matches" value={matches} />
        <StatCard label="Pending vetting" value={adminApi.getPendingUsers().length} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Quick actions</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button size="sm" className="cursor-pointer" asChild><Link to="/admin/vetting">Review vetting</Link></Button>
            <Button size="sm" variant="outline" className="cursor-pointer" asChild><Link to="/admin/matching">Run matching</Link></Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Recent activity</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            {adminApi.getAuditLog().slice(0, 5).map((a) => (
              <p key={a.id}>{a.action} — {formatDate(a.timestamp)}</p>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function AdminReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Platform analytics and export tools." />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="New users (30d)" value="12" hint="Demo metric" />
        <StatCard label="Published opps" value={opportunitiesApi.list().filter((o) => o.status === 'published').length} />
        <StatCard label="Match rate" value="78%" hint="Demo metric" />
      </div>
    </div>
  )
}

export function AdminHealthPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="System health" description="Service status and data store snapshot." />
      {['Data service', 'Matching engine', 'Notifications', 'Auth'].map((s) => (
        <div key={s} className="flex items-center justify-between rounded-xl border border-border/60 px-4 py-3">
          <span className="font-medium">{s}</span>
          <StatusBadge status="active" />
        </div>
      ))}
    </div>
  )
}

export function AdminUsersPage() {
  const users = peopleApi.listAll()
  return (
    <AdminTablePage
      title="Users"
      description="Managed accounts after vetting."
      columns={['Name', 'Email', 'Role', 'Status']}
      rows={users.map((u) => [u.profile?.name ?? u.id, u.email, u.role, <StatusBadge key={u.id} status={u.status} />])}
      rowLink={(i) => `/admin/users/${users[i].id}`}
    />
  )
}

export function AdminUserDetailPage() {
  const { id } = useParams()
  const user = id ? peopleApi.get(id) : undefined
  return (
    <div className="space-y-6">
      <PageHeader title={user?.profile?.name ?? 'User detail'} description={user?.email} />
      <Card><CardContent className="py-8 text-sm text-muted-foreground">Admin user inspector — documents, activity, decisions</CardContent></Card>
    </div>
  )
}

export function AdminVettingPage() {
  const pending = adminApi.getPendingUsers()
  return (
    <AdminTablePage
      label="Queue"
      title="Vetting"
      description="Pre-approval user queue."
      columns={['Name', 'Email', 'Submitted']}
      rows={pending.length ? pending.map((u) => [u.profile?.name ?? u.id, u.email, formatDate(u.createdAt)]) : [['—', 'No pending users', '—']]}
    />
  )
}

export function AdminOpportunitiesPage() {
  const opps = opportunitiesApi.list()
  return (
    <AdminTablePage
      title="Opportunities"
      description="Platform opportunity oversight."
      columns={['Title', 'Status', 'Location', 'Updated']}
      rows={opps.slice(0, 20).map((o) => [o.title, <StatusBadge key={o.id} status={o.status} />, o.location, formatDate(o.updatedAt)])}
    />
  )
}

export function AdminMatchingPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Matching engine" description="Run matching, review queues, and diagnostics." />
      <Button className="cursor-pointer">Run matching job</Button>
      <AdminTablePage
        title="Recent matches"
        description=""
        columns={['ID', 'Type', 'Score', 'Status']}
        rows={matchesApi.list().slice(0, 10).map((m) => [m.id, m.matchType, `${Math.round(m.matchScore * 100)}%`, <StatusBadge key={m.id} status={m.status} />])}
      />
    </div>
  )
}

export function AdminNegotiationsPage() {
  const negs = negotiationsApi.list()
  return (
    <AdminTablePage
      title="Negotiations"
      description="Negotiation command center."
      columns={['ID', 'Status', 'Updated']}
      rows={negs.map((n) => [n.id, <StatusBadge key={n.id} status={n.status ?? 'pending'} />, formatDate(n.updatedAt)])}
      rowLink={(i) => `/admin/negotiations/${negs[i].id}`}
    />
  )
}

export function AdminNegotiationDetailPage() {
  return <div className="space-y-6"><PageHeader title="Negotiation detail" description="Admin inspector with transcript export." /></div>
}

export function AdminDisputesPage() {
  return <AdminTablePage title="Disputes" description="Dispute resolution queue." columns={['ID', 'Status']} rows={[['—', 'No disputes in seed']]} />
}

export function AdminDealsPage() {
  const deals = dealsApi.list()
  return (
    <AdminTablePage
      title="Deals"
      description="All platform deals."
      columns={['ID', 'Status']}
      rows={deals.map((d) => [d.id, d.status ?? 'pending'])}
      rowLink={(i) => `/admin/deals/${deals[i].id}`}
    />
  )
}

export function AdminContractsPage() {
  return <AdminTablePage title="Contracts" description="All platform contracts." columns={['ID', 'Status']} rows={[['—', 'No contracts in seed']]} />
}

export function AdminConsortiumPage() {
  return (
    <AdminTablePage
      title="Consortium"
      description="Consortium deals subset."
      columns={['Match', 'Type']}
      rows={matchesApi.list().filter((m) => m.matchType.includes('consortium')).map((m) => [m.id, m.matchType])}
    />
  )
}

export function AdminAuditPage() {
  const logs = adminApi.getAuditLog()
  return (
    <AdminTablePage
      title="Audit log"
      description="Compliance and activity trail."
      columns={['Action', 'Actor', 'Time']}
      rows={logs.map((l) => [l.action, l.userId ?? '—', formatDate(l.timestamp)])}
    />
  )
}

export function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Platform settings" description="General, branding, security, matching, and feature flags." />
      <Card><CardContent className="py-8 text-sm text-muted-foreground">Vertical settings tabs — wire to system_settings</CardContent></Card>
    </div>
  )
}

export function AdminSkillsPage() {
  return <PageHeader title="Skills catalog" description="Canonical skills and lookup editor." />
}

export function AdminCollaborationModelsPage() {
  return <PageHeader title="Collaboration models" description="Enable and order platform collaboration models." />
}

export function AdminSiteContentPage() {
  return <PageHeader title="Site content" description="CMS for public marketing pages." />
}

export function AdminSubscriptionsPage() {
  return <AdminTablePage title="Subscriptions" description="Plans and assignments (POC)." columns={['Plan', 'Status']} rows={[['Professional', 'Active'], ['Enterprise', 'Active']]} />
}
