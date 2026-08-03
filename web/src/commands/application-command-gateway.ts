import {
  applicationRepository,
  auditRepository,
  contractRepository,
  commercialAgreementRepository,
  dealRepository,
  negotiationRepository,
  notificationRepository,
  opportunityRepository,
  postMatchRepository,
} from '@/repositories/index.ts'
import { ApplicationCommandHandler } from '@/commands/handlers/application-command-handler.ts'
import { ContractCommandHandler } from '@/commands/handlers/contract-command-handler.ts'
import { CommercialAgreementCommandHandler } from '@/commands/handlers/commercial-agreement-command-handler.ts'
import { NegotiationCommandHandler } from '@/commands/handlers/negotiation-command-handler.ts'
import { NegotiationRoomCommandHandler } from '@/commands/handlers/negotiation-room-command-handler.ts'
import { OpportunityCommandHandler } from '@/commands/handlers/opportunity-command-handler.ts'
import { PostMatchCommandHandler } from '@/commands/handlers/post-match-command-handler.ts'
import { ProfileCommandHandler } from '@/commands/handlers/profile-command-handler.ts'
import { UserSettingsCommandHandler } from '@/commands/handlers/user-settings-command-handler.ts'
import { DefaultCommandGateway } from '@/commands/default-command-gateway.ts'
import { getCommandPermissionActor } from '@/domain/rbac/context/command-permission-context.ts'
import { resolvePublishReadinessContextForOpportunity } from '@/lib/resolve-publish-readiness-context.ts'
import { resolveVettingActorContextForGateway } from '@/domain/rbac/resolve-vetting-actor-context.ts'
import {
  negotiationMessageRepository,
  negotiationOfferRepository,
  negotiationTranscriptRepository,
  userRepository,
  profileRepository,
  userSettingsRepository,
} from '@/repositories/index.ts'
import { resolveRuntimeProfileSubject } from '@/domain/profile/profile-subject-service.ts'

let gatewayInstance: DefaultCommandGateway | null = null

export function createApplicationCommandGateway(): DefaultCommandGateway {
  const applicationHandler = new ApplicationCommandHandler({
    applicationRepository,
    auditRepository,
  })
  const opportunityHandler = new OpportunityCommandHandler({
    opportunityRepository,
    auditRepository,
    postMatchRepository,
    notificationRepository,
    resolveCommandActor: getCommandPermissionActor,
    resolvePublishReadinessContext: (opportunity) =>
      resolvePublishReadinessContextForOpportunity(opportunity),
  })
  const postMatchHandler = new PostMatchCommandHandler({
    postMatchRepository,
    auditRepository,
    notificationRepository,
    opportunityRepository,
  })
  const negotiationHandler = new NegotiationCommandHandler({
    negotiationRepository,
    postMatchRepository,
    opportunityRepository,
    applicationRepository,
    auditRepository,
    notificationRepository,
  })
  const negotiationRoomHandler = new NegotiationRoomCommandHandler({
    negotiationRepository,
    messageRepository: negotiationMessageRepository,
    offerRepository: negotiationOfferRepository,
    transcriptRepository: negotiationTranscriptRepository,
    auditRepository,
    userRepository,
  })
  const dealHandler = new CommercialAgreementCommandHandler({
    dealRepository: commercialAgreementRepository,
    negotiationRepository,
    postMatchRepository,
    contractRepository,
    opportunityRepository,
    applicationRepository,
    auditRepository,
    notificationRepository,
  })
  const contractHandler = new ContractCommandHandler({
    contractRepository,
    dealRepository,
    opportunityRepository,
    postMatchRepository,
    auditRepository,
    notificationRepository,
  })
  const profileHandler = new ProfileCommandHandler({
    profileRepository,
    auditRepository,
    resolveSubject: resolveRuntimeProfileSubject,
    resolveActor: getCommandPermissionActor,
  })
  const userSettingsHandler = new UserSettingsCommandHandler({
    repository: userSettingsRepository,
    auditRepository,
    resolveActor: getCommandPermissionActor,
  })

  return new DefaultCommandGateway({
    applicationHandler,
    opportunityHandler,
    postMatchHandler,
    negotiationHandler,
    negotiationRoomHandler,
    dealHandler,
    contractHandler,
    profileHandler,
    userSettingsHandler,
    resolveCommandPermissionActor: getCommandPermissionActor,
    resolveVettingActorContext: resolveVettingActorContextForGateway,
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
}

export function getApplicationCommandGateway(): DefaultCommandGateway {
  if (!gatewayInstance) {
    gatewayInstance = createApplicationCommandGateway()
  }
  return gatewayInstance
}

export function resetApplicationCommandGatewayForTests(): void {
  gatewayInstance = null
}
