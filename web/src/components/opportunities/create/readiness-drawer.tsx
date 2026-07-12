import { useEffect } from 'react'
import { X } from 'lucide-react'
import { PmButton } from '@/components/ui/pm-index'
import { ReadinessIssueList } from './readiness-issue-list.tsx'
import type { ReadinessUserMessage } from '@/presentation/readiness'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'

export type ReadinessDrawerProps = {
  open: boolean
  onClose: () => void
  required: readonly ReadinessUserMessage[]
  recommended: readonly ReadinessUserMessage[]
  completed: readonly ReadinessUserMessage[]
  onIssueClick: (issue: ReadinessUserMessage) => void
}

export function ReadinessDrawer({
  open,
  onClose,
  required,
  recommended,
  completed,
  onIssueClick,
}: ReadinessDrawerProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      data-slot="readiness-drawer"
      className="fixed inset-0 z-40 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Opportunity readiness details"
    >
      <button
        type="button"
        className="absolute inset-0 bg-foreground/20"
        aria-label="Close readiness details"
        onClick={onClose}
      />
      <aside
        className={cn(
          'relative z-10 flex h-full w-full max-w-md flex-col border-s border-border bg-background shadow-lg',
          'sm:max-w-sm',
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className={cn(pmTypography.h3)}>Opportunity Readiness</h2>
          <PmButton type="button" variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            <X className="size-4" />
          </PmButton>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <ReadinessIssueList
            required={required}
            recommended={recommended}
            completed={completed}
            onIssueClick={(issue) => {
              onIssueClick(issue)
              onClose()
            }}
          />
        </div>
      </aside>
    </div>
  )
}
