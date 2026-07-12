import { Link } from 'react-router-dom'
import type {
  AdminOpsActionCard as AdminOpsActionCardModel,
} from '@/domain/admin/read-models/types.ts'
import {
  severityCardClass,
  severityToBadgeTone,
  slaToBadgeTone,
} from '@/components/admin/severity/admin-severity.ts'
import { PmBadge } from '@/components/ui/pm-index'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'

export type AdminOpsActionCardProps = {
  readonly card: AdminOpsActionCardModel
  readonly className?: string
}

function formatAgeMs(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '—'
  const hours = Math.floor(ms / (1000 * 60 * 60))
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

export function AdminOpsActionCard({ card, className }: AdminOpsActionCardProps) {
  return (
    <Link
      to={card.destinationHref}
      className={cn(
        'block rounded-lg border bg-gradient-to-b from-card to-surface p-3 transition-colors',
        'hover:border-primary/40 hover:bg-muted/30',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        severityCardClass(card.severity),
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className={pmTypography.label}>{card.title}</p>
        <p className={cn(pmTypography.stat, 'text-lg')}>{card.count}</p>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <PmBadge tone={severityToBadgeTone(card.severity)} size="sm">
          {card.severity}
        </PmBadge>
        {card.sla !== 'none' ? (
          <PmBadge tone={slaToBadgeTone(card.sla)} size="sm">
            SLA {card.sla}
          </PmBadge>
        ) : null}
        <span className={cn(pmTypography.caption, 'text-muted-foreground')}>
          Oldest {formatAgeMs(card.oldestAgeMs)}
        </span>
      </div>
      {card.assignedTeam ? (
        <p className={cn(pmTypography.caption, 'mt-2 text-muted-foreground')}>
          {card.assignedTeam}
        </p>
      ) : null}
    </Link>
  )
}
