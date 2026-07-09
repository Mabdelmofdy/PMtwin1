import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  AI_EXPLANATION_PAYLOAD_VERSION,
  deserializeAIExplanationPayload,
  deserializeExplanationBundle,
  fromAIExplanationPayload,
  serializeAIExplanationPayload,
  serializeExplanationBundle,
  toAIExplanationPayload,
} from '../dist/index.js'
import { createSampleExplanationBundle } from './fixtures.js'

describe('AI explanation serialization contract', () => {
  it('round-trips ExplanationBundle JSON', () => {
    const bundle = createSampleExplanationBundle()
    const json = serializeExplanationBundle(bundle)
    const restored = deserializeExplanationBundle(json)

    assert.deepEqual(restored, bundle)
  })

  it('round-trips AIExplanationPayload JSON', () => {
    const bundle = createSampleExplanationBundle()
    const payload = toAIExplanationPayload(
      bundle,
      '2026-07-09T12:00:00.000Z',
    )

    assert.equal(payload.version, AI_EXPLANATION_PAYLOAD_VERSION)

    const json = serializeAIExplanationPayload(payload)
    const restored = deserializeAIExplanationPayload(json)

    assert.deepEqual(restored, payload)
    assert.deepEqual(fromAIExplanationPayload(restored), bundle)
  })

  it('rejects invalid serialized bundles', () => {
    assert.throws(() => deserializeExplanationBundle('{"engine":"invalid"}'))
    assert.throws(() =>
      deserializeAIExplanationPayload(
        JSON.stringify({
          version: AI_EXPLANATION_PAYLOAD_VERSION,
          serializedAt: '2026-07-09T12:00:00.000Z',
          bundle: { engine: 'invalid' },
        }),
      ),
    )
  })
})
