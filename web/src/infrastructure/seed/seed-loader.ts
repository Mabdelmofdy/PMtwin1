import type {
  Application,
  AppNotification,
  AuditEntry,
  Company,
  Contract,
  Deal,
  Negotiation,
  Opportunity,
  PendingUser,
  PlatformUser,
  PostMatch,
  SiteContentPage,
} from '@/types/domain.ts'
import {
  normalizeApplications,
  normalizeContracts,
  normalizeDeals,
  normalizeNegotiations,
} from '@/domain/normalizers.ts'

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
import demoDeals from '@poc-data/demo-deals.json'
import demoContracts from '@poc-data/demo-contracts.json'

type DataEnvelope<T> = { data: T[] }

export function rows<T>(envelope: DataEnvelope<T>): T[] {
  return envelope.data ?? []
}

export function mergeById<T extends { id: string }>(...sets: T[][]): T[] {
  const map = new Map<string, T>()
  for (const set of sets) {
    for (const item of set) map.set(item.id, item)
  }
  return Array.from(map.values())
}

export function loadOpportunities(): Opportunity[] {
  return mergeById(
    rows(opportunitiesBase as DataEnvelope<Opportunity>),
    rows(demoOpportunities as DataEnvelope<Opportunity>),
  )
}

export function loadUsers(): PlatformUser[] {
  return mergeById(
    rows(usersBase as DataEnvelope<PlatformUser>),
    rows(seedUsers as DataEnvelope<PlatformUser>),
  )
}

export function loadCompanies(): Company[] {
  return mergeById(
    rows(companiesBase as DataEnvelope<Company>),
    rows(demoCompanies as DataEnvelope<Company>),
  )
}

export function loadApplications(): Application[] {
  return normalizeApplications(
    rows(demoApplications as DataEnvelope<Application>),
  )
}

export function loadPostMatches(): PostMatch[] {
  return rows(postMatches as DataEnvelope<PostMatch>)
}

export function loadNegotiations(): Negotiation[] {
  return normalizeNegotiations(
    rows(demoNegotiations as DataEnvelope<Negotiation>),
  )
}

export function loadNotifications(): AppNotification[] {
  return rows(demoNotifications as DataEnvelope<AppNotification>)
}

export function loadDeals(): Deal[] {
  return normalizeDeals(rows(demoDeals as DataEnvelope<Deal>))
}

export function loadContracts(): Contract[] {
  return normalizeContracts(rows(demoContracts as DataEnvelope<Contract>))
}

export function loadPendingUsers(): PendingUser[] {
  return rows(demoPendingUsers as DataEnvelope<PendingUser>)
}

export function loadAuditLog(): AuditEntry[] {
  return rows(demoAudit as DataEnvelope<AuditEntry>)
}

export function loadSiteContent(): Record<string, SiteContentPage> {
  return siteContent as Record<string, SiteContentPage>
}
