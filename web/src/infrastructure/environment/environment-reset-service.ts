import { environmentContext, type EnvironmentContext } from '@/infrastructure/environment/environment-context.ts'
import {
  BOOTSTRAP_METADATA_KEY,
  ensureEnvironmentBootstrap,
  type EnvironmentBootstrapMetadata,
} from '@/infrastructure/environment/environment-bootstrap-service.ts'
import { ACTIVE_SCENARIO_KEY } from '@/infrastructure/environment/environment-scenario-restore-service.ts'
import { notifyDataStore } from '@/hooks/use-data-store.ts'
import { auditRepository } from '@/repositories/index.ts'
import {
  NEGOTIATION_MESSAGES_STORAGE_KEY,
  NEGOTIATION_OFFERS_STORAGE_KEY,
  NEGOTIATION_TRANSCRIPT_STORAGE_KEY,
} from '@/types/negotiation-discussion.ts'
import { OVERRIDES_KEY } from '@/types/storage.ts'

export type EnvironmentResetErrorCode = 'BLOCKED_PRODUCTION'

export class EnvironmentResetError extends Error {
  readonly code: EnvironmentResetErrorCode

  constructor(code: EnvironmentResetErrorCode, message: string) {
    super(message)
    this.name = 'EnvironmentResetError'
    this.code = code
  }
}

type EnvironmentResetDeps = {
  readonly context: EnvironmentContext
  readonly appendAudit: (entry: {
    action: string
    actorType: 'admin' | 'system'
    details: Record<string, unknown>
  }) => void
}

const defaultDeps: EnvironmentResetDeps = {
  context: environmentContext,
  appendAudit: (entry) => {
    auditRepository.append(entry)
  },
}

export const ENVIRONMENT_RESET_STORAGE_KEYS = [
  OVERRIDES_KEY,
  BOOTSTRAP_METADATA_KEY,
  ACTIVE_SCENARIO_KEY,
  NEGOTIATION_MESSAGES_STORAGE_KEY,
  NEGOTIATION_OFFERS_STORAGE_KEY,
  NEGOTIATION_TRANSCRIPT_STORAGE_KEY,
] as const

export function resetEnvironment(
  deps: EnvironmentResetDeps = defaultDeps,
): EnvironmentBootstrapMetadata {
  const { context } = deps

  if (!context.canResetEnvironment) {
    throw new EnvironmentResetError(
      'BLOCKED_PRODUCTION',
      'Environment reset is only available in Demo/UAT runtime modes.',
    )
  }

  context.storageAdapter.clear()
  const bootstrap = ensureEnvironmentBootstrap(context.storageAdapter, context.runtimeMode).metadata

  deps.appendAudit({
    action: 'environment.reset',
    actorType: 'admin',
    details: {
      runtimeMode: context.runtimeMode,
      namespace: context.namespace,
      seedVersion: bootstrap.seedVersion,
    },
  })

  notifyDataStore()
  return bootstrap
}

export function hasEnvironmentResetStorage(
  storage: EnvironmentContext['storageAdapter'],
): boolean {
  return ENVIRONMENT_RESET_STORAGE_KEYS.some((key) => storage.get(key) !== null)
}
