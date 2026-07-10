import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'
import {
  PmCard,
  PmCardContent,
  PmCardDescription,
  PmCardHeader,
  PmCardTitle,
} from '@/components/ui/pm-card'
import { PmEmptyState } from '@/components/ui/pm-empty-state'

export type SummaryCardState = 'loading' | 'empty' | 'normal' | 'error'

export type OcxSummaryCardProps = {
  readonly title: string
  readonly description?: string
  readonly state?: SummaryCardState
  readonly emptyTitle?: string
  readonly emptyDescription?: string
  readonly errorMessage?: string
  readonly why?: string
  readonly action?: ReactNode
  readonly children?: ReactNode
  readonly className?: string
  readonly testId?: string
}

/**
 * Reusable summary card shell with Loading / Empty / Normal / Error states.
 * Compose with PM design primitives only.
 */
export function OcxSummaryCard({
  title,
  description,
  state = 'normal',
  emptyTitle = 'Nothing here yet',
  emptyDescription,
  errorMessage = 'Something went wrong loading this summary.',
  why,
  action,
  children,
  className,
  testId,
}: OcxSummaryCardProps) {
  return (
    <PmCard
      composed
      className={cn(className)}
      data-testid={testId}
      data-state={state}
    >
      <PmCardHeader>
        <PmCardTitle className="text-base">{title}</PmCardTitle>
        {description ? (
          <PmCardDescription>{description}</PmCardDescription>
        ) : null}
        {why ? (
          <p className={cn(pmTypography.caption, 'mt-1 text-muted-foreground')}>
            Why it matters: {why}
          </p>
        ) : null}
      </PmCardHeader>
      <PmCardContent>
        {state === 'loading' ? (
          <p className={cn(pmTypography.bodySm, 'text-muted-foreground')} aria-live="polite">
            Loading…
          </p>
        ) : null}
        {state === 'empty' ? (
          <PmEmptyState
            title={emptyTitle}
            description={emptyDescription ?? 'Add details in the wizard to populate this summary.'}
            className="py-4"
          />
        ) : null}
        {state === 'error' ? (
          <p className={cn(pmTypography.bodySm, 'text-danger')} role="alert">
            {errorMessage}
          </p>
        ) : null}
        {state === 'normal' ? children : null}
        {action && state !== 'loading' ? (
          <div className="mt-3">{action}</div>
        ) : null}
      </PmCardContent>
    </PmCard>
  )
}
