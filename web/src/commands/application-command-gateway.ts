import {
  applicationRepository,
  auditRepository,
  contractRepository,
  dealRepository,
  negotiationRepository,
  notificationRepository,
  opportunityRepository,
  postMatchRepository,
} from '@/repositories/index.ts'
import { ApplicationCommandHandler } from '@/commands/handlers/application-command-handler.ts'
import { ContractCommandHandler } from '@/commands/handlers/contract-command-handler.ts'
import { DealCommandHandler } from '@/commands/handlers/deal-command-handler.ts'
import { NegotiationCommandHandler } from '@/commands/handlers/negotiation-command-handler.ts'
import { OpportunityCommandHandler } from '@/commands/handlers/opportunity-command-handler.ts'
import { PostMatchCommandHandler } from '@/commands/handlers/post-match-command-handler.ts'
import { DefaultCommandGateway } from '@/commands/default-command-gateway.ts'
import { getCommandPermissionActor } from '@/domain/rbac/context/command-permission-context.ts'
import { resolvePublishReadinessContextForOpportunity } from '@/lib/resolve-publish-readiness-context.ts'

let gatewayInstance: DefaultCommandGateway | null = null

export function createApplicationCommandGateway(): DefaultCommandGateway {
  const applicationHandler = new ApplicationCommandHandler({
    applicationRepository,
    auditRepository,
  })
  const opportunityHandler = new OpportunityCommandHandler({
    opportunityRepository,
    auditRepository,
    resolvePublishReadinessContext: (opportunity) =>
      resolvePublishReadinessContextForOpportunity(opportunity),
  })
  const postMatchHandler = new PostMatchCommandHandler({
    postMatchRepository,
    auditRepository,
    notificationRepository,
  })
  const negotiationHandler = new NegotiationCommandHandler({
    negotiationRepository,
    postMatchRepository,
    auditRepository,
    notificationRepository,
  })
  const dealHandler = new DealCommandHandler({
    dealRepository,
    negotiationRepository,
    postMatchRepository,
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

  return new DefaultCommandGateway({
    applicationHandler,
    opportunityHandler,
    postMatchHandler,
    negotiationHandler,
    dealHandler,
    contractHandler,
    resolveCommandPermissionActor: getCommandPermissionActor,
    resolveOpportunityForCommandRbac: (aggregateId) => {
      const opportunity = opportunityRepository.getById(aggregateId)
      if (!opportunity) return undefined
      return {
        creatorId: opportunity.creatorId,
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
