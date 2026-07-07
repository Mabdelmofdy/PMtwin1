import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  DEMO_SCENARIO_REGISTRY,
  type DemoScenarioEntityType,
  type DemoScenarioLoader,
} from '@/infrastructure/environment/demo-scenario-registry.ts'
import {
  loadApplications,
  loadAuditLog,
  loadCommercialAgreements,
  loadCompanies,
  loadContracts,
  loadNegotiationMessages,
  loadNegotiationOffers,
  loadNegotiations,
  loadNegotiationTranscriptEvents,
  loadNotifications,
  loadOpportunities,
  loadPostMatches,
  loadUsers,
} from '@/infrastructure/seed/seed-loader.ts'

const REQUIRED_SCENARIOS = [
  'cash-subcontracting',
  'joint-venture',
  'hiring',
  'circular-resource-sharing',
  'marketplace',
] as const

const REQUIRED_MATCH_TYPES = ['one_way', 'two_way', 'consortium', 'circular'] as const
const REQUIRED_MAIN_MODELS = [
  'cash_subcontracting',
  'service_exchange',
  'joint_venture',
  'resource_sharing',
  'hiring',
] as const

const ENTITY_TO_LOADER: Record<DemoScenarioEntityType, DemoScenarioLoader> = {
  users: 'loadUsers',
  companies: 'loadCompanies',
  opportunities: 'loadOpportunities',
  postMatches: 'loadPostMatches',
  negotiations: 'loadNegotiations',
  negotiationMessages: 'loadNegotiationMessages',
  negotiationOffers: 'loadNegotiationOffers',
  negotiationTranscriptEvents: 'loadNegotiationTranscriptEvents',
  commercialAgreements: 'loadCommercialAgreements',
  contracts: 'loadContracts',
  applications: 'loadApplications',
  notifications: 'loadNotifications',
  audit: 'loadAuditLog',
}

const LOADER_DATASETS: Record<DemoScenarioLoader, readonly { id: string }[]> = {
  loadUsers: loadUsers(),
  loadCompanies: loadCompanies(),
  loadOpportunities: loadOpportunities(),
  loadPostMatches: loadPostMatches(),
  loadNegotiations: loadNegotiations(),
  loadNegotiationMessages: loadNegotiationMessages(),
  loadNegotiationOffers: loadNegotiationOffers(),
  loadNegotiationTranscriptEvents: loadNegotiationTranscriptEvents(),
  loadCommercialAgreements: loadCommercialAgreements(),
  loadContracts: loadContracts(),
  loadApplications: loadApplications(),
  loadNotifications: loadNotifications(),
  loadAuditLog: loadAuditLog(),
}

describe('demo scenario registry', () => {
  it('contains all required scenarios', () => {
    const ids = new Set(DEMO_SCENARIO_REGISTRY.map((scenario) => scenario.id))
    for (const required of REQUIRED_SCENARIOS) {
      assert.equal(ids.has(required), true, `missing required scenario: ${required}`)
    }
  })

  it('uses unique scenario IDs', () => {
    const ids = DEMO_SCENARIO_REGISTRY.map((scenario) => scenario.id)
    assert.equal(new Set(ids).size, ids.length)
  })

  it('stores complete scenario metadata', () => {
    for (const scenario of DEMO_SCENARIO_REGISTRY) {
      assert.ok(scenario.title.trim().length > 0, `${scenario.id} title is required`)
      assert.ok(scenario.description.trim().length > 0, `${scenario.id} description is required`)
      assert.ok(scenario.targetAudience.length > 0, `${scenario.id} targetAudience is required`)
      assert.ok(scenario.includedEntities.length > 0, `${scenario.id} includedEntities is required`)
      assert.ok(scenario.narrativeSteps.length > 0, `${scenario.id} narrativeSteps are required`)
      assert.ok(scenario.seedSubsetRefs.length > 0, `${scenario.id} seedSubsetRefs are required`)
      for (const step of scenario.narrativeSteps) {
        assert.ok(step.id.trim().length > 0, `${scenario.id} narrative step id is required`)
        assert.ok(step.title.trim().length > 0, `${scenario.id} narrative step title is required`)
        assert.ok(
          step.description.trim().length > 0,
          `${scenario.id} narrative step description is required`,
        )
      }
    }
  })

  it('uses valid scenario seed/entity references', () => {
    for (const scenario of DEMO_SCENARIO_REGISTRY) {
      for (const ref of scenario.seedSubsetRefs) {
        assert.equal(
          ref.loader,
          ENTITY_TO_LOADER[ref.entityType],
          `${scenario.id} has mismatched loader for ${ref.entityType}`,
        )
        assert.ok(ref.ids.length > 0, `${scenario.id} ${ref.entityType} reference ids are required`)
        const datasetIds = new Set(LOADER_DATASETS[ref.loader].map((entry) => entry.id))
        for (const id of ref.ids) {
          assert.equal(
            datasetIds.has(id),
            true,
            `${scenario.id} references unknown ${ref.entityType} id: ${id}`,
          )
        }
      }
    }
  })

  it('covers all four match types across scenarios', () => {
    const coveredTypes = new Set(
      DEMO_SCENARIO_REGISTRY.flatMap((scenario) => scenario.matchTypes),
    )
    for (const type of REQUIRED_MATCH_TYPES) {
      assert.equal(coveredTypes.has(type), true, `match type not covered: ${type}`)
    }
  })

  it('covers the five main collaboration models where applicable', () => {
    const coveredModels = new Set(
      DEMO_SCENARIO_REGISTRY.flatMap((scenario) => scenario.mainCollaborationModels),
    )
    for (const model of REQUIRED_MAIN_MODELS) {
      assert.equal(coveredModels.has(model), true, `main model not covered: ${model}`)
    }
  })
})

