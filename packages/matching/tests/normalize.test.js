import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildSemanticProfile,
  expandTerm,
  extractAndNormalize,
  extractBudget,
  extractTimeline,
  normalizeCategory,
  normalizeLocation,
  normalizeSkill,
} from '../dist/index.js'

const canonical = {
  skillSynonyms: {
    autocad: 'AutoCAD',
    revit: 'Revit',
    bim: 'BIM',
    '3d visualization': '3D Visualization',
  },
  locationCanonical: {
    remote: 'Remote',
    riyadh: 'Riyadh',
    'riyadh-city': 'Riyadh',
    ksa: 'KSA',
    neom: 'NEOM',
  },
  categoryExpansion: {
    'shop drawing review': ['Structural Engineering', 'Design', 'Review'],
    design: ['Design', 'Engineering', 'Consultation'],
  },
  semanticTerms: {
    'shop drawing review': ['Structural Engineering', 'Design', 'Review'],
    design: ['Design', 'Engineering', 'Consultation'],
  },
}

describe('normalize — skill alias normalization', () => {
  it('maps lowercase synonyms to canonical skill labels', () => {
    assert.equal(normalizeSkill('autocad', canonical.skillSynonyms), 'AutoCAD')
    assert.equal(normalizeSkill('revit', canonical.skillSynonyms), 'Revit')
    assert.equal(normalizeSkill('BIM', canonical.skillSynonyms), 'BIM')
  })

  it('returns trimmed original when no synonym exists', () => {
    assert.equal(normalizeSkill('  Custom Skill  ', canonical.skillSynonyms), 'Custom Skill')
  })
})

describe('normalize — location normalization', () => {
  it('maps locationRequirement through canonical map', () => {
    const opportunity = {
      attributes: { locationRequirement: 'riyadh-city' },
    }
    assert.equal(normalizeLocation(opportunity, canonical.locationCanonical), 'Riyadh')
  })

  it('detects remote work mode without canonical map entry', () => {
    const opportunity = {
      attributes: { workMode: 'Remote' },
    }
    assert.equal(normalizeLocation(opportunity, {}), 'Remote')
  })

  it('falls back to KSA when no location signals exist', () => {
    assert.equal(normalizeLocation({}, canonical.locationCanonical), 'KSA')
  })
})

describe('normalize — category expansion', () => {
  it('returns first expanded category label', () => {
    assert.equal(
      normalizeCategory('shop drawing review', canonical.categoryExpansion),
      'Structural Engineering',
    )
  })

  it('returns original label when no expansion exists', () => {
    assert.equal(normalizeCategory('project_based', canonical.categoryExpansion), 'project_based')
  })
})

describe('normalize — budget extraction', () => {
  it('extracts budget range and currency from exchangeData', () => {
    const budget = extractBudget({
      exchangeData: {
        budgetRange: { min: 50000, max: 150000, currency: 'sar' },
      },
    })
    assert.deepEqual(budget, { min: 50000, max: 150000, currency: 'SAR' })
  })

  it('falls back to cashAmount when range is absent', () => {
    const budget = extractBudget({
      exchangeData: { cashAmount: 75000 },
    })
    assert.deepEqual(budget, { min: 75000, max: 75000, currency: 'SAR' })
  })
})

describe('normalize — timeline extraction', () => {
  it('extracts start, end, and duration fields', () => {
    const timeline = extractTimeline({
      attributes: {
        startDate: '2026-01-01',
        tenderDeadline: '2026-06-30',
        projectDuration: 180,
      },
    })
    assert.equal(timeline.start, '2026-01-01')
    assert.equal(timeline.end, '2026-06-30')
    assert.equal(timeline.durationDays, 180)
  })

  it('reads availability object when present', () => {
    const timeline = extractTimeline({
      attributes: {
        availability: { start: '2026-02-01', end: '2026-08-01' },
      },
    })
    assert.equal(timeline.start, '2026-02-01')
    assert.equal(timeline.end, '2026-08-01')
  })

  it('converts Offer availabilityEndDate into timeline.end', () => {
    const timeline = extractTimeline({
      intent: 'offer',
      attributes: {
        startDate: '2026-01-01',
        availabilityEndDate: '2026-03-01',
      },
    })
    assert.equal(timeline.start, '2026-01-01')
    assert.equal(timeline.end, '2026-03-01')
  })

  it('ignores empty availabilityEndDate and does not throw on invalid values', () => {
    assert.equal(
      extractTimeline({
        intent: 'offer',
        attributes: { startDate: '2026-01-01', availabilityEndDate: '' },
      }).end,
      undefined,
    )
    assert.equal(
      extractTimeline({
        intent: 'offer',
        attributes: { startDate: '2026-01-01', availabilityEndDate: '   ' },
      }).end,
      undefined,
    )
    assert.doesNotThrow(() => {
      extractTimeline({
        intent: 'offer',
        attributes: { startDate: '2026-01-01', availabilityEndDate: 'not-a-date' },
      })
    })
    assert.equal(
      extractTimeline({
        intent: 'offer',
        attributes: { startDate: '2026-01-01', availabilityEndDate: 'not-a-date' },
      }).end,
      'not-a-date',
    )
  })

  it('falls back to availability.end when availabilityEndDate is absent', () => {
    const timeline = extractTimeline({
      intent: 'offer',
      attributes: {
        startDate: '2026-02-01',
        availability: { end: '2026-08-01' },
      },
    })
    assert.equal(timeline.end, '2026-08-01')
  })

  it('prefers Offer availabilityEndDate over other end-date fields', () => {
    const timeline = extractTimeline({
      intent: 'offer',
      attributes: {
        startDate: '2026-01-01',
        tenderDeadline: '2026-12-31',
        applicationDeadline: '2026-11-30',
        endDate: '2026-10-31',
        availability: { end: '2026-09-30' },
        deliveryTimeline: { end: '2026-08-31' },
        availabilityEndDate: '2026-03-01',
      },
    })
    assert.equal(timeline.end, '2026-03-01')
  })

  it('does not let Need availabilityEndDate override tenderDeadline', () => {
    const timeline = extractTimeline({
      intent: 'request',
      attributes: {
        startDate: '2026-01-01',
        tenderDeadline: '2026-12-31',
        availabilityEndDate: '2026-03-01',
      },
    })
    assert.equal(timeline.end, '2026-12-31')
  })
})

describe('normalize — semantic profile expansion', () => {
  it('expands skills using category expansion map', () => {
    const terms = expandTerm('shop drawing review', canonical.categoryExpansion)
    assert.deepEqual(terms, ['Structural Engineering', 'Design', 'Review'])
  })

  it('builds semantic profile with expanded skills and title keywords', () => {
    const normalized = {
      skills: ['BIM', 'shop drawing review'],
      categories: ['project_based'],
      modelType: 'project_based',
      requiredServices: ['BIM'],
      offeredServices: [],
    }
    const profile = buildSemanticProfile(
      normalized,
      { title: 'Need shop drawing review support', description: 'Design coordination' },
      canonical,
    )
    assert.ok(profile.expandedSkillsOrCategories.includes('Structural Engineering'))
    assert.ok(profile.expandedSkillsOrCategories.includes('Design'))
    assert.deepEqual(profile.categoryTags, ['project_based'])
  })
})

describe('normalize — extractAndNormalize', () => {
  it('returns expected NormalizedPost for need opportunity', () => {
    const opportunity = {
      intent: 'request',
      modelType: 'project_based',
      subModelType: 'design',
      attributes: {
        targetRole: 'Architect',
        coreSkills: ['BIM'],
        locationRequirement: 'remote',
        startDate: '2026-01-01',
        tenderDeadline: '2026-12-31',
      },
      scope: {
        requiredSkills: ['autocad', '3d visualization'],
        sectors: ['Architecture'],
      },
      exchangeData: {
        budgetRange: { min: 100000, max: 200000, currency: 'SAR' },
      },
    }

    const normalized = extractAndNormalize(opportunity, canonical, {
      creator: { profile: { rating: 0.9 } },
    })

    assert.equal(normalized.role, 'Architect')
    assert.deepEqual(normalized.requiredServices, ['AutoCAD', '3D Visualization'])
    assert.deepEqual(normalized.coreSkills, ['BIM'])
    assert.equal(normalized.location, 'Remote')
    assert.equal(normalized.budget?.min, 100000)
    assert.equal(normalized.budget?.max, 200000)
    assert.equal(normalized.budget?.currency, 'SAR')
    assert.equal(normalized.timeline?.start, '2026-01-01')
    assert.equal(normalized.timeline?.end, '2026-12-31')
    assert.equal(normalized.deadline, '2026-12-31')
    assert.equal(normalized.reputation, 0.9)
    assert.equal(normalized.intent, 'request')
    assert.ok(normalized.categories?.includes('project_based'))
  })

  it('leaves role empty under strict role mode when targetRole is missing', () => {
    const normalized = extractAndNormalize({
      intent: 'request',
      scope: { requiredSkills: ['General Consulting', 'Advisory'] },
      attributes: {},
    }, canonical, {
      config: { STRICT_ROLE_REQUIRED: true },
    })
    assert.equal(normalized.role, '')
  })
})
