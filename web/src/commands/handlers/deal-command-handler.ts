import type {
  Command,
  CommandResult,
  CreateDealFromNegotiationCommand,
  CreateDealFromPostMatchCommand,
  TransitionDealStatusCommand,
} from '@pm-twin/commands'
import {
  allowedTransitions,
  getFsm,
  isTerminal,
  toCanonical,
} from '@pm-twin/lifecycle'
import type { AuditEntry, Negotiation, PostMatch } from '@/types/domain.ts'
import type { Participant } from '@/types/participant.ts'
import { commercialTermsFromLegacyTerms } from '@/types/commercial-terms.ts'
import { resolvePostMatchOpportunityIds } from '@/domain/normalized/post-match-opportunity-ids.ts'
import {
  emitParticipantNotifications,
  type NotificationSink,
} from '@/commands/handlers/lifecycle-notifications.ts'
import type { AuditRepository } from '@/repositories/audit-repository.ts'
import type { DealRepository } from '@/repositories/deal-repository.ts'
import type { NegotiationRepository } from '@/repositories/negotiation-repository.ts'
import type { PostMatchRepository } from '@/repositories/post-match-repository.ts'

const POST_MATCH_ENTITY = 'match' as const
const NEGOTIATION_ENTITY = 'negotiation' as const
const DEAL_ENTITY = 'deal' as const

export type DealCommandHandlerDeps = {
  readonly dealRepository: DealRepository
  readonly negotiationRepository: NegotiationRepository
  readonly postMatchRepository: PostMatchRepository
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

function resolveNegotiationPostMatchId(negotiation: Negotiation): string | undefined {
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

function validateDealTransition(
  currentStatus: string,
  targetStatus: string,
): readonly string[] {
  const fsm = getFsm(DEAL_ENTITY)
  if (!fsm) {
    return ['Deal lifecycle FSM is not available']
  }

  const fromCanonical = toCanonical(DEAL_ENTITY, currentStatus)
  const toCanonicalStatus = toCanonical(DEAL_ENTITY, targetStatus)

  if (!fromCanonical) {
    return [`Unknown current status "${currentStatus}"`]
  }
  if (!toCanonicalStatus) {
    return [`Unknown target status "${targetStatus}"`]
  }
  if (fromCanonical === toCanonicalStatus) {
    return []
  }
  if (isTerminal(DEAL_ENTITY, currentStatus)) {
    return [
      `Deal is in terminal state "${fromCanonical}" and cannot transition`,
    ]
  }

  const allowed = allowedTransitions(DEAL_ENTITY, currentStatus)
  if (!allowed.includes(toCanonicalStatus)) {
    return [
      `Transition ${fromCanonical} → ${toCanonicalStatus} is not allowed`,
    ]
  }

  return []
}

export class DealCommandHandler {
  private readonly dealRepository: DealRepository
  private readonly negotiationRepository: NegotiationRepository
  private readonly postMatchRepository: PostMatchRepository
  private readonly auditRepository: AuditRepository | null
  private readonly notificationRepository: NotificationSink | null

  constructor(deps: DealCommandHandlerDeps) {
    this.dealRepository = deps.dealRepository
    this.negotiationRepository = deps.negotiationRepository
    this.postMatchRepository = deps.postMatchRepository
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
      case 'CreateDealFromPostMatch':
        return this.handleCreateFromPostMatch(
          command as CreateDealFromPostMatchCommand,
        )
      case 'CreateDealFromNegotiation':
        return this.handleCreateFromNegotiation(
          command as CreateDealFromNegotiationCommand,
        )
      case 'TransitionDealStatus':
        return this.handleTransition(command as TransitionDealStatusCommand)
      default:
        return failure(command.commandType, command.aggregateId, [
          `Unsupported Deal command type "${command.commandType}"`,
        ])
    }
  }

  private handleCreateFromPostMatch(
    command: CreateDealFromPostMatchCommand,
  ): CommandResult {
    const postMatchId = command.aggregateId

    if (!command.negotiationId?.trim()) {
      return failure(command.commandType, postMatchId, [
        'negotiationId is required',
      ])
    }

    const postMatch = this.postMatchRepository.getById(postMatchId)
    if (!postMatch) {
      return failure(command.commandType, postMatchId, [
        `PostMatch "${postMatchId}" not found`,
      ])
    }

    const postMatchStatus =
      toCanonical(POST_MATCH_ENTITY, postMatch.status ?? '') ?? ''
    if (postMatchStatus !== 'confirmed') {
      return failure(command.commandType, postMatchId, [
        `Deal can only be created from a confirmed PostMatch (current status: "${postMatchStatus || postMatch.status}")`,
      ])
    }

    const negotiation = this.negotiationRepository.getById(command.negotiationId)
    if (!negotiation) {
      return failure(command.commandType, postMatchId, [
        `Negotiation "${command.negotiationId}" not found`,
      ])
    }

    const negotiationStatus =
      toCanonical(NEGOTIATION_ENTITY, negotiation.status ?? '') ?? ''
    if (negotiationStatus !== 'agreed') {
      return failure(command.commandType, postMatchId, [
        `Deal can only be created from an agreed Negotiation (current status: "${negotiationStatus || negotiation.status}")`,
      ])
    }

    const negotiationPostMatchId = resolveNegotiationPostMatchId(negotiation)
    if (!negotiationPostMatchId) {
      return failure(command.commandType, postMatchId, [
        'Negotiation must be linked to a PostMatch (postMatchId is required)',
      ])
    }
    if (negotiationPostMatchId !== postMatchId) {
      return failure(command.commandType, postMatchId, [
        `Negotiation postMatchId "${negotiationPostMatchId}" does not match "${postMatchId}"`,
      ])
    }

    const existingByPostMatch = this.dealRepository.findByPostMatchId(postMatchId)
    if (existingByPostMatch) {
      return failure(command.commandType, postMatchId, [
        `Deal already exists for PostMatch "${postMatchId}" (${existingByPostMatch.id})`,
      ])
    }

    const existingByNegotiation = this.dealRepository.findByNegotiationId(
      command.negotiationId,
    )
    if (existingByNegotiation) {
      return failure(command.commandType, postMatchId, [
        `Deal already exists for Negotiation "${command.negotiationId}" (${existingByNegotiation.id})`,
      ])
    }

    return this.persistDealFromAgreedNegotiation({
      commandType: command.commandType,
      clientRequestId: command.clientRequestId,
      failureAggregateId: postMatchId,
      negotiation,
      postMatch,
      negotiationId: command.negotiationId,
      postMatchId,
      auditAction: 'deal.created_from_post_match',
    })
  }

  private handleCreateFromNegotiation(
    command: CreateDealFromNegotiationCommand,
  ): CommandResult {
    const negotiationId = command.aggregateId

    if (
      command.negotiationId?.trim() &&
      command.negotiationId !== negotiationId
    ) {
      return failure(command.commandType, negotiationId, [
        'negotiationId must match aggregateId',
      ])
    }

    const negotiation = this.negotiationRepository.getById(negotiationId)
    if (!negotiation) {
      return failure(command.commandType, negotiationId, [
        `Negotiation "${negotiationId}" not found`,
      ])
    }

    const negotiationStatus =
      toCanonical(NEGOTIATION_ENTITY, negotiation.status ?? '') ?? ''
    if (negotiationStatus !== 'agreed') {
      return failure(command.commandType, negotiationId, [
        `Deal can only be created from an agreed Negotiation (current status: "${negotiationStatus || negotiation.status}")`,
      ])
    }

    const existingByNegotiation = this.dealRepository.findByNegotiationId(
      negotiationId,
    )
    if (existingByNegotiation) {
      return failure(command.commandType, negotiationId, [
        `Deal already exists for Negotiation "${negotiationId}" (${existingByNegotiation.id})`,
      ])
    }

    const postMatchId = resolveNegotiationPostMatchId(negotiation)
    if (!postMatchId) {
      return failure(command.commandType, negotiationId, [
        'Negotiation must be linked to a PostMatch (postMatchId is required)',
      ])
    }

    const existingByPostMatch = this.dealRepository.findByPostMatchId(postMatchId)
    if (existingByPostMatch) {
      return failure(command.commandType, negotiationId, [
        `Deal already exists for PostMatch "${postMatchId}" (${existingByPostMatch.id})`,
      ])
    }

    const postMatch = this.postMatchRepository.getById(postMatchId)
    if (!postMatch) {
      return failure(command.commandType, negotiationId, [
        `PostMatch "${postMatchId}" not found`,
      ])
    }

    const postMatchStatus =
      toCanonical(POST_MATCH_ENTITY, postMatch.status ?? '') ?? ''
    if (postMatchStatus !== 'confirmed') {
      return failure(command.commandType, negotiationId, [
        `Deal can only be created from a confirmed PostMatch (current status: "${postMatchStatus || postMatch.status}")`,
      ])
    }

    return this.persistDealFromAgreedNegotiation({
      commandType: command.commandType,
      clientRequestId: command.clientRequestId,
      failureAggregateId: negotiationId,
      negotiation,
      postMatch,
      negotiationId,
      postMatchId,
      auditAction: 'deal.created_from_negotiation',
    })
  }

  private persistDealFromAgreedNegotiation(input: {
    readonly commandType: string
    readonly clientRequestId: string
    readonly failureAggregateId: string
    readonly negotiation: Negotiation
    readonly postMatch: PostMatch
    readonly negotiationId: string
    readonly postMatchId: string
    readonly auditAction: string
  }): CommandResult {
    const {
      commandType,
      clientRequestId,
      failureAggregateId,
      negotiation,
      postMatch,
      negotiationId,
      postMatchId,
      auditAction,
    } = input

    const matchType = (postMatch.matchType || 'one_way').toLowerCase()
    const resolved = resolvePostMatchOpportunityIds(postMatch)
    const needOpportunityId =
      negotiation.needOpportunityId ?? resolved.needOpportunityId
    const offerOpportunityId =
      negotiation.offerOpportunityId ?? resolved.offerOpportunityId
    const opportunityIds =
      negotiation.opportunityIds && negotiation.opportunityIds.length > 0
        ? negotiation.opportunityIds
        : resolved.opportunityIds

    if (matchType === 'one_way') {
      // Preserve one_way behavior exactly: require both need and offer.
      if (!needOpportunityId || !offerOpportunityId) {
        return failure(commandType, failureAggregateId, [
          'PostMatch is missing needOpportunityId or offerOpportunityId',
        ])
      }
    } else if (opportunityIds.length < 2) {
      return failure(commandType, failureAggregateId, [
        'PostMatch does not reference enough opportunities to create a deal',
      ])
    }

    const participants = mapParticipants(
      negotiation.participants ??
        negotiation.parties ??
        postMatch.participants ??
        [],
    )
    if (participants.length === 0) {
      return failure(commandType, failureAggregateId, [
        'Deal requires at least one participant',
      ])
    }

    const commercialTerms = commercialTermsFromLegacyTerms(
      negotiation.commercialTerms ??
        negotiation.agreedTerms ??
        negotiation.initialTerms,
    )

    const deal = this.dealRepository.create({
      negotiationId,
      postMatchId,
      needOpportunityId,
      offerOpportunityId,
      matchId: postMatchId,
      opportunityId: needOpportunityId ?? opportunityIds[0],
      opportunityIds: [...opportunityIds],
      matchType: postMatch.matchType,
      title: `Deal – ${postMatchId}`,
      status: 'draft',
      participants,
      parties: participants,
      commercialTerms,
      terms: commercialTerms,
      applicationId: negotiation.applicationId ?? null,
    })

    this.postMatchRepository.update(postMatchId, { dealId: deal.id })

    emitParticipantNotifications(this.notificationRepository, {
      participants,
      type: 'deal_created_from_match',
      title: 'Deal created',
      message: 'A deal was created from your match.',
      link: `/deals/${deal.id}`,
      entityType: 'deal',
      entityId: deal.id,
    })

    this.appendAudit({
      action: auditAction,
      entityType: 'deal',
      entityId: deal.id,
      requestId: clientRequestId,
      details: {
        postMatchId,
        negotiationId,
        needOpportunityId,
        offerOpportunityId,
        status: 'draft',
      },
    })

    return success(commandType, deal.id)
  }

  private handleTransition(
    command: TransitionDealStatusCommand,
  ): CommandResult {
    if (!command.targetStatus?.trim()) {
      return failure(command.commandType, command.aggregateId, [
        'targetStatus is required',
      ])
    }

    const dealId = command.aggregateId
    const deal = this.dealRepository.getById(dealId)
    if (!deal) {
      return failure(command.commandType, dealId, [
        `Deal "${dealId}" not found`,
      ])
    }

    const canonicalTarget = toCanonical(DEAL_ENTITY, command.targetStatus)
    if (!canonicalTarget) {
      return failure(command.commandType, dealId, [
        `Unknown target status "${command.targetStatus}"`,
      ])
    }

    const currentCanonical =
      toCanonical(DEAL_ENTITY, deal.status ?? '') ?? ''
    if (currentCanonical === canonicalTarget) {
      return success(command.commandType, dealId)
    }

    const transitionErrors = validateDealTransition(
      deal.status ?? '',
      command.targetStatus,
    )
    if (transitionErrors.length > 0) {
      return failure(command.commandType, dealId, transitionErrors)
    }

    this.dealRepository.update(dealId, { status: canonicalTarget })

    this.appendAudit({
      action: 'deal.status_changed',
      entityType: 'deal',
      entityId: dealId,
      requestId: command.clientRequestId,
      details: {
        previousStatus: deal.status,
        targetStatus: canonicalTarget,
      },
    })

    return success(command.commandType, dealId)
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
