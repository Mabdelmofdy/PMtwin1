export type ApplicationValue = {
  amount?: number
  currency?: string
  requestedValue?: number
  requested_value?: number
  value_score?: number
}

export type Application = {
  id: string
  opportunityId: string
  applicantId: string
  status: string
  proposal?: string
  coverLetter?: string
  application_value?: ApplicationValue
  matchId?: string
  matchType?: string
  negotiationId?: string
  dealId?: string
  createdAt?: string
  updatedAt?: string
}

const TERMINAL_OPPORTUNITY_STATUSES = new Set([
  'contracted',
  'in_execution',
  'completed',
  'closed',
  'cancelled',
  'draft',
])

export function canUserApplyToOpportunity(
  opportunity: { status?: string; creatorId?: string } | null | undefined,
  user: { id: string } | null | undefined,
  context: {
    application?: Application | null
    canReapply?: boolean
    hasDeal?: boolean
  } = {},
) {
  if (!user || !opportunity) return false
  if (opportunity.creatorId === user.id) return false
  const status = (opportunity.status || '').toLowerCase()
  if (TERMINAL_OPPORTUNITY_STATUSES.has(status)) return false
  if (!['published', 'in_negotiation'].includes(status)) return false
  if (context.hasDeal) return false
  const application = context.application
  if (application) {
    const appStatus = (application.status || '').toLowerCase()
    if (context.canReapply && ['rejected', 'withdrawn'].includes(appStatus)) {
      return true
    }
    return false
  }
  return true
}

export function normalizeApplicationValue(rawValue?: ApplicationValue | null) {
  const av = rawValue || {}
  const requestedValue =
    av.requestedValue ??
    av.requested_value ??
    av.amount ??
    null
  const currency = av.currency || 'SAR'
  const valueScore = av.value_score ?? null
  return {
    requestedValue,
    currency,
    valueScore: valueScore != null ? Number(valueScore) : null,
    valueScorePct:
      valueScore != null ? Math.round(Number(valueScore) * 100) : null,
  }
}

export function formatApplicationValueAmount(rawValue?: ApplicationValue | null) {
  const n = normalizeApplicationValue(rawValue)
  if (n.requestedValue != null && String(n.requestedValue).trim() !== '') {
    const display =
      typeof n.requestedValue === 'number'
        ? n.requestedValue.toLocaleString()
        : String(n.requestedValue)
    return `${display} ${n.currency}`
  }
  return null
}

export function filterApplicationsForOpportunity(
  applications: Application[],
  opportunityId: string,
) {
  return applications.filter((a) => a.opportunityId === opportunityId)
}

export function sortApplicationsByValueScore(applications: Application[]) {
  const score = (a: Application) => {
    const v = normalizeApplicationValue(a.application_value).valueScore
    return v != null ? v : -1
  }
  return [...applications].sort((a, b) => score(b) - score(a))
}

const EDITABLE_APPLICATION_STATUSES = [
  'pending',
  'reviewing',
  'shortlisted',
  'in_negotiation',
]
const REAPPLY_APPLICATION_STATUSES = ['rejected', 'withdrawn']

export function resolveUserApplication(
  applications: Application[],
  opportunityId: string,
  userId: string,
) {
  const application = applications.find(
    (a) => a.opportunityId === opportunityId && a.applicantId === userId,
  )
  const canEdit = application
    ? EDITABLE_APPLICATION_STATUSES.includes(application.status)
    : false
  const canReapply = application
    ? REAPPLY_APPLICATION_STATUSES.includes(application.status)
    : false
  return { application, canEdit, canReapply }
}

export const APPLICATION_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  reviewing: 'Reviewing',
  shortlisted: 'Shortlisted',
  in_negotiation: 'In negotiation',
  accepted: 'Accepted',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
}

export const TRANSITIONABLE_APPLICATION_STATUSES = [
  'pending',
  'reviewing',
  'shortlisted',
  'in_negotiation',
]

export function bucketOpportunitiesForPipeline(
  opportunities: Array<{ status?: string; creatorId?: string; intent?: string }>,
  userId: string,
  intentFilter: '' | 'request' | 'offer' = '',
) {
  let items = opportunities.filter((o) => o.creatorId === userId)
  if (intentFilter) {
    items = items.filter((o) => (o.intent || 'request') === intentFilter)
  }
  return {
    draft: items.filter((o) => o.status === 'draft'),
    published: items.filter((o) => o.status === 'published'),
    in_progress: items.filter((o) =>
      ['in_negotiation', 'contracted', 'in_execution'].includes(o.status || ''),
    ),
    closed: items.filter((o) =>
      ['closed', 'cancelled', 'completed'].includes(o.status || ''),
    ),
  }
}

export function bucketApplicationsForPipeline(
  apps: Array<Application & { opportunity?: { intent?: string } | null }>,
  intentFilter: '' | 'request' | 'offer' = '',
) {
  let items = apps
  if (intentFilter) {
    items = items.filter(
      (a) => (a.opportunity?.intent || 'request') === intentFilter,
    )
  }
  const isNeg = (a: Application) => a.status === 'in_negotiation'
  return {
    pending: items.filter((a) => a.status === 'pending' && !isNeg(a)),
    reviewing: items.filter((a) => a.status === 'reviewing' && !isNeg(a)),
    shortlisted: items.filter((a) => a.status === 'shortlisted' && !isNeg(a)),
    in_negotiation: items.filter((a) => isNeg(a)),
    accepted: items.filter((a) => a.status === 'accepted'),
    rejected: items.filter(
      (a) => a.status === 'rejected' || a.status === 'withdrawn',
    ),
  }
}

export const OPP_STAGE_TO_STATUS: Record<string, string> = {
  draft: 'draft',
  published: 'published',
  in_progress: 'in_negotiation',
  closed: 'closed',
}

export const APP_STAGE_TO_STATUS: Record<string, string> = {
  pending: 'pending',
  reviewing: 'reviewing',
  shortlisted: 'shortlisted',
  in_negotiation: 'in_negotiation',
  accepted: 'accepted',
  rejected: 'rejected',
}
