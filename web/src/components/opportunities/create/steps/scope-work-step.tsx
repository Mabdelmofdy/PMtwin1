import type { OpportunityDraft } from '@/components/opportunity/wizard/draft-model.ts'
import {
  PmFormField,
  PmFormGrid,
  PmFormGridItem,
} from '@/components/forms/pm-form-index'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  StructuredSkillsEditor,
  ServicesField,
} from '@/components/opportunity/wizard/structured-skills-editor.tsx'
import { ResourcesCapacityEditor } from '@/components/opportunity/wizard/resources-capacity-editor.tsx'
import { RichTimelineFields } from '@/components/opportunity/wizard/rich-timeline-fields.tsx'
import { WorkPackagesBuilder } from '../work/work-packages-builder.tsx'
import {
  DeliverablesBuilder,
  MilestonesBuilder,
} from '../work/deliverables-milestones-builders.tsx'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'

export type ScopeWorkStepProps = {
  draft: OpportunityDraft
  onChange: (patch: Partial<OpportunityDraft>) => void
  showValidation?: boolean
}

export function ScopeWorkStep({
  draft,
  onChange,
  showValidation = false,
}: ScopeWorkStepProps) {
  const isOffer = draft.intent === 'offer'
  const hasNamedSkill = draft.structuredSkills.some((skill) => skill.name.trim())

  return (
    <div data-slot="scope-work-step" className="space-y-6">
      <div>
        <h2 className={cn(pmTypography.h2)}>Scope & Work</h2>
        <p className={cn(pmTypography.body, 'mt-1 text-muted-foreground')}>
          Define requirements, work packages, tasks, deliverables, and milestones.
        </p>
      </div>

      <details open className="rounded-lg border border-border p-4" id="section-requirements">
        <summary className={cn(pmTypography.label, 'cursor-pointer')}>
          Requirements
        </summary>
        <div className="mt-4 space-y-4">
          <StructuredSkillsEditor
            label={isOffer ? 'Skills Offered' : 'Skills Required'}
            skills={draft.structuredSkills}
            onChange={(structuredSkills) => onChange({ structuredSkills })}
            required
            error={
              showValidation && !hasNamedSkill
                ? isOffer
                  ? 'At least one offered skill is required'
                  : 'At least one required skill is required'
                : null
            }
          />
          <ServicesField
            label={isOffer ? 'Services Offered' : 'Services Required'}
            value={draft.services}
            onChange={(services) => onChange({ services })}
            required
            error={
              showValidation && !draft.services.trim()
                ? isOffer
                  ? 'Services offered are required'
                  : 'Services required are required'
                : null
            }
          />
          <PmFormGrid>
            <PmFormGridItem span={2}>
              <PmFormField id="preferredPartnerType" label="Preferred partner type">
                <Input
                  data-field-id="preferredPartnerType"
                  value={draft.preferredPartnerType}
                  onChange={(e) => onChange({ preferredPartnerType: e.target.value })}
                />
              </PmFormField>
            </PmFormGridItem>
            <PmFormGridItem span={1}>
              <PmFormField id="experienceLevel" label="Experience level">
                <Input
                  value={draft.experienceLevel}
                  onChange={(e) => onChange({ experienceLevel: e.target.value })}
                />
              </PmFormField>
            </PmFormGridItem>
            <PmFormGridItem span={2}>
              <PmFormField id="certificationsText" label="Certifications">
                <Input
                  value={draft.certificationsText}
                  onChange={(e) => onChange({ certificationsText: e.target.value })}
                />
              </PmFormField>
            </PmFormGridItem>
            <PmFormGridItem span={1}>
              <PmFormField id="teamSize" label="Team size">
                <Input
                  value={draft.teamSize}
                  onChange={(e) => onChange({ teamSize: e.target.value })}
                />
              </PmFormField>
            </PmFormGridItem>
            <PmFormGridItem span="full">
              <PmFormField id="minimumQualifications" label="Minimum qualifications">
                <Textarea
                  value={draft.minimumQualifications}
                  onChange={(e) =>
                    onChange({ minimumQualifications: e.target.value })
                  }
                  rows={2}
                />
              </PmFormField>
            </PmFormGridItem>
          </PmFormGrid>
          <ResourcesCapacityEditor
            resources={draft.resources}
            capacity={draft.capacity}
            workPackages={draft.workPackages}
            showCapacity={draft.intent === 'offer'}
            onResourcesChange={(resources) => onChange({ resources })}
            onCapacityChange={(capacity) => onChange({ capacity })}
          />
        </div>
      </details>

      <div id="section-work-packages">
        <WorkPackagesBuilder
          packages={draft.workPackages}
          onChange={(workPackages) => onChange({ workPackages })}
        />
      </div>

      <div id="section-deliverables">
        <DeliverablesBuilder
          deliverables={draft.deliverables}
          workPackages={draft.workPackages}
          onChange={(deliverables) => onChange({ deliverables })}
        />
      </div>

      <div id="section-milestones">
        <MilestonesBuilder
          milestones={draft.milestones}
          onChange={(milestones) => onChange({ milestones })}
        />
      </div>

      <details open className="rounded-lg border border-border p-4" id="section-timeline">
        <summary className={cn(pmTypography.label, 'cursor-pointer')}>
          Timeline & Location
        </summary>
        <div className="mt-4">
          <RichTimelineFields
            intent={draft.intent}
            location={draft.location}
            startDate={draft.startDate}
            tenderDeadline={draft.tenderDeadline}
            timeline={draft.richTimeline}
            showValidation={showValidation}
            onLocationChange={(location) => onChange({ location })}
            onStartDateChange={(startDate) => onChange({ startDate })}
            onDeadlineChange={(tenderDeadline) => onChange({ tenderDeadline })}
            onTimelineChange={(richTimeline) => onChange({ richTimeline })}
          />
        </div>
      </details>

      <details className="rounded-lg border border-border p-4" id="section-documents-compliance">
        <summary className={cn(pmTypography.label, 'cursor-pointer')}>
          Documents & Compliance
        </summary>
        <div className="mt-4 space-y-3">
          <PmFormField id="attachmentsText" label="Attachments">
            <Input
              data-field-id="attachmentsText"
              value={draft.attachmentsText}
              onChange={(e) => onChange({ attachmentsText: e.target.value })}
              placeholder="Comma-separated document names"
            />
          </PmFormField>
          <PmFormField id="complianceRequirementsText" label="Compliance requirements">
            <Textarea
              data-field-id="complianceRequirementsText"
              value={draft.complianceRequirementsText}
              onChange={(e) =>
                onChange({ complianceRequirementsText: e.target.value })
              }
              rows={3}
              placeholder="Saudi Building Code, PDPL, H&S, licenses…"
            />
          </PmFormField>
          <PmFormField id="portfolioText" label="Portfolio references">
            <Textarea
              value={draft.portfolioText}
              onChange={(e) => onChange({ portfolioText: e.target.value })}
              rows={2}
            />
          </PmFormField>
        </div>
      </details>
    </div>
  )
}
