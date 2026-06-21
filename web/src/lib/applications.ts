export type { Application, ApplicationValue } from '@/types/domain.ts'

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
