import { PmEmptyState, PmPage, PmPageHeader } from '@/components/ui/pm-index'

export type AdminPlannedShellProps = {
  readonly title: string
  readonly description: string
  readonly plannedMessage?: string
}

/** Clear empty state for admin surfaces without a Demo/UAT data path yet. */
export function AdminPlannedShell({
  title,
  description,
  plannedMessage = 'This admin surface is planned for a later Demo/UAT phase. No LocalStorage data path is wired yet.',
}: AdminPlannedShellProps) {
  return (
    <PmPage header={<PmPageHeader title={title} description={description} />}>
      <PmEmptyState
        title="Planned"
        description={plannedMessage}
        size="compact"
      />
    </PmPage>
  )
}
