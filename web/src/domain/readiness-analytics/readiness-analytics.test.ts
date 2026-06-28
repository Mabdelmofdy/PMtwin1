import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  buildReadinessAnalytics,
  createCreatorProfileResolver,
} from '@/domain/readiness-analytics/readiness-analytics.ts'

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

const needsReviewProfile = {
  name: 'Partial User',
  title: 'PM',
  skills: ['Planning'],
  services: ['Management'],
  location: 'Riyadh',
  preferredWorkMode: 'Hybrid',
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

describe('buildReadinessAnalytics', () => {
  const resolveProfileForOpportunity = createCreatorProfileResolver((id) => {
    if (id === 'user-ready') {
      return { profile: readyProfile }
    }
    return undefined
  })

  it('handles empty inputs safely', () => {
    const analytics = buildReadinessAnalytics({
      profiles: [],
      opportunities: [],
      resolveProfileForOpportunity: () => null,
    })

    assert.deepEqual(analytics.profiles, {
      total: 0,
      ready: 0,
      needsReview: 0,
      incomplete: 0,
      averageScore: 0,
    })
    assert.deepEqual(analytics.opportunities, {
      total: 0,
      ready: 0,
      needsReview: 0,
      incomplete: 0,
      draft: 0,
      publishBlocked: 0,
      averageScore: 0,
    })
  })

  it('counts ready, needs_review, and incomplete profiles', () => {
    const analytics = buildReadinessAnalytics({
      profiles: [
        { profile: readyProfile, profileKind: 'individual' },
        { profile: needsReviewProfile, profileKind: 'individual' },
        { profile: {}, profileKind: 'individual' },
      ],
      opportunities: [],
      resolveProfileForOpportunity: () => null,
    })

    assert.equal(analytics.profiles.total, 3)
    assert.equal(analytics.profiles.ready, 1)
    assert.equal(analytics.profiles.needsReview, 1)
    assert.equal(analytics.profiles.incomplete, 1)
  })

  it('calculates average profile score', () => {
    const analytics = buildReadinessAnalytics({
      profiles: [
        { profile: readyProfile, profileKind: 'individual' },
        { profile: needsReviewProfile, profileKind: 'individual' },
      ],
      opportunities: [],
      resolveProfileForOpportunity: () => null,
    })

    assert.equal(analytics.profiles.averageScore, 85)
  })

  it('counts ready, needs_review, and incomplete opportunities', () => {
    const analytics = buildReadinessAnalytics({
      profiles: [],
      opportunities: [
        readyOpportunity,
        needsReviewOpportunity,
        { title: 'Sparse', intent: 'need', status: 'draft' },
      ],
      resolveProfileForOpportunity,
    })

    assert.equal(analytics.opportunities.total, 3)
    assert.equal(analytics.opportunities.ready, 1)
    assert.equal(analytics.opportunities.needsReview, 1)
    assert.equal(analytics.opportunities.incomplete, 1)
  })

  it('calculates average opportunity score', () => {
    const analytics = buildReadinessAnalytics({
      profiles: [],
      opportunities: [readyOpportunity, needsReviewOpportunity],
      resolveProfileForOpportunity,
    })

    assert.equal(analytics.opportunities.averageScore, 87.5)
  })

  it('counts draft opportunities', () => {
    const analytics = buildReadinessAnalytics({
      profiles: [],
      opportunities: [
        readyOpportunity,
        { ...needsReviewOpportunity, status: 'draft' },
      ],
      resolveProfileForOpportunity,
    })

    assert.equal(analytics.opportunities.draft, 2)
  })

  it('counts publish blocked draft opportunities when publish gate fails', () => {
    const analytics = buildReadinessAnalytics({
      profiles: [],
      opportunities: [
        readyOpportunity,
        {
          id: 'opp-blocked',
          creatorId: 'user-ready',
          status: 'draft',
          title: 'Blocked draft',
          intent: 'need',
        },
      ],
      resolveProfileForOpportunity,
    })

    assert.equal(analytics.opportunities.publishBlocked, 1)
  })

  it('treats missing creator profile as publish blocked for draft opportunities', () => {
    const analytics = buildReadinessAnalytics({
      profiles: [],
      opportunities: [
        {
          ...readyOpportunity,
          id: 'opp-missing-creator',
          creatorId: 'missing-user',
        },
      ],
      resolveProfileForOpportunity,
    })

    assert.equal(analytics.opportunities.draft, 1)
    assert.equal(analytics.opportunities.publishBlocked, 1)
  })
})
