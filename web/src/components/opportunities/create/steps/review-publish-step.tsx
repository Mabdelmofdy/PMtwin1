import type { ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'
import type { ValidationIssue } from '@pm-twin/validation'
import type { OpportunityDraft } from '@/components/opportunity/wizard/draft-model.ts'
import {
  WIZARD_STEPS,
  type WizardStepId,
} from '@/components/opportunity/wizard/wizard-steps.ts'
import { resolveStepForValidationIssue } from '@/domain/opportunity-validation/validation-step-map.ts'
import { buildCommercialStructureSummary } from '@/domain/opportunity-commercial-structure'
import {
  resolveMainCollaborationModelLabel,
  resolveSubModelLabel,
} from '@/domain/collaboration/opportunity-collaboration.ts'
import { PmButton } from '@/components/ui/pm-button'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'

export type ReviewPublishStepProps = {
  draft: OpportunityDraft
  onEdit: (stepId: WizardStepId, sectionId?: string) => void
  /** Live validation issues — shown so red stepper tags have visible details. */
  validationIssues?: readonly ValidationIssue[]
}

function wizardStepLabel(stepId: WizardStepId): string {
  return WIZARD_STEPS.find((step) => step.id === stepId)?.label ?? stepId
}

function ReviewSection({
  title,
  onEdit,
  children,
}: {
  title: string
  onEdit: () => void
  children: ReactNode
}) {
  return (
    <details open className="rounded-lg border border-border p-4">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2">
        <span className={cn(pmTypography.label)}>{title}</span>
        <PmButton type="button" size="sm" variant="outline" onClick={onEdit}>
          Edit
        </PmButton>
      </summary>
      <div className="mt-3 space-y-1 text-sm text-muted-foreground">{children}</div>
    </details>
  )
}

export function ReviewPublishStep({
  draft,
  onEdit,
  validationIssues = [],
}: ReviewPublishStepProps) {
  const taskCount = draft.workPackages.reduce(
    (sum, pkg) => sum + (pkg.tasks?.length ?? 0),
    0,
  )
  const packageDeliverables = draft.workPackages.reduce(
    (sum, pkg) => sum + pkg.deliverables.length,
    0,
  )
  const commercial = buildCommercialStructureSummary(draft.commercialStructure)
  const blockingIssues = validationIssues.filter(
    (issue) => issue.severity === 'error' || issue.severity === 'blocker',
  )

  return (
    <div data-slot="review-publish-step" className="space-y-4">
      <div>
        <h2 className={cn(pmTypography.h2)}>Review & Publish</h2>
        <p className={cn(pmTypography.body, 'mt-1 text-muted-foreground')}>
          Confirm the opportunity executive summary before publish. This review mirrors what appears on Opportunity Details after save.
        </p>
      </div>

      {blockingIssues.length > 0 ? (
        <div
          className="space-y-3 rounded-lg border border-danger/30 bg-danger/5 p-4"
          data-slot="review-validation-details"
          role="alert"
          aria-live="polite"
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 size-5 shrink-0 text-danger" aria-hidden />
            <div>
              <p className={cn(pmTypography.label, 'text-danger')}>
                Fix these issues before publishing
              </p>
              <p className={cn(pmTypography.caption, 'mt-0.5 text-muted-foreground')}>
                Red step markers match the items below. Click an issue to jump to that step.
              </p>
            </div>
          </div>
          <ul className="space-y-1.5">
            {blockingIssues.map((issue) => {
              const stepId = resolveStepForValidationIssue(issue)
              return (
                <li key={`${issue.code}-${issue.fieldPaths.join('-')}-${issue.message}`}>
                  <button
                    type="button"
                    className={cn(
                      'flex w-full items-start gap-2 rounded-md border border-danger/20 bg-surface px-3 py-2 text-start',
                      'hover:bg-danger/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    )}
                    onClick={() => onEdit(stepId)}
                  >
                    <span className="min-w-0">
                      <span className={cn(pmTypography.bodySm, 'font-medium text-danger')}>
                        {issue.message}
                      </span>
                      <span
                        className={cn(
                          pmTypography.caption,
                          'mt-0.5 block text-muted-foreground',
                        )}
                      >
                        Go to {wizardStepLabel(stepId)} →
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}

      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
        <p className={cn(pmTypography.label, 'text-foreground')}>Executive summary</p>
        <p className={cn(pmTypography.h3, 'mt-1')}>{draft.title || 'Untitled opportunity'}</p>
        <p className={cn(pmTypography.bodySm, 'mt-1 text-muted-foreground')}>
          {[
            draft.intent,
            draft.mainCollaborationModel
              ? resolveMainCollaborationModelLabel(draft.mainCollaborationModel)
              : null,
            draft.subModelType ? resolveSubModelLabel(draft.subModelType) : null,
            commercial.isHybrid ? 'Hybrid' : commercial.derivedExchangeMode,
            draft.location,
          ]
            .filter(Boolean)
            .join(' · ') || 'Complete the steps above to build this summary.'}
        </p>
        <p className={cn(pmTypography.caption, 'mt-2 text-muted-foreground')}>
          {draft.workPackages.length} Work Packages · {taskCount} Tasks ·{' '}
          {draft.deliverables.length + packageDeliverables} Deliverables ·{' '}
          {draft.milestones.length} Milestones
        </p>
      </div>

      <ReviewSection title="Opportunity Summary" onEdit={() => onEdit('opportunity')}>
        <p>Post type: {draft.intent || '—'}</p>
        <p>Title: {draft.title || '—'}</p>
        <p>Description: {draft.description || '—'}</p>
        <p>Category: {draft.sector || '—'}</p>
        <p>Target role: {draft.targetRole || '—'}</p>
        <p>Location: {draft.location || '—'}</p>
        <p>
          Dates: {draft.startDate || '—'} → {draft.tenderDeadline || '—'}
        </p>
      </ReviewSection>

      <ReviewSection title="Collaboration" onEdit={() => onEdit('collaboration')}>
        <p>
          Main model:{' '}
          {draft.mainCollaborationModel
            ? resolveMainCollaborationModelLabel(draft.mainCollaborationModel)
            : '—'}
        </p>
        <p>
          Sub-model:{' '}
          {draft.subModelType ? resolveSubModelLabel(draft.subModelType) : '—'}
        </p>
        <p>Derived exchange mode: {draft.exchangeMode || '—'}</p>
      </ReviewSection>

      <ReviewSection
        title="Scope and Requirements"
        onEdit={() => onEdit('scope_work', 'requirements')}
      >
        <p>Skills: {draft.structuredSkills.map((s) => s.name).filter(Boolean).join(', ') || '—'}</p>
        <p>Services: {draft.services || '—'}</p>
        <p>Experience: {draft.experienceLevel || '—'}</p>
        <p>Certifications: {draft.certificationsText || '—'}</p>
        <p>Team size: {draft.teamSize || '—'}</p>
        <p>Preferred partner: {draft.preferredPartnerType || '—'}</p>
        <p>
          Resources:{' '}
          {draft.resources?.length
            ? draft.resources.map((r) => r.name).filter(Boolean).join(', ')
            : '—'}
        </p>
        <p>
          Capacity:{' '}
          {[
            draft.capacity?.availableCapacity != null
              ? `Available ${draft.capacity.availableCapacity}`
              : null,
            draft.capacity?.maximumCapacity != null
              ? `Max ${draft.capacity.maximumCapacity}`
              : null,
          ]
            .filter(Boolean)
            .join(' · ') || '—'}
        </p>
      </ReviewSection>

      <ReviewSection
        title="Work Packages and Tasks"
        onEdit={() => onEdit('scope_work', 'work-packages')}
      >
        <p>
          {draft.workPackages.length} Work Packages · {taskCount} Tasks ·{' '}
          {draft.deliverables.length + packageDeliverables} Deliverables ·{' '}
          {draft.milestones.length} Milestones
        </p>
        <ul className="mt-2 space-y-1">
          {draft.workPackages.map((pkg) => (
            <li key={pkg.id}>
              {pkg.title || 'Untitled package'}
              {pkg.tasks?.length ? ` (${pkg.tasks.length} tasks)` : ''}
            </li>
          ))}
        </ul>
      </ReviewSection>

      <ReviewSection
        title="Commercial Structure"
        onEdit={() => onEdit('commercial')}
      >
        <p>
          {commercial.isHybrid ? 'Hybrid' : commercial.derivedExchangeMode} —{' '}
          {commercial.componentLabels.join(' + ') || 'No components'}
        </p>
        {commercial.allocationLines.map((line) => (
          <p key={line}>{line}</p>
        ))}
        {(() => {
          const cash = draft.commercialStructure.components.find((c) => c.type === 'cash' && c.enabled)
          if (!cash || cash.type !== 'cash') return null
          return (
            <>
              <p className="mt-2 font-medium text-foreground">Payment</p>
              <p>Currency: {cash.currency || '—'}</p>
              <p>Budget type: {cash.budgetType || '—'}</p>
              {cash.budgetType === 'fixed' ? (
                <p>
                  Fixed amount:{' '}
                  {cash.fixedAmount != null ? cash.fixedAmount.toLocaleString() : '—'}
                </p>
              ) : null}
              {cash.budgetType === 'range' ? (
                <p>
                  Range:{' '}
                  {cash.minimumAmount != null || cash.maximumAmount != null
                    ? `${cash.minimumAmount?.toLocaleString() ?? '—'} – ${cash.maximumAmount?.toLocaleString() ?? '—'}`
                    : '—'}
                </p>
              ) : null}
              <p>Advance: {cash.advancePercentage != null ? `${cash.advancePercentage}%` : '—'}</p>
              <p>Retention: {cash.retentionPercentage != null ? `${cash.retentionPercentage}%` : '—'}</p>
              <p>
                Schedule:{' '}
                {cash.paymentSchedule?.length
                  ? `${cash.paymentSchedule.length} milestone(s)`
                  : '—'}
              </p>
            </>
          )
        })()}
      </ReviewSection>

      <ReviewSection
        title="Timeline and Location"
        onEdit={() => onEdit('scope_work', 'timeline')}
      >
        <p>Primary location: {draft.location || '—'}</p>
        <p>Service area: {draft.serviceArea || '—'}</p>
        <p>Delivery method: {draft.richTimeline.deliveryMethod || '—'}</p>
        <p>Duration: {draft.richTimeline.estimatedDuration || '—'}</p>
        <p>Working days: {draft.richTimeline.workingDays || '—'}</p>
        <p>Shift: {draft.richTimeline.shiftType || '—'}</p>
        <p>
          Flexible start:{' '}
          {draft.richTimeline.flexibleStart == null
            ? '—'
            : draft.richTimeline.flexibleStart
              ? 'Yes'
              : 'No'}
        </p>
      </ReviewSection>

      <ReviewSection
        title="Documents and Compliance"
        onEdit={() => onEdit('scope_work', 'documents-compliance')}
      >
        <p>Attachments: {draft.attachmentsText || '—'}</p>
        <p>Portfolio: {draft.portfolioText || '—'}</p>
        <p>Compliance: {draft.complianceRequirementsText || '—'}</p>
      </ReviewSection>
    </div>
  )
}
