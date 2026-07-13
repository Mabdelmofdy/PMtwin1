import type {
  Application,
  AppNotification,
  AuditEntry,
  Company,
  CommercialAgreement,
  Contract,
  Negotiation,
  Opportunity,
  PendingUser,
  PlatformUser,
  PostMatch,
  SiteContentPage,
} from '@/types/domain.ts'
import type {
  NegotiationMessage,
  NegotiationOffer,
  NegotiationTranscriptEvent,
} from '@/types/negotiation-discussion.ts'
import type { PartyDocument } from '@/types/party-document.ts'
import { normalizeOpportunities } from '@/domain/collaboration/opportunity-collaboration.ts'
import {
  normalizeApplications,
  normalizeCommercialAgreements,
  normalizeContracts,
  normalizeNegotiations,
} from '@/domain/normalizers.ts'

import opportunitiesBase from '@seed-data/opportunities.json'
import demoOpportunities from '@seed-data/demo-40-opportunities.json'
import postMatches from '@seed-data/demo-post-matches.json'
import demoNotifications from '@seed-data/demo-notifications.json'
import demoApplications from '@seed-data/demo-applications.json'
import demoNegotiations from '@seed-data/demo-negotiations.json'
import demoPendingUsers from '@seed-data/demo-pending-users.json'
import demoAudit from '@seed-data/demo-audit.json'
import seedUsers from '@seed-data/seed-controlled-users.json'
import demoEmployees from '@seed-data/demo-employees.json'
import demoCompanies from '@seed-data/demo-companies.json'
import demoPartyDocuments from '@seed-data/demo-party-documents.json'
import usersBase from '@seed-data/users.json'
import companiesBase from '@seed-data/companies.json'
import siteContent from '@seed-data/site-content.json'
import demoDeals from '@seed-data/demo-deals.json'
import demoContracts from '@seed-data/demo-contracts.json'
import demoNegotiationMessages from '@seed-data/demo-negotiation-messages.json'
import demoNegotiationOffers from '@seed-data/demo-negotiation-offers.json'
import demoNegotiationTranscriptEvents from '@seed-data/demo-negotiation-transcript-events.json'

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
  return normalizeOpportunities(
    mergeById(
      rows(opportunitiesBase as DataEnvelope<Opportunity>),
      rows(demoOpportunities as DataEnvelope<Opportunity>),
    ),
  )
}

export function loadUsers(): PlatformUser[] {
  return mergeById(
    rows(usersBase as DataEnvelope<PlatformUser>),
    rows(seedUsers as DataEnvelope<PlatformUser>),
    rows(demoEmployees as DataEnvelope<PlatformUser>),
  )
}

export function loadPartyDocuments(): PartyDocument[] {
  return rows(demoPartyDocuments as DataEnvelope<PartyDocument>)
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

export function loadCommercialAgreements(): CommercialAgreement[] {
  return normalizeCommercialAgreements(
    rows(demoDeals as DataEnvelope<CommercialAgreement>),
  )
}
/** @deprecated Use loadCommercialAgreements */
export const loadDeals = loadCommercialAgreements

export function loadContracts(): Contract[] {
  return normalizeContracts(rows(demoContracts as unknown as DataEnvelope<Contract>))
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

export function loadNegotiationMessages(): NegotiationMessage[] {
  return rows(demoNegotiationMessages as DataEnvelope<NegotiationMessage>)
}

export function loadNegotiationOffers(): NegotiationOffer[] {
  return rows(demoNegotiationOffers as DataEnvelope<NegotiationOffer>)
}

export function loadNegotiationTranscriptEvents(): NegotiationTranscriptEvent[] {
  return rows(
    demoNegotiationTranscriptEvents as DataEnvelope<NegotiationTranscriptEvent>,
  )
}
