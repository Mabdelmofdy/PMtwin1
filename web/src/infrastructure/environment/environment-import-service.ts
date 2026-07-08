import { validateCollaborationTaxonomy } from '@pm-twin/collaboration-models'
import { environmentContext, type EnvironmentContext } from '@/infrastructure/environment/environment-context.ts'
import {
  type EnvironmentBootstrapMetadata,
  SEED_VERSION,
} from '@/infrastructure/environment/environment-bootstrap-service.ts'
import {
  ENVIRONMENT_EXPORT_COLLECTION_KEYS,
  EXPORT_SCHEMA_VERSION,
  EXPORT_TYPE,
  type EnvironmentExportPayload,
} from '@/infrastructure/environment/environment-export-service.ts'
import { ACTIVE_SCENARIO_KEY } from '@/infrastructure/environment/environment-scenario-restore-service.ts'
import { buildEnvironmentSnapshotOverrides } from '@/infrastructure/environment/environment-snapshot-overrides.ts'
import { notifyDataStore } from '@/hooks/use-data-store.ts'
import { auditRepository } from '@/repositories/index.ts'
import type { MatchType } from '@/types/enums.ts'
import {
  NEGOTIATION_MESSAGES_STORAGE_KEY,
  NEGOTIATION_OFFERS_STORAGE_KEY,
  NEGOTIATION_TRANSCRIPT_STORAGE_KEY,
} from '@/types/negotiation-discussion.ts'
import { OVERRIDES_KEY, type Overrides } from '@/types/storage.ts'

const BOOTSTRAP_METADATA_KEY = 'pmtwin_environment_bootstrap'
const MATCH_TYPES = new Set<MatchType>([
  'one_way',
  'two_way',
  'consortium',
  'circular',
  'replacement',
])

export type EnvironmentImportErrorCode =
  | 'INVALID_JSON'
  | 'INVALID_EXPORT_TYPE'
  | 'INCOMPATIBLE_SCHEMA'
  | 'INVALID_METADATA'
  | 'MISSING_COLLECTIONS'
  | 'ENTITY_INTEGRITY'
  | 'TAXONOMY'
  | 'NOT_CONFIRMED'
  | 'BLOCKED_PRODUCTION'

export class EnvironmentImportError extends Error {
  readonly code: EnvironmentImportErrorCode

  constructor(code: EnvironmentImportErrorCode, message: string) {
    super(message)
    this.name = 'EnvironmentImportError'
    this.code = code
  }
}

type ImportableEntity = { readonly id: string }

type EnvironmentImportDeps = {
  readonly context: EnvironmentContext
  readonly importedAt: string
  readonly appendAudit: (entry: {
    action: string
    actorType: 'admin' | 'system'
    details: Record<string, unknown>
  }) => void
}

const defaultDeps: EnvironmentImportDeps = {
  context: environmentContext,
  importedAt: new Date().toISOString(),
  appendAudit: (entry) => {
    auditRepository.append(entry)
  },
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function parseEnvironmentImportJson(json: string): unknown {
  try {
    return JSON.parse(json) as unknown
  } catch {
    throw new EnvironmentImportError('INVALID_JSON', 'Import file is not valid JSON.')
  }
}

export function isCompatibleImportSchemaVersion(schemaVersion: string): boolean {
  return schemaVersion === EXPORT_SCHEMA_VERSION
}

function assertMetadataString(
  metadata: Record<string, unknown>,
  field: string,
): string {
  const value = metadata[field]
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new EnvironmentImportError(
      'INVALID_METADATA',
      `Import metadata is missing required field: ${field}.`,
    )
  }
  return value
}

function validateEntityCollection(
  collectionKey: string,
  value: unknown,
): asserts value is ImportableEntity[] {
  if (!Array.isArray(value)) {
    throw new EnvironmentImportError(
      'MISSING_COLLECTIONS',
      `Import is missing required collection: ${collectionKey}.`,
    )
  }

  const seenIds = new Set<string>()
  for (const [index, item] of value.entries()) {
    if (!isRecord(item)) {
      throw new EnvironmentImportError(
        'ENTITY_INTEGRITY',
        `Collection ${collectionKey} item at index ${index} must be an object.`,
      )
    }
    const id = item.id
    if (typeof id !== 'string' || id.trim().length === 0) {
      throw new EnvironmentImportError(
        'ENTITY_INTEGRITY',
        `Collection ${collectionKey} item at index ${index} is missing a valid id.`,
      )
    }
    if (seenIds.has(id)) {
      throw new EnvironmentImportError(
        'ENTITY_INTEGRITY',
        `Collection ${collectionKey} contains duplicate id: ${id}.`,
      )
    }
    seenIds.add(id)
  }
}

function validateTaxonomyIntegrity(payload: EnvironmentExportPayload): void {
  for (const opportunity of payload.opportunities) {
    if (!opportunity.subModelType || !opportunity.modelType) {
      throw new EnvironmentImportError(
        'TAXONOMY',
        `Opportunity ${opportunity.id} is missing collaboration taxonomy fields.`,
      )
    }

    const result = validateCollaborationTaxonomy({
      mainCollaborationModel: opportunity.mainCollaborationModel,
      modelType: opportunity.modelType,
      subModelType: opportunity.subModelType,
      exchangeMode: opportunity.exchangeMode ?? 'cash',
      acceptedExchangeModes:
        opportunity.acceptedExchangeModes ?? opportunity.paymentModes,
    })

    if (!result.valid) {
      throw new EnvironmentImportError(
        'TAXONOMY',
        `Opportunity ${opportunity.id} has invalid taxonomy: ${result.errors.join(', ')}.`,
      )
    }
  }

  for (const postMatch of payload.postMatches) {
    if (!MATCH_TYPES.has(postMatch.matchType as MatchType)) {
      throw new EnvironmentImportError(
        'TAXONOMY',
        `PostMatch ${postMatch.id} has invalid matchType: ${postMatch.matchType}.`,
      )
    }
  }
}

function validateEntityRelationships(payload: EnvironmentExportPayload): void {
  const userIds = new Set(payload.users.map((user) => user.id))
  const companyIds = new Set(payload.companies.map((company) => company.id))
  const participantIds = new Set([...userIds, ...companyIds])
  const opportunityIds = new Set(payload.opportunities.map((opportunity) => opportunity.id))
  const postMatchIds = new Set(payload.postMatches.map((postMatch) => postMatch.id))
  const negotiationIds = new Set(payload.negotiations.map((negotiation) => negotiation.id))

  for (const application of payload.applications) {
    if (!opportunityIds.has(application.opportunityId)) {
      throw new EnvironmentImportError(
        'ENTITY_INTEGRITY',
        `Application ${application.id} references unknown opportunityId: ${application.opportunityId}.`,
      )
    }
    if (!userIds.has(application.applicantId)) {
      throw new EnvironmentImportError(
        'ENTITY_INTEGRITY',
        `Application ${application.id} references unknown applicantId: ${application.applicantId}.`,
      )
    }
  }

  for (const negotiation of payload.negotiations) {
    const postMatchId = negotiation.postMatchId ?? negotiation.matchId
    if (postMatchId && !postMatchIds.has(postMatchId)) {
      throw new EnvironmentImportError(
        'ENTITY_INTEGRITY',
        `Negotiation ${negotiation.id} references unknown postMatchId: ${postMatchId}.`,
      )
    }
  }

  for (const message of payload.negotiationMessages) {
    if (!negotiationIds.has(message.negotiationId)) {
      throw new EnvironmentImportError(
        'ENTITY_INTEGRITY',
        `Negotiation message ${message.id} references unknown negotiationId: ${message.negotiationId}.`,
      )
    }
    if (!participantIds.has(message.senderId)) {
      throw new EnvironmentImportError(
        'ENTITY_INTEGRITY',
        `Negotiation message ${message.id} references unknown senderId: ${message.senderId}.`,
      )
    }
  }

  for (const offer of payload.negotiationOffers) {
    if (!negotiationIds.has(offer.negotiationId)) {
      throw new EnvironmentImportError(
        'ENTITY_INTEGRITY',
        `Negotiation offer ${offer.id} references unknown negotiationId: ${offer.negotiationId}.`,
      )
    }
  }

  for (const event of payload.negotiationTranscriptEvents) {
    if (!negotiationIds.has(event.negotiationId)) {
      throw new EnvironmentImportError(
        'ENTITY_INTEGRITY',
        `Negotiation transcript event ${event.id} references unknown negotiationId: ${event.negotiationId}.`,
      )
    }
  }

  for (const notification of payload.notifications) {
    if (!participantIds.has(notification.userId)) {
      throw new EnvironmentImportError(
        'ENTITY_INTEGRITY',
        `Notification ${notification.id} references unknown userId: ${notification.userId}.`,
      )
    }
  }
}

export function validateEnvironmentImportPayload(raw: unknown): EnvironmentExportPayload {
  if (!isRecord(raw)) {
    throw new EnvironmentImportError('INVALID_JSON', 'Import payload must be a JSON object.')
  }

  if (!isRecord(raw.metadata)) {
    throw new EnvironmentImportError('INVALID_METADATA', 'Import payload is missing metadata.')
  }

  const exportType = raw.metadata.exportType
  if (exportType !== EXPORT_TYPE) {
    throw new EnvironmentImportError(
      'INVALID_EXPORT_TYPE',
      `Import exportType must be ${EXPORT_TYPE}.`,
    )
  }

  const schemaVersion = assertMetadataString(raw.metadata, 'schemaVersion')
  if (!isCompatibleImportSchemaVersion(schemaVersion)) {
    throw new EnvironmentImportError(
      'INCOMPATIBLE_SCHEMA',
      `Import schemaVersion ${schemaVersion} is not compatible with ${EXPORT_SCHEMA_VERSION}.`,
    )
  }

  assertMetadataString(raw.metadata, 'applicationVersion')
  assertMetadataString(raw.metadata, 'seedVersion')
  assertMetadataString(raw.metadata, 'runtimeMode')
  assertMetadataString(raw.metadata, 'exportedBy')
  assertMetadataString(raw.metadata, 'exportedAt')

  for (const collectionKey of ENVIRONMENT_EXPORT_COLLECTION_KEYS) {
    validateEntityCollection(collectionKey, raw[collectionKey])
  }

  const payload = raw as EnvironmentExportPayload
  validateEntityRelationships(payload)
  validateTaxonomyIntegrity(payload)
  return payload
}

function writeBootstrapMetadata(
  storage: EnvironmentContext['storageAdapter'],
  metadata: EnvironmentExportPayload['metadata'],
  runtimeMode: EnvironmentContext['runtimeMode'],
  importedAt: string,
): EnvironmentBootstrapMetadata {
  const bootstrap: EnvironmentBootstrapMetadata = {
    bootstrappedAt: importedAt,
    seedVersion: metadata.seedVersion || SEED_VERSION,
    mode: runtimeMode,
    appVersion: metadata.applicationVersion,
  }
  storage.set(BOOTSTRAP_METADATA_KEY, bootstrap)
  return bootstrap
}

function restoreImportedCollections(
  context: EnvironmentContext,
  payload: EnvironmentExportPayload,
  importedAt: string,
): EnvironmentBootstrapMetadata {
  context.storageAdapter.clear()
  const bootstrap = writeBootstrapMetadata(
    context.storageAdapter,
    payload.metadata,
    context.runtimeMode,
    importedAt,
  )

  context.storageAdapter.set(OVERRIDES_KEY, buildEnvironmentSnapshotOverrides(payload))
  context.storageAdapter.set(
    NEGOTIATION_MESSAGES_STORAGE_KEY,
    payload.negotiationMessages,
  )
  context.storageAdapter.set(NEGOTIATION_OFFERS_STORAGE_KEY, payload.negotiationOffers)
  context.storageAdapter.set(
    NEGOTIATION_TRANSCRIPT_STORAGE_KEY,
    payload.negotiationTranscriptEvents,
  )
  context.storageAdapter.remove(ACTIVE_SCENARIO_KEY)

  return bootstrap
}

export type EnvironmentImportResult = {
  payload: EnvironmentExportPayload
  bootstrap: EnvironmentBootstrapMetadata
}

export function importEnvironmentData(
  json: string,
  options: { confirmed: boolean; importedBy: string },
  deps: EnvironmentImportDeps = defaultDeps,
): EnvironmentImportResult {
  const payload = validateEnvironmentImportPayload(parseEnvironmentImportJson(json))

  if (!deps.context.canImportEnvironment) {
    throw new EnvironmentImportError(
      'BLOCKED_PRODUCTION',
      'Environment import is only available in Demo/UAT runtime modes.',
    )
  }

  if (!options.confirmed) {
    throw new EnvironmentImportError(
      'NOT_CONFIRMED',
      'Import overwrite must be confirmed before restoring environment data.',
    )
  }

  const bootstrap = restoreImportedCollections(deps.context, payload, deps.importedAt)

  deps.appendAudit({
    action: 'environment.imported',
    actorType: 'admin',
    details: {
      importedBy: options.importedBy,
      runtimeMode: deps.context.runtimeMode,
      namespace: deps.context.namespace,
      seedVersion: bootstrap.seedVersion,
      schemaVersion: payload.metadata.schemaVersion,
      exportedAt: payload.metadata.exportedAt,
      exportedBy: payload.metadata.exportedBy,
    },
  })

  notifyDataStore()
  return { payload, bootstrap }
}

export function readImportedEnvironmentCollections(
  storage: EnvironmentContext['storageAdapter'],
): Pick<
  EnvironmentExportPayload,
  | 'negotiationMessages'
  | 'negotiationOffers'
  | 'negotiationTranscriptEvents'
> & {
  overrides: Overrides | null
} {
  return {
    overrides: storage.get<Overrides>(OVERRIDES_KEY),
    negotiationMessages: storage.get(NEGOTIATION_MESSAGES_STORAGE_KEY) ?? [],
    negotiationOffers: storage.get(NEGOTIATION_OFFERS_STORAGE_KEY) ?? [],
    negotiationTranscriptEvents: storage.get(NEGOTIATION_TRANSCRIPT_STORAGE_KEY) ?? [],
  }
}
