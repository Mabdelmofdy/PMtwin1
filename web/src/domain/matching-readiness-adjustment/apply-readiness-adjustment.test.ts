import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  applyReadinessAdjustmentIfEnabled,
  denormalizeMatchScoreFromPercent,
  isFractionalMatchScore,
  normalizeMatchScoreToPercent,
} from '@/domain/matching-readiness-adjustment/apply-readiness-adjustment.ts'
import { ENABLE_READINESS_MATCH_SCORE_ADJUSTMENT } from '@/domain/matching-readiness-adjustment/matching-readiness-adjustment.ts'
import { matchingService } from '@/services/matching-service.ts'

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
  title: 'Architect need',
  intent: 'need',
  scope: { sectors: ['Construction'], requiredSkills: ['BIM'] },
  attributes: { targetRole: 'Architect', startDate: '2026-03-01' },
  normalized: { requiredServices: ['Design'] },
  location: 'Riyadh',
  modelType: 'project_based',
  description: 'Need architect.',
  exchangeData: { budgetRange: { min: 1, max: 2 } },
  preferredPartnerType: 'company',
  attachments: [{ name: 'brief.pdf' }],
  complianceRequirements: ['Code'],
  deliveryMilestones: [{ title: 'Phase 1' }],
}

const sparseProfile = { name: 'Sparse' }
const sparseOpportunity = { title: 'Sparse', intent: 'need' }

function fullContext(overrides?: {
  sourceProfile?: object
  targetProfile?: object
  sourceOpportunity?: object
  targetOpportunity?: object
}) {
  return {
    sourceProfile: overrides?.sourceProfile ?? readyProfile,
    targetProfile: overrides?.targetProfile ?? readyProfile,
    sourceOpportunity: overrides?.sourceOpportunity ?? readyOpportunity,
    targetOpportunity: overrides?.targetOpportunity ?? readyOpportunity,
  }
}

function rankScores(
  entries: readonly { id: string; score: number }[],
): string[] {
  return [...entries]
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.id)
}

describe('applyReadinessAdjustmentIfEnabled', () => {
  it('keeps score unchanged when feature flag is false', () => {
    assert.equal(ENABLE_READINESS_MATCH_SCORE_ADJUSTMENT, false)

    const result = applyReadinessAdjustmentIfEnabled({
      baseScore: 0.82,
      ...fullContext(),
    })

    assert.deepEqual(result, {
      score: 0.82,
      applied: false,
    })
  })

  it('keeps ranking unchanged when feature flag is false', () => {
    const candidates = [
      { id: 'a', score: 0.8 },
      { id: 'b', score: 0.82 },
      { id: 'c', score: 0.75 },
    ]

    const disabledRanking = rankScores(
      candidates.map((candidate) => ({
        id: candidate.id,
        score: applyReadinessAdjustmentIfEnabled({
          baseScore: candidate.score,
          ...fullContext(),
        }).score,
      })),
    )

    assert.deepEqual(disabledRanking, ['b', 'a', 'c'])
  })

  it('applies positive adjustment when feature flag is true', () => {
    const result = applyReadinessAdjustmentIfEnabled({
      baseScore: 0.8,
      featureEnabled: true,
      ...fullContext(),
    })

    assert.equal(result.applied, true)
    assert.equal(result.adjustment, 5)
    assert.equal(result.score, 0.85)
  })

  it('applies negative adjustment when feature flag is true', () => {
    const result = applyReadinessAdjustmentIfEnabled({
      baseScore: 0.8,
      featureEnabled: true,
      ...fullContext({
        sourceProfile: sparseProfile,
        targetProfile: sparseProfile,
        sourceOpportunity: sparseOpportunity,
        targetOpportunity: sparseOpportunity,
      }),
    })

    assert.equal(result.applied, true)
    assert.equal(result.adjustment, -10)
    assert.equal(result.score, 0.7)
  })

  it('clamps adjusted score at 100 percent (stored as 1.0)', () => {
    const result = applyReadinessAdjustmentIfEnabled({
      baseScore: 0.98,
      featureEnabled: true,
      ...fullContext(),
    })

    assert.equal(result.score, 1)
  })

  it('clamps adjusted score at 0 percent (stored as 0)', () => {
    const result = applyReadinessAdjustmentIfEnabled({
      baseScore: 0.04,
      featureEnabled: true,
      ...fullContext({
        sourceProfile: sparseProfile,
        targetProfile: sparseProfile,
        sourceOpportunity: sparseOpportunity,
        targetOpportunity: sparseOpportunity,
      }),
    })

    assert.equal(result.score, 0)
  })

  it('keeps stored score scale consistent for fractional match scores', () => {
    const baseScore = 0.82
    assert.equal(isFractionalMatchScore(baseScore), true)
    assert.equal(normalizeMatchScoreToPercent(baseScore), 82)
    assert.equal(denormalizeMatchScoreFromPercent(85, true), 0.85)

    const result = applyReadinessAdjustmentIfEnabled({
      baseScore,
      featureEnabled: true,
      ...fullContext(),
    })

    assert.equal(result.score > 0 && result.score <= 1, true)
    assert.equal(result.score, 0.87)
  })

  it('falls back to base score when profile or opportunity context is missing', () => {
    const result = applyReadinessAdjustmentIfEnabled({
      baseScore: 0.77,
      featureEnabled: true,
      sourceProfile: readyProfile,
      targetProfile: readyProfile,
      sourceOpportunity: readyOpportunity,
    })

    assert.deepEqual(result, {
      score: 0.77,
      applied: false,
    })
  })

  it('can change ranking when feature flag is true in tests', () => {
    const enabledRanking = rankScores([
      {
        id: 'high-readiness',
        score: applyReadinessAdjustmentIfEnabled({
          baseScore: 0.8,
          featureEnabled: true,
          ...fullContext(),
        }).score,
      },
      {
        id: 'low-readiness',
        score: applyReadinessAdjustmentIfEnabled({
          baseScore: 0.82,
          featureEnabled: true,
          ...fullContext({
            sourceProfile: sparseProfile,
            targetProfile: sparseProfile,
            sourceOpportunity: sparseOpportunity,
            targetOpportunity: sparseOpportunity,
          }),
        }).score,
      },
    ])

    assert.deepEqual(enabledRanking, ['high-readiness', 'low-readiness'])
  })
})

describe('matchingService.resolveDiscoverMatchScore', () => {
  it('passes through base score when readiness integration is disabled', () => {
    const score = matchingService.resolveDiscoverMatchScore({
      matchScore: 0.92,
      ...fullContext(),
    })

    assert.equal(score, 0.92)
  })
})
