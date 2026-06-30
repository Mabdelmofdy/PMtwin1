import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  isFormInteractive,
  resolveActiveStepIndex,
  resolveFormMode,
  resolveWizardProgress,
  resolveWizardStepStatus,
} from '@/components/forms/pm-form-state.ts'

const steps = [
  { id: 'type', label: 'Type' },
  { id: 'scope', label: 'Scope' },
  { id: 'review', label: 'Review', optional: true },
] as const

describe('pm-form-state', () => {
  it('resolves form mode from flags', () => {
    assert.equal(resolveFormMode({ readOnly: true }), 'readonly')
    assert.equal(resolveFormMode({ disabled: true }), 'disabled')
    assert.equal(resolveFormMode({}), 'edit')
  })

  it('isFormInteractive respects loading and readonly', () => {
    assert.equal(isFormInteractive({ loading: true }), false)
    assert.equal(isFormInteractive({ readOnly: true }), false)
    assert.equal(isFormInteractive({}), true)
  })

  it('resolves active wizard step status', () => {
    assert.equal(
      resolveWizardStepStatus({
        stepId: 'scope',
        activeStepId: 'scope',
        step: steps[1],
      }),
      'active',
    )
  })

  it('resolves completed step status', () => {
    assert.equal(
      resolveWizardStepStatus({
        stepId: 'type',
        activeStepId: 'scope',
        completedStepIds: ['type'],
        step: steps[0],
      }),
      'completed',
    )
  })

  it('resolves error step status over active', () => {
    assert.equal(
      resolveWizardStepStatus({
        stepId: 'scope',
        activeStepId: 'scope',
        errorStepIds: ['scope'],
        step: steps[1],
      }),
      'error',
    )
  })

  it('calculates wizard progress from required steps', () => {
    assert.equal(resolveWizardProgress(steps, ['type']), 50)
    assert.equal(resolveWizardProgress(steps, ['type', 'scope']), 100)
  })

  it('resolves active step index', () => {
    assert.equal(resolveActiveStepIndex(steps, 'scope'), 1)
    assert.equal(resolveActiveStepIndex(steps, 'missing'), -1)
  })
})
