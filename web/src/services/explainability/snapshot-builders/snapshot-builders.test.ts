import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { evaluateProfileReadiness } from '@/domain/profile-readiness/profile-readiness-evaluator.ts'
import { evaluateVettingReadiness } from '@/domain/vetting-readiness/vetting-readiness-evaluator.ts'
import { evaluateOpportunityReadinessCanonical } from '@/domain/opportunity-readiness/opportunity-readiness-evaluator.ts'
import {
  buildOpportunityReadinessSnapshot,
  buildProfileReadinessSnapshot,
  buildVettingReadinessSnapshot,
  resolveAgreementSubModelKey,
} from '@/services/explainability/snapshot-builders/index.ts'
import {
  buildOpportunityExplanation,
  buildProfileExplanation,
  buildVettingExplanation,
} from '@/services/explainability/explainability-service.ts'
import { isExplanationBundle } from '@pm-twin/explainability'

describe('profile snapshot builder', () => {
  it('maps evaluator output into ProfileReadinessSnapshot', () => {
    const result = evaluateProfileReadiness({
      profileKind: 'individual',
      profile: { name: 'Khalid' },
    })

    const snapshot = buildProfileReadinessSnapshot('user-001', 'individual', result, {
      name: 'Khalid',
    })

    assert.equal(snapshot.entityId, 'user-001')
    assert.equal(snapshot.profileKind, 'individual')
    assert.equal(snapshot.score, result.score)
    assert.equal(snapshot.status, result.status)
    assert.ok(snapshot.requiredTotal > 0)
    assert.ok(snapshot.recommendedTotal > 0)
    assert.ok(snapshot.missingRequired.includes('Role'))
  })

  it('builds a valid profile ExplanationBundle', () => {
    const result = evaluateProfileReadiness({ profileKind: 'individual', profile: {} })
    const bundle = buildProfileExplanation('user-001', 'individual', result, {})

    assert.equal(isExplanationBundle(bundle), true)
    assert.equal(bundle.engine, 'profile')
    assert.equal(bundle.entityId, 'user-001')
    assert.ok(bundle.recommendations.length > 0)
  })
})

describe('opportunity snapshot builder', () => {
  it('maps canonical readiness into OpportunityReadinessSnapshot', () => {
    const canonical = evaluateOpportunityReadinessCanonical({
      title: 'Architect need',
      intent: 'need',
      scope: { sectors: ['Construction'], requiredSkills: ['BIM'] },
      attributes: { targetRole: 'Architect', startDate: '2026-03-01' },
      normalized: { requiredServices: ['Design'] },
      location: 'Riyadh',
      modelType: 'project_based',
      description: 'Need architect support.',
    })

    const snapshot = buildOpportunityReadinessSnapshot('opp-001', canonical)

    assert.equal(snapshot.entityId, 'opp-001')
    assert.equal(snapshot.score, canonical.score)
    assert.equal(snapshot.publishReady, canonical.publishReady)
    assert.equal(snapshot.fieldContributions.length, canonical.fieldContributions.length)
    assert.equal(snapshot.nextBestActions.length, canonical.nextBestActions.length)
  })

  it('builds a valid opportunity ExplanationBundle with next-best actions', () => {
    const canonical = evaluateOpportunityReadinessCanonical({ title: 'Draft', intent: 'need' })
    const bundle = buildOpportunityExplanation('opp-draft', canonical)

    assert.equal(isExplanationBundle(bundle), true)
    assert.equal(bundle.engine, 'opportunity')
    assert.ok(bundle.recommendations.length > 0 || bundle.blockers.length > 0)
  })
})

describe('vetting snapshot builder', () => {
  it('maps vetting evaluator output into VettingReadinessSnapshot', () => {
    const input = {
      accountStatus: 'pending_vetting',
      reviewProgress: 'not_started' as const,
      documents: [],
    }
    const result = evaluateVettingReadiness(input)
    const snapshot = buildVettingReadinessSnapshot('party-001', result, input)

    assert.equal(snapshot.entityId, 'party-001')
    assert.equal(snapshot.score, result.score)
    assert.equal(snapshot.reviewProgress, 'not_started')
    assert.equal(snapshot.documentsProgress.totalRequired, result.documentsProgress.totalRequired)
    assert.ok(snapshot.missingRequired.length > 0)
  })

  it('builds a valid vetting ExplanationBundle', () => {
    const input = {
      accountStatus: 'pending_vetting',
      reviewProgress: 'not_started' as const,
      documents: [],
    }
    const result = evaluateVettingReadiness(input)
    const bundle = buildVettingExplanation('party-001', result, input)

    assert.equal(isExplanationBundle(bundle), true)
    assert.equal(bundle.engine, 'vetting')
    assert.ok(bundle.recommendations.length > 0)
  })
})

describe('agreement subModelKey resolution', () => {
  it('derives subModelKey from linked need opportunity', () => {
    const subModelKey = resolveAgreementSubModelKey(
      {
        needOpportunityId: 'opp-need',
        offerOpportunityId: null,
        postMatchId: null,
      } as Parameters<typeof resolveAgreementSubModelKey>[0],
      {
        getOpportunity: (id) =>
          id === 'opp-need' ? { subModelType: 'project_based' } : undefined,
      },
    )

    assert.equal(subModelKey, 'project_based')
  })

  it('falls back to post-match linked opportunity', () => {
    const subModelKey = resolveAgreementSubModelKey(
      {
        needOpportunityId: null,
        offerOpportunityId: null,
        postMatchId: 'match-001',
      } as Parameters<typeof resolveAgreementSubModelKey>[0],
      {
        getPostMatch: () => ({ offerOpportunityId: 'opp-offer' }),
        getOpportunity: (id) =>
          id === 'opp-offer' ? { subModelType: 'service_exchange' } : undefined,
      },
    )

    assert.equal(subModelKey, 'service_exchange')
  })
})
