import { cn } from '@/lib/utils'

export type AdminSkeletonBlockProps = {
  readonly rows?: number
  readonly className?: string
}

/** Lightweight skeleton for admin dense layouts. */
export function AdminSkeletonBlock({ rows = 4, className }: AdminSkeletonBlockProps) {
  return (
    <div className={cn('animate-pulse space-y-2', className)} aria-hidden>
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="h-9 rounded-md bg-muted/70"
          style={{ width: `${88 - (i % 3) * 8}%` }}
        />
      ))}
    </div>
  )
}
