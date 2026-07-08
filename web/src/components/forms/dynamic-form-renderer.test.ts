import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  buildDynamicForm,
  buildValidationRules,
  evaluateValidation,
  groupFields,
  resolveConditionalFields,
} from '@pm-twin/collaboration-models'
import { listVisibleDynamicFieldIds } from '@/components/forms/dynamic-form-renderer.tsx'

describe('DynamicFormRenderer helpers', () => {
  it('lists visible ids under context conditionals', () => {
    const form = buildDynamicForm('strategic_jv')
    assert.ok(form)
    const cash = listVisibleDynamicFieldIds(form, {}, { exchangeMode: 'cash' })
    assert.ok(!cash.includes('equitySplit'))
  })

  it('memo-friendly resolve + group pipeline is deterministic', () => {
    const form = buildDynamicForm('task_based')
    assert.ok(form)
    const a = groupFields(
      resolveConditionalFields(form.fields, {}).filter((f) => f.visible),
      form.groups,
    )
    const b = groupFields(
      resolveConditionalFields(form.fields, {}).filter((f) => f.visible),
      form.groups,
    )
    assert.deepEqual(
      a.map((s) => s.id),
      b.map((s) => s.id),
    )
  })

  it('ui metadata width maps full for textarea fields', () => {
    const form = buildDynamicForm('task_based')
    assert.ok(form)
    const scope = form.fields.find((field) => field.id === 'detailedScope')
    assert.ok(scope)
    assert.equal(scope.ui?.width, 'full')
  })

  it('validation display payload has field messages', () => {
    const form = buildDynamicForm('task_based')
    assert.ok(form)
    const rules = buildValidationRules(form.fields)
    const { errors } = evaluateValidation(rules, {})
    assert.ok(errors.every((error) => error.message.length > 0))
  })
})
