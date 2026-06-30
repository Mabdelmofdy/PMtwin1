import type { ComponentProps, ReactNode } from 'react'
import { Copy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/components/shared/pm-design-tokens'
import { PmButton } from '@/components/ui/pm-button'
import { PmSurface } from '@/components/ui/pm-surface'
import {
  isReadonlyValueEmpty,
  resolveReadonlyValue,
} from '@/components/forms/pm-form-readonly-helpers'

export type PmFormReadonlyFieldProps = {
  label: string
  value?: unknown
  /** Custom value display — overrides resolved text from `value`. */
  children?: ReactNode
  emptyFallback?: string
  formatter?: (value: unknown) => string
  copyable?: boolean
  onCopy?: () => void
  className?: string
}

/** Single read-only label/value pair. */
export function PmFormReadonlyField({
  label,
  value,
  children,
  emptyFallback,
  formatter,
  copyable = false,
  onCopy,
  className,
}: PmFormReadonlyFieldProps) {
  const hasCustom = children !== undefined && children !== null
  const display = hasCustom
    ? children
    : resolveReadonlyValue({ value, emptyFallback, formatter })
  const isEmpty = hasCustom ? false : isReadonlyValueEmpty(value)

  return (
    <div
      data-slot="pm-form-readonly-field"
      className={cn('min-w-0 space-y-1', className)}
    >
      <dt className={cn(pmTypography.caption, 'text-muted-foreground')}>
        {label}
      </dt>
      <dd className="flex items-start gap-2">
        {hasCustom ? (
          <div className={pmTypography.bodySm}>{display}</div>
        ) : (
          <span
            className={cn(
              pmTypography.bodySm,
              isEmpty && 'text-muted-foreground',
            )}
          >
            {display}
          </span>
        )}
        {copyable && !isEmpty ? (
          <PmButton
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0 text-muted-foreground"
            onClick={onCopy}
            aria-label={`Copy ${label}`}
          >
            <Copy className="size-3.5" />
          </PmButton>
        ) : null}
      </dd>
    </div>
  )
}

export type PmFormReadonlySectionProps = {
  title?: string
  description?: string
  children?: ReactNode
  bordered?: boolean
  className?: string
}

/** Grouped read-only fields section. */
export function PmFormReadonlySection({
  title,
  description,
  children,
  bordered = true,
  className,
}: PmFormReadonlySectionProps) {
  const content = (
    <>
      {title || description ? (
        <header className="space-y-1">
          {title ? <h3 className={pmTypography.h3}>{title}</h3> : null}
          {description ? (
            <p className={cn(pmTypography.caption, 'text-muted-foreground')}>
              {description}
            </p>
          ) : null}
        </header>
      ) : null}
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</dl>
    </>
  )

  if (!bordered) {
    return (
      <section
        data-slot="pm-form-readonly-section"
        className={cn('space-y-4', className)}
      >
        {content}
      </section>
    )
  }

  return (
    <section data-slot="pm-form-readonly-section" className={className}>
      <PmSurface variant="default" className="space-y-4 p-4 md:p-5">
        {content}
      </PmSurface>
    </section>
  )
}

export type PmFormReadonlyProps = ComponentProps<'div'> & {
  children?: ReactNode
}

/** Read-only form container — detail / inspector views. */
export function PmFormReadonly({ className, children, ...props }: PmFormReadonlyProps) {
  return (
    <div
      data-slot="pm-form-readonly"
      data-mode="readonly"
      className={cn('flex flex-col gap-6', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export type PmFormReadonlyCopySlotProps = {
  children?: ReactNode
  className?: string
}

/** Optional copyable value slot for custom copy UI. */
export function PmFormReadonlyCopySlot({
  children,
  className,
}: PmFormReadonlyCopySlotProps) {
  return (
    <div data-slot="pm-form-readonly-copy" className={className}>
      {children}
    </div>
  )
}
