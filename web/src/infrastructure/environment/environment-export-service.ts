import type {
  Application,
  AppNotification,
  AuditEntry,
  CommercialAgreement,
  Company,
  Contract,
  Negotiation,
  Opportunity,
  PlatformUser,
  PostMatch,
} from '@/types/domain.ts'
import type {
  NegotiationMessage,
  NegotiationOffer,
  NegotiationTranscriptEvent,
} from '@/types/negotiation-discussion.ts'
import {
  NEGOTIATION_MESSAGES_STORAGE_KEY,
  NEGOTIATION_OFFERS_STORAGE_KEY,
  NEGOTIATION_TRANSCRIPT_STORAGE_KEY,
} from '@/types/negotiation-discussion.ts'
import { environmentContext, type EnvironmentContext } from '@/infrastructure/environment/environment-context.ts'
import {
  readEnvironmentBootstrapMetadata,
  SEED_VERSION,
} from '@/infrastructure/environment/environment-bootstrap-service.ts'
import {
  loadNegotiationMessages,
  loadNegotiationOffers,
  loadNegotiationTranscriptEvents,
} from '@/infrastructure/seed/seed-loader.ts'
import {
  applicationRepository,
  auditRepository,
  commercialAgreementRepository,
  companyRepository,
  contractRepository,
  negotiationRepository,
  notificationRepository,
  opportunityRepository,
  postMatchRepository,
  userRepository,
  adminSettingsRepository,
  productLanguageSettingsRepository,
} from '@/repositories/index.ts'

export const EXPORT_SCHEMA_VERSION = '1.0'
export const EXPORT_TYPE = 'pmtwin-environment-export'

export type EnvironmentExportMetadata = {
  exportType: typeof EXPORT_TYPE
  schemaVersion: string
  applicationVersion: string
  seedVersion: string
  runtimeMode: string
  exportedBy: string
  exportedAt: string
}

export type EnvironmentExportPayload = {
  metadata: EnvironmentExportMetadata
  users: PlatformUser[]
  companies: Company[]
  opportunities: Opportunity[]
  postMatches: PostMatch[]
  negotiations: Negotiation[]
  negotiationMessages: NegotiationMessage[]
  negotiationOffers: NegotiationOffer[]
  negotiationTranscriptEvents: NegotiationTranscriptEvent[]
  commercialAgreements: CommercialAgreement[]
  contracts: Contract[]
  applications: Application[]
  audit: AuditEntry[]
  notifications: AppNotification[]
  /** Optional — Admin Settings document (schema 1.0 compatible extension). */
  adminSettings?: import('@/domain/admin/settings/types.ts').AdminSettingsDocument
  /** Optional — product language overrides map. */
  productLanguageSettings?: Record<
    string,
    import('@/types/domain.ts').ProductLanguageSettings
  >
}

export const ENVIRONMENT_EXPORT_COLLECTION_KEYS = [
  'users',
  'companies',
  'opportunities',
  'postMatches',
  'negotiations',
  'negotiationMessages',
  'negotiationOffers',
  'negotiationTranscriptEvents',
  'commercialAgreements',
  'contracts',
  'applications',
  'audit',
  'notifications',
] as const satisfies ReadonlyArray<keyof Omit<EnvironmentExportPayload, 'metadata'>>

type EnvironmentExportDeps = {
  readonly context: EnvironmentContext
  readonly exportedBy: string
  readonly exportedAt: string
  readonly readUsers: () => PlatformUser[]
  readonly readCompanies: () => Company[]
  readonly readOpportunities: () => Opportunity[]
  readonly readPostMatches: () => PostMatch[]
  readonly readNegotiations: () => Negotiation[]
  readonly readNegotiationMessages: () => NegotiationMessage[]
  readonly readNegotiationOffers: () => NegotiationOffer[]
  readonly readNegotiationTranscriptEvents: () => NegotiationTranscriptEvent[]
  readonly readCommercialAgreements: () => CommercialAgreement[]
  readonly readContracts: () => Contract[]
  readonly readApplications: () => Application[]
  readonly readAudit: () => AuditEntry[]
  readonly readNotifications: () => AppNotification[]
  readonly readAdminSettings: () => import('@/domain/admin/settings/types.ts').AdminSettingsDocument
  readonly readProductLanguageSettings: () => Record<
    string,
    import('@/types/domain.ts').ProductLanguageSettings
  >
}

function resolveApplicationVersion(): string {
  const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env
  return env?.VITE_APP_VERSION?.trim() || 'dev'
}

function readNegotiationCollection<T>(
  storage: EnvironmentContext['storageAdapter'],
  key: string,
  loadSeed: () => T[],
): T[] {
  const stored = storage.get<T[]>(key)
  return stored ?? loadSeed()
}

function createDefaultDeps(exportedBy: string): EnvironmentExportDeps {
  const { storageAdapter } = environmentContext
  return {
    context: environmentContext,
    exportedBy,
    exportedAt: new Date().toISOString(),
    readUsers: () => userRepository.getAll(),
    readCompanies: () => companyRepository.getAll(),
    readOpportunities: () => opportunityRepository.getAll(),
    readPostMatches: () => postMatchRepository.getAll(),
    readNegotiations: () => negotiationRepository.getAll(),
    readNegotiationMessages: () =>
      readNegotiationCollection(
        storageAdapter,
        NEGOTIATION_MESSAGES_STORAGE_KEY,
        loadNegotiationMessages,
      ),
    readNegotiationOffers: () =>
      readNegotiationCollection(
        storageAdapter,
        NEGOTIATION_OFFERS_STORAGE_KEY,
        loadNegotiationOffers,
      ),
    readNegotiationTranscriptEvents: () =>
      readNegotiationCollection(
        storageAdapter,
        NEGOTIATION_TRANSCRIPT_STORAGE_KEY,
        loadNegotiationTranscriptEvents,
      ),
    readCommercialAgreements: () => commercialAgreementRepository.getAll(),
    readContracts: () => contractRepository.getAll(),
    readApplications: () => applicationRepository.getAll(),
    readAudit: () => auditRepository.getAll(),
    readNotifications: () => notificationRepository.getAll(),
    readAdminSettings: () => adminSettingsRepository.get(),
    readProductLanguageSettings: () => {
      const map: Record<string, import('@/types/domain.ts').ProductLanguageSettings> = {}
      for (const entry of productLanguageSettingsRepository.getAll()) {
        map[`${entry.tenantId}:${entry.locale}`] = entry
      }
      return map
    },
  }
}

export function buildEnvironmentExportPayload(
  exportedBy: string,
  deps?: Partial<EnvironmentExportDeps>,
): EnvironmentExportPayload {
  const resolvedDeps = {
    ...createDefaultDeps(exportedBy),
    ...deps,
  }
  const { context } = resolvedDeps

  if (!context.canExportEnvironment) {
    throw new Error('Environment export is only available in Demo/UAT runtime modes.')
  }

  const bootstrap = readEnvironmentBootstrapMetadata(context.storageAdapter)

  return {
    metadata: {
      exportType: EXPORT_TYPE,
      schemaVersion: EXPORT_SCHEMA_VERSION,
      applicationVersion: bootstrap?.appVersion ?? resolveApplicationVersion(),
      seedVersion: bootstrap?.seedVersion ?? SEED_VERSION,
      runtimeMode: context.runtimeMode,
      exportedBy: resolvedDeps.exportedBy,
      exportedAt: resolvedDeps.exportedAt,
    },
    users: resolvedDeps.readUsers(),
    companies: resolvedDeps.readCompanies(),
    opportunities: resolvedDeps.readOpportunities(),
    postMatches: resolvedDeps.readPostMatches(),
    negotiations: resolvedDeps.readNegotiations(),
    negotiationMessages: resolvedDeps.readNegotiationMessages(),
    negotiationOffers: resolvedDeps.readNegotiationOffers(),
    negotiationTranscriptEvents: resolvedDeps.readNegotiationTranscriptEvents(),
    commercialAgreements: resolvedDeps.readCommercialAgreements(),
    contracts: resolvedDeps.readContracts(),
    applications: resolvedDeps.readApplications(),
    audit: resolvedDeps.readAudit(),
    notifications: resolvedDeps.readNotifications(),
    adminSettings: resolvedDeps.readAdminSettings(),
    productLanguageSettings: resolvedDeps.readProductLanguageSettings(),
  }
}

export function serializeEnvironmentExportPayload(payload: EnvironmentExportPayload): string {
  return JSON.stringify(payload, null, 2)
}

export function exportEnvironmentData(exportedBy: string): EnvironmentExportPayload {
  return buildEnvironmentExportPayload(exportedBy)
}
