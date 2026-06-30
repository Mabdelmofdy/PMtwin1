import type { ComponentProps, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { pmSticky } from '@/components/shared/pm-layout-tokens'
import { PmButton } from '@/components/ui/pm-button'

export type PmFormActionsProps = ComponentProps<'div'> & {
  /** Primary submit — visual only */
  onSubmit?: () => void
  submitLabel?: string
  /** Save draft — visual only */
  onSaveDraft?: () => void
  saveDraftLabel?: string
  onCancel?: () => void
  cancelLabel?: string
  onDelete?: () => void
  deleteLabel?: string
  secondaryActions?: ReactNode
  loading?: boolean
  disabled?: boolean
  sticky?: boolean
  align?: 'start' | 'end' | 'between'
}

/** Sticky form action footer — Save Draft, Submit, Cancel, Delete slots. */
export function PmFormActions({
  onSubmit,
  submitLabel = 'Save',
  onSaveDraft,
  saveDraftLabel = 'Save draft',
  onCancel,
  cancelLabel = 'Cancel',
  onDelete,
  deleteLabel = 'Delete',
  secondaryActions,
  loading = false,
  disabled = false,
  sticky = true,
  align = 'between',
  className,
  children,
  ...props
}: PmFormActionsProps) {
  const isDisabled = disabled || loading

  return (
    <div
      data-slot="pm-form-actions"
      role="group"
      aria-label="Form actions"
      className={cn(
        'flex flex-col-reverse gap-2 sm:flex-row sm:items-center',
        align === 'end' && 'sm:justify-end',
        align === 'start' && 'sm:justify-start',
        align === 'between' && 'sm:justify-between',
        sticky && pmSticky.actionFooter,
        className,
      )}
      {...props}
    >
      <div className="flex flex-wrap items-center gap-2">
        {onDelete ? (
          <PmButton
            type="button"
            variant="ghost"
            size="sm"
            className="text-danger hover:text-danger"
            onClick={onDelete}
            disabled={isDisabled}
          >
            {deleteLabel}
          </PmButton>
        ) : null}
        {secondaryActions}
        {children}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        {onCancel ? (
          <PmButton
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isDisabled}
          >
            {cancelLabel}
          </PmButton>
        ) : null}
        {onSaveDraft ? (
          <PmButton
            type="button"
            variant="outline"
            size="sm"
            onClick={onSaveDraft}
            disabled={isDisabled}
          >
            {saveDraftLabel}
          </PmButton>
        ) : null}
        {onSubmit ? (
          <PmButton
            type="submit"
            size="sm"
            onClick={onSubmit}
            disabled={isDisabled}
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : null}
            {submitLabel}
          </PmButton>
        ) : null}
      </div>
    </div>
  )
}

export type PmFormActionsSlotProps = ComponentProps<'div'>

/** Custom action footer slot. */
export function PmFormActionsSlot({
  className,
  ...props
}: PmFormActionsSlotProps) {
  return (
    <div
      data-slot="pm-form-actions-slot"
      className={cn(pmSticky.actionFooter, className)}
      {...props}
    />
  )
}
