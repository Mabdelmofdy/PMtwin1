import { resolveRuntimeMode, type RuntimeMode } from '@/config/runtime-environment.ts'
import { localStorageAdapter } from '@/infrastructure/storage/local-storage-adapter.ts'
import {
  getLocalStorageNamespacePrefix,
  NamespacedStorageAdapter,
} from '@/infrastructure/storage/namespaced-storage-adapter.ts'
import type { IStorageAdapter } from '@/types/storage.ts'

export type RuntimeStorageType = 'LocalStorage' | 'Future API'

export type EnvironmentContext = {
  runtimeMode: RuntimeMode
  storageType: RuntimeStorageType
  namespace: string | null
  storageAdapter: IStorageAdapter
  canRestoreScenario: boolean
  canExportEnvironment: boolean
  canImportEnvironment: boolean
  canResetEnvironment: boolean
}

function resolveEnvironmentContext(): EnvironmentContext {
  const runtimeMode = resolveRuntimeMode()
  const namespace = getLocalStorageNamespacePrefix(runtimeMode)
  const storageAdapter = namespace
    ? new NamespacedStorageAdapter(localStorageAdapter, namespace)
    : localStorageAdapter

  return {
    runtimeMode,
    storageType: namespace ? 'LocalStorage' : 'Future API',
    namespace,
    storageAdapter,
    canRestoreScenario: runtimeMode === 'demo' || runtimeMode === 'uat',
    canExportEnvironment: runtimeMode === 'demo' || runtimeMode === 'uat',
    canImportEnvironment: runtimeMode === 'demo' || runtimeMode === 'uat',
    canResetEnvironment: runtimeMode === 'demo' || runtimeMode === 'uat',
  }
}

export const environmentContext = resolveEnvironmentContext()

