import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { PmButton } from '@/components/ui/pm-button'
import { PmSurface } from '@/components/ui/pm-surface'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'

export function DraftRecoveryBanner({
  savedAtLabel,
  onContinue,
  onDiscard,
}: {
  readonly savedAtLabel: string
  readonly onContinue: () => void
  readonly onDiscard: () => void
}) {
  return (
    <PmSurface
      variant="elevated"
      className="mb-4 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
      data-testid="draft-recovery-banner"
      role="status"
    >
      <div>
        <p className={cn(pmTypography.label)}>Recover unsaved local draft?</p>
        <p className={cn(pmTypography.caption, 'text-muted-foreground')}>
          A local autosave from {savedAtLabel || 'this session'} is available.
          Final save still requires Save Draft.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <PmButton type="button" size="sm" onClick={onContinue}>
          Continue draft
        </PmButton>
        <PmButton type="button" size="sm" variant="outline" onClick={onDiscard}>
          Discard
        </PmButton>
      </div>
    </PmSurface>
  )
}

export function UnsavedChangesDialog({
  open,
  onStay,
  onLeave,
}: {
  readonly open: boolean
  readonly onStay: () => void
  readonly onLeave: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onStay()}>
      <DialogContent data-testid="unsaved-changes-dialog">
        <DialogHeader>
          <DialogTitle>Unsaved changes</DialogTitle>
          <DialogDescription>
            You have unsaved edits. Leave without saving to the server, or stay
            to continue editing. Local autosave may still be recoverable.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <PmButton type="button" variant="outline" onClick={onStay}>
            Stay
          </PmButton>
          <PmButton type="button" onClick={onLeave}>
            Leave
          </PmButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
