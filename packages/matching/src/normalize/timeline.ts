import type { NormalizedTimeline } from '../types/opportunity.ts'
import type { OpportunityPost } from '../types/opportunity.ts'

/**
 * End-date precedence (live wizard stores Offer availability as
 * `collaborationAttributes.availabilityEndDate`, merged onto `attributes` by
 * web `opportunityToPost`):
 * 1. `availabilityEndDate` — explicit Offer availability end. For `intent=offer`
 *    this wins over other end fields. For other intents it is a fill-only fallback
 *    so Need-specific deadlines (`tenderDeadline` / `applicationDeadline`) stay
 *    canonical.
 * 2. Existing cascade when `availabilityEndDate` is absent (or unused on Needs):
 *    `deliveryTimeline.end` / `availability.end` (overwrite) →
 *    `applicationDeadline` → `tenderDeadline` → `endDate` (fill-only).
 */
function nonEmptyDateString(value: unknown): string | null {
  if (value == null) return null
  const text = String(value).trim()
  return text.length > 0 ? text : null
}

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

  const availabilityEndDate = nonEmptyDateString(attributes.availabilityEndDate)
  if (availabilityEndDate) {
    const isOffer = opportunity.intent === 'offer'
    if (isOffer || !end) end = availabilityEndDate
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
