import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'

export function OpportunityKpiCard({
  label,
  value,
  detail,
  tone = 'default',
  className,
}: {
  readonly label: string
  readonly value: string
  readonly detail?: string
  readonly tone?: 'default' | 'success' | 'warning' | 'muted'
  readonly className?: string
}) {
  return (
    <div
      className={cn(
        'min-w-0 rounded-lg border border-border/60 bg-card px-3 py-2.5',
        tone === 'success' && 'border-emerald-500/30',
        tone === 'warning' && 'border-amber-500/30',
        tone === 'muted' && 'opacity-80',
        className,
      )}
    >
      <p className={cn(pmTypography.caption, 'text-muted-foreground')}>{label}</p>
      <p className={cn(pmTypography.h3, 'mt-0.5 truncate text-foreground')}>{value}</p>
      {detail ? (
        <p className={cn(pmTypography.caption, 'mt-0.5 text-muted-foreground')}>{detail}</p>
      ) : null}
    </div>
  )
}
