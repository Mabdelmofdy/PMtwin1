/**
 * Legacy page primitives — deprecated Phase 8, audited Phase 9.
 * Zero active page imports; retained for design-governance regression tests only.
 * Prefer PmPageHeader, PmWorkflowBadge, PmEmptyState, PmStatCard from @/components/ui/pm-index.
 */
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import {
  formatCanonicalStatusLabel,
  resolveCanonicalStatus,
  type StatusEntity,
} from '@/lib/status-display.ts'
import { formatStatus } from '@/lib/format'

const statusStyles: Record<string, string> = {
  published: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  active: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  executing: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  pending: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  pending_signature: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  draft: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
  review: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
  signing: 'bg-sky-500/10 text-sky-700 dark:text-sky-400',
  in_negotiation: 'bg-sky-500/10 text-sky-700 dark:text-sky-400',
  negotiating: 'bg-sky-500/10 text-sky-700 dark:text-sky-400',
  matched: 'bg-sky-500/10 text-sky-700 dark:text-sky-400',
  contracted: 'bg-violet-500/10 text-violet-700 dark:text-violet-400',
  completed: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  closed: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
  cancelled: 'bg-red-500/10 text-red-700 dark:text-red-400',
  terminated: 'bg-red-500/10 text-red-700 dark:text-red-400',
  accepted: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  rejected: 'bg-red-500/10 text-red-700 dark:text-red-400',
  agreed: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
}

export function StatusBadge({
  status,
  entity,
  className,
}: {
  status: string
  entity?: StatusEntity
  className?: string
}) {
  const displayStatus = entity
    ? resolveCanonicalStatus(entity, status)
    : status
  const style =
    statusStyles[displayStatus] ??
    'bg-muted text-muted-foreground'

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
        style,
        className,
      )}
    >
      {entity
        ? formatCanonicalStatusLabel(entity, status)
        : formatStatus(status)}
    </span>
  )
}

export function PageHeader({
  label,
  title,
  description,
  actions,
}: {
  label?: string
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-border/60 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        {label ? (
          <p className="text-sm font-medium text-primary">{label}</p>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  )
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/20 px-6 py-16 text-center">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {description ? (
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string
  value: string | number
  hint?: string
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm transition-shadow duration-200 hover:shadow-md">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}
