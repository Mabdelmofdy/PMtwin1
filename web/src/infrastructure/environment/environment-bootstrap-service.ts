import type { RuntimeMode } from '@/config/runtime-environment.ts'
import type { IStorageAdapter } from '@/types/storage.ts'

export const SEED_VERSION = '1.0.0'
export const BOOTSTRAP_METADATA_KEY = 'pmtwin_environment_bootstrap'

export type EnvironmentBootstrapMetadata = {
  bootstrappedAt: string
  seedVersion: string
  mode: RuntimeMode
  appVersion: string
}

export type EnvironmentBootstrapResult = {
  didBootstrap: boolean
  metadata: EnvironmentBootstrapMetadata
}

function resolveAppVersion(): string {
  const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env
  return env?.VITE_APP_VERSION?.trim() || 'dev'
}

export function ensureEnvironmentBootstrap(
  storage: IStorageAdapter,
  mode: RuntimeMode,
): EnvironmentBootstrapResult {
  const existing = storage.get<EnvironmentBootstrapMetadata>(BOOTSTRAP_METADATA_KEY)
  if (existing) {
    return {
      didBootstrap: false,
      metadata: existing,
    }
  }

  const metadata: EnvironmentBootstrapMetadata = {
    bootstrappedAt: new Date().toISOString(),
    seedVersion: SEED_VERSION,
    mode,
    appVersion: resolveAppVersion(),
  }
  storage.set(BOOTSTRAP_METADATA_KEY, metadata)
  return {
    didBootstrap: true,
    metadata,
  }
}

export function readEnvironmentBootstrapMetadata(
  storage: IStorageAdapter,
): EnvironmentBootstrapMetadata | null {
  return storage.get<EnvironmentBootstrapMetadata>(BOOTSTRAP_METADATA_KEY)
}

