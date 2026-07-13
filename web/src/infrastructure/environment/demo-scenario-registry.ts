import type { MatchingModelKey } from '@/config/need-offer-framework.ts'

export type DemoScenarioId =
  | 'cash-subcontracting'
  | 'joint-venture'
  | 'hiring'
  | 'circular-resource-sharing'
  | 'marketplace'
  | 'two-way-barter'

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

export type DemoScenarioLoginAs = {
  readonly email: string
  readonly passwordHint: string
  readonly accountType: 'individual' | 'company' | 'admin'
  readonly roleLabel: string
}

export type DemoScenarioNarrativeStep = {
  readonly id: string
  readonly title: string
  readonly description: string
  readonly entityRoute?: string
  readonly loginAs?: DemoScenarioLoginAs
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

const PW = 'Pmtwin@2026'

export const DEMO_SCENARIO_REGISTRY: readonly DemoScenarioDefinition[] = [
  {
    id: 'cash-subcontracting',
    title: 'Cash Subcontracting (One-Way)',
    description:
      'Complete one-way subcontracting flow: published need/offer → confirmed match → negotiation → commercial agreement → contract.',
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
        title: 'Open buyer need (company)',
        description: 'Login as Gulf Development and open the cash subcontracting task package need.',
        entityRoute: '/opportunities/seed-opp-demo-task-need',
        loginAs: {
          email: 'contact@gulf-development.test',
          passwordHint: PW,
          accountType: 'company',
          roleLabel: 'Company owner — need side',
        },
      },
      {
        id: 'cs-2',
        title: 'Open supplier offer (professional)',
        description: 'Switch to Noura Al-Dossari and open the matching task-package offer.',
        entityRoute: '/opportunities/seed-opp-demo-task-offer',
        loginAs: {
          email: 'noura.aldossari@pmtwin.test',
          passwordHint: PW,
          accountType: 'individual',
          roleLabel: 'Professional — offer side',
        },
      },
      {
        id: 'cs-3',
        title: 'Inspect one-way confirmed match',
        description: 'Open the confirmed one_way post-match linking need and offer.',
        entityRoute: '/matches/seed-pm-demo-oneway-cash',
        loginAs: {
          email: 'contact@gulf-development.test',
          passwordHint: PW,
          accountType: 'company',
          roleLabel: 'Company owner — match participant',
        },
      },
      {
        id: 'cs-4',
        title: 'Close commercial agreement and contract',
        description: 'Walk negotiation → commercial agreement → completed contract.',
        entityRoute: '/commercial-agreements/seed-deal-demo-cash-subcontract',
        loginAs: {
          email: 'admin@pmtwin.com',
          passwordHint: 'admin123',
          accountType: 'admin',
          roleLabel: 'Walkthrough host',
        },
      },
    ],
    matchTypes: ['one_way'],
    mainCollaborationModels: ['cash_subcontracting'],
    seedSubsetRefs: [
      {
        entityType: 'opportunities',
        loader: 'loadOpportunities',
        ids: ['seed-opp-demo-task-need', 'seed-opp-demo-task-offer'],
      },
      {
        entityType: 'postMatches',
        loader: 'loadPostMatches',
        ids: ['seed-pm-demo-oneway-cash'],
      },
      {
        entityType: 'negotiations',
        loader: 'loadNegotiations',
        ids: ['seed-neg-demo-oneway-cash'],
      },
      {
        entityType: 'commercialAgreements',
        loader: 'loadCommercialAgreements',
        ids: ['seed-deal-demo-cash-subcontract'],
      },
      {
        entityType: 'contracts',
        loader: 'loadContracts',
        ids: ['seed-contract-demo-cash'],
      },
    ],
  },
  {
    id: 'two-way-barter',
    title: 'Two-Way Barter',
    description:
      'Complete two_way service exchange: alliance partners → barter match → agreed negotiation → commercial agreement → contract.',
    targetAudience: ['operations-team', 'technical-review'],
    includedEntities: [
      'opportunities',
      'postMatches',
      'negotiations',
      'commercialAgreements',
      'contracts',
    ],
    narrativeSteps: [
      {
        id: 'tw-1',
        title: 'Open alliance partner A',
        description: 'Login as Omar Al-Shehri and open the alliance-A opportunity.',
        entityRoute: '/opportunities/seed-opp-demo-alliance-a',
        loginAs: {
          email: 'omar.alshehri@pmtwin.test',
          passwordHint: PW,
          accountType: 'individual',
          roleLabel: 'Professional — side A',
        },
      },
      {
        id: 'tw-2',
        title: 'Open alliance partner B',
        description: 'Switch to Hessa Al-Qahtani and open the alliance-B opportunity.',
        entityRoute: '/opportunities/seed-opp-demo-alliance-b',
        loginAs: {
          email: 'hessa.alqahtani@pmtwin.test',
          passwordHint: PW,
          accountType: 'individual',
          roleLabel: 'Professional — side B',
        },
      },
      {
        id: 'tw-3',
        title: 'Inspect two-way match',
        description: 'Open the confirmed two_way barter post-match.',
        entityRoute: '/matches/seed-pm-demo-twoway-barter',
        loginAs: {
          email: 'omar.alshehri@pmtwin.test',
          passwordHint: PW,
          accountType: 'individual',
          roleLabel: 'Professional — match participant',
        },
      },
      {
        id: 'tw-4',
        title: 'Review agreement and contract',
        description: 'Open commercial agreement and barter contract.',
        entityRoute: '/contracts/seed-contract-demo-barter',
        loginAs: {
          email: 'admin@pmtwin.com',
          passwordHint: 'admin123',
          accountType: 'admin',
          roleLabel: 'Walkthrough host',
        },
      },
    ],
    matchTypes: ['two_way'],
    mainCollaborationModels: ['service_exchange'],
    seedSubsetRefs: [
      {
        entityType: 'opportunities',
        loader: 'loadOpportunities',
        ids: ['seed-opp-demo-alliance-a', 'seed-opp-demo-alliance-b'],
      },
      {
        entityType: 'postMatches',
        loader: 'loadPostMatches',
        ids: ['seed-pm-demo-twoway-barter'],
      },
      {
        entityType: 'negotiations',
        loader: 'loadNegotiations',
        ids: ['seed-neg-demo-barter-agreed'],
      },
      {
        entityType: 'commercialAgreements',
        loader: 'loadCommercialAgreements',
        ids: ['seed-deal-demo-barter-service'],
      },
      {
        entityType: 'contracts',
        loader: 'loadContracts',
        ids: ['seed-contract-demo-barter'],
      },
    ],
  },
  {
    id: 'joint-venture',
    title: 'Joint Venture (Consortium)',
    description:
      'Multi-party JV formation using consortium topology through commercial agreement and contract execution.',
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
        title: 'Open consortium lead',
        description: 'Login as SA Infra Partners and open the consortium lead opportunity.',
        entityRoute: '/opportunities/seed-opp-demo-consortium-lead',
        loginAs: {
          email: 'contact@sa-infra-partners.test',
          passwordHint: PW,
          accountType: 'company',
          roleLabel: 'Company — consortium lead',
        },
      },
      {
        id: 'jv-2',
        title: 'Review consortium match',
        description: 'Inspect role-based partner composition on the consortium post-match.',
        entityRoute: '/matches/seed-pm-demo-consortium-jv',
        loginAs: {
          email: 'contact@sa-infra-partners.test',
          passwordHint: PW,
          accountType: 'company',
          roleLabel: 'Company — consortium lead',
        },
      },
      {
        id: 'jv-3',
        title: 'Transition to execution',
        description: 'Navigate commercial agreement and active JV contract.',
        entityRoute: '/contracts/seed-contract-demo-profit-sharing',
        loginAs: {
          email: 'contact@redsea-building.test',
          passwordHint: PW,
          accountType: 'company',
          roleLabel: 'Company — consortium member',
        },
      },
    ],
    matchTypes: ['consortium'],
    mainCollaborationModels: ['joint_venture'],
    seedSubsetRefs: [
      {
        entityType: 'opportunities',
        loader: 'loadOpportunities',
        ids: [
          'seed-opp-demo-consortium-lead',
          'seed-opp-demo-project-jv',
          'seed-opp-demo-spv',
        ],
      },
      {
        entityType: 'postMatches',
        loader: 'loadPostMatches',
        ids: ['seed-pm-demo-consortium-jv'],
      },
      {
        entityType: 'negotiations',
        loader: 'loadNegotiations',
        ids: ['seed-neg-demo-consortium-jv'],
      },
      {
        entityType: 'commercialAgreements',
        loader: 'loadCommercialAgreements',
        ids: ['seed-deal-demo-jv-profit'],
      },
      {
        entityType: 'contracts',
        loader: 'loadContracts',
        ids: ['seed-contract-demo-profit-sharing'],
      },
    ],
  },
  {
    id: 'hiring',
    title: 'Hiring (One-Way)',
    description:
      'Hiring-first collaboration where professional hiring need progresses into match, negotiation, agreement, and contract.',
    targetAudience: ['operations-team', 'sales-team'],
    includedEntities: [
      'opportunities',
      'postMatches',
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
        title: 'Open hiring opportunity',
        description: 'Login as Gulf Development and open the senior scheduler hiring need.',
        entityRoute: '/opportunities/seed-opp-demo-prof-hiring',
        loginAs: {
          email: 'contact@gulf-development.test',
          passwordHint: PW,
          accountType: 'company',
          roleLabel: 'Company — hiring need',
        },
      },
      {
        id: 'hr-2',
        title: 'Open consultant offer',
        description: 'Switch to Tariq Al-Maliki and open the claims/consultant offer.',
        entityRoute: '/opportunities/seed-opp-demo-consultant',
        loginAs: {
          email: 'tariq.almaliki@pmtwin.test',
          passwordHint: PW,
          accountType: 'individual',
          roleLabel: 'Professional — hire candidate',
        },
      },
      {
        id: 'hr-3',
        title: 'Finalize contractual path',
        description: 'Open hiring match, then commercial agreement and contract.',
        entityRoute: '/contracts/seed-contract-demo-equity',
        loginAs: {
          email: 'admin@pmtwin.com',
          passwordHint: 'admin123',
          accountType: 'admin',
          roleLabel: 'Walkthrough host',
        },
      },
    ],
    matchTypes: ['one_way'],
    mainCollaborationModels: ['hiring'],
    seedSubsetRefs: [
      {
        entityType: 'opportunities',
        loader: 'loadOpportunities',
        ids: ['seed-opp-demo-prof-hiring', 'seed-opp-demo-consultant'],
      },
      {
        entityType: 'postMatches',
        loader: 'loadPostMatches',
        ids: ['seed-pm-demo-hiring'],
      },
      {
        entityType: 'applications',
        loader: 'loadApplications',
        ids: ['seed-app-demo-hiring-01'],
      },
      {
        entityType: 'negotiations',
        loader: 'loadNegotiations',
        ids: ['seed-neg-demo-hiring-path'],
      },
      {
        entityType: 'commercialAgreements',
        loader: 'loadCommercialAgreements',
        ids: ['seed-deal-demo-hiring'],
      },
      {
        entityType: 'contracts',
        loader: 'loadContracts',
        ids: ['seed-contract-demo-equity'],
      },
    ],
  },
  {
    id: 'circular-resource-sharing',
    title: 'Circular Resource Sharing',
    description:
      'Complete circular exchange among bulk / equipment / crew parties through match, negotiation, agreement, and hybrid contract.',
    targetAudience: ['procurement-team', 'operations-team', 'technical-review'],
    includedEntities: [
      'opportunities',
      'postMatches',
      'negotiations',
      'negotiationMessages',
      'negotiationOffers',
      'negotiationTranscriptEvents',
      'commercialAgreements',
      'contracts',
      'audit',
    ],
    narrativeSteps: [
      {
        id: 'crs-1',
        title: 'Open bulk purchasing node',
        description: 'Login as Najd Investment and open the bulk steel/concrete opportunity.',
        entityRoute: '/opportunities/seed-opp-demo-bulk',
        loginAs: {
          email: 'contact@najd-investment.test',
          passwordHint: PW,
          accountType: 'company',
          roleLabel: 'Company — circular node',
        },
      },
      {
        id: 'crs-2',
        title: 'Inspect circular match topology',
        description: 'Open the circular resource post-match (three-party ring).',
        entityRoute: '/matches/seed-pm-demo-circular-resource',
        loginAs: {
          email: 'abdullah.alrashid@pmtwin.test',
          passwordHint: PW,
          accountType: 'individual',
          roleLabel: 'Professional — equipment node',
        },
      },
      {
        id: 'crs-3',
        title: 'Close hybrid contract',
        description: 'Review circular commercial agreement and hybrid contract.',
        entityRoute: '/contracts/seed-contract-demo-hybrid',
        loginAs: {
          email: 'admin@pmtwin.com',
          passwordHint: 'admin123',
          accountType: 'admin',
          roleLabel: 'Walkthrough host',
        },
      },
    ],
    matchTypes: ['circular'],
    mainCollaborationModels: ['resource_sharing'],
    seedSubsetRefs: [
      {
        entityType: 'opportunities',
        loader: 'loadOpportunities',
        ids: ['seed-opp-demo-bulk', 'seed-opp-demo-equip', 'seed-opp-demo-resource'],
      },
      {
        entityType: 'postMatches',
        loader: 'loadPostMatches',
        ids: ['seed-pm-demo-circular-resource'],
      },
      {
        entityType: 'negotiations',
        loader: 'loadNegotiations',
        ids: ['seed-neg-demo-circular-agreed'],
      },
      {
        entityType: 'commercialAgreements',
        loader: 'loadCommercialAgreements',
        ids: ['seed-deal-demo-resource-circular'],
      },
      {
        entityType: 'contracts',
        loader: 'loadContracts',
        ids: ['seed-contract-demo-hybrid'],
      },
    ],
  },
  {
    id: 'marketplace',
    title: 'Marketplace (All 4 Topologies)',
    description:
      'Executive tour covering one_way, two_way, consortium, and circular complete demo chains.',
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
        title: 'One-way cash chain',
        description: 'Start from the complete one_way cash subcontracting match.',
        entityRoute: '/matches/seed-pm-demo-oneway-cash',
        loginAs: {
          email: 'contact@gulf-development.test',
          passwordHint: PW,
          accountType: 'company',
          roleLabel: 'Company — one_way',
        },
      },
      {
        id: 'mk-2',
        title: 'Two-way barter chain',
        description: 'Open the complete two_way barter match.',
        entityRoute: '/matches/seed-pm-demo-twoway-barter',
        loginAs: {
          email: 'omar.alshehri@pmtwin.test',
          passwordHint: PW,
          accountType: 'individual',
          roleLabel: 'Professional — two_way',
        },
      },
      {
        id: 'mk-3',
        title: 'Consortium JV chain',
        description: 'Open the complete consortium JV match.',
        entityRoute: '/matches/seed-pm-demo-consortium-jv',
        loginAs: {
          email: 'contact@sa-infra-partners.test',
          passwordHint: PW,
          accountType: 'company',
          roleLabel: 'Company — consortium',
        },
      },
      {
        id: 'mk-4',
        title: 'Circular resource chain',
        description: 'Open the complete circular resource match.',
        entityRoute: '/matches/seed-pm-demo-circular-resource',
        loginAs: {
          email: 'contact@najd-investment.test',
          passwordHint: PW,
          accountType: 'company',
          roleLabel: 'Company — circular',
        },
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
        ids: ['seed-user-004', 'seed-user-005', 'seed-user-010'],
      },
      {
        entityType: 'companies',
        loader: 'loadCompanies',
        ids: ['seed-co-corp-002', 'seed-co-corp-004', 'seed-co-corp-005'],
      },
      {
        entityType: 'opportunities',
        loader: 'loadOpportunities',
        ids: [
          'seed-opp-demo-task-need',
          'seed-opp-demo-alliance-a',
          'seed-opp-demo-consortium-lead',
          'seed-opp-demo-bulk',
        ],
      },
      {
        entityType: 'postMatches',
        loader: 'loadPostMatches',
        ids: [
          'seed-pm-demo-oneway-cash',
          'seed-pm-demo-twoway-barter',
          'seed-pm-demo-consortium-jv',
          'seed-pm-demo-circular-resource',
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

export function getDemoScenarioById(id: string): DemoScenarioDefinition | undefined {
  return DEMO_SCENARIO_REGISTRY.find((scenario) => scenario.id === id)
}

export function listRegistryMatchTypes(): readonly MatchingModelKey[] {
  const set = new Set<MatchingModelKey>()
  for (const scenario of DEMO_SCENARIO_REGISTRY) {
    for (const matchType of scenario.matchTypes) set.add(matchType)
  }
  return [...set]
}
