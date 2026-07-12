import { resolveRuntimeMode } from '@/config/runtime-environment.ts'

const mode = resolveRuntimeMode()

export const runtimeFeatureFlags = {
  runtimeMode: mode,
  /** Global customer banner is never shown; admin panel owns environment metadata. */
  showEnvironmentBanner: false,
  usesNamespacedLocalStorage: mode === 'demo' || mode === 'uat',
  storageTypeLabel: mode === 'production' ? 'Future API' : 'LocalStorage',
} as const

