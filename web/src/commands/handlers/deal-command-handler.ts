import type {
  AwardCommercialAgreementCommand,
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
import type { ContractRepository } from '@/repositories/contract-repository.ts'
import type { NegotiationRepository } from '@/repositories/negotiation-repository.ts'
import type { OpportunityRepository } from '@/repositories/opportunity-repository.ts'
import type { PostMatchRepository } from '@/repositories/post-match-repository.ts'
import {
  companyRepository,
  userRepository,
} from '@/repositories/index.ts'
import {
  buildMatchingDiscoveryContext,
  resolveOpportunityOwner,
} from '@/domain/identity/matching-discovery-context.ts'
import {
  resolveWriteActorFromCommand,
  stampCommercialAgreementCreateMetadata,
  stampCommercialAgreementDecisionMetadata,
  stampParticipants,
} from '@/domain/identity/command-actor-stamping.ts'
import { getCommandPermissionActor } from '@/domain/rbac/context/command-permission-context.ts'
import {
  createLifecycleOrchestrator,
  type LifecycleOrchestrator,
} from '@/services/lifecycle-orchestrator.ts'
import { buildCommercialAgreementStoredTitle } from '@/lib/entity-display-titles.ts'

const POST_MATCH_ENTITY = 'match' as const
const NEGOTIATION_ENTITY = 'negotiation' as const
const COMMERCIAL_AGREEMENT_ENTITY = 'commercial_agreement' as const

export type DealCommandHandlerDeps = {
  readonly dealRepository: CommercialAgreementRepository
  readonly negotiationRepository: NegotiationRepository
  readonly postMatchRepository: PostMatchRepository
  readonly contractRepository?: ContractRepository | null
  readonly opportunityRepository?: OpportunityRepository | null
  readonly applicationRepository?: ApplicationRepository | null
  readonly auditRepository?: AuditRepository | null
  readonly notificationRepository?: NotificationSink | null
  readonly lifecycleOrchestrator?: LifecycleOrchestrator | null
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

function ownershipContextForHandlers(): ReturnType<typeof buildMatchingDiscoveryContext> {
  return buildMatchingDiscoveryContext(
    userRepository.getAll().map((user) => user.id),
    companyRepository.getAll().map((company) => company.id),
  )
}

function mapParticipants(participants: readonly Participant[]): Participant[] {
  return stampParticipants(
    participants
      .filter((participant) => participant.userId)
      .map((participant) => ({
        userId: participant.userId,
        role: participant.role ?? 'participant',
        opportunityId: participant.opportunityId,
        partyId: participant.partyId,
        workspaceId: participant.workspaceId,
      })),
    ownershipContextForHandlers(),
  )
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
  private readonly contractRepository: ContractRepository | null
  private readonly opportunityRepository: OpportunityRepository | null
  private readonly applicationRepository: ApplicationRepository | null
  private readonly auditRepository: AuditRepository | null
  private readonly notificationRepository: NotificationSink | null
  private readonly lifecycleOrchestrator: LifecycleOrchestrator | null

  constructor(deps: DealCommandHandlerDeps) {
    this.dealRepository = deps.dealRepository
    this.negotiationRepository = deps.negotiationRepository
    this.postMatchRepository = deps.postMatchRepository
    this.contractRepository = deps.contractRepository ?? null
    this.opportunityRepository = deps.opportunityRepository ?? null
    this.applicationRepository = deps.applicationRepository ?? null
    this.auditRepository = deps.auditRepository ?? null
    this.notificationRepository = deps.notificationRepository ?? null
    this.lifecycleOrchestrator =
      deps.lifecycleOrchestrator ??
      createLifecycleOrchestrator({
        dealRepository: deps.dealRepository,
        opportunityRepository: deps.opportunityRepository ?? undefined,
        postMatchRepository: deps.postMatchRepository,
      })
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
      case 'AwardCommercialAgreement':
        return this.handleAwardCommercialAgreement(command as AwardCommercialAgreementCommand)
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

    const applicationOpportunity = this.opportunityRepository?.getById(
      application.opportunityId,
    )

    const deal = this.dealRepository.create({
      negotiationId: command.negotiationId,
      applicationId,
      opportunityId: application.opportunityId,
      opportunityIds: [application.opportunityId],
      title: buildCommercialAgreementStoredTitle({
        needTitle: applicationOpportunity?.title,
      }),
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

    this.lifecycleOrchestrator?.syncOpportunitiesFromDealCreated(deal)

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

    const primaryOpportunityId = needOpportunityId ?? opportunityIds[0]
    const opportunity = this.opportunityRepository?.getById(primaryOpportunityId)
    const needOpportunity = needOpportunityId
      ? this.opportunityRepository?.getById(needOpportunityId)
      : undefined
    const offerOpportunity = offerOpportunityId
      ? this.opportunityRepository?.getById(offerOpportunityId)
      : undefined
    const originatingOwnerPartyId = opportunity
      ? resolveOpportunityOwner(opportunity, ownershipContextForHandlers())?.ownerPartyId
      : negotiation.originatingOwnerPartyId
    const actor = resolveWriteActorFromCommand(
      getCommandPermissionActor()?.userId ?? participants[0]?.userId ?? '',
    )

    const deal = this.dealRepository.create({
      negotiationId,
      postMatchId,
      needOpportunityId,
      offerOpportunityId,
      matchId: postMatchId,
      opportunityId: primaryOpportunityId,
      opportunityIds: [...opportunityIds],
      matchType: postMatch.matchType,
      title: buildCommercialAgreementStoredTitle({
        needTitle: needOpportunity?.title,
        offerTitle: offerOpportunity?.title,
      }),
      status: 'draft',
      participants,
      parties: participants,
      commercialTerms,
      terms: commercialTerms,
      applicationId: negotiation.applicationId ?? null,
      ...stampCommercialAgreementCreateMetadata(actor, originatingOwnerPartyId),
    })

    this.postMatchRepository.update(postMatchId, {
      commercialAgreementId: deal.id,
      dealId: deal.id,
    })

    this.lifecycleOrchestrator?.syncOpportunitiesFromDealCreated(deal)

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

    const actor = resolveWriteActorFromCommand(
      getCommandPermissionActor()?.userId ?? '',
    )
    this.dealRepository.update(dealId, {
      status: canonicalTarget,
      lastModifiedByUserId: actor.actorUserId,
    })

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

  private handleAwardCommercialAgreement(
    command: AwardCommercialAgreementCommand,
  ): CommandResult {
    const commercialAgreementId =
      command.commercialAgreementId?.trim() || command.aggregateId
    const winner = this.dealRepository.getById(commercialAgreementId)
    if (!winner) {
      return failure(command.commandType, command.aggregateId, [
        `Commercial Agreement "${commercialAgreementId}" not found`,
      ])
    }

    const opportunityId = winner.opportunityId
    const siblings = this.dealRepository
      .getAll()
      .filter((item) => item.opportunityId === opportunityId && item.id !== winner.id)
    const existingAward = this.dealRepository
      .getAll()
      .find((item) => item.opportunityId === opportunityId && item.awardStatus === 'awarded' && item.id !== winner.id)
    if (existingAward) {
      return failure(command.commandType, command.aggregateId, [
        `Opportunity already has awarded commercial agreement "${existingAward.id}"`,
      ])
    }

    const shouldCreateContract = command.createContract !== false
    const hasExistingContract = this.contractRepository
      ? this.contractRepository
        .findByDealId(winner.id)
        .some((contract) => ['draft', 'pending_signature', 'active'].includes((contract.status ?? '').toLowerCase()))
      : false
    if (shouldCreateContract && !hasExistingContract && !this.contractRepository) {
      return failure(command.commandType, command.aggregateId, [
        'Contract repository is required to create contract during award',
      ])
    }

    const winnerBefore = this.dealRepository.getById(winner.id)
    const siblingBefore = siblings.map((item) => ({
      id: item.id,
      status: item.status,
      awardStatus: item.awardStatus,
    }))
    const winnerNegotiationBefore = winner.negotiationId
      ? this.negotiationRepository.getById(winner.negotiationId)
      : null
    const siblingNegotiationsBefore = siblings
      .map((item) => item.negotiationId)
      .filter((id): id is string => Boolean(id))
      .map((id) => this.negotiationRepository.getById(id))
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .map((item) => ({ id: item.id, status: item.status }))
    const opportunityBefore = this.opportunityRepository?.getById(opportunityId)

    const awardActor = resolveWriteActorFromCommand(
      command.actorUserId ?? getCommandPermissionActor()?.userId ?? '',
    )
    const awardMetadata = stampCommercialAgreementDecisionMetadata(awardActor)

    this.dealRepository.update(winner.id, {
      awardStatus: 'awarded',
      status: 'signing',
      ...awardMetadata,
    })

    const winnerNegotiation = winner.negotiationId
      ? this.negotiationRepository.getById(winner.negotiationId)
      : null
    if (winnerNegotiation) {
      this.negotiationRepository.update(winnerNegotiation.id, { status: 'agreed' })
    }

    const siblingNegotiationIds = new Set<string>()
    for (const sibling of siblings) {
      this.dealRepository.update(sibling.id, {
        awardStatus: 'rejected',
        status: 'cancelled',
      })
      if (sibling.negotiationId) siblingNegotiationIds.add(sibling.negotiationId)
    }
    for (const negotiationId of siblingNegotiationIds) {
      const negotiation = this.negotiationRepository.getById(negotiationId)
      if (!negotiation) continue
      this.negotiationRepository.update(negotiationId, { status: 'cancelled' })
    }

    try {
      if (shouldCreateContract && this.contractRepository && !hasExistingContract) {
        this.contractRepository.create({
          commercialAgreementId: winner.id,
          dealId: winner.id,
          opportunityId: winner.opportunityId,
          opportunityIds: winner.opportunityIds,
          matchId: winner.postMatchId ?? winner.matchId ?? null,
          negotiationId: winner.negotiationId ?? null,
          participants: winner.participants,
          parties: winner.participants,
          commercialTerms: winner.commercialTerms,
          terms: winner.terms as Record<string, unknown> | undefined,
          scope: winner.scope,
          status: 'draft',
          createdByUserId: awardActor.actorUserId,
          createdByActorType: awardActor.actorType ?? 'marketplace_user',
        })
      }
    } catch (error) {
      if (winnerBefore) {
        this.dealRepository.update(winner.id, {
          status: winnerBefore.status,
          awardStatus: winnerBefore.awardStatus,
        })
      }
      for (const sibling of siblingBefore) {
        this.dealRepository.update(sibling.id, {
          status: sibling.status,
          awardStatus: sibling.awardStatus,
        })
      }
      if (winnerNegotiationBefore) {
        this.negotiationRepository.update(winnerNegotiationBefore.id, {
          status: winnerNegotiationBefore.status,
        })
      }
      for (const negotiation of siblingNegotiationsBefore) {
        this.negotiationRepository.update(negotiation.id, {
          status: negotiation.status,
        })
      }
      if (opportunityBefore && this.opportunityRepository) {
        this.opportunityRepository.update(opportunityBefore.id, {
          visibilityStatus: opportunityBefore.visibilityStatus,
        })
      }
      return failure(command.commandType, command.aggregateId, [
        error instanceof Error
          ? `Contract creation failed: ${error.message}`
          : 'Contract creation failed during award',
      ])
    }

    if (this.opportunityRepository?.getById(opportunityId)) {
      this.opportunityRepository.update(opportunityId, {
        visibilityStatus: 'closed',
      })
    }

    this.appendAudit({
      action: 'commercial_agreement.awarded',
      entityType: 'commercial_agreement',
      entityId: winner.id,
      requestId: command.clientRequestId,
      details: { opportunityId },
    })
    this.appendAudit({
      action: 'opportunity.closed',
      entityType: 'opportunity',
      entityId: opportunityId,
      requestId: command.clientRequestId,
      details: { visibilityStatus: 'closed' },
    })
    this.appendAudit({
      action: 'winner_negotiation.completed',
      entityType: 'negotiation',
      entityId: winner.negotiationId,
      requestId: command.clientRequestId,
      details: { status: 'agreed' },
    })
    this.appendAudit({
      action: 'remaining_negotiations.cancelled',
      entityType: 'negotiation',
      entityId: winner.negotiationId,
      requestId: command.clientRequestId,
      details: { count: siblingNegotiationIds.size },
    })
    this.appendAudit({
      action: 'remaining_commercial_agreements.rejected',
      entityType: 'commercial_agreement',
      entityId: winner.id,
      requestId: command.clientRequestId,
      details: { count: siblings.length },
    })

    return success(command.commandType, winner.id)
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
