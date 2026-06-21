import type { Application } from '@/types/domain.ts'
import { applicationRepository } from '@/repositories/index.ts'

const TERMINAL_OPPORTUNITY_STATUSES = new Set([
  'contracted',
  'in_execution',
  'completed',
  'closed',
  'cancelled',
  'draft',
])

const BLOCKING_APPLICATION_STATUSES = new Set([
  'pending',
  'reviewing',
  'shortlisted',
  'in_negotiation',
  'accepted',
])

const EDITABLE_APPLICATION_STATUSES = [
  'pending',
  'reviewing',
  'shortlisted',
  'in_negotiation',
]

const REAPPLY_APPLICATION_STATUSES = ['rejected', 'withdrawn']

export const negotiationService = {
  canUserApplyToOpportunity(
    opportunity: { status?: string; creatorId?: string } | null | undefined,
    user: { id: string } | null | undefined,
    context: {
      application?: Application | null
      canReapply?: boolean
      hasDeal?: boolean
    } = {},
  ): boolean {
    if (!user || !opportunity) return false
    if (opportunity.creatorId === user.id) return false
    const status = (opportunity.status || '').toLowerCase()
    if (TERMINAL_OPPORTUNITY_STATUSES.has(status)) return false
    if (!['published', 'in_negotiation'].includes(status)) return false
    if (context.hasDeal) return false
    const application = context.application
    if (application) {
      const appStatus = (application.status || '').toLowerCase()
      if (
        context.canReapply &&
        ['rejected', 'withdrawn'].includes(appStatus)
      ) {
        return true
      }
      return false
    }
    return true
  },

  findBlockingApplication(
    applications: Application[],
    opportunityId: string,
    applicantId: string,
  ): Application | null {
    return (
      applications.find(
        (a) =>
          a.opportunityId === opportunityId &&
          a.applicantId === applicantId &&
          BLOCKING_APPLICATION_STATUSES.has(
            (a.status || '').toLowerCase(),
          ),
      ) ?? null
    )
  },

  resolveUserApplication(
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
  },

  submitApplication(
    data: Omit<Application, 'id' | 'createdAt' | 'updatedAt'>,
  ): Application | null {
    const existing = applicationRepository.getAll()
    if (
      this.findBlockingApplication(
        existing,
        data.opportunityId,
        data.applicantId,
      )
    ) {
      return null
    }
    return applicationRepository.create(data)
  },

  transitionApplicationStatus(appId: string, newStatus: string): void {
    applicationRepository.update(appId, { status: newStatus })
  },

  acceptApplication(appId: string): void {
    applicationRepository.update(appId, { status: 'accepted' })
  },

  rejectApplication(appId: string): void {
    applicationRepository.update(appId, { status: 'rejected' })
  },

  bucketApplicationsForPipeline(
    apps: Array<
      Application & { opportunity?: { intent?: string } | null }
    >,
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
      pending: items.filter(
        (a) => a.status === 'pending' && !isNeg(a),
      ),
      reviewing: items.filter(
        (a) => a.status === 'reviewing' && !isNeg(a),
      ),
      shortlisted: items.filter(
        (a) => a.status === 'shortlisted' && !isNeg(a),
      ),
      in_negotiation: items.filter((a) => isNeg(a)),
      accepted: items.filter((a) => a.status === 'accepted'),
      rejected: items.filter(
        (a) => a.status === 'rejected' || a.status === 'withdrawn',
      ),
    }
  },

  updateApplicationStatus(id: string, status: string): void {
    applicationRepository.update(id, { status })
  },
}
