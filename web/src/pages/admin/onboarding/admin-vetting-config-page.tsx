import { PmContentCard } from '@/components/layout/pm-layout-index'
import { PmEmptyState, PmPage, PmPageHeader } from '@/components/ui/pm-index'
import { VETTING_QUEUE_STATUSES } from '@/types/vetting.ts'

export function AdminVettingConfigPage() {
  return (
    <PmPage
      header={
        <PmPageHeader
          label="Compliance"
          title="Vetting Config"
          description="Read-only Demo/UAT summary of vetting queue statuses. Full config editor is planned."
        />
      }
    >
      <PmContentCard title="Queue statuses (code)">
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          {VETTING_QUEUE_STATUSES.map((status) => (
            <li key={status}>{status}</li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-muted-foreground">
          SLA thresholds and document category rules remain owned by vetting-service / SLA helpers.
        </p>
      </PmContentCard>
      <div className="mt-6">
        <PmEmptyState
          title="Planned"
          description="Editable vetting policy configuration is not wired in Demo/UAT LocalStorage yet."
          size="compact"
        />
      </div>
    </PmPage>
  )
}
