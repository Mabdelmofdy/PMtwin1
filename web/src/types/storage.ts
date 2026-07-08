import type {
  Application,
  Company,
  Opportunity,
  AuditEntry,
  PostMatch,
  Negotiation,
  PlatformUser,
  ProductLanguageSettings,
} from './domain.ts'
import type { Party, PartyMembership } from '@pm-twin/party'

export interface IStorageAdapter {
  get<T>(key: string): T | null
  set<T>(key: string, value: T): void
  remove(key: string): void
  clear(): void
}

export type Overrides = {
  applications?: Record<string, Partial<Application>>
  users?: Record<string, Partial<PlatformUser>>
  newUsers?: PlatformUser[]
  deletedUsers?: string[]
  companies?: Record<string, Partial<Company>>
  newCompanies?: Company[]
  deletedCompanies?: string[]
  opportunities?: Record<string, Partial<Opportunity>>
  newOpportunities?: Opportunity[]
  deletedOpportunities?: string[]
  newApplications?: Application[]
  deletedApplications?: string[]
  notifications?: Record<string, Partial<{ read: boolean }>>
  newNotifications?: Array<{ id: string } & Record<string, unknown>>
  deletedNotifications?: string[]
  deals?: Record<string, Record<string, unknown>>
  newDeals?: Array<{ id: string } & Record<string, unknown>>
  commercialAgreements?: Record<string, Record<string, unknown>>
  newCommercialAgreements?: Array<{ id: string } & Record<string, unknown>>
  deletedCommercialAgreements?: string[]
  negotiations?: Record<string, Record<string, unknown>>
  newNegotiations?: Negotiation[]
  deletedNegotiations?: string[]
  postMatches?: Record<string, Partial<PostMatch>>
  newPostMatches?: PostMatch[]
  deletedPostMatches?: string[]
  contracts?: Record<string, Record<string, unknown>>
  newContracts?: Array<{ id: string } & Record<string, unknown>>
  deletedContracts?: string[]
  auditSnapshot?: AuditEntry[]
  newAuditEntries?: AuditEntry[]
  productLanguageSettings?: Record<string, ProductLanguageSettings>
  parties?: Record<string, Partial<Party>>
  newParties?: Party[]
  deletedParties?: string[]
  partyMemberships?: Record<string, Partial<PartyMembership>>
  newPartyMemberships?: PartyMembership[]
  deletedPartyMemberships?: string[]
}

export const OVERRIDES_KEY = 'pmtwin_web_overrides'
