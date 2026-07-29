import type { ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'
import type { ValidationIssue } from '@pm-twin/validation'
import type { OpportunityDraft } from '@/components/opportunity/wizard/draft-model.ts'
import {
  WIZARD_STEPS,
  type WizardStepId,
} from '@/components/opportunity/wizard/wizard-steps.ts'
import { resolveStepForValidationIssue } from '@/domain/opportunity-validation/validation-step-map.ts'
import {
  buildCommercialStructureSummary,
  commercialComponentLabel,
  type CommercialComponent,
} from '@/domain/opportunity-commercial-structure'
import {
  resolveMainCollaborationModelLabel,
  resolveSubModelLabel,
} from '@/domain/collaboration/opportunity-collaboration.ts'
import { PmButton } from '@/components/ui/pm-button'
import { cn } from '@/lib/utils'
import { formatLocation, resolveScopeLabels } from '@/domain/locations'
import { pmTypography } from '@/tokens'

function reviewValue(value: string | number | boolean | null | undefined): string {
  if (value == null || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return String(value)
}

function deliveryMethodLabel(value: string | undefined): string {
  if (!value) return '—'
  const labels: Record<string, string> = {
    remote: 'Remote',
    on_site: 'On site',
    hybrid: 'Hybrid',
  }
  return labels[value] ?? value
}

function CommercialComponentReview({
  component,
}: {
  readonly component: CommercialComponent
}) {
  const lines: { label: string; value: string }[] = [
    { label: 'Title', value: component.title || commercialComponentLabel(component.type) },
    { label: 'Type', value: commercialComponentLabel(component.type) },
    {
      label: 'Applies to',
      value:
        component.appliesTo === 'entire_opportunity'
          ? 'Entire opportunity'
          : 'Selected work items',
    },
  ]

  if (component.type === 'cash') {
    lines.push(
      { label: 'Currency', value: reviewValue(component.currency) },
      { label: 'Budget type', value: reviewValue(component.budgetType) },
    )
    if (component.budgetType === 'fixed') {
      lines.push({
        label: 'Fixed amount',
        value:
          component.fixedAmount != null
            ? component.fixedAmount.toLocaleString('en-GB')
            : '—',
      })
    }
    if (component.budgetType === 'range') {
      lines.push({
        label: 'Range',
        value:
          component.minimumAmount != null || component.maximumAmount != null
            ? `${component.minimumAmount?.toLocaleString('en-GB') ?? '—'} – ${component.maximumAmount?.toLocaleString('en-GB') ?? '—'}`
            : '—',
      })
    }
    lines.push(
      {
        label: 'Advance',
        value:
          component.advancePercentage != null
            ? `${component.advancePercentage}%`
            : '—',
      },
      {
        label: 'Retention',
        value:
          component.retentionPercentage != null
            ? `${component.retentionPercentage}%`
            : '—',
      },
      {
        label: 'Payment schedule',
        value: component.paymentSchedule?.length
          ? `${component.paymentSchedule.length} milestone(s)`
          : '—',
      },
      { label: 'VAT handling', value: reviewValue(component.vatHandling) },
      { label: 'Payment terms', value: reviewValue(component.paymentTerms) },
    )
  }

  if (component.type === 'barter') {
    lines.push(
      { label: 'Offered', value: reviewValue(component.offeredAssetOrService) },
      {
        label: 'Requested',
        value: reviewValue(component.requestedAssetOrService),
      },
      {
        label: 'Estimated value',
        value:
          component.estimatedValue != null
            ? `${component.estimatedValue.toLocaleString('en-GB')} SAR`
            : '—',
      },
      {
        label: 'Valuation method',
        value: reviewValue(component.valuationMethod),
      },
      { label: 'Exchange ratio', value: reviewValue(component.exchangeRatio) },
      { label: 'Condition', value: reviewValue(component.condition) },
      {
        label: 'Delivery',
        value: reviewValue(
          component.deliveryLocation ?? component.deliveryDate,
        ),
      },
    )
  }

  if (component.type === 'profit_sharing') {
    lines.push(
      {
        label: 'Profit share',
        value:
          component.profitSharePercentage != null
            ? `${component.profitSharePercentage}% of ${component.grossOrNet ?? 'net'}`
            : '—',
      },
      {
        label: 'Settlement',
        value: reviewValue(component.settlementPeriod),
      },
      {
        label: 'Calculation basis',
        value: reviewValue(component.calculationBasis),
      },
    )
  }

  if (component.type === 'revenue_sharing') {
    lines.push(
      {
        label: 'Revenue share',
        value:
          component.revenueSharePercentage != null
            ? `${component.revenueSharePercentage}%`
            : '—',
      },
      {
        label: 'Revenue definition',
        value: reviewValue(component.revenueDefinition),
      },
    )
  }

  if (component.type === 'equity') {
    lines.push(
      {
        label: 'Equity',
        value:
          component.equityPercentage != null
            ? `${component.equityPercentage}%`
            : reviewValue(component.equityType),
      },
      {
        label: 'Entity',
        value: reviewValue(
          component.companyOrSpv === 'spv'
            ? 'SPV'
            : component.targetEntity,
        ),
      },
      { label: 'Share class', value: reviewValue(component.shareClass) },
    )
  }

  if (component.type === 'custom') {
    lines.push(
      { label: 'Description', value: reviewValue(component.description) },
      {
        label: 'Calculation',
        value: reviewValue(component.calculationMethod),
      },
    )
  }

  if (component.notes?.trim()) {
    lines.push({ label: 'Notes', value: component.notes.trim() })
  }

  return (
    <div className="mt-2 space-y-1 rounded-md border border-border/50 bg-surface px-3 py-2">
      {lines.map((line) => (
        <p key={`${component.id}-${line.label}`}>
          <span className="text-foreground">{line.label}:</span> {line.value}
        </p>
      ))}
    </div>
  )
}

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
        {draft.intent === 'offer' ? (
          <p>
            Capacity:{' '}
            {[
              draft.capacity?.availableCapacity != null
                ? `Available ${draft.capacity.availableCapacity}`
                : null,
              draft.capacity?.reservedCapacity != null
                ? `Reserved ${draft.capacity.reservedCapacity}`
                : null,
              draft.capacity?.maximumCapacity != null
                ? `Max ${draft.capacity.maximumCapacity}`
                : null,
              draft.capacity?.availableFrom
                ? `From ${draft.capacity.availableFrom}`
                : null,
            ]
              .filter(Boolean)
              .join(' · ') || '—'}
          </p>
        ) : null}
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
          Mode:{' '}
          {commercial.isHybrid
            ? `Hybrid (${commercial.componentLabels.join(' + ') || 'no components'})`
            : commercial.derivedExchangeMode}
        </p>
        {draft.commercialStructure.allocationMethod &&
        draft.commercialStructure.allocationMethod !== 'not_applicable' ? (
          <p>Allocation: {draft.commercialStructure.allocationMethod}</p>
        ) : null}
        {commercial.allocationLines.length > 0 &&
        draft.commercialStructure.allocationMethod !== 'not_applicable' ? (
          <ul className="mt-1 list-inside list-disc space-y-0.5">
            {commercial.allocationLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        ) : null}
        {draft.commercialStructure.components.filter((c) => c.enabled).length ===
        0 ? (
          <p>No components</p>
        ) : (
          draft.commercialStructure.components
            .filter((c) => c.enabled)
            .map((component) => (
              <CommercialComponentReview
                key={component.id}
                component={component}
              />
            ))
        )}
        {draft.commercialStructure.notes?.trim() ? (
          <p className="mt-2">Notes: {draft.commercialStructure.notes.trim()}</p>
        ) : null}
        {(draft.commercialStructure.constraints?.length ?? 0) > 0 ? (
          <div className="mt-2 space-y-1">
            <p className="font-medium text-foreground">Constraints</p>
            {draft.commercialStructure.constraints!.map((constraint) => (
              <p key={constraint.id}>
                {constraint.label ?? constraint.type}
                {constraint.value != null ? `: ${String(constraint.value)}` : ''}
              </p>
            ))}
          </div>
        ) : null}
      </ReviewSection>

      <ReviewSection
        title="Timeline and Location"
        onEdit={() => onEdit('scope_work', 'timeline')}
      >
        <p>Primary location: {formatLocation(draft.location) || '—'}</p>
        <p>
          Coverage areas:{' '}
          {draft.coverageAreas.length > 0
            ? resolveScopeLabels(draft.coverageAreas).join(', ')
            : '—'}
        </p>
        <p>
          Delivery method: {deliveryMethodLabel(draft.richTimeline.deliveryMethod)}
        </p>
        <p>
          Start date: {draft.startDate || '—'}
          {draft.intent === 'need'
            ? ` → Deadline: ${draft.tenderDeadline || '—'}`
            : ''}
        </p>
        <p>Duration: {draft.richTimeline.estimatedDuration || '—'}</p>
        <p>
          Must finish before: {draft.richTimeline.mustFinishBefore || '—'}
        </p>
        <p>Working days: {draft.richTimeline.workingDays || '—'}</p>
        <p>Shift: {draft.richTimeline.shiftType || '—'}</p>
        <p>
          Flexible start:{' '}
          {draft.richTimeline.flexibleStart ? 'Yes' : 'No'}
        </p>
        <p>
          Weekend allowed:{' '}
          {draft.richTimeline.weekendAllowed ? 'Yes' : 'No'}
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
