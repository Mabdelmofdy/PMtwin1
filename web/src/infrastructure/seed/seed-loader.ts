import type {
  Application,
  AppNotification,
  AuditEntry,
  Company,
  Deal,
  Negotiation,
  Opportunity,
  PendingUser,
  PlatformUser,
  PostMatch,
  SiteContentPage,
} from '@/types/domain.ts'

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
  return rows(demoApplications as DataEnvelope<Application>)
}

export function loadPostMatches(): PostMatch[] {
  return rows(postMatches as DataEnvelope<PostMatch>)
}

export function loadNegotiations(): Negotiation[] {
  return rows(demoNegotiations as DataEnvelope<Negotiation>)
}

export function loadNotifications(): AppNotification[] {
  return rows(demoNotifications as DataEnvelope<AppNotification>)
}

export function loadDeals(): Deal[] {
  const fromJson = rows(demoDeals as DataEnvelope<Deal>)
  if (fromJson.length > 0) return fromJson

  // Bootstrap display deals from seed negotiations when demo-deals.json is empty.
  // Static at module load — not regenerated on repository reads.
  return loadNegotiations().map((n) => ({
    id: n.id,
    negotiationId: n.id,
    opportunityId: n.opportunityId ?? '',
    title: `Deal from ${n.id}`,
    status: n.status ?? 'pending',
    parties: n.parties ?? [],
    terms: n.agreedTerms ?? n.initialTerms,
    createdAt: n.createdAt ?? n.updatedAt ?? new Date().toISOString(),
    updatedAt: n.updatedAt ?? n.createdAt ?? new Date().toISOString(),
  }))
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
