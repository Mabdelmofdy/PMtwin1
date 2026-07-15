import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  PROFILE_SCHEMA_VERSION,
  assertValidProfile,
  normalizeLegacyProfile,
  toMatchingProfileSnapshot,
  toPublicProfile,
  validateProfile,
} from '../dist/index.js'

const individualBag = {
  profileId: 'profile-1',
  ownerPartyId: 'party-1',
  type: 'individual',
  name: 'Saleh Ahmed',
  language: 'ar',
  title: { ar: 'مدير مشاريع', en: 'Project Manager' },
  bio: 'Delivery specialist',
  address: { country: 'sa', region: 'Riyadh', city: 'Riyadh' },
  email: 'saleh@example.com',
  phoneNumber: '+966500000000',
  website: 'https://example.com',
  privacy: { showEmail: true, showPhone: false, showWebsite: true, showSocialLinks: true },
  socialMedia: {
    facebook: 'https://facebook.com/saleh',
    x: 'https://x.com/saleh',
  },
  experienceYears: '12',
  spokenLanguages: ['ar', 'en'],
  offerings: [
    {
      id: 'svc-1',
      categoryId: 'project-management',
      title: { en: 'PMO setup' },
      skills: ['planning', 'governance'],
      level: 'expert',
    },
  ],
  workExperience: [
    {
      id: 'exp-1',
      role: 'Program Manager',
      company: 'Private client',
      industry: 'construction',
      startDate: '2020-01-01',
      current: true,
      skills: ['planning'],
    },
  ],
  projects: [
    {
      id: 'work-1',
      name: 'Transformation',
      industry: 'government',
      date: '2024-05-01',
      link: 'https://example.com/work',
      tags: ['governance'],
    },
  ],
  certifications: [
    {
      id: 'cred-1',
      certificate: 'PMP',
      authority: 'PMI',
      type: 'project-management',
      issueDate: '2023-01-01',
      expiryDate: '2026-01-01',
    },
  ],
  capacity: {
    availabilityStatus: 'limited',
    weeklyHours: 20,
    workModes: ['remote', 'hybrid'],
    locations: [{ countryCode: 'SA', city: 'Riyadh' }],
  },
  preferences: {
    matchingEnabled: true,
    categories: ['advisory'],
    skills: ['risk'],
    industries: ['energy'],
    workModes: ['remote'],
    minBudget: 5000,
    maxBudget: 50000,
  },
}

describe('@pm-twin/profile', () => {
  it('normalizes an individual legacy profile into the canonical schema', () => {
    const result = normalizeLegacyProfile(individualBag)
    assert.equal(result.issues.length, 0)
    assert.equal(result.profile.schemaVersion, PROFILE_SCHEMA_VERSION)
    assert.equal(result.profile.kind, 'individual')
    assert.equal(result.profile.locale, 'ar-SA')
    assert.equal(result.profile.location.countryCode, 'SA')
    assert.equal(result.profile.individual.yearsOfExperience, 12)
    assert.equal(result.profile.services[0].proficiency, 'expert')
    assert.deepEqual(result.profile.availability.engagementModes, ['remote', 'hybrid'])
  })

  it('normalizes nested company bags and preserves structured company data', () => {
    const result = normalizeLegacyProfile({
      id: 'company-profile',
      companyId: 'company-party',
      profile: {
        accountType: 'business',
        displayName: 'Acme',
        company: {
          legalName: 'Acme LLC',
          crNumber: '1010999999',
          yearFounded: 2018,
          companySize: '11-50',
          industries: ['technology', 'consulting'],
        },
        contactInfo: { emailAddress: 'hello@acme.sa' },
        contactVisibility: { email: true },
      },
    })
    assert.equal(result.issues.length, 0)
    assert.equal(result.profile.kind, 'company')
    assert.equal(result.profile.company.legalName, 'Acme LLC')
    assert.equal(result.profile.company.commercialRegistrationNumber, '1010999999')
    assert.deepEqual(result.profile.company.sectors, ['technology', 'consulting'])
  })

  it('applies safe deterministic defaults to unknown bags', () => {
    const first = normalizeLegacyProfile(null)
    const second = normalizeLegacyProfile({ unexpected: { nested: true } })
    assert.equal(first.profile.kind, 'individual')
    assert.equal(first.profile.id, 'legacy-profile')
    assert.equal(first.issues.length, 0)
    assert.deepEqual(first.profile, second.profile)
  })

  it('validates formats, ranges, duplicate ids, dates, and budget consistency', () => {
    const { profile } = normalizeLegacyProfile(individualBag)
    const invalid = structuredClone(profile)
    invalid.contact.email = 'not-an-email'
    invalid.availability.hoursPerWeek = 200
    invalid.services.push({ ...invalid.services[0] })
    invalid.experience[0].endedOn = '2019-01-01'
    invalid.experience[0].isCurrent = false
    invalid.matchingPreferences.minimumBudgetSar = 90000
    const result = validateProfile(invalid)
    assert.equal(result.valid, false)
    assert.ok(result.issues.some((entry) => entry.path === 'contact.email'))
    assert.ok(result.issues.some((entry) => entry.path === 'availability.hoursPerWeek'))
    assert.ok(result.issues.some((entry) => entry.path === 'services[1].id' && entry.code === 'duplicate'))
    assert.ok(result.issues.some((entry) => entry.path === 'experience[0].endedOn'))
    assert.ok(result.issues.some((entry) => entry.path === 'matchingPreferences.maximumBudgetSar'))
    assert.throws(() => assertValidProfile(invalid), TypeError)
  })

  it('returns the same canonical object from assertValidProfile', () => {
    const { profile } = normalizeLegacyProfile(individualBag)
    assert.equal(assertValidProfile(profile), profile)
  })

  it('projects only allowlisted public fields and honors every contact opt-in', () => {
    const { profile } = normalizeLegacyProfile(individualBag)
    const publicProfile = toPublicProfile(profile)
    assert.deepEqual(publicProfile.contact, {
      email: 'saleh@example.com',
      website: 'https://example.com',
    })
    assert.equal('contactVisibility' in publicProfile, false)
    assert.equal('matchingPreferences' in publicProfile, false)
    assert.equal('phone' in publicProfile.contact, false)
    assert.deepEqual(publicProfile.socialLinks, {
      facebook: 'https://facebook.com/saleh',
      x: 'https://x.com/saleh',
    })
  })

  it('never exposes a company commercial registration number publicly', () => {
    const { profile } = normalizeLegacyProfile({
      type: 'company',
      companyName: 'Acme',
      crNumber: '1010999999',
      email: 'private@acme.sa',
      visibility: { email: false },
    })
    const publicProfile = toPublicProfile(profile)
    assert.equal(publicProfile.kind, 'company')
    assert.equal('commercialRegistrationNumber' in publicProfile.company, false)
    assert.deepEqual(publicProfile.contact, {})
  })

  it('creates a deterministic non-PII matching snapshot', () => {
    const { profile } = normalizeLegacyProfile(individualBag)
    const first = toMatchingProfileSnapshot(profile)
    const second = toMatchingProfileSnapshot(profile)
    assert.deepEqual(first, second)
    assert.deepEqual(first.serviceCategories, ['advisory', 'project-management'])
    assert.deepEqual(first.skillTags, ['governance', 'planning', 'risk'])
    assert.deepEqual(first.sectors, ['construction', 'energy', 'government'])
    assert.equal(first.yearsOfExperience, 12)
    assert.equal('profileId' in first, false)
    assert.equal('partyId' in first, false)
    const serialized = JSON.stringify(first)
    for (const privateValue of [
      'Saleh Ahmed',
      'saleh@example.com',
      '+966500000000',
      'Delivery specialist',
      'Private client',
    ]) {
      assert.equal(serialized.includes(privateValue), false)
    }
  })

  it('does not mutate source profiles while producing projections', () => {
    const { profile } = normalizeLegacyProfile(individualBag)
    const before = structuredClone(profile)
    toPublicProfile(profile)
    toMatchingProfileSnapshot(profile)
    assert.deepEqual(profile, before)
  })
})
