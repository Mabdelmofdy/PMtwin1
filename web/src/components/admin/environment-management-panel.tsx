import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { PmContentCard, PmMetricGrid } from '@/components/layout/pm-layout-index'
import { PmBadge, PmButton, PmStatCard } from '@/components/ui/pm-index'
import { environmentContext } from '@/infrastructure/environment/environment-context.ts'
import {
  readEnvironmentBootstrapMetadata,
  SEED_VERSION,
} from '@/infrastructure/environment/environment-bootstrap-service.ts'
import {
  getDemoScenarioRegistry,
  type DemoScenarioDefinition,
} from '@/infrastructure/environment/demo-scenario-registry.ts'
import {
  readActiveScenarioState,
  restoreDemoScenario,
} from '@/infrastructure/environment/environment-scenario-restore-service.ts'
import {
  loadApplications,
  loadContracts,
  loadNegotiations,
  loadNotifications,
  loadOpportunities,
  loadPostMatches,
} from '@/infrastructure/seed/seed-loader.ts'
import { adminApi } from '@/api/admin.ts'
import { dealsApi } from '@/api/deals.ts'
import { peopleApi } from '@/api/people.ts'
import { formatDate } from '@/lib/format'

export type EnvironmentMetadataSnapshot = {
  runtimeMode: string
  storageType: string
  namespace: string
  seedVersion: string
  bootstrappedAt: string
  recordCounts: Record<string, number>
}

export function buildEnvironmentMetadataSnapshot(): EnvironmentMetadataSnapshot {
  const bootstrap = readEnvironmentBootstrapMetadata(environmentContext.storageAdapter)
  return {
    runtimeMode: environmentContext.runtimeMode,
    storageType: environmentContext.storageType,
    namespace: environmentContext.namespace ?? 'N/A',
    seedVersion: bootstrap?.seedVersion ?? SEED_VERSION,
    bootstrappedAt: bootstrap?.bootstrappedAt ?? 'Not bootstrapped',
    recordCounts: {
      users: peopleApi.listUsers().length,
      companies: peopleApi.listCompanies().length,
      opportunities: loadOpportunities().length,
      postMatches: loadPostMatches().length,
      negotiations: loadNegotiations().length,
      commercialAgreements: dealsApi.list().length,
      contracts: loadContracts().length,
      applications: loadApplications().length,
      notifications: loadNotifications().length,
      audit: adminApi.getAuditLog().length,
    },
  }
}

export function canRenderScenarioRestoreControls(
  runtimeMode: string = environmentContext.runtimeMode,
): boolean {
  return runtimeMode === 'demo' || runtimeMode === 'uat'
}

function mapScenarioOption(scenario: DemoScenarioDefinition): { value: string; label: string } {
  return { value: scenario.id, label: scenario.title }
}

export function EnvironmentManagementPanel() {
  const scenarioRegistry = useMemo(() => getDemoScenarioRegistry(), [])
  const scenarioOptions = useMemo(
    () => scenarioRegistry.map(mapScenarioOption),
    [scenarioRegistry],
  )
  const activeScenario = readActiveScenarioState()
  const [selectedScenarioId, setSelectedScenarioId] = useState(
    activeScenario?.scenarioId ?? scenarioOptions[0]?.value ?? '',
  )
  const [isRestoring, setIsRestoring] = useState(false)

  const metadata = buildEnvironmentMetadataSnapshot()

  function handleRestoreScenario() {
    if (!selectedScenarioId || isRestoring) return
    if (!environmentContext.canRestoreScenario) return

    setIsRestoring(true)
    try {
      const restored = restoreDemoScenario(selectedScenarioId)
      toast.success('Scenario restored', {
        description: `${restored.scenario.title} has been restored for ${environmentContext.runtimeMode.toUpperCase()}.`,
      })
    } catch (error) {
      toast.error('Scenario restore failed', {
        description: error instanceof Error ? error.message : 'Unexpected restore error.',
      })
    } finally {
      setIsRestoring(false)
    }
  }

  return (
    <PmContentCard
      title="Environment management"
      description="Runtime metadata and demo scenario controls."
    >
      <div className="space-y-5">
        <PmMetricGrid columns={3}>
          <PmStatCard label="Runtime mode" value={metadata.runtimeMode.toUpperCase()} dense />
          <PmStatCard label="Storage type" value={metadata.storageType} dense />
          <PmStatCard label="Namespace" value={metadata.namespace} dense />
          <PmStatCard label="Seed version" value={metadata.seedVersion} dense />
          <PmStatCard
            label="Bootstrapped at"
            value={
              metadata.bootstrappedAt === 'Not bootstrapped'
                ? metadata.bootstrappedAt
                : formatDate(metadata.bootstrappedAt)
            }
            dense
          />
          <PmStatCard
            label="Active scenario"
            value={activeScenario?.scenarioId ?? 'None'}
            dense
          />
        </PmMetricGrid>

        <PmContentCard title="Record counts" noPadding>
          <ul className="grid gap-2 px-4 py-4 text-sm md:grid-cols-2">
            {Object.entries(metadata.recordCounts).map(([entity, count]) => (
              <li key={entity} className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2">
                <span>{entity}</span>
                <PmBadge tone="muted">{count}</PmBadge>
              </li>
            ))}
          </ul>
        </PmContentCard>

        {canRenderScenarioRestoreControls() ? (
          <div className="space-y-3">
            <label htmlFor="scenario-picker" className="text-sm font-medium">
              Scenario picker
            </label>
            <select
              id="scenario-picker"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={selectedScenarioId}
              onChange={(event) => setSelectedScenarioId(event.target.value)}
            >
              {scenarioOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <PmButton onClick={handleRestoreScenario} disabled={isRestoring || !selectedScenarioId}>
              {isRestoring ? 'Restoring scenario…' : 'Restore Selected Scenario'}
            </PmButton>
          </div>
        ) : (
          <PmBadge tone="warning">
            Scenario restore controls are hidden in production runtime.
          </PmBadge>
        )}
      </div>
    </PmContentCard>
  )
}

