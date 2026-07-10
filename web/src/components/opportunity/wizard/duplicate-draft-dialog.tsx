import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { PmButton } from '@/components/ui/pm-button'

export type DuplicateDraftDialogProps = {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly onOpenExisting: () => void
  readonly onCreateNew: () => void
  readonly onDuplicateAnyway: () => void
}

/**
 * Similar-draft warning — never auto-blocks creation.
 */
export function DuplicateDraftDialog({
  open,
  onOpenChange,
  onOpenExisting,
  onCreateNew,
  onDuplicateAnyway,
}: DuplicateDraftDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="duplicate-draft-dialog">
        <DialogHeader>
          <DialogTitle>Similar draft found</DialogTitle>
          <DialogDescription>
            A similar draft opportunity already exists. You can open it, continue
            creating a new draft, or duplicate anyway.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <PmButton type="button" variant="outline" onClick={onOpenExisting}>
            Open existing draft
          </PmButton>
          <PmButton type="button" variant="outline" onClick={onCreateNew}>
            Create new draft
          </PmButton>
          <PmButton type="button" onClick={onDuplicateAnyway}>
            Duplicate anyway
          </PmButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
