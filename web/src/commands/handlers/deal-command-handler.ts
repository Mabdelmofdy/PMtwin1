import type {
  Command,
  CommandResult,
  CreateDealFromApplicationCommand,
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
import type { ApplicationRepository } from '@/repositories/application-repository.ts'
import type { CommercialAgreementRepository } from '@/repositories/commercial-agreement-repository.ts'
import type { NegotiationRepository } from '@/repositories/negotiation-repository.ts'
import type { PostMatchRepository } from '@/repositories/post-match-repository.ts'

const POST_MATCH_ENTITY = 'match' as const
const NEGOTIATION_ENTITY = 'negotiation' as const
const COMMERCIAL_AGREEMENT_ENTITY = 'commercial_agreement' as const

export type DealCommandHandlerDeps = {
  readonly dealRepository: CommercialAgreementRepository
  readonly negotiationRepository: NegotiationRepository
  readonly postMatchRepository: PostMatchRepository
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
  const fsm = getFsm(COMMERCIAL_AGREEMENT_ENTITY)
  if (!fsm) {
    return ['Commercial Agreement lifecycle FSM is not available']
  }

  const fromCanonical = toCanonical(COMMERCIAL_AGREEMENT_ENTITY, currentStatus)
  const toCanonicalStatus = toCanonical(COMMERCIAL_AGREEMENT_ENTITY, targetStatus)

  if (!fromCanonical) {
    return [`Unknown current status "${currentStatus}"`]
  }
  if (!toCanonicalStatus) {
    return [`Unknown target status "${targetStatus}"`]
  }
  if (fromCanonical === toCanonicalStatus) {
    return []
  }
  if (isTerminal(COMMERCIAL_AGREEMENT_ENTITY, currentStatus)) {
    return [
      `Commercial Agreement is in terminal state "${fromCanonical}" and cannot transition`,
    ]
  }

  const allowed = allowedTransitions(COMMERCIAL_AGREEMENT_ENTITY, currentStatus)
  if (!allowed.includes(toCanonicalStatus)) {
    return [
      `Transition ${fromCanonical} → ${toCanonicalStatus} is not allowed`,
    ]
  }

  return []
}

export class DealCommandHandler {
  private readonly dealRepository: CommercialAgreementRepository
  private readonly negotiationRepository: NegotiationRepository
  private readonly postMatchRepository: PostMatchRepository
  private readonly applicationRepository: ApplicationRepository | null
  private readonly auditRepository: AuditRepository | null
  private readonly notificationRepository: NotificationSink | null

  constructor(deps: DealCommandHandlerDeps) {
    this.dealRepository = deps.dealRepository
    this.negotiationRepository = deps.negotiationRepository
    this.postMatchRepository = deps.postMatchRepository
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
      case 'CreateCommercialAgreementFromPostMatch':
      case 'CreateDealFromPostMatch':
        return this.handleCreateFromPostMatch(
          command as CreateDealFromPostMatchCommand,
        )
      case 'CreateCommercialAgreementFromApplication':
      case 'CreateDealFromApplication':
        return this.handleCreateFromApplication(
          command as CreateDealFromApplicationCommand,
        )
      case 'CreateCommercialAgreementFromNegotiation':
      case 'CreateDealFromNegotiation':
        return this.handleCreateFromNegotiation(
          command as CreateDealFromNegotiationCommand,
        )
      case 'TransitionCommercialAgreementStatus':
      case 'TransitionDealStatus':
        return this.handleTransition(command as TransitionDealStatusCommand)
      default:
        return failure(command.commandType, command.aggregateId, [
          `Unsupported Commercial Agreement command type "${command.commandType}"`,
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
        `Commercial Agreement can only be created from a confirmed PostMatch (current status: "${postMatchStatus || postMatch.status}")`,
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
        `Commercial Agreement can only be created from an agreed Negotiation (current status: "${negotiationStatus || negotiation.status}")`,
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
        `Commercial Agreement already exists for PostMatch "${postMatchId}" (${existingByPostMatch.id})`,
      ])
    }

    const existingByNegotiation = this.dealRepository.findByNegotiationId(
      command.negotiationId,
    )
    if (existingByNegotiation) {
      return failure(command.commandType, postMatchId, [
        `Commercial Agreement already exists for Negotiation "${command.negotiationId}" (${existingByNegotiation.id})`,
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
      auditAction: 'commercial_agreement.created_from_post_match',
    })
  }

  private handleCreateFromApplication(
    command: CreateDealFromApplicationCommand,
  ): CommandResult {
    const applicationId = command.aggregateId

    if (!command.negotiationId?.trim()) {
      return failure(command.commandType, applicationId, [
        'negotiationId is required',
      ])
    }

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

    const negotiation = this.negotiationRepository.getById(command.negotiationId)
    if (!negotiation) {
      return failure(command.commandType, applicationId, [
        `Negotiation "${command.negotiationId}" not found`,
      ])
    }

    const negotiationStatus =
      toCanonical(NEGOTIATION_ENTITY, negotiation.status ?? '') ?? ''
    if (negotiationStatus !== 'agreed') {
      return failure(command.commandType, applicationId, [
        `Commercial Agreement can only be created from an agreed Negotiation (current status: "${negotiationStatus || negotiation.status}")`,
      ])
    }

    if (negotiation.applicationId !== applicationId) {
      return failure(command.commandType, applicationId, [
        `Negotiation applicationId "${negotiation.applicationId}" does not match "${applicationId}"`,
      ])
    }

    const existingByApplication = this.dealRepository.findByApplicationId(applicationId)
    if (existingByApplication) {
      return failure(command.commandType, applicationId, [
        `Commercial Agreement already exists for Application "${applicationId}" (${existingByApplication.id})`,
      ])
    }

    const existingByNegotiation = this.dealRepository.findByNegotiationId(
      command.negotiationId,
    )
    if (existingByNegotiation) {
      return failure(command.commandType, applicationId, [
        `Commercial Agreement already exists for Negotiation "${command.negotiationId}" (${existingByNegotiation.id})`,
      ])
    }

    const participants = mapParticipants(
      negotiation.participants ?? negotiation.parties ?? [],
    )
    if (participants.length === 0) {
      return failure(command.commandType, applicationId, [
        'Commercial Agreement requires at least one participant',
      ])
    }

    const commercialTerms = commercialTermsFromLegacyTerms(
      negotiation.commercialTerms ??
        negotiation.agreedTerms ??
        negotiation.initialTerms,
    )

    const deal = this.dealRepository.create({
      negotiationId: command.negotiationId,
      applicationId,
      opportunityId: application.opportunityId,
      opportunityIds: [application.opportunityId],
      title: `Commercial Agreement – Application ${applicationId}`,
      status: 'draft',
      participants,
      parties: participants,
      commercialTerms,
      terms: commercialTerms,
    })

    this.applicationRepository.update(applicationId, {
      commercialAgreementId: deal.id,
      dealId: deal.id,
    })

    emitParticipantNotifications(this.notificationRepository, {
      participants,
      type: 'deal_created_from_application',
      title: 'Commercial Agreement created',
      message: 'A commercial agreement was created from your accepted application.',
      link: `/commercial-agreements/${deal.id}`,
      entityType: 'commercial_agreement',
      entityId: deal.id,
    })

    this.appendAudit({
      action: 'commercial_agreement.created_from_application',
      entityType: 'commercial_agreement',
      entityId: deal.id,
      requestId: command.clientRequestId,
      details: {
        applicationId,
        negotiationId: command.negotiationId,
        opportunityId: application.opportunityId,
        status: 'draft',
      },
    })

    return success(command.commandType, deal.id)
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
        `Commercial Agreement can only be created from an agreed Negotiation (current status: "${negotiationStatus || negotiation.status}")`,
      ])
    }

    const existingByNegotiation = this.dealRepository.findByNegotiationId(
      negotiationId,
    )
    if (existingByNegotiation) {
      return failure(command.commandType, negotiationId, [
        `Commercial Agreement already exists for Negotiation "${negotiationId}" (${existingByNegotiation.id})`,
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
        `Commercial Agreement already exists for PostMatch "${postMatchId}" (${existingByPostMatch.id})`,
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
        `Commercial Agreement can only be created from a confirmed PostMatch (current status: "${postMatchStatus || postMatch.status}")`,
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
      auditAction: 'commercial_agreement.created_from_negotiation',
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
        'PostMatch does not reference enough opportunities to create a commercial agreement',
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
        'Commercial Agreement requires at least one participant',
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
      title: `Commercial Agreement – ${postMatchId}`,
      status: 'draft',
      participants,
      parties: participants,
      commercialTerms,
      terms: commercialTerms,
      applicationId: negotiation.applicationId ?? null,
    })

    this.postMatchRepository.update(postMatchId, {
      commercialAgreementId: deal.id,
      dealId: deal.id,
    })

    emitParticipantNotifications(this.notificationRepository, {
      participants,
      type: 'deal_created_from_match',
      title: 'Commercial Agreement created',
      message: 'A commercial agreement was created from your match.',
      link: `/commercial-agreements/${deal.id}`,
      entityType: 'commercial_agreement',
      entityId: deal.id,
    })

    this.appendAudit({
      action: auditAction,
      entityType: 'commercial_agreement',
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
        `Commercial Agreement "${dealId}" not found`,
      ])
    }

    const canonicalTarget = toCanonical(COMMERCIAL_AGREEMENT_ENTITY, command.targetStatus)
    if (!canonicalTarget) {
      return failure(command.commandType, dealId, [
        `Unknown target status "${command.targetStatus}"`,
      ])
    }

    const currentCanonical =
      toCanonical(COMMERCIAL_AGREEMENT_ENTITY, deal.status ?? '') ?? ''
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
      action: 'commercial_agreement.status_changed',
      entityType: 'commercial_agreement',
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
