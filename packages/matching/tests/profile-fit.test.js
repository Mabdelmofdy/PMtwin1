import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  PROFILE_FIT_SNAPSHOT_KIND,
  isProfileFitSnapshot,
  scoreProfileFit,
} from '../dist/index.js'

function snapshot(overrides = {}) {
  return {
    kind: PROFILE_FIT_SNAPSHOT_KIND,
    capabilities: ['BIM coordination', 'Project controls'],
    services: ['Design review', 'Schedule management'],
    sectors: ['Construction', 'Infrastructure'],
    geography: {
      countries: ['Saudi Arabia'],
      regions: ['Riyadh Region'],
      cities: ['Riyadh'],
    },
    workModes: ['hybrid', 'remote'],
    availability: { start: '2026-01-01', end: '2026-12-31' },
    verifiedCredentials: ['PMP', 'SCE'],
    counterpartPreference: {
      capabilities: ['BIM coordination'],
      services: ['Design review'],
      sectors: ['Construction'],
      geography: {
        countries: ['Saudi Arabia'],
        regions: ['Riyadh Region'],
        cities: ['Riyadh'],
      },
      workModes: ['hybrid'],
      verifiedCredentials: ['PMP'],
    },
    ...overrides,
  }
}

const matchingOpportunity = {
  intent: 'request',
  locationCountry: 'Saudi Arabia',
  locationRegion: 'Riyadh Region',
  locationCity: 'Riyadh',
  attributes: {
    workMode: 'Hybrid',
    requiredCredentials: ['PMP'],
  },
  normalized: {
    coreSkills: ['BIM coordination'],
    requiredServices: ['Design review'],
    categories: ['Construction'],
    timeline: { start: '2026-02-01', end: '2026-10-31' },
  },
}

describe('profile fit — strict non-PII snapshot boundary', () => {
  it('accepts only the closed categorical snapshot shape', () => {
    assert.equal(isProfileFitSnapshot(snapshot()), true)
    assert.equal(isProfileFitSnapshot({
      ...snapshot(),
      name: 'A profile name',
    }), false)
    assert.equal(isProfileFitSnapshot({
      ...snapshot(),
      email: 'person@example.test',
    }), false)
    assert.equal(isProfileFitSnapshot({
      ...snapshot(),
      geography: {
        ...snapshot().geography,
        streetAddress: 'Private address',
      },
    }), false)
    assert.equal(isProfileFitSnapshot({
      ...snapshot(),
      counterpartPreference: {
        ...snapshot().counterpartPreference,
        contactPhone: '+966500000000',
      },
    }), false)
  })

  it('rejects malformed controlled values and date ranges', () => {
    assert.equal(isProfileFitSnapshot(snapshot({ workModes: ['office-or-home'] })), false)
    assert.equal(isProfileFitSnapshot(snapshot({
      availability: { start: '2026-13-01', end: '2026-12-31' },
    })), false)
    assert.equal(isProfileFitSnapshot(snapshot({
      availability: { start: '2026-12-31', end: '2026-01-01' },
    })), false)
    assert.equal(isProfileFitSnapshot(snapshot({ services: [''] })), false)
  })

  it('refuses unknown PII-bearing fields before scoring', () => {
    assert.throws(
      () => scoreProfileFit({ ...snapshot(), fullName: 'Private Person' }, matchingOpportunity),
      /exact non-PII schema/,
    )
    assert.throws(
      () => scoreProfileFit(snapshot(), { ...snapshot(), profileUrl: 'https://example.test/me' }),
      /exact non-PII schema/,
    )
  })
})

describe('profile fit — opportunity scoring', () => {
  it('returns a perfect bounded score and explanations for a full fit', () => {
    const result = scoreProfileFit(snapshot(), matchingOpportunity)

    assert.equal(result.score, 1)
    assert.equal(result.targetType, 'opportunity')
    assert.equal(result.factors.length, 8)
    assert.ok(result.factors.every((factor) => factor.score >= 0 && factor.score <= 1))
    assert.ok(result.factors.every((factor) => factor.explanation.length > 0))
    assert.deepEqual(
      result.factors.map((factor) => factor.factor),
      [
        'capabilities',
        'services',
        'sectors',
        'geography',
        'workMode',
        'availability',
        'verifiedCredentials',
        'counterpartPreference',
      ],
    )
  })

  it('scores requirement coverage, unavailable dates, and missing credentials', () => {
    const result = scoreProfileFit(
      snapshot({
        capabilities: ['BIM coordination'],
        availability: { start: '2027-01-01', end: '2027-12-31' },
        verifiedCredentials: [],
        counterpartPreference: {
          ...snapshot().counterpartPreference,
          workModes: ['remote'],
        },
      }),
      {
        ...matchingOpportunity,
        normalized: {
          ...matchingOpportunity.normalized,
          coreSkills: ['BIM coordination', 'Risk management'],
        },
      },
    )

    const byName = Object.fromEntries(result.factors.map((factor) => [factor.factor, factor]))
    assert.equal(byName.capabilities.score, 0.5)
    assert.deepEqual(byName.capabilities.missing, ['risk management'])
    assert.equal(byName.availability.score, 0)
    assert.equal(byName.verifiedCredentials.score, 0)
    assert.equal(byName.counterpartPreference.score < 1, true)
    assert.equal(result.score > 0 && result.score < 1, true)
  })

  it('excludes absent opportunity criteria and returns zero for no signal', () => {
    const emptyPreference = {
      capabilities: [],
      services: [],
      sectors: [],
      geography: { countries: [], regions: [], cities: [] },
      workModes: [],
      verifiedCredentials: [],
    }
    const result = scoreProfileFit(
      snapshot({ counterpartPreference: emptyPreference }),
      {},
    )

    assert.equal(result.score, 0)
    assert.ok(result.factors.every((factor) => factor.applicable === false))
    assert.ok(result.factors.every((factor) => factor.weight > 0))
  })

  it('is deterministic and does not mutate either input', () => {
    const profile = snapshot()
    const opportunity = structuredClone(matchingOpportunity)
    const profileBefore = structuredClone(profile)
    const opportunityBefore = structuredClone(opportunity)

    const first = scoreProfileFit(profile, opportunity)
    const second = scoreProfileFit(profile, opportunity)

    assert.deepEqual(first, second)
    assert.deepEqual(profile, profileBefore)
    assert.deepEqual(opportunity, opportunityBefore)
  })
})

describe('profile fit — profile-to-profile scoring', () => {
  it('uses the target counterpart preferences for directional fit', () => {
    const target = snapshot({
      counterpartPreference: {
        ...snapshot().counterpartPreference,
        capabilities: ['Cybersecurity'],
        services: ['Penetration testing'],
        verifiedCredentials: ['CISSP'],
      },
    })
    const weak = scoreProfileFit(snapshot(), target)
    const strong = scoreProfileFit(snapshot({
      capabilities: ['Cybersecurity'],
      services: ['Penetration testing'],
      verifiedCredentials: ['CISSP'],
    }), target)

    assert.equal(weak.targetType, 'profile')
    assert.equal(strong.targetType, 'profile')
    assert.equal(strong.score > weak.score, true)
    assert.equal(strong.score >= 0 && strong.score <= 1, true)
  })
})
