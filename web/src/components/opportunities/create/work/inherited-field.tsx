import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'
import type { InheritedValueSource } from '@/domain/opportunity-creation'

const SOURCE_LABEL: Record<InheritedValueSource, string> = {
  own: 'Custom override',
  opportunity: 'Inherited from Opportunity',
  workPackage: 'Inherited from Work Package',
  none: 'Not set',
}

export type InheritedFieldProps = {
  label: string
  required?: boolean
  /** Effective display string (dates, location, skill CSV, etc.). */
  displayValue: string
  isOverridden: boolean
  source: InheritedValueSource
  /** Called when Override is toggled on — parent should seed with inherited value. */
  onOverride: () => void
  /** Called when Override is toggled off — parent should clear to inherit. */
  onClearOverride: () => void
  /** Shown only when isOverridden. */
  children?: ReactNode
  error?: string | null
  /** Optional hint under the read-only value. */
  hint?: ReactNode
}

/**
 * Read-only inherited value with optional Override that reveals children.
 * Toggling off clears the child so inheritance resumes.
 */
export function InheritedField({
  label,
  required = false,
  displayValue,
  isOverridden,
  source,
  onOverride,
  onClearOverride,
  children,
  error,
  hint,
}: InheritedFieldProps) {
  const badge = SOURCE_LABEL[source]
  const shown = displayValue.trim() || '—'

  return (
    <div data-slot="inherited-field" className="space-y-1.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className={cn(pmTypography.caption, 'text-muted-foreground')}>
          {label}
          {required ? (
            <span className="ms-0.5 text-danger" aria-hidden>
              *
            </span>
          ) : null}
        </label>
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={isOverridden}
            onChange={(e) => {
              if (e.target.checked) onOverride()
              else onClearOverride()
            }}
          />
          Override
        </label>
      </div>
      {!isOverridden ? (
        <div className="rounded-md border border-border/60 bg-muted/30 px-3 py-2">
          <p className={cn(pmTypography.bodySm)}>{shown}</p>
          <p className={cn(pmTypography.caption, 'mt-0.5 text-muted-foreground')}>
            {badge}
          </p>
          {hint}
        </div>
      ) : (
        <div className="space-y-1">{children}</div>
      )}
      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
