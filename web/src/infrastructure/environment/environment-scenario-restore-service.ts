import { environmentContext, type EnvironmentContext } from '@/infrastructure/environment/environment-context.ts'
import {
  ensureEnvironmentBootstrap,
  type EnvironmentBootstrapMetadata,
} from '@/infrastructure/environment/environment-bootstrap-service.ts'
import {
  getDemoScenarioRegistry,
  type DemoScenarioDefinition,
} from '@/infrastructure/environment/demo-scenario-registry.ts'
import { notifyDataStore } from '@/hooks/use-data-store.ts'
import { auditRepository } from '@/repositories/index.ts'
import { OVERRIDES_KEY, type Overrides } from '@/types/storage.ts'

export const ACTIVE_SCENARIO_KEY = 'pmtwin_environment_active_scenario'

type PatchableEntityType =
  | 'applications'
  | 'users'
  | 'companies'
  | 'opportunities'
  | 'postMatches'
  | 'negotiations'
  | 'commercialAgreements'
  | 'contracts'
  | 'notifications'

const PATCHABLE_OVERRIDES_KEYS: Record<PatchableEntityType, keyof Overrides> = {
  applications: 'applications',
  users: 'users',
  companies: 'companies',
  opportunities: 'opportunities',
  postMatches: 'postMatches',
  negotiations: 'negotiations',
  commercialAgreements: 'commercialAgreements',
  contracts: 'contracts',
  notifications: 'notifications',
}

export type ActiveScenarioState = {
  scenarioId: string
  restoredAt: string
  runtimeMode: EnvironmentContext['runtimeMode']
  seedSubsetRefs: DemoScenarioDefinition['seedSubsetRefs']
  entityPatchSet: DemoScenarioDefinition['entityPatchSet'] | null
}

type ScenarioRestoreDeps = {
  readonly context: EnvironmentContext
  readonly appendAudit: (entry: {
    action: string
    actorType: 'admin' | 'system'
    details: Record<string, unknown>
  }) => void
}

const defaultDeps: ScenarioRestoreDeps = {
  context: environmentContext,
  appendAudit: (entry) => {
    auditRepository.append(entry)
  },
}

function applyScenarioPatchSet(
  context: EnvironmentContext,
  scenario: DemoScenarioDefinition,
): void {
  if (!scenario.entityPatchSet || scenario.entityPatchSet.patches.length === 0) return

  const overrides = (context.storageAdapter.get<Overrides>(OVERRIDES_KEY) ?? {}) as Record<string, unknown>

  for (const patch of scenario.entityPatchSet.patches) {
    if (!(patch.entityType in PATCHABLE_OVERRIDES_KEYS)) continue
    const entityType = patch.entityType as PatchableEntityType
    const key = PATCHABLE_OVERRIDES_KEYS[entityType]
    const existing = (overrides[key] ?? {}) as Record<string, Record<string, unknown>>
    overrides[key] = {
      ...existing,
      [patch.id]: {
        ...(existing[patch.id] ?? {}),
        ...patch.patch,
      },
    }
  }

  context.storageAdapter.set(OVERRIDES_KEY, overrides as unknown as Overrides)
}

export function restoreDemoScenario(
  scenarioId: string,
  deps: ScenarioRestoreDeps = defaultDeps,
): {
  scenario: DemoScenarioDefinition
  bootstrap: EnvironmentBootstrapMetadata
  activeScenario: ActiveScenarioState
} {
  const { context } = deps
  if (!context.canRestoreScenario) {
    throw new Error('Scenario restore is only available in Demo/UAT runtime modes.')
  }

  const scenario = getDemoScenarioRegistry().find((item) => item.id === scenarioId)
  if (!scenario) {
    throw new Error(`Scenario not found: ${scenarioId}`)
  }

  context.storageAdapter.clear()
  const bootstrap = ensureEnvironmentBootstrap(context.storageAdapter, context.runtimeMode).metadata

  applyScenarioPatchSet(context, scenario)

  const activeScenario: ActiveScenarioState = {
    scenarioId: scenario.id,
    restoredAt: new Date().toISOString(),
    runtimeMode: context.runtimeMode,
    seedSubsetRefs: scenario.seedSubsetRefs,
    entityPatchSet: scenario.entityPatchSet ?? null,
  }
  context.storageAdapter.set(ACTIVE_SCENARIO_KEY, activeScenario)

  deps.appendAudit({
    action: 'environment.scenario_restored',
    actorType: 'admin',
    details: {
      scenarioId: scenario.id,
      runtimeMode: context.runtimeMode,
      namespace: context.namespace,
      seedVersion: bootstrap.seedVersion,
    },
  })

  notifyDataStore()
  return { scenario, bootstrap, activeScenario }
}

export function readActiveScenarioState(
  context: EnvironmentContext = environmentContext,
): ActiveScenarioState | null {
  return context.storageAdapter.get<ActiveScenarioState>(ACTIVE_SCENARIO_KEY)
}

