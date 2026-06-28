export { matchingService } from './matching-service.ts'
export { dealService } from './deal-service.ts'
export { negotiationService } from './negotiation-service.ts'
export { contractService } from './contract-service.ts'
export { notificationService } from './notification-service.ts'
export {
  createPostMatchCommandService,
  postMatchCommandService,
  setPostMatchCommandGatewayForTests,
} from './post-match-command-service.ts'
export {
  createOpportunityCommandService,
  opportunityCommandService,
  setOpportunityCommandGatewayForTests,
} from './opportunity-command-service.ts'
export type {
  DiscoverPostMatchInput,
  PostMatchCommandServiceDeps,
} from './post-match-command-service.ts'
