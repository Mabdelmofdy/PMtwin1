import type {
  AcceptApplicationCommand,
  RejectApplicationCommand,
  SubmitApplicationCommand,
  TransitionApplicationStatusCommand,
} from '@pm-twin/commands'
import type { Application } from '@/types/domain.ts'
import { getApplicationCommandGateway } from '@/commands/application-command-gateway.ts'
import { applicationRepository } from '@/repositories/index.ts'
import { isOpportunityOwnedByContext } from '@/domain/identity/ownership-adapters.ts'

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

function createClientRequestId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function executeApplicationCommand(
  command:
    | Omit<TransitionApplicationStatusCommand, 'clientRequestId'>
    | Omit<AcceptApplicationCommand, 'clientRequestId'>
    | Omit<RejectApplicationCommand, 'clientRequestId'>,
): void {
  getApplicationCommandGateway().execute({
    ...command,
    clientRequestId: createClientRequestId(command.commandType),
  })
}

export const negotiationService = {
  canUserApplyToOpportunity(
    opportunity: {
      status?: string
      creatorId?: string
      ownerPartyId?: string
      workspaceId?: string
    } | null | undefined,
    user: { id: string } | null | undefined,
    context: {
      application?: Application | null
      canReapply?: boolean
      hasDeal?: boolean
      activeWorkspaceId?: string | null
      activePartyId?: string | null
    } = {},
  ): boolean {
    if (!user || !opportunity) return false
    if (
      isOpportunityOwnedByContext(opportunity, {
        activeWorkspaceId: context.activeWorkspaceId,
        activePartyId: context.activePartyId,
        userId: user.id,
      })
    ) {
      return false
    }
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
    const { opportunityId, applicantId, ...payload } = data
    const clientRequestId = createClientRequestId('submit-application')
    const gateway = getApplicationCommandGateway()
    const command: SubmitApplicationCommand = {
      commandType: 'SubmitApplication',
      aggregateId: opportunityId,
      clientRequestId,
      opportunityId,
      applicantId,
      payload,
    }
    const result = gateway.execute(command)

    if (!result.success) {
      return null
    }

    return applicationRepository.getById(result.aggregateId) ?? null
  },

  transitionApplicationStatus(appId: string, newStatus: string): void {
    executeApplicationCommand({
      commandType: 'TransitionApplicationStatus',
      aggregateId: appId,
      targetStatus: newStatus,
    })
  },

  acceptApplication(appId: string): void {
    executeApplicationCommand({
      commandType: 'AcceptApplication',
      aggregateId: appId,
    })
  },

  rejectApplication(appId: string): void {
    executeApplicationCommand({
      commandType: 'RejectApplication',
      aggregateId: appId,
    })
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
    executeApplicationCommand({
      commandType: 'TransitionApplicationStatus',
      aggregateId: id,
      targetStatus: status,
    })
  },
}
