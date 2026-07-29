import { PmFormField, PmFormGrid, PmFormSection } from '@/components/forms/pm-form-index'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { RichTimeline } from '@/domain/opportunity-creation'
import { cn } from '@/lib/utils'
import { pmTypography } from '@/tokens'

export function RichTimelineFields({
  intent,
  location,
  startDate,
  tenderDeadline,
  timeline,
  onTimelineChange,
  onEditOpportunityStep,
  showValidation = false,
}: {
  intent: 'need' | 'offer' | ''
  location: string
  startDate: string
  tenderDeadline: string
  timeline: RichTimeline
  onTimelineChange: (timeline: RichTimeline) => void
  /** Jump back to Opportunity step to edit core location / dates. */
  onEditOpportunityStep?: () => void
  showValidation?: boolean
}) {
  const missingLocation = showValidation && !location.trim()
  const missingStart = showValidation && !startDate.trim()

  return (
    <div className="space-y-4" data-testid="rich-timeline-fields">
      <PmFormSection
        title="Timeline & location"
        description="Inherited from the Opportunity step — edit there if you need different values."
      >
        <div
          className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-3"
          data-slot="inherited-opportunity-timeline"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className={cn(pmTypography.caption, 'text-muted-foreground')}>
              Inherited from Opportunity
            </p>
            {onEditOpportunityStep ? (
              <button
                type="button"
                className={cn(
                  pmTypography.caption,
                  'text-primary underline-offset-2 hover:underline',
                )}
                onClick={onEditOpportunityStep}
              >
                Edit in Opportunity step
              </button>
            ) : null}
          </div>
          <PmFormGrid columns={2}>
            <div>
              <p className={cn(pmTypography.caption, 'text-muted-foreground')}>
                {intent === 'need' ? 'Location' : 'Preferred location / service area'}
                <span className="ms-0.5 text-danger" aria-hidden>
                  *
                </span>
              </p>
              <p className={cn(pmTypography.bodySm, 'mt-1')}>
                {location.trim() || '—'}
              </p>
              {missingLocation ? (
                <p className="mt-1 text-sm text-danger" role="alert">
                  Required — set in the Opportunity step
                </p>
              ) : null}
            </div>
            <div>
              <p className={cn(pmTypography.caption, 'text-muted-foreground')}>
                {intent === 'need' ? 'Start date' : 'Availability from'}
                <span className="ms-0.5 text-danger" aria-hidden>
                  *
                </span>
              </p>
              <p className={cn(pmTypography.bodySm, 'mt-1')}>
                {startDate.trim() || '—'}
              </p>
              {missingStart ? (
                <p className="mt-1 text-sm text-danger" role="alert">
                  Required — set in the Opportunity step
                </p>
              ) : null}
            </div>
            {intent === 'need' ? (
              <div>
                <p className={cn(pmTypography.caption, 'text-muted-foreground')}>
                  Deadline
                </p>
                <p className={cn(pmTypography.bodySm, 'mt-1')}>
                  {tenderDeadline.trim() || '—'}
                </p>
              </div>
            ) : null}
          </PmFormGrid>
        </div>
      </PmFormSection>

      <PmFormSection
        title="Rich timeline"
        description="Presentation metadata only — does not change workflow."
      >
        <PmFormGrid columns={2}>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(timeline.flexibleStart)}
              onChange={(e) =>
                onTimelineChange({ ...timeline, flexibleStart: e.target.checked })
              }
            />
            Flexible start
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(timeline.weekendAllowed)}
              onChange={(e) =>
                onTimelineChange({ ...timeline, weekendAllowed: e.target.checked })
              }
            />
            Weekend allowed
          </label>
          <PmFormField id="tl-finish" label="Must finish before">
            <Input
              type="date"
              value={timeline.mustFinishBefore ?? ''}
              onChange={(e) =>
                onTimelineChange({
                  ...timeline,
                  mustFinishBefore: e.target.value || undefined,
                })
              }
            />
          </PmFormField>
          <PmFormField
            id="tl-duration"
            label="Estimated duration"
            required
            error={
              showValidation && !timeline.estimatedDuration?.trim()
                ? 'Duration is required'
                : null
            }
          >
            <Input
              value={timeline.estimatedDuration ?? ''}
              onChange={(e) =>
                onTimelineChange({
                  ...timeline,
                  estimatedDuration: e.target.value || undefined,
                })
              }
              placeholder="12 weeks"
            />
          </PmFormField>
          <PmFormField id="tl-working-days" label="Working days">
            <Input
              value={timeline.workingDays ?? ''}
              onChange={(e) =>
                onTimelineChange({
                  ...timeline,
                  workingDays: e.target.value || undefined,
                })
              }
              placeholder="Sun–Thu"
            />
          </PmFormField>
          <PmFormField id="tl-shift" label="Shift type">
            <Select
              value={timeline.shiftType ?? undefined}
              onValueChange={(value) =>
                onTimelineChange({ ...timeline, shiftType: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select shift" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Day</SelectItem>
                <SelectItem value="night">Night</SelectItem>
                <SelectItem value="rotating">Rotating</SelectItem>
                <SelectItem value="flexible">Flexible</SelectItem>
              </SelectContent>
            </Select>
          </PmFormField>
          <PmFormField id="tl-delivery-method" label="Delivery method">
            <Select
              value={timeline.deliveryMethod ?? undefined}
              onValueChange={(value) =>
                onTimelineChange({ ...timeline, deliveryMethod: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select delivery method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="remote">Remote</SelectItem>
                <SelectItem value="on_site">On site</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>
          </PmFormField>
        </PmFormGrid>
      </PmFormSection>
    </div>
  )
}
