import { Link } from 'react-router-dom'
import type { AdminPipelineSummary } from '@/domain/admin/read-models/types.ts'
import { PmContentCard } from '@/components/layout/pm-layout-index'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'

export type AdminPipelinePanelProps = {
  readonly summary: AdminPipelineSummary
  readonly className?: string
}

/** Drillable collaboration lifecycle pipeline. */
export function AdminPipelinePanel({ summary, className }: AdminPipelinePanelProps) {
  const maxCount = Math.max(1, ...summary.stages.map((s) => s.count))

  return (
    <PmContentCard
      title="Pipeline"
      description="Published → Matched → Accepted → Negotiation → Commercial Agreement → Contract → Execution → Completed"
      className={className}
    >
      <ol className="space-y-2" aria-label="Collaboration pipeline">
        {summary.stages.map((stage, index) => {
          const width =
            stage.count <= 0 ? 0 : Math.round((stage.count / maxCount) * 100)
          return (
            <li key={stage.id}>
              <Link
                to={stage.href}
                className={cn(
                  'block rounded-md px-1 py-1.5 transition-colors hover:bg-muted/40',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                )}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className={pmTypography.label}>
                    {index > 0 ? (
                      <span className="me-1 text-muted-foreground" aria-hidden>
                        ↓
                      </span>
                    ) : null}
                    {stage.label}
                  </span>
                  <span className={cn(pmTypography.caption, 'text-muted-foreground')}>
                    {stage.count <= 0 ? 'No data' : stage.count}
                  </span>
                </div>
                <div
                  className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted"
                  role="img"
                  aria-label={`${stage.label}: ${stage.count}`}
                >
                  {width > 0 ? (
                    <div
                      className="h-full rounded-full bg-primary transition-[width]"
                      style={{ width: `${width}%` }}
                    />
                  ) : null}
                </div>
              </Link>
            </li>
          )
        })}
      </ol>
    </PmContentCard>
  )
}
