import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { pmLayout, pmTypography } from '@/components/shared/pm-design-tokens'
import { PmSurface } from '@/components/ui/pm-surface'

export type PmFormSectionProps = ComponentProps<'section'> & {
  title?: string
  description?: string
  actions?: ReactNode
  /** Wrap section body in a bordered surface */
  bordered?: boolean
  dense?: boolean
  children?: ReactNode
}

/** Grouped form section with title and description — Stripe-style clarity. */
export function PmFormSection({
  title,
  description,
  actions,
  bordered = true,
  dense = false,
  className,
  children,
  ...props
}: PmFormSectionProps) {
  const header = title || description || actions

  const body = (
    <>
      {header ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 space-y-1">
            {title ? (
              <h3 className={dense ? pmTypography.h3 : pmTypography.h2}>
                {title}
              </h3>
            ) : null}
            {description ? (
              <p
                className={cn(
                  pmTypography.bodySm,
                  'max-w-2xl text-muted-foreground',
                )}
              >
                {description}
              </p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>
          ) : null}
        </div>
      ) : null}
      {children ? (
        <div className={cn(pmLayout.formGap, 'flex flex-col')}>{children}</div>
      ) : null}
    </>
  )

  if (!bordered) {
    return (
      <section
        data-slot="pm-form-section"
        className={cn(dense ? 'space-y-4' : pmLayout.sectionGap, className)}
        {...props}
      >
        {body}
      </section>
    )
  }

  return (
    <section data-slot="pm-form-section" className={className} {...props}>
      <PmSurface variant="default" className="p-4 md:p-5">
        <div className={cn(dense ? 'space-y-4' : 'space-y-5')}>{body}</div>
      </PmSurface>
    </section>
  )
}

export type PmFormSectionSlotProps = ComponentProps<'div'>

/** Ungrouped section body slot. */
export function PmFormSectionBody({ className, ...props }: PmFormSectionSlotProps) {
  return (
    <div
      data-slot="pm-form-section-body"
      className={cn(pmLayout.formGap, 'flex flex-col', className)}
      {...props}
    />
  )
}
