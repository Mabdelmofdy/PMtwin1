import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  AI_EXPLANATION_PAYLOAD_VERSION,
  ENGINE_ID,
  createAIExplanationGateway,
  fromAIExplanationPayload,
  importPayloadFromJson,
  isExplanationBundle,
  serializeAgentContext,
  toAIExplanationPayload,
} from '../dist/index.js'
import { createSampleExplanationBundle } from './fixtures.js'

describe('AI explanation gateway', () => {
  const gateway = createAIExplanationGateway()

  it('exports and imports AIExplanationPayload', () => {
    const bundle = createSampleExplanationBundle()
    const payload = gateway.exportPayload(bundle)

    assert.equal(payload.version, AI_EXPLANATION_PAYLOAD_VERSION)
    assert.equal(isExplanationBundle(payload.bundle), true)

    const restored = gateway.importPayload(payload)
    assert.deepEqual(restored, bundle)
  })

  it('exports batch JSON array for agent context', () => {
    const bundles = [
      createSampleExplanationBundle(),
      {
        ...createSampleExplanationBundle(),
        engine: ENGINE_ID.DASHBOARD,
        entityId: 'user-001',
      },
    ]

    const json = gateway.exportBatch(bundles)
    const parsed = JSON.parse(json)

    assert.equal(Array.isArray(parsed), true)
    assert.equal(parsed.length, 2)
    assert.equal(parsed[0].version, AI_EXPLANATION_PAYLOAD_VERSION)
  })

  it('builds structured agent context', () => {
    const bundle = createSampleExplanationBundle()
    const context = gateway.buildAgentContext({
      bundles: [bundle],
      subModelKey: 'project_based',
      locale: 'en',
      includeKnowledge: false,
    })

    assert.equal(context.locale, 'en')
    assert.equal(context.subModelKey, 'project_based')
    assert.equal(context.summaries.length, 1)
    assert.equal(context.bundles.length, 1)
    assert.equal(context.includeKnowledge, false)
    assert.equal(context.knowledge, undefined)

    const serialized = serializeAgentContext(context)
    assert.ok(serialized.includes('"summaries"'))
  })

  it('imports payload from raw JSON', () => {
    const bundle = createSampleExplanationBundle()
    const payload = toAIExplanationPayload(bundle)
    const json = JSON.stringify(payload)

    const restored = importPayloadFromJson(json)
    assert.deepEqual(restored, fromAIExplanationPayload(payload))
  })
})
