import {
  applicationRepository,
  auditRepository,
  companyRepository,
  contractRepository,
  dealRepository,
  negotiationRepository,
  opportunityRepository,
  postMatchRepository,
  userRepository,
} from '@/repositories/index.ts'
import { ApplicationCommandHandler } from '@/commands/handlers/application-command-handler.ts'
import { ContractCommandHandler } from '@/commands/handlers/contract-command-handler.ts'
import { DealCommandHandler } from '@/commands/handlers/deal-command-handler.ts'
import { NegotiationCommandHandler } from '@/commands/handlers/negotiation-command-handler.ts'
import { OpportunityCommandHandler } from '@/commands/handlers/opportunity-command-handler.ts'
import { PostMatchCommandHandler } from '@/commands/handlers/post-match-command-handler.ts'
import { DefaultCommandGateway } from '@/commands/default-command-gateway.ts'
import { getCommandPermissionActor } from '@/domain/rbac/context/command-permission-context.ts'

let gatewayInstance: DefaultCommandGateway | null = null

export function createApplicationCommandGateway(): DefaultCommandGateway {
  const applicationHandler = new ApplicationCommandHandler({
    applicationRepository,
    auditRepository,
  })
  const opportunityHandler = new OpportunityCommandHandler({
    opportunityRepository,
    auditRepository,
    resolvePublishReadinessContext: (opportunity) => {
      const creatorId = opportunity.creatorId
      if (!creatorId) {
        return { profile: null, profileKind: 'individual' }
      }
      const creator =
        userRepository.getById(creatorId) ?? companyRepository.getById(creatorId)
      if (!creator) {
        return { profile: null, profileKind: 'individual' }
      }
      return {
        profile: creator.profile,
        profileKind: creator.profile?.type === 'company' ? 'company' : 'individual',
      }
    },
  })
  const postMatchHandler = new PostMatchCommandHandler({
    postMatchRepository,
    auditRepository,
  })
  const negotiationHandler = new NegotiationCommandHandler({
    negotiationRepository,
    postMatchRepository,
    auditRepository,
  })
  const dealHandler = new DealCommandHandler({
    dealRepository,
    negotiationRepository,
    postMatchRepository,
    auditRepository,
  })
  const contractHandler = new ContractCommandHandler({
    contractRepository,
    dealRepository,
    opportunityRepository,
    postMatchRepository,
    auditRepository,
  })

  return new DefaultCommandGateway({
    applicationHandler,
    opportunityHandler,
    postMatchHandler,
    negotiationHandler,
    dealHandler,
    contractHandler,
    resolveCommandPermissionActor: getCommandPermissionActor,
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
