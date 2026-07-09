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

export function RichTimelineFields({
  intent,
  location,
  startDate,
  tenderDeadline,
  timeline,
  onLocationChange,
  onStartDateChange,
  onDeadlineChange,
  onTimelineChange,
}: {
  intent: 'need' | 'offer' | ''
  location: string
  startDate: string
  tenderDeadline: string
  timeline: RichTimeline
  onLocationChange: (value: string) => void
  onStartDateChange: (value: string) => void
  onDeadlineChange: (value: string) => void
  onTimelineChange: (timeline: RichTimeline) => void
}) {
  return (
    <div className="space-y-4" data-testid="rich-timeline-fields">
      <PmFormSection
        title="Timeline & location"
        description={
          intent === 'need'
            ? 'Deadline and location requirements for the Need.'
            : 'Availability and preferred location for the Offer.'
        }
      >
        <PmFormGrid columns={2}>
          <PmFormField
            id="opp-location"
            label={intent === 'need' ? 'Location' : 'Preferred location / service area'}
          >
            <Input
              value={location}
              onChange={(e) => onLocationChange(e.target.value)}
              placeholder="Riyadh, Saudi Arabia"
            />
          </PmFormField>
          <PmFormField
            id="opp-start"
            label={intent === 'need' ? 'Start date' : 'Availability from'}
          >
            <Input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
            />
          </PmFormField>
          {intent === 'need' ? (
            <PmFormField id="opp-deadline" label="Deadline">
              <Input
                type="date"
                value={tenderDeadline}
                onChange={(e) => onDeadlineChange(e.target.value)}
              />
            </PmFormField>
          ) : null}
        </PmFormGrid>
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
          <PmFormField id="tl-duration" label="Estimated duration">
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
        </PmFormGrid>
      </PmFormSection>
    </div>
  )
}
