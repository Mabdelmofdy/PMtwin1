import type { ComponentProps } from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'

export type PmFormErrorProps = ComponentProps<'p'>

/** Inline field error message — role=alert for screen readers. */
export function PmFormError({ className, children, ...props }: PmFormErrorProps) {
  return (
    <p
      data-slot="pm-form-error"
      role="alert"
      className={cn(
        pmTypography.caption,
        'flex items-start gap-1.5 text-danger',
        className,
      )}
      {...props}
    >
      <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  )
}
