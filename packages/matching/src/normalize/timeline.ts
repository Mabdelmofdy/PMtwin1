import type { NormalizedTimeline } from '../types/opportunity.ts'
import type { OpportunityPost } from '../types/opportunity.ts'

export function extractTimeline(opportunity: OpportunityPost): NormalizedTimeline {
  const attributes = opportunity.attributes ?? {}
  let start: string | null = null
  let end: string | null = null
  let durationDays: number | null = null

  if (attributes.startDate) start = String(attributes.startDate)
  if (attributes.tenderDeadline) end = String(attributes.tenderDeadline)
  if (attributes.applicationDeadline) {
    end = String(attributes.applicationDeadline || end)
  }
  if (attributes.endDate && !end) end = String(attributes.endDate)

  const availability = attributes.availability
  if (availability && typeof availability === 'object') {
    const record = availability as { start?: string; end?: string }
    start = record.start ?? start
    end = record.end ?? end
  }

  const deliveryTimeline = attributes.deliveryTimeline
  if (deliveryTimeline && typeof deliveryTimeline === 'object') {
    const record = deliveryTimeline as { start?: string; end?: string }
    start = record.start ?? start
    end = record.end ?? end
  }

  if (attributes.duration != null) durationDays = Number(attributes.duration)
  if (attributes.projectDuration != null) durationDays = Number(attributes.projectDuration)
  if (attributes.contractDuration != null) durationDays = Number(attributes.contractDuration)

  return {
    start: start ?? undefined,
    end: end ?? undefined,
    durationDays: durationDays != null ? durationDays : undefined,
  }
}
