import type {
  Command,
  CommandResult,
  TransitionOpportunityStatusCommand,
} from '@pm-twin/commands'
import {
  allowedTransitions,
  getFsm,
  isTerminal,
  toCanonical,
} from '@pm-twin/lifecycle'
import type { AuditEntry, Opportunity } from '@/types/domain.ts'
import type { AuditRepository } from '@/repositories/audit-repository.ts'
import type { OpportunityRepository } from '@/repositories/opportunity-repository.ts'
import type { ProfileKind } from '@/domain/profile-readiness/types.ts'
import {
  evaluatePublishReadiness,
  formatPublishReadinessCommandErrors,
} from '@/domain/publish-readiness/publish-readiness-gate.ts'
import { toStoredStatus } from '@/domain/workflow/legacy-map.ts'

const ENTITY_TYPE = 'opportunity' as const

export type PublishReadinessContext = {
  readonly profile?: object | null
  readonly profileKind: ProfileKind
}

export type OpportunityCommandHandlerDeps = {
  readonly opportunityRepository: OpportunityRepository
  readonly auditRepository?: AuditRepository | null
  readonly resolvePublishReadinessContext?: (
    opportunity: Opportunity,
  ) => PublishReadinessContext
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

function validateTransition(
  currentStatus: string,
  targetStatus: string,
): readonly string[] {
  const fsm = getFsm(ENTITY_TYPE)
  if (!fsm) {
    return ['Opportunity lifecycle FSM is not available']
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
      `Opportunity is in terminal state "${fromCanonical}" and cannot transition`,
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

export class OpportunityCommandHandler {
  private readonly opportunityRepository: OpportunityRepository
  private readonly auditRepository: AuditRepository | null
  private readonly resolvePublishReadinessContext?: (
    opportunity: Opportunity,
  ) => PublishReadinessContext

  constructor(deps: OpportunityCommandHandlerDeps) {
    this.opportunityRepository = deps.opportunityRepository
    this.auditRepository = deps.auditRepository ?? null
    this.resolvePublishReadinessContext = deps.resolvePublishReadinessContext
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
      case 'TransitionOpportunityStatus':
        return this.handleTransition(
          command as TransitionOpportunityStatusCommand,
        )
      default:
        return failure(command.commandType, command.aggregateId, [
          `Unsupported Opportunity command type "${command.commandType}"`,
        ])
    }
  }

  private handleTransition(
    command: TransitionOpportunityStatusCommand,
  ): CommandResult {
    if (!command.targetStatus?.trim()) {
      return failure(command.commandType, command.aggregateId, [
        'targetStatus is required',
      ])
    }

    const opportunity = this.opportunityRepository.getById(command.aggregateId)
    if (!opportunity) {
      return failure(command.commandType, command.aggregateId, [
        `Opportunity "${command.aggregateId}" not found`,
      ])
    }

    const transitionErrors = validateTransition(
      opportunity.status ?? '',
      command.targetStatus,
    )
    if (transitionErrors.length > 0) {
      return failure(
        command.commandType,
        command.aggregateId,
        transitionErrors,
      )
    }

    const canonicalTarget = toCanonical(ENTITY_TYPE, command.targetStatus)
    const storedStatus = toStoredStatus(ENTITY_TYPE, canonicalTarget)

    if (canonicalTarget === 'published') {
      const publishContext = this.resolvePublishReadinessContext?.(opportunity) ?? {
        profile: null,
        profileKind: 'individual' as const,
      }
      const publishGate = evaluatePublishReadiness({
        profile: publishContext.profile,
        profileKind: publishContext.profileKind,
        opportunity,
      })
      if (!publishGate.allowed) {
        return failure(
          command.commandType,
          command.aggregateId,
          formatPublishReadinessCommandErrors(publishGate),
        )
      }
    }

    if (
      (opportunity.status || '').toLowerCase() === storedStatus.toLowerCase()
    ) {
      return success(command.commandType, command.aggregateId)
    }

    this.opportunityRepository.update(command.aggregateId, {
      status: storedStatus,
    })

    this.appendAudit({
      action: 'opportunity.status_changed',
      entityType: 'opportunity',
      entityId: command.aggregateId,
      requestId: command.clientRequestId,
      details: {
        targetStatus: storedStatus,
        reason: command.reason,
      },
    })

    return success(command.commandType, command.aggregateId)
  }

  private appendAudit(entry: Omit<AuditEntry, 'id' | 'timestamp'>): void {
    if (
      !this.auditRepository ||
      typeof this.auditRepository.append !== 'function'
    ) {
      return
    }
    this.auditRepository.append(entry)
  }
}
