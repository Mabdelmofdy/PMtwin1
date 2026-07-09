import type { ComponentProps } from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'
import { PmSurface } from '@/components/ui/pm-surface'
import {
  collectFormErrors,
} from '@/components/forms/pm-form-validation'

export type PmFormSummaryProps = ComponentProps<'div'> & {
  title?: string
  errors?: Record<string, string | null | undefined>
  /** Explicit error list — overrides errors record */
  messages?: string[]
}

/** Form-level validation summary — lists all field errors. */
export function PmFormSummary({
  title = 'Please fix the following errors',
  errors = {},
  messages,
  className,
  ...props
}: PmFormSummaryProps) {
  const items = messages ?? collectFormErrors(errors)

  if (items.length === 0) {
    return null
  }

  return (
    <PmSurface
      data-slot="pm-form-summary"
      variant="muted"
      className={cn('border-danger/30 bg-danger/5 p-4', className)}
      role="alert"
      aria-live="polite"
      {...props}
    >
      <div className="flex gap-3">
        <AlertCircle className="size-5 shrink-0 text-danger" aria-hidden />
        <div className="min-w-0 space-y-2">
          <p className={cn(pmTypography.label, 'text-danger')}>{title}</p>
          <ul className={cn(pmTypography.bodySm, 'list-inside list-disc space-y-1 text-danger/90')}>
            {items.map((msg, i) => (
              <li key={i}>{msg}</li>
            ))}
          </ul>
        </div>
      </div>
    </PmSurface>
  )
}
