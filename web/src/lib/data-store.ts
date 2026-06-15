type DataEnvelope<T> = { data: T[] }

import opportunitiesBase from '@poc-data/opportunities.json'
import demoOpportunities from '@poc-data/demo-40-opportunities.json'
import postMatches from '@poc-data/demo-post-matches.json'
import demoNotifications from '@poc-data/demo-notifications.json'
import demoApplications from '@poc-data/demo-applications.json'
import demoNegotiations from '@poc-data/demo-negotiations.json'
import demoPendingUsers from '@poc-data/demo-pending-users.json'
import demoAudit from '@poc-data/demo-audit.json'
import seedUsers from '@poc-data/seed-controlled-users.json'
import demoCompanies from '@poc-data/demo-companies.json'
import usersBase from '@poc-data/users.json'
import companiesBase from '@poc-data/companies.json'
import siteContent from '@poc-data/site-content.json'
import type { Application } from '@/lib/applications'
import { notifyDataStore } from '@/hooks/use-data-store'

const OVERRIDES_KEY = 'pmtwin_web_overrides'

type Overrides = {
  applications?: Record<string, Partial<Application>>
  opportunities?: Record<string, Partial<Opportunity>>
  newApplications?: Application[]
}

function readOverrides(): Overrides {
  try {
    const raw = localStorage.getItem(OVERRIDES_KEY)
    return raw ? (JSON.parse(raw) as Overrides) : {}
  } catch {
    return {}
  }
}

function writeOverrides(overrides: Overrides) {
  localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides))
  notifyDataStore()
}

function rows<T>(envelope: DataEnvelope<T>): T[] {
  return envelope.data ?? []
}

function mergeById<T extends { id: string }>(...sets: T[][]): T[] {
  const map = new Map<string, T>()
  for (const set of sets) {
    for (const item of set) map.set(item.id, item)
  }
  return Array.from(map.values())
}

export type Opportunity = {
  id: string
  title: string
  description?: string
  status: string
  creatorId?: string
  location?: string
  exchangeMode?: string
  modelType?: string
  intent?: string
  scope?: { coreSkills?: string[] }
  attributes?: { coreSkills?: string[] }
  updatedAt?: string
  createdAt?: string
}

export type PostMatch = {
  id: string
  matchType: string
  status: string
  matchScore: number
  participants?: Array<{
    userId: string
    role: string
    participantStatus: string
  }>
  payload?: {
    breakdown?: Record<string, number>
  }
  createdAt?: string
}

export type AppNotification = {
  id: string
  userId: string
  title: string
  message: string
  link?: string
  read: boolean
  createdAt: string
}

export type { Application }

export type Negotiation = {
  id: string
  status?: string
  updatedAt?: string
}

export type PersonProfile = {
  name?: string
  headline?: string
  type?: string
  location?: string
  bio?: string
  description?: string
  skills?: string[]
}

export type PlatformUser = {
  id: string
  email: string
  passwordHash?: string
  role: string
  status: string
  isPublic?: boolean
  createdAt?: string
  profile?: PersonProfile
}

export type Company = PlatformUser

export type AuditEntry = {
  id: string
  action: string
  userId?: string
  timestamp?: string
}

export type PendingUser = PlatformUser

export const dataStore = {
  getOpportunities(): Opportunity[] {
    const base = mergeById(
      rows(opportunitiesBase as DataEnvelope<Opportunity>),
      rows(demoOpportunities as DataEnvelope<Opportunity>),
    )
    const overrides = readOverrides().opportunities ?? {}
    return base.map((o) => ({ ...o, ...overrides[o.id] }))
  },

  getOpportunityById(id: string) {
    return this.getOpportunities().find((o) => o.id === id)
  },

  updateOpportunity(id: string, patch: Partial<Opportunity>) {
    const overrides = readOverrides()
    overrides.opportunities = {
      ...overrides.opportunities,
      [id]: { ...overrides.opportunities?.[id], ...patch, updatedAt: new Date().toISOString() },
    }
    writeOverrides(overrides)
  },

  getPostMatches(): PostMatch[] {
    return rows(postMatches as DataEnvelope<PostMatch>)
  },

  getPostMatchById(id: string) {
    return this.getPostMatches().find((m) => m.id === id)
  },

  getNotifications(userId?: string): AppNotification[] {
    const uid = userId ?? 'seed-user-001'
    return rows(demoNotifications as DataEnvelope<AppNotification>).filter(
      (n) => n.userId === uid,
    )
  },

  getApplications(): Application[] {
    const base = rows(demoApplications as DataEnvelope<Application>)
    const overrides = readOverrides()
    const patched = base.map((a) => ({
      ...a,
      ...overrides.applications?.[a.id],
    }))
    return [...patched, ...(overrides.newApplications ?? [])]
  },

  updateApplication(id: string, patch: Partial<Application>) {
    const overrides = readOverrides()
    const isNew = overrides.newApplications?.some((a) => a.id === id)
    if (isNew) {
      overrides.newApplications = overrides.newApplications!.map((a) =>
        a.id === id
          ? { ...a, ...patch, updatedAt: new Date().toISOString() }
          : a,
      )
    } else {
      overrides.applications = {
        ...overrides.applications,
        [id]: {
          ...overrides.applications?.[id],
          ...patch,
          updatedAt: new Date().toISOString(),
        },
      }
    }
    writeOverrides(overrides)
  },

  createApplication(data: Omit<Application, 'id' | 'createdAt' | 'updatedAt'>) {
    const overrides = readOverrides()
    const application: Application = {
      ...data,
      id: `app-${Date.now()}`,
      status: data.status || 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    overrides.newApplications = [...(overrides.newApplications ?? []), application]
    writeOverrides(overrides)
    return application
  },

  getNegotiations(): Negotiation[] {
    return rows(demoNegotiations as DataEnvelope<Negotiation>)
  },

  getNegotiationById(id: string) {
    return this.getNegotiations().find((n) => n.id === id)
  },

  getUsers(): PlatformUser[] {
    return mergeById(
      rows(usersBase as DataEnvelope<PlatformUser>),
      rows(seedUsers as DataEnvelope<PlatformUser>),
    )
  },

  getUserById(id: string) {
    return this.getUsers().find((u) => u.id === id)
  },

  getCompanies(): Company[] {
    return mergeById(
      rows(companiesBase as DataEnvelope<Company>),
      rows(demoCompanies as DataEnvelope<Company>),
    )
  },

  getCompanyById(id: string) {
    return this.getCompanies().find((c) => c.id === id)
  },

  getPeople(): PlatformUser[] {
    return [...this.getUsers(), ...this.getCompanies()]
  },

  getPersonById(id: string): PlatformUser | undefined {
    return this.getUserById(id) ?? this.getCompanyById(id)
  },

  getPendingUsers(): PendingUser[] {
    return rows(demoPendingUsers as DataEnvelope<PendingUser>)
  },

  getAuditLog(): AuditEntry[] {
    return rows(demoAudit as DataEnvelope<AuditEntry>)
  },

  getSiteContent() {
    return siteContent as Record<
      string,
      {
        label: string
        route: string
        sections: Record<string, { label: string; html: string }>
      }
    >
  },
}
