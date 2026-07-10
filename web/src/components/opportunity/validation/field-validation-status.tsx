import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'
import type { OpportunityValidationLiveState } from '@/domain/opportunity-validation/index.ts'

const LABELS: Record<OpportunityValidationLiveState, string> = {
  valid: 'Valid',
  warning: 'Warning',
  error: 'Error',
}

/**
 * Per-field live validation chrome. Never displays VAL_* codes.
 * Empty untouched valid fields stay quiet; warnings/errors always show.
 */
export function FieldValidationStatus({
  state,
  messages,
  hasValue = false,
  className,
}: {
  readonly state: OpportunityValidationLiveState
  readonly messages?: readonly string[]
  readonly hasValue?: boolean
  readonly className?: string
}) {
  if (state === 'valid' && !hasValue) return null

  const Icon =
    state === 'valid' ? CheckCircle2 : state === 'warning' ? AlertTriangle : XCircle
  const tone =
    state === 'valid'
      ? 'text-success'
      : state === 'warning'
        ? 'text-warning'
        : 'text-danger'
  const safeMessages = (messages ?? []).filter((m) => !m.includes('VAL_'))

  return (
    <div
      className={cn('mt-1 space-y-0.5', className)}
      data-testid="field-validation-status"
      data-state={state}
      aria-live="polite"
    >
      <div className={cn('flex items-center gap-1.5', tone)}>
        <Icon className="size-3.5 shrink-0" aria-hidden />
        <span className={cn(pmTypography.caption, 'font-medium')}>
          {LABELS[state]}
          {safeMessages[0] ? ` — ${safeMessages[0]}` : state === 'valid' ? ' — looks good.' : ''}
        </span>
      </div>
      {safeMessages.slice(1).map((msg) => (
        <p key={msg} className={cn(pmTypography.caption, 'ps-5 text-muted-foreground')}>
          {msg}
        </p>
      ))}
    </div>
  )
}

/** Bind a live validation field path to FieldValidationStatus. */
export function LiveFieldStatus({
  view,
  hasValue,
  className,
}: {
  readonly view: {
    readonly state: OpportunityValidationLiveState
    readonly messages: readonly string[]
  }
  readonly hasValue?: boolean
  readonly className?: string
}) {
  return (
    <FieldValidationStatus
      state={view.state}
      messages={view.messages}
      hasValue={hasValue}
      className={className}
    />
  )
}
