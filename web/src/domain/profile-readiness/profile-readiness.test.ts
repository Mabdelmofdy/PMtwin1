import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { evaluateProfileReadiness } from '@/domain/profile-readiness/profile-readiness-evaluator.ts'
import {
  PROFILE_READINESS_SCORE_WEIGHTS,
  PROFILE_READINESS_STATUS_THRESHOLDS,
} from '@/domain/profile-readiness/profile-readiness-rules.ts'

const readyIndividualProfile = {
  name: 'Khalid Al-Harbi',
  title: 'Senior Architect',
  skills: ['BIM', 'Sustainable Design'],
  services: ['Architectural Design'],
  location: 'Riyadh, Saudi Arabia',
  preferredWorkMode: 'On-Site',
  caseStudies: [{ title: 'Riyadh Mixed-Use Tower' }],
  yearsExperience: 9,
  certifications: ['LEED AP BD+C'],
  previousProjects: [{ title: 'NEOM Pavilion' }],
}

const readyCompanyProfile = {
  name: 'Al-Riyadh Construction',
  sectors: ['Construction', 'Infrastructure'],
  services: ['General Contracting', 'Design-Build'],
  interests: ['Commercial', 'Residential'],
  location: 'Riyadh, Saudi Arabia',
  companyRole: 'Contractor',
  phone: '+966 11 201 1001',
  caseStudies: [{ title: 'Riyadh Business Park' }],
  employeeCount: '500-1000',
  coverageAreas: ['Riyadh', 'Eastern Province'],
  certifications: ['ISO 9001'],
  financialCapacity: 75_000_000,
}

describe('evaluateProfileReadiness — individual profiles', () => {
  it('marks an empty individual profile as incomplete', () => {
    const result = evaluateProfileReadiness({
      profileKind: 'individual',
      profile: {},
    })

    assert.equal(result.status, 'incomplete')
    assert.ok(result.score < PROFILE_READINESS_STATUS_THRESHOLDS.incompleteMax)
    assert.equal(result.missingRequired.length, 6)
    assert.equal(result.missingRecommended.length, 4)
  })

  it('marks a fully complete individual profile as ready_for_matching', () => {
    const result = evaluateProfileReadiness({
      profileKind: 'individual',
      profile: readyIndividualProfile,
    })

    assert.equal(result.status, 'ready_for_matching')
    assert.equal(result.score, 100)
    assert.deepEqual(result.missingRequired, [])
    assert.deepEqual(result.missingRecommended, [])
  })

  it('marks an individual with only recommended gaps as needs_review', () => {
    const result = evaluateProfileReadiness({
      profileKind: 'individual',
      profile: {
        name: 'Sara Al-Mutairi',
        headline: 'BIM Consultant',
        skills: ['BIM'],
        services: ['Consulting'],
        location: 'Jeddah',
        availability: { start: '2026-07-01', end: '2026-12-31' },
      },
    })

    assert.equal(result.status, 'needs_review')
    assert.equal(result.missingRequired.length, 0)
    assert.ok(result.missingRecommended.length > 0)
    assert.equal(result.score, PROFILE_READINESS_SCORE_WEIGHTS.required)
    assert.ok(result.score >= PROFILE_READINESS_STATUS_THRESHOLDS.incompleteMax)
    assert.ok(result.score < PROFILE_READINESS_STATUS_THRESHOLDS.readyMin)
  })
})

describe('evaluateProfileReadiness — company profiles', () => {
  it('marks an empty company profile as incomplete', () => {
    const result = evaluateProfileReadiness({
      profileKind: 'company',
      profile: {},
    })

    assert.equal(result.status, 'incomplete')
    assert.ok(result.score < PROFILE_READINESS_STATUS_THRESHOLDS.incompleteMax)
    assert.equal(result.missingRequired.length, 6)
    assert.equal(result.missingRecommended.length, 5)
  })

  it('marks a fully complete company profile as ready_for_matching', () => {
    const result = evaluateProfileReadiness({
      profileKind: 'company',
      profile: readyCompanyProfile,
    })

    assert.equal(result.status, 'ready_for_matching')
    assert.equal(result.score, 100)
    assert.deepEqual(result.missingRequired, [])
    assert.deepEqual(result.missingRecommended, [])
  })

  it('marks a company with only recommended gaps as needs_review', () => {
    const result = evaluateProfileReadiness({
      profileKind: 'company',
      profile: {
        name: 'Gulf Engineering',
        businessCategory: 'Engineering',
        services: ['MEP Design'],
        projectCategories: ['Healthcare'],
        location: 'Dammam',
        contactPerson: 'Ahmed Al-Qahtani',
      },
    })

    assert.equal(result.status, 'needs_review')
    assert.equal(result.missingRequired.length, 0)
    assert.equal(result.missingRecommended.length, 5)
    assert.equal(result.score, PROFILE_READINESS_SCORE_WEIGHTS.required)
  })
})

describe('evaluateProfileReadiness — missing required fields', () => {
  it('never returns ready_for_matching when any required field is missing', () => {
    const result = evaluateProfileReadiness({
      profileKind: 'individual',
      profile: {
        ...readyIndividualProfile,
        services: [],
      },
    })

    assert.ok(result.missingRequired.includes('Services'))
    assert.notEqual(result.status, 'ready_for_matching')
    assert.equal(result.status, 'needs_review')
  })

  it('treats heavily missing required fields as incomplete even above the score floor', () => {
    const result = evaluateProfileReadiness({
      profileKind: 'individual',
      profile: {
        name: 'Partial User',
        caseStudies: [{ title: 'Only portfolio present' }],
        certifications: ['PMP'],
        previousProjects: [{ title: 'Bridge' }],
        yearsExperience: 4,
      },
    })

    assert.ok(result.missingRequired.length > 3)
    assert.equal(result.status, 'incomplete')
  })
})

describe('evaluateProfileReadiness — score boundaries', () => {
  it('scores required-only completion at 70', () => {
    const result = evaluateProfileReadiness({
      profileKind: 'individual',
      profile: {
        name: 'Boundary User',
        role: 'PM',
        skills: ['Planning'],
        services: ['Project Management'],
        location: 'Riyadh',
        preferredWorkMode: 'Hybrid',
      },
    })

    assert.equal(result.score, 70)
    assert.equal(result.status, 'needs_review')
  })

  it('keeps profiles below 60 in incomplete status', () => {
    const result = evaluateProfileReadiness({
      profileKind: 'individual',
      profile: {
        name: 'Low Score User',
        skills: ['One'],
      },
    })

    assert.ok(result.score < PROFILE_READINESS_STATUS_THRESHOLDS.incompleteMax)
    assert.equal(result.status, 'incomplete')
  })

  it('accepts structured portfolio entries as previous project evidence', () => {
    const almostReady = evaluateProfileReadiness({
      profileKind: 'individual',
      profile: {
        name: 'Almost Ready',
        title: 'Engineer',
        skills: ['Civil'],
        services: ['Supervision'],
        location: 'Khobar',
        availability: 'Immediate',
        portfolio: [{ title: 'Port' }],
        yearsExperience: 6,
        certifications: ['SCE'],
      },
    })

    assert.equal(almostReady.score, 100)
    assert.equal(almostReady.missingRequired.length, 0)
    assert.equal(almostReady.missingRecommended.length, 0)
    assert.equal(almostReady.status, 'ready_for_matching')
  })

  it('returns ready_for_matching only when required, recommended, and score gates pass', () => {
    const result = evaluateProfileReadiness({
      profileKind: 'company',
      profile: readyCompanyProfile,
    })

    assert.ok(result.score >= PROFILE_READINESS_STATUS_THRESHOLDS.readyMin)
    assert.equal(result.missingRequired.length, 0)
    assert.equal(result.missingRecommended.length, 0)
    assert.equal(result.status, 'ready_for_matching')
  })
})

describe('evaluateProfileReadiness — legacy field aliases', () => {
  it('accepts legacy POC field names for individual profiles', () => {
    const result = evaluateProfileReadiness({
      profileKind: 'individual',
      profile: {
        fullName: 'Legacy User',
        headline: 'Consultant',
        specializations: ['Architecture'],
        offeredServices: ['Design Review'],
        locationCity: 'Riyadh',
        availabilityDate: '2026-08-01',
        portfolio: [{ title: 'Legacy Portfolio Item' }],
        experienceEntries: [{ company: 'ACME', years: 3 }],
        certifications: ['ISO'],
        projects: [{ title: 'Legacy Project' }],
      },
    })

    assert.equal(result.status, 'ready_for_matching')
    assert.equal(result.score, 100)
  })

  it('accepts legacy POC field names for company profiles', () => {
    const result = evaluateProfileReadiness({
      profileKind: 'company',
      profile: {
        companyName: 'Legacy Co',
        primaryDomain: 'Construction',
        services: ['Fit-Out'],
        sectors: ['Retail'],
        address: 'Jeddah',
        contactName: 'Faisal',
        caseStudies: [{ title: 'Mall' }],
        teamSize: 120,
        serviceAreas: ['Western Region'],
        certifications: ['ISO 45001'],
        financialCapacity: 10_000_000,
      },
    })

    assert.equal(result.status, 'ready_for_matching')
    assert.equal(result.score, 100)
  })
})
