import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  buildReadinessCardViewModel,
  formatReadinessScore,
  formatReadinessStatusLabel,
  getReadinessStatusTone,
  getReadinessToneTextClass,
} from '@/components/readiness/readiness-display.ts'
import { resolveOpportunityReadiness } from '@/components/readiness/opportunity-readiness-card.tsx'
import { resolveProfileReadiness } from '@/components/readiness/profile-readiness-card.tsx'
import {
  isReadinessFullyReady,
  resolveOpportunityReadinessCta,
  resolveProfileReadinessCta,
  shouldShowOpportunityReadiness,
} from '@/components/readiness/readiness-ui-rules.ts'

const sampleNeedResult = {
  score: 82,
  status: 'needs_review' as const,
  missingRequired: ['Skills', 'Timeline'],
  missingRecommended: ['Portfolio', 'Certifications'],
  presentRequired: ['Title', 'Intent'],
  presentRecommended: ['Budget / Value Terms'],
}

const readyResult = {
  score: 100,
  status: 'ready_for_matching' as const,
  missingRequired: [],
  missingRecommended: [],
  presentRequired: ['Title', 'Intent', 'Category / Profession'],
  presentRecommended: ['Budget / Value Terms'],
}

describe('readiness display helpers', () => {
  it('formats readiness score as a percentage label', () => {
    assert.equal(formatReadinessScore(82.4), '82%')
    assert.equal(formatReadinessScore(100), '100%')
  })

  it('formats readiness status labels for UI copy', () => {
    assert.equal(formatReadinessStatusLabel('incomplete'), 'Incomplete')
    assert.equal(formatReadinessStatusLabel('needs_review'), 'Needs Review')
    assert.equal(formatReadinessStatusLabel('ready_for_matching'), 'Ready for Matching')
  })

  it('maps readiness status to semantic tone text classes', () => {
    assert.equal(getReadinessStatusTone('incomplete'), 'incomplete')
    assert.equal(getReadinessStatusTone('needs_review'), 'needs_review')
    assert.equal(getReadinessStatusTone('ready_for_matching'), 'ready')
    assert.equal(getReadinessToneTextClass('incomplete'), 'text-warning')
    assert.equal(getReadinessToneTextClass('needs_review'), 'text-info')
    assert.equal(getReadinessToneTextClass('ready'), 'text-success')
  })

  it('builds card view model with score and status', () => {
    const viewModel = buildReadinessCardViewModel('Matching Readiness', sampleNeedResult)

    assert.equal(viewModel.title, 'Matching Readiness')
    assert.equal(viewModel.scoreLabel, '82%')
    assert.equal(viewModel.statusLabel, 'Needs Review')
    assert.deepEqual(viewModel.missingRequired, ['Skills', 'Timeline'])
    assert.deepEqual(viewModel.missingRecommended, ['Portfolio', 'Certifications'])
    assert.equal(viewModel.showReadyMessage, false)
  })

  it('shows ready message when status is ready and no gaps remain', () => {
    const viewModel = buildReadinessCardViewModel('Opportunity Readiness', readyResult, {
      opportunityCopy: true,
    })

    assert.equal(viewModel.showReadyMessage, true)
    assert.equal(viewModel.statusLabel, 'Ready to publish')
    assert.equal(isReadinessFullyReady(readyResult), true)
  })

  it('renders ready state with empty missing lists', () => {
    const viewModel = buildReadinessCardViewModel('Profile Readiness', readyResult)

    assert.equal(viewModel.scoreLabel, '100%')
    assert.equal(viewModel.statusLabel, 'Ready for Matching')
    assert.deepEqual(viewModel.missingRequired, [])
    assert.deepEqual(viewModel.missingRecommended, [])
    assert.equal(viewModel.showReadyMessage, true)
  })

  it('renders missing required and recommended field lists', () => {
    const viewModel = buildReadinessCardViewModel('Opportunity Readiness', sampleNeedResult)

    assert.deepEqual(viewModel.missingRequired, ['Skills', 'Timeline'])
    assert.deepEqual(viewModel.missingRecommended, ['Portfolio', 'Certifications'])
    assert.equal(viewModel.showReadyMessage, false)
    assert.equal(isReadinessFullyReady(sampleNeedResult), false)
  })
})

describe('profile readiness card integration', () => {
  it('uses evaluateProfileReadiness via resolveProfileReadiness', () => {
    const result = resolveProfileReadiness(
      {
        name: 'Khalid Al-Harbi',
        title: 'Senior Architect',
        skills: ['BIM'],
        services: ['Design'],
        location: 'Riyadh',
        preferredWorkMode: 'On-Site',
      },
      'individual',
    )

    assert.equal(result.missingRequired.length, 0)
    assert.ok(result.score >= 70)
    assert.equal(result.status, 'needs_review')
  })

  it('marks empty profile as incomplete', () => {
    const result = resolveProfileReadiness({}, 'individual')
    assert.equal(result.status, 'incomplete')
    assert.ok(result.missingRequired.length > 0)
  })

  it('maps evaluator result to profile readiness CTA when incomplete', () => {
    const result = resolveProfileReadiness({}, 'individual')
    const cta = resolveProfileReadinessCta(result)

    assert.ok(cta)
    assert.equal(cta.label, 'Complete profile')
    assert.equal(cta.href, '/profile#profile-details')
  })

  it('hides profile CTA when ready for matching', () => {
    const cta = resolveProfileReadinessCta(readyResult)
    assert.equal(cta, null)
  })
})

describe('opportunity readiness card integration', () => {
  it('uses evaluateOpportunityReadiness via resolveOpportunityReadiness', () => {
    const result = resolveOpportunityReadiness({
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
      description: 'Need architect support.',
    })

    assert.equal(result.missingRequired.length, 0)
    assert.equal(result.status, 'ready_for_matching')
    assert.equal(result.score, 80)
  })

  it('blocks ready status when role is missing', () => {
    const result = resolveOpportunityReadiness({
      title: 'Incomplete need',
      intent: 'need',
      scope: {
        sectors: ['Construction'],
        requiredSkills: ['BIM'],
      },
      normalized: {
        requiredServices: ['Design'],
      },
      location: 'Riyadh',
      modelType: 'project_based',
      description: 'Missing role.',
      attributes: {
        startDate: '2026-03-01',
      },
    })

    assert.ok(result.missingRequired.includes('Role Needed or Role Offered'))
    assert.notEqual(result.status, 'ready_for_matching')
  })

  it('shows opportunity readiness CTA for owner with gaps', () => {
    const result = resolveOpportunityReadiness({
      title: 'Incomplete need',
      intent: 'need',
    })
    const cta = resolveOpportunityReadinessCta('seed-opp-001', result)

    assert.ok(cta)
    assert.equal(cta.label, 'Edit opportunity')
    assert.equal(cta.href, '/opportunities/seed-opp-001/edit')
  })

  it('hides opportunity readiness CTA when fully ready', () => {
    const cta = resolveOpportunityReadinessCta('seed-opp-001', readyResult)
    assert.equal(cta, null)
  })

  it('suppresses opportunity readiness CTA on create/edit form', () => {
    const cta = resolveOpportunityReadinessCta('seed-opp-001', sampleNeedResult, {
      suppressCta: true,
    })
    assert.equal(cta, null)
  })
})

describe('opportunity readiness visibility', () => {
  it('owner sees opportunity readiness section', () => {
    assert.equal(shouldShowOpportunityReadiness(true), true)
  })

  it('non-owner does not see opportunity readiness section', () => {
    assert.equal(shouldShowOpportunityReadiness(false), false)
  })
})
