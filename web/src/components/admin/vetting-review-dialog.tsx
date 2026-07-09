import { useId, useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { PmButton } from '@/components/ui/pm-index'
import { pmTypography } from '@/tokens'
import { cn } from '@/lib/utils'

type VettingReviewAction = 'approve' | 'reject' | 'request_changes'

const REVIEW_DECISIONS: readonly { id: VettingReviewAction; label: string }[] = [
  { id: 'approve', label: 'Approve' },
  { id: 'reject', label: 'Reject' },
  { id: 'request_changes', label: 'Request Changes' },
]

export type VettingReviewDialogSubmit = {
  action: VettingReviewAction
  reviewNotes: string
  requestedItems: string[]
  dueDate?: string
}

type VettingReviewDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  userLabel: string
  onSubmit: (payload: VettingReviewDialogSubmit) => void
}

const REQUESTED_ITEM_OPTIONS = [
  'CR expired',
  'VAT certificate missing',
  'License missing',
  'Insurance missing',
  'Complete company address',
  'Add at least 3 skills',
] as const

export function VettingReviewDialog({
  open,
  onOpenChange,
  userLabel,
  onSubmit,
}: VettingReviewDialogProps) {
  const [action, setAction] = useState<VettingReviewAction>('approve')
  const [reviewNotes, setReviewNotes] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [requestedItems, setRequestedItems] = useState<string[]>([])
  const reviewNotesId = useId()
  const dueDateId = useId()

  const isRequestChanges = action === 'request_changes'
  const isReject = action === 'reject'

  const title = useMemo(() => {
    if (isRequestChanges) return 'Request changes'
    if (isReject) return 'Reject submission'
    return 'Approve submission'
  }, [isRequestChanges, isReject])

  function toggleRequestedItem(item: string) {
    setRequestedItems((current) =>
      current.includes(item)
        ? current.filter((entry) => entry !== item)
        : [...current, item],
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Review onboarding for {userLabel}. This updates vetting status and audit timeline.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div
            className="flex flex-wrap gap-2"
            role="radiogroup"
            aria-label="Review decision"
          >
            {REVIEW_DECISIONS.map((option) => (
              <PmButton
                key={option.id}
                type="button"
                variant={action === option.id ? 'default' : 'outline'}
                size="sm"
                role="radio"
                aria-checked={action === option.id}
                tabIndex={action === option.id ? 0 : -1}
                onClick={() => setAction(option.id)}
              >
                {option.label}
              </PmButton>
            ))}
          </div>

          <div>
            <label htmlFor={reviewNotesId} className={cn(pmTypography.bodySm, 'mb-1 block font-medium')}>
              Review Notes
            </label>
            <Textarea
              id={reviewNotesId}
              value={reviewNotes}
              onChange={(event) => setReviewNotes(event.target.value)}
              placeholder="Review notes"
            />
          </div>

          {isRequestChanges ? (
            <>
              <fieldset>
                <legend className={cn(pmTypography.bodySm, 'mb-2 font-medium')}>
                  Requested Items
                </legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {REQUESTED_ITEM_OPTIONS.map((option) => (
                    <label
                      key={option}
                      className="flex items-center gap-2 rounded border px-2 py-1 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={requestedItems.includes(option)}
                        onChange={() => toggleRequestedItem(option)}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <div>
                <label htmlFor={dueDateId} className={cn(pmTypography.bodySm, 'mb-1 block font-medium')}>
                  Due Date
                </label>
                <Input
                  id={dueDateId}
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                />
              </div>
            </>
          ) : null}
        </div>

        <DialogFooter>
          <PmButton
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </PmButton>
          <PmButton
            onClick={() =>
              onSubmit({
                action,
                reviewNotes,
                requestedItems,
                dueDate: dueDate || undefined,
              })
            }
          >
            Confirm
          </PmButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
