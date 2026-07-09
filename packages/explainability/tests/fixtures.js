import {
  ENGINE_ID,
  EXPLANATION_SEVERITY,
  HEALTH,
  READINESS_REASON_CODES,
  RECOMMENDATION_PRIORITY,
  TIMELINE_EVENT_STATUS,
} from '../dist/index.js'

export function createSampleExplanationBundle() {
  return {
    engine: ENGINE_ID.READINESS,
    entityId: 'opp-001',
    score: 72,
    health: HEALTH.WARNING,
    summary: 'Opportunity readiness is partial — complete required fields to publish.',
    scoreBreakdown: [
      {
        label: 'Core fields',
        weight: 60,
        score: 45,
        maxScore: 60,
        reasonCodes: [READINESS_REASON_CODES.MISSING_BUDGET],
      },
      {
        label: 'Commercial terms',
        weight: 40,
        score: 27,
        maxScore: 40,
        reasonCodes: [READINESS_REASON_CODES.MISSING_TIMELINE],
      },
    ],
    reasons: [
      {
        code: READINESS_REASON_CODES.MISSING_BUDGET,
        message: 'Budget / value terms are missing.',
        severity: EXPLANATION_SEVERITY.WARNING,
        category: 'financial',
      },
    ],
    blockers: [
      {
        reasonCode: READINESS_REASON_CODES.PUBLISH_BLOCKED,
        severity: EXPLANATION_SEVERITY.CRITICAL,
        blockingEntity: 'opp-001',
        resolutionHint: 'Complete all required readiness fields.',
      },
    ],
    strengths: [
      {
        code: READINESS_REASON_CODES.SCORE_SUMMARY,
        label: 'Core scope defined',
        impactPercent: 15,
      },
    ],
    weaknesses: [
      {
        code: READINESS_REASON_CODES.MISSING_TIMELINE,
        label: 'Timeline not specified',
        impactPercent: 10,
      },
    ],
    recommendations: [
      {
        id: 'rec-budget',
        label: 'Add budget / value terms',
        reasonCode: READINESS_REASON_CODES.MISSING_BUDGET,
        priority: RECOMMENDATION_PRIORITY.HIGH,
        impactPercent: 12,
        estimatedScore: 84,
        href: '/opportunities/opp-001/edit#budgetValueTerms',
        category: 'financial',
        severity: EXPLANATION_SEVERITY.WARNING,
        metadata: {
          generatedAt: '2026-07-09T12:00:00.000Z',
          engineVersion: '1.0.0',
        },
      },
    ],
    timeline: [
      {
        type: 'readiness-gap',
        title: 'Budget missing',
        description: 'Budget field has not been completed.',
        timestamp: '2026-07-09T12:00:00.000Z',
        status: TIMELINE_EVENT_STATUS.PENDING,
        relatedEntity: 'opp-001',
      },
    ],
    metadata: {
      generatedAt: '2026-07-09T12:00:00.000Z',
      engineVersion: '1.0.0',
      knowledgeVersion: 1,
      locale: 'en-SA',
      source: 'contract-test',
    },
  }
}
