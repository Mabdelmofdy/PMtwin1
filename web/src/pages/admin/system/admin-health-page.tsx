import { useMemo } from 'react'
import { buildDemoUatHealthSnapshot } from '@/domain/admin/diagnostics/demo-uat-health.ts'
import { useDataStoreVersion } from '@/hooks/use-data-store'
import { PmContentCard, PmMetricGrid } from '@/components/layout/pm-layout-index'
import { PmBadge, PmPage, PmPageHeader, PmPageHeroMetric, PmStatCard } from '@/components/ui/pm-index'
import { formatDate } from '@/lib/format'

function checkTone(status: string): 'success' | 'warning' | 'danger' | 'info' | 'muted' {
  switch (status) {
    case 'ok':
      return 'success'
    case 'warning':
      return 'warning'
    case 'error':
      return 'danger'
    case 'info':
      return 'info'
    default:
      return 'muted'
  }
}

export function AdminHealthPage() {
  const version = useDataStoreVersion()
  const snapshot = useMemo(() => buildDemoUatHealthSnapshot(), [version])
  const errorCount = snapshot.checks.filter((c) => c.status === 'error').length

  return (
    <PmPage
      header={
        <PmPageHeader
          label="System"
          title="Health"
          description="Demo/UAT diagnostics from LocalStorage and runtime config — never invents DB/API/queue status."
          metric={
            <PmPageHeroMetric
              value={errorCount === 0 ? 'OK' : `${errorCount} err`}
              label="Diagnostics"
            />
          }
          badges={
            <>
              <PmBadge tone={errorCount === 0 ? 'success' : 'danger'}>
                {snapshot.runtimeMode}
              </PmBadge>
              <PmBadge tone="muted">{snapshot.storageLabel}</PmBadge>
            </>
          }
        />
      }
    >
      <p className="mb-4 text-sm text-muted-foreground">
        Generated {formatDate(snapshot.generatedAt)}
      </p>
      <PmMetricGrid columns={4}>
        {Object.entries(snapshot.counts).map(([key, value]) => (
          <PmStatCard key={key} label={key} value={value} dense />
        ))}
      </PmMetricGrid>
      <PmContentCard title="Checks" className="mt-6" noPadding>
        <ul className="divide-y divide-border/60">
          {snapshot.checks.map((check) => (
            <li
              key={check.id}
              className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 md:px-5"
            >
              <div>
                <p className="font-medium">{check.label}</p>
                <p className="text-sm text-muted-foreground">{check.detail}</p>
              </div>
              <PmBadge tone={checkTone(check.status)} size="sm">
                {check.status}
              </PmBadge>
            </li>
          ))}
        </ul>
      </PmContentCard>
    </PmPage>
  )
}
