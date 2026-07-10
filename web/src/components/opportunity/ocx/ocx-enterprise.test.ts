import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  clearOcxEvents,
  computeOcxMetrics,
  getOcxEvents,
  trackOcxEvent,
} from '@/lib/ocx-analytics.ts'
import {
  clearLocalDraftSnapshot,
  formatLastSavedAt,
  readLocalDraftSnapshot,
  saveLocalDraftSnapshot,
} from '@/lib/wizard-local-draft.ts'
import { resolveStepForValidationIssue } from '@/domain/opportunity-validation/validation-step-map.ts'
import { resolveOpportunityHealthState } from '@/components/opportunity/opportunity-health-indicator.tsx'
import { initialDraft } from '@/components/opportunity/wizard/draft-model.ts'

describe('ocx analytics', () => {
  it('emits local events without throwing and does not block', () => {
    clearOcxEvents()
    trackOcxEvent('wizard_started', { mode: 'create' })
    trackOcxEvent('draft_saved', { opportunityId: 'opp-1' })
    trackOcxEvent('published_from_detail', { opportunityId: 'opp-1' })
    const events = getOcxEvents()
    assert.ok(events.some((e) => e.name === 'wizard_started'))
    assert.ok(events.every((e) => !JSON.stringify(e).includes('VAL_')))
    const metrics = computeOcxMetrics(events)
    assert.ok(metrics.wizardStarts >= 1)
    assert.ok(metrics.draftSaves >= 1)
  })
})

describe('wizard local draft', () => {
  it('saves and recovers local snapshot', () => {
    clearLocalDraftSnapshot('create')
    saveLocalDraftSnapshot({
      savedAt: '2026-07-10T10:00:00.000Z',
      mode: 'create',
      draft: { ...initialDraft, title: 'Recover me' },
      activeStepId: 'basic',
    })
    const snap = readLocalDraftSnapshot('create')
    assert.ok(snap)
    assert.equal(snap?.draft.title, 'Recover me')
    assert.equal(formatLastSavedAt(snap?.savedAt).length > 0, true)
    clearLocalDraftSnapshot('create')
    assert.equal(readLocalDraftSnapshot('create'), null)
  })
})

describe('validation step map', () => {
  it('maps budget issues to commercial step without exposing codes in messages', () => {
    const step = resolveStepForValidationIssue({
      code: 'VAL_BUDGET_CASH_REQUIRED',
      source: 'business',
      severity: 'error',
      scope: ['publish'],
      fieldPaths: ['budget'],
      message: 'Budget is required for cash exchange.',
      layer: 'business',
      group: 'budget',
    })
    assert.equal(step, 'commercial')
  })

  it('maps skill issues to attributes', () => {
    const step = resolveStepForValidationIssue({
      code: 'VAL_SKILL_DUPLICATE',
      source: 'business',
      severity: 'error',
      scope: ['draft'],
      fieldPaths: ['structuredSkills'],
      message: 'Duplicate skills are not allowed.',
      layer: 'business',
      group: 'skills',
    })
    assert.equal(step, 'attributes')
  })

  it('maps taxonomy issues to collaboration', () => {
    const step = resolveStepForValidationIssue({
      code: 'VAL_TAXONOMY_INCOMPLETE',
      source: 'business',
      severity: 'error',
      scope: ['draft'],
      fieldPaths: ['mainCollaborationModel', 'subModelType', 'exchangeMode'],
      message: 'Select a complete collaboration model.',
      layer: 'business',
      group: 'exchange',
    })
    assert.equal(step, 'collaboration')
  })
})

describe('opportunity health states', () => {
  it('uses business states Draft / Needs Attention / Ready to Publish / Published', () => {
    assert.equal(
      resolveOpportunityHealthState({
        status: 'draft',
        errorCount: 0,
        publishReady: false,
      }),
      'Draft',
    )
    assert.equal(
      resolveOpportunityHealthState({
        status: 'draft',
        errorCount: 2,
        publishReady: false,
      }),
      'Needs Attention',
    )
    assert.equal(
      resolveOpportunityHealthState({
        status: 'draft',
        errorCount: 0,
        publishReady: true,
      }),
      'Ready to Publish',
    )
    assert.equal(
      resolveOpportunityHealthState({
        status: 'published',
        errorCount: 0,
        publishReady: true,
      }),
      'Published',
    )
  })
})
