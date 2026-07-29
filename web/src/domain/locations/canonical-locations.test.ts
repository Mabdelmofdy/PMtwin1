import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  collapseRedundantScopes,
  expandScopeTokens,
  formatLocation,
  isScopeId,
  listLocationScopes,
  normalizeStoredLocation,
  resolveOpportunityCoverageAreas,
  resolveScopeCoordinates,
  resolveScopeIdFromText,
  resolveScopeLabel,
} from './canonical-locations.ts'

describe('canonical-locations', () => {
  it('lists presets and seed scopes', () => {
    const scopes = listLocationScopes()
    assert.ok(scopes.some((s) => s.id === 'remote'))
    assert.ok(scopes.some((s) => s.id === 'gcc'))
    assert.ok(scopes.some((s) => s.id === 'sa'))
    assert.ok(scopes.some((s) => s.id === 'sa/riyadh/riyadh-city'))
  })

  it('resolves scope labels; passes unknown legacy strings through', () => {
    assert.equal(resolveScopeLabel('sa/riyadh/riyadh-city'), 'Riyadh City')
    assert.equal(formatLocation('sa/riyadh/riyadh-city'), 'Riyadh City')
    assert.equal(
      resolveScopeLabel('Riyadh, Saudi Arabia'),
      'Riyadh, Saudi Arabia',
    )
    assert.equal(resolveScopeLabel(''), '')
  })

  it('maps legacy free-text to scope IDs', () => {
    assert.equal(
      resolveScopeIdFromText('Riyadh, Saudi Arabia'),
      'sa/riyadh/riyadh-city',
    )
    assert.equal(resolveScopeIdFromText('Jeddah'), 'sa/makkah/jeddah')
    assert.equal(resolveScopeIdFromText('sa/riyadh'), 'sa/riyadh')
    assert.equal(resolveScopeIdFromText('not-a-place-xyz'), null)
  })

  it('city expansion never emits nationwide tokens', () => {
    const tokens = expandScopeTokens(['sa/riyadh/riyadh-city'])
    assert.deepEqual(tokens, ['Riyadh City'])
    assert.ok(!tokens.some((t) => /saudi arabia/i.test(t)))
  })

  it('region expansion includes region + cities', () => {
    const tokens = expandScopeTokens(['sa/riyadh'])
    assert.ok(tokens.includes('Riyadh'))
    assert.ok(tokens.includes('Riyadh City'))
    assert.ok(!tokens.some((t) => /saudi arabia/i.test(t)))
  })

  it('country expansion emits nationwide label only', () => {
    const tokens = expandScopeTokens(['sa'])
    assert.deepEqual(tokens, ['Saudi Arabia'])
  })

  it('expands gcc and remote presets', () => {
    assert.deepEqual(expandScopeTokens(['gcc']), ['GCC'])
    assert.deepEqual(expandScopeTokens(['remote']), ['Remote'])
  })

  it('isScopeId distinguishes canonical ids from free text', () => {
    assert.equal(isScopeId('sa/riyadh/riyadh-city'), true)
    assert.equal(isScopeId('Riyadh, Saudi Arabia'), false)
  })

  it('resolves coordinates for city scopes', () => {
    const coords = resolveScopeCoordinates('sa/riyadh/riyadh-city')
    assert.ok(coords)
    assert.ok(typeof coords!.lat === 'number')
    assert.ok(typeof coords!.lng === 'number')
  })

  it('collapses redundant descendants', () => {
    const { collapsed, removed } = collapseRedundantScopes([
      'sa',
      'sa/riyadh',
      'sa/riyadh/riyadh-city',
      'uae/dubai/dubai',
    ])
    assert.deepEqual(collapsed.sort(), ['sa', 'uae/dubai/dubai'].sort())
    assert.ok(removed.includes('sa/riyadh'))
    assert.ok(removed.includes('sa/riyadh/riyadh-city'))
  })

  it('hydrates coverage from legacy serviceArea', () => {
    const areas = resolveOpportunityCoverageAreas({
      collaborationAttributes: { serviceArea: 'Jeddah' },
    })
    assert.deepEqual(areas, ['sa/makkah/jeddah'])
  })

  it('prefers explicit coverageAreas over legacy serviceArea', () => {
    const areas = resolveOpportunityCoverageAreas({
      coverageAreas: ['gcc'],
      collaborationAttributes: { serviceArea: 'Jeddah' },
    })
    assert.deepEqual(areas, ['gcc'])
  })

  it('normalizes stored location to scope id when possible', () => {
    assert.equal(
      normalizeStoredLocation('Riyadh, Saudi Arabia'),
      'sa/riyadh/riyadh-city',
    )
    assert.equal(
      normalizeStoredLocation('sa/riyadh/riyadh-city'),
      'sa/riyadh/riyadh-city',
    )
    assert.equal(
      normalizeStoredLocation('Custom Village XYZ'),
      'Custom Village XYZ',
    )
  })
})
