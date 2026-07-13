import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import opportunitiesBase from '@seed-data/opportunities.json'
import {
  buildDemoCastCoverageSnapshot,
  isDemoOpportunityMatchingReady,
  listShowcaseDemoOpportunityIds,
} from '@/domain/admin/diagnostics/demo-cast-coverage.ts'
import {
  getDemoScenarioRegistry,
  listRegistryMatchTypes,
} from '@/infrastructure/environment/demo-scenario-registry.ts'
import { loadOpportunities, loadPostMatches } from '@/infrastructure/seed/seed-loader.ts'

describe('demo matching coverage + walkthrough', () => {
  it('casts every demo account into at least one scenario', () => {
    const snapshot = buildDemoCastCoverageSnapshot()
    assert.equal(
      snapshot.missingAccountIds.length,
      0,
      `Uncast accounts: ${snapshot.missingAccountIds.join(', ')}`,
    )
    assert.ok(snapshot.castAccounts >= 60)
  })

  it('has complete showcase chains for all four topologies', () => {
    const snapshot = buildDemoCastCoverageSnapshot()
    for (const chain of snapshot.topologyChains) {
      assert.equal(chain.complete, true, `${chain.matchType} incomplete`)
    }
    assert.equal(snapshot.registryCoversAllTopologies, true)
  })

  it('enriches showcase demo opportunities for matching readiness', () => {
    const rows = (opportunitiesBase as { data: Array<Record<string, unknown>> }).data
    for (const id of listShowcaseDemoOpportunityIds()) {
      const opp = rows.find((row) => row.id === id)
      assert.ok(opp, `missing ${id}`)
      assert.equal(
        isDemoOpportunityMatchingReady(opp as never),
        true,
        `${id} not matching-ready`,
      )
    }
    const bulk = rows.find((row) => row.id === 'seed-opp-demo-bulk')
    assert.equal((bulk as { preferredMatchingTopology?: string })?.preferredMatchingTopology, 'circular')
  })

  it('loads cast-coverage opportunities and matches via seed loader', () => {
    const opps = loadOpportunities()
    const matches = loadPostMatches()
    assert.ok(opps.some((opp) => opp.id.startsWith('seed-opp-cast-')))
    assert.ok(matches.some((match) => match.id.startsWith('demo-pm-cast-')))
  })

  it('registry narrative steps include loginAs and entity routes', () => {
    const registry = getDemoScenarioRegistry()
    assert.ok(listRegistryMatchTypes().includes('one_way'))
    assert.ok(listRegistryMatchTypes().includes('two_way'))
    assert.ok(listRegistryMatchTypes().includes('consortium'))
    assert.ok(listRegistryMatchTypes().includes('circular'))

    for (const scenario of registry) {
      assert.ok(scenario.narrativeSteps.length > 0)
      for (const step of scenario.narrativeSteps) {
        assert.ok(step.loginAs?.email, `${scenario.id}/${step.id} missing loginAs`)
        assert.ok(step.entityRoute, `${scenario.id}/${step.id} missing entityRoute`)
      }
      for (const ref of scenario.seedSubsetRefs) {
        if (ref.entityType === 'postMatches' || ref.entityType === 'opportunities') {
          assert.ok(ref.ids.length > 0)
        }
      }
    }
  })
})
