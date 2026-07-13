import { useMemo, useState } from 'react'
import type { AccountType } from '@/types/domain.ts'
import { peopleApi } from '@/api/people.ts'
import { resolveVettingCaseStatus } from '@/types/vetting.ts'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { buildDemoAccountScenarioTags } from '@/domain/admin/diagnostics/demo-account-scenario-tags.ts'

const DEMO_WORKFLOW_PASSWORD = 'Pmtwin@2026'

export type DemoCredentialRow = {
  name: string
  role: string
  email: string
  password: string
  group: 'admin' | 'workflow' | 'workflow-company' | 'company' | 'employee' | 'pending' | 'other'
  accountType: AccountType
  featured: boolean
  status: string
  caseStatus: string
  isPending: boolean
  scenarioTags: readonly string[]
}

const TABS = [
  { id: 'professionals' as const, label: 'Professionals' },
  { id: 'employees' as const, label: 'Employees' },
  { id: 'companies' as const, label: 'Companies' },
  { id: 'pending' as const, label: 'Pending' },
  { id: 'admin' as const, label: 'Admin' },
]

function decodePassword(hash?: string): string | null {
  if (!hash) return null
  try {
    return atob(hash)
  } catch {
    return null
  }
}

function inferPassword(email: string): string {
  if (email === 'admin@pmtwin.com') return 'admin123'
  if (/@pmtwin\.test$/i.test(email) || /\.test$/i.test(email)) return DEMO_WORKFLOW_PASSWORD
  return 'password123'
}

function isPendingStatus(status: string, caseStatus: string): boolean {
  if (
    status === 'pending_vetting' ||
    status === 'pending' ||
    status === 'clarification_requested'
  ) {
    return true
  }
  return (
    caseStatus === 'draft' ||
    caseStatus === 'submitted' ||
    caseStatus === 'pending_review' ||
    caseStatus === 'clarification_requested' ||
    caseStatus === 'resubmitted'
  )
}

function isEmployeeUser(user: {
  id?: string
  email?: string
  profile?: Record<string, unknown>
  employerCompanyId?: string
  companyId?: string
}): boolean {
  if (user.id?.startsWith('seed-emp-')) return true
  if (user.employerCompanyId || user.companyId) return true
  const profile = user.profile ?? {}
  if (profile.type === 'employee') return true
  if (profile.employerCompanyId || profile.companyId) return true
  return false
}

function buildDemoCredentials(): DemoCredentialRow[] {
  const rows = new Map<string, DemoCredentialRow>()
  const tagsByEmail = buildDemoAccountScenarioTags()

  const add = (row: DemoCredentialRow) => {
    if (row.email) rows.set(row.email.toLowerCase(), row)
  }

  for (const user of peopleApi.listUsers()) {
    const email = (user.email || '').trim()
    if (!email) continue
    const profile = user.profile || {}
    const caseStatus = resolveVettingCaseStatus(profile.vetting, user.status)
    const pending = isPendingStatus(user.status, caseStatus)
    const isAdmin = user.role === 'admin' || email === 'admin@pmtwin.com'
    const employee = !isAdmin && !pending && isEmployeeUser(user as never)

    add({
      name: profile.name || email,
      role: profile.headline || (profile as { title?: string }).title || user.role || 'User',
      email,
      password: decodePassword(user.passwordHash) || inferPassword(email),
      group: isAdmin
        ? 'admin'
        : pending
          ? 'pending'
          : employee
            ? 'employee'
            : /@pmtwin\.test$/i.test(email)
              ? 'workflow'
              : 'other',
      accountType: isAdmin ? 'auto' : 'individual',
      featured: ['khalid.alharbi@pmtwin.test', 'admin@pmtwin.com'].includes(email.toLowerCase()),
      status: user.status,
      caseStatus,
      isPending: pending,
      scenarioTags: tagsByEmail.get(email.toLowerCase()) ?? [],
    })
  }

  for (const company of peopleApi.listCompanies()) {
    const email = (company.email || '').trim()
    if (!email) continue
    const profile = company.profile || {}
    const caseStatus = resolveVettingCaseStatus(profile.vetting, company.status)
    const pending = isPendingStatus(company.status, caseStatus)
    add({
      name: profile.name || profile.accountLabel || email,
      role: profile.headline || 'Company account',
      email,
      password: decodePassword(company.passwordHash) || inferPassword(email),
      group: pending
        ? 'pending'
        : /@pmtwin\.test$/i.test(email)
          ? 'workflow-company'
          : 'company',
      accountType: 'company',
      featured: email.toLowerCase() === 'contact@alriyadh-construction.test',
      status: company.status,
      caseStatus,
      isPending: pending,
      scenarioTags: tagsByEmail.get(email.toLowerCase()) ?? [],
    })
  }

  return Array.from(rows.values()).sort((a, b) => a.name.localeCompare(b.name))
}

function tabForRow(row: DemoCredentialRow): (typeof TABS)[number]['id'] {
  if (row.isPending || row.group === 'pending') return 'pending'
  if (row.group === 'admin') return 'admin'
  if (row.group === 'employee') return 'employees'
  if (row.accountType === 'company' || row.group === 'workflow-company' || row.group === 'company') {
    return 'companies'
  }
  return 'professionals'
}

function initials(name: string, email: string): string {
  const parts = (name || email).trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return (name || email).slice(0, 2).toUpperCase()
}

function statusLabel(row: DemoCredentialRow): string {
  if (row.isPending) return row.caseStatus.replace(/_/g, ' ')
  if (row.status === 'active') return 'approved'
  return row.status.replace(/_/g, ' ')
}

type DemoCredentialsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (row: DemoCredentialRow) => void | Promise<void>
}

export function DemoCredentialsDialog({ open, onOpenChange, onSelect }: DemoCredentialsDialogProps) {
  const credentials = useMemo(() => buildDemoCredentials(), [open])
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]['id']>('professionals')
  const [query, setQuery] = useState('')
  const [loadingEmail, setLoadingEmail] = useState<string | null>(null)

  const buckets = useMemo(() => {
    const out = {
      professionals: [] as DemoCredentialRow[],
      employees: [] as DemoCredentialRow[],
      companies: [] as DemoCredentialRow[],
      pending: [] as DemoCredentialRow[],
      admin: [] as DemoCredentialRow[],
    }
    for (const row of credentials) out[tabForRow(row)].push(row)
    return out
  }, [credentials])

  const visible = buckets[activeTab].filter((row) => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return `${row.name} ${row.role} ${row.email} ${row.status} ${row.caseStatus} ${row.scenarioTags.join(' ')}`
      .toLowerCase()
      .includes(q)
  })

  const pick = async (row: DemoCredentialRow) => {
    setLoadingEmail(row.email)
    try {
      await onSelect(row)
      onOpenChange(false)
    } finally {
      setLoadingEmail(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="modal-dialog modal-dialog--demo-credentials flex max-h-[88vh] flex-col sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Demo accounts</DialogTitle>
        </DialogHeader>
        <div className="pm-demo-credentials flex min-h-0 flex-1 flex-col overflow-hidden">
          <p className="pm-demo-credentials-intro">
            Approved accounts work immediately. Pending accounts can sign in to complete onboarding
            but cannot create or publish opportunities until admin approval.
          </p>
          <div className="pm-demo-credentials-passwords">
            <span className="pm-demo-credentials-pill">
              <strong>Admin</strong> <code>admin123</code>
            </span>
            <span className="pm-demo-credentials-pill">
              <strong>Workflow accounts</strong> <code>{DEMO_WORKFLOW_PASSWORD}</code>
            </span>
          </div>
          <div className="pm-demo-credentials-search-wrap">
            <i className="ph-duotone ph-magnifying-glass" aria-hidden="true" />
            <input
              type="search"
              className="pm-demo-credentials-search"
              placeholder="Search by name, role, email, or status…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="pm-demo-credentials-tabs" role="tablist">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                className={`pm-demo-credentials-tabs__btn${activeTab === tab.id ? ' is-active' : ''}`}
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}{' '}
                <span className="pm-demo-credentials-tabs__count">
                  ({query && activeTab === tab.id ? `${visible.length}/` : ''}
                  {buckets[tab.id].length})
                </span>
              </button>
            ))}
          </div>
          <div className="pm-demo-credentials-scroll">
            <div className="pm-demo-credentials-list">
              {visible.map((row) => (
                <button
                  key={row.email}
                  type="button"
                  className={`pm-demo-credentials-card${row.group === 'admin' ? ' pm-demo-credentials-card--admin' : ''}${row.featured ? ' pm-demo-credentials-card--featured' : ''}${row.isPending ? ' pm-demo-credentials-card--pending' : ''}`}
                  disabled={loadingEmail === row.email}
                  onClick={() => void pick(row)}
                >
                  <span className="pm-demo-credentials-avatar" aria-hidden="true">
                    {initials(row.name, row.email)}
                  </span>
                  <span className="pm-demo-credentials-meta">
                    <span className="pm-demo-credentials-name">{row.name}</span>
                    <span className="pm-demo-credentials-role">{row.role}</span>
                    <span className="pm-demo-credentials-email">{row.email}</span>
                    {row.scenarioTags.length > 0 ? (
                      <span className="pm-demo-credentials-role">
                        Cast in: {row.scenarioTags.slice(0, 2).join(' · ')}
                        {row.scenarioTags.length > 2 ? '…' : ''}
                      </span>
                    ) : null}
                    <span
                      className={`pm-demo-credentials-status${row.isPending ? ' is-pending' : ' is-approved'}`}
                    >
                      {statusLabel(row)}
                    </span>
                  </span>
                  <span className="pm-demo-credentials-use">
                    Open <i className="ph-bold ph-arrow-right" aria-hidden="true" />
                  </span>
                </button>
              ))}
            </div>
            {visible.length === 0 ? (
              <p className="pm-demo-credentials-empty">No accounts match your search.</p>
            ) : null}
          </div>
        </div>
        <DialogFooter className="modal-footer">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
