import type { AutosaveStatus } from '@/lib/wizard-local-draft.ts'
import { formatLastSavedAt } from '@/lib/wizard-local-draft.ts'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'

export type OpportunityAutosaveStatusProps = {
  status: AutosaveStatus
  lastSavedAt: string | null
  className?: string
}

export function OpportunityAutosaveStatus({
  status,
  lastSavedAt,
  className,
}: OpportunityAutosaveStatusProps) {
  let label = ''
  if (status === 'saving') label = 'Saving…'
  else if (status === 'saved' && lastSavedAt) {
    label = `Saved ${formatLastSavedAt(lastSavedAt)}`
  } else if (status === 'error') label = 'Autosave failed'
  if (!label) return null
  return (
    <p
      className={cn(pmTypography.caption, 'text-muted-foreground', className)}
      aria-live="polite"
      data-slot="opportunity-autosave-status"
    >
      {label}
    </p>
  )
}
