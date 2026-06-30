import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  collectFormErrors,
  resolveFieldDescribedByIds,
  resolveFieldValidationState,
  shouldShowFieldError,
  shouldShowFieldSuccess,
} from '@/components/forms/pm-form-validation.ts'

describe('pm-form-validation', () => {
  it('resolves error state when error present', () => {
    assert.equal(resolveFieldValidationState({ error: 'Required' }), 'error')
  })

  it('resolves success state when no error', () => {
    assert.equal(resolveFieldValidationState({ success: 'Looks good' }), 'success')
  })

  it('prefers error over success', () => {
    assert.equal(
      resolveFieldValidationState({ error: 'Bad', success: 'Good' }),
      'error',
    )
  })

  it('shouldShowFieldError respects touched flag', () => {
    assert.equal(shouldShowFieldError({ error: 'x', touched: false }), false)
    assert.equal(shouldShowFieldError({ error: 'x', touched: true }), true)
  })

  it('shouldShowFieldSuccess hides when error exists', () => {
    assert.equal(shouldShowFieldSuccess({ success: 'ok', error: 'bad' }), false)
  })

  it('builds aria-describedby ids', () => {
    const ids = resolveFieldDescribedByIds({
      fieldId: 'email',
      help: true,
      error: true,
    })
    assert.match(ids!, /email-help/)
    assert.match(ids!, /email-error/)
  })

  it('collects form errors from record', () => {
    const errors = collectFormErrors({
      name: 'Required',
      email: null,
      phone: 'Invalid',
    })
    assert.deepEqual(errors, ['Required', 'Invalid'])
  })
})
