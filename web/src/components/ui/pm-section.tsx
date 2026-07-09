import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { pmLayout, pmTypography } from '@/tokens'

export type PmSectionProps = ComponentProps<'section'> & {
  title?: string
  description?: string
  actions?: ReactNode
  /** Tighter vertical rhythm for nested blocks */
  dense?: boolean
}

export function PmSection({
  title,
  description,
  actions,
  dense = false,
  className,
  children,
  ...props
}: PmSectionProps) {
  return (
    <section
      data-slot="pm-section"
      className={cn(
        'flex flex-col',
        dense ? 'gap-3' : pmLayout.sectionGap,
        className,
      )}
      {...props}
    >
      {title || description || actions ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            {title ? <h2 className={pmTypography.h2}>{title}</h2> : null}
            {description ? (
              <p className={cn(pmTypography.bodySm, 'text-muted-foreground max-w-2xl')}>
                {description}
              </p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  )
}

export function PmSectionBody({
  className,
  ...props
}: ComponentProps<'div'>) {
  return (
    <div
      data-slot="pm-section-body"
      className={cn(pmLayout.formGap, 'flex flex-col', className)}
      {...props}
    />
  )
}
