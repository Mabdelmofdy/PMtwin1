export const RUNTIME_MODES = ['demo', 'uat', 'production'] as const

export type RuntimeMode = (typeof RUNTIME_MODES)[number]

const DEFAULT_RUNTIME_MODE: RuntimeMode = 'demo'

function readViteEnv(name: string): string | undefined {
  const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env
  return env?.[name]
}

function normalizeRuntimeMode(value: string | undefined): RuntimeMode {
  if (!value) return DEFAULT_RUNTIME_MODE
  const normalized = value.trim().toLowerCase()
  return RUNTIME_MODES.includes(normalized as RuntimeMode)
    ? (normalized as RuntimeMode)
    : DEFAULT_RUNTIME_MODE
}

export function resolveRuntimeMode(
  envValue: string | undefined = readViteEnv('VITE_RUNTIME_MODE'),
): RuntimeMode {
  return normalizeRuntimeMode(envValue)
}

export const runtimeEnvironment = {
  mode: resolveRuntimeMode(),
}

