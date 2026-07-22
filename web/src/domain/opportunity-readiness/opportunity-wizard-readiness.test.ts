import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'
import {
  buildOpportunityWizardReadinessInput,
  EMPTY_OPPORTUNITY_WIZARD_DRAFT,
  evaluateOpportunityWizardReadiness,
  isOpportunityWizardPublishReady,
  type OpportunityWizardDraft,
} from '@/domain/opportunity-readiness/opportunity-wizard-readiness.ts'
import { evaluateOpportunityReadiness } from '@/domain/opportunity-readiness/opportunity-readiness-evaluator.ts'
import {
  OPPORTUNITY_READINESS_SCORE_WEIGHTS,
  OPPORTUNITY_READINESS_STATUS_THRESHOLDS,
} from '@/domain/opportunity-readiness/opportunity-readiness-rules.ts'
import { evaluatePublishReadiness } from '@/domain/publish-readiness/publish-readiness-gate.ts'
import type { Opportunity } from '@/types/domain.ts'

const sourcePath = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../components/opportunity/wizard/opportunity-wizard-page.tsx',
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

/** Required fields complete (publish-eligible at 80) — recommended still missing. */
const requiredCompleteDraft: OpportunityWizardDraft = withStages({
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

/** Full 100% — all required + recommended wizard inputs. */
const fullReadinessDraft: OpportunityWizardDraft = withStages({
  ...requiredCompleteDraft,
  preferredPartnerType: 'company',
  attachmentsText: 'design-brief.pdf',
  complianceRequirementsText: 'Saudi Building Code',
  deliveryMilestonesText: 'Concept design',
})

const readyProfile = {
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

describe('opportunity wizard readiness — initial draft', () => {
  it('new opportunity draft starts with readinessScore 0', () => {
    const result = evaluateOpportunityWizardReadiness(EMPTY_OPPORTUNITY_WIZARD_DRAFT)

    assert.equal(result.readinessScore, 0)
    assert.equal(result.completionScore, 0)
    assert.equal(result.score, 0)
    assert.equal(result.status, 'incomplete')
    assert.equal(result.publishReady, false)
    assert.equal(result.missingRequired.length, 10)
  })

  it('does not initialize readiness to a high demo value from intent alone', () => {
    const result = evaluateOpportunityWizardReadiness(
      withStages({ intent: 'need' }),
    )
    assert.ok(result.readinessScore < 20)
    assert.equal(result.publishReady, false)
  })
})

describe('opportunity readiness stabilization — single score source', () => {
  it('displayed readiness equals publish gate readiness', () => {
    const wizard = evaluateOpportunityWizardReadiness(requiredCompleteDraft)
    const field = evaluateOpportunityReadiness(
      buildOpportunityWizardReadinessInput(requiredCompleteDraft),
    )
    const gate = evaluatePublishReadiness({
      profile: readyProfile,
      profileKind: 'individual',
      opportunity: buildOpportunityWizardReadinessInput(requiredCompleteDraft),
    })

    assert.equal(wizard.readinessScore, field.score)
    assert.equal(wizard.score, field.score)
    assert.equal(wizard.status, field.status)
    assert.equal(wizard.fieldReadiness.score, field.score)
    assert.equal(gate.opportunityReadiness.score, wizard.readinessScore)
    assert.equal(gate.opportunityReadiness.status, wizard.status)
    assert.equal(gate.allowed, wizard.publishReady)
  })

  it('blocked publish shows missing required and recommended items', () => {
    const sparse = withStages({
      title: 'Partial',
      description: 'Partial draft',
      sector: 'Construction',
    })
    const gate = evaluatePublishReadiness({
      profile: readyProfile,
      profileKind: 'individual',
      opportunity: buildOpportunityWizardReadinessInput(sparse),
    })

    assert.equal(gate.allowed, false)
    assert.ok(gate.missingOpportunityRequired.length > 0)
    assert.ok(gate.missingOpportunityRecommended.length > 0)

    const details = gate.reason
      ? [
          gate.reason,
          'Opportunity required:',
          ...gate.missingOpportunityRequired.map((item) => `- ${item}`),
          'Opportunity recommended:',
          ...gate.missingOpportunityRecommended.map((item) => `- ${item}`),
        ]
      : []

    assert.ok(details.some((line) => line === 'Opportunity required:'))
    assert.ok(details.some((line) => line.startsWith('- ')))
  })

  it('user can reach 100% readiness from wizard inputs', () => {
    const result = evaluateOpportunityWizardReadiness(fullReadinessDraft)

    assert.equal(result.readinessScore, 100)
    assert.equal(result.status, 'ready_for_matching')
    assert.equal(result.publishReady, true)
    assert.deepEqual(result.missingRequired, [])
    assert.deepEqual(result.missingRecommended, [])
  })

  it('Creation 3.0 milestones + cash commercial structure reach 100%', () => {
    const result = evaluateOpportunityWizardReadiness(
      withStages({
        ...requiredCompleteDraft,
        preferredPartnerType: 'Company',
        attachmentsText: 'design-brief.pdf',
        complianceRequirementsText: 'Saudi Building Code',
        deliveryMilestonesText: '',
        milestones: [{ title: 'Concept design' }],
        commercialStructure: {
          components: [
            {
              type: 'cash',
              enabled: true,
              notes: 'Budget range 150000 – 400000 SAR',
              paymentTerms: 'Milestone-Based',
              paymentSchedule: [{ title: 'Kickoff', percentage: 20 }],
            },
          ],
        },
      }),
    )

    assert.equal(result.readinessScore, 100)
    assert.deepEqual(result.missingRecommended, [])
  })

  it('recommended fields improve score but required fields control publish eligibility', () => {
    const requiredOnly = evaluateOpportunityWizardReadiness(requiredCompleteDraft)
    assert.equal(requiredOnly.missingRequired.length, 0)
    assert.ok(requiredOnly.missingRecommended.length > 0)
    assert.ok(requiredOnly.readinessScore >= OPPORTUNITY_READINESS_SCORE_WEIGHTS.required)
    assert.ok(requiredOnly.readinessScore < 100)
    assert.ok(requiredOnly.readinessScore >= OPPORTUNITY_READINESS_STATUS_THRESHOLDS.readyMin)
    assert.equal(requiredOnly.publishReady, true)
    assert.equal(isOpportunityWizardPublishReady(requiredCompleteDraft), true)

    const withRecommended = evaluateOpportunityWizardReadiness(fullReadinessDraft)
    assert.ok(withRecommended.readinessScore > requiredOnly.readinessScore)
    assert.equal(withRecommended.readinessScore, 100)

    const missingRequired = evaluateOpportunityWizardReadiness(
      withStages({
        title: 'Need title',
        description: 'Need description',
        sector: 'Construction',
        targetRole: 'Architect',
        // missing skills/services/location/timeline/collaboration
      }),
    )
    assert.ok(missingRequired.missingRequired.length > 0)
    assert.equal(missingRequired.publishReady, false)
  })
})

describe('opportunity wizard readiness — progressive field completion', () => {
  it('increases score after basic info', () => {
    const before = evaluateOpportunityWizardReadiness(EMPTY_OPPORTUNITY_WIZARD_DRAFT)
    const after = evaluateOpportunityWizardReadiness(
      withStages({
        title: 'Need title',
        description: 'Need description with enough detail.',
        sector: 'Construction',
        targetRole: 'Architect',
      }),
    )

    assert.ok(after.readinessScore > before.readinessScore)
    assert.ok(after.completedStageIds.includes('basicInfo'))
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

    assert.ok(after.readinessScore >= before.readinessScore)
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

    assert.ok(after.readinessScore >= before.readinessScore)
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

    assert.ok(after.readinessScore >= before.readinessScore)
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
    assert.ok(after.presentRecommended.includes('Budget / Value Terms'))
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
        services: 'Coordination',
        collaborationAttributes: {
          ...taskBasedRequiredAttrs,
          ...cashExchangeAttrs,
        },
      }),
    )

    assert.ok(after.readinessScore > before.readinessScore)
    assert.ok(after.completedStageIds.includes('timelineLocationSkills'))
    assert.equal(after.publishReady, true)
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

    assert.equal(result.publishReady, false)
    assert.equal(isOpportunityWizardPublishReady(partial), false)
  })

  it('allows publish when required fields are complete', () => {
    assert.equal(isOpportunityWizardPublishReady(requiredCompleteDraft), true)
    const result = evaluateOpportunityWizardReadiness(requiredCompleteDraft)
    assert.ok(result.readinessScore >= OPPORTUNITY_READINESS_STATUS_THRESHOLDS.readyMin)
  })
})

describe('opportunity wizard — Match Score must not appear', () => {
  it('wizard page source does not show Match Score terminology', () => {
    assert.doesNotMatch(wizardSource, /Match Score/i)
    assert.doesNotMatch(wizardSource, /Matching Score/i)
    assert.doesNotMatch(wizardSource, /PmMatchScoreBadge/)
    assert.doesNotMatch(wizardSource, /\d+%\s*Match/)
    assert.match(wizardSource, /ReadinessSummaryCard|evaluateOpportunityWizardReadiness/)
    assert.match(wizardSource, /evaluateOpportunityWizardReadiness/)
    const readinessCard = readFileSync(
      join(
        dirname(fileURLToPath(import.meta.url)),
        '../../components/opportunities/create/readiness-summary-card.tsx',
      ),
      'utf8',
    )
    assert.match(readinessCard, /Opportunity Readiness/)
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
