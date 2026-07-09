import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  ENGINE_ID,
  enrichExplanationBundle,
  traceExplainabilityBuild,
} from '../dist/index.js'
import { createSampleExplanationBundle } from './fixtures.js'

describe('explainability observability trace', () => {
  it('captures sync build duration and engine metadata', () => {
    const { result, trace } = traceExplainabilityBuild('profile', () =>
      createSampleExplanationBundle(),
    )

    assert.equal(result.entityId, 'opp-001')
    assert.equal(trace.label, 'profile')
    assert.equal(trace.engine, ENGINE_ID.READINESS)
    assert.equal(trace.entityId, 'opp-001')
    assert.ok(trace.durationMs >= 0)
    assert.equal(trace.enriched, false)
    assert.equal(trace.knowledgeHit, false)
  })

  it('marks enriched bundles in trace metadata', () => {
    const bundle = createSampleExplanationBundle()
    const { result, trace } = traceExplainabilityBuild('enrich', () =>
      enrichExplanationBundle(bundle, { subModelKey: 'project_based', locale: 'en' }),
    )

    assert.equal(trace.label, 'enrich')
    assert.equal(trace.enriched, Boolean(result.metadata.extensions?.knowledge))
    assert.equal(trace.knowledgeHit, Boolean(result.metadata.extensions?.knowledge))
  })

  it('supports async build wrappers', async () => {
    const { result, trace } = await traceExplainabilityBuild('async-dashboard', async () => {
      await Promise.resolve()
      return {
        ...createSampleExplanationBundle(),
        engine: ENGINE_ID.DASHBOARD,
      }
    })

    assert.equal(result.engine, ENGINE_ID.DASHBOARD)
    assert.equal(trace.engine, ENGINE_ID.DASHBOARD)
    assert.ok(trace.durationMs >= 0)
  })
})
