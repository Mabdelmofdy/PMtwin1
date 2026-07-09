import type { ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'
import { PmButton } from '@/components/ui/pm-button'
import { PmSurface } from '@/components/ui/pm-surface'

export type PmTableErrorProps = {
  title?: string
  description?: string
  retryAction?: ReactNode
  onRetry?: () => void
  className?: string
}

/** Table error state with optional retry slot — no retry implementation. */
export function PmTableError({
  title = 'Unable to load data',
  description = 'Something went wrong while loading this list. Please try again.',
  retryAction,
  onRetry,
  className,
}: PmTableErrorProps) {
  return (
    <PmSurface
      data-slot="pm-table-error"
      variant="muted"
      className={cn(
        'flex flex-col items-center justify-center border-dashed px-6 py-12 text-center',
        className,
      )}
      role="alert"
    >
      <AlertCircle className="mb-4 size-10 text-danger" aria-hidden />
      <h3 className={pmTypography.h3}>{title}</h3>
      {description ? (
        <p className={cn(pmTypography.bodySm, 'mt-2 max-w-md text-muted-foreground')}>
          {description}
        </p>
      ) : null}
      {retryAction ?? (onRetry ? (
        <PmButton
          type="button"
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={onRetry}
        >
          Try again
        </PmButton>
      ) : null)}
    </PmSurface>
  )
}

export type PmTableErrorSlotProps = {
  children?: ReactNode
  className?: string
}

/** Custom error slot. */
export function PmTableErrorSlot({ children, className }: PmTableErrorSlotProps) {
  return (
    <div data-slot="pm-table-error-slot" className={className}>
      {children}
    </div>
  )
}
