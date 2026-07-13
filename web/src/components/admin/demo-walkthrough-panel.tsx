import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { PmContentCard } from '@/components/layout/pm-layout-index'
import { PmBadge, PmButton } from '@/components/ui/pm-index'
import {
  getDemoScenarioById,
  getDemoScenarioRegistry,
  type DemoScenarioDefinition,
  type DemoScenarioId,
} from '@/infrastructure/environment/demo-scenario-registry.ts'
import { buildDemoCastCoverageSnapshot } from '@/domain/admin/diagnostics/demo-cast-coverage.ts'

async function copyText(value: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(value)
    toast.success('Copied', { description: value })
  } catch {
    toast.error('Copy failed')
  }
}

export function DemoWalkthroughPanel() {
  const scenarios = useMemo(() => getDemoScenarioRegistry(), [])
  const coverage = useMemo(() => buildDemoCastCoverageSnapshot(), [])
  const [selectedId, setSelectedId] = useState<DemoScenarioId>(
    scenarios[0]?.id ?? 'marketplace',
  )
  const selected: DemoScenarioDefinition | undefined = getDemoScenarioById(selectedId)

  return (
    <PmContentCard
      title="Demo Walkthrough"
      description="Guide trainers through all four matching topologies using demo accounts as roles."
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {coverage.topologyChains.map((chain) => (
            <PmBadge key={chain.matchType} tone={chain.complete ? 'success' : 'warning'}>
              {chain.matchType}
              {chain.complete ? ' complete' : ' incomplete'}
            </PmBadge>
          ))}
          <PmBadge tone={coverage.missingAccountIds.length === 0 ? 'success' : 'warning'}>
            Cast {coverage.castAccounts}/{coverage.totalAccounts}
          </PmBadge>
        </div>

        <label htmlFor="walkthrough-scenario" className="text-sm font-medium">
          Walkthrough scenario
        </label>
        <select
          id="walkthrough-scenario"
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={selectedId}
          onChange={(event) => setSelectedId(event.target.value as DemoScenarioId)}
        >
          {scenarios.map((scenario) => (
            <option key={scenario.id} value={scenario.id}>
              {scenario.title}
            </option>
          ))}
        </select>

        {selected ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{selected.description}</p>
            <ol className="space-y-3">
              {selected.narrativeSteps.map((step, index) => (
                <li
                  key={step.id}
                  className="rounded-md border border-border/60 px-3 py-3 text-sm"
                >
                  <div className="font-medium">
                    {index + 1}. {step.title}
                  </div>
                  <p className="mt-1 text-muted-foreground">{step.description}</p>
                  {step.loginAs ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <PmBadge tone="muted">{step.loginAs.roleLabel}</PmBadge>
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                        {step.loginAs.email}
                      </code>
                      <PmButton
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          void copyText(`${step.loginAs!.email} / ${step.loginAs!.passwordHint}`)
                        }
                      >
                        Copy credentials
                      </PmButton>
                    </div>
                  ) : null}
                  {step.entityRoute ? (
                    <div className="mt-2">
                      <PmButton size="sm" variant="outline" asChild>
                        <Link to={step.entityRoute}>Open {step.entityRoute}</Link>
                      </PmButton>
                    </div>
                  ) : null}
                </li>
              ))}
            </ol>
          </div>
        ) : null}
      </div>
    </PmContentCard>
  )
}
