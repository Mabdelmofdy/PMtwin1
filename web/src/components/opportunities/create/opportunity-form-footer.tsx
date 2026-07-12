import { PmButton } from '@/components/ui/pm-index'
import { OpportunityAutosaveStatus } from './opportunity-autosave-status.tsx'
import type { AutosaveStatus } from '@/lib/wizard-local-draft.ts'
import { pmWizardSticky } from '@/tokens/layers/layout.ts'
import { cn } from '@/lib/utils'
import type { WizardStepId } from '@/components/opportunity/wizard/wizard-steps.ts'

export type OpportunityFormFooterProps = {
  activeStepId: WizardStepId
  saving?: boolean
  publishing?: boolean
  autosaveStatus: AutosaveStatus
  lastSavedAt: string | null
  onBackOrCancel: () => void
  onSaveDraft: () => void
  onContinue: () => void
  onPublish?: () => void
  className?: string
}

export function OpportunityFormFooter({
  activeStepId,
  saving = false,
  publishing = false,
  autosaveStatus,
  lastSavedAt,
  onBackOrCancel,
  onSaveDraft,
  onContinue,
  onPublish,
  className,
}: OpportunityFormFooterProps) {
  const isFirst = activeStepId === 'opportunity'
  const isReview = activeStepId === 'review'

  return (
    <div
      data-slot="opportunity-form-footer"
      className={cn(
        pmWizardSticky.footer,
        '-mx-[var(--pm-space-page-x)] px-[var(--pm-space-page-x)] py-3',
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <PmButton
            type="button"
            variant="outline"
            onClick={onBackOrCancel}
            disabled={saving || publishing}
          >
            {isFirst ? 'Cancel' : 'Back'}
          </PmButton>
          <OpportunityAutosaveStatus
            status={autosaveStatus}
            lastSavedAt={lastSavedAt}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PmButton
            type="button"
            variant="secondary"
            onClick={onSaveDraft}
            disabled={saving || publishing}
          >
            {saving ? 'Saving…' : 'Save Draft'}
          </PmButton>
          {isReview ? (
            <PmButton
              type="button"
              onClick={onPublish}
              disabled={saving || publishing}
            >
              {publishing ? 'Publishing…' : 'Publish Opportunity'}
            </PmButton>
          ) : (
            <PmButton type="button" onClick={onContinue} disabled={saving}>
              Continue
            </PmButton>
          )}
        </div>
      </div>
    </div>
  )
}
