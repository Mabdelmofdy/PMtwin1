import type { ReactNode } from 'react'
import type { OpportunityDraft } from '@/components/opportunity/wizard/draft-model.ts'
import type { WizardStepId } from '@/components/opportunity/wizard/wizard-steps.ts'
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

export function ReviewPublishStep({ draft, onEdit }: ReviewPublishStepProps) {
  const taskCount = draft.workPackages.reduce(
    (sum, pkg) => sum + (pkg.tasks?.length ?? 0),
    0,
  )
  const packageDeliverables = draft.workPackages.reduce(
    (sum, pkg) => sum + pkg.deliverables.length,
    0,
  )
  const commercial = buildCommercialStructureSummary(draft.commercialStructure)

  return (
    <div data-slot="review-publish-step" className="space-y-4">
      <div>
        <h2 className={cn(pmTypography.h2)}>Review & Publish</h2>
        <p className={cn(pmTypography.body, 'mt-1 text-muted-foreground')}>
          Confirm the opportunity, then save as draft or publish when ready.
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
        <p>Preferred partner: {draft.preferredPartnerType || '—'}</p>
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
      </ReviewSection>

      <ReviewSection
        title="Timeline and Location"
        onEdit={() => onEdit('scope_work', 'timeline')}
      >
        <p>Location: {draft.location || '—'}</p>
        <p>Service area: {draft.serviceArea || '—'}</p>
        <p>Duration: {draft.richTimeline.estimatedDuration || '—'}</p>
      </ReviewSection>

      <ReviewSection
        title="Documents and Compliance"
        onEdit={() => onEdit('scope_work', 'documents-compliance')}
      >
        <p>Attachments: {draft.attachmentsText || '—'}</p>
        <p>Compliance: {draft.complianceRequirementsText || '—'}</p>
      </ReviewSection>
    </div>
  )
}
