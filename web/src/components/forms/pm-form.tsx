import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { pmLayout, pmTypography } from '@/tokens'
import { resolveFormStackClasses } from '@/components/forms/pm-form-layout'
import { isFormInteractive, resolveFormMode } from '@/components/forms/pm-form-state'

export type PmFormProps = ComponentProps<'form'> & {
  children?: ReactNode
  /** Shows loading overlay and disables interaction */
  loading?: boolean
  /** Disables all inputs */
  disabled?: boolean
  /** Read-only mode — use PmFormReadonly for display-only pages */
  readOnly?: boolean
  dense?: boolean
  footer?: ReactNode
  rail?: ReactNode
}

/**
 * Form shell — section stack, optional right rail, sticky footer slot.
 * Works with existing shadcn inputs; no validation or API wiring.
 */
export function PmForm({
  children,
  loading = false,
  disabled = false,
  readOnly = false,
  dense = false,
  footer,
  rail,
  className,
  ...props
}: PmFormProps) {
  const mode = resolveFormMode({ loading, disabled, readOnly })
  const interactive = isFormInteractive({ loading, disabled, readOnly })

  return (
    <form
      data-slot="pm-form"
      data-mode={mode}
      data-loading={loading || undefined}
      aria-busy={loading || undefined}
      className={cn(
        resolveFormStackClasses(dense),
        !interactive && 'pointer-events-none opacity-80',
        readOnly && 'pointer-events-auto opacity-100',
        className,
      )}
      {...props}
    >
      {rail ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_minmax(16rem,20rem)]">
          <div className={cn('min-w-0', pmLayout.formGap, 'flex flex-col')}>
            {children}
          </div>
          <aside
            data-slot="pm-form-rail"
            className="min-w-0 space-y-4 lg:sticky lg:top-20 lg:self-start"
          >
            {rail}
          </aside>
        </div>
      ) : (
        children
      )}
      {footer}
      {loading ? (
        <div
          className="sr-only"
          role="status"
          aria-live="polite"
        >
          Loading form…
        </div>
      ) : null}
    </form>
  )
}

export type PmFormBodyProps = ComponentProps<'div'>

/** Vertical field stack inside a form section. */
export function PmFormBody({ className, ...props }: PmFormBodyProps) {
  return (
    <div
      data-slot="pm-form-body"
      className={cn(pmLayout.formGap, 'flex flex-col', className)}
      {...props}
    />
  )
}

export type PmFormHeaderProps = {
  title?: string
  description?: string
  className?: string
}

/** Optional form-level title above sections. */
export function PmFormHeader({ title, description, className }: PmFormHeaderProps) {
  if (!title && !description) return null
  return (
    <header data-slot="pm-form-header" className={cn('space-y-1', className)}>
      {title ? <h2 className={pmTypography.h2}>{title}</h2> : null}
      {description ? (
        <p className={cn(pmTypography.bodySm, 'text-muted-foreground max-w-2xl')}>
          {description}
        </p>
      ) : null}
    </header>
  )
}
