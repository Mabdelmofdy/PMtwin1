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
import { isInternalReasonCodeVisibleText } from '@/lib/readiness-reason-copy.ts'
import { mapReadinessReasonToUserMessage } from '@/presentation/readiness'

const root = dirname(fileURLToPath(import.meta.url))
const wizardPath = join(root, '../../components/opportunity/wizard/opportunity-wizard-page.tsx')
const wizardSource = readFileSync(wizardPath, 'utf8')
const createIndexPath = join(root, '../../components/opportunities/create/index.ts')
const createIndex = readFileSync(createIndexPath, 'utf8')

describe('Opportunity wizard — Creation Experience 3.0', () => {
  it('has exactly five steps and no Publish step id', () => {
    assert.equal(WIZARD_STEPS.length, 5)
    assert.deepEqual(
      WIZARD_STEPS.map((s) => s.id),
      [
        'opportunity',
        'collaboration',
        'scope_work',
        'commercial',
        'review',
      ],
    )
    assert.ok(!WIZARD_STEPS.some((s) => s.id === 'publish'))
    assert.ok(!WIZARD_STEPS.some((s) => s.id === 'type'))
    assert.ok(!WIZARD_STEPS.some((s) => s.id === 'attributes'))
    assert.ok(!WIZARD_STEPS.some((s) => s.id === 'timeline'))
  })

  it('wires five-step create components and publish action on review', () => {
    assert.match(createIndex, /OpportunityStep/)
    assert.match(createIndex, /CollaborationStep/)
    assert.match(createIndex, /ScopeWorkStep/)
    assert.match(createIndex, /CommercialStructureStep/)
    assert.match(createIndex, /ReviewPublishStep/)
    assert.match(wizardSource, /Publish Opportunity|handlePublish|onPublish/)
    assert.match(wizardSource, /WorkPackagesBuilder|ScopeWorkStep/)
    assert.match(wizardSource, /validationIssues=\{liveValidation\.issues\}/)
    assert.match(wizardSource, /errorStepIds\.includes\(stepId\)/)
    assert.doesNotMatch(wizardSource, /UserJourneyStrip/)
    assert.doesNotMatch(wizardSource, /SmartRightPanel/)
  })

  it('Save Draft navigates to opportunity detail', () => {
    assert.match(wizardSource, /navigate\(`\/opportunities\/\$\{/)
    assert.match(wizardSource, /handleSaveDraft/)
    const footer = readFileSync(
      join(root, '../../components/opportunities/create/opportunity-form-footer.tsx'),
      'utf8',
    )
    assert.match(footer, /Save Draft/)
  })

  it('unlocks navigation before post-save navigate so unsaved dialog does not flash', () => {
    assert.match(wizardSource, /unlockNavigation/)
    assert.match(wizardSource, /dirtyRef\.current/)
    assert.match(wizardSource, /allowNavigationRef\.current/)
    assert.match(wizardSource, /useBlocker/)
  })

  it('gates Continue on post type and wires Back / Continue handlers', () => {
    assert.match(wizardSource, /validateWizardStepAdvance|Choose Need or Offer/)
    assert.match(wizardSource, /handleContinue/)
    assert.match(wizardSource, /handleBackOrCancel/)
  })

  it('does not render selectable match topology options', () => {
    assert.doesNotMatch(wizardSource, /label=["']Match [Tt]ype["']/)
    assert.match(wizardSource, /CollaborationStep|deriveMatchingTopology/)
  })

  it('Marketplace Preview still reuses OpportunityCard when present', () => {
    const preview = readFileSync(
      join(root, '../../components/opportunity/wizard/marketplace-preview-panel.tsx'),
      'utf8',
    )
    assert.match(preview, /OpportunityCard/)
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

describe('Creation 3.0 readiness presentation', () => {
  it('maps readiness codes to human messages without exposing codes', () => {
    const msg = mapReadinessReasonToUserMessage(
      'READINESS_MISSING_CATEGORY_PROFESSION',
    )
    assert.equal(msg.title, 'Choose a category or profession')
    assert.ok(!isInternalReasonCodeVisibleText(msg.title))
    assert.ok(!isInternalReasonCodeVisibleText(msg.description))
    assert.equal(msg.stepId, 'opportunity')
  })

  it('getReadinessReasonCopy uses Creation 3.0 step ids', () => {
    const copy = getReadinessReasonCopy('READINESS_MISSING_SKILLS_INTENT')
    assert.equal(copy.stepId, 'scope_work')
    assert.ok(!isInternalReasonCodeVisibleText(copy.label))
  })
})

describe('Creation domain normalizers', () => {
  it('normalizes structured skills and deliverables with ids', () => {
    const skills = normalizeStructuredSkills(['Steel fixing', { name: 'BIM' }])
    assert.deepEqual(skillNames(skills), ['Steel fixing', 'BIM'])
    const deliverables = normalizeDeliverables(['As-built drawings'])
    assert.equal(deliverables[0]?.title, 'As-built drawings')
    assert.ok(deliverables[0]?.id)
  })
})
