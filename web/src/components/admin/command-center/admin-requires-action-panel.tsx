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

/**
 * Split operational queues into Needs Decision (primary) and Needs Attention (secondary).
 */
export function AdminRequiresActionPanel({ cards, className }: AdminRequiresActionPanelProps) {
  const withWork = cards.filter((c) => c.count > 0)
  const decisions = withWork.filter((c) => c.attentionKind === 'decision')
  const attention = withWork.filter((c) => c.attentionKind !== 'decision')

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <PmContentCard
        title="Needs Decision"
        description="Actions that require an explicit approve, reject, award, or moderate decision."
        className="border-primary/30 bg-primary/[0.03]"
        actions={
          <Link
            to="/admin/command-center/operations"
            className={cn(pmTypography.caption, 'text-primary underline-offset-4 hover:underline')}
          >
            All operations
          </Link>
        }
      >
        {decisions.length === 0 ? (
          <PmEmptyState
            title="No decisions pending"
            description="Decision queues are clear."
            size="compact"
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {decisions.map((card) => (
              <AdminOpsActionCard key={card.id} card={card} />
            ))}
          </div>
        )}
      </PmContentCard>

      <PmContentCard
        title="Needs Attention"
        description="Monitoring and follow-up work — review when capacity allows."
        className="border-border/60"
      >
        {attention.length === 0 ? (
          <PmEmptyState
            title="Nothing needs attention"
            description="No monitoring queues are elevated."
            size="compact"
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {attention.map((card) => (
              <AdminOpsActionCard key={card.id} card={card} />
            ))}
          </div>
        )}
      </PmContentCard>
    </div>
  )
}
