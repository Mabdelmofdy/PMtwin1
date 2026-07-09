import type { ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'

export type PmDisclosureSectionProps = {
  readonly title: string
  readonly description?: string
  readonly children: ReactNode
  readonly className?: string
  readonly defaultOpen?: boolean
}

/**
 * Progressive-disclosure section (DS v2) — collapses reference-heavy content
 * so detail pages lead with actions instead of documentation.
 */
export function PmDisclosureSection({
  title,
  description,
  children,
  className,
  defaultOpen = false,
}: PmDisclosureSectionProps) {
  return (
    <details
      data-slot="pm-disclosure-section"
      open={defaultOpen}
      className={cn(
        'group rounded-2xl border border-border/60 bg-surface-muted/30',
        className,
      )}
    >
      <summary
        className={cn(
          'flex cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 py-3 outline-none transition-colors hover:bg-surface-muted/60 focus-visible:ring-2 focus-visible:ring-focus-ring marker:content-none [&::-webkit-details-marker]:hidden',
        )}
      >
        <span className="min-w-0">
          <span className={cn(pmTypography.label, 'block')}>{title}</span>
          {description ? (
            <span className={cn(pmTypography.caption, 'block text-muted-foreground')}>
              {description}
            </span>
          ) : null}
        </span>
        <ChevronDown
          className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <div className="space-y-4 border-t border-border/40 px-4 py-4">{children}</div>
    </details>
  )
}
