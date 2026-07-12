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
import type { BusinessWorkspace, WorkspaceMembership } from '@pm-twin/identity'
import type { PartyDocument } from './party-document.ts'
import type { AdminSettingsDocument } from '@/domain/admin/settings/types.ts'

export interface IStorageAdapter {
  get<T>(key: string): T | null
  set<T>(key: string, value: T): void
  remove(key: string): void
  clear(): void
}

export type Overrides = {
  identitySchemaVersion?: number
  ownershipSchemaVersion?: number
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
  /** Demo/UAT Admin settings document (namespaced with overrides). */
  adminSettings?: AdminSettingsDocument
  parties?: Record<string, Partial<Party>>
  newParties?: Party[]
  deletedParties?: string[]
  partyMemberships?: Record<string, Partial<PartyMembership>>
  newPartyMemberships?: PartyMembership[]
  deletedPartyMemberships?: string[]
  workspaces?: Record<string, Partial<BusinessWorkspace>>
  newWorkspaces?: BusinessWorkspace[]
  deletedWorkspaces?: string[]
  workspaceMemberships?: Record<string, Partial<WorkspaceMembership>>
  newWorkspaceMemberships?: WorkspaceMembership[]
  deletedWorkspaceMemberships?: string[]
  partyDocuments?: Record<string, Partial<PartyDocument>>
  newPartyDocuments?: PartyDocument[]
  deletedPartyDocuments?: string[]
}

export const OVERRIDES_KEY = 'pmtwin_web_overrides'
