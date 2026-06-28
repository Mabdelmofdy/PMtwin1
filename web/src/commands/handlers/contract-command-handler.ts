import type {
  ActivateContractCommand,
  Command,
  CommandResult,
  CompleteContractCommand,
  ContractParty,
  CreateContractFromDealCommand,
  SignContractCommand,
  TerminateContractCommand,
} from '@pm-twin/commands'
import {
  allowedTransitions,
  getFsm,
  isTerminal,
  toCanonical,
} from '@pm-twin/lifecycle'
import type { AuditEntry, Contract, Deal } from '@/types/domain.ts'
import type { Participant } from '@/types/participant.ts'
import { normalizeParticipants } from '@/types/participant.ts'
import type { AuditRepository } from '@/repositories/audit-repository.ts'
import type { ContractRepository } from '@/repositories/contract-repository.ts'
import type { DealRepository } from '@/repositories/deal-repository.ts'
import type { OpportunityRepository } from '@/repositories/opportunity-repository.ts'
import type { PostMatchRepository } from '@/repositories/post-match-repository.ts'
import { resolveOpportunitySyncTarget } from '@/services/deal-opportunity-sync-rules.ts'
import {
  createLifecycleOrchestrator,
  type LifecycleOrchestrator,
} from '@/services/lifecycle-orchestrator.ts'

const CONTRACT_ENTITY = 'contract' as const
const DEAL_ENTITY = 'deal' as const

const DEAL_STATUSES_ALLOWING_CONTRACT = new Set(['draft', 'review', 'signing'])

export type ContractCommandHandlerDeps = {
  readonly contractRepository: ContractRepository
  readonly dealRepository: DealRepository
  readonly opportunityRepository?: OpportunityRepository
  readonly postMatchRepository?: PostMatchRepository
  readonly auditRepository?: AuditRepository | null
  readonly lifecycleOrchestrator?: LifecycleOrchestrator
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

function canonicalContractStatus(status: string | undefined): string {
  return toCanonical(CONTRACT_ENTITY, status ?? '') ?? ''
}

function canonicalDealStatus(status: string | undefined): string {
  return toCanonical(DEAL_ENTITY, status ?? '') ?? ''
}

function validateTransition(
  currentStatus: string,
  targetStatus: string,
): readonly string[] {
  const fsm = getFsm(CONTRACT_ENTITY)
  if (!fsm) {
    return ['Contract lifecycle FSM is not available']
  }

  const fromCanonical = toCanonical(CONTRACT_ENTITY, currentStatus)
  const toCanonicalStatus = toCanonical(CONTRACT_ENTITY, targetStatus)

  if (!fromCanonical) {
    return [`Unknown current status "${currentStatus}"`]
  }
  if (!toCanonicalStatus) {
    return [`Unknown target status "${targetStatus}"`]
  }
  if (fromCanonical === toCanonicalStatus) {
    return []
  }
  if (isTerminal(CONTRACT_ENTITY, currentStatus)) {
    return [
      `Contract is in terminal state "${fromCanonical}" and cannot transition`,
    ]
  }

  const allowed = allowedTransitions(CONTRACT_ENTITY, currentStatus)
  if (!allowed.includes(toCanonicalStatus)) {
    return [
      `Transition ${fromCanonical} → ${toCanonicalStatus} is not allowed`,
    ]
  }

  return []
}

function resolveDealPostMatchId(deal: Deal): string | undefined {
  return deal.postMatchId ?? deal.matchId ?? undefined
}

function mapContractParties(
  parties: readonly ContractParty[] | undefined,
  deal: Deal,
): Participant[] {
  const source: Participant[] = parties
    ? parties.map((party) => ({
        userId: party.userId,
        role: party.role,
        opportunityId: party.opportunityId,
        participantStatus: party.participantStatus,
        signedAt: party.signedAt ?? null,
      }))
    : normalizeParticipants(deal.participants, deal.parties)
  return source.map((participant) => ({
    userId: participant.userId,
    role: participant.role ?? 'participant',
    opportunityId: participant.opportunityId,
    participantStatus: participant.participantStatus,
    signedAt: participant.signedAt ?? null,
  }))
}

function allPartiesSigned(participants: readonly Participant[]): boolean {
  return (
    participants.length > 0 &&
    participants.every((participant) => Boolean(participant.signedAt))
  )
}

function isActiveContractForDeal(contract: Contract): boolean {
  return !isTerminal(CONTRACT_ENTITY, contract.status)
}

export class ContractCommandHandler {
  private readonly contractRepository: ContractRepository
  private readonly dealRepository: DealRepository
  private readonly auditRepository: AuditRepository | null
  private readonly lifecycleOrchestrator: LifecycleOrchestrator

  constructor(deps: ContractCommandHandlerDeps) {
    this.contractRepository = deps.contractRepository
    this.dealRepository = deps.dealRepository
    this.auditRepository = deps.auditRepository ?? null
    this.lifecycleOrchestrator =
      deps.lifecycleOrchestrator ??
      createLifecycleOrchestrator({
        dealRepository: deps.dealRepository,
        opportunityRepository: deps.opportunityRepository,
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
      case 'CreateContractFromDeal':
        return this.handleCreateFromDeal(
          command as CreateContractFromDealCommand,
        )
      case 'SignContract':
        return this.handleSign(command as SignContractCommand)
      case 'ActivateContract':
        return this.handleActivate(command as ActivateContractCommand)
      case 'CompleteContract':
        return this.handleComplete(command as CompleteContractCommand)
      case 'TerminateContract':
        return this.handleTerminate(command as TerminateContractCommand)
      default:
        return failure(command.commandType, command.aggregateId, [
          `Unsupported Contract command type "${command.commandType}"`,
        ])
    }
  }

  private handleCreateFromDeal(
    command: CreateContractFromDealCommand,
  ): CommandResult {
    const dealId = command.dealId?.trim()
    if (!dealId) {
      return failure(command.commandType, command.aggregateId, [
        'dealId is required',
      ])
    }
    if (dealId !== command.aggregateId) {
      return failure(command.commandType, command.aggregateId, [
        `dealId "${dealId}" must match aggregateId "${command.aggregateId}"`,
      ])
    }

    const deal = this.dealRepository.getById(dealId)
    if (!deal) {
      return failure(command.commandType, dealId, [
        `Deal "${dealId}" not found`,
      ])
    }

    const dealStatus = canonicalDealStatus(deal.status)
    if (!DEAL_STATUSES_ALLOWING_CONTRACT.has(dealStatus)) {
      return failure(command.commandType, dealId, [
        `Contract can only be created from a deal in draft, review, or signing (current status: "${dealStatus || deal.status}")`,
      ])
    }

    const dealPostMatchId = resolveDealPostMatchId(deal)
    const dealNegotiationId = deal.negotiationId?.trim()
    if (!dealPostMatchId && !dealNegotiationId) {
      return failure(command.commandType, dealId, [
        'Deal must be linked to postMatchId or negotiationId',
      ])
    }

    const existingActive = this.contractRepository
      .findByDealId(dealId)
      .find(isActiveContractForDeal)
    if (existingActive) {
      return failure(command.commandType, dealId, [
        `Active contract already exists for Deal "${dealId}" (${existingActive.id})`,
      ])
    }

    const participants = mapContractParties(command.parties, deal)
    if (participants.length === 0) {
      return failure(command.commandType, dealId, [
        'Contract requires at least one party',
      ])
    }

    const postMatchId =
      command.postMatchId ?? dealPostMatchId ?? undefined
    const negotiationId =
      command.negotiationId ?? dealNegotiationId ?? undefined
    const needOpportunityId =
      command.needOpportunityId ?? deal.needOpportunityId ?? undefined
    const offerOpportunityId =
      command.offerOpportunityId ?? deal.offerOpportunityId ?? undefined
    const opportunityIds = [needOpportunityId, offerOpportunityId].filter(
      (id): id is string => Boolean(id),
    )

    const contract = this.contractRepository.create({
      dealId,
      matchId: postMatchId ?? null,
      negotiationId: negotiationId ?? null,
      opportunityId: needOpportunityId ?? deal.opportunityId,
      opportunityIds: opportunityIds.length ? opportunityIds : deal.opportunityIds,
      participants,
      parties: participants,
      scope: command.scope ?? deal.scope,
      milestonesSnapshot: command.milestonesSnapshot ?? deal.milestones,
      commercialTerms: deal.commercialTerms,
      terms: deal.terms,
      status: 'draft',
    })

    this.appendAudit({
      action: 'contract.created_from_deal',
      entityType: 'contract',
      entityId: contract.id,
      requestId: command.clientRequestId,
      details: {
        dealId,
        postMatchId,
        negotiationId,
        needOpportunityId,
        offerOpportunityId,
        status: 'draft',
      },
    })

    return success(command.commandType, contract.id)
  }

  private handleSign(command: SignContractCommand): CommandResult {
    const contractId = command.aggregateId

    if (!command.userId?.trim()) {
      return failure(command.commandType, contractId, ['userId is required'])
    }

    const contract = this.contractRepository.getById(contractId)
    if (!contract) {
      return failure(command.commandType, contractId, [
        `Contract "${contractId}" not found`,
      ])
    }

    if (isTerminal(CONTRACT_ENTITY, contract.status)) {
      return failure(command.commandType, contractId, [
        `Contract is in terminal state "${canonicalContractStatus(contract.status)}"`,
      ])
    }

    const participants = normalizeParticipants(
      contract.participants,
      contract.parties,
    )
    const partyIndex = participants.findIndex(
      (participant) => participant.userId === command.userId,
    )
    if (partyIndex < 0) {
      return failure(command.commandType, contractId, [
        `User "${command.userId}" is not a contract party`,
      ])
    }

    const signedAt = new Date().toISOString()
    const updatedParticipants = participants.map((participant, index) =>
      index === partyIndex
        ? { ...participant, signedAt: participant.signedAt ?? signedAt }
        : { ...participant },
    )

    const patch: Partial<Contract> = {
      participants: updatedParticipants,
      parties: updatedParticipants,
    }

    const currentCanonical = canonicalContractStatus(contract.status)

    if (allPartiesSigned(updatedParticipants)) {
      if (currentCanonical === 'draft') {
        const pendingErrors = validateTransition(contract.status, 'pending_signature')
        if (pendingErrors.length > 0) {
          return failure(command.commandType, contractId, pendingErrors)
        }
        const activeErrors = validateTransition('pending_signature', 'active')
        if (activeErrors.length > 0) {
          return failure(command.commandType, contractId, activeErrors)
        }
        patch.status = 'active'
        patch.signedAt = signedAt
      } else if (currentCanonical === 'pending_signature') {
        const activeErrors = validateTransition(contract.status, 'active')
        if (activeErrors.length > 0) {
          return failure(command.commandType, contractId, activeErrors)
        }
        patch.status = 'active'
        patch.signedAt = signedAt
      } else if (currentCanonical !== 'active') {
        return failure(command.commandType, contractId, [
          `Contract cannot be signed from status "${currentCanonical || contract.status}"`,
        ])
      }
    } else if (currentCanonical === 'draft') {
      const pendingErrors = validateTransition(contract.status, 'pending_signature')
      if (pendingErrors.length > 0) {
        return failure(command.commandType, contractId, pendingErrors)
      }
      patch.status = 'pending_signature'
    }

    this.contractRepository.update(contractId, patch)

    this.appendAudit({
      action: 'contract.signed',
      entityType: 'contract',
      entityId: contractId,
      userId: command.userId,
      requestId: command.clientRequestId,
      details: {
        status: patch.status ?? contract.status,
        allPartiesSigned: allPartiesSigned(updatedParticipants),
      },
    })

    if (patch.status === 'active') {
      this.orchestrateDealSync(contractId)
    }

    return success(command.commandType, contractId)
  }

  private handleActivate(command: ActivateContractCommand): CommandResult {
    const contractId = command.aggregateId
    const contract = this.contractRepository.getById(contractId)
    if (!contract) {
      return failure(command.commandType, contractId, [
        `Contract "${contractId}" not found`,
      ])
    }

    if (isTerminal(CONTRACT_ENTITY, contract.status)) {
      return failure(command.commandType, contractId, [
        `Contract is in terminal state "${canonicalContractStatus(contract.status)}"`,
      ])
    }

    const transitionErrors = validateTransition(contract.status, 'active')
    if (transitionErrors.length > 0) {
      return failure(command.commandType, contractId, transitionErrors)
    }

    this.contractRepository.update(contractId, { status: 'active' })

    this.appendAudit({
      action: 'contract.activated',
      entityType: 'contract',
      entityId: contractId,
      requestId: command.clientRequestId,
      details: {
        triggeredByCommandId: command.triggeredByCommandId,
      },
    })

    this.orchestrateDealSync(contractId)

    return success(command.commandType, contractId)
  }

  private handleComplete(command: CompleteContractCommand): CommandResult {
    const contractId = command.aggregateId
    const contract = this.contractRepository.getById(contractId)
    if (!contract) {
      return failure(command.commandType, contractId, [
        `Contract "${contractId}" not found`,
      ])
    }

    if (isTerminal(CONTRACT_ENTITY, contract.status)) {
      return failure(command.commandType, contractId, [
        `Contract is in terminal state "${canonicalContractStatus(contract.status)}"`,
      ])
    }

    const transitionErrors = validateTransition(contract.status, 'completed')
    if (transitionErrors.length > 0) {
      return failure(command.commandType, contractId, transitionErrors)
    }

    this.contractRepository.update(contractId, { status: 'completed' })

    this.appendAudit({
      action: 'contract.completed',
      entityType: 'contract',
      entityId: contractId,
      requestId: command.clientRequestId,
      details: { reason: command.reason },
    })

    this.orchestrateDealSync(contractId)

    return success(command.commandType, contractId)
  }

  private handleTerminate(command: TerminateContractCommand): CommandResult {
    const contractId = command.aggregateId
    const contract = this.contractRepository.getById(contractId)
    if (!contract) {
      return failure(command.commandType, contractId, [
        `Contract "${contractId}" not found`,
      ])
    }

    if (isTerminal(CONTRACT_ENTITY, contract.status)) {
      return failure(command.commandType, contractId, [
        `Contract is in terminal state "${canonicalContractStatus(contract.status)}"`,
      ])
    }

    const transitionErrors = validateTransition(contract.status, 'terminated')
    if (transitionErrors.length > 0) {
      return failure(command.commandType, contractId, transitionErrors)
    }

    this.contractRepository.update(contractId, { status: 'terminated' })

    this.appendAudit({
      action: 'contract.terminated',
      entityType: 'contract',
      entityId: contractId,
      requestId: command.clientRequestId,
      details: { reason: command.reason },
    })

    this.orchestrateDealSync(contractId)

    return success(command.commandType, contractId)
  }

  private orchestrateDealSync(contractId: string): void {
    const contract = this.contractRepository.getById(contractId)
    if (!contract) return

    const result = this.lifecycleOrchestrator.syncDealFromContract(contract)
    if (!result.synced && result.errors.length > 0) {
      this.appendAudit({
        action: 'lifecycle.deal_sync_failed',
        entityType: 'contract',
        entityId: contractId,
        details: {
          dealId: result.dealId,
          targetStatus: result.targetStatus,
          errors: [...result.errors],
        },
      })
    } else if (result.synced) {
      this.appendAudit({
        action: 'lifecycle.deal_synced',
        entityType: 'deal',
        entityId: result.dealId ?? contract.dealId,
        details: {
          contractId,
          previousStatus: result.previousStatus,
          targetStatus: result.targetStatus,
          appliedStatuses: [...result.appliedStatuses],
        },
      })
    }

    const dealId = contract.dealId?.trim()
    if (!dealId) return

    const deal = this.dealRepository.getById(dealId)
    if (!deal || !resolveOpportunitySyncTarget(deal.status)) return

    const opportunityResult =
      this.lifecycleOrchestrator.syncOpportunitiesFromDeal(deal)
    for (const item of opportunityResult.items) {
      if (!item.synced && item.errors.length > 0) {
        this.appendAudit({
          action: 'lifecycle.opportunity_sync_failed',
          entityType: 'contract',
          entityId: contractId,
          details: {
            dealId,
            role: item.role,
            opportunityId: item.opportunityId,
            targetStatus: item.targetStatus,
            errors: [...item.errors],
          },
        })
      } else if (item.synced) {
        this.appendAudit({
          action: 'lifecycle.opportunity_synced',
          entityType: 'opportunity',
          entityId: item.opportunityId ?? undefined,
          details: {
            contractId,
            dealId,
            role: item.role,
            previousStatus: item.previousStatus,
            targetStatus: item.targetStatus,
            appliedStatuses: [...item.appliedStatuses],
          },
        })
      }
    }
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
