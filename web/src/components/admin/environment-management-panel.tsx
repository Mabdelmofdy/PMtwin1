import { useMemo, useRef, useState } from 'react'
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
  EnvironmentResetError,
  resetEnvironment,
} from '@/infrastructure/environment/environment-reset-service.ts'
import {
  exportEnvironmentData,
  serializeEnvironmentExportPayload,
} from '@/infrastructure/environment/environment-export-service.ts'
import {
  EnvironmentImportError,
  importEnvironmentData,
  parseEnvironmentImportJson,
  validateEnvironmentImportPayload,
} from '@/infrastructure/environment/environment-import-service.ts'
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
import { useAuth } from '@/providers/auth-provider.tsx'

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

export function canRenderEnvironmentExportControls(
  runtimeMode: string = environmentContext.runtimeMode,
): boolean {
  return runtimeMode === 'demo' || runtimeMode === 'uat'
}

export function canRenderEnvironmentImportControls(
  runtimeMode: string = environmentContext.runtimeMode,
): boolean {
  return runtimeMode === 'demo' || runtimeMode === 'uat'
}

export function canRenderEnvironmentResetControls(
  runtimeMode: string = environmentContext.runtimeMode,
): boolean {
  return runtimeMode === 'demo' || runtimeMode === 'uat'
}

export const ENVIRONMENT_IMPORT_OVERWRITE_MESSAGE =
  'Importing will overwrite all data in the current environment namespace. Continue?'

export const ENVIRONMENT_RESET_CONFIRM_MESSAGE =
  'Reset will clear the current environment namespace and restore canonical seed data. Continue?'

export async function readEnvironmentImportFile(file: File): Promise<string> {
  return file.text()
}

function downloadEnvironmentExportFile(payload: ReturnType<typeof exportEnvironmentData>): void {
  const serialized = serializeEnvironmentExportPayload(payload)
  const blob = new Blob([serialized], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `pmtwin-${payload.metadata.runtimeMode}-export-${payload.metadata.exportedAt.replace(/[:.]/g, '-')}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}

function mapScenarioOption(scenario: DemoScenarioDefinition): { value: string; label: string } {
  return { value: scenario.id, label: scenario.title }
}

export function EnvironmentManagementPanel() {
  const { user } = useAuth()
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
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const importInputRef = useRef<HTMLInputElement>(null)

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

  function handleExportEnvironment() {
    if (isExporting) return
    if (!canRenderEnvironmentExportControls()) return

    setIsExporting(true)
    try {
      const payload = exportEnvironmentData(user?.email ?? user?.id ?? 'admin')
      downloadEnvironmentExportFile(payload)
      toast.success('Environment exported', {
        description: `Exported ${environmentContext.runtimeMode.toUpperCase()} namespace data.`,
      })
    } catch (error) {
      toast.error('Environment export failed', {
        description: error instanceof Error ? error.message : 'Unexpected export error.',
      })
    } finally {
      setIsExporting(false)
    }
  }

  async function handleImportFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || isImporting) return
    if (!canRenderEnvironmentImportControls()) return

    setIsImporting(true)
    try {
      const json = await readEnvironmentImportFile(file)
      validateEnvironmentImportPayload(parseEnvironmentImportJson(json))

      const confirmed = window.confirm(ENVIRONMENT_IMPORT_OVERWRITE_MESSAGE)
      if (!confirmed) return

      importEnvironmentData(json, {
        confirmed: true,
        importedBy: user?.email ?? user?.id ?? 'admin',
      })

      toast.success('Environment imported', {
        description: `Restored ${environmentContext.runtimeMode.toUpperCase()} namespace from ${file.name}.`,
      })
    } catch (error) {
      const description =
        error instanceof EnvironmentImportError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Unexpected import error.'
      toast.error('Environment import failed', { description })
    } finally {
      setIsImporting(false)
    }
  }

  function handleImportEnvironmentClick() {
    if (isImporting) return
    if (!canRenderEnvironmentImportControls()) return
    importInputRef.current?.click()
  }

  function handleResetEnvironment() {
    if (isResetting) return
    if (!canRenderEnvironmentResetControls()) return

    const confirmed = window.confirm(ENVIRONMENT_RESET_CONFIRM_MESSAGE)
    if (!confirmed) return

    setIsResetting(true)
    try {
      resetEnvironment()
      toast.success('Environment reset', {
        description: `Restored canonical seed for ${environmentContext.runtimeMode.toUpperCase()}.`,
      })
    } catch (error) {
      const description =
        error instanceof EnvironmentResetError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Unexpected reset error.'
      toast.error('Environment reset failed', { description })
    } finally {
      setIsResetting(false)
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
            <div className="flex flex-wrap gap-3">
              <PmButton onClick={handleRestoreScenario} disabled={isRestoring || !selectedScenarioId}>
                {isRestoring ? 'Restoring scenario…' : 'Restore Selected Scenario'}
              </PmButton>
              <PmButton
                variant="outline"
                onClick={handleExportEnvironment}
                disabled={isExporting}
              >
                {isExporting ? 'Exporting…' : 'Export Environment Data'}
              </PmButton>
              <PmButton
                variant="outline"
                onClick={handleImportEnvironmentClick}
                disabled={isImporting}
              >
                {isImporting ? 'Importing…' : 'Import Environment Data'}
              </PmButton>
              <input
                ref={importInputRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(event) => {
                  void handleImportFileSelected(event)
                }}
              />
              <PmButton
                variant="destructive"
                onClick={handleResetEnvironment}
                disabled={isResetting}
              >
                {isResetting ? 'Resetting…' : 'Reset Entire Environment'}
              </PmButton>
            </div>
          </div>
        ) : (
          <PmBadge tone="warning">
            Scenario restore, export, import, and reset controls are hidden in production runtime.
          </PmBadge>
        )}
      </div>
    </PmContentCard>
  )
}

