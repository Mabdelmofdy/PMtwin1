import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { EnvironmentContext } from '@/infrastructure/environment/environment-context.ts'
import { ensureEnvironmentBootstrap } from '@/infrastructure/environment/environment-bootstrap-service.ts'
import {
  buildEnvironmentExportPayload,
  ENVIRONMENT_EXPORT_COLLECTION_KEYS,
  type EnvironmentExportPayload,
} from '@/infrastructure/environment/environment-export-service.ts'
import { importEnvironmentData } from '@/infrastructure/environment/environment-import-service.ts'
import {
  loadApplications,
  loadAuditLog,
  loadCommercialAgreements,
  loadCompanies,
  loadContracts,
  loadNegotiations,
  loadNegotiationMessages,
  loadNegotiationOffers,
  loadNegotiationTranscriptEvents,
  loadNotifications,
  loadOpportunities,
  loadPostMatches,
  loadUsers,
} from '@/infrastructure/seed/seed-loader.ts'
import { ApplicationRepository } from '@/repositories/application-repository.ts'
import { AuditRepository } from '@/repositories/audit-repository.ts'
import { CommercialAgreementRepository } from '@/repositories/commercial-agreement-repository.ts'
import { CompanyRepository } from '@/repositories/company-repository.ts'
import { ContractRepository } from '@/repositories/contract-repository.ts'
import { NegotiationRepository } from '@/repositories/negotiation-repository.ts'
import { NotificationRepository } from '@/repositories/notification-repository.ts'
import { OpportunityRepository } from '@/repositories/opportunity-repository.ts'
import { PostMatchRepository } from '@/repositories/post-match-repository.ts'
import { UserRepository } from '@/repositories/user-repository.ts'
import {
  NEGOTIATION_MESSAGES_STORAGE_KEY,
  NEGOTIATION_OFFERS_STORAGE_KEY,
  NEGOTIATION_TRANSCRIPT_STORAGE_KEY,
} from '@/types/negotiation-discussion.ts'
import type { IStorageAdapter } from '@/types/storage.ts'

import type { IStorageAdapter } from '@/types/storage.ts'

class PrefixedMemoryStorageAdapter implements IStorageAdapter {
  private readonly store = new Map<string, unknown>()

  constructor(private readonly prefix: string) {}

  private toKey(key: string): string {
    return `${this.prefix}${key}`
  }

  get<T>(key: string): T | null {
    return (this.store.get(this.toKey(key)) as T | undefined) ?? null
  }

  set<T>(key: string, value: T): void {
    this.store.set(this.toKey(key), structuredClone(value))
  }

  remove(key: string): void {
    this.store.delete(this.toKey(key))
  }

  clear(): void {
    for (const key of [...this.store.keys()]) {
      if (key.startsWith(this.prefix)) {
        this.store.delete(key)
      }
    }
  }
}

function createDemoContext(): EnvironmentContext {
  return {
    runtimeMode: 'demo',
    storageType: 'LocalStorage',
    namespace: 'PMTWIN_DEMO_',
    storageAdapter: new PrefixedMemoryStorageAdapter('PMTWIN_DEMO_'),
    canRestoreScenario: true,
    canExportEnvironment: true,
    canImportEnvironment: true,
    canResetEnvironment: true,
  }
}

function createRepositoryStack(storage: IStorageAdapter) {
  const readNegotiationCollection = <T,>(key: string, loadSeed: () => T[]): T[] => {
    return storage.get<T[]>(key) ?? loadSeed()
  }

  return {
    userRepository: new UserRepository(storage, loadUsers),
    companyRepository: new CompanyRepository(storage, loadCompanies),
    opportunityRepository: new OpportunityRepository(storage, loadOpportunities),
    postMatchRepository: new PostMatchRepository(storage, loadPostMatches),
    negotiationRepository: new NegotiationRepository(storage, loadNegotiations),
    commercialAgreementRepository: new CommercialAgreementRepository(storage, loadCommercialAgreements),
    contractRepository: new ContractRepository(storage, loadContracts),
    applicationRepository: new ApplicationRepository(storage, loadApplications),
    auditRepository: new AuditRepository(storage, loadAuditLog),
    notificationRepository: new NotificationRepository(storage, loadNotifications),
    readNegotiationMessages: () =>
      readNegotiationCollection(NEGOTIATION_MESSAGES_STORAGE_KEY, loadNegotiationMessages),
    readNegotiationOffers: () =>
      readNegotiationCollection(NEGOTIATION_OFFERS_STORAGE_KEY, loadNegotiationOffers),
    readNegotiationTranscriptEvents: () =>
      readNegotiationCollection(NEGOTIATION_TRANSCRIPT_STORAGE_KEY, loadNegotiationTranscriptEvents),
  }
}

function buildExportPayload(
  context: EnvironmentContext,
  repos: ReturnType<typeof createRepositoryStack>,
  exportedAt = '2026-07-07T12:00:00.000Z',
): EnvironmentExportPayload {
  return buildEnvironmentExportPayload('roundtrip@test', {
    context,
    exportedAt,
    readUsers: () => repos.userRepository.getAll(),
    readCompanies: () => repos.companyRepository.getAll(),
    readOpportunities: () => repos.opportunityRepository.getAll(),
    readPostMatches: () => repos.postMatchRepository.getAll(),
    readNegotiations: () => repos.negotiationRepository.getAll(),
    readNegotiationMessages: () => repos.readNegotiationMessages(),
    readNegotiationOffers: () => repos.readNegotiationOffers(),
    readNegotiationTranscriptEvents: () => repos.readNegotiationTranscriptEvents(),
    readCommercialAgreements: () => repos.commercialAgreementRepository.getAll(),
    readContracts: () => repos.contractRepository.getAll(),
    readApplications: () => repos.applicationRepository.getAll(),
    readAudit: () => repos.auditRepository.getAll(),
    readNotifications: () => repos.notificationRepository.getAll(),
  })
}

function normalizeForEquivalence<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function assertCollectionEquivalentById<T extends { id: string }>(
  label: string,
  before: readonly T[],
  after: readonly T[],
): void {
  assert.equal(after.length, before.length, `${label} count mismatch`)
  const beforeById = new Map(before.map((item) => [item.id, item]))
  for (const item of after) {
    assert.deepEqual(
      normalizeForEquivalence(item),
      normalizeForEquivalence(beforeById.get(item.id)),
      `${label} mismatch: ${item.id}`,
    )
  }
}

function assertCollectionsEquivalent(
  before: EnvironmentExportPayload,
  after: EnvironmentExportPayload,
): void {
  for (const key of ENVIRONMENT_EXPORT_COLLECTION_KEYS) {
    assertCollectionEquivalentById(key, before[key], after[key])
  }
}

function importPayload(
  context: EnvironmentContext,
  payload: EnvironmentExportPayload,
): void {
  importEnvironmentData(JSON.stringify(payload), {
    confirmed: true,
    importedBy: 'roundtrip@test',
  }, {
    context,
    importedAt: '2026-07-07T12:30:00.000Z',
    appendAudit: () => {},
  })
}

function syncPayloadIntegrity(payload: EnvironmentExportPayload): void {
  const userIds = new Set(payload.users.map((user) => user.id))
  const companyIds = new Set(payload.companies.map((company) => company.id))
  const participantIds = new Set([...userIds, ...companyIds])
  const opportunityIds = new Set(payload.opportunities.map((opportunity) => opportunity.id))
  const postMatchIds = new Set(payload.postMatches.map((postMatch) => postMatch.id))
  const negotiationIds = new Set(payload.negotiations.map((negotiation) => negotiation.id))

  payload.applications = payload.applications.filter(
    (application) =>
      userIds.has(application.applicantId) && opportunityIds.has(application.opportunityId),
  )
  payload.notifications = payload.notifications.filter((notification) =>
    participantIds.has(notification.userId),
  )
  payload.negotiationMessages = payload.negotiationMessages.filter(
    (message) =>
      negotiationIds.has(message.negotiationId) && participantIds.has(message.senderId),
  )
  payload.negotiationOffers = payload.negotiationOffers.filter((offer) =>
    negotiationIds.has(offer.negotiationId),
  )
  payload.negotiationTranscriptEvents = payload.negotiationTranscriptEvents.filter((event) =>
    negotiationIds.has(event.negotiationId),
  )
  payload.negotiations = payload.negotiations.filter((negotiation) => {
    const postMatchId = negotiation.postMatchId ?? negotiation.matchId
    return !postMatchId || postMatchIds.has(postMatchId)
  })
}

function buildSnapshotPayload(
  context: EnvironmentContext,
  repos: ReturnType<typeof createRepositoryStack>,
  mutate: (payload: EnvironmentExportPayload) => void,
): EnvironmentExportPayload {
  ensureEnvironmentBootstrap(context.storageAdapter, context.runtimeMode)
  const payload = buildExportPayload(context, repos)
  mutate(payload)
  syncPayloadIntegrity(payload)
  return payload
}

describe('environment import roundtrip', () => {
  it('users roundtrip import/export', () => {
    const context = createDemoContext()
    const repos = createRepositoryStack(context.storageAdapter)
    const seedUser = loadUsers()[0]!
    const removedUserId = loadUsers()[1]!.id

    const payload = buildSnapshotPayload(context, repos, (draft) => {
      draft.users = loadUsers()
        .filter((user) => user.id !== removedUserId)
        .map((user) =>
          user.id === seedUser.id ? { ...user, email: 'patched-user@test' } : user,
        )
      draft.users.push({
        id: 'import-user-1',
        email: 'imported-user@test',
        role: 'admin',
        status: 'active',
      })
    })

    importPayload(context, payload)

    const users = repos.userRepository.getAll()
    assert.equal(users.some((user) => user.id === removedUserId), false)
    assert.equal(users.find((user) => user.id === seedUser.id)?.email, 'patched-user@test')
    assert.equal(users.some((user) => user.id === 'import-user-1'), true)

    const reExported = buildExportPayload(context, repos)
    assert.deepEqual(reExported.users, payload.users)
  })

  it('companies roundtrip import/export', () => {
    const context = createDemoContext()
    const repos = createRepositoryStack(context.storageAdapter)
    const seedCompany = loadCompanies()[0]!
    const removedCompanyId = loadCompanies()[1]!.id

    const payload = buildSnapshotPayload(context, repos, (draft) => {
      draft.companies = loadCompanies()
        .filter((company) => company.id !== removedCompanyId)
        .map((company) =>
          company.id === seedCompany.id
            ? { ...company, email: 'patched-company@test' }
            : company,
        )
      draft.companies.push({
        id: 'import-company-1',
        email: 'imported-company@test',
        role: 'company_owner',
        status: 'active',
      })
    })

    importPayload(context, payload)

    const companies = repos.companyRepository.getAll()
    assert.equal(companies.some((company) => company.id === removedCompanyId), false)
    assert.equal(
      companies.find((company) => company.id === seedCompany.id)?.email,
      'patched-company@test',
    )
    assert.equal(companies.some((company) => company.id === 'import-company-1'), true)

    const reExported = buildExportPayload(context, repos)
    assert.deepEqual(reExported.companies, payload.companies)
  })

  it('import snapshot can remove seed opportunity/user/company', () => {
    const context = createDemoContext()
    const repos = createRepositoryStack(context.storageAdapter)
    const removedUserId = loadUsers()[0]!.id
    const removedCompanyId = loadCompanies()[0]!.id
    const removedOpportunityId = loadOpportunities()[0]!.id

    const payload = buildSnapshotPayload(context, repos, (draft) => {
      draft.users = draft.users.filter((user) => user.id !== removedUserId)
      draft.companies = draft.companies.filter((company) => company.id !== removedCompanyId)
      draft.opportunities = draft.opportunities.filter(
        (opportunity) => opportunity.id !== removedOpportunityId,
      )
    })

    importPayload(context, payload)

    assert.equal(repos.userRepository.getById(removedUserId), undefined)
    assert.equal(repos.companyRepository.getById(removedCompanyId), undefined)
    assert.equal(repos.opportunityRepository.getById(removedOpportunityId), undefined)
  })

  it('audit roundtrip does not duplicate seed audit', () => {
    const context = createDemoContext()
    const repos = createRepositoryStack(context.storageAdapter)
    const seedAuditCount = loadAuditLog().length

    const payload = buildSnapshotPayload(context, repos, (draft) => {
      draft.audit = [
        ...draft.audit,
        {
          id: 'import-audit-1',
          action: 'environment.test',
          timestamp: '2026-07-07T12:00:00.000Z',
        },
      ]
    })

    importPayload(context, payload)

    const audit = repos.auditRepository.getAll()
    assert.equal(audit.length, payload.audit.length)
    assert.equal(audit.filter((entry) => entry.id === 'import-audit-1').length, 1)
    assert.equal(
      audit.length,
      seedAuditCount + 1,
      'imported audit snapshot should replace seed merge semantics',
    )
  })

  it('export/import/export produces equivalent collection data', () => {
    const context = createDemoContext()
    const repos = createRepositoryStack(context.storageAdapter)

    const initialExport = buildSnapshotPayload(context, repos, () => {})
    importPayload(context, initialExport)

    assert.ok(repos.userRepository.getAll().length > 0, 'users should restore from import snapshot')

    const secondExport = buildExportPayload(context, repos, '2026-07-07T12:30:00.000Z')
    assertCollectionsEquivalent(initialExport, secondExport)
  })

  it('bootstrap still preserves seed fallback when not imported', () => {
    const context = createDemoContext()
    const repos = createRepositoryStack(context.storageAdapter)

    const bootstrap = ensureEnvironmentBootstrap(context.storageAdapter, 'demo')
    assert.equal(bootstrap.didBootstrap, true)

    const users = repos.userRepository.getAll()
    const seedUsers = loadUsers()
    assert.equal(users.length, seedUsers.length)
    assert.equal(users[0]?.id, seedUsers[0]?.id)

    const secondBootstrap = ensureEnvironmentBootstrap(context.storageAdapter, 'demo')
    assert.equal(secondBootstrap.didBootstrap, false)
  })
})
