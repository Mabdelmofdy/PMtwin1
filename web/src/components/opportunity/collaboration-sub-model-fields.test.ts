import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  buildDynamicForm,
  buildFieldReadiness,
  buildValidationRules,
  evaluateValidation,
  getSubModel,
  groupFields,
  resolveConditionalFields,
  SUB_MODEL_TYPE_KEYS,
} from '@pm-twin/collaboration-models'
import {
  listRenderedSubModelFieldKeys,
  resolveSubModelDynamicForm,
} from '@/components/opportunity/collaboration-sub-model-fields.tsx'
import { listVisibleDynamicFieldIds } from '@/components/forms/dynamic-form-renderer.tsx'

describe('CollaborationSubModelFields dynamic form wiring', () => {
  for (const subModelType of SUB_MODEL_TYPE_KEYS) {
    it(`renders required fields for ${subModelType}`, () => {
      const sub = getSubModel(subModelType)
      assert.ok(sub)

      const form = resolveSubModelDynamicForm(subModelType)
      assert.ok(form)
      assert.equal(form.source, 'knowledge')

      const renderedKeys = listRenderedSubModelFieldKeys(subModelType)
      for (const key of sub.requiredFields) {
        assert.ok(
          renderedKeys.includes(key),
          `missing required field "${key}" for ${subModelType}`,
        )
      }
    })
  }

  it('groups fields into labeled sections from metadata', () => {
    const form = buildDynamicForm('task_based')
    assert.ok(form)
    const sections = groupFields(form.fields, form.groups)
    assert.ok(sections.length > 0)
    assert.ok(sections.every((section) => section.label.length > 0))
  })

  it('hides equitySplit when exchangeMode is cash', () => {
    const form = buildDynamicForm('project_jv')
    assert.ok(form)
    const withCash = listVisibleDynamicFieldIds(form, {}, { exchangeMode: 'cash' })
    assert.ok(!withCash.includes('equitySplit'))

    const withEquity = listVisibleDynamicFieldIds(form, {}, { exchangeMode: 'equity' })
    assert.ok(withEquity.includes('equitySplit'))
  })

  it('exposes readiness weights without scoring', () => {
    const readiness = buildFieldReadiness('task_based')
    assert.ok(readiness)
    assert.ok(Object.keys(readiness).length > 0)
    for (const weights of Object.values(readiness)) {
      assert.equal(typeof weights.requiredWeight, 'number')
      assert.equal(typeof weights.recommendedWeight, 'number')
    }
  })

  it('generates validation errors from metadata rules', () => {
    const form = buildDynamicForm('task_based')
    assert.ok(form)
    const visible = resolveConditionalFields(form.fields, {})
      .filter((field) => field.visible)
    const rules = buildValidationRules(visible)
    const result = evaluateValidation(rules, {})
    assert.equal(result.valid, false)
    assert.ok(result.errors.some((error) => error.code === 'required'))
  })

  it('keeps attribute id persistence contract', () => {
    const form = buildDynamicForm('task_based')
    assert.ok(form)
    for (const field of form.fields) {
      assert.equal(typeof field.id, 'string')
      assert.ok(field.id.length > 0)
    }
  })
})
