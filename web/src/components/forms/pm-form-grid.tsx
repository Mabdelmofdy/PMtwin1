import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'
import {
  resolveFormFieldSpan,
  resolveFormGridClasses,
  type PmFormGridColumns,
} from '@/components/forms/pm-form-layout'

export type PmFormGridProps = ComponentProps<'div'> & {
  columns?: PmFormGridColumns
}

/** Responsive form field grid — 1, 2, or 3 columns. */
export function PmFormGrid({
  columns = 1,
  className,
  children,
  ...props
}: PmFormGridProps) {
  return (
    <div
      data-slot="pm-form-grid"
      data-columns={columns}
      className={cn(resolveFormGridClasses(columns), className)}
      {...props}
    >
      {children}
    </div>
  )
}

export type PmFormGridItemProps = ComponentProps<'div'> & {
  span?: 1 | 2 | 3 | 'full'
  gridColumns?: PmFormGridColumns
}

/** Grid cell with optional column span. */
export function PmFormGridItem({
  span = 1,
  gridColumns = 1,
  className,
  children,
  ...props
}: PmFormGridItemProps) {
  return (
    <div
      data-slot="pm-form-grid-item"
      className={cn(resolveFormFieldSpan(span, gridColumns), className)}
      {...props}
    >
      {children}
    </div>
  )
}
