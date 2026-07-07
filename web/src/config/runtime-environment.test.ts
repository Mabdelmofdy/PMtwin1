import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { resolveRuntimeMode } from '@/config/runtime-environment.ts'

describe('resolveRuntimeMode', () => {
  it('returns demo when env is missing', () => {
    assert.equal(resolveRuntimeMode(undefined), 'demo')
  })

  it('parses valid runtime mode values', () => {
    assert.equal(resolveRuntimeMode('demo'), 'demo')
    assert.equal(resolveRuntimeMode('uat'), 'uat')
    assert.equal(resolveRuntimeMode('production'), 'production')
  })

  it('normalizes casing and trims whitespace', () => {
    assert.equal(resolveRuntimeMode(' UAT '), 'uat')
  })

  it('falls back to demo on invalid values', () => {
    assert.equal(resolveRuntimeMode('staging'), 'demo')
  })
})

