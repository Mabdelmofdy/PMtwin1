import type { ValidationIssue } from '@pm-twin/validation'
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'
import { PmBadge } from '@/components/ui/pm-badge'
import { PmButton } from '@/components/ui/pm-button'
import { OcxSummaryCard } from '@/components/opportunity/ocx/ocx-summary-card.tsx'
import { resolveStepForValidationIssue } from '@/domain/opportunity-validation/validation-step-map.ts'
import type { WizardStepId } from '@/components/opportunity/wizard/wizard-steps.ts'
import { CollaborationSummaryCard } from '@/components/opportunity/collaboration-summary-card.tsx'

export type SmartRightPanelProps = {
  readonly statusLabel: string
  readonly issues: readonly ValidationIssue[]
  readonly readinessScore: number
  readonly readinessTimeline: readonly number[]
  readonly nextActionLabel: string
  readonly nextActionStepId?: WizardStepId
  readonly publishReady: boolean
  readonly publishBlockedWhy?: string
  readonly summary: {
    readonly skills: number
    readonly packages: number
    readonly budgetLabel: string
    readonly timelineLabel: string
  }
  readonly collaboration: {
    readonly intent?: string
    readonly mainModel?: string
    readonly subModel?: string
    readonly exchangeMode?: string
    readonly topology?: string
    readonly relationshipLabel?: string
    readonly readyToPublish?: boolean
  }
  readonly onNavigateIssue: (stepId: WizardStepId, fieldPath?: string) => void
  readonly onNextAction: (stepId: WizardStepId) => void
}

/**
 * Single sticky Smart Right Panel — status, validation, one readiness score,
 * one next action, publish gate, compact summary. No duplicated readiness cards.
 */
export function SmartRightPanel({
  statusLabel,
  issues,
  readinessScore,
  readinessTimeline,
  nextActionLabel,
  nextActionStepId,
  publishReady,
  publishBlockedWhy,
  summary,
  collaboration,
  onNavigateIssue,
  onNextAction,
}: SmartRightPanelProps) {
  const errors = issues.filter(
    (i) => i.severity === 'error' || i.severity === 'blocker',
  )
  const warnings = issues.filter((i) => i.severity === 'warning')
  const clickable = [...errors, ...warnings].slice(0, 8)

  return (
    <div
      className="space-y-3"
      data-testid="smart-right-panel"
      aria-label="Opportunity creation assistant"
    >
      <OcxSummaryCard
        title="Opportunity status"
        why="Know whether you are still drafting or ready to publish from the detail page."
        state="normal"
        testId="ocx-status-card"
      >
        <PmBadge tone="info" size="sm">
          {statusLabel}
        </PmBadge>
      </OcxSummaryCard>

      <OcxSummaryCard
        title="Validation"
        description={`${errors.length} error${errors.length === 1 ? '' : 's'} · ${warnings.length} warning${warnings.length === 1 ? '' : 's'}`}
        why="Validation confirms data correctness. Click an issue to jump to the step that needs attention."
        state={issues.length === 0 ? 'empty' : 'normal'}
        emptyTitle="No issues yet"
        emptyDescription="Keep filling the wizard — live validation appears as you edit."
        testId="ocx-validation-card"
      >
        <ul className="space-y-1.5">
          {clickable.map((issue) => {
            const stepId = resolveStepForValidationIssue(issue)
            const Icon =
              issue.severity === 'warning' ? AlertTriangle : XCircle
            const tone =
              issue.severity === 'warning' ? 'text-warning' : 'text-danger'
            return (
              <li key={`${issue.code}-${issue.fieldPaths.join('-')}`}>
                <button
                  type="button"
                  className={cn(
                    'flex w-full items-start gap-2 rounded-md px-1 py-1 text-start hover:bg-surface-muted',
                    tone,
                  )}
                  onClick={() =>
                    onNavigateIssue(stepId, issue.fieldPaths[0])
                  }
                >
                  <Icon className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  <span className={cn(pmTypography.caption)}>
                    <span className="font-medium">{issue.message}</span>
                    <span className="mt-0.5 block text-muted-foreground">
                      Go to {stepId} step →
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </OcxSummaryCard>

      <OcxSummaryCard
        title="Readiness"
        why="Readiness measures how complete the opportunity is for matching — separate from validation."
        state="normal"
        testId="ocx-readiness-card"
      >
        <div className="flex items-baseline gap-2">
          <span className={cn(pmTypography.display, 'tabular-nums')}>
            {Math.round(readinessScore)}%
          </span>
          {publishReady ? (
            <span className="inline-flex items-center gap-1 text-success">
              <CheckCircle2 className="size-3.5" aria-hidden />
              <span className={pmTypography.caption}>Publish threshold met</span>
            </span>
          ) : null}
        </div>
        {readinessTimeline.length > 1 ? (
          <p
            className={cn(pmTypography.caption, 'mt-2 text-muted-foreground')}
            data-testid="readiness-timeline"
            aria-label="Session readiness history"
          >
            Session:{' '}
            {readinessTimeline.map((s) => `${Math.round(s)}%`).join(' → ')}
          </p>
        ) : null}
      </OcxSummaryCard>

      <OcxSummaryCard
        title="Next best action"
        why="One clear action is faster than a long checklist."
        state="normal"
        testId="ocx-nba-card"
        action={
          nextActionStepId ? (
            <PmButton
              type="button"
              size="sm"
              onClick={() => onNextAction(nextActionStepId)}
            >
              {nextActionLabel}
            </PmButton>
          ) : (
            <p className={cn(pmTypography.bodySm)}>{nextActionLabel}</p>
          )
        }
      />

      <OcxSummaryCard
        title="Publish"
        why="Publishing happens from the opportunity detail page after you save this draft."
        state="normal"
        testId="ocx-publish-card"
      >
        {publishReady ? (
          <p className={cn(pmTypography.bodySm, 'text-success')}>
            Ready to publish from detail after you save.
          </p>
        ) : (
          <p className={cn(pmTypography.bodySm, 'text-warning')}>
            Blocked — {publishBlockedWhy ?? 'complete required fields and raise readiness.'}
          </p>
        )}
      </OcxSummaryCard>

      <OcxSummaryCard
        title="Summary"
        why="A quick scan of what you have entered so far."
        state="normal"
        testId="ocx-summary-card"
      >
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <dt className="text-muted-foreground">Skills</dt>
            <dd className="font-medium">{summary.skills}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Packages</dt>
            <dd className="font-medium">{summary.packages}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Budget</dt>
            <dd className="font-medium">{summary.budgetLabel}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Timeline</dt>
            <dd className="font-medium">{summary.timelineLabel}</dd>
          </div>
        </dl>
      </OcxSummaryCard>

      <CollaborationSummaryCard
        compact
        intent={collaboration.intent}
        mainModelLabel={collaboration.mainModel}
        subModelLabel={collaboration.subModel}
        exchangeModeLabel={collaboration.exchangeMode}
        topologyLabel={collaboration.topology}
        relationshipLabel={collaboration.relationshipLabel}
        readyToPublish={collaboration.readyToPublish}
      />
    </div>
  )
}
