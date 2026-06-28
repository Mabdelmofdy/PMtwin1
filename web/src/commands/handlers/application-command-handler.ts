import type {
  AcceptApplicationCommand,
  Command,
  CommandResult,
  RejectApplicationCommand,
  SubmitApplicationCommand,
  TransitionApplicationStatusCommand,
} from '@pm-twin/commands'
import {
  allowedTransitions,
  getFsm,
  isTerminal,
  toCanonical,
} from '@pm-twin/lifecycle'
import type { Application, AuditEntry } from '@/types/domain.ts'
import type { ApplicationRepository } from '@/repositories/application-repository.ts'
import type { AuditRepository } from '@/repositories/audit-repository.ts'
import { toStoredStatus } from '@/domain/workflow/legacy-map.ts'

const ENTITY_TYPE = 'application' as const

const BLOCKING_APPLICATION_STATUSES = new Set([
  'pending',
  'reviewing',
  'shortlisted',
  'in_negotiation',
  'accepted',
])

export type ApplicationCommandHandlerDeps = {
  readonly applicationRepository: ApplicationRepository
  readonly auditRepository?: AuditRepository | null
}

function failure(
  commandType: string,
  aggregateId: string,
  errors: readonly string[],
): CommandResult {
  return { success: false, aggregateId, commandType, errors }
}

function success(commandType: string, aggregateId: string): CommandResult {
  return { success: true, aggregateId, commandType }
}

function validateBaseCommand(command: Command): readonly string[] {
  const errors: string[] = []
  if (!command.commandType?.trim()) {
    errors.push('commandType is required')
  }
  if (!command.aggregateId?.trim()) {
    errors.push('aggregateId is required')
  }
  if (!command.clientRequestId?.trim()) {
    errors.push('clientRequestId is required')
  }
  return errors
}

function findBlockingApplication(
  applications: Application[],
  opportunityId: string,
  applicantId: string,
): Application | null {
  return (
    applications.find(
      (application) =>
        application.opportunityId === opportunityId &&
        application.applicantId === applicantId &&
        BLOCKING_APPLICATION_STATUSES.has(
          (application.status || '').toLowerCase(),
        ),
    ) ?? null
  )
}

function validateTransition(
  currentStatus: string,
  targetStatus: string,
): readonly string[] {
  const fsm = getFsm(ENTITY_TYPE)
  if (!fsm) {
    return ['Application lifecycle FSM is not available']
  }

  const fromCanonical = toCanonical(ENTITY_TYPE, currentStatus)
  const toCanonicalStatus = toCanonical(ENTITY_TYPE, targetStatus)

  if (!fromCanonical) {
    return [`Unknown current status "${currentStatus}"`]
  }
  if (!toCanonicalStatus) {
    return [`Unknown target status "${targetStatus}"`]
  }
  if (fromCanonical === toCanonicalStatus) {
    return []
  }
  if (isTerminal(ENTITY_TYPE, currentStatus)) {
    return [
      `Application is in terminal state "${fromCanonical}" and cannot transition`,
    ]
  }

  const allowed = allowedTransitions(ENTITY_TYPE, currentStatus)
  if (!allowed.includes(toCanonicalStatus)) {
    return [
      `Transition ${fromCanonical} → ${toCanonicalStatus} is not allowed`,
    ]
  }

  return []
}

function pickApplicationCreateData(
  command: SubmitApplicationCommand,
): Omit<Application, 'id' | 'createdAt' | 'updatedAt'> {
  const payload = command.payload ?? {}
  return {
    opportunityId: command.opportunityId,
    applicantId: command.applicantId,
    status: 'pending',
    proposal:
      typeof payload.proposal === 'string' ? payload.proposal : undefined,
    coverLetter:
      typeof payload.coverLetter === 'string'
        ? payload.coverLetter
        : undefined,
    application_value:
      payload.application_value &&
      typeof payload.application_value === 'object'
        ? (payload.application_value as Application['application_value'])
        : undefined,
    commercialTerms:
      payload.commercialTerms &&
      typeof payload.commercialTerms === 'object'
        ? (payload.commercialTerms as Application['commercialTerms'])
        : undefined,
    matchId:
      typeof payload.matchId === 'string' ? payload.matchId : undefined,
    matchType:
      typeof payload.matchType === 'string' ? payload.matchType : undefined,
    negotiationId:
      typeof payload.negotiationId === 'string'
        ? payload.negotiationId
        : undefined,
    dealId: typeof payload.dealId === 'string' ? payload.dealId : undefined,
    tenantId:
      typeof payload.tenantId === 'string' ? payload.tenantId : undefined,
    organizationId:
      typeof payload.organizationId === 'string'
        ? payload.organizationId
        : undefined,
  }
}

export class ApplicationCommandHandler {
  private readonly applicationRepository: ApplicationRepository
  private readonly auditRepository: AuditRepository | null

  constructor(deps: ApplicationCommandHandlerDeps) {
    this.applicationRepository = deps.applicationRepository
    this.auditRepository = deps.auditRepository ?? null
  }

  handle(command: Command): CommandResult {
    const baseErrors = validateBaseCommand(command)
    if (baseErrors.length > 0) {
      return failure(
        command.commandType,
        command.aggregateId,
        baseErrors,
      )
    }

    switch (command.commandType) {
      case 'SubmitApplication':
        return this.handleSubmit(command as SubmitApplicationCommand)
      case 'AcceptApplication':
        return this.handleAccept(command as AcceptApplicationCommand)
      case 'RejectApplication':
        return this.handleReject(command as RejectApplicationCommand)
      case 'TransitionApplicationStatus':
        return this.handleTransition(
          command as TransitionApplicationStatusCommand,
        )
      default:
        return failure(command.commandType, command.aggregateId, [
          `Unsupported application command type "${command.commandType}"`,
        ])
    }
  }

  private handleSubmit(command: SubmitApplicationCommand): CommandResult {
    if (!command.opportunityId?.trim()) {
      return failure(command.commandType, command.aggregateId, [
        'opportunityId is required',
      ])
    }
    if (!command.applicantId?.trim()) {
      return failure(command.commandType, command.aggregateId, [
        'applicantId is required',
      ])
    }
    if (command.aggregateId !== command.opportunityId) {
      return failure(command.commandType, command.aggregateId, [
        'aggregateId must match opportunityId for SubmitApplication',
      ])
    }

    const existing = this.applicationRepository.getAll()
    if (
      findBlockingApplication(
        existing,
        command.opportunityId,
        command.applicantId,
      )
    ) {
      return failure(command.commandType, command.aggregateId, [
        'A blocking application already exists for this opportunity',
      ])
    }

    const created = this.applicationRepository.create(
      pickApplicationCreateData(command),
    )

    this.appendAudit({
      action: 'application.submitted',
      entityType: 'application',
      entityId: created.id,
      requestId: command.clientRequestId,
      details: {
        opportunityId: command.opportunityId,
        applicantId: command.applicantId,
        status: created.status,
      },
    })

    return success(command.commandType, created.id)
  }

  private handleAccept(command: AcceptApplicationCommand): CommandResult {
    return this.transitionStatus(command, 'accepted')
  }

  private handleReject(command: RejectApplicationCommand): CommandResult {
    return this.transitionStatus(command, 'rejected')
  }

  private handleTransition(
    command: TransitionApplicationStatusCommand,
  ): CommandResult {
    if (!command.targetStatus?.trim()) {
      return failure(command.commandType, command.aggregateId, [
        'targetStatus is required',
      ])
    }
    return this.transitionStatus(command, command.targetStatus)
  }

  private transitionStatus(
    command: Command,
    targetStatus: string,
  ): CommandResult {
    const application = this.applicationRepository.getById(command.aggregateId)
    if (!application) {
      return failure(command.commandType, command.aggregateId, [
        `Application "${command.aggregateId}" not found`,
      ])
    }

    const transitionErrors = validateTransition(
      application.status,
      targetStatus,
    )
    if (transitionErrors.length > 0) {
      return failure(
        command.commandType,
        command.aggregateId,
        transitionErrors,
      )
    }

    const canonicalTarget = toCanonical(ENTITY_TYPE, targetStatus)
    const storedStatus = toStoredStatus(ENTITY_TYPE, canonicalTarget)

    if ((application.status || '').toLowerCase() === storedStatus.toLowerCase()) {
      return success(command.commandType, command.aggregateId)
    }

    this.applicationRepository.update(command.aggregateId, {
      status: storedStatus,
    })

    this.appendAudit({
      action: 'application.status_changed',
      entityType: 'application',
      entityId: command.aggregateId,
      requestId: command.clientRequestId,
      details: {
        fromStatus: application.status,
        toStatus: storedStatus,
        canonicalTarget,
      },
    })

    return success(command.commandType, command.aggregateId)
  }

  private appendAudit(
    entry: Omit<AuditEntry, 'id' | 'timestamp'>,
  ): void {
    if (
      !this.auditRepository ||
      typeof this.auditRepository.append !== 'function'
    ) {
      return
    }
    this.auditRepository.append(entry)
  }
}
