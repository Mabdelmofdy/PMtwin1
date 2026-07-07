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

export interface IStorageAdapter {
  get<T>(key: string): T | null
  set<T>(key: string, value: T): void
  remove(key: string): void
  clear(): void
}

export type Overrides = {
  applications?: Record<string, Partial<Application>>
  users?: Record<string, Partial<PlatformUser>>
  companies?: Record<string, Partial<Company>>
  opportunities?: Record<string, Partial<Opportunity>>
  newOpportunities?: Opportunity[]
  newApplications?: Application[]
  notifications?: Record<string, Partial<{ read: boolean }>>
  newNotifications?: Array<{ id: string } & Record<string, unknown>>
  deletedNotifications?: string[]
  deals?: Record<string, Record<string, unknown>>
  newDeals?: Array<{ id: string } & Record<string, unknown>>
  commercialAgreements?: Record<string, Record<string, unknown>>
  newCommercialAgreements?: Array<{ id: string } & Record<string, unknown>>
  negotiations?: Record<string, Record<string, unknown>>
  newNegotiations?: Negotiation[]
  postMatches?: Record<string, Partial<PostMatch>>
  newPostMatches?: PostMatch[]
  contracts?: Record<string, Record<string, unknown>>
  newContracts?: Array<{ id: string } & Record<string, unknown>>
  newAuditEntries?: AuditEntry[]
  productLanguageSettings?: Record<string, ProductLanguageSettings>
}

export const OVERRIDES_KEY = 'pmtwin_web_overrides'
