import type { AuditEntry, Contract, Deal, Negotiation, Opportunity, PlatformUser, PostMatch } from '@/types/domain.ts'
import type { IStorageAdapter } from '@/types/storage.ts'
import { ApplicationCommandHandler } from '@/commands/handlers/application-command-handler.ts'
import { ContractCommandHandler } from '@/commands/handlers/contract-command-handler.ts'
import { CommercialAgreementCommandHandler } from '@/commands/handlers/commercial-agreement-command-handler.ts'
import { NegotiationCommandHandler } from '@/commands/handlers/negotiation-command-handler.ts'
import { NegotiationRoomCommandHandler } from '@/commands/handlers/negotiation-room-command-handler.ts'
import { OpportunityCommandHandler } from '@/commands/handlers/opportunity-command-handler.ts'
import { PostMatchCommandHandler } from '@/commands/handlers/post-match-command-handler.ts'
import { DefaultCommandGateway } from '@/commands/default-command-gateway.ts'
import { InMemoryIdempotencyStore } from '@/commands/idempotency/InMemoryIdempotencyStore.ts'
import type { CommandPermissionActor } from '@/domain/rbac/context/command-permission-context.ts'
import type { VettingActorContext } from '@/domain/rbac/vetting-mutation-guard.ts'
import { ApplicationRepository } from '@/repositories/application-repository.ts'
import { AuditRepository } from '@/repositories/audit-repository.ts'
import { ContractRepository } from '@/repositories/contract-repository.ts'
import { CommercialAgreementRepository } from '@/repositories/commercial-agreement-repository.ts'
import { NegotiationRepository } from '@/repositories/negotiation-repository.ts'
import { NegotiationMessageRepository } from '@/repositories/negotiation-message-repository.ts'
import { NegotiationOfferRepository } from '@/repositories/negotiation-offer-repository.ts'
import { NegotiationTranscriptRepository } from '@/repositories/negotiation-transcript-repository.ts'
import { OpportunityRepository } from '@/repositories/opportunity-repository.ts'
import { PostMatchRepository } from '@/repositories/post-match-repository.ts'
import { UserRepository } from '@/repositories/user-repository.ts'
import { PartyRepository } from '@/repositories/party-repository.ts'

export const TEST_ADMIN_ACTOR: CommandPermissionActor = {
  userId: 'test-admin',
  userRole: 'admin',
}

export function resolveTestAdminActor(): CommandPermissionActor {
  return TEST_ADMIN_ACTOR
}

export class MemoryStorageAdapter implements IStorageAdapter {
  private readonly store = new Map<string, unknown>()

  get<T>(key: string): T | null {
    return (this.store.get(key) as T | undefined) ?? null
  }

  set<T>(key: string, value: T): void {
    this.store.set(key, value)
  }

  remove(key: string): void {
    this.store.delete(key)
  }

  clear(): void {
    this.store.clear()
  }
}

export type CommandGatewayTestStack = {
  storage: MemoryStorageAdapter
  applicationRepository: ApplicationRepository
  postMatchRepository: PostMatchRepository
  negotiationRepository: NegotiationRepository
  negotiationMessageRepository: NegotiationMessageRepository
  negotiationOfferRepository: NegotiationOfferRepository
  negotiationTranscriptRepository: NegotiationTranscriptRepository
  dealRepository: CommercialAgreementRepository
  contractRepository: ContractRepository
  opportunityRepository: OpportunityRepository
  auditRepository: AuditRepository
  gateway: DefaultCommandGateway
  idempotencyStore: InMemoryIdempotencyStore
}

export type CommandGatewayTestStackOptions = {
  applications?: import('@/types/domain.ts').Application[]
  postMatches?: PostMatch[]
  negotiations?: Negotiation[]
  deals?: Deal[]
  contracts?: Contract[]
  opportunities?: Opportunity[]
  users?: PlatformUser[]
  auditLog?: AuditEntry[]
  commandPermissionActor?: import('@/domain/rbac/context/command-permission-context.ts').CommandPermissionActor | null
}

function createPublishReadinessResolver(users: readonly PlatformUser[]) {
  return (opportunity: Opportunity) => {
    const creator = users.find((user) => user.id === opportunity.creatorId)
    if (!creator) {
      return { profile: null, profileKind: 'individual' as const }
    }
    return {
      profile: creator.profile,
      profileKind: creator.profile?.type === 'company' ? 'company' as const : 'individual' as const,
    }
  }
}

export function createCommandGatewayTestStack(
  options: CommandGatewayTestStackOptions = {},
): CommandGatewayTestStack {
  const storage = new MemoryStorageAdapter()
  const applicationRepository = new ApplicationRepository(
    storage,
    () => options.applications ?? [],
  )
  const postMatchRepository = new PostMatchRepository(
    storage,
    () => options.postMatches ?? [],
  )
  const negotiationRepository = new NegotiationRepository(
    storage,
    () => options.negotiations ?? [],
  )
  const negotiationMessageRepository = new NegotiationMessageRepository(storage)
  const negotiationOfferRepository = new NegotiationOfferRepository(storage)
  const negotiationTranscriptRepository = new NegotiationTranscriptRepository(storage)
  const userRepository = new UserRepository(storage, () => options.users ?? [])
  const partyRepository = new PartyRepository(
    storage,
    () => options.users ?? [],
    () => [],
  )
  const dealRepository = new CommercialAgreementRepository(storage, () => options.deals ?? [])
  const contractRepository = new ContractRepository(
    storage,
    () => options.contracts ?? [],
  )
  const opportunityRepository = new OpportunityRepository(
    storage,
    () => options.opportunities ?? [],
  )
  const auditRepository = new AuditRepository(
    storage,
    () => options.auditLog ?? [],
  )
  const idempotencyStore = new InMemoryIdempotencyStore()
  const opportunityHandler = new OpportunityCommandHandler({
    opportunityRepository,
    auditRepository,
    resolvePublishReadinessContext: createPublishReadinessResolver(
      options.users ?? [],
    ),
  })
  const gateway = new DefaultCommandGateway({
    applicationHandler: new ApplicationCommandHandler({
      applicationRepository,
      auditRepository,
    }),
    opportunityHandler,
    postMatchHandler: new PostMatchCommandHandler({
      postMatchRepository,
      auditRepository,
    }),
    negotiationHandler: new NegotiationCommandHandler({
      negotiationRepository,
      postMatchRepository,
      opportunityRepository,
      applicationRepository,
      auditRepository,
    }),
    negotiationRoomHandler: new NegotiationRoomCommandHandler({
      negotiationRepository,
      messageRepository: negotiationMessageRepository,
      offerRepository: negotiationOfferRepository,
      transcriptRepository: negotiationTranscriptRepository,
      auditRepository,
      userRepository,
    }),
    dealHandler: new CommercialAgreementCommandHandler({
      dealRepository,
      negotiationRepository,
      postMatchRepository,
      contractRepository,
      opportunityRepository,
      applicationRepository,
      auditRepository,
    }),
    contractHandler: new ContractCommandHandler({
      contractRepository,
      dealRepository,
      opportunityRepository,
      postMatchRepository,
      auditRepository,
    }),
    idempotencyStore,
    resolveCommandPermissionActor: () =>
      options.commandPermissionActor === null
        ? null
        : (options.commandPermissionActor ?? TEST_ADMIN_ACTOR),
    resolveVettingActorContext: (): VettingActorContext | null => {
      const actor =
        options.commandPermissionActor === null
          ? null
          : (options.commandPermissionActor ?? TEST_ADMIN_ACTOR)
      if (!actor) return null
      const user = userRepository.getById(actor.userId)
      if (!user) return null
      const party = partyRepository.getById(actor.activePartyId ?? actor.userId) ?? null
      return { user, activeParty: party }
    },
    resolveOpportunityForCommandRbac: (aggregateId) => {
      const opportunity = opportunityRepository.getById(aggregateId)
      if (!opportunity) return undefined
      return {
        creatorId: opportunity.creatorId,
        workspaceId: opportunity.workspaceId,
        ownerPartyId: opportunity.ownerPartyId,
        status: opportunity.status,
      }
    },
  })

  return {
    storage,
    applicationRepository,
    postMatchRepository,
    negotiationRepository,
    negotiationMessageRepository,
    negotiationOfferRepository,
    negotiationTranscriptRepository,
    dealRepository,
    contractRepository,
    opportunityRepository,
    auditRepository,
    gateway,
    idempotencyStore,
  }
}
