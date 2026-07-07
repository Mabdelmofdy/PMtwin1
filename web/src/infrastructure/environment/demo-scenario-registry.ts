import type { MatchingModelKey } from '@/config/need-offer-framework.ts'

export type DemoScenarioId =
  | 'cash-subcontracting'
  | 'joint-venture'
  | 'hiring'
  | 'circular-resource-sharing'
  | 'marketplace'

export type DemoScenarioEntityType =
  | 'users'
  | 'companies'
  | 'opportunities'
  | 'postMatches'
  | 'negotiations'
  | 'negotiationMessages'
  | 'negotiationOffers'
  | 'negotiationTranscriptEvents'
  | 'commercialAgreements'
  | 'contracts'
  | 'applications'
  | 'notifications'
  | 'audit'

export type DemoScenarioLoader =
  | 'loadUsers'
  | 'loadCompanies'
  | 'loadOpportunities'
  | 'loadPostMatches'
  | 'loadNegotiations'
  | 'loadNegotiationMessages'
  | 'loadNegotiationOffers'
  | 'loadNegotiationTranscriptEvents'
  | 'loadCommercialAgreements'
  | 'loadContracts'
  | 'loadApplications'
  | 'loadNotifications'
  | 'loadAuditLog'

export type DemoScenarioTargetAudience =
  | 'client-executive'
  | 'operations-team'
  | 'sales-team'
  | 'procurement-team'
  | 'technical-review'

export type DemoScenarioNarrativeStep = {
  readonly id: string
  readonly title: string
  readonly description: string
}

export type DemoScenarioSeedSubsetReference = {
  readonly entityType: DemoScenarioEntityType
  readonly loader: DemoScenarioLoader
  readonly ids: readonly string[]
}

export type DemoScenarioEntityPatch = {
  readonly entityType: DemoScenarioEntityType
  readonly operation: 'merge'
  readonly id: string
  readonly patch: Readonly<Record<string, unknown>>
}

export type DemoScenarioEntityPatchSet = {
  readonly patchSetId: string
  readonly description: string
  readonly patches: readonly DemoScenarioEntityPatch[]
}

export type DemoScenarioDefinition = {
  readonly id: DemoScenarioId
  readonly title: string
  readonly description: string
  readonly targetAudience: readonly DemoScenarioTargetAudience[]
  readonly includedEntities: readonly DemoScenarioEntityType[]
  readonly narrativeSteps: readonly DemoScenarioNarrativeStep[]
  readonly matchTypes: readonly MatchingModelKey[]
  readonly mainCollaborationModels: readonly string[]
  readonly seedSubsetRefs: readonly DemoScenarioSeedSubsetReference[]
  readonly entityPatchSet?: DemoScenarioEntityPatchSet
}

export const DEMO_SCENARIO_REGISTRY: readonly DemoScenarioDefinition[] = [
  {
    id: 'cash-subcontracting',
    title: 'Cash Subcontracting',
    description:
      'Show one-way subcontracting flow from match discovery through commercial agreement and contract completion.',
    targetAudience: ['client-executive', 'sales-team'],
    includedEntities: [
      'opportunities',
      'postMatches',
      'negotiations',
      'commercialAgreements',
      'contracts',
      'audit',
    ],
    narrativeSteps: [
      {
        id: 'cs-1',
        title: 'Publish need and offer',
        description: 'Start from seed opportunities representing a buyer need and supplier offer.',
      },
      {
        id: 'cs-2',
        title: 'Show one-way match progression',
        description: 'Walk through discovered -> accepted -> confirmed one_way post-match records.',
      },
      {
        id: 'cs-3',
        title: 'Close to agreement and contract',
        description: 'Open linked negotiation, then show commercial agreement and completed contract.',
      },
    ],
    matchTypes: ['one_way'],
    mainCollaborationModels: ['cash_subcontracting'],
    seedSubsetRefs: [
      {
        entityType: 'opportunities',
        loader: 'loadOpportunities',
        ids: ['seed-opp-001', 'seed-opp-003'],
      },
      {
        entityType: 'postMatches',
        loader: 'loadPostMatches',
        ids: ['demo-pm-oneway-01', 'demo-pm-oneway-15'],
      },
      {
        entityType: 'negotiations',
        loader: 'loadNegotiations',
        ids: ['seed-neg-02'],
      },
      {
        entityType: 'commercialAgreements',
        loader: 'loadCommercialAgreements',
        ids: ['seed-deal-oneway-01'],
      },
      {
        entityType: 'contracts',
        loader: 'loadContracts',
        ids: ['seed-contract-oneway-01'],
      },
    ],
  },
  {
    id: 'joint-venture',
    title: 'Joint Venture',
    description:
      'Demonstrate multi-party JV formation and execution using consortium topology with shared delivery responsibilities.',
    targetAudience: ['client-executive', 'operations-team', 'technical-review'],
    includedEntities: [
      'opportunities',
      'postMatches',
      'negotiations',
      'commercialAgreements',
      'contracts',
      'audit',
    ],
    narrativeSteps: [
      {
        id: 'jv-1',
        title: 'Introduce lead opportunity',
        description: 'Present lead demand and partner capabilities within a joint venture storyline.',
      },
      {
        id: 'jv-2',
        title: 'Review consortium match',
        description: 'Use consortium post-match to show role-based partner composition.',
      },
      {
        id: 'jv-3',
        title: 'Transition to execution',
        description: 'Navigate from agreement to active contract and ongoing delivery.',
      },
    ],
    matchTypes: ['consortium'],
    mainCollaborationModels: ['joint_venture'],
    seedSubsetRefs: [
      {
        entityType: 'opportunities',
        loader: 'loadOpportunities',
        ids: ['seed-opp-005', 'seed-opp-023'],
      },
      {
        entityType: 'postMatches',
        loader: 'loadPostMatches',
        ids: ['demo-pm-consortium-01'],
      },
      {
        entityType: 'commercialAgreements',
        loader: 'loadCommercialAgreements',
        ids: ['seed-deal-consortium-01'],
      },
      {
        entityType: 'contracts',
        loader: 'loadContracts',
        ids: ['seed-contract-consortium-01'],
      },
    ],
  },
  {
    id: 'hiring',
    title: 'Hiring',
    description:
      'Highlight hiring-first collaboration where accepted applications progress into negotiation and formal agreement.',
    targetAudience: ['operations-team', 'sales-team'],
    includedEntities: [
      'opportunities',
      'applications',
      'negotiations',
      'commercialAgreements',
      'contracts',
      'notifications',
      'audit',
    ],
    narrativeSteps: [
      {
        id: 'hr-1',
        title: 'Start from hiring opportunity',
        description: 'Open hiring-oriented opportunity and accepted application pair.',
      },
      {
        id: 'hr-2',
        title: 'Advance through negotiation',
        description: 'Show application-to-negotiation handoff with auditable status flow.',
      },
      {
        id: 'hr-3',
        title: 'Finalize contractual path',
        description: 'Conclude with commercial agreement and contract to complete hiring workflow.',
      },
    ],
    matchTypes: ['one_way'],
    mainCollaborationModels: ['hiring'],
    seedSubsetRefs: [
      {
        entityType: 'opportunities',
        loader: 'loadOpportunities',
        ids: ['seed-opp-001'],
      },
      {
        entityType: 'applications',
        loader: 'loadApplications',
        ids: ['seed-app-demo-hiring-01'],
      },
      {
        entityType: 'negotiations',
        loader: 'loadNegotiations',
        ids: ['seed-neg-02'],
      },
      {
        entityType: 'commercialAgreements',
        loader: 'loadCommercialAgreements',
        ids: ['seed-deal-oneway-01'],
      },
      {
        entityType: 'contracts',
        loader: 'loadContracts',
        ids: ['seed-contract-oneway-01'],
      },
    ],
  },
  {
    id: 'circular-resource-sharing',
    title: 'Circular Resource Sharing',
    description:
      'Demonstrate circular exchange among multiple parties where resources are exchanged in a closed loop.',
    targetAudience: ['procurement-team', 'operations-team', 'technical-review'],
    includedEntities: [
      'opportunities',
      'postMatches',
      'negotiations',
      'negotiationMessages',
      'negotiationOffers',
      'negotiationTranscriptEvents',
      'audit',
    ],
    narrativeSteps: [
      {
        id: 'crs-1',
        title: 'Frame multi-party needs and offers',
        description: 'Introduce participants contributing and consuming resources in a chain.',
      },
      {
        id: 'crs-2',
        title: 'Inspect circular match topology',
        description: 'Visualize circular links that close the exchange loop.',
      },
      {
        id: 'crs-3',
        title: 'Audit negotiation discussion',
        description: 'Review messages/offers/transcript for transparent decision history.',
      },
    ],
    matchTypes: ['circular'],
    mainCollaborationModels: ['resource_sharing'],
    seedSubsetRefs: [
      {
        entityType: 'opportunities',
        loader: 'loadOpportunities',
        ids: ['seed-opp-023', 'seed-opp-005'],
      },
      {
        entityType: 'postMatches',
        loader: 'loadPostMatches',
        ids: ['demo-pm-circular-01'],
      },
      {
        entityType: 'negotiationMessages',
        loader: 'loadNegotiationMessages',
        ids: ['seed-msg-demo-001'],
      },
      {
        entityType: 'negotiationOffers',
        loader: 'loadNegotiationOffers',
        ids: ['seed-offer-demo-001'],
      },
      {
        entityType: 'negotiationTranscriptEvents',
        loader: 'loadNegotiationTranscriptEvents',
        ids: ['seed-event-demo-001'],
      },
    ],
  },
  {
    id: 'marketplace',
    title: 'Marketplace',
    description:
      'Provide an executive end-to-end marketplace tour covering all matching topologies and primary collaboration models.',
    targetAudience: ['client-executive', 'sales-team', 'technical-review'],
    includedEntities: [
      'users',
      'companies',
      'opportunities',
      'postMatches',
      'negotiations',
      'commercialAgreements',
      'contracts',
      'applications',
      'notifications',
      'audit',
    ],
    narrativeSteps: [
      {
        id: 'mk-1',
        title: 'Show model breadth',
        description: 'Browse opportunities spanning cash subcontracting, exchange, JV, resource sharing, and hiring.',
      },
      {
        id: 'mk-2',
        title: 'Show topology breadth',
        description: 'Highlight one_way, two_way, consortium, and circular match examples.',
      },
      {
        id: 'mk-3',
        title: 'Show lifecycle depth',
        description: 'Move from matching to negotiation, commercial agreement, and contract views.',
      },
    ],
    matchTypes: ['one_way', 'two_way', 'consortium', 'circular'],
    mainCollaborationModels: [
      'cash_subcontracting',
      'service_exchange',
      'joint_venture',
      'resource_sharing',
      'hiring',
    ],
    seedSubsetRefs: [
      {
        entityType: 'users',
        loader: 'loadUsers',
        ids: ['seed-user-001'],
      },
      {
        entityType: 'companies',
        loader: 'loadCompanies',
        ids: ['seed-co-corp-001'],
      },
      {
        entityType: 'opportunities',
        loader: 'loadOpportunities',
        ids: ['seed-opp-001', 'seed-opp-003', 'seed-opp-005', 'seed-opp-023'],
      },
      {
        entityType: 'postMatches',
        loader: 'loadPostMatches',
        ids: [
          'demo-pm-oneway-01',
          'demo-pm-barter-01',
          'demo-pm-consortium-01',
          'demo-pm-circular-01',
        ],
      },
      {
        entityType: 'applications',
        loader: 'loadApplications',
        ids: ['seed-app-demo-hiring-01'],
      },
    ],
  },
] as const

export function getDemoScenarioRegistry(): readonly DemoScenarioDefinition[] {
  return DEMO_SCENARIO_REGISTRY
}

