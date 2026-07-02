import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  buildMatchingQualityAnalytics,
  isAcceptedMatchStatus,
  isMatchIncludedInTotal,
  resolveStoredMatchScore,
} from '@/domain/matching-quality/matching-quality-analytics.ts'

const readyProfile = {
  name: 'Khalid Al-Harbi',
  title: 'Senior Architect',
  skills: ['BIM'],
  services: ['Design'],
  location: 'Riyadh',
  preferredWorkMode: 'On-Site',
  caseStudies: [{ title: 'Tower' }],
  yearsExperience: 9,
  certifications: ['LEED'],
  previousProjects: [{ title: 'NEOM' }],
}

const partialProfile = {
  name: 'Partial User',
  title: 'PM',
  skills: ['Planning'],
  services: ['Management'],
  location: 'Riyadh',
  preferredWorkMode: 'Hybrid',
}

const readyOpportunity = {
  id: 'opp-ready',
  creatorId: 'user-ready',
  status: 'draft',
  title: 'Architect need',
  intent: 'need',
  scope: {
    sectors: ['Construction'],
    requiredSkills: ['BIM'],
  },
  attributes: {
    targetRole: 'Architect',
    startDate: '2026-03-01',
  },
  normalized: {
    requiredServices: ['Design'],
  },
  location: 'Riyadh',
  modelType: 'project_based',
  description: 'Need architect.',
  exchangeData: { budgetRange: { min: 1, max: 2 } },
  preferredPartnerType: 'company',
  attachments: [{ name: 'brief.pdf' }],
  complianceRequirements: ['Code'],
  deliveryMilestones: [{ title: 'Phase 1' }],
}

const needsReviewOpportunity = {
  id: 'opp-review',
  creatorId: 'user-ready',
  status: 'published',
  title: 'Required-only need',
  intent: 'need',
  scope: { sectors: ['Infrastructure'], requiredSkills: ['Planning'] },
  attributes: { targetRole: 'PM', startDate: '2026-04-01' },
  normalized: { requiredServices: ['Program Management'] },
  location: 'Dammam',
  modelType: 'project_based',
  description: 'Need PM.',
}

describe('buildMatchingQualityAnalytics', () => {
  it('handles empty dataset safely', () => {
    const analytics = buildMatchingQualityAnalytics({
      profiles: [],
      opportunities: [],
      matches: [],
      negotiations: [],
      deals: [],
    })

    assert.deepEqual(analytics, {
      averageProfileReadiness: 0,
      averageOpportunityReadiness: 0,
      averageMatchScore: 0,
      totalMatches: 0,
      acceptedMatches: 0,
      acceptanceRate: 0,
      negotiationsStarted: 0,
      negotiationRate: 0,
      dealsCreated: 0,
      dealConversionRate: 0,
      byMatchType: {
        one_way: { total: 0, accepted: 0, confirmed: 0 },
        two_way: { total: 0, accepted: 0, confirmed: 0 },
        consortium: { total: 0, accepted: 0, confirmed: 0 },
        circular: { total: 0, accepted: 0, confirmed: 0 },
      },
    })
  })

  it('calculates average profile and opportunity readiness', () => {
    const analytics = buildMatchingQualityAnalytics({
      profiles: [
        { profile: readyProfile, profileKind: 'individual' },
        { profile: partialProfile, profileKind: 'individual' },
      ],
      opportunities: [readyOpportunity, needsReviewOpportunity],
      matches: [],
      negotiations: [],
      deals: [],
    })

    assert.equal(analytics.averageProfileReadiness, 85)
    assert.equal(analytics.averageOpportunityReadiness, 87.5)
  })

  it('calculates average match score from stored matchScore', () => {
    const analytics = buildMatchingQualityAnalytics({
      profiles: [],
      opportunities: [],
      matches: [
        { status: 'discovered', matchScore: 0.9 },
        { status: 'accepted', matchScore: 0.8 },
      ],
      negotiations: [],
      deals: [],
    })

    assert.equal(analytics.averageMatchScore, 85)
  })

  it('calculates acceptance rate from accepted and confirmed matches', () => {
    const analytics = buildMatchingQualityAnalytics({
      profiles: [],
      opportunities: [],
      matches: [
        { status: 'discovered', matchScore: 0.7 },
        { status: 'accepted', matchScore: 0.8 },
        { status: 'confirmed', matchScore: 0.9 },
        { status: 'declined', matchScore: 0.6 },
      ],
      negotiations: [],
      deals: [],
    })

    assert.equal(analytics.totalMatches, 3)
    assert.equal(analytics.acceptedMatches, 2)
    assert.equal(analytics.acceptanceRate, 66.67)
  })

  it('calculates negotiation rate from linked negotiations', () => {
    const analytics = buildMatchingQualityAnalytics({
      profiles: [],
      opportunities: [],
      matches: [
        { id: 'pm-1', status: 'accepted', matchScore: 0.9 },
        { id: 'pm-2', status: 'confirmed', matchScore: 0.85 },
      ],
      negotiations: [
        { id: 'neg-1', postMatchId: 'pm-1', status: 'active' },
        { id: 'neg-2', matchId: 'pm-2', status: 'agreed' },
        { id: 'neg-3', status: 'active' },
      ],
      deals: [],
    })

    assert.equal(analytics.negotiationsStarted, 2)
    assert.equal(analytics.negotiationRate, 100)
  })

  it('calculates deal conversion rate from deals linked to negotiations', () => {
    const analytics = buildMatchingQualityAnalytics({
      profiles: [],
      opportunities: [],
      matches: [{ id: 'pm-1', status: 'confirmed', matchScore: 0.9 }],
      negotiations: [
        { id: 'neg-1', postMatchId: 'pm-1', status: 'agreed' },
        { id: 'neg-2', postMatchId: 'pm-1', status: 'cancelled' },
      ],
      deals: [
        { id: 'deal-1', negotiationId: 'neg-1' },
        { id: 'deal-2', negotiationId: 'neg-2' },
        { id: 'deal-3' },
      ],
    })

    assert.equal(analytics.dealsCreated, 2)
    assert.equal(analytics.dealConversionRate, 100)
  })

  it('excludes negative terminal matches from total matches', () => {
    assert.equal(isMatchIncludedInTotal('discovered'), true)
    assert.equal(isMatchIncludedInTotal('accepted'), true)
    assert.equal(isMatchIncludedInTotal('confirmed'), true)
    assert.equal(isMatchIncludedInTotal('declined'), false)
    assert.equal(isMatchIncludedInTotal('expired'), false)
    assert.equal(isMatchIncludedInTotal('superseded'), false)

    const analytics = buildMatchingQualityAnalytics({
      profiles: [],
      opportunities: [],
      matches: [
        { status: 'declined', matchScore: 0.5 },
        { status: 'expired', matchScore: 0.5 },
        { status: 'superseded', matchScore: 0.5 },
      ],
      negotiations: [],
      deals: [],
    })

    assert.equal(analytics.totalMatches, 0)
    assert.equal(analytics.acceptedMatches, 0)
  })

  it('handles lifecycle aliases for match status', () => {
    assert.equal(isMatchIncludedInTotal('pending'), true)
    assert.equal(isAcceptedMatchStatus('pending'), false)

    const analytics = buildMatchingQualityAnalytics({
      profiles: [],
      opportunities: [],
      matches: [
        { status: 'pending', matchScore: 0.75 },
        { status: 'accepted', matchScore: 0.85 },
      ],
      negotiations: [],
      deals: [],
    })

    assert.equal(analytics.totalMatches, 2)
    assert.equal(analytics.acceptedMatches, 1)
    assert.equal(analytics.acceptanceRate, 50)
  })
})

describe('resolveStoredMatchScore', () => {
  it('prefers matchScore and normalizes 0-1 values', () => {
    assert.equal(resolveStoredMatchScore({ matchScore: 0.92 }), 92)
    assert.equal(resolveStoredMatchScore({ score: 80, matchScore: 0.9 }), 90)
    assert.equal(resolveStoredMatchScore({ compatibilityScore: 70, score: 80 }), 80)
  })
})
