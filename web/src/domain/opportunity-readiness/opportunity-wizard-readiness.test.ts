import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'
import {
  EMPTY_OPPORTUNITY_WIZARD_DRAFT,
  evaluateOpportunityWizardReadiness,
  isOpportunityWizardPublishReady,
  OPPORTUNITY_WIZARD_READINESS_STAGE_WEIGHTS,
  type OpportunityWizardDraft,
} from '@/domain/opportunity-readiness/opportunity-wizard-readiness.ts'
import { OPPORTUNITY_READINESS_STATUS_THRESHOLDS } from '@/domain/opportunity-readiness/opportunity-readiness-rules.ts'
import type { Opportunity } from '@/types/domain.ts'

const sourcePath = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../pages/workspace/opportunities-pages.tsx',
)
const wizardSource = readFileSync(sourcePath, 'utf8')

const taskBasedRequiredAttrs: Record<string, unknown> = {
  detailedScope: 'Design coordination for tower core and shell',
  requiredSkills: ['BIM', 'Coordination'],
  duration: '6 months',
  startDate: '2026-04-01',
}

const cashExchangeAttrs: Record<string, unknown> = {
  budget: { min: 100_000, max: 250_000, currency: 'SAR' },
  paymentSchedule: 'Milestone',
}

function withStages(
  overrides: Partial<OpportunityWizardDraft> = {},
): OpportunityWizardDraft {
  return {
    ...EMPTY_OPPORTUNITY_WIZARD_DRAFT,
    intent: 'need',
    ...overrides,
  }
}

const publishReadyDraft: OpportunityWizardDraft = withStages({
  title: 'Tower coordination need',
  description: 'Need BIM coordination lead for mixed-use tower.',
  sector: 'Construction',
  targetRole: 'BIM Manager',
  mainCollaborationModel: 'cash_subcontracting',
  modelType: 'project_based',
  subModelType: 'task_based',
  exchangeMode: 'cash',
  paymentModes: ['cash'],
  location: 'Riyadh',
  startDate: '2026-04-01',
  skills: 'BIM, Coordination',
  services: 'BIM Coordination',
  collaborationAttributes: {
    ...taskBasedRequiredAttrs,
    ...cashExchangeAttrs,
  },
})

describe('opportunity wizard readiness — initial draft', () => {
  it('new opportunity draft starts with readinessScore 0', () => {
    const result = evaluateOpportunityWizardReadiness(EMPTY_OPPORTUNITY_WIZARD_DRAFT)

    assert.equal(result.readinessScore, 0)
    assert.equal(result.completionScore, 0)
    assert.equal(result.score, 0)
    assert.equal(result.status, 'incomplete')
    assert.equal(result.publishReady, false)
    assert.equal(result.completedStageIds.length, 0)
  })

  it('does not initialize readiness to a high demo value from intent alone', () => {
    const result = evaluateOpportunityWizardReadiness(
      withStages({ intent: 'need' }),
    )
    assert.equal(result.readinessScore, 0)
  })
})

describe('opportunity wizard readiness — progressive stages', () => {
  it('increases score after basic info', () => {
    const result = evaluateOpportunityWizardReadiness(
      withStages({
        title: 'Need title',
        description: 'Need description with enough detail.',
        sector: 'Construction',
        targetRole: 'Architect',
      }),
    )

    assert.equal(result.readinessScore, OPPORTUNITY_WIZARD_READINESS_STAGE_WEIGHTS.basicInfo)
    assert.ok(result.completedStageIds.includes('basicInfo'))
  })

  it('increases score after main collaboration model selection', () => {
    const before = evaluateOpportunityWizardReadiness(
      withStages({
        title: 'Need title',
        description: 'Need description with enough detail.',
        sector: 'Construction',
        targetRole: 'Architect',
      }),
    )
    const after = evaluateOpportunityWizardReadiness(
      withStages({
        title: 'Need title',
        description: 'Need description with enough detail.',
        sector: 'Construction',
        targetRole: 'Architect',
        mainCollaborationModel: 'cash_subcontracting',
        modelType: 'project_based',
      }),
    )

    assert.ok(after.readinessScore > before.readinessScore)
    assert.ok(after.completedStageIds.includes('mainCollaborationModel'))
  })

  it('increases score after sub-model selection', () => {
    const before = evaluateOpportunityWizardReadiness(
      withStages({
        title: 'Need title',
        description: 'Need description with enough detail.',
        sector: 'Construction',
        targetRole: 'Architect',
        mainCollaborationModel: 'cash_subcontracting',
        modelType: 'project_based',
      }),
    )
    const after = evaluateOpportunityWizardReadiness(
      withStages({
        title: 'Need title',
        description: 'Need description with enough detail.',
        sector: 'Construction',
        targetRole: 'Architect',
        mainCollaborationModel: 'cash_subcontracting',
        modelType: 'project_based',
        subModelType: 'task_based',
      }),
    )

    assert.ok(after.readinessScore > before.readinessScore)
    assert.ok(after.completedStageIds.includes('subModel'))
  })

  it('increases score after required sub-model fields', () => {
    const before = evaluateOpportunityWizardReadiness(
      withStages({
        title: 'Need title',
        description: 'Need description with enough detail.',
        sector: 'Construction',
        targetRole: 'Architect',
        mainCollaborationModel: 'cash_subcontracting',
        modelType: 'project_based',
        subModelType: 'task_based',
      }),
    )
    const after = evaluateOpportunityWizardReadiness(
      withStages({
        title: 'Need title',
        description: 'Need description with enough detail.',
        sector: 'Construction',
        targetRole: 'Architect',
        mainCollaborationModel: 'cash_subcontracting',
        modelType: 'project_based',
        subModelType: 'task_based',
        collaborationAttributes: taskBasedRequiredAttrs,
      }),
    )

    assert.ok(after.readinessScore > before.readinessScore)
    assert.ok(after.completedStageIds.includes('subModelFields'))
  })

  it('increases score after value exchange fields', () => {
    const before = evaluateOpportunityWizardReadiness(
      withStages({
        title: 'Need title',
        description: 'Need description with enough detail.',
        sector: 'Construction',
        targetRole: 'Architect',
        mainCollaborationModel: 'cash_subcontracting',
        modelType: 'project_based',
        subModelType: 'task_based',
        collaborationAttributes: taskBasedRequiredAttrs,
      }),
    )
    const after = evaluateOpportunityWizardReadiness(
      withStages({
        title: 'Need title',
        description: 'Need description with enough detail.',
        sector: 'Construction',
        targetRole: 'Architect',
        mainCollaborationModel: 'cash_subcontracting',
        modelType: 'project_based',
        subModelType: 'task_based',
        exchangeMode: 'cash',
        paymentModes: ['cash'],
        collaborationAttributes: {
          ...taskBasedRequiredAttrs,
          ...cashExchangeAttrs,
        },
      }),
    )

    assert.ok(after.readinessScore > before.readinessScore)
    assert.ok(after.completedStageIds.includes('valueExchange'))
  })

  it('increases score after timeline / location / skills', () => {
    const before = evaluateOpportunityWizardReadiness(
      withStages({
        title: 'Need title',
        description: 'Need description with enough detail.',
        sector: 'Construction',
        targetRole: 'Architect',
        mainCollaborationModel: 'cash_subcontracting',
        modelType: 'project_based',
        subModelType: 'task_based',
        exchangeMode: 'cash',
        paymentModes: ['cash'],
        collaborationAttributes: {
          ...taskBasedRequiredAttrs,
          ...cashExchangeAttrs,
        },
      }),
    )
    const after = evaluateOpportunityWizardReadiness(
      withStages({
        title: 'Need title',
        description: 'Need description with enough detail.',
        sector: 'Construction',
        targetRole: 'Architect',
        mainCollaborationModel: 'cash_subcontracting',
        modelType: 'project_based',
        subModelType: 'task_based',
        exchangeMode: 'cash',
        paymentModes: ['cash'],
        location: 'Riyadh',
        startDate: '2026-04-01',
        skills: 'BIM',
        collaborationAttributes: {
          ...taskBasedRequiredAttrs,
          ...cashExchangeAttrs,
        },
      }),
    )

    assert.ok(after.readinessScore > before.readinessScore)
    assert.ok(after.completedStageIds.includes('timelineLocationSkills'))
  })

  it('review completion reaches publish-ready threshold', () => {
    const result = evaluateOpportunityWizardReadiness(publishReadyDraft)

    assert.ok(result.completedStageIds.includes('review'))
    assert.equal(result.readinessScore, 100)
    assert.equal(result.publishReady, true)
    assert.ok(result.readinessScore >= result.publishThreshold)
    assert.equal(result.status, 'ready_for_matching')
  })
})

describe('opportunity wizard readiness — publish gate', () => {
  it('blocks publish below threshold', () => {
    const partial = withStages({
      title: 'Partial',
      description: 'Partial draft only',
      sector: 'Construction',
      targetRole: 'PM',
    })
    const result = evaluateOpportunityWizardReadiness(partial)

    assert.ok(result.readinessScore < OPPORTUNITY_READINESS_STATUS_THRESHOLDS.readyMin)
    assert.equal(result.publishReady, false)
    assert.equal(isOpportunityWizardPublishReady(partial), false)
  })

  it('allows publish above threshold', () => {
    assert.equal(isOpportunityWizardPublishReady(publishReadyDraft), true)
    const result = evaluateOpportunityWizardReadiness(publishReadyDraft)
    assert.ok(result.readinessScore >= OPPORTUNITY_READINESS_STATUS_THRESHOLDS.readyMin)
  })
})

describe('opportunity wizard — Match Score must not appear', () => {
  it('wizard page source does not show Match Score terminology', () => {
    assert.doesNotMatch(wizardSource, /Match Score/i)
    assert.doesNotMatch(wizardSource, /Matching Score/i)
    assert.doesNotMatch(wizardSource, /PmMatchScoreBadge/)
    assert.doesNotMatch(wizardSource, /\d+%\s*Match/)
    assert.match(wizardSource, /Opportunity Readiness/)
    assert.match(wizardSource, /evaluateOpportunityWizardReadiness/)
  })

  it('opportunity entity type does not declare matchScore', () => {
    const sample: Opportunity = {
      id: 'opp-1',
      title: 'Draft',
      status: 'draft',
    }
    assert.equal('matchScore' in sample, false)

    const opportunityTypeSource = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), '../../types/domain.ts'),
      'utf8',
    )
    const opportunityBlockStart = opportunityTypeSource.indexOf('export type Opportunity =')
    const opportunityBlockEnd = opportunityTypeSource.indexOf('export type Application =')
    const block = opportunityTypeSource.slice(opportunityBlockStart, opportunityBlockEnd)
    assert.doesNotMatch(block, /matchScore/)
  })

  it('PostMatch still declares and uses matchScore after matching', () => {
    const domainSource = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), '../../types/domain.ts'),
      'utf8',
    )
    const postMatchStart = domainSource.indexOf('export type PostMatch =')
    const postMatchEnd = domainSource.indexOf('export type Negotiation =', postMatchStart)
    const block = domainSource.slice(postMatchStart, postMatchEnd)
    assert.match(block, /matchScore:\s*number/)
  })
})
