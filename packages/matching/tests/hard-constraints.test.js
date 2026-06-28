import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  passesPair,
  rolesCompatible,
  withMatchingDefaults,
} from '../dist/index.js'

const strictConfig = withMatchingDefaults({
  STRICT_ROLE_EXACT_MATCH: true,
  MIN_REQUIRED_SERVICE_OVERLAP: 0.50,
})

const matrixConfig = withMatchingDefaults({
  STRICT_ROLE_EXACT_MATCH: false,
})

function needPost(overrides = {}) {
  return {
    id: 'need-1',
    intent: 'request',
    attributes: { targetRole: 'Architect' },
    normalized: {
      role: 'Architect',
      requiredServices: ['BIM', '3D Visualization', 'Sustainable Design', 'LEED Certification'],
      offeredServices: [],
      coreSkills: [],
      skills: ['BIM', '3D Visualization', 'Sustainable Design', 'LEED Certification'],
    },
    ...overrides,
  }
}

function offerPost(overrides = {}) {
  return {
    id: 'offer-1',
    intent: 'offer',
    attributes: { targetRole: 'Civil Engineer' },
    normalized: {
      role: 'Civil Engineer',
      requiredServices: [],
      offeredServices: ['Structural Analysis', 'SAP2000'],
      coreSkills: [],
      skills: ['Structural Analysis', 'SAP2000'],
    },
    ...overrides,
  }
}

describe('hard constraints — strict role exact match', () => {
  it('rejects Architect need with Civil Engineer offer', () => {
    const result = passesPair(needPost(), offerPost(), strictConfig)
    assert.equal(result.ok, false)
    assert.equal(result.reason, 'role_incompatible')
  })

  it('allows exact same role', () => {
    const offer = offerPost({
      attributes: { targetRole: 'Architect' },
      normalized: {
        role: 'Architect',
        offeredServices: ['BIM', '3D Visualization'],
        skills: ['BIM', '3D Visualization'],
      },
    })
    const result = passesPair(needPost(), offer, strictConfig)
    assert.equal(result.ok, true)
  })
})

describe('hard constraints — role compatibility matrix', () => {
  it('allows Architect need with Interior Designer offer when exact match is off', () => {
    const offer = offerPost({
      attributes: { targetRole: 'Interior Designer' },
      normalized: {
        role: 'Interior Designer',
        offeredServices: ['BIM', '3D Visualization', 'Sustainable Design', 'LEED Certification'],
        skills: ['BIM', '3D Visualization', 'Sustainable Design', 'LEED Certification'],
      },
    })
    assert.equal(rolesCompatible('Architect', 'Interior Designer', matrixConfig), true)
    const result = passesPair(needPost(), offer, matrixConfig)
    assert.equal(result.ok, true)
  })

  it('rejects Architect with Civil Engineer even when matrix mode is on', () => {
    assert.equal(rolesCompatible('Architect', 'Civil Engineer', matrixConfig), false)
  })
})

describe('hard constraints — required service overlap', () => {
  it('rejects when overlap is below threshold', () => {
    const offer = offerPost({
      attributes: { targetRole: 'Architect' },
      normalized: {
        role: 'Architect',
        offeredServices: ['BIM'],
        skills: ['BIM'],
      },
    })
    const result = passesPair(needPost(), offer, strictConfig)
    assert.equal(result.ok, false)
    assert.equal(result.reason, 'service_overlap_low')
    assert.equal(result.overlap, 0.25)
  })

  it('passes when overlap meets threshold', () => {
    const offer = offerPost({
      attributes: { targetRole: 'Architect' },
      normalized: {
        role: 'Architect',
        offeredServices: ['BIM', '3D Visualization'],
        skills: ['BIM', '3D Visualization'],
      },
    })
    const result = passesPair(needPost(), offer, strictConfig)
    assert.equal(result.ok, true)
    assert.equal(result.overlap, 0.5)
  })
})

describe('hard constraints — core skills gate', () => {
  it('rejects when a required core skill is missing', () => {
    const need = needPost({
      normalized: {
        role: 'Architect',
        requiredServices: ['BIM', 'Revit'],
        coreSkills: ['BIM'],
        offeredServices: [],
      },
    })
    const offer = offerPost({
      attributes: { targetRole: 'Architect' },
      normalized: {
        role: 'Architect',
        offeredServices: ['Revit'],
        coreSkills: [],
        skills: ['Revit'],
      },
    })
    const result = passesPair(need, offer, strictConfig)
    assert.equal(result.ok, false)
    assert.equal(result.reason, 'core_skill_missing')
    assert.ok(result.missing?.includes('BIM'))
  })
})
