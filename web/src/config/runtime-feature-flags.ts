import { resolveRuntimeMode } from '@/config/runtime-environment.ts'

const mode = resolveRuntimeMode()

export const runtimeFeatureFlags = {
  runtimeMode: mode,
  showEnvironmentBanner: mode !== 'production',
  usesNamespacedLocalStorage: mode === 'demo' || mode === 'uat',
  storageTypeLabel: mode === 'production' ? 'Future API' : 'LocalStorage',
} as const

