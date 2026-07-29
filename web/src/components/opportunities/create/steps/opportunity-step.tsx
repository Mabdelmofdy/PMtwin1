import type { OpportunityDraft } from '@/components/opportunity/wizard/draft-model.ts'
import {
  PmFormField,
  PmFormGrid,
  PmFormGridItem,
  PmFormSection,
} from '@/components/forms/pm-form-index'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { PmMultiSelect, PmSingleSelect } from '@/components/ui/pm-multi-select'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'
import { todayIso } from '@pm-twin/validation'
import {
  collapseRedundantScopes,
  coverageAreaSelectOptions,
  primaryLocationSelectOptions,
} from '@/domain/locations'
import { useMemo } from 'react'

export type OpportunityStepProps = {
  draft: OpportunityDraft
  onChange: (patch: Partial<OpportunityDraft>) => void
  showValidation?: boolean
}

function IntentCard({
  selected,
  title,
  description,
  onSelect,
}: {
  selected: boolean
  title: string
  description: string
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      data-field-id="intent"
      onClick={onSelect}
      className={cn(
        'rounded-lg border p-4 text-start transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        selected
          ? 'border-primary bg-primary/5 ring-1 ring-primary'
          : 'border-border hover:bg-surface-muted',
      )}
      aria-pressed={selected}
    >
      <p className={cn(pmTypography.label)}>{title}</p>
      <p className={cn(pmTypography.caption, 'mt-1 text-muted-foreground')}>
        {description}
      </p>
    </button>
  )
}

function maxIsoDate(a: string, b: string): string {
  return a >= b ? a : b
}

export function OpportunityStep({
  draft,
  onChange,
  showValidation = false,
}: OpportunityStepProps) {
  const isOffer = draft.intent === 'offer'
  const skillsHint = isOffer ? 'Skills Offered' : 'Skills Required'
  const servicesHint = isOffer ? 'Services Offered' : 'Services Required'
  const minDate = todayIso()
  const startLabel = isOffer ? 'Availability from' : 'Start date'
  // Deadline / availability end must not be earlier than Start date (or today).
  const minOnOrAfterStart = draft.startDate.trim()
    ? maxIsoDate(draft.startDate.trim(), minDate)
    : minDate
  const deadlineBeforeStart =
    Boolean(draft.startDate.trim()) &&
    Boolean(draft.tenderDeadline.trim()) &&
    draft.tenderDeadline.trim() < draft.startDate.trim()
  const availabilityEndBeforeStart =
    Boolean(draft.startDate.trim()) &&
    Boolean(draft.availabilityEndDate.trim()) &&
    draft.availabilityEndDate.trim() < draft.startDate.trim()

  const primaryOptions = useMemo(() => primaryLocationSelectOptions(), [])
  const coverageOptions = useMemo(() => coverageAreaSelectOptions(), [])

  return (
    <div data-slot="opportunity-step" className="space-y-8">
      <div>
        <h1 className={cn(pmTypography.h2)}>What do you want to post?</h1>
        <p className={cn(pmTypography.body, 'mt-1 text-muted-foreground')}>
          Start with the post type and the basics partners need to evaluate fit.
        </p>
      </div>

      <PmFormSection
        id="section-post-type"
        title="Post Type"
        required
        description="Choose whether you are requesting or providing capacity."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <IntentCard
            selected={draft.intent === 'need'}
            title="Need"
            description="Request services, skills, resources, capacity, or project support."
            onSelect={() => onChange({ intent: 'need' })}
          />
          <IntentCard
            selected={draft.intent === 'offer'}
            title="Offer"
            description="Provide services, skills, resources, equipment, or available capacity."
            onSelect={() => onChange({ intent: 'offer' })}
          />
        </div>
        {showValidation && draft.intent !== 'need' && draft.intent !== 'offer' ? (
          <p className="mt-2 text-sm text-danger" role="alert">
            Post type (Need or Offer) is required
          </p>
        ) : null}
      </PmFormSection>

      <PmFormSection
        id="section-basic-info"
        title="Basic Information"
        description={`${skillsHint} and ${servicesHint} are configured in Scope & Work.`}
      >
        <PmFormGrid>
          <PmFormGridItem span="full">
            <PmFormField
              id="title"
              label="Title"
              required
              error={showValidation && !draft.title.trim() ? 'Title is required' : null}
            >
              <Input
                data-field-id="title"
                value={draft.title}
                onChange={(e) => onChange({ title: e.target.value })}
                placeholder="Clear opportunity title"
              />
            </PmFormField>
          </PmFormGridItem>
          <PmFormGridItem span="full">
            <PmFormField
              id="description"
              label="Short description"
              required
              error={
                showValidation && !draft.description.trim()
                  ? 'Short description is required'
                  : null
              }
            >
              <Textarea
                data-field-id="description"
                value={draft.description}
                onChange={(e) => onChange({ description: e.target.value })}
                rows={4}
                placeholder="Summarize what you need or offer"
              />
            </PmFormField>
          </PmFormGridItem>
          <PmFormGridItem span={2}>
            <PmFormField
              id="sector"
              label="Category or profession"
              required
              error={
                showValidation && !draft.sector.trim()
                  ? 'Category or profession is required'
                  : null
              }
            >
              <Input
                data-field-id="sector"
                value={draft.sector}
                onChange={(e) => onChange({ sector: e.target.value })}
              />
            </PmFormField>
          </PmFormGridItem>
          <PmFormGridItem span={1}>
            <PmFormField
              id="targetRole"
              label="Target role"
              required
              error={
                showValidation && !draft.targetRole.trim()
                  ? 'Target role is required'
                  : null
              }
            >
              <Input
                data-field-id="targetRole"
                value={draft.targetRole}
                onChange={(e) => onChange({ targetRole: e.target.value })}
              />
            </PmFormField>
          </PmFormGridItem>
          <PmFormGridItem span={2}>
            <PmFormField
              id="location"
              label="Primary location"
              required
              hint="Head office or main project location"
              error={
                showValidation && !draft.location.trim()
                  ? 'Primary location is required'
                  : null
              }
            >
              <PmSingleSelect
                id="location"
                value={draft.location}
                onChange={(next) => onChange({ location: next })}
                options={primaryOptions}
                placeholder="Select primary location"
                searchPlaceholder="Search cities, regions…"
              />
            </PmFormField>
          </PmFormGridItem>
          <PmFormGridItem span={2}>
            <PmFormField
              id="coverageAreas"
              label="Coverage Areas / Available In"
              hint="Where you can actually deliver. Primary location is always included."
            >
              <PmMultiSelect
                id="coverageAreas"
                value={draft.coverageAreas}
                onChange={(next) => {
                  const { collapsed } = collapseRedundantScopes(next)
                  onChange({ coverageAreas: collapsed })
                }}
                options={coverageOptions}
                maxSelected={25}
                placeholder="Add coverage area"
                searchPlaceholder="Search areas…"
              />
              {draft.coverageAreas.length > 0 ? (
                <p className={cn(pmTypography.caption, 'mt-1 text-muted-foreground')}>
                  {draft.coverageAreas.length} of 25 selected
                </p>
              ) : null}
            </PmFormField>
          </PmFormGridItem>
          <PmFormGridItem span={1}>
            <PmFormField
              id="startDate"
              label={startLabel}
              required
              error={
                showValidation && !draft.startDate.trim()
                  ? `${startLabel} is required`
                  : null
              }
            >
              <Input
                data-field-id="startDate"
                type="date"
                min={minDate}
                value={draft.startDate}
                onChange={(e) => onChange({ startDate: e.target.value })}
              />
            </PmFormField>
          </PmFormGridItem>
          <PmFormGridItem span={1}>
            <PmFormField
              id="tenderDeadline"
              label="Deadline"
              error={
                deadlineBeforeStart
                  ? `Deadline cannot be before ${startLabel}.`
                  : null
              }
            >
              <Input
                data-field-id="tenderDeadline"
                type="date"
                min={minOnOrAfterStart}
                value={draft.tenderDeadline}
                onChange={(e) => onChange({ tenderDeadline: e.target.value })}
              />
            </PmFormField>
          </PmFormGridItem>
          <PmFormGridItem span={1}>
            <PmFormField
              id="availabilityEndDate"
              label="Availability end date (recommended)"
              error={
                availabilityEndBeforeStart
                  ? `Availability end date cannot be before ${startLabel}.`
                  : null
              }
            >
              <Input
                data-field-id="availabilityEndDate"
                type="date"
                min={minOnOrAfterStart}
                value={draft.availabilityEndDate}
                onChange={(e) => onChange({ availabilityEndDate: e.target.value })}
              />
            </PmFormField>
          </PmFormGridItem>
        </PmFormGrid>
      </PmFormSection>
    </div>
  )
}
