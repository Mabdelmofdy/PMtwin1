import type {
  AgreeNegotiationCommand,
  CancelNegotiationCommand,
  Command,
  CommandResult,
  StartNegotiationFromApplicationCommand,
  StartNegotiationFromPostMatchCommand,
  TransitionNegotiationStatusCommand,
} from '@pm-twin/commands'
import {
  allowedTransitions,
  getFsm,
  isTerminal,
  toCanonical,
} from '@pm-twin/lifecycle'
import type { AuditEntry, Negotiation } from '@/types/domain.ts'
import type { NegotiationTerms } from '@/types/commercial-terms.ts'
import type { Participant } from '@/types/participant.ts'
import { buildCommercialTermsFromOpportunity } from '@/domain/collaboration/value-exchange-lifecycle.ts'
import { resolvePostMatchTopologyLabel } from '@/lib/collaboration-taxonomy-display.ts'
import { resolvePostMatchOpportunityIds } from '@/domain/normalized/post-match-opportunity-ids.ts'
import {
  emitParticipantNotifications,
  type NotificationSink,
} from '@/commands/handlers/lifecycle-notifications.ts'
import type { AuditRepository } from '@/repositories/audit-repository.ts'
import type { ApplicationRepository } from '@/repositories/application-repository.ts'
import type { NegotiationRepository } from '@/repositories/negotiation-repository.ts'
import type { OpportunityRepository } from '@/repositories/opportunity-repository.ts'
import type { PostMatchRepository } from '@/repositories/post-match-repository.ts'

const POST_MATCH_ENTITY = 'match' as const
const NEGOTIATION_ENTITY = 'negotiation' as const
const AGREED_STATUS = 'agreed' as const
const CANCELLED_STATUS = 'cancelled' as const
const ACTIVE_NEGOTIATION_STATUSES = new Set(['active', 'countered'])
const APPLICATION_ENTITY = 'application' as const
const ACCEPTED_APPLICATION_STATUS = 'accepted' as const

export type NegotiationCommandHandlerDeps = {
  readonly negotiationRepository: NegotiationRepository
  readonly postMatchRepository: PostMatchRepository
  readonly opportunityRepository?: OpportunityRepository | null
  readonly applicationRepository?: ApplicationRepository | null
  readonly auditRepository?: AuditRepository | null
  readonly notificationRepository?: NotificationSink | null
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

function buildNegotiationOpenMessage(matchType: string): string {
  const label = resolvePostMatchTopologyLabel({ matchType })
  return `Negotiation opened from confirmed ${label} match.`
}

function seedCommercialTermsFromOpportunity(
  opportunityRepository: OpportunityRepository | null | undefined,
  opportunityId: string | undefined,
): CommercialTermsSeed | undefined {
  if (!opportunityRepository || !opportunityId) return undefined
  const opportunity = opportunityRepository.getById(opportunityId)
  if (!opportunity) return undefined
  const commercialTerms = buildCommercialTermsFromOpportunity(opportunity)
  return {
    commercialTerms,
    initialTerms: {
      message: `Commercial terms seeded from opportunity "${opportunity.title ?? opportunityId}".`,
      ...commercialTerms,
    } as NegotiationTerms,
  }
}

type CommercialTermsSeed = {
  readonly commercialTerms: ReturnType<typeof buildCommercialTermsFromOpportunity>
  readonly initialTerms: NegotiationTerms
}

function isActiveNegotiationStatus(status: string | undefined): boolean {
  const canonical = toCanonical(NEGOTIATION_ENTITY, status ?? '') ?? ''
  return ACTIVE_NEGOTIATION_STATUSES.has(canonical)
}

function validateTransition(
  currentStatus: string,
  targetStatus: string,
): readonly string[] {
  const fsm = getFsm(NEGOTIATION_ENTITY)
  if (!fsm) {
    return ['Negotiation lifecycle FSM is not available']
  }

  const fromCanonical = toCanonical(NEGOTIATION_ENTITY, currentStatus)
  const toCanonicalStatus = toCanonical(NEGOTIATION_ENTITY, targetStatus)

  if (!fromCanonical) {
    return [`Unknown current status "${currentStatus}"`]
  }
  if (!toCanonicalStatus) {
    return [`Unknown target status "${targetStatus}"`]
  }
  if (fromCanonical === toCanonicalStatus) {
    return []
  }
  if (isTerminal(NEGOTIATION_ENTITY, currentStatus)) {
    return [
      `Negotiation is in terminal state "${fromCanonical}" and cannot transition`,
    ]
  }

  const allowed = allowedTransitions(NEGOTIATION_ENTITY, currentStatus)
  if (!allowed.includes(toCanonicalStatus)) {
    return [
      `Transition ${fromCanonical} → ${toCanonicalStatus} is not allowed`,
    ]
  }

  return []
}

function resolveNegotiationPostMatchId(
  negotiation: Negotiation,
): string | undefined {
  return negotiation.postMatchId ?? negotiation.matchId
}

function mapParticipants(participants: readonly Participant[]): Participant[] {
  return participants
    .filter((participant) => participant.userId)
    .map((participant) => ({
      userId: participant.userId,
      role: participant.role ?? 'participant',
      opportunityId: participant.opportunityId,
    }))
}

export class NegotiationCommandHandler {
  private readonly negotiationRepository: NegotiationRepository
  private readonly postMatchRepository: PostMatchRepository
  private readonly opportunityRepository: OpportunityRepository | null
  private readonly applicationRepository: ApplicationRepository | null
  private readonly auditRepository: AuditRepository | null
  private readonly notificationRepository: NotificationSink | null

  constructor(deps: NegotiationCommandHandlerDeps) {
    this.negotiationRepository = deps.negotiationRepository
    this.postMatchRepository = deps.postMatchRepository
    this.opportunityRepository = deps.opportunityRepository ?? null
    this.applicationRepository = deps.applicationRepository ?? null
    this.auditRepository = deps.auditRepository ?? null
    this.notificationRepository = deps.notificationRepository ?? null
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
      case 'StartNegotiationFromPostMatch':
        return this.handleStartFromPostMatch(
          command as StartNegotiationFromPostMatchCommand,
        )
      case 'StartNegotiationFromApplication':
        return this.handleStartFromApplication(
          command as StartNegotiationFromApplicationCommand,
        )
      case 'AgreeNegotiation':
        return this.handleAgree(command as AgreeNegotiationCommand)
      case 'CancelNegotiation':
        return this.handleCancel(command as CancelNegotiationCommand)
      case 'TransitionNegotiationStatus':
        return this.handleTransition(
          command as TransitionNegotiationStatusCommand,
        )
      default:
        return failure(command.commandType, command.aggregateId, [
          `Unsupported Negotiation command type "${command.commandType}"`,
        ])
    }
  }

  private handleStartFromPostMatch(
    command: StartNegotiationFromPostMatchCommand,
  ): CommandResult {
    const postMatchId = command.aggregateId
    const postMatch = this.postMatchRepository.getById(postMatchId)
    if (!postMatch) {
      return failure(command.commandType, postMatchId, [
        `PostMatch "${postMatchId}" not found`,
      ])
    }

    const currentStatus =
      toCanonical(POST_MATCH_ENTITY, postMatch.status ?? '') ?? ''
    if (currentStatus !== 'confirmed') {
      return failure(command.commandType, postMatchId, [
        `Negotiation can only start from a confirmed PostMatch (current status: "${currentStatus || postMatch.status}")`,
      ])
    }

    const matchType = (postMatch.matchType || 'one_way').toLowerCase()
    const { opportunityIds, needOpportunityId, offerOpportunityId } =
      resolvePostMatchOpportunityIds(postMatch)

    if (matchType === 'one_way') {
      // Preserve one_way behavior exactly: require both need and offer.
      if (!needOpportunityId || !offerOpportunityId) {
        return failure(command.commandType, postMatchId, [
          'PostMatch is missing needOpportunityId or offerOpportunityId',
        ])
      }
    } else if (opportunityIds.length < 2) {
      return failure(command.commandType, postMatchId, [
        'PostMatch does not reference enough opportunities to start a negotiation',
      ])
    }

    const existingActive =
      this.negotiationRepository.findActiveByPostMatchId(postMatchId)
    if (existingActive) {
      return failure(command.commandType, postMatchId, [
        `Active negotiation already exists for PostMatch "${postMatchId}" (${existingActive.id})`,
      ])
    }

    const participants = mapParticipants(postMatch.participants ?? [])
    if (participants.length === 0) {
      return failure(command.commandType, postMatchId, [
        'PostMatch has no participants',
      ])
    }

    const opportunityId = needOpportunityId ?? opportunityIds[0]
    const termsSeed = seedCommercialTermsFromOpportunity(
      this.opportunityRepository,
      opportunityId,
    )
    const negotiation = this.negotiationRepository.create({
      opportunityId,
      postMatchId,
      needOpportunityId,
      offerOpportunityId,
      opportunityIds: [...opportunityIds],
      matchId: postMatchId,
      participants,
      status: 'active',
      rounds: [],
      commercialTerms: termsSeed?.commercialTerms,
      initialTerms: termsSeed?.initialTerms ?? {
        message: buildNegotiationOpenMessage(matchType),
      } as NegotiationTerms,
    })

    this.postMatchRepository.update(postMatchId, {
      negotiationId: negotiation.id,
    })

    emitParticipantNotifications(this.notificationRepository, {
      participants,
      type: 'negotiation_started',
      title: 'Negotiation started',
      message: 'A negotiation has started from your confirmed match.',
      link: `/matches/${postMatchId}`,
      entityType: 'negotiation',
      entityId: negotiation.id,
    })

    this.appendAudit({
      action: 'negotiation.started_from_post_match',
      entityType: 'negotiation',
      entityId: negotiation.id,
      requestId: command.clientRequestId,
      details: {
        postMatchId,
        needOpportunityId,
        offerOpportunityId,
        status: 'active',
      },
    })

    return success(command.commandType, negotiation.id)
  }

  private handleStartFromApplication(
    command: StartNegotiationFromApplicationCommand,
  ): CommandResult {
    const applicationId = command.aggregateId
    if (!this.applicationRepository) {
      return failure(command.commandType, applicationId, [
        'Application repository is not configured',
      ])
    }

    const application = this.applicationRepository.getById(applicationId)
    if (!application) {
      return failure(command.commandType, applicationId, [
        `Application "${applicationId}" not found`,
      ])
    }

    const currentStatus =
      toCanonical(APPLICATION_ENTITY, application.status ?? '') ?? ''
    if (currentStatus !== ACCEPTED_APPLICATION_STATUS) {
      return failure(command.commandType, applicationId, [
        `Negotiation can only start from an accepted Application (current status: "${currentStatus || application.status}")`,
      ])
    }

    const existingActive =
      this.negotiationRepository.findActiveByApplicationId(applicationId)
    if (existingActive) {
      return failure(command.commandType, applicationId, [
        `Active negotiation already exists for Application "${applicationId}" (${existingActive.id})`,
      ])
    }

    if (!this.opportunityRepository) {
      return failure(command.commandType, applicationId, [
        'Opportunity repository is not configured',
      ])
    }

    const opportunity = this.opportunityRepository.getById(application.opportunityId)
    if (!opportunity) {
      return failure(command.commandType, applicationId, [
        `Opportunity "${application.opportunityId}" not found`,
      ])
    }

    const participants: Participant[] = [
      {
        userId: application.applicantId,
        role: 'applicant',
        opportunityId: application.opportunityId,
      },
      ...(opportunity.creatorId
        ? [{
            userId: opportunity.creatorId,
            role: 'hiring_party',
            opportunityId: application.opportunityId,
          }]
        : []),
    ]

    if (participants.length === 0) {
      return failure(command.commandType, applicationId, [
        'Application has no participants to negotiate with',
      ])
    }

    const termsSeed = seedCommercialTermsFromOpportunity(
      this.opportunityRepository,
      application.opportunityId,
    )
    const mergedTerms = application.commercialTerms
      ? {
          commercialTerms: {
            ...termsSeed?.commercialTerms,
            ...application.commercialTerms,
          },
          initialTerms: {
            message: 'Negotiation opened from accepted application.',
            ...termsSeed?.commercialTerms,
            ...application.commercialTerms,
          } as NegotiationTerms,
        }
      : termsSeed

    const negotiation = this.negotiationRepository.create({
      opportunityId: application.opportunityId,
      applicationId,
      participants,
      status: 'active',
      rounds: [],
      commercialTerms: mergedTerms?.commercialTerms,
      initialTerms: mergedTerms?.initialTerms ?? {
        message: 'Negotiation opened from accepted application.',
      } as NegotiationTerms,
    })

    this.applicationRepository.update(applicationId, {
      negotiationId: negotiation.id,
    })

    emitParticipantNotifications(this.notificationRepository, {
      participants,
      type: 'negotiation_started',
      title: 'Negotiation started',
      message: 'A negotiation has started from your accepted application.',
      link: `/negotiations/${negotiation.id}`,
      entityType: 'negotiation',
      entityId: negotiation.id,
    })

    this.appendAudit({
      action: 'negotiation.started_from_application',
      entityType: 'negotiation',
      entityId: negotiation.id,
      requestId: command.clientRequestId,
      details: {
        applicationId,
        opportunityId: application.opportunityId,
        status: 'active',
      },
    })

    return success(command.commandType, negotiation.id)
  }

  private handleAgree(command: AgreeNegotiationCommand): CommandResult {
    const negotiationId = command.aggregateId
    const negotiation = this.negotiationRepository.getById(negotiationId)
    if (!negotiation) {
      return failure(command.commandType, negotiationId, [
        `Negotiation "${negotiationId}" not found`,
      ])
    }

    const currentCanonical =
      toCanonical(NEGOTIATION_ENTITY, negotiation.status ?? '') ?? ''
    if (currentCanonical === AGREED_STATUS) {
      return success(command.commandType, negotiationId)
    }

    const transitionErrors = validateTransition(
      negotiation.status ?? '',
      AGREED_STATUS,
    )
    if (transitionErrors.length > 0) {
      return failure(command.commandType, negotiationId, transitionErrors)
    }

    const terms =
      negotiation.commercialTerms ??
      negotiation.agreedTerms ??
      negotiation.initialTerms

    this.negotiationRepository.update(negotiationId, {
      status: AGREED_STATUS,
      agreedTerms: terms ?? null,
      commercialTerms: negotiation.commercialTerms ?? undefined,
    })

    this.appendAudit({
      action: 'negotiation.agreed',
      entityType: 'negotiation',
      entityId: negotiationId,
      requestId: command.clientRequestId,
      details: {
        previousStatus: negotiation.status,
        status: AGREED_STATUS,
        postMatchId: resolveNegotiationPostMatchId(negotiation),
      },
    })

    return success(command.commandType, negotiationId)
  }

  private handleCancel(command: CancelNegotiationCommand): CommandResult {
    const negotiationId = command.aggregateId
    const negotiation = this.negotiationRepository.getById(negotiationId)
    if (!negotiation) {
      return failure(command.commandType, negotiationId, [
        `Negotiation "${negotiationId}" not found`,
      ])
    }

    const currentCanonical =
      toCanonical(NEGOTIATION_ENTITY, negotiation.status ?? '') ?? ''
    if (currentCanonical === CANCELLED_STATUS) {
      return success(command.commandType, negotiationId)
    }

    const transitionErrors = validateTransition(
      negotiation.status ?? '',
      CANCELLED_STATUS,
    )
    if (transitionErrors.length > 0) {
      return failure(command.commandType, negotiationId, transitionErrors)
    }

    this.negotiationRepository.update(negotiationId, {
      status: CANCELLED_STATUS,
    })

    this.appendAudit({
      action: 'negotiation.cancelled',
      entityType: 'negotiation',
      entityId: negotiationId,
      requestId: command.clientRequestId,
      details: {
        previousStatus: negotiation.status,
        status: CANCELLED_STATUS,
        postMatchId: resolveNegotiationPostMatchId(negotiation),
      },
    })

    return success(command.commandType, negotiationId)
  }

  private handleTransition(
    command: TransitionNegotiationStatusCommand,
  ): CommandResult {
    if (!command.targetStatus?.trim()) {
      return failure(command.commandType, command.aggregateId, [
        'targetStatus is required',
      ])
    }

    const negotiationId = command.aggregateId
    const negotiation = this.negotiationRepository.getById(negotiationId)
    if (!negotiation) {
      return failure(command.commandType, negotiationId, [
        `Negotiation "${negotiationId}" not found`,
      ])
    }

    const canonicalTarget = toCanonical(NEGOTIATION_ENTITY, command.targetStatus)
    if (!canonicalTarget) {
      return failure(command.commandType, negotiationId, [
        `Unknown target status "${command.targetStatus}"`,
      ])
    }

    const currentCanonical =
      toCanonical(NEGOTIATION_ENTITY, negotiation.status ?? '') ?? ''
    if (currentCanonical === canonicalTarget) {
      return success(command.commandType, negotiationId)
    }

    const transitionErrors = validateTransition(
      negotiation.status ?? '',
      command.targetStatus,
    )
    if (transitionErrors.length > 0) {
      return failure(command.commandType, negotiationId, transitionErrors)
    }

    this.negotiationRepository.update(negotiationId, {
      status: canonicalTarget,
    })

    this.appendAudit({
      action: 'negotiation.status_changed',
      entityType: 'negotiation',
      entityId: negotiationId,
      requestId: command.clientRequestId,
      details: {
        previousStatus: negotiation.status,
        targetStatus: canonicalTarget,
        postMatchId: resolveNegotiationPostMatchId(negotiation),
      },
    })

    return success(command.commandType, negotiationId)
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

export function isActiveNegotiationRecord(
  negotiation: Negotiation | undefined,
): boolean {
  return Boolean(
    negotiation && isActiveNegotiationStatus(negotiation.status),
  )
}
