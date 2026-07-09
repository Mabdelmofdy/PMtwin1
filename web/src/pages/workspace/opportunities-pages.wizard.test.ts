import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'
import { deriveMatchingTopology } from '@pm-twin/collaboration-models'
import { buildOpportunityCollaborationPatch } from '@/domain/collaboration/opportunity-collaboration.ts'
import { WIZARD_STEPS } from '@/components/opportunity/wizard/wizard-steps.ts'
import {
  normalizeDeliverables,
  normalizeStructuredSkills,
  skillNames,
} from '@/domain/opportunity-creation'
import { getReadinessReasonCopy } from '@/lib/readiness-reason-copy.ts'

const wizardPath = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../components/opportunity/wizard/opportunity-wizard-page.tsx',
)
const wizardSource = readFileSync(wizardPath, 'utf8')

describe('Opportunity wizard — Enterprise Creation 2.0 steps', () => {
  it('has exactly 7 draft-first steps and no Publish step', () => {
    assert.equal(WIZARD_STEPS.length, 7)
    assert.deepEqual(
      WIZARD_STEPS.map((s) => s.id),
      [
        'type',
        'basic',
        'collaboration',
        'attributes',
        'commercial',
        'timeline',
        'review',
      ],
    )
    assert.ok(!WIZARD_STEPS.some((s) => s.id === 'publish'))
    assert.doesNotMatch(wizardSource, /stepId=["']publish["']/)
    assert.doesNotMatch(wizardSource, /Publish for matching/)
    assert.doesNotMatch(wizardSource, /handlePublish/)
  })

  it('Save Draft navigates to opportunity detail', () => {
    assert.match(wizardSource, /navigate\(`\/opportunities\/\$\{/)
    assert.match(wizardSource, /handleSaveDraft/)
    assert.match(wizardSource, /Create Draft|Save Draft/)
  })

  it('gates Continue on post type and wires Back / Continue handlers', () => {
    assert.match(wizardSource, /validateWizardStepAdvance|Choose Need or Offer/)
    assert.match(wizardSource, /handleContinue/)
    assert.match(wizardSource, /handleBack/)
  })

  it('Need vs Offer field differences are gated', () => {
    assert.match(wizardSource, /draft\.intent === 'need'/)
    assert.match(wizardSource, /draft\.intent === 'offer'/)
    assert.match(wizardSource, /Required skills|required skills|StructuredSkillsEditor/)
    assert.match(wizardSource, /showCapacity=\{draft\.intent === 'offer'\}/)
  })

  it('supports multiple tasks and structured skills editors', () => {
    assert.match(wizardSource, /WorkPackagesEditor/)
    assert.match(wizardSource, /StructuredSkillsEditor/)
  })

  it('renders commercial fields by exchange mode', () => {
    assert.match(wizardSource, /CommercialTermsStep/)
    const commercialPath = join(
      dirname(fileURLToPath(import.meta.url)),
      '../../components/opportunity/wizard/commercial-terms-step.tsx',
    )
    const commercial = readFileSync(commercialPath, 'utf8')
    assert.match(commercial, /commercial-cash-fields/)
    assert.match(commercial, /commercial-barter-fields/)
    assert.match(commercial, /commercial-equity-fields/)
    assert.match(commercial, /commercial-profit-fields/)
    assert.match(commercial, /commercial-hybrid-fields/)
    assert.match(commercial, /Commercial constraints/)
  })

  it('Marketplace Preview reuses OpportunityCard', () => {
    const preview = readFileSync(
      join(
        dirname(fileURLToPath(import.meta.url)),
        '../../components/opportunity/wizard/marketplace-preview-panel.tsx',
      ),
      'utf8',
    )
    assert.match(preview, /OpportunityCard/)
    assert.match(preview, /MUST reuse|same Marketplace Card/i)
  })

  it('does not render selectable match type options', () => {
    assert.match(wizardSource, /ValueExchangeModesPanel/)
    assert.doesNotMatch(wizardSource, /label=["']Match [Tt]ype["']/)
  })
})

describe('Opportunity wizard topology derivation cases', () => {
  it('cash subcontracting + task based + cash → one_way', () => {
    assert.equal(
      deriveMatchingTopology({
        mainCollaborationModel: 'cash_subcontracting',
        subModelType: 'task_based',
        exchangeMode: 'cash',
      }).topology,
      'one_way',
    )
  })

  it('submitted patch ignores manual preferredMatchingTopology override', () => {
    const patch = buildOpportunityCollaborationPatch({
      mainCollaborationModel: 'cash_subcontracting',
      modelType: 'project_based',
      subModelType: 'task_based',
      exchangeMode: 'cash',
      preferredMatchingTopology: 'circular',
    })
    assert.equal(patch.preferredMatchingTopology, 'one_way')
  })
})

describe('Structured skills & deliverables normalization', () => {
  it('accepts structured skills and legacy strings', () => {
    const skills = normalizeStructuredSkills([
      { name: 'BIM', level: 'expert', certificationRequired: true, mandatory: true },
      'AutoCAD',
    ])
    assert.equal(skills.length, 2)
    assert.deepEqual(skillNames(skills), ['BIM', 'AutoCAD'])
  })

  it('coerces legacy deliverable strings', () => {
    const items = normalizeDeliverables(['Drawing set', { title: 'Report', acceptanceCriteria: 'Signed', mandatory: true }])
    assert.equal(items.length, 2)
    assert.equal(items[0]!.title, 'Drawing set')
    assert.equal(items[1]!.acceptanceCriteria, 'Signed')
  })
})

describe('Readiness reason copy humanization', () => {
  it('maps READINESS_MISSING_SKILLS_INTENT to human label', () => {
    const copy = getReadinessReasonCopy('READINESS_MISSING_SKILLS_INTENT')
    assert.equal(copy.label, 'Missing required skills')
    assert.match(copy.why, /skill/i)
    assert.equal(copy.stepId, 'attributes')
  })

  it('ExplanationBlockers does not render raw reason codes as visible text', () => {
    const blockers = readFileSync(
      join(
        dirname(fileURLToPath(import.meta.url)),
        '../../components/explainability/explanation-blockers.tsx',
      ),
      'utf8',
    )
    assert.match(blockers, /getReadinessReasonCopy/)
    assert.match(blockers, /copy\.label/)
    assert.match(blockers, /data-reason-code/)
    assert.doesNotMatch(
      blockers,
      /<span className="font-medium">\{blocker\.reasonCode\}<\/span>/,
    )
  })
})
