import { Link } from 'react-router-dom'
import type { AdminOpsActionCard as AdminOpsActionCardModel } from '@/domain/admin/read-models/types.ts'
import { AdminOpsActionCard } from '@/components/admin/command-center/admin-ops-action-card.tsx'
import { PmContentCard } from '@/components/layout/pm-layout-index'
import { PmEmptyState } from '@/components/ui/pm-index'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'

export type AdminRequiresActionPanelProps = {
  readonly cards: readonly AdminOpsActionCardModel[]
  readonly className?: string
}

/** Primary "Requires My Action" band for the Executive Command Center. */
export function AdminRequiresActionPanel({ cards, className }: AdminRequiresActionPanelProps) {
  const actionable = cards.filter((c) => c.count > 0)
  const display = actionable.length > 0 ? actionable : cards

  return (
    <PmContentCard
      title="Requires My Action"
      description="Queues that need administrator intervention now."
      className={cn('border-primary/20', className)}
      actions={
        <Link
          to="/admin/command-center/operations"
          className={cn(pmTypography.caption, 'text-primary underline-offset-4 hover:underline')}
        >
          All operations
        </Link>
      }
    >
      {display.length === 0 ? (
        <PmEmptyState title="No pending actions" description="Operational queues are clear." size="compact" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {display.map((card) => (
            <AdminOpsActionCard key={card.id} card={card} />
          ))}
        </div>
      )}
    </PmContentCard>
  )
}
